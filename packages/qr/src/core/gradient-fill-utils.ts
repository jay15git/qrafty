import type { QrSvgElementLike } from "./svg-element-like";

import { getQrSvgNumCells } from "./finder-gradient-overlays";

export function getModuleGradientCoverRect(svg: QrSvgElementLike, margin: number) {
  const numCells = getQrSvgNumCells(svg);

  if (numCells === null) {
    return null;
  }

  const moduleCount = numCells - margin * 2;

  if (moduleCount <= 0) {
    return null;
  }

  return {
    height: moduleCount,
    width: moduleCount,
    x: margin,
    y: margin,
  };
}

const SHAPE_TAGS = new Set(["circle", "ellipse", "line", "path", "polygon", "polyline", "rect"]);

export type SvgPaintContext = {
  fill: string | null;
  stroke: string | null;
};

function resolveInheritedPaint(value: string | null, inherited: string | null) {
  return value ?? inherited;
}

function hasReplaceablePaint(value: string | null) {
  return value !== null && value !== "none";
}

export function applyDirectGradientFillWithContext(
  element: QrSvgElementLike,
  gradientRef: string,
  inherited: SvgPaintContext,
) {
  const fill = resolveInheritedPaint(element.getAttribute("fill"), inherited.fill);
  const stroke = resolveInheritedPaint(element.getAttribute("stroke"), inherited.stroke);
  const tag = element.tagName.toLowerCase();
  const nextInherited: SvgPaintContext = { fill, stroke };

  if (SHAPE_TAGS.has(tag)) {
    const fillEffective = resolveInheritedPaint(element.getAttribute("fill"), inherited.fill);
    const strokeEffective = resolveInheritedPaint(element.getAttribute("stroke"), inherited.stroke);

    if (hasReplaceablePaint(fillEffective)) {
      element.setAttribute("fill", gradientRef);
    } else if (hasReplaceablePaint(strokeEffective)) {
      element.setAttribute("stroke", gradientRef);
    } else if (fillEffective === null && strokeEffective === null) {
      element.setAttribute("fill", gradientRef);
    }
  }

  for (const child of element.children) {
    applyDirectGradientFillWithContext(child, gradientRef, nextInherited);
  }
}

export function applyDirectGradientFill(element: QrSvgElementLike, gradientRef: string) {
  applyDirectGradientFillWithContext(element, gradientRef, {
    fill: null,
    stroke: null,
  });
}
