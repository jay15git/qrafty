import type { QraftyState } from "@/features/qr/model/state"
import {
  SVG_NS,
  appendSvgClass,
  splitSvgPathData,
  isSvgElementLike,
  formatSvgNumber,
  getOrCreateSvgDefs,
} from "./svg-dom-utils"
import {
  getSvgShapeBounds,
} from "./svg-shape-bounds"
import {
  removeDotMatrixBaseLayers,
  removeOrphanedModuleClipPaths,
  type DotClipLayer,
  type DotPathLayer,
  getQrModuleClipLayers,
  getQrModulePathLayers,
  collectDotMatrixMetrics,
  getFallbackDotMatrixMetrics,
  resolveDotMatrixCoordinates,
} from "./dot-matrix-model"
import {
  applyDirectPalettePaint,
  getActiveDotsPalette,
} from "./dot-matrix-palette"

export function annotateCanvasSvgForDotMatrixMotion(
  svg: SVGElement,
  state?: Pick<QraftyState, "dotsColorMode" | "data" | "dotsPalette">,
): number | null {
  materializeDataModulePaths(svg, state)
  const dotShapes = collectCanvasDotModuleShapes(svg)

  if (dotShapes.length === 0) {
    return null
  }

  const metrics = collectDotMatrixMetrics(dotShapes) ?? getFallbackDotMatrixMetrics(dotShapes)
  const moduleGroups = new Map<string, SVGElement[]>()

  for (const shape of dotShapes) {
    const coordinates = resolveDotMatrixCoordinates(shape, metrics)

    if (!coordinates) {
      continue
    }

    const key = `${coordinates.row}:${coordinates.col}`
    const shapes = moduleGroups.get(key) ?? []
    shapes.push(shape)
    moduleGroups.set(key, shapes)
  }

  let annotatedCount = 0

  for (const [key, shapes] of moduleGroups) {
    const [row, col] = key.split(":").map(Number)

    if (shapes.length === 1) {
      const shape = shapes[0]!
      appendSvgClass(shape, "module")
      shape.setAttribute("data-column", String(col))
      shape.setAttribute("data-row", String(row))
      annotatedCount += 1
      continue
    }

    const document = svg.ownerDocument
    const parent = shapes[0]?.parentNode

    if (!document || !parent) {
      continue
    }

    const group = document.createElementNS(SVG_NS, "g")
    group.setAttribute("class", "module")
    group.setAttribute("data-column", String(col))
    group.setAttribute("data-row", String(row))
    parent.insertBefore(group, shapes[0]!)

    for (const shape of shapes) {
      group.appendChild(shape)
    }

    annotatedCount += 1
  }

  if (annotatedCount === 0) {
    return null
  }

  annotateFinderPatternsForDotMatrix(svg)

  return annotatedCount
}

