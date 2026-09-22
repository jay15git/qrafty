import type { CSSProperties } from "react"

import {
  getQrBackgroundShapeContentFrame,
  getQrBackgroundShapeDefinition,
  type QrBackgroundShapeContentFrame,
  type QrBackgroundShapeDefinition,
} from "@/features/qr/styles/background-shapes"
import { getQraftyQrQuietZoneFraction } from "@/features/qr/model/qr-module-metrics"
import {
  clampBackgroundShapeOffset,
  clampBackgroundShapeOpacity,
  clampBackgroundShapePaddingPx,
  clampBackgroundShapeTilt,
  DEFAULT_BACKGROUND_SHAPE_OPTIONS,
  DEFAULT_DOT_MATRIX_ANIMATION,
  QR_DOT_MATRIX_ANIMATION_SPEED_MAX,
  QR_DOT_MATRIX_ANIMATION_SPEED_MIN,
  QR_DOT_MATRIX_MATRIX_SIZE_MAX,
  QR_DOT_MATRIX_MATRIX_SIZE_MIN,
  QR_DOT_MATRIX_MATRIX_SIZE_STEP,
  clampQrSize,
  getAssetValue,
  hasActiveBackgroundShapeOptions,
  type QrDotMatrixAnimationOptions,
  type QrDotMatrixSquareLoader,
  type QraftyState,
  type QraftyGradient,
} from "@/features/qr/model/state"
import {
  diamondExpansionMetric,
  diamondMaxExpansionMetric,
  heartExpansionMetric,
  heartMaxExpansionMetric,
  starExpansionMetric,
  starMaxExpansionMetric,
} from "@qrafty/qr/dot-matrix"
import {
  resolveMotionColors,
} from "@/features/qr/motion/motion-color"
import { getBackgroundShapeSkewTransform } from "@/features/canvas/rendering/layer-transform"
import {
  getQraftyGradientCenter,
  qraftyRadialCenterInUserSpace,
} from "@/features/qr/styles/qrafty-gradient-geometry"
import {
  applyUnifiedQrGradientFill,
  applyUnifiedQrImageFill,
  getMergeableClipPathData,
} from "@qrafty/qr-internal/core"
import {
  buildCustomCornerDotTransform,
  getCustomCornerDotShapeGeometry,
  isCustomCornerDotShape,
} from "@/features/qr/styles/custom-corner-dot-shapes"

type QrAnimationRenderMode = "export" | "none" | "preview"
export type QrSvgExtensionOptions = {
  height?: number
  width?: number
}
export type QrSvgExtensionFunction = (
  svg: SVGElement,
  options: QrSvgExtensionOptions,
) => void

const SVG_NS = "http://www.w3.org/2000/svg"
const DOTS_CLIP_PATH_PREFIX = "clip-path-dot-color-"
const QR_MODULE_CLIP_PATH_PREFIXES = [DOTS_CLIP_PATH_PREFIX]
const DEFAULT_DOT_MATRIX_TILE_SIZE = 5
const DOT_MATRIX_QUIET_TRACK_INDEX = -1

export function buildQrExtension(state: QraftyState) {
  const extensions: QrSvgExtensionFunction[] = []
  const customCornerDotExtension = createCustomCornerDotExtension(state)

  if (customCornerDotExtension) {
    extensions.push(customCornerDotExtension)
  }

  const backgroundImage = getAssetValue(state.backgroundImage)
  const backgroundShape = backgroundImage
    ? null
    : getQrBackgroundShapeDefinition(state.backgroundShapeId)

  if (backgroundImage) {
    extensions.push(
      createBackgroundImageExtension(
        backgroundImage,
        state.backgroundOptions.round,
      ),
    )
  }

  const unifiedModuleGradient =
    state.gradientLinkMode === "unified" &&
    state.dotsColorMode === "gradient" &&
    state.dataModulesGradient.enabled

  const unifiedModuleImage =
    state.dotsColorMode === "image" && Boolean(getAssetValue(state.moduleFillImage))

  if (state.dotsColorMode === "gradient" && !unifiedModuleGradient) {
    extensions.push(createDotsGradientExtension(state))
  }

  if (state.dotsColorMode === "palette" && getActiveDotsPalette(state).length > 0) {
    extensions.push(createDotsPaletteExtension(state))
  }

  if (unifiedModuleImage) {
    extensions.push(createUnifiedImageExtension(state))
  } else if (unifiedModuleGradient) {
    extensions.push(createUnifiedGradientExtension(state))
  } else {
    if (state.finderPatternOuterGradient.enabled) {
      extensions.push(
        createFinderPatternGradientExtension(
          "finder-patterns-outer",
          state.finderPatternOuterGradient,
          state.margin,
          {
            gradientIdPrefix: "corners-square-color-",
            groupLayer: "corner-frame-gradient",
          },
        ),
      )
    }

    if (state.finderPatternInnerGradient.enabled) {
      extensions.push(
        createFinderPatternGradientExtension(
          "finder-patterns-inner",
          state.finderPatternInnerGradient,
          state.margin,
          {
            gradientIdPrefix: "corners-dot-color-",
            groupLayer: "corner-dot-gradient",
          },
        ),
      )
    }
  }

  if (backgroundShape) {
    extensions.push(createBackgroundShapeExtension(backgroundShape, state))
  } else if (
    !backgroundImage &&
    (!state.backgroundOptions.transparent ||
      state.backgroundGradient.enabled ||
      hasActiveBackgroundSurfaceOptions(state.backgroundShapeOptions))
  ) {
    extensions.push(createBackgroundSurfaceExtension(state))
  }

  if (extensions.length === 0) {
    return null
  }

  return (
    svg: SVGElement,
    options: QrSvgExtensionOptions,
  ) => {
    for (const extension of extensions) {
      extension(svg, options)
    }
  }
}

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

