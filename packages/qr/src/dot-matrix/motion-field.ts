import {
  AnimationPreset,
  type QRCodeAnimationSettings,
} from "./animations"
import {
  isMixableHexColor,
  mixHexColors,
  smoothBlendProgress,
} from "./color-mix"

const SVG_NS = "http://www.w3.org/2000/svg"
const MOTION_FIELD_LAYER = "motion-field"
const MOTION_FIELD_CLIP_ID = "qrafty-motion-field-clip"
const MOTION_FIELD_GRADIENT_ID = "qrafty-motion-field-gradient"
const MOTION_CYCLE_MS = 1800
const PAINTABLE_SELECTOR = "path,circle,rect,polygon,ellipse"
/** Presets that expand from center — use a continuous field instead of per-module fill. */
const MOTION_FIELD_PRESETS = new Set<string>([AnimationPreset.RadialExpand])

export type MotionFieldHandle = {
  stop: () => void
  clipModules: SVGElement[]
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function easeInOut(phase: number) {
  return phase < 0.5 ? 2 * phase * phase : 1 - Math.pow(-2 * phase + 2, 2) / 2
}

function animationSpeed(settings?: QRCodeAnimationSettings) {
  const speed = Number(settings?.animationSpeed)
  return speed > 0 && Number.isFinite(speed) ? speed : 1
}

function resolveFieldColors(settings?: QRCodeAnimationSettings) {
  const base = settings?.dotMatrixColorBase ?? "#000000"
  const peak = settings?.dotMatrixColorPeak ?? base
  const opacityBase = clamp01(Number(settings?.dotMatrixOpacityBase ?? 1))
  const opacityPeak = clamp01(Number(settings?.dotMatrixOpacityPeak ?? 1))
  return { base, peak, opacityBase, opacityPeak }
}

function ringContribution(
  radius: number,
  front: number,
  width: number,
  strength: number,
) {
  const distance = Math.abs(radius - front)
  if (distance > width) {
    return 0
  }

  const falloff = 1 - smoothBlendProgress(distance / width)
  return strength * falloff
}

/** Accent mix 0–1 at normalized radius for dual echo wave. */
export function sampleEchoFieldMix(normalizedRadius: number, cyclePhase: number) {
  const phase = easeInOut(clamp01(cyclePhase))
  const front = phase * 1.12
  const width = 0.16
  const primary = ringContribution(normalizedRadius, front, width, 1)
  const echo = ringContribution(normalizedRadius, front - 0.24, width * 1.12, 0.58)
  return smoothBlendProgress(clamp01(Math.max(primary, echo)))
}

function getPaintTargets(element: SVGElement) {
  return element.matches(PAINTABLE_SELECTOR)
    ? [element]
    : Array.from(element.querySelectorAll<SVGElement>(PAINTABLE_SELECTOR))
}

function readFill(element: SVGElement) {
  const attrFill = element.getAttribute("fill")
  if (attrFill && attrFill !== "none") {
    return attrFill
  }

  return element.style.getPropertyValue("fill") || ""
}

function restoreFill(element: SVGElement, fill: string) {
  element.style.removeProperty("fill")
  element.style.removeProperty("opacity")
  if (fill) {
    element.setAttribute("fill", fill)
    return
  }

  element.removeAttribute("fill")
}

function hideModuleFill(element: SVGElement) {
  for (const target of getPaintTargets(element)) {
    target.style.setProperty("fill", "none")
  }
}

function cloneIntoClipPath(source: SVGElement, clipPath: SVGElement) {
  const clone = source.cloneNode(true) as SVGElement
  const elements = [clone, ...Array.from(clone.querySelectorAll<SVGElement>("*"))]

  for (const element of elements) {
    element.removeAttribute("id")
    element.removeAttribute("style")
    if (element.matches(PAINTABLE_SELECTOR)) {
      element.setAttribute("fill", "#ffffff")
    }
  }

  clipPath.appendChild(clone)
}

function getSvgRoot(container: ParentNode) {
  const svg = container.querySelector("svg")
  return svg instanceof SVGSVGElement ? svg : null
}

function collectModules(root: ParentNode) {
  return Array.from(root.querySelectorAll(".module")).filter(
    (element): element is SVGElement => element instanceof SVGElement,
  )
}

function readTargetBounds(target: SVGElement) {
  const graphics = target as SVGGraphicsElement
  if (typeof graphics.getBBox === "function") {
    try {
      const box = graphics.getBBox()
      if (Number.isFinite(box.width) && Number.isFinite(box.height)) {
        return box
      }
    } catch {
      // jsdom and some detached nodes lack getBBox — fall through to attributes.
    }
  }

  const x = Number.parseFloat(target.getAttribute("x") ?? "0")
  const y = Number.parseFloat(target.getAttribute("y") ?? "0")
  const width = Number.parseFloat(
    target.getAttribute("width") ?? target.getAttribute("r") ?? "0",
  )
  const height = Number.parseFloat(
    target.getAttribute("height") ?? target.getAttribute("r") ?? String(width),
  )

  return {
    height: Number.isFinite(height) ? height : 0,
    width: Number.isFinite(width) ? width : 0,
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
  }
}

function getModuleBounds(svg: SVGSVGElement, modules: SVGElement[]) {
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  for (const moduleElement of modules) {
    for (const target of getPaintTargets(moduleElement)) {
      const box = readTargetBounds(target)
      if (box.width <= 0 || box.height <= 0) {
        continue
      }
      minX = Math.min(minX, box.x)
      minY = Math.min(minY, box.y)
      maxX = Math.max(maxX, box.x + box.width)
      maxY = Math.max(maxY, box.y + box.height)
    }
  }

  if (!Number.isFinite(minX)) {
    const values = (svg.getAttribute("viewBox") ?? "")
      .trim()
      .split(/[\s,]+/)
      .map(Number.parseFloat)
    if (
      values.length === 4 &&
      values.every(Number.isFinite) &&
      values[2] > 0 &&
      values[3] > 0
    ) {
      const [x, y, width, height] = values
      return {
        centerX: x + width / 2,
        centerY: y + height / 2,
        height,
        minX: x,
        minY: y,
        radius: Math.hypot(width, height) / 2,
        width,
      }
    }

    return null
  }

  const width = Math.max(1, maxX - minX)
  const height = Math.max(1, maxY - minY)
  const centerX = minX + width / 2
  const centerY = minY + height / 2
  const radius = Math.hypot(width, height) / 2

  return { centerX, centerY, height, minX, minY, radius, width }
}

function updateGradientStops(
  gradient: SVGRadialGradientElement,
  cyclePhase: number,
  baseRadius: number,
  settings?: QRCodeAnimationSettings,
) {
  const { base, peak, opacityBase, opacityPeak } = resolveFieldColors(settings)
  const stopCount = 24

  // Breathing radius: the field pushes outward as the front travels, then eases back.
  gradient.setAttribute(
    "r",
    String(baseRadius * (1 + 0.04 * Math.sin(cyclePhase * Math.PI))),
  )

  while (gradient.firstChild) {
    gradient.removeChild(gradient.firstChild)
  }

  for (let index = 0; index <= stopCount; index += 1) {
    const normalizedRadius = index / stopCount
    const mix = sampleEchoFieldMix(normalizedRadius, cyclePhase)
    const stop = gradient.ownerDocument!.createElementNS(SVG_NS, "stop")
    const color = isMixableHexColor(base) && isMixableHexColor(peak)
      ? mixHexColors(base, peak, mix)
      : mix >= 0.5
        ? peak
        : base
    const opacity = opacityBase + (opacityPeak - opacityBase) * mix

    stop.setAttribute("offset", `${normalizedRadius * 100}%`)
    stop.setAttribute("stop-color", color)
    stop.setAttribute("stop-opacity", String(opacity))
    gradient.appendChild(stop)
  }
}

export function shouldUseMotionFieldLayer(
  preset: string,
  settings?: QRCodeAnimationSettings,
) {
  if (settings?.preserveModuleFills) {
    return false
  }

  return MOTION_FIELD_PRESETS.has(preset)
}

type MotionFieldMount = {
  destroy: () => void
  update: (globalTimeMs: number) => void
  /** Clip-path clones of module shapes — transform targets for module motion. */
  clipModules: SVGElement[]
}

function mountMotionField(
  root: ParentNode,
  settings: QRCodeAnimationSettings = {},
): MotionFieldMount | undefined {
  const svg = getSvgRoot(root)
  const modules = collectModules(root)

  if (!svg || modules.length === 0) {
    return undefined
  }

  const bounds = getModuleBounds(svg, modules)
  if (!bounds) {
    return undefined
  }

  const document = svg.ownerDocument
  if (!document) {
    return undefined
  }

  const originalFills = new Map<SVGElement, string>()
  for (const moduleElement of modules) {
    for (const target of getPaintTargets(moduleElement)) {
      originalFills.set(target, readFill(target))
      hideModuleFill(moduleElement)
    }
  }

  let defs = svg.querySelector("defs")
  if (!defs) {
    defs = document.createElementNS(SVG_NS, "defs")
    svg.insertBefore(defs, svg.firstChild)
  }

  const clipPath = document.createElementNS(SVG_NS, "clipPath")
  clipPath.setAttribute("id", MOTION_FIELD_CLIP_ID)
  clipPath.setAttribute("clipPathUnits", "userSpaceOnUse")

  for (const moduleElement of modules) {
    cloneIntoClipPath(moduleElement, clipPath)
  }
  const clipModules = Array.from(clipPath.children).filter(
    (child): child is SVGElement => child instanceof SVGElement,
  )

  defs.appendChild(clipPath)

  const gradient = document.createElementNS(SVG_NS, "radialGradient")
  gradient.setAttribute("id", MOTION_FIELD_GRADIENT_ID)
  gradient.setAttribute("gradientUnits", "userSpaceOnUse")
  gradient.setAttribute("cx", String(bounds.centerX))
  gradient.setAttribute("cy", String(bounds.centerY))
  gradient.setAttribute("r", String(bounds.radius))
  defs.appendChild(gradient)

  const layer = document.createElementNS(SVG_NS, "g")
  layer.setAttribute("data-qr-layer", MOTION_FIELD_LAYER)

  const fieldRect = document.createElementNS(SVG_NS, "rect")
  fieldRect.setAttribute("x", String(bounds.minX))
  fieldRect.setAttribute("y", String(bounds.minY))
  fieldRect.setAttribute("width", String(bounds.width))
  fieldRect.setAttribute("height", String(bounds.height))
  fieldRect.setAttribute("fill", `url(#${MOTION_FIELD_GRADIENT_ID})`)
  fieldRect.setAttribute("clip-path", `url(#${MOTION_FIELD_CLIP_ID})`)
  fieldRect.setAttribute("pointer-events", "none")
  layer.appendChild(fieldRect)

  const moduleAnchor = modules[0]?.parentNode
  if (moduleAnchor) {
    moduleAnchor.insertBefore(layer, modules[0] ?? null)
  } else {
    svg.insertBefore(layer, svg.firstChild)
  }

  const cycleMs = MOTION_CYCLE_MS / animationSpeed(settings)

  return {
    clipModules,
    update: (globalTimeMs: number) => {
      const cyclePhase = (globalTimeMs / cycleMs) % 1
      updateGradientStops(gradient, cyclePhase, bounds.radius, settings)
    },
    destroy: () => {
      layer.remove()
      clipPath.remove()
      gradient.remove()

      for (const [target, fill] of originalFills) {
        restoreFill(target, fill)
      }
    },
  }
}

export function seekMotionFieldAnimation(
  root: ParentNode,
  preset: string,
  globalTimeMs: number,
  settings: QRCodeAnimationSettings = {},
) {
  void preset

  const mount = mountMotionField(root, settings)
  if (!mount) {
    return undefined
  }

  mount.update(globalTimeMs)
  return mount
}

export function runMotionFieldAnimation(
  root: ParentNode,
  preset: string,
  settings: QRCodeAnimationSettings = {},
): MotionFieldHandle | undefined {
  void preset

  const mount = mountMotionField(root, settings)
  if (!mount) {
    return undefined
  }

  let frameId: number | undefined
  let stopped = false
  const startMs =
    typeof performance !== "undefined" ? performance.now() : Date.now()

  const tick = () => {
    if (stopped) {
      return
    }

    const now = typeof performance !== "undefined" ? performance.now() : Date.now()
    mount.update(now - startMs)
    frameId = requestAnimationFrame(tick)
  }

  mount.update(0)
  frameId = requestAnimationFrame(tick)

  return {
    clipModules: mount.clipModules,
    stop: () => {
      stopped = true
      if (frameId !== undefined) {
        cancelAnimationFrame(frameId)
        frameId = undefined
      }

      mount.destroy()
    },
  }
}
