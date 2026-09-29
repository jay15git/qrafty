import {
  emitDescendants,
  getEmitAttr,
  parseEmitSvgMarkup,
  removeEmitNode,
  serializeEmitNode,
  type EmitNode,
} from "@qrafty/qr-internal/core";

import { DEFAULT_BACKGROUND_SHAPE_OPTIONS, type QraftyState } from "@/features/qr/model/state";

export function createCanvasQrArtworkState(state: QraftyState): QraftyState {
  return {
    ...state,
    backgroundGradient: {
      ...state.backgroundGradient,
      enabled: false,
    },
    backgroundImage: {
      source: "none",
      value: undefined,
      presetId: undefined,
      presetColor: undefined,
    },
    backgroundOptions: {
      ...state.backgroundOptions,
      transparent: true,
    },
    backgroundShapeId: "none",
    backgroundShapeOptions: { ...DEFAULT_BACKGROUND_SHAPE_OPTIONS },
  };
}

export function sanitizeCanvasQrArtworkMarkup(markup: string) {
  const svg = parseEmitSvgMarkup(markup);

  if (svg.tagName.toLowerCase() !== "svg") {
    return markup;
  }

  for (const child of [...svg.children]) {
    if (isLegacyQrBackingNode(child)) {
      removeEmitNode(child);
    }
  }

  for (const node of [...emitDescendants(svg)]) {
    const tagName = node.tagName.toLowerCase();

    if ((tagName === "filter" || tagName === "clippath") && isLegacyQrBackingNode(node)) {
      removeEmitNode(node);
    }
  }

  for (const defs of [...emitDescendants(svg)].filter(
    (node) => node.tagName.toLowerCase() === "defs",
  )) {
    if (defs.children.length === 0) {
      removeEmitNode(defs);
    }
  }

  return serializeEmitNode(svg, "xml");
}

export function parseSvgViewBoxSize(markup: string) {
  const openTag = markup.match(/<svg\b[^>]*>/i)?.[0];
  const viewBox = openTag?.match(/viewBox="([^"]+)"/i)?.[1];
  if (!viewBox) {
    return null;
  }

  const parts = viewBox
    .trim()
    .split(/[\s,]+/)
    .map(Number.parseFloat);
  if (parts.length !== 4 || !parts[2] || !parts[3]) {
    return null;
  }

  return { height: parts[3], width: parts[2] };
}

function snapDimensionToViewBoxGrid(target: number, viewBoxAxis: number) {
  if (!Number.isFinite(target) || !Number.isFinite(viewBoxAxis) || viewBoxAxis <= 0) {
    return Math.max(1, Math.round(target));
  }

  return viewBoxAxis * Math.max(1, Math.round(target / viewBoxAxis));
}

export function snapLayeredRasterDimensionsToQrModuleGrid({
  exportHeight,
  exportWidth,
  naturalHeight,
  naturalWidth,
  qrMetrics,
}: {
  exportHeight: number;
  exportWidth: number;
  naturalHeight: number;
  naturalWidth: number;
  qrMetrics: { displayHeight: number; displayWidth: number; moduleUnits: number };
}) {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return { height: exportHeight, width: exportWidth };
  }

  const scaleX = exportWidth / naturalWidth;
  const scaleY = exportHeight / naturalHeight;
  const snappedQrWidth = snapDimensionToViewBoxGrid(
    qrMetrics.displayWidth * scaleX,
    qrMetrics.moduleUnits,
  );
  const snappedQrHeight = snapDimensionToViewBoxGrid(
    qrMetrics.displayHeight * scaleY,
    qrMetrics.moduleUnits,
  );
  const snappedScaleX = snappedQrWidth / qrMetrics.displayWidth;
  const snappedScaleY = snappedQrHeight / qrMetrics.displayHeight;
  const scale = Math.min(snappedScaleX, snappedScaleY);

  return {
    height: Math.max(1, Math.round(naturalHeight * scale)),
    width: Math.max(1, Math.round(naturalWidth * scale)),
  };
}

