import { type DomLayerNode } from "@qrafty/qr-internal/codegen"

import type { DraftingCardState } from "@/features/workspace/model/card-state"
import { cornerRadiiToCss, resolveLayerCornerRadii } from "@/features/workspace/model/corner-radius"
import {
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
  type DraftingTextRun,
} from "@/features/workspace/model/layers"
import { layoutDraftingText } from "@/features/workspace/rendering/text-layout"
import { getShapeSvgPath } from "@/features/workspace/rendering/shape-layer-paths"
import { QR_BACKGROUND_SHAPES } from "@/features/qr-code/styles/background-shapes"
import {
  cssPropertiesToInlineStyle,
  getDraftingCardDomStyle,
  getDraftingImageDomStyle,
  getDraftingShapeDomStyle,
  getExportLayerEffectStyle,
  getExportLayerPlacementStyle,
  getTextLayerStyle,
  getTextRunStyle,
  serializeCssProperties,
} from "@/features/workspace/rendering/layer-dom-styles"
import { toQraftyQrConfig } from "@/features/qr-code/adapters/qrafty-config"
import type { QraftyState } from "@/features/qr-code/model/state"
import { getDraftingQrLayerLayout } from "@/features/qr-code/rendering/svg-extension"
import { buildDraftingQrBackgroundSvgPayload } from "@/features/workspace/components/drafting-qr-background.utils"

import {
  collectIllustrationAssetPaths,
  getCachedIllustrationDisplaySrc,
  preloadIllustrationSvgMarkup,
} from "@/features/workspace/assets/illustration-recolor"

import { getDraftingLayerBounds } from "./layered-svg-parts"

export type LayeredDomParts = {
  bounds: {
    height: number
    minX: number
    minY: number
    width: number
  }
  domLayers: DomLayerNode[]
}

export async function buildLayeredDomParts({
  cardState,
  layers,
  qrMarkup,
  state,
}: {
  cardState: DraftingCardState
  layers: DraftingCanvasLayer[]
  qrMarkup: string
  state: QraftyState
}): Promise<LayeredDomParts> {
  await preloadIllustrationSvgMarkup(collectIllustrationAssetPaths(layers))
  const bounds = getDraftingLayerBounds(layers, state)
  const domLayers = layers
    .filter((layer) => layer.isVisible)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((layer) => getDraftingLayerDomNode(layer, cardState, qrMarkup, state))
    .filter((node): node is DomLayerNode => Boolean(node))

  return { bounds, domLayers }
}

function getDraftingLayerDomNode(
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
  qrMarkup: string,
  state: QraftyState,
): DomLayerNode | null {
  if (!layer.isVisible) {
    return null
  }

  if (layer.kind === "group") {
    return getDraftingGroupLayerDom(layer, cardState, qrMarkup, state)
  }

  if (layer.kind === "card") {
    return getDraftingCardLayerDom(layer, cardState)
  }

  if (layer.kind === "text") {
    return getDraftingTextLayerDom(layer)
  }

  if (layer.kind === "image") {
    return getDraftingImageLayerDom(layer)
  }

  if (layer.kind === "shape") {
    return getDraftingShapeLayerDom(layer)
  }

  if (layer.kind === "shader") {
    return null
  }

  return getDraftingQrLayerDom(layer, qrMarkup, state)
}

function getDraftingGroupLayerDom(
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
  qrMarkup: string,
  state: QraftyState,
): DomLayerNode {
  const children = (layer.children ?? [])
    .filter((child) => child.isVisible)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((child) => getDraftingLayerDomNode(child, cardState, qrMarkup, state))
    .filter((node): node is DomLayerNode => Boolean(node))

  return {
    kind: "group",
    id: layer.id,
    bounds: {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
    },
    style: {
      ...getExportLayerPlacementStyle(layer),
      ...getExportLayerEffectStyle(layer),
      overflow: "visible",
    },
    children,
  }
}

function getDraftingCardLayerDom(
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
): DomLayerNode {
  return {
    kind: "card",
    id: layer.id,
    bounds: {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
    },
    style: {
      ...getExportLayerPlacementStyle(layer),
      ...getExportLayerEffectStyle(layer),
      ...getDraftingCardDomStyle(cardState, layer),
      overflow: "hidden",
    },
  }
}

function getDraftingTextLayerDom(layer: DraftingCanvasLayer): DomLayerNode {
  const textStyle = serializeCssProperties(getTextLayerStyle(layer) as Record<string, string | number>)
  const hasTextRuns =
    Boolean(layer.textRuns?.length) &&
    layer.textRuns?.map((run) => run.text).join("") === (layer.text ?? "")

  return {
    kind: "text",
    id: layer.id,
    bounds: {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
    },
    style: {
      ...getExportLayerPlacementStyle(layer),
      ...getExportLayerEffectStyle(layer),
      ...textStyle,
      height: "fit-content",
      overflow: "hidden",
    },
    htmlContent: hasTextRuns ? getDraftingTextRunsHtml(layer) : undefined,
    content: hasTextRuns ? undefined : getDraftingTextContent(layer),
  }
}

