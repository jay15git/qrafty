import type {
  DotMatrixMetrics,
  DotMatrixShapeLike,
  QrSvgElementLike,
} from "@qrafty/qr-internal/core";
import {
  collectDotMatrixAnchors,
  collectDotMatrixMetricsFromAnchors,
  getDotMatrixAnchor,
  getFallbackDotMatrixMetricsFromAnchors,
  resolveDotMatrixAnchorCoordinates,
  splitSvgPathData,
} from "@qrafty/qr-internal/core";

import { getClipPathId, isSvgElementLike, SVG_NS } from "./svg-dom-utils";

const DOTS_CLIP_PATH_PREFIX = "clip-path-dot-color-";

const QR_MODULE_CLIP_PATH_PREFIXES = [DOTS_CLIP_PATH_PREFIX];

export type DotClipLayer = {
  element: QrSvgElementLike;
  fill: string;
  shapes: QrSvgElementLike[];
};

export type DotPathLayer = {
  element: QrSvgElementLike;
  fill: string;
  shapes: QrSvgElementLike[];
};

export type { DotMatrixMetrics };

export function getQrModuleClipLayers(svg: QrSvgElementLike): DotClipLayer[] {
  return Array.from(svg.querySelectorAll("rect"))
    .map((element) => {
      const clipPathId = getClipPathId(element.getAttribute("clip-path"));

      if (
        !clipPathId ||
        !QR_MODULE_CLIP_PATH_PREFIXES.some((prefix) => clipPathId.startsWith(prefix))
      ) {
        return null;
      }

      const clipPath = Array.from(svg.querySelectorAll("clipPath")).find(
        (candidate) => candidate.getAttribute("id") === clipPathId,
      );

      if (!clipPath) {
        return null;
      }

      const shapes = Array.from(clipPath.children).filter((child): child is QrSvgElementLike =>
        isSvgElementLike(child),
      );

      if (shapes.length === 0) {
        return null;
      }

      return {
        element,
        fill: element.getAttribute("fill") ?? "currentColor",
        shapes,
      } satisfies DotClipLayer;
    })
    .filter((layer): layer is DotClipLayer => layer !== null);
}

export function getQrModulePathLayers(svg: QrSvgElementLike): DotPathLayer[] {
  return Array.from(svg.querySelectorAll("path"))
    .map((element) => {
      if (element.getAttribute("data-testid") !== "data-modules") {
        return null;
      }

      const pathData = element.getAttribute("d");
      const pathSegments = splitSvgPathData(pathData);

      if (pathSegments.length === 0) {
        return null;
      }

      const document = element.ownerDocument;
      const shapes = pathSegments.map((segment) => {
        const shape = document.createElementNS(SVG_NS, "path");
        shape.setAttribute("d", segment);
        return shape;
      });

      return {
        element,
        fill: element.getAttribute("fill") ?? "currentColor",
        shapes,
      } satisfies DotPathLayer;
    })
    .filter((layer): layer is DotPathLayer => layer !== null);
}

function toShapeLike(shape: QrSvgElementLike): DotMatrixShapeLike {
  return {
    tagName: shape.tagName,
    getAttribute: (name) => shape.getAttribute(name),
  };
}

export function collectDotMatrixMetrics(dotShapes: QrSvgElementLike[]): DotMatrixMetrics | null {
  return collectDotMatrixMetricsFromAnchors(
    collectDotMatrixAnchors(dotShapes, (shape) => getDotMatrixAnchor(toShapeLike(shape))),
  );
}

export function getFallbackDotMatrixMetrics(dotShapes: QrSvgElementLike[]): DotMatrixMetrics {
  return getFallbackDotMatrixMetricsFromAnchors(
    collectDotMatrixAnchors(dotShapes, (shape) => getDotMatrixAnchor(toShapeLike(shape))),
  );
}

export function resolveDotMatrixCoordinates(shape: QrSvgElementLike, metrics: DotMatrixMetrics) {
  const anchor = getDotMatrixAnchor(toShapeLike(shape));

  if (!anchor) {
    return null;
  }

  return resolveDotMatrixAnchorCoordinates(anchor, metrics);
}

export function removeOrphanedModuleClipPaths(svg: QrSvgElementLike) {
  for (const clipPath of svg.querySelectorAll("clipPath")) {
    const clipPathId = clipPath.getAttribute("id") ?? "";

    if (QR_MODULE_CLIP_PATH_PREFIXES.some((prefix) => clipPathId.startsWith(prefix))) {
      clipPath.remove();
    }
  }
}

export function removeDotMatrixBaseLayers(
  dotClipLayers: DotClipLayer[],
  dotPathLayers: DotPathLayer[],
) {
  for (const layer of dotClipLayers) {
    layer.element.remove();
  }

  for (const layer of dotPathLayers) {
    layer.element.remove();
  }
}
