import type { QrSvgElementLike } from "./svg-element-like";

export type FinderCornerKind = "inner" | "outer";

export type FinderCornerRegion = {
  height: number;
  width: number;
  x: number;
  y: number;
};

function getNumericAttribute(element: QrSvgElementLike, name: string) {
  const value = element.getAttribute(name);

  if (value === null) {
    return null;
  }

  const numericValue = Number.parseFloat(value);

  return Number.isFinite(numericValue) ? numericValue : null;
}

export function getQrSvgNumCells(svg: QrSvgElementLike) {
  const viewBox = svg.getAttribute("viewBox");

  if (viewBox) {
    const parts = viewBox
      .trim()
      .split(/[\s,]+/)
      .map((value) => Number.parseFloat(value));

    const width = parts[2];
    const height = parts[3];

    if (
      width !== undefined &&
      height !== undefined &&
      Number.isFinite(width) &&
      Number.isFinite(height) &&
      width > 0 &&
      height > 0
    ) {
      return Math.min(width, height);
    }
  }

  const width = getNumericAttribute(svg, "width");
  const height = getNumericAttribute(svg, "height");

  if (width !== null && height !== null && width > 0 && height > 0) {
    return Math.min(width, height);
  }

  return null;
}

export function getFinderCornerRegions(
  margin: number,
  numCells: number,
  kind: FinderCornerKind,
): FinderCornerRegion[] {
  const moduleCount = numCells - margin * 2;
  const outerSize = 7;
  const innerSize = 3;
  const innerInset = 2;
  const innerPadding = kind === "inner" ? 0.75 : 0;

  if (moduleCount <= outerSize || margin < 0) {
    return [];
  }

  if (kind === "outer") {
    return [
      { height: outerSize, width: outerSize, x: margin, y: margin },
      {
        height: outerSize,
        width: outerSize,
        x: moduleCount + margin - outerSize,
        y: margin,
      },
      {
        height: outerSize,
        width: outerSize,
        x: margin,
        y: moduleCount + margin - outerSize,
      },
    ];
  }

  const size = innerSize + innerPadding * 2;
  const inset = innerInset - innerPadding;
  const innerX = moduleCount + margin - outerSize + inset;
  const innerY = moduleCount + margin - outerSize + inset;

  return [
    { height: size, width: size, x: margin + inset, y: margin + inset },
    { height: size, width: size, x: innerX, y: margin + inset },
    { height: size, width: size, x: margin + inset, y: innerY },
  ];
}
