import { type DomLayerNode } from "@qrafty/qr-internal/codegen";

import type { CanvasCardState } from "@/features/canvas/model/card-state";
import { cornerRadiiToCss, resolveLayerCornerRadii } from "@/features/canvas/model/corner-radius";
import {
  DEFAULT_DRAFTING_TEXT_LAYER,
  type CanvasLayer,
  type CanvasTextRun,
} from "@/features/canvas/model/layers/shared";
import { layoutCanvasText } from "@/features/canvas/rendering/text-layout";
import {
  getShapeStrokeViewBoxScale,
  getShapeSvgPath,
} from "@/features/canvas/rendering/shape-layer-paths";
import { getCanvasPerSideBorderStyle } from "@/features/canvas/rendering/layer-appearance";
import { QR_BACKGROUND_SHAPES } from "@/features/qr/styles/background-shapes";
import {
  cssPropertiesToInlineStyle,
  getCanvasCardDomStyle,
  getCanvasImageDomStyle,
  getCanvasShapeDomStyle,
  getExportLayerEffectStyle,
  getExportLayerPlacementStyle,
  getTextLayerStyle,
  getTextRunStyle,
  serializeCssProperties,
} from "@/features/canvas/rendering/layer-dom-styles";
import { toQraftyQrConfig } from "@/features/qr/adapters/qrafty-config";
import type { QraftyState } from "@/features/qr/model/state";
import { getCanvasQrLayerLayout } from "@/features/qr/rendering/svg-extension";
import { buildCanvasQrBackgroundSvgPayload } from "@/features/canvas/components/canvas-qr-background";

import {
  collectIllustrationAssetPaths,
  getCachedIllustrationDisplaySrc,
  preloadIllustrationSvgMarkup,
} from "@/features/canvas/assets/illustration-recolor";

import { getCanvasLayerBounds } from "./layered-svg-parts";

export type LayeredDomParts = {
  bounds: {
    height: number;
    minX: number;
    minY: number;
    width: number;
  };
  domLayers: DomLayerNode[];
};

export async function buildLayeredDomParts({
  cardState,
  layers,
  qrMarkup,
  state,
}: {
  cardState: CanvasCardState;
  layers: CanvasLayer[];
  qrMarkup: string;
  state: QraftyState;
}): Promise<LayeredDomParts> {
  await preloadIllustrationSvgMarkup(collectIllustrationAssetPaths(layers));
  const bounds = getCanvasLayerBounds(layers);
  const domLayers = layers
    .filter((layer) => layer.isVisible)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((layer) => getCanvasLayerDomNode(layer, cardState, qrMarkup, state))
    .filter((node): node is DomLayerNode => Boolean(node));

  return { bounds, domLayers };
}

function getCanvasLayerDomNode(
  layer: CanvasLayer,
  cardState: CanvasCardState,
  qrMarkup: string,
  state: QraftyState,
): DomLayerNode | null {
  if (!layer.isVisible) {
    return null;
  }

  if (layer.kind === "group") {
    return getCanvasGroupLayerDom(layer, cardState, qrMarkup, state);
  }

  if (layer.kind === "card") {
    return getCanvasCardLayerDom(layer, cardState);
  }

  if (layer.kind === "text") {
    return getCanvasTextLayerDom(layer);
  }

  if (layer.kind === "image") {
    return getCanvasImageLayerDom(layer);
  }

  if (layer.kind === "shape") {
    return getCanvasShapeLayerDom(layer);
  }

  if (layer.kind === "shader") {
    return null;
  }

  return getCanvasQrLayerDom(layer, qrMarkup, state);
}

function getCanvasGroupLayerDom(
  layer: CanvasLayer,
  cardState: CanvasCardState,
  qrMarkup: string,
  state: QraftyState,
): DomLayerNode {
  const children = (layer.children ?? [])
    .filter((child) => child.isVisible)
    .sort((a, b) => a.zIndex - b.zIndex)
    .map((child) => getCanvasLayerDomNode(child, cardState, qrMarkup, state))
    .filter((node): node is DomLayerNode => Boolean(node));

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
  };
}

function getCanvasCardLayerDom(layer: CanvasLayer, cardState: CanvasCardState): DomLayerNode {
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
      ...getCanvasCardDomStyle(cardState, layer),
      overflow: "hidden",
    },
  };
}