export function alignReactQrSvgToModuleGrid(
  markup: string,
  targetWidth?: number,
  targetHeight?: number,
) {
  const openTag = markup.match(/<svg\b[^>]*>/i)?.[0] ?? "";
  const parsedWidth = Number.parseFloat(openTag.match(/\bwidth="([^"]+)"/i)?.[1] ?? "NaN");
  const parsedHeight = Number.parseFloat(openTag.match(/\bheight="([^"]+)"/i)?.[1] ?? "NaN");
  const viewBoxSize = parseSvgViewBoxSize(markup);
  const width =
    targetWidth ?? (Number.isFinite(parsedWidth) ? parsedWidth : (viewBoxSize?.width ?? 1));
  const height =
    targetHeight ?? (Number.isFinite(parsedHeight) ? parsedHeight : (viewBoxSize?.height ?? 1));

  return replaceSvgWidthHeight(
    markup,
    Math.max(1, Math.round(width)),
    Math.max(1, Math.round(height)),
  );
}

function stripExportSvgPercentageSizing(attributes: string) {
  return String(attributes).replace(/\sstyle="([^"]*)"/i, (_match, style: string) => {
    const cleaned = style
      .replace(/(?:^|;)\s*width\s*:\s*100%\s*/gi, "")
      .replace(/(?:^|;)\s*height\s*:\s*100%\s*/gi, "")
      .replace(/;\s*;/g, ";")
      .replace(/^;+|;+$/g, "")
      .trim();

    return cleaned ? ` style="${cleaned}"` : "";
  });
}

function cleanNestedSvgAttributes(attributes: string) {
  return stripExportSvgPercentageSizing(String(attributes))
    .replace(/\swidth="[^"]*"/i, "")
    .replace(/\sheight="[^"]*"/i, "")
    .replace(/\spreserveAspectRatio="[^"]*"/i, "");
}

function replaceSvgWidthHeight(markup: string, width: number, height: number) {
  return markup.replace(/<svg\b([^>]*)>/i, (_match, attributes: string) => {
    const nextAttributes = stripExportSvgPercentageSizing(String(attributes))
      .replace(/\swidth="[^"]*"/i, "")
      .replace(/\sheight="[^"]*"/i, "");

    return `<svg${nextAttributes} width="${width}" height="${height}">`;
  });
}

export function scaleNestedSvgMarkup(markup: string, width: number, height: number) {
  const snappedWidth = Math.max(1, Math.round(width));
  const snappedHeight = Math.max(1, Math.round(height));

  const withScaledSelfClosingSvg = markup.replace(
    /<svg\b([^>]*)\/>/i,
    (_match, attributes: string) => {
      const nextAttributes = cleanNestedSvgAttributes(attributes);

      return `<svg${nextAttributes} width="${snappedWidth}" height="${snappedHeight}" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision"></svg>`;
    },
  );

  const scaledMarkup =
    withScaledSelfClosingSvg !== markup
      ? withScaledSelfClosingSvg
      : markup.replace(/<svg\b([^>]*)>/i, (_match, attributes: string) => {
          const nextAttributes = cleanNestedSvgAttributes(attributes);

          return `<svg${nextAttributes} width="${snappedWidth}" height="${snappedHeight}" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision">`;
        });

  return scaledMarkup;
}

function isLegacyQrBackingNode(node: EmitNode) {
  const layer = getEmitAttr(node, "data-qr-layer");

  if (layer?.startsWith("background-")) {
    return true;
  }

  const id = getEmitAttr(node, "id");

  if (id?.includes("clip-path-background-color")) {
    return true;
  }

  return (
    node.tagName.toLowerCase() === "rect" &&
    getEmitAttr(node, "clip-path")?.includes("clip-path-background-color") === true
  );
}
