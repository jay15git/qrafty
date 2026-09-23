import type { DraftingCardState } from "@/features/canvas/model/card-state"
import {
  buildRoundedRectPath,
  cornerRadiiToCss,
  resolveCornerRadii,
  resolveLayerCornerRadii,
} from "@/features/canvas/model/corner-radius"
import {
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
  type DraftingTextRun,
} from "@/features/canvas/model/layers/shared"
import { getDraftingFontCssFamily } from "@/features/canvas/model/fonts"
import { layoutDraftingText } from "@/features/canvas/rendering/text-layout"
import { hasDraftingLayerShadow } from "@/features/canvas/rendering/qr-layer-shadow"
import { scaleNestedSvgMarkup } from "@/features/canvas/rendering/qr-artwork"
import { getLayerSvgTransform } from "@/features/canvas/rendering/layer-transform"
import { getShapeStrokeViewBoxScale, getShapeSvgPath } from "@/features/canvas/rendering/shape-layer-paths"
import { cssFillToSvgPaint, isConicCssFill, rasterizeConicCssFillToDataUrl } from "@/features/canvas/export/svg-css-fill"
import { qraftyGradientToFillCss } from "@/features/shell/inspector/settings-bridge"
import { shouldRenderShapeFillGradient } from "@/features/canvas/rendering/shape-fill.utils"
import { QR_BACKGROUND_SHAPES } from "@/features/qr/styles/background-shapes"
import {
  getDraftingQrBackgroundBounds,
  getDraftingQrBackgroundSvgMarkup,
} from "@/features/canvas/components/drafting-qr-background.utils"
import { getDraftingQrLayerLayout } from "@/features/qr/rendering/svg-extension"

import {
  collectIllustrationAssetPaths,
  getCachedIllustrationDisplaySrc,
  preloadIllustrationSvgMarkup,
} from "@/features/canvas/assets/illustration-recolor"
import type { QraftyState } from "@/features/qr/model/state"

export type LayeredSvgParts = {
  bounds: {
    height: number
    minX: number
    minY: number
    width: number
  }
  defs: string
  body: string
}

export type BuildLayeredSvgPartsOptions = {
  cardState: DraftingCardState
  layers: DraftingCanvasLayer[]
  qrMarkup: string
  state: QraftyState
  shaderSnapshots?: Record<string, string>
  /** When true, shader layers and card shader images are omitted (canvas compositor draws them). */
  omitShaderLayers?: boolean
  bounds?: {
    height: number
    minX: number
    minY: number
    width: number
  }
}

export async function buildLayeredSvgParts({
  cardState,
  layers,
  qrMarkup,
  state,
  shaderSnapshots,
  omitShaderLayers = false,
  bounds,
}: BuildLayeredSvgPartsOptions): Promise<LayeredSvgParts> {
  await preloadIllustrationSvgMarkup(collectIllustrationAssetPaths(layers))
  const visibleLayers = [...layers]
    .filter((layer) => layer.isVisible)
    .sort((a, b) => a.zIndex - b.zIndex)
  const resolvedBounds = bounds ?? getDraftingLayerBounds(visibleLayers)
  const clipDefs: string[] = []
  const body = visibleLayers
    .map((layer) =>
      getDraftingLayerSvg(layer, cardState, qrMarkup, state, shaderSnapshots, {
        clipDefs,
        omitShaderLayers,
      }),
    )
    .join("")
  const defs =
    clipDefs.join("") + visibleLayers.flatMap(getDraftingLayerFilterMarkups).filter(Boolean).join("")

  return { bounds: resolvedBounds, defs, body }
}

export function getDraftingLayerBounds(layers: DraftingCanvasLayer[]) {
  if (layers.length === 0) {
    return {
      height: 1,
      minX: 0,
      minY: 0,
      width: 1,
    }
  }

  const visualBounds = layers.map((layer) => {
    if (layer.kind === "qr") {
      return getDraftingQrBackgroundBounds(layer)
    }

    return {
      maxX: layer.x + layer.width,
      maxY: layer.y + layer.height,
      minX: layer.x,
      minY: layer.y,
    }
  })
  const minX = Math.floor(Math.min(...visualBounds.map((bounds) => bounds.minX)))
  const minY = Math.floor(Math.min(...visualBounds.map((bounds) => bounds.minY)))
  const maxX = Math.ceil(Math.max(...visualBounds.map((bounds) => bounds.maxX)))
  const maxY = Math.ceil(Math.max(...visualBounds.map((bounds) => bounds.maxY)))

  return {
    height: Math.max(1, maxY - minY),
    minX,
    minY,
    width: Math.max(1, maxX - minX),
  }
}

