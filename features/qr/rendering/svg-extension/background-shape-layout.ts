import type { CSSProperties } from "react"
import {
  getQrBackgroundShapeContentFrame,
  getQrBackgroundShapeDefinition,
  type QrBackgroundShapeContentFrame,
  type QrBackgroundShapeDefinition,
} from "@/features/qr/styles/background-shapes"
import {
  getQraftyQrQuietZoneFraction,
} from "@/features/qr/model/qr-module-metrics"
import {
  clampBackgroundShapeOffset,
  clampBackgroundShapeOpacity,
  clampBackgroundShapePaddingPx,
  clampBackgroundShapeTilt,
  DEFAULT_BACKGROUND_SHAPE_OPTIONS,
  clampQrSize,
  hasActiveBackgroundShapeOptions,
  type QraftyState,
} from "@/features/qr/model/state"
import {
  getBackgroundShapeSkewTransform,
} from "@/features/canvas/rendering/layer-transform"
import {
  type QrSvgExtensionOptions,
} from "./types"
import {
  coerceNonNegativeSvgNumber,
  coerceSvgNumber,
  formatSvgNumber,
  getNumericAttribute,
} from "./svg-dom-utils"

export function coerceQrMarginCells(margin: number) {
  return Math.min(80, Math.max(0, Math.floor(Number.isFinite(margin) ? margin : 12)))
}

/**
 * QR svg children are authored in module-cell units (viewBox = numCells), while
 * shape options are pixel values. Metrics are computed in cell space so the
 * background shape, quiet zone, and stroke align with the encoded modules.
 */
export function getCellSpaceBackgroundMetrics(
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

export function normalizeBackgroundShapeOptions(
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

export function getLegacyBackgroundShapePaddingPx(sizePercent: number) {
  if (!Number.isFinite(sizePercent) || sizePercent <= 100) {
    return 0
  }

  return clampBackgroundShapePaddingPx(((sizePercent - 100) / 200) * 240)
}

export function hasActiveBackgroundSurfaceOptions(
  options: Partial<QraftyState["backgroundShapeOptions"]> | undefined,
) {
  return hasActiveBackgroundShapeOptions(normalizeBackgroundShapeOptions(options))
}

export function getBackgroundShapeGradientKey(
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

export type BackgroundRenderMetrics = {
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

export type BackgroundShapeLayout = {
  contentFrame?: QrBackgroundShapeContentFrame
  quietZoneFraction?: number
  viewBox?: { height: number; width: number; x?: number; y?: number }
}

export const MIN_QR_CONTENT_TARGET = 8

export function getBackgroundRenderMetrics(
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

export function getBackgroundRenderLayout(
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
  shapeOptions: QraftyState["backgroundShapeOptions"],
) {
  return getBackgroundShapeTransform(
    shape,
    backingRegion,
    normalizeBackgroundShapeOptions(shapeOptions),
  )
}

export function scaleQrBackgroundShapeOptions(
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

export function getBackgroundShapeTransform(
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