export function materializeDataModulePaths(
  svg: SVGElement,
  state?: Pick<QraftyState, "dotsColorMode" | "data" | "dotsPalette">,
) {
  if (svg.querySelector('[data-qr-layer="dot-matrix-motion-modules"]')) {
    return
  }

  if (svg.querySelector('[data-qr-layer="dot-palette"]')) {
    expandMergedPaletteFillPaths(svg)
    return
  }

  const clipLayers = getQrModuleClipLayers(svg)
  const pathLayers = getQrModulePathLayers(svg)
  const unifiedImage = svg.querySelector('[data-qr-layer="unified-image-definition"]')

  if (unifiedImage && isSvgElementLike(unifiedImage) && unifiedImage.tagName.toLowerCase() === "image") {
    materializeUnifiedImageMotionModules(svg, unifiedImage, clipLayers, pathLayers)
    return
  }

  if (state?.dotsColorMode === "palette" && getActiveDotsPalette(state).length > 0) {
    const allDotShapes = [
      ...clipLayers.flatMap((layer) => layer.shapes),
      ...pathLayers.flatMap((layer) => layer.shapes),
    ]

    if (
      applyDirectPalettePaint(svg, state, allDotShapes, clipLayers, pathLayers, {
        groupLayer: "dot-matrix-motion-modules",
      })
    ) {
      return
    }
  }

  const usesOverlayColorMode = state?.dotsColorMode === "gradient"

  for (const layer of pathLayers) {
    if (layer.shapes.length === 0) {
      continue
    }

    const document = svg.ownerDocument

    if (!document) {
      continue
    }

    const group = document.createElementNS(SVG_NS, "g")
    group.setAttribute("data-qr-layer", "dot-matrix-motion-modules")

    for (const segmentShape of layer.shapes) {
      const path = document.createElementNS(SVG_NS, "path")
      path.setAttribute("d", segmentShape.getAttribute("d") ?? "")
      path.setAttribute(
        "fill",
        resolveMotionModuleFill(segmentShape, layer.fill, state),
      )
      group.appendChild(path)
    }

    layer.element.replaceWith(group)
  }

  if (usesOverlayColorMode) {
    suppressGradientPaletteOverlayLayers(svg)
  }
}

export function expandMergedPaletteFillPaths(svg: SVGElement) {
  const document = svg.ownerDocument

  if (!document) {
    return
  }

  for (const colorGroup of svg.querySelectorAll('[data-qr-layer="dot-palette-fill"]')) {
    for (const child of Array.from(colorGroup.children)) {
      if (!isSvgElementLike(child) || child.tagName.toLowerCase() !== "path") {
        continue
      }

      const segments = splitSvgPathData(child.getAttribute("d"))

      if (segments.length <= 1) {
        continue
      }

      const fill = child.getAttribute("fill") ?? colorGroup.getAttribute("fill") ?? "currentColor"
      const paletteIndex = child.getAttribute("data-qr-palette-index")

      for (const segment of segments) {
        const path = document.createElementNS(SVG_NS, "path")
        path.setAttribute("d", segment)
        path.setAttribute("fill", fill)
        if (paletteIndex) {
          path.setAttribute("data-qr-palette-index", paletteIndex)
        }
        colorGroup.insertBefore(path, child)
      }

      child.remove()
    }
  }
}

export function materializeUnifiedImageMotionModules(
  svg: SVGElement,
  image: SVGElement,
  clipLayers: DotClipLayer[],
  pathLayers: DotPathLayer[],
) {
  const document = svg.ownerDocument
  const shapes = [
    ...clipLayers.flatMap((layer) => layer.shapes),
    ...pathLayers.flatMap((layer) => layer.shapes),
  ]
  const coverRect = getSvgShapeBounds(image)

  if (
    !document ||
    shapes.length === 0 ||
    !coverRect ||
    coverRect.width <= 0 ||
    coverRect.height <= 0
  ) {
    return
  }

  const patternId = "dot-matrix-motion-image-fill"
  const pattern = document.createElementNS(SVG_NS, "pattern")
  pattern.setAttribute("id", patternId)
  pattern.setAttribute("patternUnits", "userSpaceOnUse")
  pattern.setAttribute("x", formatSvgNumber(coverRect.x))
  pattern.setAttribute("y", formatSvgNumber(coverRect.y))
  pattern.setAttribute("width", formatSvgNumber(coverRect.width))
  pattern.setAttribute("height", formatSvgNumber(coverRect.height))

  const patternImage = image.cloneNode(true) as SVGElement
  patternImage.removeAttribute("id")
  patternImage.removeAttribute("clip-path")
  patternImage.removeAttribute("data-qr-layer")
  patternImage.removeAttribute("opacity")
  patternImage.setAttribute("x", "0")
  patternImage.setAttribute("y", "0")
  patternImage.setAttribute("width", formatSvgNumber(coverRect.width))
  patternImage.setAttribute("height", formatSvgNumber(coverRect.height))
  pattern.appendChild(patternImage)
  getOrCreateSvgDefs(svg).appendChild(pattern)

  const patternFill = `url(#${patternId})`
  const group = document.createElementNS(SVG_NS, "g")
  group.setAttribute("data-qr-layer", "dot-matrix-motion-modules")

  for (const shape of shapes) {
    const cell = shape.cloneNode(true) as SVGElement
    cell.removeAttribute("id")
    cell.removeAttribute("clip-path")
    cell.removeAttribute("opacity")
    cell.removeAttribute("style")
    cell.removeAttribute("data-testid")
    cell.removeAttribute("data-qr-layer")
    cell.setAttribute("fill", patternFill)
    group.appendChild(cell)
  }

  removeDotMatrixBaseLayers(clipLayers, pathLayers)
  removeOrphanedModuleClipPaths(svg)

  for (const target of svg.querySelectorAll('[data-qr-layer="unified-image-source"]')) {
    if (!isSvgElementLike(target)) {
      continue
    }

    if (!target.getAttribute("data-testid")?.startsWith("finder-patterns-")) {
      continue
    }

    target.setAttribute("fill", patternFill)
    target.removeAttribute("opacity")
    target.removeAttribute("clip-path")
  }

  image.setAttribute("opacity", "0")
  svg.insertBefore(group, image.nextSibling)
}