function getDraftingLayerSvg(
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
  qrMarkup: string,
  state: QraftyState,
  shaderSnapshots?: Record<string, string>,
  options?: LayeredSvgOptions,
) {
  if (layer.kind === "group") {
    return getDraftingGroupLayerSvg(layer, cardState, qrMarkup, state, shaderSnapshots, options)
  }

  if (layer.kind === "card") {
    return getDraftingCardLayerSvg(layer, cardState, shaderSnapshots, options)
  }

  if (layer.kind === "text") {
    return getDraftingTextLayerSvg(layer, options)
  }

  if (layer.kind === "image") {
    return getDraftingImageLayerSvg(layer)
  }

  if (layer.kind === "shape") {
    return getDraftingShapeLayerSvg(layer)
  }

  if (layer.kind === "shader") {
    if (options?.omitShaderLayers) {
      return ""
    }

    return getDraftingShaderLayerSvg(layer, shaderSnapshots)
  }

  return getDraftingQrLayerSvg(layer, qrMarkup, state)
}

function getDraftingLayerFilterAttr(layer: DraftingCanvasLayer) {
  return getDraftingLayerFilterMarkup(layer)
    ? ` filter="url(#${getSvgId(layer.id)}-filter)"`
    : ""
}

function getDraftingLayerFilterMarkup(layer: DraftingCanvasLayer) {
  const hasShadow = hasDraftingLayerShadow(layer)
  const hasBlur = layer.blur > 0

  if (!hasShadow && !hasBlur) {
    return ""
  }

  return `<filter id="${getSvgId(layer.id)}-filter" x="-50%" y="-50%" width="200%" height="200%">${hasShadow ? `<feDropShadow dx="${layer.shadow.offsetX}" dy="${layer.shadow.offsetY}" stdDeviation="${layer.shadow.blur / 2}" flood-color="${escapeXml(layer.shadow.color)}" flood-opacity="${layer.shadow.opacity / 100}"/>` : ""}${hasBlur ? `<feGaussianBlur stdDeviation="${layer.blur}"/>` : ""}</filter>`
}

function getDraftingLayerFilterMarkups(layer: DraftingCanvasLayer): string[] {
  return [
    getDraftingLayerFilterMarkup(layer),
    ...(layer.children?.flatMap(getDraftingLayerFilterMarkups) ?? []),
  ].filter(Boolean)
}

type LayeredSvgOptions = {
  clipDefs?: string[]
  omitShaderLayers?: boolean
}

function cardImageLayerMarkup(
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
  options?: LayeredSvgOptions,
) {
  return !options?.omitShaderLayers &&
    cardState.styleMode === "image" &&
    cardState.cardImage.value
    ? `<image href="${escapeXml(cardState.cardImage.value)}" x="0" y="0" width="${layer.width}" height="${layer.height}" preserveAspectRatio="${cardState.cardImage.fit === "contain" ? "xMidYMid meet" : "xMidYMid slice"}" opacity="${cardState.cardImage.opacity / 100}" />`
    : ""
}

function conicFillLayerMarkup(
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
  cardPath: string,
  options?: LayeredSvgOptions,
) {
  const conicClipId = `${getSvgId(layer.id)}-conic-clip`
  const conicSnapshot =
    !options?.omitShaderLayers && isConicCssFill(cardState.fill)
      ? rasterizeConicCssFillToDataUrl(cardState.fill, layer.width, layer.height)
      : undefined
  if (conicSnapshot && options?.clipDefs) {
    options.clipDefs.push(`<clipPath id="${conicClipId}"><path d="${cardPath}"/></clipPath>`)
  }
  return conicSnapshot
    ? `<image href="${escapeXml(conicSnapshot)}" x="0" y="0" width="${layer.width}" height="${layer.height}" preserveAspectRatio="none" clip-path="url(#${conicClipId})" />`
    : ""
}

