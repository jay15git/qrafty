import type { QraftyState, QraftyGradient } from "@/features/qr/model/state";
import { type QrSvgExtensionFunction } from "./types";
import {
  SVG_NS,
  splitSvgPathData,
  isSvgElementLike,
  findDotMatrixLayerAnchor,
  createBackgroundShapeGradient,
  getSvgPathSubpathStartPoint,
  getOrCreateSvgDefs,
  getDescendantElements,
  getPaintServerId,
  getElementRegion,
  getLinearGradientEndpoints,
} from "./svg-dom-utils";
import { getQrSvgNumCells } from "./background-shape-layout";

export type FinderCornerKind = "inner" | "outer";

export type FinderCornerRegion = {
  height: number;
  width: number;
  x: number;
  y: number;
};

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

export function createFinderPatternGradientExtension(
  testId: "finder-patterns-inner" | "finder-patterns-outer",
  gradient: QraftyGradient,
  margin: number,
  {
    gradientIdPrefix,
    groupLayer,
  }: {
    gradientIdPrefix: string;
    groupLayer: string;
  },
): QrSvgExtensionFunction {
  const kind: FinderCornerKind = testId === "finder-patterns-outer" ? "outer" : "inner";

  return (svg) => {
    const document = svg.ownerDocument;

    if (!document) {
      return;
    }

    svg.querySelectorAll(`[data-qr-layer="${groupLayer}"]`).forEach((node) => {
      if (node.tagName.toLowerCase() === "g") {
        node.remove();
      }
    });

    const patterns = Array.from(svg.querySelectorAll(`[data-testid="${testId}"]`)).filter(
      isSvgElementLike,
    );

    if (patterns.length === 0) {
      return;
    }

    const numCells = getQrSvgNumCells(svg);
    const cornerRegions = numCells === null ? [] : getFinderCornerRegions(margin, numCells, kind);

    if (cornerRegions.length === 0) {
      return;
    }

    const cornerElements = buildFinderCornerGradientElements(
      patterns,
      cornerRegions,
      document,
      testId,
    );

    if (cornerElements.length !== cornerRegions.length) {
      return;
    }

    const group = document.createElementNS(SVG_NS, "g");
    group.setAttribute("data-qr-layer", groupLayer);
    const defs = getOrCreateSvgDefs(svg);
    const parent = patterns[0]?.parentNode ?? svg;
    const insertReference = patterns[0]?.nextSibling ?? findDotMatrixLayerAnchor(svg);

    for (const pattern of patterns) {
      pattern.remove();
    }

    for (const [index, region] of cornerRegions.entries()) {
      const element = cornerElements[index];

      if (!element) {
        continue;
      }

      const gradientId = `${gradientIdPrefix}${Math.round(region.x)}-${Math.round(region.y)}-1`;
      const gradientElement = createBackgroundShapeGradient(svg, gradient, {
        height: region.height,
        id: gradientId,
        layer: `${groupLayer}-definition`,
        width: region.width,
        x: region.x,
        y: region.y,
      });

      if (!gradientElement) {
        continue;
      }

      defs.appendChild(gradientElement);

      const painted = element.cloneNode(true) as SVGElement;
      painted.setAttribute("fill", `url('#${gradientId}')`);
      painted.setAttribute("data-qr-layer", `${groupLayer}-fill`);
      painted.removeAttribute("opacity");

      const customCornerLayer = element.getAttribute("data-qr-layer");

      if (customCornerLayer === "custom-corner-dot") {
        painted.setAttribute("data-qr-layer", "custom-corner-dot");
      }
      group.appendChild(painted);
    }

    if (group.children.length === 0) {
      return;
    }

    if (insertReference && insertReference.parentNode === parent) {
      parent.insertBefore(group, insertReference);
      return;
    }

    parent.appendChild(group);
  };
}

function buildFinderCornerGradientElements(
  patterns: SVGElement[],
  cornerRegions: FinderCornerRegion[],
  document: Document,
  testId: "finder-patterns-inner" | "finder-patterns-outer",
) {
  if (patterns.length === cornerRegions.length) {
    return sortFinderElementsByCornerRegions(patterns, cornerRegions).map(
      (pattern) => pattern.cloneNode(true) as SVGElement,
    );
  }

  if (patterns.length === 1) {
    return splitFinderPatternIntoCornerElements(patterns[0], cornerRegions, document, testId);
  }

  return [];
}

function sortFinderElementsByCornerRegions(
  patterns: SVGElement[],
  cornerRegions: FinderCornerRegion[],
) {
  return [...patterns].sort((left, right) => {
    const leftIndex = getFinderElementCornerIndex(left, cornerRegions);
    const rightIndex = getFinderElementCornerIndex(right, cornerRegions);

    return leftIndex - rightIndex;
  });
}

function splitFinderPatternIntoCornerElements(
  pattern: SVGElement,
  cornerRegions: FinderCornerRegion[],
  document: Document,
  testId: "finder-patterns-inner" | "finder-patterns-outer",
) {
  const tagName = pattern.tagName.toLowerCase();

  if (tagName !== "path") {
    return cornerRegions.map(() => pattern.cloneNode(true) as SVGElement);
  }

  const groupedSubpaths = cornerRegions.map(() => [] as string[]);

  for (const subpath of splitSvgPathData(pattern.getAttribute("d"))) {
    const start = getSvgPathSubpathStartPoint(subpath);

    if (!start) {
      continue;
    }

    const cornerIndex = getFinderCornerIndexForPoint(start, cornerRegions);
    groupedSubpaths[cornerIndex]?.push(subpath);
  }

  return groupedSubpaths
    .map((subpaths, index) => {
      if (subpaths.length === 0) {
        return null;
      }

      const path = document.createElementNS(SVG_NS, "path");
      path.setAttribute("d", subpaths.join(""));
      path.setAttribute("data-testid", testId);
      copyFinderPatternPresentation(pattern, path);
      return path;
    })
    .filter((element): element is SVGPathElement => element !== null);
}