function materializeDataModulePaths(
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

function expandMergedPaletteFillPaths(svg: SVGElement) {
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

function materializeUnifiedImageMotionModules(
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

function resolveMotionModuleFill(
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

type PaletteColorAssignment = {
  color: string
  paletteIndex: number
  shapes: SVGElement[]
}

type PalettePaintGroupLayer = "dot-matrix-motion-modules" | "dot-palette"

function buildPaletteColorAssignments(
  state: Pick<QraftyState, "data" | "dotsPalette">,
  allDotShapes: SVGElement[],
  metrics: DotMatrixMetrics | null,
) {
  const palette = getActiveDotsPalette(state)

  if (palette.length === 0 || allDotShapes.length === 0) {
    return null
  }

  const paletteSeed = hashDotPaletteString(state.data.trim())
  const shapeGroups = createDotPaletteShapeGroups(allDotShapes, metrics)
  const assignments: PaletteColorAssignment[] = palette.map((color) => ({
    color,
    paletteIndex: palette.indexOf(color),
    shapes: [],
  }))
  const groupAssignments = shapeGroups.map((group) => ({
    group,
    paletteIndex: getDotPaletteIndex(group, palette.length, paletteSeed),
  }))

  balanceDotPaletteAssignments(groupAssignments, palette.length, paletteSeed)

  for (const { group, paletteIndex } of groupAssignments) {
    assignments[paletteIndex]?.shapes.push(...group.shapes)
  }

  const activeAssignments = assignments.filter((assignment) => assignment.shapes.length > 0)

  return activeAssignments.length > 0 ? activeAssignments : null
}

function createPaletteModuleGroup(
  document: Document,
  palette: string[],
  activeAssignments: PaletteColorAssignment[],
  groupLayer: PalettePaintGroupLayer,
) {
  const group = document.createElementNS(SVG_NS, "g")
  group.setAttribute("data-qr-layer", groupLayer)

  if (groupLayer === "dot-palette") {
    group.setAttribute("data-qr-palette-size", String(palette.length))
  }

  for (const { color, paletteIndex, shapes } of activeAssignments) {
    const colorGroup = document.createElementNS(SVG_NS, "g")
    colorGroup.setAttribute("fill", color)
    colorGroup.setAttribute("data-qr-layer", "dot-palette-fill")
    colorGroup.setAttribute("data-qr-palette-index", String(paletteIndex))

    const mergedPathData: string[] = []
    const paintedShapes: SVGElement[] = []

    for (const shape of shapes) {
      const pathData =
        groupLayer === "dot-palette" ? getMergeableClipPathData(shape) : null

      if (pathData) {
        mergedPathData.push(pathData)
        continue
      }

      const painted = shape.cloneNode(true) as SVGElement
      painted.removeAttribute("clip-path")
      painted.removeAttribute("opacity")
      paintedShapes.push(painted)
    }

    if (mergedPathData.length > 0) {
      const mergedPath = document.createElementNS(SVG_NS, "path")
      mergedPath.setAttribute("d", mergedPathData.join(" "))
      mergedPath.setAttribute("fill", color)
      mergedPath.setAttribute("fill-rule", "nonzero")
      mergedPath.setAttribute("data-qr-palette-index", String(paletteIndex))
      colorGroup.appendChild(mergedPath)
    }

    for (const painted of paintedShapes) {
      painted.setAttribute("fill", color)
      painted.setAttribute("data-qr-palette-index", String(paletteIndex))
      colorGroup.appendChild(painted)
    }

    group.appendChild(colorGroup)
  }

  return group
}

function removeDotMatrixBaseLayers(
  dotClipLayers: DotClipLayer[],
  dotPathLayers: DotPathLayer[],
) {
  for (const layer of dotClipLayers) {
    layer.element.remove()
  }

  for (const layer of dotPathLayers) {
    layer.element.remove()
  }
}

function removeOrphanedModuleClipPaths(svg: SVGElement) {
  for (const clipPath of svg.querySelectorAll("clipPath")) {
    const clipPathId = clipPath.getAttribute("id") ?? ""

    if (QR_MODULE_CLIP_PATH_PREFIXES.some((prefix) => clipPathId.startsWith(prefix))) {
      clipPath.remove()
    }
  }
}

function applyDirectPalettePaint(
  svg: SVGElement,
  state: Pick<QraftyState, "data" | "dotsPalette">,
  allDotShapes: SVGElement[],
  dotClipLayers: DotClipLayer[],
  dotPathLayers: DotPathLayer[],
  options: { groupLayer: PalettePaintGroupLayer },
) {
  const document = svg.ownerDocument
  const palette = getActiveDotsPalette(state)

  if (!document || palette.length === 0) {
    return false
  }

  const metrics =
    collectDotMatrixMetrics(allDotShapes) ?? getFallbackDotMatrixMetrics(allDotShapes)
  const activeAssignments = buildPaletteColorAssignments(state, allDotShapes, metrics)

  if (!activeAssignments) {
    return false
  }

  const anchor = findDotMatrixLayerAnchor(svg)
  removeDotMatrixBaseLayers(dotClipLayers, dotPathLayers)
  removeOrphanedModuleClipPaths(svg)

  const group = createPaletteModuleGroup(document, palette, activeAssignments, options.groupLayer)

  if (group.children.length === 0) {
    return false
  }

  svg.insertBefore(group, anchor)

  return true
}

function suppressGradientPaletteOverlayLayers(svg: SVGElement) {
  for (const layer of svg.querySelectorAll('[data-qr-layer="dot-gradient-fill"]')) {
    layer.setAttribute("opacity", "0")
  }
}

function collectCanvasDotModuleShapes(svg: SVGElement): SVGElement[] {
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

function appendSvgClass(element: SVGElement, className: string) {
  const existing = element.getAttribute("class") ?? ""

  if (existing.split(/\s+/).includes(className)) {
    return
  }

  element.setAttribute("class", existing ? `${existing} ${className}` : className)
}

function annotateFinderPatternsForDotMatrix(svg: SVGElement) {
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

function createCustomCornerDotExtension(
  state: Pick<QraftyState, "finderPatternInnerSettings">,
): QrSvgExtensionFunction | null {
  const shape = state.finderPatternInnerSettings.type

  if (!isCustomCornerDotShape(shape)) {
    return null
  }

  const color = state.finderPatternInnerSettings.color

  return (svg) => {
    const document = svg.ownerDocument

    if (!document) {
      return
    }

    const existing = Array.from(
      svg.querySelectorAll('[data-testid="finder-patterns-inner"]'),
    ).filter(isSvgElementLike)

    if (existing.length === 0) {
      return
    }

    const regions = existing.map((element) => getFinderInnerElementRegion(element)).filter(
      (region): region is FinderInnerElementRegion => region !== null,
    )

    if (regions.length === 0) {
      return
    }

    const insertBefore = existing.at(-1)?.nextSibling ?? null

    for (const element of existing) {
      element.remove()
    }

    for (const region of regions) {
      const geometry = getCustomCornerDotShapeGeometry(shape, region.x, region.y, region.size)
      const path = document.createElementNS(SVG_NS, "path")

      path.setAttribute("d", geometry.d)
      path.setAttribute("fill", color)
      path.setAttribute("transform", buildCustomCornerDotTransform(geometry))
      path.setAttribute("data-testid", "finder-patterns-inner")
      path.setAttribute("data-qr-layer", "custom-corner-dot")

      if (geometry.fillRule) {
        path.setAttribute("fill-rule", geometry.fillRule)
      }

      if (insertBefore) {
        svg.insertBefore(path, insertBefore)
      } else {
        svg.appendChild(path)
      }
    }
  }
}

type FinderInnerElementRegion = {
  size: number
  x: number
  y: number
}

function getFinderInnerElementRegion(element: SVGElement): FinderInnerElementRegion | null {
  const tagName = element.tagName.toLowerCase()

  if (tagName === "rect") {
    const x = Number.parseFloat(element.getAttribute("x") ?? "")
    const y = Number.parseFloat(element.getAttribute("y") ?? "")
    const width = Number.parseFloat(element.getAttribute("width") ?? "3")
    const height = Number.parseFloat(element.getAttribute("height") ?? "3")

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null
    }

    return {
      x,
      y,
      size: Number.isFinite(width) && Number.isFinite(height) ? Math.min(width, height) : 3,
    }
  }

  if (tagName === "path") {
    const transform = element.getAttribute("transform")

    if (!transform) {
      return null
    }

    const translateMatch = transform.match(
      /translate\(([-\d.]+)[,\s]+([-\d.]+)\)/,
    )

    if (!translateMatch) {
      return null
    }

    const x = Number.parseFloat(translateMatch[1] ?? "")
    const y = Number.parseFloat(translateMatch[2] ?? "")

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null
    }

    return { x, y, size: 3 }
  }

  return null
}

function createDotsPaletteExtension(
  state: Pick<QraftyState, "data" | "dotsPalette">,
): QrSvgExtensionFunction {
  return (svg) => {
    const palette = getActiveDotsPalette(state)

    if (palette.length === 0) {
      return
    }

    svg.querySelectorAll('[data-qr-layer="dot-palette"]').forEach((node) => {
      node.remove()
    })

    const dotClipLayers = getQrModuleClipLayers(svg)
    const dotPathLayers = getQrModulePathLayers(svg)

    if (dotClipLayers.length === 0 && dotPathLayers.length === 0) {
      return
    }

    const allDotShapes = [
      ...dotClipLayers.flatMap((layer) => layer.shapes),
      ...dotPathLayers.flatMap((layer) => layer.shapes),
    ]

    applyDirectPalettePaint(svg, state, allDotShapes, dotClipLayers, dotPathLayers, {
      groupLayer: "dot-palette",
    })
  }
}

function createDotsGradientExtension(
  state: Pick<QraftyState, "dataModulesGradient">,
): QrSvgExtensionFunction {
  return (svg) => {
    removeLegacyDotGradientOverlay(svg)

    const dotClipLayers = getQrModuleClipLayers(svg)
    const dotPathLayers = getQrModulePathLayers(svg)
    const paintTargets: SVGElement[] = [
      ...dotClipLayers.map((layer) => layer.element),
      ...dotPathLayers.map((layer) => layer.element),
    ]

    if (paintTargets.length === 0) {
      const dataModules = svg.querySelector('[data-testid="data-modules"]')

      if (isSvgElementLike(dataModules)) {
        paintTargets.push(dataModules)
      }
    }

    if (paintTargets.length === 0) {
      return
    }

    const dotShapes = [
      ...dotClipLayers.flatMap((layer) => layer.shapes),
      ...dotPathLayers.flatMap((layer) => layer.shapes),
    ]
    const metrics =
      dotShapes.length > 0
        ? collectDotMatrixMetrics(dotShapes) ?? getFallbackDotMatrixMetrics(dotShapes)
        : getDataModulesPathMetrics(svg)
    const coverRect = metrics ? getDotShapeCoverRect(metrics) : getSvgViewBoxRegion(svg)

    if (!coverRect) {
      return
    }

    const gradientId = "dot-gradient-definition"
    const gradient = createBackgroundShapeGradient(svg, state.dataModulesGradient, {
      height: coverRect.height,
      id: gradientId,
      layer: "dot-gradient-definition",
      width: coverRect.width,
      x: coverRect.x,
      y: coverRect.y,
    })

    if (!gradient) {
      return
    }

    getOrCreateSvgDefs(svg).appendChild(gradient)

    const gradientFill = `url('#${gradientId}')`

    for (const target of paintTargets) {
      target.setAttribute("fill", gradientFill)
      target.setAttribute("data-qr-layer", "dot-gradient-fill")
      target.removeAttribute("opacity")
    }
  }
}

function removeLegacyDotGradientOverlay(svg: SVGElement) {
  for (const node of svg.querySelectorAll('[data-qr-layer="dot-gradient"]')) {
    if (node.tagName.toLowerCase() === "g") {
      node.remove()
    }
  }

  for (const node of svg.querySelectorAll('[data-qr-layer="dot-gradient-definition"]')) {
    node.remove()
  }
}

function getDataModulesPathMetrics(svg: SVGElement) {
  const dataModules = svg.querySelector('[data-testid="data-modules"]')

  if (!isSvgElementLike(dataModules)) {
    return null
  }

  const pathData = dataModules.getAttribute("d")

  if (!pathData) {
    return null
  }

  const document = dataModules.ownerDocument

  if (!document) {
    return null
  }

  const shapes = splitSvgPathData(pathData).map((segment) => {
    const shape = document.createElementNS(SVG_NS, "path")
    shape.setAttribute("d", segment)
    return shape
  })

  if (shapes.length === 0) {
    return null
  }

  return collectDotMatrixMetrics(shapes) ?? getFallbackDotMatrixMetrics(shapes)
}

function getDotShapeCoverRect(metrics: DotMatrixMetrics) {
  return {
    height: Math.max(metrics.cellSize, metrics.maxY - metrics.originY),
    width: Math.max(metrics.cellSize, metrics.maxX - metrics.originX),
    x: metrics.originX,
    y: metrics.originY,
  }
}

function shouldApplyDotMatrixAnimation(
  state: QraftyState,
  mode: QrAnimationRenderMode,
) {
  if (!state.dotMatrixAnimation.enabled || state.type !== "svg") {
    return false
  }

  if (!state.dotMatrixAnimation.animated) {
    return false
  }

  if (mode === "preview") {
    return true
  }

  if (mode === "export") {
    return state.dotMatrixAnimation.exportAnimatedSvg
  }

  return false
}

type DotClipLayer = {
  element: SVGRectElement
  fill: string
  shapes: SVGElement[]
}

type DotPathLayer = {
  element: SVGPathElement
  fill: string
  shapes: SVGPathElement[]
}

type DotMatrixMetrics = {
  cellSize: number
  maxCol: number
  maxRow: number
  maxX: number
  maxY: number
  originX: number
  originY: number
}

type DotMatrixCoordinates = {
  col: number
  row: number
}

type DotPaletteShapeGroup = {
  coordinates: DotMatrixCoordinates | null
  fallbackIndex: number
  shapes: SVGElement[]
}

type DotPaletteGroupAssignment = {
  group: DotPaletteShapeGroup
  paletteIndex: number
}

type DotMatrixModule = DotMatrixCoordinates & {
  angle: number
  colN: number
  diagonal: number
  distance: number
  distanceN: number
  hash: number
  index: number
  matrixSize: number
  outline: number
  outlineN: number
  perimeterIndex: number
  regionCol: number
  regionIndex: number
  regionRow: number
  ring: number
  rowN: number
  shape: SVGElement
}

type DotMatrixAnchor = {
  size?: number
  x: number
  y: number
}

type DotMatrixTrack = {
  durationMs: number
  index: number
  keyframes: string
  modules: DotMatrixModule[]
  opacity?: number
  region: string
  speedMultiplier: number
  state: "active" | "quiet"
  styleVars: Record<string, number | string>
  timingFunction: string
  topology: string
  upstreamClass?: string
  upstreamLoader: DotMatrixSquareLoaderId
}

type DotMatrixCell = {
  col: number
  index: number
  matrixSize: number
  row: number
}

type DotMatrixCellAnimation = {
  active: boolean
  durationMs: number
  keyframes: string
  opacity?: number
  styleVars?: Record<string, number | string>
  timingFunction: string
  topology: string
  upstreamClass?: string
  upstreamLoader: DotMatrixSquareLoaderId
}

type DotMatrixLoaderSpec = {
  resolve: (cell: DotMatrixCell) => DotMatrixCellAnimation
  topology: string
  upstreamLoader: DotMatrixSquareLoaderId
}

type DotMatrixLoaderResolver = (
  cell: DotMatrixCell,
  upstreamLoader: DotMatrixSquareLoaderId,
  topology: string,
) => DotMatrixCellAnimation

function getQrModuleClipLayers(svg: SVGElement): DotClipLayer[] {
  return Array.from(svg.querySelectorAll("rect"))
    .map((element) => {
      const clipPathId = getClipPathId(element.getAttribute("clip-path"))

      if (!clipPathId || !QR_MODULE_CLIP_PATH_PREFIXES.some((prefix) => clipPathId.startsWith(prefix))) {
        return null
      }

      const clipPath = Array.from(svg.querySelectorAll("clipPath")).find(
        (candidate) => candidate.getAttribute("id") === clipPathId,
      )

      if (!clipPath) {
        return null
      }

      const shapes = Array.from(clipPath.children).filter(
        (child): child is SVGElement => isSvgElementLike(child),
      )

      if (shapes.length === 0) {
        return null
      }

      return {
        element,
        fill: element.getAttribute("fill") ?? "currentColor",
        shapes,
      } satisfies DotClipLayer
    })
    .filter((layer): layer is DotClipLayer => layer !== null)
}

function getQrModulePathLayers(svg: SVGElement): DotPathLayer[] {
  return Array.from(svg.querySelectorAll("path"))
    .map((element) => {
      if (element.getAttribute("data-testid") !== "data-modules") {
        return null
      }

      const pathData = element.getAttribute("d")
      const pathSegments = splitSvgPathData(pathData)

      if (pathSegments.length === 0) {
        return null
      }

      const document = element.ownerDocument
      const shapes = pathSegments.map((segment) => {
        const shape = document.createElementNS(SVG_NS, "path")
        shape.setAttribute("d", segment)
        return shape
      })

      return {
        element,
        fill: element.getAttribute("fill") ?? "currentColor",
        shapes,
      } satisfies DotPathLayer
    })
    .filter((layer): layer is DotPathLayer => layer !== null)
}

function splitSvgPathData(pathData: string | null) {
  return (pathData ?? "")
    .split(/(?=M\s*[+-]?(?:\d+\.?\d*|\.\d+)[\s,])/)
    .map((segment) => segment.trim())
    .filter(Boolean)
}

function createDotPaletteShapeGroups(
  shapes: SVGElement[],
  metrics: DotMatrixMetrics | null,
): DotPaletteShapeGroup[] {
  const groups = new Map<string, DotPaletteShapeGroup>()

  for (const [fallbackIndex, shape] of shapes.entries()) {
    const coordinates = metrics ? resolveDotMatrixCoordinates(shape, metrics) : null
    const key = coordinates ? `${coordinates.row}:${coordinates.col}` : `fallback:${fallbackIndex}`
    const group = groups.get(key)

    if (group) {
      group.shapes.push(shape)
      continue
    }

    groups.set(key, {
      coordinates,
      fallbackIndex,
      shapes: [shape],
    })
  }

  return Array.from(groups.values()).sort(compareDotPaletteShapeGroups)
}

function compareDotPaletteShapeGroups(left: DotPaletteShapeGroup, right: DotPaletteShapeGroup) {
  if (left.coordinates && right.coordinates) {
    return (
      left.coordinates.row - right.coordinates.row ||
      left.coordinates.col - right.coordinates.col ||
      left.fallbackIndex - right.fallbackIndex
    )
  }

  if (left.coordinates) {
    return -1
  }

  if (right.coordinates) {
    return 1
  }

  return left.fallbackIndex - right.fallbackIndex
}

function getDotPaletteIndex(group: DotPaletteShapeGroup, paletteLength: number, seed: number) {
  if (paletteLength <= 0) {
    return 0
  }

  return hashDotPaletteGroup(group, seed) % paletteLength
}

function balanceDotPaletteAssignments(
  assignments: DotPaletteGroupAssignment[],
  paletteLength: number,
  seed: number,
) {
  if (assignments.length < paletteLength || paletteLength <= 1) {
    return
  }

  const counts = countDotPaletteAssignments(assignments, paletteLength)
  const missingPaletteIndexes = counts
    .map((count, paletteIndex) => (count === 0 ? paletteIndex : null))
    .filter((paletteIndex): paletteIndex is number => paletteIndex !== null)

  for (const missingPaletteIndex of missingPaletteIndexes) {
    let candidateIndex = -1
    let candidateScore = -1

    for (const [assignmentIndex, assignment] of assignments.entries()) {
      if (counts[assignment.paletteIndex] <= 1) {
        continue
      }

      const score = hashDotPaletteNumbers([
        seed,
        missingPaletteIndex,
        assignmentIndex,
        assignment.group.coordinates?.row ?? -1,
        assignment.group.coordinates?.col ?? assignment.group.fallbackIndex,
      ])

      if (score > candidateScore) {
        candidateIndex = assignmentIndex
        candidateScore = score
      }
    }

    if (candidateIndex === -1) {
      return
    }

    const assignment = assignments[candidateIndex]
    counts[assignment.paletteIndex] -= 1
    assignment.paletteIndex = missingPaletteIndex
    counts[missingPaletteIndex] += 1
  }
}

function countDotPaletteAssignments(
  assignments: DotPaletteGroupAssignment[],
  paletteLength: number,
) {
  const counts = Array.from({ length: paletteLength }, () => 0)

  for (const assignment of assignments) {
    counts[assignment.paletteIndex] += 1
  }

  return counts
}

function hashDotPaletteGroup(group: DotPaletteShapeGroup, seed: number) {
  return hashDotPaletteNumbers([
    seed,
    group.coordinates?.row ?? -1,
    group.coordinates?.col ?? -1,
    group.fallbackIndex,
  ])
}

function hashDotPaletteString(value: string) {
  const input = value.length > 0 ? value : "qr-dot-palette"
  let hash = 2166136261

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function hashDotPaletteNumbers(values: number[]) {
  let hash = 0x811c9dc5

  for (const value of values) {
    hash ^= value | 0
    hash = Math.imul(hash, 0x45d9f3b)
    hash ^= hash >>> 16
  }

  hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d)
  hash = Math.imul(hash ^ (hash >>> 12), 0x297a2d39)

  return (hash ^ (hash >>> 15)) >>> 0
}

function getClipPathId(clipPath: string | null) {
  return /url\(['"]?#([^'")]+)['"]?\)/.exec(clipPath ?? "")?.[1] ?? null
}

function getActiveDotsPalette(state: Pick<QraftyState, "dotsPalette">) {
  const seen = new Set<string>()

  return state.dotsPalette.flatMap((color) => {
    const trimmed = color.trim()
    if (!trimmed.length || seen.has(trimmed)) {
      return []
    }

    seen.add(trimmed)
    return [trimmed]
  })
}

function isSvgElementLike(node: Element | null | undefined): node is SVGElement {
  return node != null && typeof node.getAttribute === "function" && typeof node.setAttribute === "function"
}

function collectDotMatrixMetrics(dotShapes: SVGElement[]): DotMatrixMetrics | null {
  const anchors = dotShapes
    .map((shape) => getDotMatrixAnchor(shape))
    .filter((anchor): anchor is DotMatrixAnchor => anchor !== null)

  if (anchors.length === 0) {
    return null
  }

  const explicitSizes = anchors
    .map((anchor) => anchor.size)
    .filter((size): size is number => size !== undefined && Number.isFinite(size) && size > 0)
  const cellSize =
    explicitSizes.length > 0
      ? Math.min(...explicitSizes)
      : getSmallestPositiveDelta([
          ...anchors.map((anchor) => anchor.x),
          ...anchors.map((anchor) => anchor.y),
        ])

  if (!Number.isFinite(cellSize) || cellSize <= 0) {
    return null
  }

  const originX = Math.min(...anchors.map((anchor) => anchor.x))
  const originY = Math.min(...anchors.map((anchor) => anchor.y))
  const coordinates = anchors.map((anchor) => ({
    col: Math.max(0, Math.round((anchor.x - originX) / cellSize)),
    row: Math.max(0, Math.round((anchor.y - originY) / cellSize)),
  }))

  return {
    cellSize,
    maxCol: Math.max(...coordinates.map((coordinate) => coordinate.col)),
    maxRow: Math.max(...coordinates.map((coordinate) => coordinate.row)),
    maxX: Math.max(...anchors.map((anchor) => anchor.x + (anchor.size ?? cellSize))),
    maxY: Math.max(...anchors.map((anchor) => anchor.y + (anchor.size ?? cellSize))),
    originX,
    originY,
  }
}

function getFallbackDotMatrixMetrics(dotShapes: SVGElement[]): DotMatrixMetrics {
  const anchors = dotShapes
    .map((shape) => getDotMatrixAnchor(shape))
    .filter((anchor): anchor is DotMatrixAnchor => anchor !== null)
  const maxX = anchors.length > 0 ? Math.max(...anchors.map((anchor) => anchor.x + (anchor.size ?? 0))) : 0
  const maxY = anchors.length > 0 ? Math.max(...anchors.map((anchor) => anchor.y + (anchor.size ?? 0))) : 0

  return {
    cellSize: 1,
    maxCol: 0,
    maxRow: 0,
    maxX,
    maxY,
    originX: 0,
    originY: 0,
  }
}

function resolveDotMatrixCoordinates(shape: SVGElement, metrics: DotMatrixMetrics) {
  const anchor = getDotMatrixAnchor(shape)

  if (!anchor) {
    return null
  }

  return {
    col: Math.max(0, Math.round((anchor.x - metrics.originX) / metrics.cellSize)),
    row: Math.max(0, Math.round((anchor.y - metrics.originY) / metrics.cellSize)),
  }
}

function getDotMatrixAnchor(shape: SVGElement): DotMatrixAnchor | null {
  const anchorTag = shape.tagName.toLowerCase()

  if (anchorTag === "g" || anchorTag === "svg") {
    const x = getDotNumericAttribute(shape, "data-anchor-x")
    const y = getDotNumericAttribute(shape, "data-anchor-y")

    if (x !== null && y !== null) {
      const size = getDotNumericAttribute(shape, "data-anchor-size")
      return { size: size ?? undefined, x, y }
    }

    return null
  }

  if (shape.tagName.toLowerCase() === "rect") {
    const x = getDotNumericAttribute(shape, "x")
    const y = getDotNumericAttribute(shape, "y")
    const width = getDotNumericAttribute(shape, "width")
    const height = getDotNumericAttribute(shape, "height")

    if (x !== null && y !== null && width !== null && height !== null) {
      return { size: Math.min(width, height), x, y }
    }
  }

  if (shape.tagName.toLowerCase() === "circle") {
    const cx = getDotNumericAttribute(shape, "cx")
    const cy = getDotNumericAttribute(shape, "cy")
    const r = getDotNumericAttribute(shape, "r")

    if (cx !== null && cy !== null && r !== null) {
      return { size: r * 2, x: cx - r, y: cy - r }
    }
  }

  if (shape.tagName.toLowerCase() === "path") {
    return getPathAnchor(shape.getAttribute("d"))
  }

  return null
}

function getPathAnchor(pathDefinition: string | null): DotMatrixAnchor | null {
  if (!pathDefinition) {
    return null
  }

  const match =
    /M\s*([+-]?(?:\d+\.?\d*|\.\d+))[\s,]+([+-]?(?:\d+\.?\d*|\.\d+))/.exec(pathDefinition)

  if (!match) {
    return null
  }

  const x = Number(match[1])
  const y = Number(match[2])

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null
  }

  return { size: 1, x: Math.floor(x), y: Math.floor(y) }
}

type SvgShapeBounds = {
  height: number
  width: number
  x: number
  y: number
}

const PATH_COMMAND_ARG_COUNTS: Record<string, number> = {
  a: 7,
  c: 6,
  h: 1,
  l: 2,
  m: 2,
  q: 4,
  s: 4,
  t: 2,
  v: 1,
  z: 0,
}

function getPathDataBounds(pathDefinition: string | null): SvgShapeBounds | null {
  const tokens = pathDefinition?.match(/[a-zA-Z]|[-+]?(?:\d*\.?\d+)(?:e[-+]?\d+)?/gi)

  if (!tokens) {
    return null
  }

  let command = ""
  let cursorX = 0
  let cursorY = 0
  let index = 0
  let minX = Number.POSITIVE_INFINITY
  let minY = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let maxY = Number.NEGATIVE_INFINITY

  const pushPoint = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return
    }

    minX = Math.min(minX, x)
    minY = Math.min(minY, y)
    maxX = Math.max(maxX, x)
    maxY = Math.max(maxY, y)
  }

  while (index < tokens.length) {
    const token = tokens[index]!

    if (/^[a-zA-Z]$/.test(token)) {
      command = token
      index += 1

      if (command.toLowerCase() === "z") {
        continue
      }
    }

    const normalized = command.toLowerCase()
    const arity = PATH_COMMAND_ARG_COUNTS[normalized]

    if (arity === undefined || arity === 0) {
      index += 1
      continue
    }

    if (index + arity > tokens.length) {
      break
    }

    const params = tokens.slice(index, index + arity).map(Number)
    index += arity
    const isRelative = command !== normalized
    const abs = (value: number, base: number) => (isRelative ? base + value : value)

    if (normalized === "h") {
      cursorX = abs(params[0]!, cursorX)
      pushPoint(cursorX, cursorY)
      continue
    }

    if (normalized === "v") {
      cursorY = abs(params[0]!, cursorY)
      pushPoint(cursorX, cursorY)
      continue
    }

    if (normalized === "a") {
      cursorX = abs(params[5]!, cursorX)
      cursorY = abs(params[6]!, cursorY)
      pushPoint(cursorX, cursorY)
      continue
    }

    const baseX = cursorX
    const baseY = cursorY

    for (let pair = 0; pair + 1 < arity; pair += 2) {
      const x = abs(params[pair]!, baseX)
      const y = abs(params[pair + 1]!, baseY)

      pushPoint(x, y)

      if (pair === arity - 2) {
        cursorX = x
        cursorY = y
      }
    }

    if (normalized === "m") {
      command = isRelative ? "l" : "L"
    }
  }

  if (!Number.isFinite(minX) || !Number.isFinite(minY)) {
    return null
  }

  return { height: maxY - minY, width: maxX - minX, x: minX, y: minY }
}

function getBoxShapeBounds(shape: SVGElement): SvgShapeBounds | null {
  const width = getDotNumericAttribute(shape, "width")
  const height = getDotNumericAttribute(shape, "height")

  if (width === null || height === null) {
    return null
  }

  return {
    height,
    width,
    x: getDotNumericAttribute(shape, "x") ?? 0,
    y: getDotNumericAttribute(shape, "y") ?? 0,
  }
}

function getCircleShapeBounds(shape: SVGElement): SvgShapeBounds | null {
  const cx = getDotNumericAttribute(shape, "cx")
  const cy = getDotNumericAttribute(shape, "cy")
  const r = getDotNumericAttribute(shape, "r")

  if (cx === null || cy === null || r === null) {
    return null
  }

  return { height: r * 2, width: r * 2, x: cx - r, y: cy - r }
}

function getEllipseShapeBounds(shape: SVGElement): SvgShapeBounds | null {
  const cx = getDotNumericAttribute(shape, "cx")
  const cy = getDotNumericAttribute(shape, "cy")
  const rx = getDotNumericAttribute(shape, "rx")
  const ry = getDotNumericAttribute(shape, "ry")

  if (cx === null || cy === null || rx === null || ry === null) {
    return null
  }

  return { height: ry * 2, width: rx * 2, x: cx - rx, y: cy - ry }
}

function unionShapeBounds(a: SvgShapeBounds, b: SvgShapeBounds): SvgShapeBounds {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)
  return {
    height: Math.max(a.y + a.height, b.y + b.height) - y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    x,
    y,
  }
}

