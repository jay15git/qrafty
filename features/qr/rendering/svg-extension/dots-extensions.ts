import type { QraftyState } from "@/features/qr/model/state";
import {
  buildCustomCornerDotTransform,
  getCustomCornerDotShapeGeometry,
  isCustomCornerDotShape,
} from "@/features/qr/styles/custom-corner-dot-shapes";
import { type QrSvgExtensionFunction } from "./types";
import {
  SVG_NS,
  removeLegacyDotGradientOverlay,
  splitSvgPathData,
  isSvgElementLike,
  createBackgroundShapeGradient,
  getSvgViewBoxRegion,
  getOrCreateSvgDefs,
} from "./svg-dom-utils";
import {
  type DotMatrixMetrics,
  getQrModuleClipLayers,
  getQrModulePathLayers,
  collectDotMatrixMetrics,
  getFallbackDotMatrixMetrics,
} from "./dot-matrix-model";
import { applyDirectPalettePaint, getActiveDotsPalette } from "./dot-matrix-palette";

export type FinderInnerElementRegion = {
  size: number;
  x: number;
  y: number;
};

export function getFinderInnerElementRegion(element: SVGElement): FinderInnerElementRegion | null {
  const tagName = element.tagName.toLowerCase();

  if (tagName === "rect") {
    const x = Number.parseFloat(element.getAttribute("x") ?? "");
    const y = Number.parseFloat(element.getAttribute("y") ?? "");
    const width = Number.parseFloat(element.getAttribute("width") ?? "3");
    const height = Number.parseFloat(element.getAttribute("height") ?? "3");

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    return {
      x,
      y,
      size: Number.isFinite(width) && Number.isFinite(height) ? Math.min(width, height) : 3,
    };
  }

  if (tagName === "path") {
    const transform = element.getAttribute("transform");

    if (!transform) {
      return null;
    }

    const translateMatch = transform.match(/translate\(([-\d.]+)[,\s]+([-\d.]+)\)/);

    if (!translateMatch) {
      return null;
    }

    const x = Number.parseFloat(translateMatch[1] ?? "");
    const y = Number.parseFloat(translateMatch[2] ?? "");

    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      return null;
    }

    return { x, y, size: 3 };
  }

  return null;
}

export function createCustomCornerDotExtension(
  state: Pick<QraftyState, "finderPatternInnerSettings">,
): QrSvgExtensionFunction | null {
  const shape = state.finderPatternInnerSettings.type;

  if (!isCustomCornerDotShape(shape)) {
    return null;
  }

  const color = state.finderPatternInnerSettings.color;

  return (svg) => {
    const document = svg.ownerDocument;

    if (!document) {
      return;
    }

    const existing = Array.from(
      svg.querySelectorAll('[data-testid="finder-patterns-inner"]'),
    ).filter(isSvgElementLike);

    if (existing.length === 0) {
      return;
    }

    const regions = existing
      .map((element) => getFinderInnerElementRegion(element))
      .filter((region): region is FinderInnerElementRegion => region !== null);

    if (regions.length === 0) {
      return;
    }

    const insertBefore = existing.at(-1)?.nextSibling ?? null;

    for (const element of existing) {
      element.remove();
    }

    for (const region of regions) {
      const geometry = getCustomCornerDotShapeGeometry(shape, region.x, region.y, region.size);
      const path = document.createElementNS(SVG_NS, "path");

      path.setAttribute("d", geometry.d);
      path.setAttribute("fill", color);
      path.setAttribute("transform", buildCustomCornerDotTransform(geometry));
      path.setAttribute("data-testid", "finder-patterns-inner");
      path.setAttribute("data-qr-layer", "custom-corner-dot");

      if (geometry.fillRule) {
        path.setAttribute("fill-rule", geometry.fillRule);
      }

      if (insertBefore) {
        svg.insertBefore(path, insertBefore);
      } else {
        svg.appendChild(path);
      }
    }
  };
}

