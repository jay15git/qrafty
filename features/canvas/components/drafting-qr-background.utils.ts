import type { DraftingCanvasLayer } from "@/features/canvas/model/layers"
import {
  getQrBackgroundShapeDefinition,
} from "@/features/qr/styles/background-shapes"
import {
  hasActiveBackgroundShapeOptions,
  type QraftyState,
  type QraftyGradient,
} from "@/features/qr/model/state"
import {
  getQraftyGradientCenter,
  qraftyRadialCenterAsPercent,
} from "@/features/qr/styles/qrafty-gradient-geometry"
import {
  getDraftingQrBackgroundPathTransform,
  getDraftingQrLayerLayout,
} from "@/features/qr/rendering/svg-extension"

export type DraftingQrBackgroundSvgPayload = {
  height: number
  markup: string
  shapeId: string
  width: number
}

export function buildDraftingQrBackgroundSvgPayload(
  layer: DraftingCanvasLayer,
  state: QraftyState,
): DraftingQrBackgroundSvgPayload | null {
  const markup = buildDraftingQrBackgroundPreviewSvgMarkup(layer, state)
  if (!markup) {
    return null
  }

  const layout = getDraftingQrLayerLayout(layer.width, state, layer.height)

  return {
    height: Math.max(1, layout.metrics.outerHeight),
    markup,
    shapeId: state.backgroundShapeId === "none" ? "rect" : state.backgroundShapeId,
    width: Math.max(1, layout.metrics.outerWidth),
  }
}

export function getDraftingQrBackgroundSvgMarkup(
  layer: DraftingCanvasLayer,
  state: QraftyState,
) {
  if (!shouldRenderDraftingQrBackground(state)) {
    return ""
  }

  const shape = getQrBackgroundShapeDefinition(state.backgroundShapeId)
  const layout = getDraftingQrLayerLayout(layer.width, state, layer.height)
  const { metrics, shapeOptions } = layout
  const ids = getDraftingQrBackgroundIds(layer.id)
  const defs = getDraftingQrBackgroundDefsMarkup(ids, state)
  const fill = getDraftingQrBackgroundFill(state, ids)
  const stroke = getDraftingQrBackgroundStroke(shapeOptions)
  const shapeName = shape?.id ?? "rect"
  const geometry = shape
    ? `<path d="${escapeXml(shape.path)}" transform="${getDraftingQrBackgroundPathTransform(shape, metrics.backingRegion, shapeOptions)}"/>`
    : `<rect x="${metrics.backingRegion.x}" y="${metrics.backingRegion.y}" width="${metrics.backingRegion.width}" height="${metrics.backingRegion.height}" rx="${(Math.min(metrics.backingRegion.width, metrics.backingRegion.height) / 2) * state.backgroundOptions.round}"/>`
  const { clipMarkup, contentMarkup } = wrapInnerStrokeMarkup({
    fillMarkup: ` fill="${escapeXml(fill)}"`,
    geometryMarkup: geometry,
    stroke,
    strokeClipId: ids.strokeClipId,
    strokeScale: shape
      ? Math.min(
          metrics.backingRegion.width / shape.viewBox.width,
          metrics.backingRegion.height / shape.viewBox.height,
        )
      : 1,
  })

  return `<g data-drafting-qr-background="${escapeXml(shapeName)}"><defs>${defs}${clipMarkup}</defs>${contentMarkup}</g>`
}

export function getDraftingQrBackgroundBounds(layer: DraftingCanvasLayer) {
  return {
    maxX: layer.x + layer.width,
    maxY: layer.y + layer.height,
    minX: layer.x,
    minY: layer.y,
  }
}

function shouldRenderDraftingQrBackground(state: QraftyState) {
  if (getQrBackgroundShapeDefinition(state.backgroundShapeId)) {
    return true
  }

  if (getDraftingQrBackgroundImageHref(state)) {
    return true
  }

  if (hasActiveBackgroundShapeOptions(state.backgroundShapeOptions)) {
    return true
  }

  return !state.backgroundOptions.transparent && Boolean(state.backgroundOptions.color)
}

