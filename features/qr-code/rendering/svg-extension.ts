import type { CSSProperties } from "react"

import {
  getQrBackgroundShapeDefinition,
  type QrBackgroundShapeDefinition,
} from "@/features/qr-code/styles/background-shapes"
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
  type QrStudioState,
  type StudioGradient,
} from "@/features/qr-code/model/state"
import { getBackgroundShapeSkewTransform } from "@/features/workspace/rendering/layer-transform"
import { applyUnifiedQrGradientFill } from "@new-qr/qr-internal/core"
import {
  buildCustomCornerDotTransform,
  getCustomCornerDotShapeGeometry,
  isCustomCornerDotShape,
} from "@/features/qr-code/styles/custom-corner-dot-shapes"

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

export function buildQrExtension(state: QrStudioState) {
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

  if (backgroundShape) {
    extensions.push(createBackgroundShapeExtension(backgroundShape, state))
  } else if (!backgroundImage && hasActiveBackgroundSurfaceOptions(state.backgroundShapeOptions)) {
    extensions.push(createBackgroundSurfaceExtension(state))
  }

  const unifiedModuleGradient =
    state.gradientLinkMode === "unified" &&
    state.dotsColorMode === "gradient" &&
    state.dataModulesGradient.enabled

  if (state.dotsColorMode === "gradient" && !unifiedModuleGradient) {
    extensions.push(createDotsGradientExtension(state))
  }

  if (state.dotsColorMode === "palette" && getActiveDotsPalette(state).length > 0) {
    extensions.push(createDotsPaletteExtension(state))
  }

  if (unifiedModuleGradient) {
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

export function getQrExtensionKey(state: QrStudioState) {
  return JSON.stringify({
    animation: null,
    backgroundImage: getAssetValue(state.backgroundImage),
    backgroundRound: state.backgroundOptions.round,
    backgroundShapeGradient: getBackgroundShapeGradientKey(state),
    backgroundShapeId: getAssetValue(state.backgroundImage)
      ? null
      : state.backgroundShapeId,
    backgroundShapeOptions: getAssetValue(state.backgroundImage)
      ? null
      : state.backgroundShapeOptions,
    finderPatternInnerGradient: state.finderPatternInnerGradient.enabled
      ? state.finderPatternInnerGradient
      : null,
    finderPatternInnerType: state.finderPatternInnerSettings.type,
    finderPatternOuterGradient: state.finderPatternOuterGradient.enabled
      ? state.finderPatternOuterGradient
      : null,
    customDotShape: null,
    dataModulesGradient: state.dotsColorMode === "gradient" ? state.dataModulesGradient : null,
    dotsColorMode: state.dotsColorMode,
    dotsPalette: state.dotsPalette,
    gradientLinkMode: state.gradientLinkMode,
    logo: getAssetValue(state.logo),
    seed: state.data.trim(),
  })
}

export function createDotMatrixAnimationExtension(
  _state: QrStudioState,
  _mode: QrAnimationRenderMode,
): QrSvgExtensionFunction | null {
  void _state
  void _mode
  return null
}

export function annotateCanvasSvgForBitjsonMotion(
  svg: SVGElement,
  state?: Pick<QrStudioState, "dotsColorMode" | "data" | "dotsPalette">,
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

  annotateFinderPatternsForBitjson(svg)

  return annotatedCount
}

function materializeDataModulePaths(
  svg: SVGElement,
  state?: Pick<QrStudioState, "dotsColorMode" | "data" | "dotsPalette">,
) {
  if (svg.querySelector('[data-qr-layer="bitjson-motion-modules"]')) {
    return
  }

  if (svg.querySelector('[data-qr-layer="dot-palette"]')) {
    return
  }

  const clipLayers = getQrModuleClipLayers(svg)
  const pathLayers = getQrModulePathLayers(svg)

  if (state?.dotsColorMode === "palette" && getActiveDotsPalette(state).length > 0) {
    const allDotShapes = [
      ...clipLayers.flatMap((layer) => layer.shapes),
      ...pathLayers.flatMap((layer) => layer.shapes),
    ]

    if (
      applyDirectPalettePaint(svg, state, allDotShapes, clipLayers, pathLayers, {
        groupLayer: "bitjson-motion-modules",
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
    group.setAttribute("data-qr-layer", "bitjson-motion-modules")

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

function resolveMotionModuleFill(
  shape: SVGElement,
  fallbackFill: string,
  state?: Pick<QrStudioState, "dotsColorMode">,
) {
  if (!state || state.dotsColorMode === "solid") {
    return fallbackFill
  }

  if (state.dotsColorMode === "gradient") {
    return "url('#dot-gradient-definition')"
  }

  return fallbackFill
}

type PaletteColorAssignment = {
  color: string
  paletteIndex: number
  shapes: SVGElement[]
}

type PalettePaintGroupLayer = "bitjson-motion-modules" | "dot-palette"

function buildPaletteColorAssignments(
  state: Pick<QrStudioState, "data" | "dotsPalette">,
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

    for (const shape of shapes) {
      const painted = shape.cloneNode(true) as SVGElement
      painted.removeAttribute("clip-path")
      painted.removeAttribute("opacity")
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
  state: Pick<QrStudioState, "data" | "dotsPalette">,
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
      '[data-qr-layer="bitjson-motion-modules"] path, [data-qr-layer="bitjson-motion-modules"] rect, [data-qr-layer="bitjson-motion-modules"] circle',
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

function annotateFinderPatternsForBitjson(svg: SVGElement) {
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
  state: Pick<QrStudioState, "finderPatternInnerSettings">,
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
  state: Pick<QrStudioState, "data" | "dotsPalette">,
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
  state: Pick<QrStudioState, "dataModulesGradient">,
): QrSvgExtensionFunction {
  return (svg) => {
    removeLegacyDotGradientOverlay(svg)

    const dotClipLayers = getQrModuleClipLayers(svg)
    const dotPathLayers = getQrModulePathLayers(svg)
    const paintTargets = [
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
  state: QrStudioState,
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

function getActiveDotsPalette(state: Pick<QrStudioState, "dotsPalette">) {
  return state.dotsPalette
    .map((color) => color.trim())
    .filter((color, index, palette) => color.length > 0 && palette.indexOf(color) === index)
}

function isSvgElementLike(node: Element): node is SVGElement {
  return typeof node.getAttribute === "function" && typeof node.setAttribute === "function"
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
  | "dotm-square-2"
  | "dotm-square-3"
  | "dotm-square-4"
  | "dotm-square-5"
  | "dotm-square-6"
  | "dotm-square-7"
  | "dotm-square-8"
  | "dotm-square-9"
  | "dotm-square-10"
  | "dotm-square-11"
  | "dotm-square-12"
  | "dotm-square-13"
  | "dotm-square-14"
  | "dotm-square-15"
  | "dotm-square-16"
  | "dotm-square-17"
  | "dotm-square-18"
  | "dotm-square-19"
  | "dotm-square-20"

const DOT_MATRIX_LOADER_SPECS: Record<QrDotMatrixSquareLoader, DotMatrixLoaderSpec> = {
  "block-drop": createDotMatrixLoaderSpec("dotm-square-7", "frame-mask", createGeneratedCellAnimation),
  "core-rotor": createDotMatrixLoaderSpec("dotm-square-13", "rotor-orbit", (cell) => {
    const center = getDotMatrixCenter(cell.matrixSize)
    const outline = Math.min(
      cell.row,
      cell.col,
      cell.matrixSize - 1 - cell.row,
      cell.matrixSize - 1 - cell.col,
    )

    if (outline >= Math.floor(center)) {
      return createClassCellAnimation(
        "dotm-square-13",
        "rotor-orbit",
        "dmx-core-rotor-hub",
        "dmx-center-origin-ripple",
        1500,
        {},
        "ease-in-out",
      )
    }

    if (outline > 0) {
      return createQuietCellAnimation("dotm-square-13", "rotor-orbit")
    }

    const angle = Math.atan2(cell.row - center, cell.col - center)
    const phase = (angle + Math.PI) / (2 * Math.PI)

    return createClassCellAnimation(
      "dotm-square-13",
      "rotor-orbit",
      "dmx-core-rotor",
      "dmx-center-origin-ripple",
      1500,
      { "--dmx-rotor-phase": formatSvgNumber(phase) },
      "ease-in-out",
    )
  }),
  "core-spiral": createDotMatrixLoaderSpec("dotm-square-3", "spiral-inward", (cell) =>
    createClassCellAnimation("dotm-square-3", "spiral-inward", "dmx-spiral-snake", "dmx-spiral-snake", 1500, {
      "--dmx-spiral-order": spiralInwardOrderValue(cell),
    }),
  ),
  "crt-glide": createDotMatrixLoaderSpec("dotm-square-10", "scan-line", createGeneratedCellAnimation),
  "echo-ring": createDotMatrixLoaderSpec("dotm-square-11", "ripple-echo", (cell) =>
    createClassCellAnimation("dotm-square-11", "ripple-echo", "dmx-ripple-echo", "dmx-ripple-echo", 1500, {
      "--dmx-ripple-ring": Math.max(Math.abs(cell.col - getDotMatrixCenter(cell.matrixSize)), Math.abs(cell.row - getDotMatrixCenter(cell.matrixSize))),
      "--dmx-ripple-parity": (cell.row + cell.col) % 2,
    }),
  ),
  "flux-columns": createDotMatrixLoaderSpec("dotm-square-6", "column-snake", (cell) =>
    createClassCellAnimation("dotm-square-6", "column-snake", "dmx-square6-col-snake", "dmx-square6-col-snake", 1500, {
      "--dmx-col-pos": cell.col % 2 === 0 ? cell.matrixSize - 1 - cell.row : cell.row,
    }),
  ),
  "glyph-pulse": createDotMatrixLoaderSpec("dotm-square-9", "glyph-bits", (cell) => {
    return createClassCellAnimation(
      "dotm-square-9",
      "glyph-bits",
      "dmx-square9-bit",
      "dmx-square9-bit",
      5200,
      { "--dmx-square9-delay": cell.index % 6 },
      "steps(52, end)",
    )
  }),
  "half-helix": createDotMatrixLoaderSpec("dotm-square-17", "half-helix", createGeneratedCellAnimation),
  "helix-core": createDotMatrixLoaderSpec("dotm-square-16", "helix-core", createGeneratedCellAnimation),
  "helix-glow": createDotMatrixLoaderSpec("dotm-square-15", "helix-glow", createGeneratedCellAnimation),
  "infinity-run": createDotMatrixLoaderSpec("dotm-square-19", "infinity-run", createGeneratedCellAnimation),
  "mobius-run": createDotMatrixLoaderSpec("dotm-square-20", "mobius-run", createGeneratedCellAnimation),
  "neon-drift": createDotMatrixLoaderSpec("dotm-square-1", "diagonal-alt-sweep", (cell) =>
    createClassCellAnimation("dotm-square-1", "diagonal-alt-sweep", "dmx-diagonal-alt-sweep", "dmx-diagonal-alt-sweep", 1500, {
      "--dmx-diagonal-parity": (cell.row + cell.col) % 2,
      "--dmx-path": trBlPathNormFromIndex(cell),
    }),
  ),
  "origin-wave": createDotMatrixLoaderSpec("dotm-square-12", "center-origin-ripple", (cell) =>
    createClassCellAnimation("dotm-square-12", "center-origin-ripple", "dmx-center-origin-ripple", "dmx-center-origin-ripple", 1500, {
      "--dmx-center-ripple-ring": Math.abs(cell.row - getDotMatrixCenter(cell.matrixSize)) + Math.abs(cell.col - getDotMatrixCenter(cell.matrixSize)),
    }),
  ),
  "prism-bloom": createDotMatrixLoaderSpec("dotm-square-14", "diamond-bloom", createGeneratedCellAnimation),
  "prism-sweep": createDotMatrixLoaderSpec("dotm-square-5", "diagonal-snake", (cell) =>
    createClassCellAnimation("dotm-square-5", "diagonal-snake", "dmx-diagonal-snake", "dmx-diagonal-snake", 1500, {
      "--dmx-diagonal-snake-order": diagonalSnakeOrderValue(cell),
    }),
  ),
  "pulse-ladder": createDotMatrixLoaderSpec("dotm-square-2", "row-cycle-snake", createGeneratedCellAnimation),
  "sound-bars": createDotMatrixLoaderSpec("dotm-square-18", "sound-bars", createGeneratedCellAnimation),
  "strobe-stack": createDotMatrixLoaderSpec("dotm-square-8", "stack-drain", createGeneratedCellAnimation),
  "twin-orbit": createDotMatrixLoaderSpec("dotm-square-4", "twin-orbit", (cell) => {
    const outerOrder = outerRingClockwiseOrderValue(cell)
    if (outerOrder >= 0) {
      return createClassCellAnimation("dotm-square-4", "twin-orbit", "dmx-outer-snake", "dmx-outer-snake", 1500, {
        "--dmx-outer-order": outerOrder,
      })
    }

    const middleOrder = middleRingAntiClockwiseOrderValue(cell)
    if (middleOrder >= 0) {
      return createClassCellAnimation("dotm-square-4", "twin-orbit", "dmx-middle-snake", "dmx-middle-snake", 1500, {
        "--dmx-middle-order": middleOrder,
      })
    }

    return createQuietCellAnimation("dotm-square-4", "twin-orbit")
  }),
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

function createGeneratedCellAnimation(
  cell: DotMatrixCell,
  upstreamLoader: DotMatrixSquareLoaderId,
  topology: string,
): DotMatrixCellAnimation {
  const durationByLoader: Record<DotMatrixSquareLoaderId, number> = {
    "dotm-square-1": 1500,
    "dotm-square-2": 1500,
    "dotm-square-3": 1500,
    "dotm-square-4": 1500,
    "dotm-square-5": 1500,
    "dotm-square-6": 1500,
    "dotm-square-7": 1900,
    "dotm-square-8": 2000,
    "dotm-square-9": 5200,
    "dotm-square-10": 1500,
    "dotm-square-11": 1500,
    "dotm-square-12": 1500,
    "dotm-square-13": 1550,
    "dotm-square-14": 1700,
    "dotm-square-15": 1600,
    "dotm-square-16": 1400,
    "dotm-square-17": 1600,
    "dotm-square-18": 1750,
    "dotm-square-19": 1700,
    "dotm-square-20": 1600,
  }

  return {
    active: true,
    durationMs: durationByLoader[upstreamLoader],
    keyframes: getGeneratedDotMatrixKeyframesName(upstreamLoader, cell),
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

function createSpiralInwardPath(matrixSize: number) {
  const path: Array<readonly [number, number]> = []
  let left = 0
  let right = matrixSize - 1
  let top = 0
  let bottom = matrixSize - 1

  while (left <= right && top <= bottom) {
    for (let col = left; col <= right; col += 1) {
      path.push([col, top])
    }
    for (let row = top + 1; row <= bottom; row += 1) {
      path.push([right, row])
    }
    if (top < bottom) {
      for (let col = right - 1; col >= left; col -= 1) {
        path.push([col, bottom])
      }
    }
    if (left < right) {
      for (let row = bottom - 1; row > top; row -= 1) {
        path.push([left, row])
      }
    }

    left += 1
    right -= 1
    top += 1
    bottom -= 1
  }

  return path
}

function createOuterRingClockwisePath(matrixSize: number) {
  return createRingPathClockwise(matrixSize, 0)
}

function createRingPathClockwise(matrixSize: number, inset: number) {
  const path: Array<readonly [number, number]> = []
  const min = inset
  const max = matrixSize - 1 - inset

  if (min > max) {
    return path
  }

  for (let col = min; col <= max; col += 1) {
    path.push([col, min])
  }
  for (let row = min + 1; row <= max; row += 1) {
    path.push([max, row])
  }
  if (min < max) {
    for (let col = max - 1; col >= min; col -= 1) {
      path.push([col, max])
    }
    for (let row = max - 1; row > min; row -= 1) {
      path.push([min, row])
    }
  }

  return path
}

function trBlPathNormFromIndex(cell: DotMatrixCell) {
  const { col, matrixSize, row } = cell

  return (row + (matrixSize - 1 - col)) / ((matrixSize - 1) * 2)
}

function spiralInwardOrderValue(cell: DotMatrixCell) {
  const { col, matrixSize, row } = cell

  return findDotMatrixCellIndex(createSpiralInwardPath(matrixSize), col, row)
}

function outerRingClockwiseOrderValue(cell: DotMatrixCell) {
  const { col, matrixSize, row } = cell

  return findDotMatrixCellIndex(createOuterRingClockwisePath(matrixSize), col, row)
}

function middleRingAntiClockwiseOrderValue(cell: DotMatrixCell) {
  const { col, matrixSize, row } = cell

  return findDotMatrixCellIndex(createRingPathClockwise(matrixSize, 1), col, row)
}

function diagonalSnakeOrderValue(cell: DotMatrixCell) {
  const { col, matrixSize, row } = cell
  let order = 0

  for (let diagonal = 0; diagonal <= (matrixSize - 1) * 2; diagonal += 1) {
    const cells: DotMatrixCell[] = []

    for (let candidateRow = 0; candidateRow < matrixSize; candidateRow += 1) {
      const candidateCol = diagonal - candidateRow

      if (candidateCol >= 0 && candidateCol < matrixSize) {
        cells.push(indexToCoord(rowMajorIndex(candidateRow, candidateCol, matrixSize), matrixSize))
      }
    }

    const orderedCells = diagonal % 2 === 0 ? cells : [...cells].reverse()

    for (const cell of orderedCells) {
      if (cell.col === col && cell.row === row) {
        return order
      }

      order += 1
    }
  }

  return 0
}

function getDotMatrixPatternIndexes(pattern: QrDotMatrixAnimationOptions["pattern"], matrixSize: number) {
  const indexes: number[] = []
  const center = getDotMatrixCenter(matrixSize)
  const diamondRadius = Math.max(2, Math.floor(matrixSize / 2))

  for (let row = 0; row < matrixSize; row += 1) {
    for (let col = 0; col < matrixSize; col += 1) {
      const index = rowMajorIndex(row, col, matrixSize)
      const distance = Math.hypot(row - center, col - center)
      const manhattan = Math.abs(row - center) + Math.abs(col - center)
      const angle = Math.atan2(row - center, col - center)
      const active =
        pattern === "full" ||
        (pattern === "diamond" && manhattan <= diamondRadius) ||
        (pattern === "outline" &&
          (row === 0 || col === 0 || row === matrixSize - 1 || col === matrixSize - 1)) ||
        (pattern === "cross" && (Math.abs(row - center) < 0.5 || Math.abs(col - center) < 0.5)) ||
        (pattern === "rings" && (distance >= 1 || row === 0 || col === 0 || row === matrixSize - 1 || col === matrixSize - 1)) ||
        (pattern === "rose" && Math.abs(Math.sin(3 * angle)) > 0.5 && distance >= 1)

      if (active) {
        indexes.push(index)
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

function getGeneratedDotMatrixKeyframesName(
  upstreamLoader: DotMatrixSquareLoaderId,
  cell: DotMatrixCell,
) {
  const squareNumber = upstreamLoader.replace("dotm-square-", "")

  return `dmx-square${squareNumber}-${upstreamLoader}-r${cell.row}c${cell.col}`.replaceAll(".", "-")
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

function resolveDotMatrixColors(state: QrStudioState) {
  const animation = state.dotMatrixAnimation
  const defaultLoaderColor = DEFAULT_DOT_MATRIX_ANIMATION.customColor

  if (animation.colorPreset === "theme") {
    const legacyCustomColor = animation.customColor || defaultLoaderColor

    return {
      base: animation.customColorBase || legacyCustomColor,
      mid: animation.customColorMid || legacyCustomColor,
      peak: animation.customColorPeak || legacyCustomColor,
    }
  }

  const presetColors: Record<QrDotMatrixAnimationOptions["colorPreset"], string> = {
    aurora: "#a78bfa",
    fire: "#fb7185",
    mint: "#34d399",
    neon: "#22d3ee",
    ocean: "#38bdf8",
    prism: "#f0abfc",
    sunset: "#fb923c",
    theme: animation.customColor || defaultLoaderColor,
  }

  const presetColor = presetColors[animation.colorPreset]

  return {
    base: presetColor,
    mid: presetColor,
    peak: presetColor,
  }
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
  upstreamLoader: DotMatrixSquareLoaderId,
  cell: DotMatrixCell,
) {
  switch (upstreamLoader) {
    case "dotm-square-2":
      return Array.from({ length: 10 }, (_, frame) => {
        const head = Math.round(((frame <= 4 ? 4 - frame : frame - 5) / 4) * (cell.matrixSize - 1))
        const distance = Math.abs(cell.row - head)
        const tail = [1, 0.82, 0.68, 0.54, 0.42, 0.31, 0.22, 0.14]
        return tail[distance + Math.abs(cell.col - (frame % cell.matrixSize))] ?? 0.08
      })
    case "dotm-square-7":
      return Array.from({ length: 11 }, (_, frame) => {
        const sequence = [0, 1, 2, 3, 4, 4, 5, 6, 7, 8, 9].map((step) =>
          Math.round((step / 9) * (cell.matrixSize * 2 - 1)),
        )
        const step = sequence[frame] ?? 0
        const filled = cell.matrixSize - 1 - cell.row < step
        const cap = cell.matrixSize - 1 - cell.row === step
        return cap ? 1 : filled ? 0.42 : 0.08
      })
    case "dotm-square-8":
      return Array.from({ length: 24 }, (_, frame) => {
        const scaledFrame = (frame / 23) * (cell.matrixSize - 1) * 2
        if (frame < 9) {
          return cell.matrixSize - 1 - cell.row <= scaledFrame ? 0.52 : 0.08
        }
        if (frame < 14) {
          return frame % 2 === 0 ? 1 : 0.38
        }
        return cell.row <= scaledFrame - cell.matrixSize ? 0.08 : 0.52
      })
    case "dotm-square-10":
      return Array.from({ length: 5 }, (_, frame) => {
        const distance = Math.abs(cell.row - frame)
        return distance === 0 ? 1 : distance === 1 ? 0.72 : 0.08 + cell.col * 0.07
      })
    case "dotm-square-13":
      return Array.from({ length: 56 }, (_, frame) => {
        const phase = frame / 55
        const center = getDotMatrixCenter(cell.matrixSize)
        const outline = Math.min(
          cell.row,
          cell.col,
          cell.matrixSize - 1 - cell.row,
          cell.matrixSize - 1 - cell.col,
        )
        const distFromCenter = Math.hypot(cell.row - center, cell.col - center)

        if (distFromCenter < 0.55) {
          const hub = 0.5 + 0.5 * Math.sin(phase * Math.PI * 2)
          return 0.08 + hub * 0.56
        }

        if (outline > 0.12) {
          return 0.08
        }

        const angle = Math.atan2(cell.row - center, cell.col - center)
        const angularPhase = (angle + Math.PI) / (2 * Math.PI)
        let delta = phase - angularPhase

        while (delta > 0.5) {
          delta -= 1
        }
        while (delta < -0.5) {
          delta += 1
        }

        const wrapped = Math.abs(delta) * 2
        const bump = Math.max(0, Math.cos(wrapped * Math.PI * 0.62))

        return 0.08 + bump * 0.92
      })
    case "dotm-square-14":
      return Array.from({ length: 6 }, (_, frame) => {
        const center = getDotMatrixCenter(cell.matrixSize)
        const sequence = [0, 1, 2, 3, 2, 1].map((step) =>
          Math.round((step / 3) * center),
        )
        const distance = Math.abs(cell.row - center) + Math.abs(cell.col - center)
        return distance === sequence[frame] ? 1 : distance < sequence[frame] ? 0.52 : 0.08
      })
    case "dotm-square-15":
    case "dotm-square-16":
      return Array.from({ length: 20 }, (_, frame) => {
        const phase = (frame / 19) * Math.PI * 2 + cell.row * 1.24
        const center = getDotMatrixCenter(cell.matrixSize)
        const left = Math.round(center - 0.5 + 0.5 * Math.sin(phase))
        const right = cell.matrixSize - 1 - left
        const bridge = Math.cos(phase * 2) > 0.82 && Math.abs(cell.col - center) < 0.5
        return cell.col === left || cell.col === right ? 1 : bridge ? 0.58 : Math.abs(cell.col - left) === 1 ? 0.24 : 0.08
      })
    case "dotm-square-17":
      return Array.from({ length: 20 }, (_, frame) => {
        const phase = (frame / 19) * Math.PI * 2 + cell.row * 1.24
        const center = getDotMatrixCenter(cell.matrixSize)
        const strandCol = Math.round(center + center * Math.sin(phase))
        return cell.col === strandCol ? 1 : Math.abs(cell.col - strandCol) === 1 ? 0.24 : 0.08
      })
    case "dotm-square-18":
      return Array.from({ length: 24 }, (_, frame) => {
        const colPhase = frame * 0.52 + cell.col * 1.15
        const level = Math.round(1 + ((Math.sin(colPhase) + 1) / 2) * (cell.matrixSize - 1))
        return cell.matrixSize - cell.row <= level ? 1 : 0.08
      })
    case "dotm-square-19":
      return Array.from({ length: 48 }, (_, frame) => {
        const outerRingLength = createOuterRingClockwisePath(cell.matrixSize).length
        const a = (frame % outerRingLength)
        const b = (a + outerRingLength / 2) % outerRingLength
        const order = outerRingClockwiseOrderValue(cell)
        const center = getDotMatrixCenter(cell.matrixSize)
        if (Math.abs(cell.row - center) < 0.5 && Math.abs(cell.col - center) < 0.5) {
          return 0.62
        }
        return order === a || order === b ? 1 : order >= 0 && Math.min(Math.abs(order - a), Math.abs(order - b)) <= 2 ? 0.32 : 0.08
      })
    case "dotm-square-20":
      return Array.from({ length: createOuterRingClockwisePath(cell.matrixSize).length }, (_, frame) => {
        const order = outerRingClockwiseOrderValue(cell)
        const center = getDotMatrixCenter(cell.matrixSize)
        if (Math.abs(cell.row - center) < 0.5 && Math.abs(cell.col - center) < 0.5) {
          return frame % 4 === 0 ? 0.62 : 0.08
        }
        return order === frame ? 1 : order >= 0 && Math.abs(order - frame) <= 2 ? 0.38 : 0.08
      })
    default:
      return [0.08, 1, 0.32, 0.08]
  }
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

  return "mid"
}

function createDotMatrixAnimationStyle(document: Document, tracks: DotMatrixTrack[]) {
  const style = document.createElementNS(SVG_NS, "style")
  const generatedKeyframes = tracks
    .filter((track) => track.state === "active" && track.keyframes.includes("-dotm-square-"))
    .map((track) => createGeneratedDotMatrixKeyframes(track.keyframes, track.upstreamLoader, track.region))
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
}
.qr-dot-matrix-track-quiet {
  animation: none !important;
  opacity: var(--qr-dot-matrix-opacity-base);
  filter: none;
}
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-diagonal-alt-sweep"] { animation-delay: calc((var(--dmx-path, 0) + var(--dmx-diagonal-parity, 0) * .08) * -1.5s); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-spiral-snake"] { animation-delay: calc(var(--dmx-spiral-order, 0) * -56ms); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-diagonal-snake"] { animation-delay: calc(var(--dmx-diagonal-snake-order, 0) * -48ms); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-outer-snake"] { animation-delay: calc(var(--dmx-outer-order, 0) * -70ms); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-middle-snake"] { animation-delay: calc(var(--dmx-middle-order, 0) * -96ms); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-square6-col-snake"] { animation-delay: calc(var(--dmx-col-pos, 0) * -110ms); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-ripple-echo"] { animation-delay: calc(var(--dmx-ripple-ring, 0) * -120ms); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-center-origin-ripple"] { animation-delay: calc(var(--dmx-center-ripple-ring, 0) * -120ms); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-core-rotor"] { animation-delay: calc(var(--dmx-rotor-phase, 0) * -1.35s); }
@keyframes qr-dot-loader-legacy { 0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 50% { opacity: var(--qr-dot-matrix-opacity-peak); fill: var(--qr-dot-matrix-color-peak); } }
@keyframes dmx-diagonal-alt-sweep { 0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 44% { opacity: var(--qr-dot-matrix-opacity-peak); fill: var(--qr-dot-matrix-color-peak); } 68% { opacity: var(--qr-dot-matrix-opacity-mid); fill: var(--qr-dot-matrix-color-mid); } }
@keyframes dmx-spiral-snake { 0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 10% { opacity: var(--qr-dot-matrix-opacity-peak); fill: var(--qr-dot-matrix-color-peak); } 34% { opacity: var(--qr-dot-matrix-opacity-mid); fill: var(--qr-dot-matrix-color-mid); } }
@keyframes dmx-diagonal-snake { 0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 12% { opacity: var(--qr-dot-matrix-opacity-peak); fill: var(--qr-dot-matrix-color-peak); } 36% { opacity: var(--qr-dot-matrix-opacity-mid); fill: var(--qr-dot-matrix-color-mid); } }
@keyframes dmx-outer-snake { 0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 8% { opacity: var(--qr-dot-matrix-opacity-peak); fill: var(--qr-dot-matrix-color-peak); } 30% { opacity: var(--qr-dot-matrix-opacity-mid); fill: var(--qr-dot-matrix-color-mid); } }
@keyframes dmx-middle-snake { 0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 8% { opacity: var(--qr-dot-matrix-opacity-peak); fill: var(--qr-dot-matrix-color-peak); } 30% { opacity: var(--qr-dot-matrix-opacity-mid); fill: var(--qr-dot-matrix-color-mid); } }
@keyframes dmx-square6-col-snake { 0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 18% { opacity: var(--qr-dot-matrix-opacity-peak); fill: var(--qr-dot-matrix-color-peak); } 42% { opacity: var(--qr-dot-matrix-opacity-mid); fill: var(--qr-dot-matrix-color-mid); } }
@keyframes dmx-ripple-echo { 0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 35% { opacity: var(--qr-dot-matrix-opacity-peak); fill: var(--qr-dot-matrix-color-peak); } 60% { opacity: var(--qr-dot-matrix-opacity-mid); fill: var(--qr-dot-matrix-color-mid); } }
@keyframes dmx-center-origin-ripple { 0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 32% { opacity: var(--qr-dot-matrix-opacity-peak); fill: var(--qr-dot-matrix-color-peak); } 62% { opacity: var(--qr-dot-matrix-opacity-mid); fill: var(--qr-dot-matrix-color-mid); } }
@keyframes dmx-square9-bit { 0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 8%, 22%, 38%, 56% { opacity: var(--qr-dot-matrix-opacity-peak); fill: var(--qr-dot-matrix-color-peak); } 14%, 30%, 48%, 68% { opacity: var(--qr-dot-matrix-opacity-mid); fill: var(--qr-dot-matrix-color-mid); } }
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

function createUnifiedGradientExtension(
  state: Pick<
    QrStudioState,
    "gradientLinkMode" | "dotsColorMode" | "dataModulesGradient" | "margin"
  >,
): QrSvgExtensionFunction {
  return (svg) => {
    removeLegacyDotGradientOverlay(svg)

    const dotClipLayers = getQrModuleClipLayers(svg)
    const dotPathLayers = getQrModulePathLayers(svg)
    const modulePaintTargets = [
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

function createBackgroundShapeExtension(
  shape: QrBackgroundShapeDefinition,
  state: Pick<QrStudioState, "backgroundGradient" | "backgroundOptions" | "backgroundShapeOptions">,
): QrSvgExtensionFunction {
  return (svg, options) => {
    const document = svg.ownerDocument

    if (!document) {
      return
    }

    svg.querySelectorAll('[data-qr-layer="background-shape"]').forEach((node) => {
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

    const width = options.width ?? 300
    const height = options.height ?? 300
    const shapeOptions = normalizeBackgroundShapeOptions(state.backgroundShapeOptions)
    const metrics = getBackgroundRenderMetrics(width, height, shapeOptions)
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
    const transform = getBackgroundShapeTransform(
      shape,
      metrics.backingRegion,
      shapeOptions,
    )
    const fill = getBackgroundShapeFill(svg, state, metrics.outerWidth, metrics.outerHeight)

    applySvgRenderBounds(svg, metrics)
    const insertReference = wrapQrContent(svg, metrics.translateX, metrics.translateY)

    path.setAttribute("data-qr-layer", "background-shape")
    path.setAttribute("d", shape.path)
    path.setAttribute("transform", transform)
    path.setAttribute("fill", fill)
    applyBackgroundShapeStroke(path, shapeOptions)

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

    svg.insertBefore(path, insertReference)
  }
}

function normalizeBackgroundShapeOptions(
  options:
    | (Partial<QrStudioState["backgroundShapeOptions"]> & {
        sizePercent?: number
      })
    | undefined,
) {
  const legacyPaddingPx =
    options?.paddingPx === undefined && typeof options?.sizePercent === "number"
      ? getLegacyBackgroundShapePaddingPx(options.sizePercent)
      : undefined

  return {
    ...DEFAULT_BACKGROUND_SHAPE_OPTIONS,
    ...options,
    edgeBlur: coerceNonNegativeSvgNumber(
      options?.edgeBlur ?? DEFAULT_BACKGROUND_SHAPE_OPTIONS.edgeBlur,
      DEFAULT_BACKGROUND_SHAPE_OPTIONS.edgeBlur,
    ),
    paddingPx: coerceNonNegativeSvgNumber(
      options?.paddingPx ?? legacyPaddingPx ?? DEFAULT_BACKGROUND_SHAPE_OPTIONS.paddingPx,
      DEFAULT_BACKGROUND_SHAPE_OPTIONS.paddingPx,
    ),
    shadowColor: options?.shadowColor ?? DEFAULT_BACKGROUND_SHAPE_OPTIONS.shadowColor,
    shadowOffsetX: clampBackgroundShapeOffset(
      options?.shadowOffsetX ?? DEFAULT_BACKGROUND_SHAPE_OPTIONS.shadowOffsetX,
    ),
    shadowOffsetY: clampBackgroundShapeOffset(
      options?.shadowOffsetY ?? DEFAULT_BACKGROUND_SHAPE_OPTIONS.shadowOffsetY,
    ),
    shadowOpacity: clampBackgroundShapeOpacity(
      options?.shadowOpacity ?? DEFAULT_BACKGROUND_SHAPE_OPTIONS.shadowOpacity,
    ),
    strokeOpacity: clampBackgroundShapeOpacity(
      options?.strokeOpacity ?? DEFAULT_BACKGROUND_SHAPE_OPTIONS.strokeOpacity,
    ),
    strokeWidth: coerceNonNegativeSvgNumber(
      options?.strokeWidth ?? DEFAULT_BACKGROUND_SHAPE_OPTIONS.strokeWidth,
      DEFAULT_BACKGROUND_SHAPE_OPTIONS.strokeWidth,
    ),
    tiltX: clampBackgroundShapeTilt(
      options?.tiltX ?? DEFAULT_BACKGROUND_SHAPE_OPTIONS.tiltX,
    ),
    tiltY: clampBackgroundShapeTilt(
      options?.tiltY ?? DEFAULT_BACKGROUND_SHAPE_OPTIONS.tiltY,
    ),
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
  path: Element,
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>,
) {
  if (shapeOptions.strokeWidth <= 0) {
    path.removeAttribute("stroke")
    path.removeAttribute("stroke-width")
    path.removeAttribute("stroke-opacity")
    path.removeAttribute("stroke-linejoin")
    return
  }

  path.setAttribute("stroke", shapeOptions.strokeColor)
  path.setAttribute("stroke-width", formatSvgNumber(shapeOptions.strokeWidth))
  path.setAttribute("stroke-opacity", formatSvgNumber(shapeOptions.strokeOpacity / 100))
  path.setAttribute("stroke-linejoin", "round")
}

function hasActiveBackgroundSurfaceOptions(
  options: Partial<QrStudioState["backgroundShapeOptions"]> | undefined,
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
  bottomEffectOutset: number
  outerHeight: number
  outerWidth: number
  leftEffectOutset: number
  rightEffectOutset: number
  shapeOutset: number
  topEffectOutset: number
  totalOutset: number
  translateX: number
  translateY: number
}

function getBackgroundRenderMetrics(
  width: number,
  height: number,
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>,
): BackgroundRenderMetrics {
  const shapeOutset = shapeOptions.paddingPx
  const strokeOutset = Math.ceil(shapeOptions.strokeWidth / 2)
  const leftEffectOutset = strokeOutset
  const rightEffectOutset = strokeOutset
  const topEffectOutset = strokeOutset
  const bottomEffectOutset = strokeOutset
  const translateX = shapeOutset + leftEffectOutset
  const translateY = shapeOutset + topEffectOutset

  return {
    backingRegion: {
      height: height + shapeOutset * 2,
      width: width + shapeOutset * 2,
      x: leftEffectOutset,
      y: topEffectOutset,
    },
    bottomEffectOutset,
    leftEffectOutset,
    outerHeight: height + shapeOutset * 2 + topEffectOutset + bottomEffectOutset,
    outerWidth: width + shapeOutset * 2 + leftEffectOutset + rightEffectOutset,
    rightEffectOutset,
    shapeOutset,
    topEffectOutset,
    totalOutset: Math.max(translateX, translateY),
    translateX,
    translateY,
  }
}export function getQrRenderedDimensions(
  state: Pick<
    QrStudioState,
    "backgroundImage" | "backgroundShapeId" | "backgroundShapeOptions" | "height" | "width"
  >,
) {
  const width = clampQrSize(state.width)
  const height = clampQrSize(state.height)

  if (
    getAssetValue(state.backgroundImage) ||
    (state.backgroundShapeId === "none" &&
      !hasActiveBackgroundSurfaceOptions(state.backgroundShapeOptions))
  ) {
    return {
      height,
      width,
    }
  }

  const metrics = getBackgroundRenderMetrics(
    width,
    height,
    normalizeBackgroundShapeOptions(state.backgroundShapeOptions),
  )

  return {
    height: metrics.outerHeight,
    width: metrics.outerWidth,
  }
}

export type DraftingQrLayerLayout = {
  innerHeight: number
  innerWidth: number
  metrics: BackgroundRenderMetrics
  scale: number
  shapeOptions: QrStudioState["backgroundShapeOptions"]
}

export function getDraftingQrLayerLayout(
  layerWidth: number,
  state: Pick<
    QrStudioState,
    "backgroundImage" | "backgroundShapeId" | "backgroundShapeOptions" | "height" | "width"
  >,
  layerHeight?: number,
): DraftingQrLayerLayout {
  const naturalOuter = getQrRenderedDimensions(state)
  const targetHeight =
    layerHeight ??
    (naturalOuter.width > 0 ? layerWidth * (naturalOuter.height / naturalOuter.width) : layerWidth)
  const scale = naturalOuter.width > 0 ? layerWidth / naturalOuter.width : 1
  const innerWidth = Math.max(1, state.width * scale)
  const innerHeight = Math.max(1, state.height * scale)
  const shapeOptions = scaleQrBackgroundShapeOptions(state.backgroundShapeOptions, scale)
  const metrics = getBackgroundRenderMetrics(
    innerWidth,
    innerHeight,
    normalizeBackgroundShapeOptions(shapeOptions),
  )
  const fitted = fitBackgroundRenderMetricsToLayer(
    metrics,
    innerWidth,
    innerHeight,
    layerWidth,
    targetHeight,
  )

  return {
    innerHeight: fitted.innerHeight,
    innerWidth: fitted.innerWidth,
    metrics: fitted.metrics,
    scale,
    shapeOptions,
  }
}

function fitBackgroundRenderMetricsToLayer(
  metrics: BackgroundRenderMetrics,
  innerWidth: number,
  innerHeight: number,
  layerWidth: number,
  layerHeight: number,
) {
  const widthScale = layerWidth / Math.max(1, metrics.outerWidth)
  const heightScale = layerHeight / Math.max(1, metrics.outerHeight)

  if (Math.abs(widthScale - 1) < 1e-6 && Math.abs(heightScale - 1) < 1e-6) {
    return { innerWidth, innerHeight, metrics }
  }

  const scaleX = (value: number) => value * widthScale
  const scaleY = (value: number) => value * heightScale
  const uniformScale = Math.min(widthScale, heightScale)

  return {
    innerWidth: Math.max(1, innerWidth * widthScale),
    innerHeight: Math.max(1, innerHeight * heightScale),
    metrics: {
      backingRegion: {
        height: scaleY(metrics.backingRegion.height),
        width: scaleX(metrics.backingRegion.width),
        x: scaleX(metrics.backingRegion.x),
        y: scaleY(metrics.backingRegion.y),
      },
      bottomEffectOutset: scaleY(metrics.bottomEffectOutset),
      leftEffectOutset: scaleX(metrics.leftEffectOutset),
      outerHeight: layerHeight,
      outerWidth: layerWidth,
      rightEffectOutset: scaleX(metrics.rightEffectOutset),
      shapeOutset: metrics.shapeOutset * uniformScale,
      topEffectOutset: scaleY(metrics.topEffectOutset),
      totalOutset: Math.max(scaleX(metrics.translateX), scaleY(metrics.translateY)),
      translateX: scaleX(metrics.translateX),
      translateY: scaleY(metrics.translateY),
    },
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
export function getDraftingQrDomStretchScale(
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
  shapeOptions: QrStudioState["backgroundShapeOptions"],
) {
  return getBackgroundShapeTransform(
    shape,
    backingRegion,
    normalizeBackgroundShapeOptions(shapeOptions),
  )
}

export function scaleQrBackgroundShapeOptions(
  options: QrStudioState["backgroundShapeOptions"],
  scale: number,
): QrStudioState["backgroundShapeOptions"] {
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

function wrapQrContent(svg: SVGElement, translateX: number, translateY: number) {
  if (translateX <= 0 && translateY <= 0) {
    return getFirstDrawableSvgChild(svg)
  }

  const existingGroup = svg.querySelector('[data-qr-layer="qr-content"]')

  if (existingGroup) {
    existingGroup.setAttribute(
      "transform",
      `translate(${formatSvgNumber(translateX)} ${formatSvgNumber(translateY)})`,
    )
    return existingGroup
  }

  const document = svg.ownerDocument
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g")
  const children = Array.from(svg.children).filter(
    (child) =>
      child.tagName.toLowerCase() !== "defs" && !isManagedBackgroundLayer(child),
  )

  group.setAttribute("data-qr-layer", "qr-content")
  group.setAttribute(
    "transform",
    `translate(${formatSvgNumber(translateX)} ${formatSvgNumber(translateY)})`,
  )

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
  state: Pick<QrStudioState, "backgroundGradient" | "backgroundOptions" | "backgroundShapeOptions">,
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

    const width = options.width ?? 300
    const height = options.height ?? 300
    const shapeOptions = normalizeBackgroundShapeOptions(state.backgroundShapeOptions)
    const metrics = getBackgroundRenderMetrics(width, height, shapeOptions)
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
    const insertReference = wrapQrContent(svg, metrics.translateX, metrics.translateY)

    applyBackgroundSurfaceRect(backgroundRect, region, radius)
    applyBackgroundShapeStroke(backgroundRect, shapeOptions)

    const blurRect = createBackgroundSurfaceBlurRect({
      radius,
      region,
      shapeOptions,
      svg,
    })

    if (blurRect) {
      svg.insertBefore(blurRect, insertReference)
    }

    svg.insertBefore(backgroundRect, insertReference)
  }
}

function getQrBackgroundSurfaceRect(svg: SVGElement) {
  return Array.from(svg.children).find(
    (child) =>
      child.tagName.toLowerCase() === "rect" &&
      child.getAttribute("data-qr-layer") !== "background-surface-blur",
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
  state: Pick<QrStudioState, "backgroundGradient" | "backgroundOptions">,
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
  gradient: StudioGradient,
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
    gradientElement.setAttribute("cx", String(x + width / 2))
    gradientElement.setAttribute("cy", String(y + height / 2))
    gradientElement.setAttribute("r", String(Math.max(width, height) / 2))
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
  shapeOptions: QrStudioState["backgroundShapeOptions"],
) {
  const scale =
    Math.min(region.width / shape.viewBox.width, region.height / shape.viewBox.height)
  const x = region.x + (region.width - shape.viewBox.width * scale) / 2
  const y = region.y + (region.height - shape.viewBox.height * scale) / 2
  const baseTransform = `translate(${formatSvgNumber(x)} ${formatSvgNumber(y)}) scale(${formatSvgNumber(scale)})`
  const centerX = shape.viewBox.width / 2
  const centerY = shape.viewBox.height / 2

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
  state: Pick<QrStudioState, "backgroundGradient" | "backgroundShapeId" | "backgroundShapeOptions">,
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
  gradient: StudioGradient,
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
  }).filter((element): element is SVGElement => element !== null)
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
    QrStudioState,
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
    (child) => child.tagName.toLowerCase() === "rect",
  )

  if (backgroundRectIndex >= 0) {
    return children[backgroundRectIndex + 1] ?? null
  }

  return children.find((child) => child.tagName.toLowerCase() !== "defs") ?? null
}

function getAlignedCornerGradientRotation(
  gradient: Pick<StudioGradient, "enabled" | "rotation" | "type">,
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