function getGroupShapeBounds(shape: SVGElement): SvgShapeBounds | null {
  let combined: SvgShapeBounds | null = null

  for (const child of Array.from(shape.children)) {
    if (!isSvgElementLike(child)) {
      continue
    }

    const childBounds = getSvgShapeBounds(child)

    if (childBounds) {
      combined = combined ? unionShapeBounds(combined, childBounds) : childBounds
    }
  }

  return combined
}

const SVG_SHAPE_BOUNDS_READERS: Record<
  string,
  (shape: SVGElement) => SvgShapeBounds | null
> = {
  circle: getCircleShapeBounds,
  ellipse: getEllipseShapeBounds,
  g: getGroupShapeBounds,
  image: getBoxShapeBounds,
  path: (shape) => getPathDataBounds(shape.getAttribute("d")),
  rect: getBoxShapeBounds,
  svg: getBoxShapeBounds,
}

function getSvgShapeBounds(shape: SVGElement): SvgShapeBounds | null {
  return SVG_SHAPE_BOUNDS_READERS[shape.tagName.toLowerCase()]?.(shape) ?? null
}

function getDotNumericAttribute(shape: SVGElement, attributeName: string) {
  const value = shape.getAttribute(attributeName)

  if (value === null) {
    return null
  }

  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : null
}

function getSmallestPositiveDelta(values: number[]) {
  const uniqueValues = Array.from(new Set(values.filter(Number.isFinite))).sort((a, b) => a - b)
  let smallestDelta = Number.POSITIVE_INFINITY

  for (let index = 1; index < uniqueValues.length; index += 1) {
    const delta = uniqueValues[index] - uniqueValues[index - 1]

    if (delta > 0 && delta < smallestDelta) {
      smallestDelta = delta
    }
  }

  return smallestDelta
}

function getDotMatrixAnimationDuration(animation: QrDotMatrixAnimationOptions) {
  const speed = Math.min(
    QR_DOT_MATRIX_ANIMATION_SPEED_MAX,
    Math.max(QR_DOT_MATRIX_ANIMATION_SPEED_MIN, animation.speed),
  )
  const densityFactor = getDotMatrixDensitySpeedFactor(animation)

  return formatSvgNumber(Math.max(0.55, (4.7 - speed * 0.31) / densityFactor))
}

function getDotMatrixAnimationSpeedMultiplier(animation: QrDotMatrixAnimationOptions) {
  const speed = Math.min(
    QR_DOT_MATRIX_ANIMATION_SPEED_MAX,
    Math.max(QR_DOT_MATRIX_ANIMATION_SPEED_MIN, animation.speed),
  )

  return 2 ** ((3 - speed) / 2) / getDotMatrixDensitySpeedFactor(animation)
}

function getDotMatrixDensitySpeedFactor(animation: QrDotMatrixAnimationOptions) {
  return Math.sqrt(getDotMatrixTileSize(animation) / DEFAULT_DOT_MATRIX_TILE_SIZE)
}

function getDotMatrixTileSize(animation: QrDotMatrixAnimationOptions) {
  const matrixSize = Number(animation.matrixSize)
  const clamped = Number.isFinite(matrixSize)
    ? Math.min(QR_DOT_MATRIX_MATRIX_SIZE_MAX, Math.max(QR_DOT_MATRIX_MATRIX_SIZE_MIN, matrixSize))
    : DEFAULT_DOT_MATRIX_ANIMATION.matrixSize

  return Math.round(clamped / QR_DOT_MATRIX_MATRIX_SIZE_STEP) * QR_DOT_MATRIX_MATRIX_SIZE_STEP
}

function getDotMatrixBaseOpacity(animation: QrDotMatrixAnimationOptions) {
  return animation.opacityBase
}

function getDotMatrixOverlayScale(animation: QrDotMatrixAnimationOptions) {
  return Math.max(DEFAULT_DOT_MATRIX_ANIMATION.overlayScale, animation.overlayScale)
}

type DotMatrixSquareLoaderId =
  | "dotm-square-1"
  | "dotm-square-6"
  | "dotm-square-21"
  | "dotm-square-23"
  | "dotm-square-26"
  | "dotm-square-28"
  | "dotm-square-30"

const DOT_MATRIX_LOADER_SPECS: Record<QrDotMatrixSquareLoader, DotMatrixLoaderSpec> = {
  "flux-columns": createDotMatrixLoaderSpec("dotm-square-6", "column-snake", (cell) =>
    createClassCellAnimation("dotm-square-6", "column-snake", "dmx-square6-col-snake", "dmx-square6-col-snake", 1500, {
      "--dmx-col-pos": cell.col % 2 === 0 ? cell.matrixSize - 1 - cell.row : cell.row,
    }),
  ),
  "neon-drift": createDotMatrixLoaderSpec("dotm-square-1", "diagonal-alt-sweep", (cell) =>
    createClassCellAnimation("dotm-square-1", "diagonal-alt-sweep", "dmx-diagonal-alt-sweep", "dmx-diagonal-alt-sweep", 1500, {
      "--dmx-diagonal-parity": (cell.row + cell.col) % 2,
      "--dmx-path": trBlPathNormFromIndex(cell),
    }),
  ),
  "radial-expand": createDotMatrixLoaderSpec("dotm-square-21", "radial-expand", (cell) =>
    createClassCellAnimation("dotm-square-21", "radial-expand", "dmx-radial-expand", "dmx-radial-expand", 1500, {
      "--dmx-radial-radius": radialDistanceFromCenter(cell),
    }),
  ),
  "diamond-expand": createDotMatrixLoaderSpec("dotm-square-23", "diamond-expand", (cell) =>
    createClassCellAnimation("dotm-square-23", "diamond-expand", "dmx-diamond-expand", "dmx-diamond-expand", 1500, {
      "--dmx-diamond-progress": getShapeExpansionProgress(cell, diamondExpansionMetric, diamondMaxExpansionMetric),
    }),
  ),
  "heart-expand": createDotMatrixLoaderSpec("dotm-square-28", "heart-expand", (cell) =>
    createClassCellAnimation("dotm-square-28", "heart-expand", "dmx-heart-expand", "dmx-heart-expand", 1500, {
      "--dmx-heart-progress": getShapeExpansionProgress(cell, heartExpansionMetric, heartMaxExpansionMetric),
    }),
  ),
  "star-expand": createDotMatrixLoaderSpec("dotm-square-30", "star-expand", (cell) =>
    createClassCellAnimation("dotm-square-30", "star-expand", "dmx-star-expand", "dmx-star-expand", 1500, {
      "--dmx-star-progress": getShapeExpansionProgress(cell, starExpansionMetric, starMaxExpansionMetric),
    }),
  ),
  "chevron-sweep": createDotMatrixLoaderSpec("dotm-square-26", "chevron-sweep", (cell) =>
    createClassCellAnimation("dotm-square-26", "chevron-sweep", "dmx-chevron-sweep", "dmx-chevron-sweep", 1500, {
      "--dmx-chevron-distance": chevronDistance(cell),
    }),
  ),
}

