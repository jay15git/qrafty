import type { QrSvgElementLike } from "@qrafty/qr-internal/core";

export { formatSvgNumber, splitSvgPathData } from "@qrafty/qr-internal/core";

export const SVG_NS = "http://www.w3.org/2000/svg";

export function isSvgElementLike(
  node: QrSvgElementLike | null | undefined,
): node is QrSvgElementLike {
  return (
    node != null &&
    typeof node.getAttribute === "function" &&
    typeof node.setAttribute === "function"
  );
}

export function appendSvgClass(element: QrSvgElementLike, className: string) {
  const existing = element.getAttribute("class") ?? "";

  if (existing.split(/\s+/).includes(className)) {
    return;
  }

  element.setAttribute("class", existing ? `${existing} ${className}` : className);
}

export function getClipPathId(clipPath: string | null) {
  return /url\(['"]?#([^'")]+)['"]?\)/.exec(clipPath ?? "")?.[1] ?? null;
}

export function getOrCreateSvgDefs(svg: QrSvgElementLike) {
  const existingDefs = Array.from(svg.children).find(
    (child) => child.tagName.toLowerCase() === "defs",
  );

  if (existingDefs) {
    return existingDefs;
  }

  const defs = svg.ownerDocument.createElementNS(SVG_NS, "defs");
  svg.insertBefore(defs, svg.firstChild ?? null);

  return defs;
}

export function getDotNumericAttribute(shape: QrSvgElementLike, attributeName: string) {
  const value = shape.getAttribute(attributeName);

  if (value === null) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function findDotMatrixLayerAnchor(svg: QrSvgElementLike) {
  return (
    Array.from(svg.children).find((child) => {
      if (!isSvgElementLike(child)) {
        return false;
      }

      return child.tagName.toLowerCase() === "image";
    }) ?? null
  );
}