function cardShaderLayerMarkup(
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
  cardPath: string,
  shaderSnapshots: Record<string, string> | undefined,
  options?: LayeredSvgOptions,
) {
  const clipId = `${getSvgId(layer.id)}-shader-clip`
  const shaderState =
    cardState.styleMode === "paper-shader"
      ? cardState.paperShader
      : cardState.styleMode === "image-filter"
        ? cardState.imageFilter
        : null
  const shaderSnapshot =
    !options?.omitShaderLayers &&
    shaderState &&
    (shaderSnapshots?.[layer.id] ??
      shaderSnapshots?.card ??
      shaderSnapshots?.[shaderState.shaderId])
  if (shaderSnapshot && options?.clipDefs) {
    options.clipDefs.push(`<clipPath id="${clipId}"><path d="${cardPath}"/></clipPath>`)
  }
  return shaderSnapshot
    ? `<image href="${escapeXml(shaderSnapshot)}" x="0" y="0" width="${layer.width}" height="${layer.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />`
    : ""
}

function getDraftingCardLayerSvg(
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
  shaderSnapshots?: Record<string, string>,
  options?: LayeredSvgOptions,
) {
  const filter = getDraftingLayerFilterAttr(layer)
  const strokeWidth = Math.max(0, cardState.border.width)
  const borderClipId = `${getSvgId(layer.id)}-border-clip`
  const stroke =
    strokeWidth > 0
      ? ` stroke="${escapeXml(cardState.border.color)}" stroke-opacity="${cardState.border.opacity / 100}" stroke-width="${strokeWidth * 2}" clip-path="url(#${borderClipId})"`
      : ""

  const cardImage = cardImageLayerMarkup(layer, cardState, options)

  const cardRadii = resolveCornerRadii(cardState.cornerRadii, cardState.cornerRadius)
  const cardPath = buildRoundedRectPath(layer.width, layer.height, cardRadii)
  const strokeClip =
    strokeWidth > 0 ? `<clipPath id="${borderClipId}"><path d="${cardPath}"/></clipPath>` : ""
  const fillPaint = cssFillToSvgPaint(cardState.fill, `${getSvgId(layer.id)}-fill-gradient`)
  if (fillPaint.def && options?.clipDefs) {
    options.clipDefs.push(fillPaint.def)
  }
  const conicMarkup = conicFillLayerMarkup(layer, cardState, cardPath, options)
  const shaderMarkup = cardShaderLayerMarkup(layer, cardState, cardPath, shaderSnapshots, options)

  return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}>${strokeClip}<path d="${cardPath}" fill="${escapeXml(fillPaint.fill)}"${stroke}/>${conicMarkup}${cardImage}${shaderMarkup}</g>`
}

function getDraftingGroupLayerSvg(
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
  qrMarkup: string,
  state: QraftyState,
  shaderSnapshots?: Record<string, string>,
  options?: LayeredSvgOptions,
): string {
  const filter = getDraftingLayerFilterAttr(layer)
  const body: string = (layer.children ?? [])
    .filter((child) => child.isVisible)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((child) =>
      getDraftingLayerSvg(child, cardState, qrMarkup, state, shaderSnapshots, options),
    )
    .join("")

  return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}>${body}</g>`
}

function getDraftingShaderLayerSvg(
  layer: DraftingCanvasLayer,
  shaderSnapshots?: Record<string, string>,
) {
  const filter = getDraftingLayerFilterAttr(layer)
  const paperShader = layer.paperShader
  const snapshot =
    paperShader &&
    (shaderSnapshots?.[layer.id] ?? shaderSnapshots?.[paperShader.shaderId])

  if (!snapshot) {
    return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}><rect x="0" y="0" width="${layer.width}" height="${layer.height}" fill="#111827" /></g>`
  }

  return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}><image href="${escapeXml(snapshot)}" x="0" y="0" width="${layer.width}" height="${layer.height}" preserveAspectRatio="xMidYMid slice" /></g>`
}