function createDotMatrixLoaderSpec(
  upstreamLoader: DotMatrixSquareLoaderId,
  topology: string,
  resolve: DotMatrixLoaderResolver,
): DotMatrixLoaderSpec {
  return {
    resolve: (cell) => resolve(cell, upstreamLoader, topology),
    topology,
    upstreamLoader,
  }
}

function createClassCellAnimation(
  upstreamLoader: DotMatrixSquareLoaderId,
  topology: string,
  upstreamClass: string,
  keyframes: string,
  durationMs: number,
  styleVars: Record<string, number | string>,
  timingFunction = "linear",
): DotMatrixCellAnimation {
  return {
    active: true,
    durationMs,
    keyframes,
    styleVars,
    timingFunction,
    topology,
    upstreamClass,
    upstreamLoader,
  }
}

function createQuietCellAnimation(
  upstreamLoader: DotMatrixSquareLoaderId,
  topology: string,
): DotMatrixCellAnimation {
  return {
    active: false,
    durationMs: 1500,
    keyframes: `${upstreamLoader}-quiet`,
    timingFunction: "linear",
    topology,
    upstreamLoader,
  }
}

function createDotMatrixModule(
  shape: SVGElement,
  coordinates: DotMatrixCoordinates,
  metrics: DotMatrixMetrics,
  matrixSize: number,
): DotMatrixModule {
  const centerRow = metrics.maxRow / 2
  const centerCol = metrics.maxCol / 2
  const distance = Math.hypot(coordinates.row - centerRow, coordinates.col - centerCol)
  const maxDistance = Math.max(1, Math.hypot(centerRow, centerCol))
  const angle = Math.atan2(coordinates.row - centerRow, coordinates.col - centerCol)
  const index = coordinates.row * (metrics.maxCol + 1) + coordinates.col
  const outlineDistance = Math.min(
    coordinates.row,
    coordinates.col,
    metrics.maxRow - coordinates.row,
    metrics.maxCol - coordinates.col,
  )
  const maxOutlineDistance = Math.max(1, Math.min(centerRow, centerCol))
  const perimeterIndex = getDotMatrixPerimeterIndex(coordinates, metrics)
  const colN = metrics.maxCol > 0 ? coordinates.col / metrics.maxCol : 0
  const rowN = metrics.maxRow > 0 ? coordinates.row / metrics.maxRow : 0
  const regionCol = getDotMatrixRegionCoordinate(colN, matrixSize)
  const regionRow = getDotMatrixRegionCoordinate(rowN, matrixSize)

  return {
    ...coordinates,
    angle,
    colN,
    diagonal:
      rowN +
      colN,
    distance,
    distanceN: distance / maxDistance,
    hash: getDotMatrixHash01(index, coordinates.row + coordinates.col * 17),
    index,
    matrixSize,
    outline: outlineDistance,
    outlineN: outlineDistance / maxOutlineDistance,
    perimeterIndex,
    regionCol,
    regionIndex: regionRow * matrixSize + regionCol,
    regionRow,
    ring: getDotMatrixRing(coordinates, metrics),
    rowN,
    shape,
  }
}

function createDotMatrixLoaderTracks(
  modules: DotMatrixModule[],
  animation: QrDotMatrixAnimationOptions,
  matrixSize: number,
) {
  const spec = DOT_MATRIX_LOADER_SPECS[animation.loader] ?? DOT_MATRIX_LOADER_SPECS["neon-drift"]
  const tracks = new Map<string, DotMatrixTrack>()
  const speedMultiplier = getDotMatrixAnimationSpeedMultiplier(animation)
  const activePatternIndexes = new Set(getDotMatrixPatternIndexes(animation.pattern, matrixSize))

  for (const qrModule of modules) {
    const cell = getDotMatrixCell(qrModule)
    const resolved = activePatternIndexes.has(cell.index)
      ? spec.resolve(cell)
      : createQuietCellAnimation(spec.upstreamLoader, spec.topology)
    const assignment = {
      ...resolved,
      durationMs: Math.round(resolved.durationMs * speedMultiplier),
    }
    const trackIndex = assignment.active ? tracks.size : DOT_MATRIX_QUIET_TRACK_INDEX
    const styleVars = assignment.styleVars ?? {}
    const upstreamClass = assignment.upstreamClass ?? ""
    const trackKey = [
      assignment.active ? "active" : "quiet",
      assignment.upstreamLoader,
      assignment.topology,
      upstreamClass,
      assignment.keyframes,
      assignment.durationMs,
      assignment.timingFunction,
      assignment.opacity ?? "",
      stableDotMatrixStyleVarSignature(styleVars),
    ].join(":")
    const existing = tracks.get(trackKey)
    const region = `${qrModule.regionCol},${qrModule.regionRow}`

    if (existing) {
      existing.modules.push(qrModule)
      if (!existing.region.split(" ").includes(region)) {
        existing.region = `${existing.region} ${region}`
      }
      continue
    }

    tracks.set(trackKey, {
      durationMs: assignment.durationMs,
      index: trackIndex,
      keyframes: assignment.keyframes,
      modules: [qrModule],
      opacity: assignment.opacity,
      region,
      speedMultiplier,
      state: assignment.active ? "active" : "quiet",
      styleVars,
      timingFunction: assignment.timingFunction,
      topology: assignment.topology,
      upstreamClass: assignment.upstreamClass,
      upstreamLoader: assignment.upstreamLoader,
    })
  }

  return tracks
}

function getDotMatrixRegionCoordinate(value: number, matrixSize: number) {
  return Math.min(
    matrixSize - 1,
    Math.max(0, Math.floor(clampDotMatrixUnit(value) * matrixSize)),
  )
}

function getDotMatrixCell(module: DotMatrixModule): DotMatrixCell {
  return {
    col: module.regionCol,
    index: module.regionIndex,
    matrixSize: module.matrixSize,
    row: module.regionRow,
  }
}

function rowMajorIndex(row: number, col: number, matrixSize = DEFAULT_DOT_MATRIX_TILE_SIZE) {
  return row * matrixSize + col
}

function indexToCoord(index: number, matrixSize = DEFAULT_DOT_MATRIX_TILE_SIZE): DotMatrixCell {
  return {
    col: index % matrixSize,
    index,
    matrixSize,
    row: Math.floor(index / matrixSize),
  }
}

function findDotMatrixCellIndex(
  path: ReadonlyArray<readonly [number, number]>,
  col: number,
  row: number,
) {
  return path.findIndex(([pathCol, pathRow]) => pathCol === col && pathRow === row)
}

function getDotMatrixCenter(matrixSize: number) {
  return (matrixSize - 1) / 2
}

function radialDistanceFromCenter(cell: DotMatrixCell) {
  const center = getDotMatrixCenter(cell.matrixSize)
  return Math.hypot(cell.row - center, cell.col - center)
}

function getShapeExpansionProgress(
  cell: DotMatrixCell,
  metricAt: (row: number, col: number, matrixSize: number) => number,
  maxMetricAt: (matrixSize: number) => number,
) {
  const maxMetric = maxMetricAt(cell.matrixSize)
  return maxMetric > 0 ? metricAt(cell.row, cell.col, cell.matrixSize) / maxMetric : 0
}

function chevronDistance(cell: DotMatrixCell) {
  const center = getDotMatrixCenter(cell.matrixSize)
  return cell.matrixSize - 1 - cell.row + Math.abs(cell.col - center)
}

function trBlPathNormFromIndex(cell: DotMatrixCell) {
  const { col, matrixSize, row } = cell

  return (row + (matrixSize - 1 - col)) / ((matrixSize - 1) * 2)
}

type DotMatrixPatternCellContext = {
  row: number
  col: number
  center: number
  distance: number
  manhattan: number
  angle: number
  onEdge: boolean
  diamondRadius: number
}

const DOT_MATRIX_PATTERN_PREDICATES: Record<
  QrDotMatrixAnimationOptions["pattern"],
  (cell: DotMatrixPatternCellContext) => boolean
> = {
  full: () => true,
  diamond: (c) => c.manhattan <= c.diamondRadius,
  outline: (c) => c.onEdge,
  cross: (c) => Math.abs(c.row - c.center) < 0.5 || Math.abs(c.col - c.center) < 0.5,
  rings: (c) => c.distance >= 1 || c.onEdge,
  rose: (c) => Math.abs(Math.sin(3 * c.angle)) > 0.5 && c.distance >= 1,
}

function getDotMatrixPatternIndexes(pattern: QrDotMatrixAnimationOptions["pattern"], matrixSize: number) {
  const indexes: number[] = []
  const center = getDotMatrixCenter(matrixSize)
  const diamondRadius = Math.max(2, Math.floor(matrixSize / 2))
  const predicate = DOT_MATRIX_PATTERN_PREDICATES[pattern]

  for (let row = 0; row < matrixSize; row += 1) {
    for (let col = 0; col < matrixSize; col += 1) {
      const active = predicate({
        row,
        col,
        center,
        distance: Math.hypot(row - center, col - center),
        manhattan: Math.abs(row - center) + Math.abs(col - center),
        angle: Math.atan2(row - center, col - center),
        onEdge: row === 0 || col === 0 || row === matrixSize - 1 || col === matrixSize - 1,
        diamondRadius,
      })

      if (active) {
        indexes.push(rowMajorIndex(row, col, matrixSize))
      }
    }
  }

  return indexes
}

function stableDotMatrixStyleVarSignature(styleVars: Record<string, number | string>) {
  return Object.keys(styleVars)
    .sort()
    .map((key) => `${key}=${styleVars[key]}`)
    .join(";")
}

function getDotMatrixPerimeterIndex(
  coordinates: DotMatrixCoordinates,
  metrics: DotMatrixMetrics,
) {
  const { col, row } = coordinates

  if (row === 0) {
    return col
  }

  if (col === metrics.maxCol) {
    return metrics.maxCol + row
  }

  if (row === metrics.maxRow) {
    return metrics.maxCol + metrics.maxRow + (metrics.maxCol - col)
  }

  if (col === 0) {
    return metrics.maxCol * 2 + metrics.maxRow + (metrics.maxRow - row)
  }

  return -1
}

function getDotMatrixRing(coordinates: DotMatrixCoordinates, metrics: DotMatrixMetrics) {
  return Math.min(
    coordinates.row,
    coordinates.col,
    metrics.maxRow - coordinates.row,
    metrics.maxCol - coordinates.col,
  )
}

function getDotMatrixHash01(index: number, salt = 1) {
  const hash =
    (Math.imul(index + 1, 2654435761) ^
      Math.imul(index + salt + 7, 2246822519) ^
      Math.imul(salt + 3, 3266489917)) >>>
    0

  return (hash % 1000) / 1000
}

function clampDotMatrixUnit(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.min(0.999, value))
}

function getDotMatrixTrackStyle(track: DotMatrixTrack) {
  const style = [
    `--qr-dot-track:${track.index}`,
    `--qr-dot-duration-ms:${track.durationMs}`,
    `--qr-dot-speed-multiplier:${formatSvgNumber(track.speedMultiplier)}`,
    `--qr-dot-easing:${track.timingFunction}`,
    `--qr-dot-keyframes-name:${track.keyframes}`,
    ...Object.entries(track.styleVars).map(([key, value]) => `${key}:${value}`),
  ]

  if (track.opacity !== undefined) {
    style.push(`opacity:${formatSvgNumber(track.opacity)}`)
  }

  return style.join(";")
}

function getDotMatrixCoverRect(
  svg: SVGElement,
  options: QrSvgExtensionOptions,
  metrics: DotMatrixMetrics,
) {
  const width =
    Number(options.width) ||
    Number(svg.getAttribute("width")) ||
    Math.max(metrics.maxX, metrics.originX + metrics.cellSize)
  const height =
    Number(options.height) ||
    Number(svg.getAttribute("height")) ||
    Math.max(metrics.maxY, metrics.originY + metrics.cellSize)

  return {
    height,
    width,
    x: 0,
    y: 0,
  }
}

function applyDotMatrixOverlayScale(
  shape: SVGElement,
  metrics: DotMatrixMetrics,
  overlayScale: number,
) {
  const scale = overlayScale / 100

  if (!Number.isFinite(scale) || Math.abs(scale - 1) < 0.001) {
    return
  }

  const anchor = getDotMatrixAnchor(shape)

  if (!anchor) {
    return
  }

  const size = anchor.size ?? metrics.cellSize
  const centerX = anchor.x + size / 2
  const centerY = anchor.y + size / 2
  const existingTransform = shape.getAttribute("transform")
  const scaleTransform = [
    `translate(${formatSvgNumber(centerX)} ${formatSvgNumber(centerY)})`,
    `scale(${formatSvgNumber(scale)})`,
    `translate(${formatSvgNumber(-centerX)} ${formatSvgNumber(-centerY)})`,
  ].join(" ")

  shape.setAttribute(
    "transform",
    existingTransform ? `${existingTransform} ${scaleTransform}` : scaleTransform,
  )
}

function resolveDotMatrixColors(state: QraftyState) {
  const animation = state.dotMatrixAnimation

  return resolveMotionColors(animation, state.dataModulesSettings.color)
}

function createGeneratedDotMatrixKeyframes(
  name: string,
  upstreamLoader: DotMatrixSquareLoaderId,
  region: string,
) {
  const [col = 0, row = 0] = region.split(" ")[0]?.split(",").map(Number) ?? []
  const matrixSize = getMatrixSizeFromRegion(region)
  const samples = getGeneratedDotMatrixOpacitySamples(upstreamLoader, {
    col,
    index: rowMajorIndex(row, col, matrixSize),
    matrixSize,
    row,
  })

  return createDotMatrixOpacityKeyframes(name, samples)
}

function getMatrixSizeFromRegion(region: string) {
  return region
    .split(" ")
    .flatMap((coordinate) => coordinate.split(",").map(Number))
    .filter(Number.isFinite)
    .reduce((max, value) => Math.max(max, value + 1), DEFAULT_DOT_MATRIX_TILE_SIZE)
}

function getGeneratedDotMatrixOpacitySamples(
  _upstreamLoader: DotMatrixSquareLoaderId,
  _cell: DotMatrixCell,
) {
  return [0.08, 1, 0.32, 0.08]
}

function createDotMatrixOpacityKeyframes(name: string, samples: number[]) {
  const last = Math.max(1, samples.length - 1)
  const frames = samples.map((opacity, index) => {
    const percent = formatSvgNumber((index / last) * 100)

    const anchor = getDotMatrixAnchorValue(opacity)

    return `${percent}% { opacity: var(--qr-dot-matrix-opacity-${anchor}); fill: var(--qr-dot-matrix-color-${anchor}); }`
  })

  return `@keyframes ${name} { ${frames.join(" ")} }`
}

