import {
  getQrBackgroundShapeContentFrame,
  type QrBackgroundShapeDefinition,
} from "@/features/qr/styles/background-shapes";
import type { QraftyState } from "@/features/qr/model/state";
import { type QrSvgExtensionFunction } from "./types";
import {
  createBackgroundShapeGradient,
  formatSvgNumber,
  getOrCreateSvgDefs,
} from "./svg-dom-utils";
import {
  coerceQrMarginCells,
  getCellSpaceBackgroundMetrics,
  normalizeBackgroundShapeOptions,
  type BackgroundRenderMetrics,
  getBackgroundShapeTransform,
} from "./background-shape-layout";

export function createBackgroundShapeExtension(
  shape: QrBackgroundShapeDefinition,
  state: Pick<
    QraftyState,
    "backgroundGradient" | "backgroundOptions" | "backgroundShapeOptions" | "margin"
  >,
): QrSvgExtensionFunction {
  return (svg, options) => {
    const document = svg.ownerDocument;

    if (!document) {
      return;
    }

    svg.querySelectorAll('[data-qr-layer="background-shape"]').forEach((node) => {
      node.remove();
    });
    svg.querySelectorAll('[data-qr-layer="background-shape-stroke"]').forEach((node) => {
      node.remove();
    });
    svg.querySelectorAll('[data-qr-layer="background-shape-gradient"]').forEach((node) => {
      node.remove();
    });
    svg.querySelectorAll('[data-qr-layer="background-shape-blur"]').forEach((node) => {
      node.remove();
    });
    svg.querySelectorAll('[data-qr-layer="background-shape-blur-filter"]').forEach((node) => {
      node.remove();
    });

    const { metrics, shapeOptions } = getCellSpaceBackgroundMetrics(
      svg,
      options,
      normalizeBackgroundShapeOptions(state.backgroundShapeOptions),
      {
        contentFrame: getQrBackgroundShapeContentFrame(shape),
        marginCells: coerceQrMarginCells(state.margin),
        viewBox: shape.viewBox,
      },
    );
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const transform = getBackgroundShapeTransform(shape, metrics.backingRegion, shapeOptions);
    const fill = getBackgroundShapeFill(svg, state, metrics.outerWidth, metrics.outerHeight);

    applySvgRenderBounds(svg, metrics);
    const insertReference = wrapQrContent(
      svg,
      metrics.translateX,
      metrics.translateY,
      metrics.contentScale,
    );

    path.setAttribute("data-qr-layer", "background-shape");
    path.setAttribute("d", shape.path);
    path.setAttribute("transform", transform);
    path.setAttribute("fill", fill);
    const strokedShape = applyBackgroundShapeStroke(
      path,
      shapeOptions,
      svg,
      "clip-path-background-shape-stroke",
      "background-shape-stroke",
      Math.min(
        metrics.backingRegion.width / shape.viewBox.width,
        metrics.backingRegion.height / shape.viewBox.height,
      ),
    );

    const blurPath = createBackgroundShapeBlurPath({
      d: shape.path,
      metrics,
      shapeOptions,
      svg,
      transform,
    });

    if (blurPath) {
      svg.insertBefore(blurPath, insertReference);
    }

    svg.insertBefore(strokedShape ?? path, insertReference);
  };
}