function buildDraftingQrBackgroundPreviewSvgMarkup(
  layer: DraftingCanvasLayer,
  state: QraftyState,
) {
  if (!shouldRenderDraftingQrBackground(state)) {
    return null
  }

  const shape = getQrBackgroundShapeDefinition(state.backgroundShapeId)
  const layout = getDraftingQrLayerLayout(layer.width, state, layer.height)
  const { metrics, shapeOptions } = layout
  const ids = getDraftingQrBackgroundIds(layer.id)
  const defs = getDraftingQrBackgroundDefsMarkup(ids, state)
  const fill = getDraftingQrBackgroundFill(state, ids)
  const stroke = getDraftingQrBackgroundStroke(shapeOptions)
  const pathShapeOptions = {
    ...shapeOptions,
    tiltX: 0,
    tiltY: 0,
  }
  const geometry = shape
    ? `<path data-shape-view-box="${shape.viewBox.x ?? 0} ${shape.viewBox.y ?? 0} ${shape.viewBox.width} ${shape.viewBox.height}" d="${escapeXml(shape.path)}" transform="${getDraftingQrBackgroundPathTransform(shape, metrics.backingRegion, pathShapeOptions)}"/>`
    : `<rect x="${metrics.backingRegion.x}" y="${metrics.backingRegion.y}" width="${metrics.backingRegion.width}" height="${metrics.backingRegion.height}" rx="${(Math.min(metrics.backingRegion.width, metrics.backingRegion.height) / 2) * state.backgroundOptions.round}"/>`
  const { clipMarkup, contentMarkup } = wrapInnerStrokeMarkup({
    fillMarkup: ` fill="${escapeXml(fill)}"`,
    geometryMarkup: geometry,
    stroke,
    strokeClipId: ids.strokeClipId,
    strokeScale: shape
      ? Math.min(
          metrics.backingRegion.width / shape.viewBox.width,
          metrics.backingRegion.height / shape.viewBox.height,
        )
      : 1,
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${metrics.outerWidth}" height="${metrics.outerHeight}" viewBox="0 0 ${metrics.outerWidth} ${metrics.outerHeight}"><defs>${defs}${clipMarkup}</defs>${contentMarkup}</svg>`
}

function wrapInnerStrokeMarkup({
  fillMarkup,
  geometryMarkup,
  stroke,
  strokeClipId,
  strokeScale = 1,
}: {
  fillMarkup: string
  geometryMarkup: string
  stroke: { color: string; opacity: number; width: number }
  strokeClipId: string
  strokeScale?: number
}) {
  const renderedStrokeWidth =
    Math.round((stroke.width / Math.max(0.000001, strokeScale)) * 10000) / 10000
  const strokeAttrs =
    stroke.width > 0
      ? ` stroke="${escapeXml(stroke.color)}" stroke-opacity="${stroke.opacity}" stroke-width="${renderedStrokeWidth * 2}" stroke-linejoin="round"`
      : ""
  const paintedMarkup = geometryMarkup.replace("/>", `${fillMarkup}${strokeAttrs}/>`)

  if (stroke.width <= 0) {
    return { clipMarkup: "", contentMarkup: paintedMarkup }
  }

  return {
    clipMarkup: `<clipPath id="${strokeClipId}">${geometryMarkup}</clipPath>`,
    contentMarkup: `<g clip-path="url(#${strokeClipId})">${paintedMarkup}</g>`,
  }
}

type DraftingQrBackgroundIds = {
  gradientId: string
  imagePatternId: string
  strokeClipId: string
}

function getDraftingQrBackgroundIds(layerId: string): DraftingQrBackgroundIds {
  const id = getSvgId(layerId)

  return {
    gradientId: `${id}-qr-background-gradient`,
    imagePatternId: `${id}-qr-background-image`,
    strokeClipId: `${id}-qr-background-stroke-clip`,
  }
}

function getDraftingQrBackgroundFill(state: QraftyState, ids: DraftingQrBackgroundIds) {
  if (getDraftingQrBackgroundImageHref(state)) {
    return `url(#${ids.imagePatternId})`
  }

  if (state.backgroundGradient.enabled) {
    return `url(#${ids.gradientId})`
  }

  if (state.backgroundOptions.transparent) {
    return "none"
  }

  return state.backgroundOptions.color
}

function getDraftingQrBackgroundStroke(shapeOptions: QraftyState["backgroundShapeOptions"]) {
  const width = Math.max(0, shapeOptions.strokeWidth)

  return {
    color: shapeOptions.strokeColor,
    opacity: Math.max(0, Math.min(100, shapeOptions.strokeOpacity)) / 100,
    width,
  }
}

function getDraftingQrBackgroundDefsMarkup(
  ids: DraftingQrBackgroundIds,
  state: QraftyState,
) {
  const parts: string[] = []
  const imageHref = getDraftingQrBackgroundImageHref(state)

  if (state.backgroundGradient.enabled) {
    parts.push(getDraftingQrBackgroundGradientMarkup(ids.gradientId, state.backgroundGradient))
  }

  if (imageHref) {
    parts.push(
      `<pattern id="${ids.imagePatternId}" width="1" height="1" patternContentUnits="objectBoundingBox"><image href="${escapeXml(imageHref)}" width="1" height="1" preserveAspectRatio="xMidYMid slice"/></pattern>`,
    )
  }

  return parts.join("")
}

function getDraftingQrBackgroundGradientMarkup(id: string, gradient: QraftyGradient) {
  const stops = gradient.colorStops
    .map((stop) => `<stop offset="${stop.offset}" stop-color="${escapeXml(stop.color)}"/>`)
    .join("")

  if (gradient.type === "radial") {
    const center = getQraftyGradientCenter(gradient)
    const { cx, cy } = qraftyRadialCenterAsPercent(center)
    return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="50%">${stops}</radialGradient>`
  }

  return `<linearGradient id="${id}" x1="0%" x2="100%" y1="0%" y2="100%" gradientTransform="rotate(${(gradient.rotation * 180) / Math.PI} .5 .5)">${stops}</linearGradient>`
}

function getDraftingQrBackgroundImageHref(state: QraftyState) {
  return state.backgroundImage.source !== "none" ? state.backgroundImage.value : undefined
}

function getSvgId(value: string) {
  return value.replace(/[^\w-]+/g, "-")
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}