function getDotMatrixAnchorValue(sourceOpacity: number) {
  if (!Number.isFinite(sourceOpacity) || sourceOpacity <= 0.08) {
    return "base"
  }

  if (sourceOpacity >= 0.94) {
    return "peak"
  }

  return "peak"
}

const SOFT_ECHO_WAVE_KEYFRAME_BODY =
  "0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 20% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 82%, var(--qr-dot-matrix-color-peak)); } 32% { opacity: var(--qr-dot-matrix-opacity-peak); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 28%, var(--qr-dot-matrix-color-peak)); } 45% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 58%, var(--qr-dot-matrix-color-peak)); } 58% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 72%, var(--qr-dot-matrix-color-peak)); } 72% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 88%, var(--qr-dot-matrix-color-peak)); }"

const SOFT_COLOR_WAVE_KEYFRAME_BODY =
  "0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 24% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 84%, var(--qr-dot-matrix-color-peak)); } 38% { opacity: var(--qr-dot-matrix-opacity-peak); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 32%, var(--qr-dot-matrix-color-peak)); } 54% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 62%, var(--qr-dot-matrix-color-peak)); } 68% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 78%, var(--qr-dot-matrix-color-peak)); }"

function createDotMatrixAnimationStyle(document: Document, tracks: DotMatrixTrack[]) {
  const style = document.createElementNS(SVG_NS, "style")
  const generatedKeyframes = tracks
    .flatMap((track) =>
      track.state === "active" && track.keyframes.includes("-dotm-square-")
        ? [
            createGeneratedDotMatrixKeyframes(
              track.keyframes,
              track.upstreamLoader,
              track.region,
            ),
          ]
        : [],
    )
    .join("\n")

  style.setAttribute("data-qr-layer", "dot-matrix-animation")
  style.textContent = `
.qr-dot-matrix-layer {
  pointer-events: none;
}
.qr-dot-matrix-track {
  animation-duration: calc(var(--qr-dot-duration-ms, 2200) * 1ms);
  animation-iteration-count: infinite;
  animation-name: var(--qr-dot-keyframes-name);
  animation-timing-function: var(--qr-dot-easing, ease-in-out);
  fill: var(--qr-dot-matrix-color-base);
  filter: drop-shadow(0 0 3px var(--qr-dot-matrix-color));
  opacity: var(--qr-dot-matrix-opacity-base);
  transform-box: fill-box;
  transform-origin: center;
}
.qr-dot-matrix-track-quiet {
  animation: none !important;
  opacity: var(--qr-dot-matrix-opacity-base);
  filter: none;
}
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-diagonal-alt-sweep"] { animation-delay: calc((var(--dmx-path, 0) + var(--dmx-diagonal-parity, 0) * .08) * -1.5s * var(--qr-dot-speed-multiplier, 1)); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-square6-col-snake"] { animation-delay: calc(var(--dmx-col-pos, 0) * -110ms * var(--qr-dot-speed-multiplier, 1)); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-radial-expand"] { animation-delay: calc(var(--dmx-radial-radius, 0) * -120ms * var(--qr-dot-speed-multiplier, 1)); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-diamond-expand"] { animation-delay: calc(var(--dmx-diamond-progress, 0) * -630ms * var(--qr-dot-speed-multiplier, 1)); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-heart-expand"] { animation-delay: calc(var(--dmx-heart-progress, 0) * -630ms * var(--qr-dot-speed-multiplier, 1)); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-star-expand"] { animation-delay: calc(var(--dmx-star-progress, 0) * -630ms * var(--qr-dot-speed-multiplier, 1)); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-chevron-sweep"] { animation-delay: calc(var(--dmx-chevron-distance, 0) * -110ms * var(--qr-dot-speed-multiplier, 1)); }
@keyframes qr-dot-loader-legacy { 0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 50% { opacity: var(--qr-dot-matrix-opacity-peak); fill: var(--qr-dot-matrix-color-peak); } }
@keyframes dmx-diagonal-alt-sweep { ${SOFT_COLOR_WAVE_KEYFRAME_BODY} }
@keyframes dmx-square6-col-snake { ${SOFT_COLOR_WAVE_KEYFRAME_BODY} }
@keyframes dmx-radial-expand { ${SOFT_ECHO_WAVE_KEYFRAME_BODY} }
@keyframes dmx-diamond-expand { ${SOFT_ECHO_WAVE_KEYFRAME_BODY} }
@keyframes dmx-heart-expand { ${SOFT_ECHO_WAVE_KEYFRAME_BODY} }
@keyframes dmx-star-expand { ${SOFT_ECHO_WAVE_KEYFRAME_BODY} }
@keyframes dmx-chevron-sweep { ${SOFT_COLOR_WAVE_KEYFRAME_BODY} }
${generatedKeyframes}
@media (prefers-reduced-motion: reduce) {
  .qr-dot-matrix-layer {
    display: none;
  }
  .qr-dot-matrix-track {
    animation: none;
    opacity: 0;
  }
}`

  return style
}

function findDotMatrixLayerAnchor(svg: SVGElement) {
  return Array.from(svg.children).find((child) => {
    if (!isSvgElementLike(child)) {
      return false
    }

    return child.tagName.toLowerCase() === "image"
  }) ?? null
}

function collectModuleUnifiedFillTargets(svg: SVGElement) {
  const dotClipLayers = getQrModuleClipLayers(svg)
  const dotPathLayers = getQrModulePathLayers(svg)
  const modulePaintTargets: SVGElement[] = [
    ...dotClipLayers.map((layer) => layer.element),
    ...dotPathLayers.map((layer) => layer.element),
  ]
  const moduleClipShapes = [
    ...dotClipLayers.flatMap((layer) => layer.shapes),
    ...dotPathLayers.flatMap((layer) => layer.shapes),
  ]

  const dataModulesNode = svg.querySelector('[data-testid="data-modules"]')
  const dataModules = isSvgElementLike(dataModulesNode) ? dataModulesNode : null

  if (modulePaintTargets.length === 0 && dataModules) {
    modulePaintTargets.push(dataModules)
  }

  if (moduleClipShapes.length === 0 && dataModules) {
    const pathData = dataModules.getAttribute("d")
    const document = svg.ownerDocument

    if (pathData && document) {
      const fallbackShape = document.createElementNS(SVG_NS, "path")
      fallbackShape.setAttribute("d", pathData)
      moduleClipShapes.push(fallbackShape)
    }
  }

  return { moduleClipShapes, modulePaintTargets }
}

function createUnifiedImageExtension(
  state: Pick<QraftyState, "dotsColorMode" | "margin" | "moduleFillImage">,
): QrSvgExtensionFunction {
  return (svg) => {
    removeLegacyDotGradientOverlay(svg)

    const imageHref = getAssetValue(state.moduleFillImage)

    if (!imageHref) {
      return
    }

    const { moduleClipShapes, modulePaintTargets } = collectModuleUnifiedFillTargets(svg)

    applyUnifiedQrImageFill(svg, {
      imageHref,
      imageId: "unified-image-definition",
      imageLayer: "unified-image-definition",
      margin: state.margin,
      moduleClipShapes,
      modulePaintTargets,
    })
  }
}

function createUnifiedGradientExtension(
  state: Pick<
    QraftyState,
    "gradientLinkMode" | "dotsColorMode" | "dataModulesGradient" | "margin"
  >,
): QrSvgExtensionFunction {
  return (svg) => {
    removeLegacyDotGradientOverlay(svg)

    const dotClipLayers = getQrModuleClipLayers(svg)
    const dotPathLayers = getQrModulePathLayers(svg)
    const modulePaintTargets: SVGElement[] = [
      ...dotClipLayers.map((layer) => layer.element),
      ...dotPathLayers.map((layer) => layer.element),
    ]

    if (modulePaintTargets.length === 0) {
      const dataModules = svg.querySelector('[data-testid="data-modules"]')

      if (isSvgElementLike(dataModules)) {
        modulePaintTargets.push(dataModules)
      }
    }

    applyUnifiedQrGradientFill(svg, {
      gradient: {
        type: state.dataModulesGradient.type,
        rotation: state.dataModulesGradient.rotation,
        center:
          state.dataModulesGradient.type === "radial"
            ? state.dataModulesGradient.center
            : undefined,
        stops: [
          {
            color: state.dataModulesGradient.colorStops[0]?.color ?? "#000000",
            offset: state.dataModulesGradient.colorStops[0]?.offset ?? 0,
          },
          {
            color: state.dataModulesGradient.colorStops[1]?.color ?? "#ffffff",
            offset: state.dataModulesGradient.colorStops[1]?.offset ?? 1,
          },
        ],
      },
      gradientId: "unified-gradient-definition",
      gradientLayer: "unified-gradient-definition",
      margin: state.margin,
      modulePaintTargets,
    })
  }
}

function coerceQrMarginCells(margin: number) {
  return Math.min(80, Math.max(0, Math.floor(Number.isFinite(margin) ? margin : 12)))
}

/**
 * QR svg children are authored in module-cell units (viewBox = numCells), while
 * shape options are pixel values. Metrics are computed in cell space so the
 * background shape, quiet zone, and stroke align with the encoded modules.
 */
function getCellSpaceBackgroundMetrics(
  svg: SVGElement,
  options: QrSvgExtensionOptions,
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>,
  layout: {
    contentFrame?: QrBackgroundShapeContentFrame
    marginCells: number
    viewBox?: { height: number; width: number }
  },
) {
  const innerWidth = options.width ?? 300
  const innerHeight = options.height ?? 300
  const numCells = getQrSvgNumCells(svg)

  if (numCells === null || numCells <= 0 || innerWidth <= 0) {
    return {
      metrics: getBackgroundRenderMetrics(innerWidth, innerHeight, shapeOptions),
      shapeOptions,
    }
  }

  const cellScale = numCells / innerWidth
  const cellShapeOptions = scaleQrBackgroundShapeOptions(shapeOptions, cellScale)

  return {
    metrics: getBackgroundRenderMetrics(
      numCells,
      numCells,
      cellShapeOptions,
      {
        contentFrame: layout.contentFrame,
        quietZoneFraction: layout.marginCells / numCells,
        viewBox: layout.viewBox,
      },
    ),
    shapeOptions: cellShapeOptions,
  }
}

function createBackgroundShapeExtension(
  shape: QrBackgroundShapeDefinition,
  state: Pick<
    QraftyState,
    "backgroundGradient" | "backgroundOptions" | "backgroundShapeOptions" | "margin"
  >,
): QrSvgExtensionFunction {
  return (svg, options) => {
    const document = svg.ownerDocument

    if (!document) {
      return
    }

    svg.querySelectorAll('[data-qr-layer="background-shape"]').forEach((node) => {
      node.remove()
    })
    svg.querySelectorAll('[data-qr-layer="background-shape-stroke"]').forEach((node) => {
      node.remove()
    })
    svg.querySelectorAll('[data-qr-layer="background-shape-gradient"]').forEach((node) => {
      node.remove()
    })
    svg.querySelectorAll('[data-qr-layer="background-shape-blur"]').forEach((node) => {
      node.remove()
    })
    svg.querySelectorAll('[data-qr-layer="background-shape-blur-filter"]').forEach((node) => {
      node.remove()
    })

    const { metrics, shapeOptions } = getCellSpaceBackgroundMetrics(
      svg,
      options,
      normalizeBackgroundShapeOptions(state.backgroundShapeOptions),
      {
        contentFrame: getQrBackgroundShapeContentFrame(shape),
        marginCells: coerceQrMarginCells(state.margin),
        viewBox: shape.viewBox,
      },
    )
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    const transform = getBackgroundShapeTransform(
      shape,
      metrics.backingRegion,
      shapeOptions,
    )
    const fill = getBackgroundShapeFill(svg, state, metrics.outerWidth, metrics.outerHeight)

    applySvgRenderBounds(svg, metrics)
    const insertReference = wrapQrContent(
      svg,
      metrics.translateX,
      metrics.translateY,
      metrics.contentScale,
    )

    path.setAttribute("data-qr-layer", "background-shape")
    path.setAttribute("d", shape.path)
    path.setAttribute("transform", transform)
    path.setAttribute("fill", fill)
    const strokedShape = applyBackgroundShapeStroke(
      path,
      shapeOptions,
      svg,
      "clip-path-background-shape-stroke",
      "background-shape-stroke",
      Math.min(
        metrics.backingRegion.width / shape.viewBox.width,
        metrics.backingRegion.height / shape.viewBox.height,
      ),
    )

    const blurPath = createBackgroundShapeBlurPath({
      d: shape.path,
      metrics,
      shapeOptions,
      svg,
      transform,
    })

    if (blurPath) {
      svg.insertBefore(blurPath, insertReference)
    }

    svg.insertBefore(strokedShape ?? path, insertReference)
  }
}

function normalizeBackgroundShapeOptions(
  options:
    | (Partial<QraftyState["backgroundShapeOptions"]> & {
        sizePercent?: number
      })
    | undefined,
) {
  const legacyPaddingPx =
    options?.paddingPx === undefined && typeof options?.sizePercent === "number"
      ? getLegacyBackgroundShapePaddingPx(options.sizePercent)
      : undefined
  const numField = (
    key: keyof typeof DEFAULT_BACKGROUND_SHAPE_OPTIONS,
    normalize: (value: number, fallback: number) => number,
    fallbackOverride?: number,
  ) => {
    const fallback = DEFAULT_BACKGROUND_SHAPE_OPTIONS[key] as number
    return normalize((options?.[key] as number | undefined) ?? fallbackOverride ?? fallback, fallback)
  }

  return {
    ...DEFAULT_BACKGROUND_SHAPE_OPTIONS,
    ...options,
    edgeBlur: numField("edgeBlur", coerceNonNegativeSvgNumber),
    paddingPx: numField("paddingPx", coerceNonNegativeSvgNumber, legacyPaddingPx),
    shadowColor: options?.shadowColor ?? DEFAULT_BACKGROUND_SHAPE_OPTIONS.shadowColor,
    shadowOffsetX: numField("shadowOffsetX", clampBackgroundShapeOffset),
    shadowOffsetY: numField("shadowOffsetY", clampBackgroundShapeOffset),
    shadowOpacity: numField("shadowOpacity", clampBackgroundShapeOpacity),
    strokeOpacity: numField("strokeOpacity", clampBackgroundShapeOpacity),
    strokeWidth: numField("strokeWidth", coerceNonNegativeSvgNumber),
    tiltX: numField("tiltX", clampBackgroundShapeTilt),
    tiltY: numField("tiltY", clampBackgroundShapeTilt),
  }
}

function coerceNonNegativeSvgNumber(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, value)
}

function getLegacyBackgroundShapePaddingPx(sizePercent: number) {
  if (!Number.isFinite(sizePercent) || sizePercent <= 100) {
    return 0
  }

  return clampBackgroundShapePaddingPx(((sizePercent - 100) / 200) * 240)
}