function applyBackgroundShapeStroke(
  element: Element,
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>,
  svg: SVGElement,
  clipPathId: string,
  strokeLayerTag: string,
  strokeScale = 1,
) {
  if (shapeOptions.strokeWidth <= 0) {
    element.removeAttribute("stroke");
    element.removeAttribute("stroke-width");
    element.removeAttribute("stroke-opacity");
    element.removeAttribute("stroke-linejoin");
    return null;
  }

  const renderedStrokeWidth = shapeOptions.strokeWidth / Math.max(0.000001, strokeScale);

  element.setAttribute("stroke", shapeOptions.strokeColor);
  element.setAttribute("stroke-opacity", formatSvgNumber(shapeOptions.strokeOpacity / 100));
  element.setAttribute("stroke-linejoin", "round");

  const ownerDocument = svg.ownerDocument;

  if (!ownerDocument) {
    element.setAttribute("stroke-width", formatSvgNumber(renderedStrokeWidth));
    return null;
  }

  element.setAttribute("stroke-width", formatSvgNumber(renderedStrokeWidth * 2));

  const clipPath = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "clipPath");
  const clipShape = element.cloneNode(false) as Element;

  clipPath.setAttribute("id", clipPathId);
  clipPath.setAttribute("data-qr-layer", strokeLayerTag);
  clipShape.setAttribute("data-qr-layer", strokeLayerTag);
  clipShape.removeAttribute("clip-path");
  clipShape.removeAttribute("stroke");
  clipShape.removeAttribute("stroke-width");
  clipShape.removeAttribute("stroke-opacity");
  clipShape.removeAttribute("stroke-linejoin");
  clipPath.appendChild(clipShape);
  getOrCreateSvgDefs(svg).appendChild(clipPath);

  const group = ownerDocument.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("clip-path", `url(#${clipPathId})`);
  group.setAttribute("data-qr-layer", strokeLayerTag);
  group.appendChild(element);

  return group;
}

function applySvgRenderBounds(svg: SVGElement, metrics: BackgroundRenderMetrics) {
  svg.setAttribute("width", formatSvgNumber(metrics.outerWidth));
  svg.setAttribute("height", formatSvgNumber(metrics.outerHeight));
  svg.setAttribute(
    "viewBox",
    `0 0 ${formatSvgNumber(metrics.outerWidth)} ${formatSvgNumber(metrics.outerHeight)}`,
  );
}

function wrapQrContent(svg: SVGElement, translateX: number, translateY: number, contentScale = 1) {
  const hasScale = Math.abs(contentScale - 1) > 1e-9;
  const transform = hasScale
    ? `translate(${formatSvgNumber(translateX)} ${formatSvgNumber(translateY)}) scale(${formatSvgNumber(contentScale)})`
    : `translate(${formatSvgNumber(translateX)} ${formatSvgNumber(translateY)})`;

  const existingGroup = svg.querySelector('[data-qr-layer="qr-content"]');

  if (existingGroup) {
    existingGroup.setAttribute("transform", transform);
    return existingGroup;
  }

  if (!hasScale && translateX === 0 && translateY === 0) {
    return getFirstDrawableSvgChild(svg);
  }

  const document = svg.ownerDocument;
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  const children = Array.from(svg.children).filter(
    (child) => child.tagName.toLowerCase() !== "defs" && !isManagedBackgroundLayer(child),
  );

  group.setAttribute("data-qr-layer", "qr-content");
  group.setAttribute("transform", transform);

  for (const child of children) {
    group.appendChild(child);
  }

  svg.appendChild(group);

  return group;
}

function getFirstDrawableSvgChild(svg: SVGElement) {
  return (
    Array.from(svg.children).find(
      (child) => child.tagName.toLowerCase() !== "defs" && !isManagedBackgroundLayer(child),
    ) ?? null
  );
}

function isManagedBackgroundLayer(node: Element) {
  const layer = node.getAttribute("data-qr-layer");

  return Boolean(layer?.startsWith("background-"));
}

