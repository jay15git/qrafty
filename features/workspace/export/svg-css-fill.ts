import { formatColor } from "@/components/ui/fill-picker/lib/color"
import { sampleStopsAt } from "@/components/ui/fill-picker/lib/gradient"
import {
  parseFill,
  type Gradient,
  type GradientStop,
} from "@/components/ui/fill-picker-base/public-api"

/** CSS 0deg = up. SVG default linearGradient is left→right (= CSS 90deg). */
const CSS_TO_SVG_LINEAR_OFFSET_DEG = 90
/** CSS conic 0deg = up. Canvas createConicGradient 0rad = right. */
const CSS_TO_CANVAS_CONIC_OFFSET_DEG = 90
const CONIC_SAMPLE_STOPS = 64

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function stopMarkup(stop: GradientStop) {
  const color = formatColor(stop.color, "hex")
  const offset = `${Math.round(stop.position * 1000) / 10}%`
  return `<stop offset="${offset}" stop-color="${escapeXml(color)}"/>`
}

function gradientStopsMarkup(gradient: Gradient) {
  return [...gradient.stops]
    .sort((a, b) => a.position - b.position)
    .map(stopMarkup)
    .join("")
}

function spreadMethod(gradient: Gradient) {
  return gradient.repeating ? "repeat" : "pad"
}

function firstStopHex(gradient: Gradient) {
  const first = [...gradient.stops].sort((a, b) => a.position - b.position)[0]
  return first ? formatColor(first.color, "hex") : "#ffffff"
}

function linearGradientMarkup(gradient: Extract<Gradient, { type: "linear" }>, id: string) {
  const stops = gradientStopsMarkup(gradient)

  if (gradient.start && gradient.end) {
    return `<linearGradient id="${id}" gradientUnits="objectBoundingBox" spreadMethod="${spreadMethod(gradient)}" x1="${gradient.start.x}" y1="${gradient.start.y}" x2="${gradient.end.x}" y2="${gradient.end.y}">${stops}</linearGradient>`
  }

  const angle = gradient.angle - CSS_TO_SVG_LINEAR_OFFSET_DEG
  return `<linearGradient id="${id}" gradientUnits="objectBoundingBox" spreadMethod="${spreadMethod(gradient)}" gradientTransform="rotate(${angle} 0.5 0.5)">${stops}</linearGradient>`
}

function radialGradientMarkup(gradient: Extract<Gradient, { type: "radial" }>, id: string) {
  const stops = gradientStopsMarkup(gradient)
  const cx = gradient.center.x
  const cy = gradient.center.y
  const radius = gradient.radii
    ? Math.max(gradient.radii.x, gradient.radii.y)
    : 0.5

  return `<radialGradient id="${id}" gradientUnits="objectBoundingBox" spreadMethod="${spreadMethod(gradient)}" cx="${cx}" cy="${cy}" r="${radius}">${stops}</radialGradient>`
}

function expandRepeatingStops(stops: GradientStop[]) {
  const sorted = [...stops].sort((a, b) => a.position - b.position)

  if (sorted.length === 0) {
    return sorted
  }

  const start = sorted[0].position
  const end = sorted[sorted.length - 1].position
  const span = Math.max(end - start, 0.0001)
  const expanded: GradientStop[] = []

  for (let cycle = 0; cycle * span <= 1 + span; cycle += 1) {
    for (const stop of sorted) {
      const position = cycle * span + (stop.position - start)
      if (position <= 1) {
        expanded.push({ ...stop, position })
      }
    }
  }

  if ((expanded[expanded.length - 1]?.position ?? 1) < 1) {
    expanded.push({ ...sorted[0], position: 1 })
  }

  return expanded
}

export function isConicCssFill(fillCss: string) {
  const parsed = parseFill(fillCss)
  return parsed?.kind === "gradient" && parsed.gradient.type === "conic"
}

export function paintConicCssFill(
  context: CanvasRenderingContext2D,
  fillCss: string,
  width: number,
  height: number,
) {
  const parsed = parseFill(fillCss)

  if (!parsed || parsed.kind !== "gradient" || parsed.gradient.type !== "conic") {
    throw new Error("Expected a conic gradient fill.")
  }

  if (typeof context.createConicGradient !== "function") {
    throw new Error("This browser cannot export conic gradients.")
  }

  const gradient = parsed.gradient
  const startAngle =
    ((gradient.startAngle - CSS_TO_CANVAS_CONIC_OFFSET_DEG) * Math.PI) / 180
  const paint = context.createConicGradient(
    startAngle,
    gradient.center.x * width,
    gradient.center.y * height,
  )
  const stops = gradient.repeating
    ? expandRepeatingStops(gradient.stops)
    : [...gradient.stops].sort((a, b) => a.position - b.position)

  let lastOffset = -1
  for (let index = 0; index < CONIC_SAMPLE_STOPS; index += 1) {
    const offset = index / (CONIC_SAMPLE_STOPS - 1)
    if (offset <= lastOffset) {
      continue
    }

    lastOffset = offset
    paint.addColorStop(offset, formatColor(sampleStopsAt(stops, offset), "hex"))
  }

  context.fillStyle = paint
  context.fillRect(0, 0, width, height)
}

export function rasterizeConicCssFillToDataUrl(
  fillCss: string,
  width: number,
  height: number,
) {
  if (typeof document === "undefined") {
    return undefined
  }

  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(width))
  canvas.height = Math.max(1, Math.round(height))
  const context = canvas.getContext("2d")

  if (!context) {
    return undefined
  }

  paintConicCssFill(context, fillCss, canvas.width, canvas.height)
  return canvas.toDataURL("image/png")
}

export function cssFillToSvgPaint(fillCss: string, gradientId: string) {
  const parsed = parseFill(fillCss)

  if (!parsed || parsed.kind === "color") {
    return { def: "", fill: fillCss }
  }

  if (parsed.gradient.type === "conic") {
    return { def: "", fill: firstStopHex(parsed.gradient) }
  }

  const def =
    parsed.gradient.type === "linear"
      ? linearGradientMarkup(parsed.gradient, gradientId)
      : radialGradientMarkup(parsed.gradient, gradientId)

  return {
    def,
    fill: `url(#${gradientId})`,
  }
}

export function cssFillToCanvasColor(fillCss: string, fallback = "#ffffff") {
  const parsed = parseFill(fillCss)

  if (!parsed) {
    return fallback
  }

  if (parsed.kind === "color") {
    return formatColor(parsed.color, "hex")
  }

  return firstStopHex(parsed.gradient)
}