function applyBackgroundShapeStroke(
  element: Element,
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>,
  svg: SVGElement,
  clipPathId: string,
  strokeLayerTag: string,
  strokeScale = 1,
) {
  if (shapeOptions.strokeWidth <= 0) {
    element.removeAttribute("stroke")
    element.removeAttribute("stroke-width")
    element.removeAttribute("stroke-opacity")
    element.removeAttribute("stroke-linejoin")
    return null
  }

  const renderedStrokeWidth =
    shapeOptions.strokeWidth / Math.max(0.000001, strokeScale)

  element.setAttribute("stroke", shapeOptions.strokeColor)
  element.setAttribute("stroke-opacity", formatSvgNumber(shapeOptions.strokeOpacity / 100))
  element.setAttribute("stroke-linejoin", "round")

  const ownerDocument = svg.ownerDocument

  if (!ownerDocument) {
    element.setAttribute("stroke-width", formatSvgNumber(renderedStrokeWidth))
    return null
  }

  element.setAttribute("stroke-width", formatSvgNumber(renderedStrokeWidth * 2))

  const clipPath = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "clipPath")
  const clipShape = element.cloneNode(false) as Element

  clipPath.setAttribute("id", clipPathId)
  clipPath.setAttribute("data-qr-layer", strokeLayerTag)
  clipShape.setAttribute("data-qr-layer", strokeLayerTag)
  clipShape.removeAttribute("clip-path")
  clipShape.removeAttribute("stroke")
  clipShape.removeAttribute("stroke-width")
  clipShape.removeAttribute("stroke-opacity")
  clipShape.removeAttribute("stroke-linejoin")
  clipPath.appendChild(clipShape)
  getOrCreateSvgDefs(svg).appendChild(clipPath)

  const group = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "g")
  group.setAttribute("clip-path", `url(#${clipPathId})`)
  group.setAttribute("data-qr-layer", strokeLayerTag)
  group.appendChild(element)

  return group
}

function hasActiveBackgroundSurfaceOptions(
  options: Partial<QraftyState["backgroundShapeOptions"]> | undefined,
) {
  return hasActiveBackgroundShapeOptions(normalizeBackgroundShapeOptions(options))
}

type BackgroundRenderMetrics = {
  backingRegion: {
    height: number
    width: number
    x: number
    y: number
  }
  contentScale: number
  outerHeight: number
  outerWidth: number
  translateX: number
  translateY: number
}

type BackgroundShapeLayout = {
  contentFrame?: QrBackgroundShapeContentFrame
  quietZoneFraction?: number
  viewBox?: { height: number; width: number; x?: number; y?: number }
}

const MIN_QR_CONTENT_TARGET = 8

function getBackgroundRenderMetrics(
  width: number,
  height: number,
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>,
  layout?: BackgroundShapeLayout,
): BackgroundRenderMetrics {
  const quietZoneFraction = Math.min(
    0.49,
    Math.max(0, layout?.quietZoneFraction ?? 0),
  )
  const inkFraction = 1 - quietZoneFraction * 2
  const contentFrame = layout?.contentFrame
  const viewBox = layout?.viewBox
  let target: { height: number; width: number; x: number; y: number }

  if (viewBox && contentFrame) {
    const shapeScale = Math.min(
      width / Math.max(1, viewBox.width),
      height / Math.max(1, viewBox.height),
    )
    const shapeOffsetX = (width - viewBox.width * shapeScale) / 2
    const shapeOffsetY = (height - viewBox.height * shapeScale) / 2

    target = {
      height: contentFrame.height * shapeScale,
      width: contentFrame.width * shapeScale,
      x: shapeOffsetX + (contentFrame.x - (viewBox.x ?? 0)) * shapeScale,
      y: shapeOffsetY + (contentFrame.y - (viewBox.y ?? 0)) * shapeScale,
    }
  } else {
    target = {
      height,
      width,
      x: 0,
      y: 0,
    }
  }

  const frameSize = Math.min(target.width, target.height)
  const paddingPx = Math.max(
    0,
    Math.min(shapeOptions.paddingPx, (frameSize - MIN_QR_CONTENT_TARGET) / 2),
  )
  const contentTarget = Math.max(
    MIN_QR_CONTENT_TARGET,
    frameSize - paddingPx * 2,
  )
  const contentCenterX = target.x + target.width / 2
  const contentCenterY = target.y + target.height / 2
  const renderedSpan = contentTarget / Math.max(0.01, inkFraction)

  return {
    backingRegion: {
      height,
      width,
      x: 0,
      y: 0,
    },
    contentScale: renderedSpan / Math.max(1, width),
    outerHeight: height,
    outerWidth: width,
    translateX: contentCenterX - renderedSpan / 2,
    translateY: contentCenterY - renderedSpan / 2,
  }
}

function getBackgroundRenderLayout(
  state: Pick<
    QraftyState,
    | "backgroundShapeId"
    | "data"
    | "margin"
    | "qrOptions"
    | "valueSegments"
  >,
): BackgroundShapeLayout {
  const shape = getQrBackgroundShapeDefinition(state.backgroundShapeId)

  return {
    contentFrame: shape ? getQrBackgroundShapeContentFrame(shape) : undefined,
    quietZoneFraction: getQraftyQrQuietZoneFraction(state),
    viewBox: shape?.viewBox,
  }
}

export function getQrRenderedDimensions(
  state: Pick<
    QraftyState,
    | "backgroundImage"
    | "backgroundShapeId"
    | "backgroundShapeOptions"
    | "data"
    | "height"
    | "margin"
    | "qrOptions"
    | "valueSegments"
    | "width"
  >,
) {
  return {
    height: clampQrSize(state.height),
    width: clampQrSize(state.width),
  }
}

export type DraftingQrLayerLayout = {
  innerHeight: number
  innerWidth: number
  metrics: BackgroundRenderMetrics
  scale: number
  shapeOptions: QraftyState["backgroundShapeOptions"]
}

export function getDraftingQrLayerLayout(
  layerWidth: number,
  state: Pick<
    QraftyState,
    | "backgroundImage"
    | "backgroundShapeId"
    | "backgroundShapeOptions"
    | "data"
    | "height"
    | "margin"
    | "qrOptions"
    | "valueSegments"
    | "width"
  >,
  layerHeight?: number,
): DraftingQrLayerLayout {
  const naturalOuter = getQrRenderedDimensions(state)
  const targetHeight =
    layerHeight ??
    (naturalOuter.width > 0 ? layerWidth * (naturalOuter.height / naturalOuter.width) : layerWidth)
  const scale = naturalOuter.width > 0 ? layerWidth / naturalOuter.width : 1
  const shapeOptions = scaleQrBackgroundShapeOptions(state.backgroundShapeOptions, scale)
  const metrics = getBackgroundRenderMetrics(
    layerWidth,
    targetHeight,
    normalizeBackgroundShapeOptions(shapeOptions),
    getBackgroundRenderLayout(state),
  )
  const innerSpan = Math.max(1, metrics.contentScale * layerWidth)

  return {
    innerHeight: innerSpan,
    innerWidth: innerSpan,
    metrics,
    scale,
    shapeOptions,
  }
}

export function getDraftingQrDomPlacementStyle(
  layout: Pick<DraftingQrLayerLayout, "innerHeight" | "innerWidth" | "metrics">,
): CSSProperties {
  const { metrics, innerWidth, innerHeight } = layout
  const outerWidth = Math.max(1, metrics.outerWidth)
  const outerHeight = Math.max(1, metrics.outerHeight)

  return {
    height: `${(innerHeight / outerHeight) * 100}%`,
    left: `${(metrics.translateX / outerWidth) * 100}%`,
    position: "absolute",
    top: `${(metrics.translateY / outerHeight) * 100}%`,
    width: `${(innerWidth / outerWidth) * 100}%`,
  }
}

/** Stretch outer-metrics QR DOM coords to fill the drafting layer box. */
function getDraftingQrDomStretchScale(
  layer: Pick<{ height: number; width: number }, "height" | "width">,
  layout: Pick<DraftingQrLayerLayout, "metrics">,
) {
  const outerWidth = Math.max(1, layout.metrics.outerWidth)
  const outerHeight = Math.max(1, layout.metrics.outerHeight)

  return {
    x: layer.width / outerWidth,
    y: layer.height / outerHeight,
  }
}

export function getDraftingQrBackgroundPathTransform(
  shape: QrBackgroundShapeDefinition,
  backingRegion: BackgroundRenderMetrics["backingRegion"],
  shapeOptions: QraftyState["backgroundShapeOptions"],
) {
  return getBackgroundShapeTransform(
    shape,
    backingRegion,
    normalizeBackgroundShapeOptions(shapeOptions),
  )
}

function scaleQrBackgroundShapeOptions(
  options: QraftyState["backgroundShapeOptions"],
  scale: number,
): QraftyState["backgroundShapeOptions"] {
  const shapeOptions = normalizeBackgroundShapeOptions(options)

  return {
    ...shapeOptions,
    edgeBlur: coerceNonNegativeSvgNumber(shapeOptions.edgeBlur * scale, shapeOptions.edgeBlur),
    paddingPx: coerceNonNegativeSvgNumber(shapeOptions.paddingPx * scale, shapeOptions.paddingPx),
    shadowOffsetX: coerceSvgNumber(shapeOptions.shadowOffsetX * scale, shapeOptions.shadowOffsetX),
    shadowOffsetY: coerceSvgNumber(shapeOptions.shadowOffsetY * scale, shapeOptions.shadowOffsetY),
    strokeWidth: coerceNonNegativeSvgNumber(
      shapeOptions.strokeWidth * scale,
      shapeOptions.strokeWidth,
    ),
  }
}

function applySvgRenderBounds(svg: SVGElement, metrics: BackgroundRenderMetrics) {
  svg.setAttribute("width", formatSvgNumber(metrics.outerWidth))
  svg.setAttribute("height", formatSvgNumber(metrics.outerHeight))
  svg.setAttribute(
    "viewBox",
    `0 0 ${formatSvgNumber(metrics.outerWidth)} ${formatSvgNumber(metrics.outerHeight)}`,
  )
}

function coerceSvgNumber(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return value
}

function wrapQrContent(
  svg: SVGElement,
  translateX: number,
  translateY: number,
  contentScale = 1,
) {
  const hasScale = Math.abs(contentScale - 1) > 1e-9
  const transform = hasScale
    ? `translate(${formatSvgNumber(translateX)} ${formatSvgNumber(translateY)}) scale(${formatSvgNumber(contentScale)})`
    : `translate(${formatSvgNumber(translateX)} ${formatSvgNumber(translateY)})`

  const existingGroup = svg.querySelector('[data-qr-layer="qr-content"]')

  if (existingGroup) {
    existingGroup.setAttribute("transform", transform)
    return existingGroup
  }

  if (!hasScale && translateX === 0 && translateY === 0) {
    return getFirstDrawableSvgChild(svg)
  }

  const document = svg.ownerDocument
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
  const children = Array.from(svg.children).filter(
    (child) =>
      child.tagName.toLowerCase() !== "defs" && !isManagedBackgroundLayer(child),
  )

  group.setAttribute("data-qr-layer", "qr-content")
  group.setAttribute("transform", transform)

  for (const child of children) {
    group.appendChild(child)
  }

  svg.appendChild(group)

  return group
}

function getFirstDrawableSvgChild(svg: SVGElement) {
  return (
    Array.from(svg.children).find(
      (child) =>
        child.tagName.toLowerCase() !== "defs" && !isManagedBackgroundLayer(child),
    ) ?? null
  )
}

function isManagedBackgroundLayer(node: Element) {
  const layer = node.getAttribute("data-qr-layer")

  return Boolean(layer?.startsWith("background-"))
}

function createBackgroundSurfaceExtension(
  state: Pick<
    QraftyState,
    "backgroundGradient" | "backgroundOptions" | "backgroundShapeOptions" | "margin"
  >,
): QrSvgExtensionFunction {
  return (svg, options) => {
    const document = svg.ownerDocument

    if (!document) {
      return
    }

    svg.querySelectorAll('[data-qr-layer="background-surface-blur"]').forEach((node) => {
      node.remove()
    })
    svg.querySelectorAll('[data-qr-layer="background-surface-blur-filter"]').forEach((node) => {
      node.remove()
    })
    svg.querySelectorAll('[data-qr-layer="background-surface-stroke"]').forEach((node) => {
      node.remove()
    })

    const { metrics, shapeOptions } = getCellSpaceBackgroundMetrics(
      svg,
      options,
      normalizeBackgroundShapeOptions(state.backgroundShapeOptions),
      { marginCells: coerceQrMarginCells(state.margin) },
    )
    const region = metrics.backingRegion
    const radius = (Math.min(region.width, region.height) / 2) * state.backgroundOptions.round
    const backgroundRect =
      getQrBackgroundSurfaceRect(svg) ??
      document.createElementNS("http://www.w3.org/2000/svg", "rect")
    const fill = getBackgroundShapeFill(svg, state, metrics.outerWidth, metrics.outerHeight)

    backgroundRect.remove()
    backgroundRect.setAttribute("data-qr-layer", "background-surface")
    backgroundRect.setAttribute("fill", fill)
    backgroundRect.removeAttribute("clip-path")
    applySvgRenderBounds(svg, metrics)
    const insertReference = wrapQrContent(
      svg,
      metrics.translateX,
      metrics.translateY,
      metrics.contentScale,
    )

    applyBackgroundSurfaceRect(backgroundRect, region, radius)
    const strokedSurface = applyBackgroundShapeStroke(
      backgroundRect,
      shapeOptions,
      svg,
      "clip-path-background-surface-stroke",
      "background-surface-stroke",
    )

    const blurRect = createBackgroundSurfaceBlurRect({
      radius,
      region,
      shapeOptions,
      svg,
    })

    if (blurRect) {
      svg.insertBefore(blurRect, insertReference)
    }

    svg.insertBefore(strokedSurface ?? backgroundRect, insertReference)
  }
}

function getQrBackgroundSurfaceRect(svg: SVGElement) {
  return Array.from(svg.children).find(
    (child) =>
      child.tagName.toLowerCase() === "rect" &&
      (child.getAttribute("data-qr-layer") === "background-surface" ||
        child.getAttribute("clip-path")?.includes("clip-path-background-color")),
  )
}

function applyBackgroundSurfaceRect(
  rect: Element,
  region: BackgroundRenderMetrics["backingRegion"],
  radius: number,
) {
  rect.setAttribute("x", formatSvgNumber(region.x))
  rect.setAttribute("y", formatSvgNumber(region.y))
  rect.setAttribute("width", formatSvgNumber(region.width))
  rect.setAttribute("height", formatSvgNumber(region.height))
  rect.setAttribute("rx", formatSvgNumber(radius))
  rect.setAttribute("ry", formatSvgNumber(radius))
}