export function createBackgroundSurfaceExtension(
  state: Pick<
    QraftyState,
    "backgroundGradient" | "backgroundOptions" | "backgroundShapeOptions" | "margin"
  >,
): QrSvgExtensionFunction {
  return (svg, options) => {
    const document = svg.ownerDocument;

    if (!document) {
      return;
    }

    svg.querySelectorAll('[data-qr-layer="background-surface-blur"]').forEach((node) => {
      node.remove();
    });
    svg.querySelectorAll('[data-qr-layer="background-surface-blur-filter"]').forEach((node) => {
      node.remove();
    });
    svg.querySelectorAll('[data-qr-layer="background-surface-stroke"]').forEach((node) => {
      node.remove();
    });

    const { metrics, shapeOptions } = getCellSpaceBackgroundMetrics(
      svg,
      options,
      normalizeBackgroundShapeOptions(state.backgroundShapeOptions),
      { marginCells: coerceQrMarginCells(state.margin) },
    );
    const region = metrics.backingRegion;
    const radius = (Math.min(region.width, region.height) / 2) * state.backgroundOptions.round;
    const backgroundRect =
      getQrBackgroundSurfaceRect(svg) ??
      document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const fill = getBackgroundShapeFill(svg, state, metrics.outerWidth, metrics.outerHeight);

    backgroundRect.remove();
    backgroundRect.setAttribute("data-qr-layer", "background-surface");
    backgroundRect.setAttribute("fill", fill);
    backgroundRect.removeAttribute("clip-path");
    applySvgRenderBounds(svg, metrics);
    const insertReference = wrapQrContent(
      svg,
      metrics.translateX,
      metrics.translateY,
      metrics.contentScale,
    );

    applyBackgroundSurfaceRect(backgroundRect, region, radius);
    const strokedSurface = applyBackgroundShapeStroke(
      backgroundRect,
      shapeOptions,
      svg,
      "clip-path-background-surface-stroke",
      "background-surface-stroke",
    );

    const blurRect = createBackgroundSurfaceBlurRect({
      radius,
      region,
      shapeOptions,
      svg,
    });

    if (blurRect) {
      svg.insertBefore(blurRect, insertReference);
    }

    svg.insertBefore(strokedSurface ?? backgroundRect, insertReference);
  };
}

function getQrBackgroundSurfaceRect(svg: SVGElement) {
  return Array.from(svg.children).find(
    (child) =>
      child.tagName.toLowerCase() === "rect" &&
      (child.getAttribute("data-qr-layer") === "background-surface" ||
        child.getAttribute("clip-path")?.includes("clip-path-background-color")),
  );
}

function applyBackgroundSurfaceRect(
  rect: Element,
  region: BackgroundRenderMetrics["backingRegion"],
  radius: number,
) {
  rect.setAttribute("x", formatSvgNumber(region.x));
  rect.setAttribute("y", formatSvgNumber(region.y));
  rect.setAttribute("width", formatSvgNumber(region.width));
  rect.setAttribute("height", formatSvgNumber(region.height));
  rect.setAttribute("rx", formatSvgNumber(radius));
  rect.setAttribute("ry", formatSvgNumber(radius));
}

function createBackgroundSurfaceBlurRect({
  radius,
  region,
  shapeOptions,
  svg,
}: {
  radius: number;
  region: BackgroundRenderMetrics["backingRegion"];
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>;
  svg: SVGElement;
}) {
  if (!hasActiveBackgroundShapeShadow(shapeOptions)) {
    return null;
  }

  const document = svg.ownerDocument;

  if (!document) {
    return null;
  }

  const filterId = "background-surface-blur-filter";
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
  });

  getOrCreateSvgDefs(svg).appendChild(filter);

  const blurRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

  blurRect.setAttribute("data-qr-layer", "background-surface-blur");
  blurRect.setAttribute("fill", shapeOptions.shadowColor);
  blurRect.setAttribute("filter", `url('#${filterId}')`);
  applyBackgroundShapeShadowSourceStroke(blurRect, shapeOptions);
  applyBackgroundSurfaceRect(blurRect, region, radius);

  return blurRect;
}

function createBackgroundShapeBlurPath({
  d,
  metrics,
  shapeOptions,
  svg,
  transform,
}: {
  d: string;
  metrics: BackgroundRenderMetrics;
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>;
  svg: SVGElement;
  transform: string;
}) {
  if (!hasActiveBackgroundShapeShadow(shapeOptions)) {
    return null;
  }

  const document = svg.ownerDocument;

  if (!document) {
    return null;
  }

  const filterId = "background-shape-blur-filter";
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
  });

  getOrCreateSvgDefs(svg).appendChild(filter);

  const blurPath = document.createElementNS("http://www.w3.org/2000/svg", "path");

  blurPath.setAttribute("data-qr-layer", "background-shape-blur");
  blurPath.setAttribute("d", d);
  blurPath.setAttribute("fill", shapeOptions.shadowColor);
  blurPath.setAttribute("filter", `url('#${filterId}')`);
  blurPath.setAttribute("transform", transform);
  applyBackgroundShapeShadowSourceStroke(blurPath, shapeOptions);

  return blurPath;
}

