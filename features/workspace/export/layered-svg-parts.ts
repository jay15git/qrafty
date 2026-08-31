import type { DraftingCardState } from "@/features/workspace/model/card-state"
import {
  buildRoundedRectPath,
  cornerRadiiToCss,
  resolveCornerRadii,
  resolveLayerCornerRadii,
} from "@/features/workspace/model/corner-radius"
import {
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
  type DraftingTextRun,
} from "@/features/workspace/model/layers"
import { getDraftingFontCssFamily } from "@/features/workspace/model/fonts"
import { layoutDraftingText } from "@/features/workspace/rendering/text-layout"
import { hasDraftingLayerShadow } from "@/features/workspace/rendering/qr-layer-shadow"
import { scaleNestedSvgMarkup } from "@/features/workspace/rendering/qr-artwork"
import { getLayerSvgTransform } from "@/features/workspace/rendering/layer-transform"
import { getShapeSvgPath } from "@/features/workspace/rendering/shape-layer-paths"
import { cssFillToSvgPaint, isConicCssFill, rasterizeConicCssFillToDataUrl } from "@/features/workspace/export/svg-css-fill"
import { QR_BACKGROUND_SHAPES } from "@/features/qr-code/styles/background-shapes"
import {
  getDraftingQrBackgroundBounds,
  getDraftingQrBackgroundSvgMarkup,
} from "@/features/workspace/components/drafting-qr-background.utils"

import {
  collectIllustrationAssetPaths,
  getCachedIllustrationDisplaySrc,
  preloadIllustrationSvgMarkup,
} from "@/features/workspace/assets/illustration-recolor"
import type { QraftyState } from "@/features/qr-code/model/state"

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
  const resolvedBounds = bounds ?? getDraftingLayerBounds(visibleLayers, state)
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

export function getDraftingLayerBounds(layers: DraftingCanvasLayer[], state: QraftyState) {
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
      return getDraftingQrBackgroundBounds(layer, state)
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
  options?: {
    clipDefs?: string[]
    omitShaderLayers?: boolean
  },
) {
  if (layer.kind === "group") {
    return getDraftingGroupLayerSvg(layer, cardState, qrMarkup, state, shaderSnapshots, options)
  }

  if (layer.kind === "card") {
    return getDraftingCardLayerSvg(layer, cardState, shaderSnapshots, options)
  }

  if (layer.kind === "text") {
    return getDraftingTextLayerSvg(layer)
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

function getDraftingCardLayerSvg(
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
  shaderSnapshots?: Record<string, string>,
  options?: {
    clipDefs?: string[]
    omitShaderLayers?: boolean
  },
) {
  const filter = getDraftingLayerFilterMarkup(layer)
    ? ` filter="url(#${getSvgId(layer.id)}-filter)"`
    : ""
  const strokeWidth = Math.max(0, cardState.border.width)
  const stroke =
    strokeWidth > 0
      ? ` stroke="${escapeXml(cardState.border.color)}" stroke-opacity="${cardState.border.opacity / 100}" stroke-width="${strokeWidth}"`
      : ""

  const cardImage =
    !options?.omitShaderLayers &&
    cardState.styleMode === "image" &&
    cardState.cardImage.value
      ? `<image href="${escapeXml(cardState.cardImage.value)}" x="0" y="0" width="${layer.width}" height="${layer.height}" preserveAspectRatio="${cardState.cardImage.fit === "contain" ? "xMidYMid meet" : "xMidYMid slice"}" opacity="${cardState.cardImage.opacity / 100}" />`
      : ""

  const cardRadii = resolveCornerRadii(cardState.cornerRadii, cardState.cornerRadius)
  const cardPath = buildRoundedRectPath(layer.width, layer.height, cardRadii)
  const fillGradientId = `${getSvgId(layer.id)}-fill-gradient`
  const fillPaint = cssFillToSvgPaint(cardState.fill, fillGradientId)
  if (fillPaint.def && options?.clipDefs) {
    options.clipDefs.push(fillPaint.def)
  }
  const clipId = `${getSvgId(layer.id)}-shader-clip`
  const conicClipId = `${getSvgId(layer.id)}-conic-clip`
  const conicSnapshot =
    !options?.omitShaderLayers && isConicCssFill(cardState.fill)
      ? rasterizeConicCssFillToDataUrl(cardState.fill, layer.width, layer.height)
      : undefined
  if (conicSnapshot && options?.clipDefs) {
    options.clipDefs.push(`<clipPath id="${conicClipId}"><path d="${cardPath}"/></clipPath>`)
  }
  const conicMarkup = conicSnapshot
    ? `<image href="${escapeXml(conicSnapshot)}" x="0" y="0" width="${layer.width}" height="${layer.height}" preserveAspectRatio="none" clip-path="url(#${conicClipId})" />`
    : ""
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
  const shaderMarkup = shaderSnapshot
    ? `<image href="${escapeXml(shaderSnapshot)}" x="0" y="0" width="${layer.width}" height="${layer.height}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})" />`
    : ""

  return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}><path d="${cardPath}" fill="${escapeXml(fillPaint.fill)}"${stroke}/>${conicMarkup}${cardImage}${shaderMarkup}</g>`
}

function getDraftingGroupLayerSvg(
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
  qrMarkup: string,
  state: QraftyState,
  shaderSnapshots?: Record<string, string>,
  options?: {
    clipDefs?: string[]
    omitShaderLayers?: boolean
  },
): string {
  const filter = getDraftingLayerFilterMarkup(layer)
    ? ` filter="url(#${getSvgId(layer.id)}-filter)"`
    : ""
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
  const filter = getDraftingLayerFilterMarkup(layer)
    ? ` filter="url(#${getSvgId(layer.id)}-filter)"`
    : ""
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
  const filter = getDraftingLayerFilterMarkup(layer)
    ? ` filter="url(#${getSvgId(layer.id)}-filter)"`
    : ""
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
  const filter = getDraftingLayerFilterMarkup(layer)
    ? ` filter="url(#${getSvgId(layer.id)}-filter)"`
    : ""
  const shapeId = layer.shapeId ?? "rounded-square"
  const definition = QR_BACKGROUND_SHAPES.find((shape) => shape.id === shapeId)
  const fill = layer.fillMode === "none" ? "none" : escapeXml(layer.fill ?? "#E8E8E8")
  const strokeWidth = layer.strokeWidth ?? 0
  const strokeAttrs =
    strokeWidth > 0
      ? ` stroke="${escapeXml(layer.stroke ?? "#171717")}" stroke-width="${strokeWidth}" stroke-opacity="${(layer.strokeOpacity ?? 100) / 100}"`
      : ""
  const innerMarkup =
    shapeId === "rect"
      ? `<path d="${buildRoundedRectPath(layer.width, layer.height, resolveLayerCornerRadii(layer, 0))}" fill="${fill}"${strokeAttrs}/>`
      : definition
        ? `<path d="${definition.path}" fill="${fill}"${strokeAttrs}/>`
        : getShapeSvgPath(shapeId).replace("/>", ` fill="${fill}"${strokeAttrs}/>`)
  const viewBox =
    shapeId === "rect"
      ? `0 0 ${layer.width} ${layer.height}`
      : definition
        ? `0 0 ${definition.viewBox.width} ${definition.viewBox.height}`
        : "0 0 100 100"

  return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}><svg x="0" y="0" width="${layer.width}" height="${layer.height}" viewBox="${viewBox}" preserveAspectRatio="none">${innerMarkup}</svg></g>`
}

function getDraftingQrLayerSvg(
  layer: DraftingCanvasLayer,
  qrMarkup: string,
  state: QraftyState,
) {
  const filter = getDraftingLayerFilterMarkup(layer)
    ? ` filter="url(#${getSvgId(layer.id)}-filter)"`
    : ""

  return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}>${getDraftingQrBackgroundSvgMarkup(layer, state)}${scaleNestedSvgMarkup(qrMarkup, layer.width, layer.height)}</g>`
}