function createBackgroundSurfaceBlurRect({
  radius,
  region,
  shapeOptions,
  svg,
}: {
  radius: number
  region: BackgroundRenderMetrics["backingRegion"]
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>
  svg: SVGElement
}) {
  if (!hasActiveBackgroundShapeShadow(shapeOptions)) {
    return null
  }

  const document = svg.ownerDocument

  if (!document) {
    return null
  }

  const filterId = "background-surface-blur-filter"
  const filter = createBackgroundShapeShadowFilter({
    filterId,
    layer: "background-surface-blur-filter",
    metrics: {
      height: region.height + shapeOptions.edgeBlur * 4 + Math.abs(shapeOptions.shadowOffsetY),
      width: region.width + shapeOptions.edgeBlur * 4 + Math.abs(shapeOptions.shadowOffsetX),
      x: 0,
      y: 0,
    },
    shapeOptions,
    svg,
  })

  getOrCreateSvgDefs(svg).appendChild(filter)

  const blurRect = document.createElementNS("http://www.w3.org/2000/svg", "rect")

  blurRect.setAttribute("data-qr-layer", "background-surface-blur")
  blurRect.setAttribute("fill", shapeOptions.shadowColor)
  blurRect.setAttribute("filter", `url('#${filterId}')`)
  applyBackgroundShapeShadowSourceStroke(blurRect, shapeOptions)
  applyBackgroundSurfaceRect(blurRect, region, radius)

  return blurRect
}

function createBackgroundShapeBlurPath({
  d,
  metrics,
  shapeOptions,
  svg,
  transform,
}: {
  d: string
  metrics: BackgroundRenderMetrics
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>
  svg: SVGElement
  transform: string
}) {
  if (!hasActiveBackgroundShapeShadow(shapeOptions)) {
    return null
  }

  const document = svg.ownerDocument

  if (!document) {
    return null
  }

  const filterId = "background-shape-blur-filter"
  const filter = createBackgroundShapeShadowFilter({
    filterId,
    layer: "background-shape-blur-filter",
    metrics: {
      height: metrics.outerHeight,
      width: metrics.outerWidth,
      x: 0,
      y: 0,
    },
    shapeOptions,
    svg,
  })

  getOrCreateSvgDefs(svg).appendChild(filter)

  const blurPath = document.createElementNS("http://www.w3.org/2000/svg", "path")

  blurPath.setAttribute("data-qr-layer", "background-shape-blur")
  blurPath.setAttribute("d", d)
  blurPath.setAttribute("fill", shapeOptions.shadowColor)
  blurPath.setAttribute("filter", `url('#${filterId}')`)
  blurPath.setAttribute("transform", transform)
  applyBackgroundShapeShadowSourceStroke(blurPath, shapeOptions)

  return blurPath
}

function hasActiveBackgroundShapeShadow(
  _shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>,
) {
  return false
}

function applyBackgroundShapeShadowSourceStroke(
  node: Element,
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>,
) {
  if (shapeOptions.strokeWidth <= 0) {
    node.removeAttribute("stroke")
    node.removeAttribute("stroke-width")
    node.removeAttribute("stroke-linejoin")
    return
  }

  node.setAttribute("stroke", shapeOptions.shadowColor)
  node.setAttribute("stroke-width", formatSvgNumber(shapeOptions.strokeWidth))
  node.setAttribute("stroke-linejoin", "round")
}

function createBackgroundShapeShadowFilter({
  filterId,
  layer,
  metrics,
  shapeOptions,
  svg,
}: {
  filterId: string
  layer: string
  metrics: {
    height: number
    width: number
    x: number
    y: number
  }
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>
  svg: SVGElement
}) {
  const document = svg.ownerDocument
  const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter")
  const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur")
  const offset = document.createElementNS("http://www.w3.org/2000/svg", "feOffset")
  const flood = document.createElementNS("http://www.w3.org/2000/svg", "feFlood")
  const composite = document.createElementNS("http://www.w3.org/2000/svg", "feComposite")

  filter.setAttribute("id", filterId)
  filter.setAttribute("data-qr-layer", layer)
  filter.setAttribute("filterUnits", "userSpaceOnUse")
  filter.setAttribute("x", formatSvgNumber(metrics.x))
  filter.setAttribute("y", formatSvgNumber(metrics.y))
  filter.setAttribute("width", formatSvgNumber(metrics.width))
  filter.setAttribute("height", formatSvgNumber(metrics.height))
  blur.setAttribute("in", "SourceAlpha")
  blur.setAttribute("result", "shadow-blur")
  blur.setAttribute("stdDeviation", formatSvgNumber(shapeOptions.edgeBlur))
  offset.setAttribute("dx", formatSvgNumber(shapeOptions.shadowOffsetX))
  offset.setAttribute("dy", formatSvgNumber(shapeOptions.shadowOffsetY))
  offset.setAttribute("in", "shadow-blur")
  offset.setAttribute("result", "shadow-offset")
  flood.setAttribute("flood-color", shapeOptions.shadowColor)
  flood.setAttribute("flood-opacity", formatSvgNumber(shapeOptions.shadowOpacity / 100))
  flood.setAttribute("result", "shadow-color")
  composite.setAttribute("in", "shadow-color")
  composite.setAttribute("in2", "shadow-offset")
  composite.setAttribute("operator", "in")

  filter.appendChild(blur)
  filter.appendChild(offset)
  filter.appendChild(flood)
  filter.appendChild(composite)

  return filter
}

function getBackgroundShapeFill(
  svg: SVGElement,
  state: Pick<QraftyState, "backgroundGradient" | "backgroundOptions">,
  width: number,
  height: number,
) {
  if (!state.backgroundGradient.enabled) {
    return state.backgroundOptions.color
  }

  const gradientId = "background-shape-gradient"
  const gradient = createBackgroundShapeGradient(svg, state.backgroundGradient, {
    height,
    id: gradientId,
    width,
  })

  if (gradient) {
    getOrCreateSvgDefs(svg).appendChild(gradient)
    return `url('#${gradientId}')`
  }

  return state.backgroundOptions.color
}

function createBackgroundShapeGradient(
  svg: SVGElement,
  gradient: QraftyGradient,
  {
    height,
    id,
    layer = "background-shape-gradient",
    width,
    x = 0,
    y = 0,
  }: {
    height: number
    id: string
    layer?: string
    width: number
    x?: number
    y?: number
  },
) {
  const document = svg.ownerDocument

  if (!document) {
    return null
  }

  const gradientElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    gradient.type === "radial" ? "radialGradient" : "linearGradient",
  )

  gradientElement.setAttribute("id", id)
  gradientElement.setAttribute("data-qr-layer", layer)
  gradientElement.setAttribute("gradientUnits", "userSpaceOnUse")

  if (gradient.type === "radial") {
    const { cx, cy, r } = qraftyRadialCenterInUserSpace(getQraftyGradientCenter(gradient), {
      x,
      y,
      width,
      height,
    })
    gradientElement.setAttribute("cx", String(cx))
    gradientElement.setAttribute("cy", String(cy))
    gradientElement.setAttribute("r", String(r))
  } else {
    const endpoints = getLinearGradientEndpoints({
      height,
      rotation: gradient.rotation,
      width,
      x,
      y,
    })

    gradientElement.setAttribute("x1", String(endpoints.x1))
    gradientElement.setAttribute("y1", String(endpoints.y1))
    gradientElement.setAttribute("x2", String(endpoints.x2))
    gradientElement.setAttribute("y2", String(endpoints.y2))
  }

  for (const colorStop of gradient.colorStops) {
    const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop")
    stop.setAttribute("offset", String(colorStop.offset))
    stop.setAttribute("stop-color", colorStop.color)
    gradientElement.appendChild(stop)
  }

  return gradientElement
}

function getBackgroundShapeTransform(
  shape: QrBackgroundShapeDefinition,
  region: BackgroundRenderMetrics["backingRegion"],
  shapeOptions: QraftyState["backgroundShapeOptions"],
) {
  const scale = Math.min(
    region.width / shape.viewBox.width,
    region.height / shape.viewBox.height,
  )
  const viewBoxX = shape.viewBox.x ?? 0
  const viewBoxY = shape.viewBox.y ?? 0
  const x = region.x + (region.width - shape.viewBox.width * scale) / 2 - viewBoxX * scale
  const y = region.y + (region.height - shape.viewBox.height * scale) / 2 - viewBoxY * scale
  const baseTransform = `translate(${formatSvgNumber(x)} ${formatSvgNumber(y)}) scale(${formatSvgNumber(scale)})`
  const centerX = viewBoxX + shape.viewBox.width / 2
  const centerY = viewBoxY + shape.viewBox.height / 2

  return getBackgroundShapeSkewTransform(baseTransform, shapeOptions, centerX, centerY)
}

function formatSvgNumber(value: number) {
  if (Math.abs(value) < 0.000001) {
    return "0"
  }

  return Number(value.toFixed(4)).toString()
}

function formatSvgOpacity(value: number) {
  if (!Number.isFinite(value)) {
    return "0"
  }

  return formatSvgNumber(Math.max(0, Math.min(1, value)))
}

function getBackgroundShapeGradientKey(
  state: Pick<QraftyState, "backgroundGradient" | "backgroundShapeId" | "backgroundShapeOptions">,
) {
  if (
    !state.backgroundGradient.enabled ||
    (state.backgroundShapeId === "none" &&
      !hasActiveBackgroundSurfaceOptions(state.backgroundShapeOptions))
  ) {
    return null
  }

  return state.backgroundGradient
}

type FinderCornerKind = "inner" | "outer"

type FinderCornerRegion = {
  height: number
  width: number
  x: number
  y: number
}

export function getQrSvgNumCells(svg: SVGElement) {
  const viewBox = svg.getAttribute("viewBox")

  if (viewBox) {
    const parts = viewBox
      .trim()
      .split(/[\s,]+/)
      .map((value) => Number.parseFloat(value))

    const width = parts[2]
    const height = parts[3]

    if (
      width !== undefined &&
      height !== undefined &&
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width > 0 &&
      height > 0
    ) {
      return Math.min(width, height)
    }
  }

  const width = getNumericAttribute(svg, "width")
  const height = getNumericAttribute(svg, "height")

  if (
    width !== null &&
    height !== null &&
    width > 0 &&
    height > 0
  ) {
    return Math.min(width, height)
  }

  return null
}

export function getFinderCornerRegions(
  margin: number,
  numCells: number,
  kind: FinderCornerKind,
): FinderCornerRegion[] {
  const moduleCount = numCells - margin * 2
  const outerSize = 7
  const innerSize = 3
  const innerInset = 2
  const innerPadding = kind === "inner" ? 0.75 : 0

  if (moduleCount <= outerSize || margin < 0) {
    return []
  }

  if (kind === "outer") {
    return [
      { height: outerSize, width: outerSize, x: margin, y: margin },
      {
        height: outerSize,
        width: outerSize,
        x: moduleCount + margin - outerSize,
        y: margin,
      },
      {
        height: outerSize,
        width: outerSize,
        x: margin,
        y: moduleCount + margin - outerSize,
      },
    ]
  }

  const size = innerSize + innerPadding * 2
  const inset = innerInset - innerPadding
  const innerX = moduleCount + margin - outerSize + inset
  const innerY = moduleCount + margin - outerSize + inset

  return [
    { height: size, width: size, x: margin + inset, y: margin + inset },
    { height: size, width: size, x: innerX, y: margin + inset },
    { height: size, width: size, x: margin + inset, y: innerY },
  ]
}

function createFinderPatternGradientExtension(
  testId: "finder-patterns-inner" | "finder-patterns-outer",
  gradient: QraftyGradient,
  margin: number,
  {
    gradientIdPrefix,
    groupLayer,
  }: {
    gradientIdPrefix: string
    groupLayer: string
  },
): QrSvgExtensionFunction {
  const kind: FinderCornerKind =
    testId === "finder-patterns-outer" ? "outer" : "inner"

  return (svg) => {
    const document = svg.ownerDocument

    if (!document) {
      return
    }

    svg.querySelectorAll(`[data-qr-layer="${groupLayer}"]`).forEach((node) => {
      if (node.tagName.toLowerCase() === "g") {
        node.remove()
      }
    })

    const patterns = Array.from(svg.querySelectorAll(`[data-testid="${testId}"]`)).filter(
      isSvgElementLike,
    )

    if (patterns.length === 0) {
      return
    }

    const numCells = getQrSvgNumCells(svg)
    const cornerRegions = numCells === null ? [] : getFinderCornerRegions(margin, numCells, kind)

    if (cornerRegions.length === 0) {
      return
    }

    const cornerElements = buildFinderCornerGradientElements(
      patterns,
      cornerRegions,
      document,
      testId,
    )

    if (cornerElements.length !== cornerRegions.length) {
      return
    }

    const group = document.createElementNS(SVG_NS, "g")
    group.setAttribute("data-qr-layer", groupLayer)
    const defs = getOrCreateSvgDefs(svg)
    const parent = patterns[0]?.parentNode ?? svg
    const insertReference = patterns[0]?.nextSibling ?? findDotMatrixLayerAnchor(svg)

    for (const pattern of patterns) {
      pattern.remove()
    }

    for (const [index, region] of cornerRegions.entries()) {
      const element = cornerElements[index]

      if (!element) {
        continue
      }

      const gradientId = `${gradientIdPrefix}${Math.round(region.x)}-${Math.round(region.y)}-1`
      const gradientElement = createBackgroundShapeGradient(svg, gradient, {
        height: region.height,
        id: gradientId,
        layer: `${groupLayer}-definition`,
        width: region.width,
        x: region.x,
        y: region.y,
      })

      if (!gradientElement) {
        continue
      }

      defs.appendChild(gradientElement)

      const painted = element.cloneNode(true) as SVGElement
      painted.setAttribute("fill", `url('#${gradientId}')`)
      painted.setAttribute("data-qr-layer", `${groupLayer}-fill`)
      painted.removeAttribute("opacity")

      const customCornerLayer = element.getAttribute("data-qr-layer")

      if (customCornerLayer === "custom-corner-dot") {
        painted.setAttribute("data-qr-layer", "custom-corner-dot")
      }
      group.appendChild(painted)
    }

    if (group.children.length === 0) {
      return
    }

    if (insertReference && insertReference.parentNode === parent) {
      parent.insertBefore(group, insertReference)
      return
    }

    parent.appendChild(group)
  }
}

