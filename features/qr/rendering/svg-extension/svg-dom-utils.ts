import type { QraftyGradient } from "@/features/qr/model/state";
import {
  getQraftyGradientCenter,
  qraftyRadialCenterInUserSpace,
} from "@/features/qr/styles/qrafty-gradient-geometry";

export const SVG_NS = "http://www.w3.org/2000/svg";

export function isSvgElementLike(node: Element | null | undefined): node is SVGElement {
  return (
    node != null &&
    typeof node.getAttribute === "function" &&
    typeof node.setAttribute === "function"
  );
}

export function appendSvgClass(element: SVGElement, className: string) {
  const existing = element.getAttribute("class") ?? "";

  if (existing.split(/\s+/).includes(className)) {
    return;
  }

  element.setAttribute("class", existing ? `${existing} ${className}` : className);
}

export function splitSvgPathData(pathData: string | null) {
  return (pathData ?? "")
    .split(/(?=M\s*[+-]?(?:\d+\.?\d*|\.\d+)[\s,])/)
    .map((segment) => segment.trim())
    .filter(Boolean);
}

export function getClipPathId(clipPath: string | null) {
  return /url\(['"]?#([^'")]+)['"]?\)/.exec(clipPath ?? "")?.[1] ?? null;
}

export function getOrCreateSvgDefs(svg: SVGElement) {
  const existingDefs = Array.from(svg.children).find(
    (child) => child.tagName.toLowerCase() === "defs",
  );

  if (existingDefs) {
    return existingDefs;
  }

  const defs = svg.ownerDocument.createElementNS("http://www.w3.org/2000/svg", "defs");
  svg.insertBefore(defs, svg.firstChild);

  return defs;
}