function copyFinderPatternPresentation(source: SVGElement, target: SVGElement) {
  for (const attribute of ["class", "shape-rendering", "style", "transform", "fill-rule"]) {
    const value = source.getAttribute(attribute);

    if (value) {
      target.setAttribute(attribute, value);
    }
  }

  const layer = source.getAttribute("data-qr-layer");

  if (layer) {
    target.setAttribute("data-qr-layer", layer);
  }
}

function getFinderElementCornerIndex(
  element: SVGElement,
  cornerRegions: FinderCornerRegion[],
) {
  const tagName = element.tagName.toLowerCase();

  if (tagName === "rect") {
    const x = Number.parseFloat(element.getAttribute("x") ?? "");
    const y = Number.parseFloat(element.getAttribute("y") ?? "");
    const width = Number.parseFloat(element.getAttribute("width") ?? "0");
    const height = Number.parseFloat(element.getAttribute("height") ?? "0");

    if (Number.isFinite(x) && Number.isFinite(y)) {
      return getFinderCornerIndexForPoint({ x: x + width / 2, y: y + height / 2 }, cornerRegions);
    }
  }

  if (tagName === "path") {
    const transform = element.getAttribute("transform");

    if (transform) {
      const translateMatch = transform.match(/translate\(([-\d.]+)[,\s]+([-\d.]+)\)/);
      const x = Number.parseFloat(translateMatch?.[1] ?? "");
      const y = Number.parseFloat(translateMatch?.[2] ?? "");

      if (Number.isFinite(x) && Number.isFinite(y)) {
        return getFinderCornerIndexForPoint({ x: x + 1.5, y: y + 1.5 }, cornerRegions);
      }
    }

    const start = getSvgPathSubpathStartPoint(element.getAttribute("d"));

    if (start) {
      return getFinderCornerIndexForPoint(start, cornerRegions);
    }
  }

  return 0;
}

function getFinderCornerIndexForPoint(
  point: { x: number; y: number },
  cornerRegions: FinderCornerRegion[],
) {
  for (const [index, region] of cornerRegions.entries()) {
    if (
      point.x >= region.x &&
      point.x <= region.x + region.width &&
      point.y >= region.y &&
      point.y <= region.y + region.height
    ) {
      return index;
    }
  }

  let closestIndex = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (const [index, region] of cornerRegions.entries()) {
    const centerX = region.x + region.width / 2;
    const centerY = region.y + region.height / 2;
    const distance = (point.x - centerX) ** 2 + (point.y - centerY) ** 2;

    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }

  return closestIndex;
}

export function createAlignedCornerGradientExtension(
  state: Pick<
    QraftyState,
    | "finderPatternInnerGradient"
    | "finderPatternOuterGradient"
    | "gradientLinkMode"
    | "dotsColorMode"
    | "dataModulesGradient"
  >,
): QrSvgExtensionFunction | null {
  const unifiedModuleGradient =
    state.gradientLinkMode === "unified" &&
    state.dotsColorMode === "gradient" &&
    state.dataModulesGradient.enabled;

  if (unifiedModuleGradient) {
    return null;
  }

  const cornerSquareRotation = getAlignedCornerGradientRotation(state.finderPatternOuterGradient);
  const cornerDotRotation = getAlignedCornerGradientRotation(state.finderPatternInnerGradient);

  if (cornerSquareRotation === null && cornerDotRotation === null) {
    return null;
  }

  return (svg) => {
    if (cornerSquareRotation !== null) {
      alignCornerGradientDirection(svg, {
        gradientIdPrefix: "corners-square-color-",
        rotation: cornerSquareRotation,
      });
    }

    if (cornerDotRotation !== null) {
      alignCornerGradientDirection(svg, {
        gradientIdPrefix: "corners-dot-color-",
        rotation: cornerDotRotation,
      });
    }
  };
}

function getAlignedCornerGradientRotation(
  gradient: Pick<QraftyGradient, "enabled" | "rotation" | "type">,
) {
  if (!gradient.enabled || gradient.type !== "linear") {
    return null;
  }

  return gradient.rotation;
}

function alignCornerGradientDirection(
  svg: SVGElement,
  {
    gradientIdPrefix,
    rotation,
  }: {
    gradientIdPrefix: string;
    rotation: number;
  },
) {
  const svgElements = getDescendantElements(svg);

  for (const gradient of svgElements) {
    if (
      gradient.tagName.toLowerCase() !== "lineargradient" ||
      !gradient.getAttribute("id")?.startsWith(gradientIdPrefix)
    ) {
      continue;
    }

    const gradientId = gradient.getAttribute("id");

    if (!gradientId) {
      continue;
    }

    const fillRect = svgElements.find(
      (element) =>
        element.tagName.toLowerCase() === "rect" &&
        getPaintServerId(element.getAttribute("fill")) === gradientId,
    );

    if (!fillRect) {
      continue;
    }

    const region = getElementRegion(fillRect);

    if (!region) {
      continue;
    }

    const endpoints = getLinearGradientEndpoints({
      ...region,
      rotation,
    });

    gradient.setAttribute("x1", String(endpoints.x1));
    gradient.setAttribute("y1", String(endpoints.y1));
    gradient.setAttribute("x2", String(endpoints.x2));
    gradient.setAttribute("y2", String(endpoints.y2));
  }
}