function buildFinderCornerGradientElements(
  patterns: SVGElement[],
  cornerRegions: FinderCornerRegion[],
  document: Document,
  testId: "finder-patterns-inner" | "finder-patterns-outer",
) {
  if (patterns.length === cornerRegions.length) {
    return sortFinderElementsByCornerRegions(patterns, cornerRegions).map(
      (pattern) => pattern.cloneNode(true) as SVGElement,
    )
  }

  if (patterns.length === 1) {
    return splitFinderPatternIntoCornerElements(patterns[0], cornerRegions, document, testId)
  }

  return []
}

function sortFinderElementsByCornerRegions(
  patterns: SVGElement[],
  cornerRegions: FinderCornerRegion[],
) {
  return [...patterns].sort((left, right) => {
    const leftIndex = getFinderElementCornerIndex(left, cornerRegions)
    const rightIndex = getFinderElementCornerIndex(right, cornerRegions)

    return leftIndex - rightIndex
  })
}

function splitFinderPatternIntoCornerElements(
  pattern: SVGElement,
  cornerRegions: FinderCornerRegion[],
  document: Document,
  testId: "finder-patterns-inner" | "finder-patterns-outer",
) {
  const tagName = pattern.tagName.toLowerCase()

  if (tagName !== "path") {
    return cornerRegions.map(() => pattern.cloneNode(true) as SVGElement)
  }

  const groupedSubpaths = cornerRegions.map(() => [] as string[])

  for (const subpath of splitSvgPathData(pattern.getAttribute("d"))) {
    const start = getSvgPathSubpathStartPoint(subpath)

    if (!start) {
      continue
    }

    const cornerIndex = getFinderCornerIndexForPoint(start, cornerRegions)
    groupedSubpaths[cornerIndex]?.push(subpath)
  }

  return groupedSubpaths.map((subpaths, index) => {
    if (subpaths.length === 0) {
      return null
    }

    const path = document.createElementNS(SVG_NS, "path")
    path.setAttribute("d", subpaths.join(""))
    path.setAttribute("data-testid", testId)
    copyFinderPatternPresentation(pattern, path)
    return path
  }).filter((element): element is SVGPathElement => element !== null)
}

function copyFinderPatternPresentation(source: SVGElement, target: SVGElement) {
  for (const attribute of ["class", "shape-rendering", "style", "transform", "fill-rule"]) {
    const value = source.getAttribute(attribute)

    if (value) {
      target.setAttribute(attribute, value)
    }
  }

  const layer = source.getAttribute("data-qr-layer")

  if (layer) {
    target.setAttribute("data-qr-layer", layer)
  }
}

function getFinderElementCornerIndex(element: SVGElement, cornerRegions: FinderCornerRegion[]) {
  const tagName = element.tagName.toLowerCase()

  if (tagName === "rect") {
    const x = Number.parseFloat(element.getAttribute("x") ?? "")
    const y = Number.parseFloat(element.getAttribute("y") ?? "")
    const width = Number.parseFloat(element.getAttribute("width") ?? "0")
    const height = Number.parseFloat(element.getAttribute("height") ?? "0")

    if (Number.isFinite(x) && Number.isFinite(y)) {
      return getFinderCornerIndexForPoint(
        { x: x + width / 2, y: y + height / 2 },
        cornerRegions,
      )
    }
  }

  if (tagName === "path") {
    const transform = element.getAttribute("transform")

    if (transform) {
      const translateMatch = transform.match(/translate\(([-\d.]+)[,\s]+([-\d.]+)\)/)
      const x = Number.parseFloat(translateMatch?.[1] ?? "")
      const y = Number.parseFloat(translateMatch?.[2] ?? "")

      if (Number.isFinite(x) && Number.isFinite(y)) {
        return getFinderCornerIndexForPoint({ x: x + 1.5, y: y + 1.5 }, cornerRegions)
      }
    }

    const start = getSvgPathSubpathStartPoint(element.getAttribute("d"))

    if (start) {
      return getFinderCornerIndexForPoint(start, cornerRegions)
    }
  }

  return 0
}

function getFinderCornerIndexForPoint(
  point: { x: number; y: number },
  cornerRegions: FinderCornerRegion[],
) {
  for (const [index, region] of cornerRegions.entries()) {
    if (
      point.x >= region.x &&
      point.x <= region.x + region.width &&
      point.y >= region.y &&
      point.y <= region.y + region.height
    ) {
      return index
    }
  }

  let closestIndex = 0
  let closestDistance = Number.POSITIVE_INFINITY

  for (const [index, region] of cornerRegions.entries()) {
    const centerX = region.x + region.width / 2
    const centerY = region.y + region.height / 2
    const distance = (point.x - centerX) ** 2 + (point.y - centerY) ** 2

    if (distance < closestDistance) {
      closestDistance = distance
      closestIndex = index
    }
  }

  return closestIndex
}

function getSvgPathSubpathStartPoint(pathData: string | null) {
  const match = (pathData ?? "").trim().match(/^M\s*([+-]?(?:\d+\.?\d*|\.\d+))[\s,]+([+-]?(?:\d+\.?\d*|\.\d+))/)

  if (!match) {
    return null
  }

  const x = Number.parseFloat(match[1] ?? "")
  const y = Number.parseFloat(match[2] ?? "")

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null
  }

  return { x, y }
}

function getSvgViewBoxRegion(svg: SVGElement) {
  const viewBox = svg.getAttribute("viewBox")

  if (viewBox) {
    const [x = 0, y = 0, width = 0, height = 0] = viewBox
      .trim()
      .split(/[\s,]+/)
      .map((value) => Number.parseFloat(value))

    if (width > 0 && height > 0) {
      return { height, width, x, y }
    }
  }

  const width = getNumericAttribute(svg, "width")
  const height = getNumericAttribute(svg, "height")

  if (width !== null && height !== null && width > 0 && height > 0) {
    return { height, width, x: 0, y: 0 }
  }

  return null
}

export function createAlignedCornerGradientExtension(
  state: Pick<
    QraftyState,
    | "finderPatternInnerGradient"
    | "finderPatternOuterGradient"
    | "gradientLinkMode"
    | "dotsColorMode"
    | "dataModulesGradient"
  >,
): QrSvgExtensionFunction | null {
  const unifiedModuleGradient =
    state.gradientLinkMode === "unified" &&
    state.dotsColorMode === "gradient" &&
    state.dataModulesGradient.enabled

  if (unifiedModuleGradient) {
    return null
  }

  const cornerSquareRotation = getAlignedCornerGradientRotation(state.finderPatternOuterGradient)
  const cornerDotRotation = getAlignedCornerGradientRotation(state.finderPatternInnerGradient)

  if (cornerSquareRotation === null && cornerDotRotation === null) {
    return null
  }

  return (svg) => {
    if (cornerSquareRotation !== null) {
      alignCornerGradientDirection(svg, {
        gradientIdPrefix: "corners-square-color-",
        rotation: cornerSquareRotation,
      })
    }

    if (cornerDotRotation !== null) {
      alignCornerGradientDirection(svg, {
        gradientIdPrefix: "corners-dot-color-",
        rotation: cornerDotRotation,
      })
    }
  }
}

function createBackgroundImageExtension(
  imageHref: string,
  backgroundRound: number,
): QrSvgExtensionFunction {
  return (svg, options) => {
    const document = svg.ownerDocument

    if (!document) {
      return
    }

    svg.querySelectorAll('[data-qr-layer="background-image"]').forEach((node) => {
      node.remove()
    })
    svg.querySelectorAll('[data-qr-layer="background-image-clip"]').forEach((node) => {
      node.remove()
    })

    const backgroundImage = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "image",
    )
    const width = String(options.width ?? 300)
    const height = String(options.height ?? 300)

    backgroundImage.setAttribute("data-qr-layer", "background-image")
    backgroundImage.setAttribute("href", imageHref)
    backgroundImage.setAttribute("x", "0")
    backgroundImage.setAttribute("y", "0")
    backgroundImage.setAttribute("width", width)
    backgroundImage.setAttribute("height", height)
    backgroundImage.setAttribute("preserveAspectRatio", "xMidYMid slice")
    backgroundImage.setAttributeNS(
      "http://www.w3.org/1999/xlink",
      "xlink:href",
      imageHref,
    )

    const clipPathId = addRoundedBackgroundImageClip(svg, backgroundRound, options)

    if (clipPathId) {
      backgroundImage.setAttribute("clip-path", `url('#${clipPathId}')`)
    }

    const insertReference = getBackgroundImageInsertReference(svg)
    svg.insertBefore(backgroundImage, insertReference)
  }
}

function addRoundedBackgroundImageClip(
  svg: SVGElement,
  backgroundRound: number,
  options: QrSvgExtensionOptions,
) {
  if (backgroundRound <= 0) {
    return null
  }

  const document = svg.ownerDocument

  if (!document) {
    return null
  }

  const width = options.width ?? 300
  const height = options.height ?? 300
  const size = Math.min(width, height)
  const clipPathId = "clip-path-background-image"
  const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath")
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")

  clipPath.setAttribute("id", clipPathId)
  clipPath.setAttribute("data-qr-layer", "background-image-clip")
  rect.setAttribute("x", String((width - size) / 2))
  rect.setAttribute("y", String((height - size) / 2))
  rect.setAttribute("width", String(size))
  rect.setAttribute("height", String(size))
  rect.setAttribute("rx", String((size / 2) * backgroundRound))
  clipPath.appendChild(rect)
  getOrCreateSvgDefs(svg).appendChild(clipPath)

  return clipPathId
}

function getOrCreateSvgDefs(svg: SVGElement) {
  const existingDefs = Array.from(svg.children).find(
    (child) => child.tagName.toLowerCase() === "defs",
  )

  if (existingDefs) {
    return existingDefs
  }

  const defs = svg.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "defs")
  svg.insertBefore(defs, svg.firstChild)

  return defs
}

function getBackgroundImageInsertReference(svg: SVGElement) {
  const children = Array.from(svg.children)
  const backgroundRectIndex = children.findIndex(
    (child) =>
      child.tagName.toLowerCase() === "rect" ||
      child.getAttribute("data-qr-layer") === "background-surface-stroke",
  )

  if (backgroundRectIndex >= 0) {
    return children[backgroundRectIndex + 1] ?? null
  }

  return children.find((child) => child.tagName.toLowerCase() !== "defs") ?? null
}

function getAlignedCornerGradientRotation(
  gradient: Pick<QraftyGradient, "enabled" | "rotation" | "type">,
) {
  if (!gradient.enabled || gradient.type !== "linear") {
    return null
  }

  return gradient.rotation
}

function alignCornerGradientDirection(
  svg: SVGElement,
  {
    gradientIdPrefix,
    rotation,
  }: {
    gradientIdPrefix: string
    rotation: number
  },
) {
  const svgElements = getDescendantElements(svg)

  for (const gradient of svgElements) {
    if (
      gradient.tagName.toLowerCase() !== "lineargradient" ||
      !gradient.getAttribute("id")?.startsWith(gradientIdPrefix)
    ) {
      continue
    }

    const gradientId = gradient.getAttribute("id")

    if (!gradientId) {
      continue
    }

    const fillRect = svgElements.find(
      (element) =>
        element.tagName.toLowerCase() === "rect" &&
        getPaintServerId(element.getAttribute("fill")) === gradientId,
    )

    if (!fillRect) {
      continue
    }

    const region = getElementRegion(fillRect)

    if (!region) {
      continue
    }

    const endpoints = getLinearGradientEndpoints({
      ...region,
      rotation,
    })

    gradient.setAttribute("x1", String(endpoints.x1))
    gradient.setAttribute("y1", String(endpoints.y1))
    gradient.setAttribute("x2", String(endpoints.x2))
    gradient.setAttribute("y2", String(endpoints.y2))
  }
}

function getDescendantElements(root: Element): Element[] {
  const descendants: Element[] = []
  const queue = [...Array.from(root.children)]

  while (queue.length > 0) {
    const element = queue.shift()

    if (!element) {
      continue
    }

    descendants.push(element)
    queue.push(...Array.from(element.children))
  }

  return descendants
}

function getPaintServerId(fillValue: string | null) {
  if (!fillValue) {
    return null
  }

  const match = fillValue.match(/^url\((['"]?)#(.+?)\1\)$/)

  return match?.[2] ?? null
}

function getElementRegion(element: Element) {
  const x = getNumericAttribute(element, "x")
  const y = getNumericAttribute(element, "y")
  const width = getNumericAttribute(element, "width")
  const height = getNumericAttribute(element, "height")

  if (
    x === null ||
    y === null ||
    width === null ||
    height === null ||
    width <= 0 ||
    height <= 0
  ) {
    return null
  }

  return { height, width, x, y }
}

function getNumericAttribute(element: Element, name: string) {
  const value = element.getAttribute(name)

  if (value === null) {
    return null
  }

  const numericValue = Number.parseFloat(value)

  return Number.isFinite(numericValue) ? numericValue : null
}

function getLinearGradientEndpoints({
  height,
  rotation,
  width,
  x,
  y,
}: {
  height: number
  rotation: number
  width: number
  x: number
  y: number
}) {
  const normalizedRotation = (rotation + 2 * Math.PI) % (2 * Math.PI)
  let x1 = x + width / 2
  let y1 = y + height / 2
  let x2 = x + width / 2
  let y2 = y + height / 2

  if (
    (normalizedRotation >= 0 && normalizedRotation <= 0.25 * Math.PI) ||
    (normalizedRotation > 1.75 * Math.PI && normalizedRotation <= 2 * Math.PI)
  ) {
    x1 -= width / 2
    y1 -= (height / 2) * Math.tan(rotation)
    x2 += width / 2
    y2 += (height / 2) * Math.tan(rotation)
  } else if (
    normalizedRotation > 0.25 * Math.PI &&
    normalizedRotation <= 0.75 * Math.PI
  ) {
    y1 -= height / 2
    x1 -= (width / 2) / Math.tan(rotation)
    y2 += height / 2
    x2 += (width / 2) / Math.tan(rotation)
  } else if (
    normalizedRotation > 0.75 * Math.PI &&
    normalizedRotation <= 1.25 * Math.PI
  ) {
    x1 += width / 2
    y1 += (height / 2) * Math.tan(rotation)
    x2 -= width / 2
    y2 -= (height / 2) * Math.tan(rotation)
  } else if (
    normalizedRotation > 1.25 * Math.PI &&
    normalizedRotation <= 1.75 * Math.PI
  ) {
    y1 += height / 2
    x1 += (width / 2) / Math.tan(rotation)
    y2 -= height / 2
    x2 -= (width / 2) / Math.tan(rotation)
  }

  return {
    x1: Math.round(x1),
    x2: Math.round(x2),
    y1: Math.round(y1),
    y2: Math.round(y2),
  }
}