function getCanvasTextLayerDom(layer: CanvasLayer): DomLayerNode {
  const textStyle = serializeCssProperties(
    getTextLayerStyle(layer) as Record<string, string | number>,
  );
  const hasTextRuns =
    Boolean(layer.textRuns?.length) &&
    layer.textRuns?.map((run) => run.text).join("") === (layer.text ?? "");

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
    htmlContent: hasTextRuns ? getCanvasTextRunsHtml(layer) : undefined,
    content: hasTextRuns ? undefined : getCanvasTextContent(layer),
  };
}

function getCanvasImageLayerDom(layer: CanvasLayer): DomLayerNode {
  const imageValue =
    getCachedIllustrationDisplaySrc(layer.imageValue, layer.illustrationColorStops) ??
    layer.imageValue ??
    "";
  const imageStyle = getCanvasImageDomStyle(layer);

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
  };
}

function getCanvasShapeLayerDom(layer: CanvasLayer): DomLayerNode {
  const shapeId = layer.shapeId ?? "rounded-square";
  const definition = QR_BACKGROUND_SHAPES.find((shape) => shape.id === shapeId);
  const fill = layer.fillMode === "none" ? "none" : escapeXml(layer.fill ?? "#E8E8E8");
  const strokeWidth = layer.strokeWidth ?? 0;
  const stroke = layer.stroke ?? "#171717";
  const strokeOpacity = (layer.strokeOpacity ?? 100) / 100;
  const isStrokeOnlyShape = shapeId === "line" || shapeId === "arrow";
  const strokeClipId = `${layer.id}-stroke-clip`;
  const viewBoxSize = definition ? definition.viewBox : { height: 100, width: 100 };
  const strokeWidthVb =
    strokeWidth * getShapeStrokeViewBoxScale(layer, viewBoxSize.width, viewBoxSize.height);
  const useInnerStroke = strokeWidthVb > 0 && !isStrokeOnlyShape;
  const strokeAttrs =
    strokeWidthVb > 0
      ? ` stroke="${escapeXml(stroke)}" stroke-width="${useInnerStroke ? strokeWidthVb * 2 : strokeWidthVb}" stroke-opacity="${strokeOpacity}"${useInnerStroke ? ` clip-path="url(#${strokeClipId})"` : ""}`
      : "";
  const strokeClip = useInnerStroke
    ? `<clipPath id="${strokeClipId}">${definition ? `<path d="${definition.path}"/>` : getShapeSvgPath(shapeId)}</clipPath>`
    : "";
  const innerMarkup = definition
    ? `<path d="${definition.path}" fill="${fill}"${strokeAttrs}/>`
    : getShapeSvgPath(shapeId).replace("/>", ` fill="${fill}"${strokeAttrs}/>`);
  const viewBox = definition
    ? `${definition.viewBox.x ?? 0} ${definition.viewBox.y ?? 0} ${definition.viewBox.width} ${definition.viewBox.height}`
    : "0 0 100 100";

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
      ...getCanvasShapeDomStyle(layer),
      overflow: "visible",
    },
    svgInner: `<svg aria-hidden="true" width="${layer.width}" height="${layer.height}" viewBox="${viewBox}" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">${strokeClip}${innerMarkup}</svg>`,
  };
}

function buildCanvasQrForegroundDomNode(
  layer: CanvasLayer,
  state: QraftyState,
): DomLayerNode | null {
  const layout = getCanvasQrLayerLayout(layer.width, state, layer.height);

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
      ...(layer.borderSides ? getCanvasPerSideBorderStyle(layer.borderSides) : {}),
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
  };
}

function getCanvasQrLayerDom(
  layer: CanvasLayer,
  _qrMarkup: string,
  state: QraftyState,
): DomLayerNode {
  const background = buildCanvasQrBackgroundSvgPayload(layer, state);
  const foreground = buildCanvasQrForegroundDomNode(layer, state);
  const children: DomLayerNode[] = [];

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
    });
  }

  if (foreground) {
    children.push(foreground);
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
  };
}

function getCanvasTextContent(layer: CanvasLayer) {
  return layoutCanvasText(layer).lines.join("\n");
}

function getCanvasTextRunsHtml(layer: CanvasLayer) {
  return getCanvasTextLayerRuns(layer)
    .map((run) => {
      const style = cssPropertiesToInlineStyle(getTextRunStyle(layer, run));
      return `<span style="${style}">${escapeHtml(run.text)}</span>`;
    })
    .join("");
}

function getCanvasTextLayerRuns(layer: CanvasLayer): CanvasTextRun[] {
  const text = layer.text ?? "";

  if (!layer.textRuns?.length || layer.textRuns.map((run) => run.text).join("") !== text) {
    return text ? [{ text }] : [];
  }

  return layer.textRuns;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeXml(value: string) {
  return escapeHtml(value).replaceAll("'", "&apos;");
}