export function resolveMotionModuleFill(
  shape: SVGElement,
  fallbackFill: string,
  state?: Pick<QraftyState, "dotsColorMode">,
) {
  if (!state || state.dotsColorMode === "solid") {
    return fallbackFill
  }

  if (state.dotsColorMode === "gradient") {
    return fallbackFill.startsWith("url(") ? fallbackFill : "url('#dot-gradient-definition')"
  }

  return fallbackFill
}

export function suppressGradientPaletteOverlayLayers(svg: SVGElement) {
  for (const layer of svg.querySelectorAll('[data-qr-layer="dot-gradient-fill"]')) {
    layer.setAttribute("opacity", "0")
  }
}

export function collectCanvasDotModuleShapes(svg: SVGElement): SVGElement[] {
  const fromMaterialized = [
    ...svg.querySelectorAll(
      '[data-qr-layer="dot-matrix-motion-modules"] > path, [data-qr-layer="dot-matrix-motion-modules"] > rect, [data-qr-layer="dot-matrix-motion-modules"] > circle, [data-qr-layer="dot-matrix-motion-modules"] > svg, [data-qr-layer="dot-matrix-motion-modules"] > g[clip-path]',
    ),
    ...svg.querySelectorAll(
      '[data-qr-layer="dot-palette"] [data-qr-layer="dot-palette-fill"] > *',
    ),
  ].filter(isSvgElementLike)

  if (fromMaterialized.length > 0) {
    return fromMaterialized
  }

  const clipLayers = getQrModuleClipLayers(svg)
  const pathLayers = getQrModulePathLayers(svg)
  const fromLayers = [
    ...clipLayers.flatMap((layer) => layer.shapes),
    ...pathLayers.flatMap((layer) => layer.shapes),
  ]

  if (fromLayers.length > 0) {
    return fromLayers
  }

  return Array.from(svg.querySelectorAll('[data-qr-layer="dot-gradient-clip"]')).flatMap(
    (clipPath) => Array.from(clipPath.children).filter(isSvgElementLike),
  )
}

export function annotateFinderPatternsForDotMatrix(svg: SVGElement) {
  for (const element of svg.querySelectorAll('[data-testid="finder-patterns-outer"]')) {
    if (isSvgElementLike(element)) {
      appendSvgClass(element, "position-ring")
    }
  }

  for (const element of svg.querySelectorAll('[data-testid="finder-patterns-inner"]')) {
    if (isSvgElementLike(element)) {
      appendSvgClass(element, "position-center")
    }
  }
}