function hasActiveBackgroundShapeShadow(
  _shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>,
) {
  return false;
}

function applyBackgroundShapeShadowSourceStroke(
  node: Element,
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>,
) {
  if (shapeOptions.strokeWidth <= 0) {
    node.removeAttribute("stroke");
    node.removeAttribute("stroke-width");
    node.removeAttribute("stroke-linejoin");
    return;
  }

  node.setAttribute("stroke", shapeOptions.shadowColor);
  node.setAttribute("stroke-width", formatSvgNumber(shapeOptions.strokeWidth));
  node.setAttribute("stroke-linejoin", "round");
}

function createBackgroundShapeShadowFilter({
  filterId,
  layer,
  metrics,
  shapeOptions,
  svg,
}: {
  filterId: string;
  layer: string;
  metrics: {
    height: number;
    width: number;
    x: number;
    y: number;
  };
  shapeOptions: ReturnType<typeof normalizeBackgroundShapeOptions>;
  svg: SVGElement;
}) {
  const document = svg.ownerDocument;
  const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
  const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
  const offset = document.createElementNS("http://www.w3.org/2000/svg", "feOffset");
  const flood = document.createElementNS("http://www.w3.org/2000/svg", "feFlood");
  const composite = document.createElementNS("http://www.w3.org/2000/svg", "feComposite");

  filter.setAttribute("id", filterId);
  filter.setAttribute("data-qr-layer", layer);
  filter.setAttribute("filterUnits", "userSpaceOnUse");
  filter.setAttribute("x", formatSvgNumber(metrics.x));
  filter.setAttribute("y", formatSvgNumber(metrics.y));
  filter.setAttribute("width", formatSvgNumber(metrics.width));
  filter.setAttribute("height", formatSvgNumber(metrics.height));
  blur.setAttribute("in", "SourceAlpha");
  blur.setAttribute("result", "shadow-blur");
  blur.setAttribute("stdDeviation", formatSvgNumber(shapeOptions.edgeBlur));
  offset.setAttribute("dx", formatSvgNumber(shapeOptions.shadowOffsetX));
  offset.setAttribute("dy", formatSvgNumber(shapeOptions.shadowOffsetY));
  offset.setAttribute("in", "shadow-blur");
  offset.setAttribute("result", "shadow-offset");
  flood.setAttribute("flood-color", shapeOptions.shadowColor);
  flood.setAttribute("flood-opacity", formatSvgNumber(shapeOptions.shadowOpacity / 100));
  flood.setAttribute("result", "shadow-color");
  composite.setAttribute("in", "shadow-color");
  composite.setAttribute("in2", "shadow-offset");
  composite.setAttribute("operator", "in");

  filter.appendChild(blur);
  filter.appendChild(offset);
  filter.appendChild(flood);
  filter.appendChild(composite);

  return filter;
}

function getBackgroundShapeFill(
  svg: SVGElement,
  state: Pick<QraftyState, "backgroundGradient" | "backgroundOptions">,
  width: number,
  height: number,
) {
  if (!state.backgroundGradient.enabled) {
    return state.backgroundOptions.color;
  }

  const gradientId = "background-shape-gradient";
  const gradient = createBackgroundShapeGradient(svg, state.backgroundGradient, {
    height,
    id: gradientId,
    width,
  });

  if (gradient) {
    getOrCreateSvgDefs(svg).appendChild(gradient);
    return `url('#${gradientId}')`;
  }

  return state.backgroundOptions.color;
}