function getDraftingTextLayerSvg(layer: DraftingCanvasLayer) {
  const filter = getDraftingLayerFilterMarkup(layer)
    ? ` filter="url(#${getSvgId(layer.id)}-filter)"`
    : ""
  const fontSize = layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize
  const lineHeight = layer.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight
  const textAlign = layer.textAlign ?? DEFAULT_DRAFTING_TEXT_LAYER.textAlign
  const anchor = textAlign === "center" ? "middle" : textAlign === "right" ? "end" : "start"
  const x = textAlign === "center" ? layer.width / 2 : textAlign === "right" ? layer.width : 0
  const hasTextRuns =
    Boolean(layer.textRuns?.length) &&
    layer.textRuns?.map((run) => run.text).join("") === (layer.text ?? "")

  if (!hasTextRuns) {
    const lines = layoutDraftingText(layer).lines
    const tspans = lines
      .map((line, index) => {
        const dy = index === 0 ? fontSize : fontSize * lineHeight

        return `<tspan x="${x}" dy="${dy}">${escapeXml(line)}</tspan>`
      })
      .join("")
    const decoration = layer.underline ? ` text-decoration="underline"` : ""

    return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}><text fill="${escapeXml(layer.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill)}" font-family="${escapeXml(getDraftingFontCssFamily({ fontFamily: layer.fontFamily, fontId: layer.fontId }))}" font-size="${fontSize}" font-style="${layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle}" font-weight="${layer.fontWeight ?? DEFAULT_DRAFTING_TEXT_LAYER.fontWeight}" letter-spacing="${layer.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing}" text-anchor="${anchor}"${decoration}>${tspans}</text></g>`
  }

  const lineRuns = splitDraftingTextRunsByLine(layer)
  const tspans = lineRuns
    .map((runs, lineIndex) => {
      const dy = lineIndex === 0 ? fontSize : fontSize * lineHeight
      const content = runs.map((run) => getDraftingTextRunSvg(layer, run)).join("")

      return `<tspan x="${x}" dy="${dy}">${content}</tspan>`
    })
    .join("")

  return `<g opacity="${layer.opacity}" transform="${getDraftingLayerSvgTransform(layer)}"${filter}><text letter-spacing="${layer.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing}" text-anchor="${anchor}">${tspans}</text></g>`
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

function getDraftingTextRunSvg(layer: DraftingCanvasLayer, run: DraftingTextRun) {
  const decoration = (run.underline ?? layer.underline) ? ` text-decoration="underline"` : ""

  return `<tspan fill="${escapeXml(run.fill ?? layer.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill)}" font-family="${escapeXml(getDraftingFontCssFamily({ fontFamily: run.fontFamily ?? layer.fontFamily, fontId: run.fontId ?? layer.fontId }))}" font-size="${run.fontSize ?? layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize}" font-style="${run.fontStyle ?? layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle}" font-weight="${run.fontWeight ?? layer.fontWeight ?? DEFAULT_DRAFTING_TEXT_LAYER.fontWeight}"${decoration}>${escapeXml(run.text)}</tspan>`
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