function getDraftingImageLayerSvg(layer: DraftingCanvasLayer) {
  const filter = getDraftingLayerFilterAttr(layer)
  const imageValue =
    getCachedIllustrationDisplaySrc(layer.imageValue, layer.illustrationColorStops) ??
    layer.imageValue ??
    ""

  if (!imageValue) {
    return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}><rect x="0" y="0" width="${layer.width}" height="${layer.height}" fill="none" stroke="#d4d4d8"/></g>`
  }

  const preserveAspectRatio = layer.imageFit === "contain" ? "xMidYMid meet" : "xMidYMid slice"
  const radii = resolveLayerCornerRadii(layer, 0)
  const hasRadius = radii.topLeft > 0 || radii.topRight > 0 || radii.bottomRight > 0 || radii.bottomLeft > 0
  const clip =
    hasRadius
      ? `<clipPath id="${getSvgId(layer.id)}-clip"><path d="${buildRoundedRectPath(layer.width, layer.height, radii)}"/></clipPath>`
      : ""
  const clipRef = hasRadius ? ` clip-path="url(#${getSvgId(layer.id)}-clip)"` : ""

  return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}>${clip}<image href="${escapeXml(imageValue)}" x="0" y="0" width="${layer.width}" height="${layer.height}" preserveAspectRatio="${preserveAspectRatio}"${clipRef}/></g>`
}

function getDraftingShapeLayerSvg(layer: DraftingCanvasLayer) {
  const filter = getDraftingLayerFilterAttr(layer)
  const shapeId = layer.shapeId ?? "rounded-square"
  const definition = QR_BACKGROUND_SHAPES.find((shape) => shape.id === shapeId)
  const fill = layer.fillMode === "none" ? "none" : escapeXml(layer.fill ?? "#E8E8E8")
  const strokeWidth = layer.strokeWidth ?? 0
  const isStrokeOnlyShape = shapeId === "line" || shapeId === "arrow"
  const strokeClipId = `${getSvgId(layer.id)}-stroke-clip`
  const viewBoxSize =
    shapeId === "rect"
      ? { height: layer.height, width: layer.width }
      : definition
        ? definition.viewBox
        : { height: 100, width: 100 }
  const strokeWidthVb =
    strokeWidth *
    getShapeStrokeViewBoxScale(layer, viewBoxSize.width, viewBoxSize.height)
  const useInnerStroke = strokeWidthVb > 0 && !isStrokeOnlyShape
  const strokeAttrs =
    strokeWidthVb > 0
      ? ` stroke="${escapeXml(layer.stroke ?? "#171717")}" stroke-width="${useInnerStroke ? strokeWidthVb * 2 : strokeWidthVb}" stroke-opacity="${(layer.strokeOpacity ?? 100) / 100}"${useInnerStroke ? ` clip-path="url(#${strokeClipId})"` : ""}`
      : ""
  const shapeMarkup = (attrs: string) =>
    shapeId === "rect"
      ? `<path d="${buildRoundedRectPath(layer.width, layer.height, resolveLayerCornerRadii(layer, 0))}"${attrs}/>`
      : definition
        ? `<path d="${definition.path}"${attrs}/>`
        : getShapeSvgPath(shapeId).replace("/>", `${attrs}/>`)
  const clipGeometry = shapeMarkup("")
  const innerMarkup = shapeMarkup(` fill="${fill}"${strokeAttrs}`)
  const strokeClip = useInnerStroke
    ? `<clipPath id="${strokeClipId}">${clipGeometry}</clipPath>`
    : ""
  const viewBox =
    shapeId === "rect"
      ? `0 0 ${layer.width} ${layer.height}`
      : definition
        ? `${definition.viewBox.x ?? 0} ${definition.viewBox.y ?? 0} ${definition.viewBox.width} ${definition.viewBox.height}`
        : "0 0 100 100"

  return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}><svg x="0" y="0" width="${layer.width}" height="${layer.height}" viewBox="${viewBox}" preserveAspectRatio="none">${strokeClip}${innerMarkup}</svg></g>`
}

function getDraftingQrLayerSvg(
  layer: DraftingCanvasLayer,
  qrMarkup: string,
  state: QraftyState,
) {
  const filter = getDraftingLayerFilterAttr(layer)
  const layout = getDraftingQrLayerLayout(layer.width, state, layer.height)
  const { metrics, innerWidth, innerHeight } = layout
  const qrSvg = scaleNestedSvgMarkup(qrMarkup, innerWidth, innerHeight)
  const qrGroup =
    metrics.translateX || metrics.translateY
      ? `<g transform="translate(${metrics.translateX} ${metrics.translateY})">${qrSvg}</g>`
      : qrSvg

  return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}>${getDraftingQrBackgroundSvgMarkup(layer, state)}${qrGroup}</g>`
}