function getDraftingImageLayerDom(layer: DraftingCanvasLayer): DomLayerNode {
  const imageValue =
    getCachedIllustrationDisplaySrc(layer.imageValue, layer.illustrationColorStops) ??
    layer.imageValue ??
    ""
  const imageStyle = getDraftingImageDomStyle(layer)

  return {
    kind: "image",
    id: layer.id,
    bounds: {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
    },
    style: {
      ...getExportLayerPlacementStyle(layer),
      ...getExportLayerEffectStyle(layer),
      ...imageStyle,
      overflow: "hidden",
    },
    htmlContent: imageValue
      ? `<img alt="" src="${escapeHtml(imageValue)}" style="${cssPropertiesToInlineStyle({
          borderRadius: cornerRadiiToCss(resolveLayerCornerRadii(layer, 0)),
          height: "100%",
          objectFit: layer.imageFit ?? "cover",
          width: "100%",
        })}" />`
      : undefined,
    content: imageValue ? undefined : "Image",
  }
}

function getDraftingShapeLayerDom(layer: DraftingCanvasLayer): DomLayerNode {
  const shapeId = layer.shapeId ?? "rounded-square"
  const definition = QR_BACKGROUND_SHAPES.find((shape) => shape.id === shapeId)
  const fill = layer.fillMode === "none" ? "none" : escapeXml(layer.fill ?? "#E8E8E8")
  const strokeWidth = layer.strokeWidth ?? 0
  const stroke = layer.stroke ?? "#171717"
  const strokeOpacity = (layer.strokeOpacity ?? 100) / 100
  const strokeAttrs =
    strokeWidth > 0
      ? ` stroke="${escapeXml(stroke)}" stroke-width="${strokeWidth}" stroke-opacity="${strokeOpacity}"`
      : ""
  const innerMarkup = definition
    ? `<path d="${definition.path}" fill="${fill}"${strokeAttrs}/>`
    : getShapeSvgPath(shapeId).replace("/>", ` fill="${fill}"${strokeAttrs}/>`)
  const viewBox = definition
    ? `0 0 ${definition.viewBox.width} ${definition.viewBox.height}`
    : "0 0 100 100"

  return {
    kind: "shape",
    id: layer.id,
    bounds: {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
    },
    style: {
      ...getExportLayerPlacementStyle(layer),
      ...getExportLayerEffectStyle(layer),
      ...getDraftingShapeDomStyle(layer),
      overflow: "visible",
    },
    svgInner: `<svg aria-hidden="true" width="${layer.width}" height="${layer.height}" viewBox="${viewBox}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${innerMarkup}</svg>`,
  }
}

function buildDraftingQrForegroundDomNode(
  layer: DraftingCanvasLayer,
  state: QraftyState,
): DomLayerNode | null {
  const layout = getDraftingQrLayerLayout(layer.width, state, layer.height)

  return {
    kind: "module",
    id: `${layer.id}-qr-foreground`,
    bounds: {
      x: layout.metrics.translateX,
      y: layout.metrics.translateY,
      width: layout.innerWidth,
      height: layout.innerHeight,
    },
    style: {
      height: layout.innerHeight,
      left: layout.metrics.translateX,
      pointerEvents: "none",
      position: "absolute",
      top: layout.metrics.translateY,
      width: layout.innerWidth,
      zIndex: 10,
    },
    qrProps: {
      ...toQraftyQrConfig(state),
      size: layout.innerWidth,
      style: {
        display: "block",
        height: "100%",
        width: "100%",
      },
    },
  }
}

function getDraftingQrLayerDom(
  layer: DraftingCanvasLayer,
  _qrMarkup: string,
  state: QraftyState,
): DomLayerNode {
  const background = buildDraftingQrBackgroundSvgPayload(layer, state)
  const foreground = buildDraftingQrForegroundDomNode(layer, state)
  const children: DomLayerNode[] = []

  if (background) {
    children.push({
      kind: "module",
      id: `${layer.id}-qr-background`,
      bounds: {
        x: 0,
        y: 0,
        width: layer.width,
        height: layer.height,
      },
      style: {
        height: layer.height,
        left: 0,
        overflow: "visible",
        pointerEvents: "none",
        position: "absolute",
        top: 0,
        width: layer.width,
        zIndex: 0,
      },
      svgInner: background.markup,
    })
  }

  if (foreground) {
    children.push(foreground)
  }

  return {
    kind: "qr",
    id: layer.id,
    bounds: {
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
    },
    style: {
      ...getExportLayerPlacementStyle(layer),
      ...getExportLayerEffectStyle(layer),
      overflow: "visible",
      position: "relative",
    },
    children: children.length > 0 ? children : undefined,
  }
}

function getDraftingTextContent(layer: DraftingCanvasLayer) {
  return layoutDraftingText(layer).lines.join("\n")
}

function getDraftingTextRunsHtml(layer: DraftingCanvasLayer) {
  return getDraftingTextLayerRuns(layer)
    .map((run) => {
      const style = cssPropertiesToInlineStyle(getTextRunStyle(layer, run))
      return `<span style="${style}">${escapeHtml(run.text)}</span>`
    })
    .join("")
}

function getDraftingTextLayerRuns(layer: DraftingCanvasLayer): DraftingTextRun[] {
  const text = layer.text ?? ""

  if (!layer.textRuns?.length || layer.textRuns.map((run) => run.text).join("") !== text) {
    return text ? [{ text }] : []
  }

  return layer.textRuns
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function escapeXml(value: string) {
  return escapeHtml(value).replaceAll("'", "&apos;")
}
