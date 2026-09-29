import type {
  DotMatrixMetrics,
  DotPaletteShapeGroup,
  QrSvgDocumentLike,
  QrSvgElementLike,
} from "@qrafty/qr-internal/core";
import {
  balanceDotPaletteAssignments,
  createDotPaletteShapeGroups,
  getActiveDotsPalette as getActiveDotsPaletteColors,
  getDotPaletteIndex,
  hashDotPaletteString,
} from "@qrafty/qr-internal/core";

import type { QraftyState } from "@/features/qr/model/state";
import { SVG_NS, findDotMatrixLayerAnchor } from "./svg-dom-utils";
import {
  removeDotMatrixBaseLayers,
  removeOrphanedModuleClipPaths,
  type DotClipLayer,
  type DotPathLayer,
  collectDotMatrixMetrics,
  getFallbackDotMatrixMetrics,
  resolveDotMatrixCoordinates,
} from "./dot-matrix-model";

function getMergeableClipPathData(shape: QrSvgElementLike) {
  if (shape.getAttribute("transform")) {
    return null;
  }

  const tagName = shape.tagName.toLowerCase();

  if (tagName === "path") {
    return shape.getAttribute("d");
  }

  if (tagName === "rect") {
    const x = Number.parseFloat(shape.getAttribute("x") ?? "0") || 0;
    const y = Number.parseFloat(shape.getAttribute("y") ?? "0") || 0;
    const width = Number.parseFloat(shape.getAttribute("width") ?? "0") || 0;
    const height = Number.parseFloat(shape.getAttribute("height") ?? "0") || 0;
    const hasRadius = Boolean(shape.getAttribute("rx") ?? shape.getAttribute("ry"));

    if (width <= 0 || height <= 0 || hasRadius) {
      return null;
    }

    return `M${x} ${y}h${width}v${height}h${-width}Z`;
  }

  return null;
}

type PaletteColorAssignment = {
  color: string;
  paletteIndex: number;
  shapes: QrSvgElementLike[];
};

export type PalettePaintGroupLayer = "dot-matrix-motion-modules" | "dot-palette";

export function getActiveDotsPalette(state: Pick<QraftyState, "dotsPalette">) {
  return getActiveDotsPaletteColors(state.dotsPalette);
}

function groupDotPaletteShapes(
  shapes: QrSvgElementLike[],
  metrics: DotMatrixMetrics | null,
): DotPaletteShapeGroup<QrSvgElementLike>[] {
  return createDotPaletteShapeGroups(shapes, metrics, (shape, nextMetrics) =>
    resolveDotMatrixCoordinates(shape, nextMetrics),
  );
}

function buildPaletteColorAssignments(
  state: Pick<QraftyState, "data" | "dotsPalette">,
  allDotShapes: QrSvgElementLike[],
  metrics: DotMatrixMetrics | null,
) {
  const palette = getActiveDotsPalette(state);

  if (palette.length === 0 || allDotShapes.length === 0) {
    return null;
  }

  const paletteSeed = hashDotPaletteString(state.data.trim());
  const shapeGroups = groupDotPaletteShapes(allDotShapes, metrics);
  const assignments: PaletteColorAssignment[] = palette.map((color) => ({
    color,
    paletteIndex: palette.indexOf(color),
    shapes: [],
  }));
  const groupAssignments = shapeGroups.map((group) => ({
    group,
    paletteIndex: getDotPaletteIndex(group, palette.length, paletteSeed),
  }));

  balanceDotPaletteAssignments(groupAssignments, palette.length, paletteSeed);

  for (const { group, paletteIndex } of groupAssignments) {
    assignments[paletteIndex]?.shapes.push(...group.shapes);
  }

  const activeAssignments = assignments.filter((assignment) => assignment.shapes.length > 0);

  return activeAssignments.length > 0 ? activeAssignments : null;
}

function createPaletteModuleGroup(
  document: QrSvgDocumentLike,
  palette: string[],
  activeAssignments: PaletteColorAssignment[],
  groupLayer: PalettePaintGroupLayer,
) {
  const group = document.createElementNS(SVG_NS, "g");
  group.setAttribute("data-qr-layer", groupLayer);

  if (groupLayer === "dot-palette") {
    group.setAttribute("data-qr-palette-size", String(palette.length));
  }

  for (const { color, paletteIndex, shapes } of activeAssignments) {
    const colorGroup = document.createElementNS(SVG_NS, "g");
    colorGroup.setAttribute("fill", color);
    colorGroup.setAttribute("data-qr-layer", "dot-palette-fill");
    colorGroup.setAttribute("data-qr-palette-index", String(paletteIndex));

    const mergedPathData: string[] = [];
    const paintedShapes: QrSvgElementLike[] = [];

    for (const shape of shapes) {
      const pathData = groupLayer === "dot-palette" ? getMergeableClipPathData(shape) : null;

      if (pathData) {
        mergedPathData.push(pathData);
        continue;
      }

      const painted = shape.cloneNode(true) as QrSvgElementLike;
      painted.removeAttribute("clip-path");
      painted.removeAttribute("opacity");
      paintedShapes.push(painted);
    }

    if (mergedPathData.length > 0) {
      const mergedPath = document.createElementNS(SVG_NS, "path");
      mergedPath.setAttribute("d", mergedPathData.join(" "));
      mergedPath.setAttribute("fill", color);
      mergedPath.setAttribute("fill-rule", "nonzero");
      mergedPath.setAttribute("data-qr-palette-index", String(paletteIndex));
      colorGroup.appendChild(mergedPath);
    }

    for (const painted of paintedShapes) {
      painted.setAttribute("fill", color);
      painted.setAttribute("data-qr-palette-index", String(paletteIndex));
      colorGroup.appendChild(painted);
    }

    group.appendChild(colorGroup);
  }

  return group;
}

export function applyDirectPalettePaint(
  svg: QrSvgElementLike,
  state: Pick<QraftyState, "data" | "dotsPalette">,
  allDotShapes: QrSvgElementLike[],
  dotClipLayers: DotClipLayer[],
  dotPathLayers: DotPathLayer[],
  options: { groupLayer: PalettePaintGroupLayer },
) {
  const document = svg.ownerDocument;
  const palette = getActiveDotsPalette(state);

  if (!document || palette.length === 0) {
    return false;
  }

  const metrics =
    collectDotMatrixMetrics(allDotShapes) ?? getFallbackDotMatrixMetrics(allDotShapes);
  const activeAssignments = buildPaletteColorAssignments(state, allDotShapes, metrics);

  if (!activeAssignments) {
    return false;
  }

  const anchor = findDotMatrixLayerAnchor(svg);
  removeDotMatrixBaseLayers(dotClipLayers, dotPathLayers);
  removeOrphanedModuleClipPaths(svg);

  const group = createPaletteModuleGroup(document, palette, activeAssignments, options.groupLayer);

  if (group.children.length === 0) {
    return false;
  }

  svg.insertBefore(group, anchor);

  return true;
}