const TEXT_ALIGN_ANCHORS: Record<string, string> = {
  center: "middle",
  right: "end",
}

function getDraftingTextLayerSvg(
  layer: DraftingCanvasLayer,
  options?: Pick<LayeredSvgOptions, "clipDefs">,
) {
  const filter = getDraftingLayerFilterAttr(layer)
  const fontSize = layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize
  const lineHeight = layer.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight
  const textAlign = layer.textAlign ?? DEFAULT_DRAFTING_TEXT_LAYER.textAlign
  const anchor = TEXT_ALIGN_ANCHORS[textAlign] ?? "start"
  const x = textAlign === "center" ? layer.width / 2 : textAlign === "right" ? layer.width : 0
  const hasTextRuns =
    Boolean(layer.textRuns?.length) &&
    layer.textRuns?.map((run) => run.text).join("") === (layer.text ?? "")

  const fillPaint =
    shouldRenderShapeFillGradient(layer) && layer.fillGradient
      ? cssFillToSvgPaint(
          qraftyGradientToFillCss(layer.fillGradient),
          `${getSvgId(layer.id)}-text-fill-gradient`,
        )
      : { def: "", fill: layer.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill }
  if (fillPaint.def && options?.clipDefs) {
    options.clipDefs.push(fillPaint.def)
  }

  const lineContents = hasTextRuns
    ? splitDraftingTextRunsByLine(layer).map((runs) =>
        runs.map((run) => getDraftingTextRunSvg(layer, run, fillPaint.fill)).join(""),
      )
    : layoutDraftingText(layer).lines.map(escapeXml)
  const tspans = lineContents
    .map((content, index) => {
      const dy = index === 0 ? fontSize : fontSize * lineHeight

      return `<tspan x="${x}" dy="${dy}">${content}</tspan>`
    })
    .join("")
  const textAttrs = hasTextRuns
    ? ""
    : `fill="${escapeXml(fillPaint.fill)}" font-family="${escapeXml(getDraftingFontCssFamily({ fontFamily: layer.fontFamily, fontId: layer.fontId }))}" font-size="${fontSize}" font-style="${layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle}" font-weight="${layer.fontWeight ?? DEFAULT_DRAFTING_TEXT_LAYER.fontWeight}" `
  const decoration = !hasTextRuns && layer.underline ? ` text-decoration="underline"` : ""

  return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}><text ${textAttrs}letter-spacing="${layer.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing}" text-anchor="${anchor}"${decoration}>${tspans}</text></g>`
}

function splitDraftingTextRunsByLine(layer: DraftingCanvasLayer) {
  const runs = getDraftingTextLayerRuns(layer)
  const lines: DraftingTextRun[][] = [[]]

  for (const run of runs) {
    const parts = run.text.split(/\r?\n/)

    parts.forEach((part, index) => {
      if (index > 0) {
        lines.push([])
      }

      if (part) {
        lines.at(-1)?.push({ ...run, text: part })
      }
    })
  }

  return lines.length > 0 ? lines : [[{ text: "" }]]
}

function getDraftingTextLayerRuns(layer: DraftingCanvasLayer): DraftingTextRun[] {
  const text = layer.text ?? ""

  if (!layer.textRuns?.length || layer.textRuns.map((run) => run.text).join("") !== text) {
    return text ? [{ text }] : []
  }

  return layer.textRuns
}

function getDraftingTextRunSvg(
  layer: DraftingCanvasLayer,
  run: DraftingTextRun,
  layerFillPaint: string,
) {
  const decoration = (run.underline ?? layer.underline) ? ` text-decoration="underline"` : ""

  return `<tspan fill="${escapeXml(run.fill ?? layerFillPaint)}" font-family="${escapeXml(getDraftingFontCssFamily({ fontFamily: run.fontFamily ?? layer.fontFamily, fontId: run.fontId ?? layer.fontId }))}" font-size="${run.fontSize ?? layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize}" font-style="${run.fontStyle ?? layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle}" font-weight="${run.fontWeight ?? layer.fontWeight ?? DEFAULT_DRAFTING_TEXT_LAYER.fontWeight}"${decoration}>${escapeXml(run.text)}</tspan>`
}

function getDraftingLayerSvgTransform(layer: DraftingCanvasLayer) {
  return getLayerSvgTransform(layer)
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