export function createDotsPaletteExtension(
  state: Pick<QraftyState, "data" | "dotsPalette">,
): QrSvgExtensionFunction {
  return (svg) => {
    const palette = getActiveDotsPalette(state);

    if (palette.length === 0) {
      return;
    }

    svg.querySelectorAll('[data-qr-layer="dot-palette"]').forEach((node) => {
      node.remove();
    });

    const dotClipLayers = getQrModuleClipLayers(svg);
    const dotPathLayers = getQrModulePathLayers(svg);

    if (dotClipLayers.length === 0 && dotPathLayers.length === 0) {
      return;
    }

    const allDotShapes = [
      ...dotClipLayers.flatMap((layer) => layer.shapes),
      ...dotPathLayers.flatMap((layer) => layer.shapes),
    ];

    applyDirectPalettePaint(svg, state, allDotShapes, dotClipLayers, dotPathLayers, {
      groupLayer: "dot-palette",
    });
  };
}

export function createDotsGradientExtension(
  state: Pick<QraftyState, "dataModulesGradient">,
): QrSvgExtensionFunction {
  return (svg) => {
    removeLegacyDotGradientOverlay(svg);

    const dotClipLayers = getQrModuleClipLayers(svg);
    const dotPathLayers = getQrModulePathLayers(svg);
    const paintTargets: SVGElement[] = [
      ...dotClipLayers.map((layer) => layer.element),
      ...dotPathLayers.map((layer) => layer.element),
    ];

    if (paintTargets.length === 0) {
      const dataModules = svg.querySelector('[data-testid="data-modules"]');

      if (isSvgElementLike(dataModules)) {
        paintTargets.push(dataModules);
      }
    }

    if (paintTargets.length === 0) {
      return;
    }

    const dotShapes = [
      ...dotClipLayers.flatMap((layer) => layer.shapes),
      ...dotPathLayers.flatMap((layer) => layer.shapes),
    ];
    const metrics =
      dotShapes.length > 0
        ? (collectDotMatrixMetrics(dotShapes) ?? getFallbackDotMatrixMetrics(dotShapes))
        : getDataModulesPathMetrics(svg);
    const coverRect = metrics ? getDotShapeCoverRect(metrics) : getSvgViewBoxRegion(svg);

    if (!coverRect) {
      return;
    }

    const gradientId = "dot-gradient-definition";
    const gradient = createBackgroundShapeGradient(svg, state.dataModulesGradient, {
      height: coverRect.height,
      id: gradientId,
      layer: "dot-gradient-definition",
      width: coverRect.width,
      x: coverRect.x,
      y: coverRect.y,
    });

    if (!gradient) {
      return;
    }

    getOrCreateSvgDefs(svg).appendChild(gradient);

    const gradientFill = `url('#${gradientId}')`;

    for (const target of paintTargets) {
      target.setAttribute("fill", gradientFill);
      target.setAttribute("data-qr-layer", "dot-gradient-fill");
      target.removeAttribute("opacity");
    }
  };
}

export function getDataModulesPathMetrics(svg: SVGElement) {
  const dataModules = svg.querySelector('[data-testid="data-modules"]');

  if (!isSvgElementLike(dataModules)) {
    return null;
  }

  const pathData = dataModules.getAttribute("d");

  if (!pathData) {
    return null;
  }

  const document = dataModules.ownerDocument;

  if (!document) {
    return null;
  }

  const shapes = splitSvgPathData(pathData).map((segment) => {
    const shape = document.createElementNS(SVG_NS, "path");
    shape.setAttribute("d", segment);
    return shape;
  });

  if (shapes.length === 0) {
    return null;
  }

  return collectDotMatrixMetrics(shapes) ?? getFallbackDotMatrixMetrics(shapes);
}

export function getDotShapeCoverRect(metrics: DotMatrixMetrics) {
  return {
    height: Math.max(metrics.cellSize, metrics.maxY - metrics.originY),
    width: Math.max(metrics.cellSize, metrics.maxX - metrics.originX),
    x: metrics.originX,
    y: metrics.originY,
  };
}