export function getNumericAttribute(element: Element, name: string) {
  const value = element.getAttribute(name);

  if (value === null) {
    return null;
  }

  const numericValue = Number.parseFloat(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

export function getDotNumericAttribute(shape: SVGElement, attributeName: string) {
  const value = shape.getAttribute(attributeName);

  if (value === null) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function getSmallestPositiveDelta(values: number[]) {
  const uniqueValues = Array.from(new Set(values.filter(Number.isFinite))).sort((a, b) => a - b);
  let smallestDelta = Number.POSITIVE_INFINITY;

  for (let index = 1; index < uniqueValues.length; index += 1) {
    const delta = uniqueValues[index] - uniqueValues[index - 1];

    if (delta > 0 && delta < smallestDelta) {
      smallestDelta = delta;
    }
  }

  return smallestDelta;
}

export function getDescendantElements(root: Element): Element[] {
  const descendants: Element[] = [];
  const queue = [...Array.from(root.children)];

  while (queue.length > 0) {
    const element = queue.shift();

    if (!element) {
      continue;
    }

    descendants.push(element);
    queue.push(...Array.from(element.children));
  }

  return descendants;
}

export function getPaintServerId(fillValue: string | null) {
  if (!fillValue) {
    return null;
  }

  const match = fillValue.match(/^url\((['"]?)#(.+?)\1\)$/);

  return match?.[2] ?? null;
}

export function getElementRegion(element: Element) {
  const x = getNumericAttribute(element, "x");
  const y = getNumericAttribute(element, "y");
  const width = getNumericAttribute(element, "width");
  const height = getNumericAttribute(element, "height");

  if (x === null || y === null || width === null || height === null || width <= 0 || height <= 0) {
    return null;
  }

  return { height, width, x, y };
}

export function getLinearGradientEndpoints({
  height,
  rotation,
  width,
  x,
  y,
}: {
  height: number;
  rotation: number;
  width: number;
  x: number;
  y: number;
}) {
  const normalizedRotation = (rotation + 2 * Math.PI) % (2 * Math.PI);
  let x1 = x + width / 2;
  let y1 = y + height / 2;
  let x2 = x + width / 2;
  let y2 = y + height / 2;

  if (
    (normalizedRotation >= 0 && normalizedRotation <= 0.25 * Math.PI) ||
    (normalizedRotation > 1.75 * Math.PI && normalizedRotation <= 2 * Math.PI)
  ) {
    x1 -= width / 2;
    y1 -= (height / 2) * Math.tan(rotation);
    x2 += width / 2;
    y2 += (height / 2) * Math.tan(rotation);
  } else if (normalizedRotation > 0.25 * Math.PI && normalizedRotation <= 0.75 * Math.PI) {
    y1 -= height / 2;
    x1 -= width / 2 / Math.tan(rotation);
    y2 += height / 2;
    x2 += width / 2 / Math.tan(rotation);
  } else if (normalizedRotation > 0.75 * Math.PI && normalizedRotation <= 1.25 * Math.PI) {
    x1 += width / 2;
    y1 += (height / 2) * Math.tan(rotation);
    x2 -= width / 2;
    y2 -= (height / 2) * Math.tan(rotation);
  } else if (normalizedRotation > 1.25 * Math.PI && normalizedRotation <= 1.75 * Math.PI) {
    y1 += height / 2;
    x1 += width / 2 / Math.tan(rotation);
    y2 -= height / 2;
    x2 -= width / 2 / Math.tan(rotation);
  }

  return {
    x1: Math.round(x1),
    x2: Math.round(x2),
    y1: Math.round(y1),
    y2: Math.round(y2),
  };
}

export function getSvgPathSubpathStartPoint(pathData: string | null) {
  const match = (pathData ?? "")
    .trim()
    .match(/^M\s*([+-]?(?:\d+\.?\d*|\.\d+))[\s,]+([+-]?(?:\d+\.?\d*|\.\d+))/);

  if (!match) {
    return null;
  }

  const x = Number.parseFloat(match[1] ?? "");
  const y = Number.parseFloat(match[2] ?? "");

  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return null;
  }

  return { x, y };
}

export function getSvgViewBoxRegion(svg: SVGElement) {
  const viewBox = svg.getAttribute("viewBox");

  if (viewBox) {
    const [x = 0, y = 0, width = 0, height = 0] = viewBox
      .trim()
      .split(/[\s,]+/)
      .map((value) => Number.parseFloat(value));

    if (width > 0 && height > 0) {
      return { height, width, x, y };
    }
  }

  const width = getNumericAttribute(svg, "width");
  const height = getNumericAttribute(svg, "height");

  if (width !== null && height !== null && width > 0 && height > 0) {
    return { height, width, x: 0, y: 0 };
  }

  return null;
}

export function formatSvgNumber(value: number) {
  if (Math.abs(value) < 0.000001) {
    return "0";
  }

  return Number(value.toFixed(4)).toString();
}

export function coerceSvgNumber(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return value;
}

export function coerceNonNegativeSvgNumber(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, value);
}

export function findDotMatrixLayerAnchor(svg: SVGElement) {
  return (
    Array.from(svg.children).find((child) => {
      if (!isSvgElementLike(child)) {
        return false;
      }

      return child.tagName.toLowerCase() === "image";
    }) ?? null
  );
}

export function removeLegacyDotGradientOverlay(svg: SVGElement) {
  for (const node of svg.querySelectorAll('[data-qr-layer="dot-gradient"]')) {
    if (node.tagName.toLowerCase() === "g") {
      node.remove();
    }
  }

  for (const node of svg.querySelectorAll('[data-qr-layer="dot-gradient-definition"]')) {
    node.remove();
  }
}

export function createBackgroundShapeGradient(
  svg: SVGElement,
  gradient: QraftyGradient,
  {
    height,
    id,
    layer = "background-shape-gradient",
    width,
    x = 0,
    y = 0,
  }: {
    height: number;
    id: string;
    layer?: string;
    width: number;
    x?: number;
    y?: number;
  },
) {
  const document = svg.ownerDocument;

  if (!document) {
    return null;
  }

  const gradientElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    gradient.type === "radial" ? "radialGradient" : "linearGradient",
  );

  gradientElement.setAttribute("id", id);
  gradientElement.setAttribute("data-qr-layer", layer);
  gradientElement.setAttribute("gradientUnits", "userSpaceOnUse");

  if (gradient.type === "radial") {
    const { cx, cy, r } = qraftyRadialCenterInUserSpace(getQraftyGradientCenter(gradient), {
      x,
      y,
      width,
      height,
    });
    gradientElement.setAttribute("cx", String(cx));
    gradientElement.setAttribute("cy", String(cy));
    gradientElement.setAttribute("r", String(r));
  } else {
    const endpoints = getLinearGradientEndpoints({
      height,
      rotation: gradient.rotation,
      width,
      x,
      y,
    });

    gradientElement.setAttribute("x1", String(endpoints.x1));
    gradientElement.setAttribute("y1", String(endpoints.y1));
    gradientElement.setAttribute("x2", String(endpoints.x2));
    gradientElement.setAttribute("y2", String(endpoints.y2));
  }

  for (const colorStop of gradient.colorStops) {
    const stop = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop.setAttribute("offset", String(colorStop.offset));
    stop.setAttribute("stop-color", colorStop.color);
    gradientElement.appendChild(stop);
  }

  return gradientElement;
}
