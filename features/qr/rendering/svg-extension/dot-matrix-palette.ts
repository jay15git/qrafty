import type { QraftyState } from "@/features/qr/model/state";
import { getMergeableClipPathData } from "@qrafty/qr-internal/core";
import { SVG_NS, findDotMatrixLayerAnchor } from "./svg-dom-utils";
import {
  removeDotMatrixBaseLayers,
  removeOrphanedModuleClipPaths,
  type DotClipLayer,
  type DotPathLayer,
  type DotMatrixMetrics,
  type DotPaletteShapeGroup,
  type DotPaletteGroupAssignment,
  collectDotMatrixMetrics,
  getFallbackDotMatrixMetrics,
  resolveDotMatrixCoordinates,
} from "./dot-matrix-model";

type PaletteColorAssignment = {
  color: string;
  paletteIndex: number;
  shapes: SVGElement[];
};

export type PalettePaintGroupLayer = "dot-matrix-motion-modules" | "dot-palette";

export function getActiveDotsPalette(state: Pick<QraftyState, "dotsPalette">) {
  const seen = new Set<string>();

  return state.dotsPalette.flatMap((color) => {
    const trimmed = color.trim();
    if (!trimmed.length || seen.has(trimmed)) {
      return [];
    }

    seen.add(trimmed);
    return [trimmed];
  });
}

function createDotPaletteShapeGroups(
  shapes: SVGElement[],
  metrics: DotMatrixMetrics | null,
): DotPaletteShapeGroup[] {
  const groups = new Map<string, DotPaletteShapeGroup>();

  for (const [fallbackIndex, shape] of shapes.entries()) {
    const coordinates = metrics ? resolveDotMatrixCoordinates(shape, metrics) : null;
    const key = coordinates ? `${coordinates.row}:${coordinates.col}` : `fallback:${fallbackIndex}`;
    const group = groups.get(key);

    if (group) {
      group.shapes.push(shape);
      continue;
    }

    groups.set(key, {
      coordinates,
      fallbackIndex,
      shapes: [shape],
    });
  }

  return Array.from(groups.values()).sort(compareDotPaletteShapeGroups);
}

function compareDotPaletteShapeGroups(left: DotPaletteShapeGroup, right: DotPaletteShapeGroup) {
  if (left.coordinates && right.coordinates) {
    return (
      left.coordinates.row - right.coordinates.row ||
      left.coordinates.col - right.coordinates.col ||
      left.fallbackIndex - right.fallbackIndex
    );
  }

  if (left.coordinates) {
    return -1;
  }

  if (right.coordinates) {
    return 1;
  }

  return left.fallbackIndex - right.fallbackIndex;
}

function getDotPaletteIndex(group: DotPaletteShapeGroup, paletteLength: number, seed: number) {
  if (paletteLength <= 0) {
    return 0;
  }

  return hashDotPaletteGroup(group, seed) % paletteLength;
}

function balanceDotPaletteAssignments(
  assignments: DotPaletteGroupAssignment[],
  paletteLength: number,
  seed: number,
) {
  if (assignments.length < paletteLength || paletteLength <= 1) {
    return;
  }

  const counts = countDotPaletteAssignments(assignments, paletteLength);
  const missingPaletteIndexes = counts
    .map((count, paletteIndex) => (count === 0 ? paletteIndex : null))
    .filter((paletteIndex): paletteIndex is number => paletteIndex !== null);

  for (const missingPaletteIndex of missingPaletteIndexes) {
    let candidateIndex = -1;
    let candidateScore = -1;

    for (const [assignmentIndex, assignment] of assignments.entries()) {
      if (counts[assignment.paletteIndex] <= 1) {
        continue;
      }

      const score = hashDotPaletteNumbers([
        seed,
        missingPaletteIndex,
        assignmentIndex,
        assignment.group.coordinates?.row ?? -1,
        assignment.group.coordinates?.col ?? assignment.group.fallbackIndex,
      ]);

      if (score > candidateScore) {
        candidateIndex = assignmentIndex;
        candidateScore = score;
      }
    }

    if (candidateIndex === -1) {
      return;
    }

    const assignment = assignments[candidateIndex];
    counts[assignment.paletteIndex] -= 1;
    assignment.paletteIndex = missingPaletteIndex;
    counts[missingPaletteIndex] += 1;
  }
}

function countDotPaletteAssignments(
  assignments: DotPaletteGroupAssignment[],
  paletteLength: number,
) {
  const counts = Array.from({ length: paletteLength }, () => 0);

  for (const assignment of assignments) {
    counts[assignment.paletteIndex] += 1;
  }

  return counts;
}

function hashDotPaletteGroup(group: DotPaletteShapeGroup, seed: number) {
  return hashDotPaletteNumbers([
    seed,
    group.coordinates?.row ?? -1,
    group.coordinates?.col ?? -1,
    group.fallbackIndex,
  ]);
}

function hashDotPaletteString(value: string) {
  const input = value.length > 0 ? value : "qr-dot-palette";
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function hashDotPaletteNumbers(values: number[]) {
  let hash = 0x811c9dc5;

  for (const value of values) {
    hash ^= value | 0;
    hash = Math.imul(hash, 0x45d9f3b);
    hash ^= hash >>> 16;
  }

  hash = Math.imul(hash ^ (hash >>> 15), 0x2c1b3c6d);
  hash = Math.imul(hash ^ (hash >>> 12), 0x297a2d39);

  return (hash ^ (hash >>> 15)) >>> 0;
}

function buildPaletteColorAssignments(
  state: Pick<QraftyState, "data" | "dotsPalette">,
  allDotShapes: SVGElement[],
  metrics: DotMatrixMetrics | null,
) {
  const palette = getActiveDotsPalette(state);

  if (palette.length === 0 || allDotShapes.length === 0) {
    return null;
  }

  const paletteSeed = hashDotPaletteString(state.data.trim());
  const shapeGroups = createDotPaletteShapeGroups(allDotShapes, metrics);
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
  document: Document,
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
    const paintedShapes: SVGElement[] = [];

    for (const shape of shapes) {
      const pathData = groupLayer === "dot-palette" ? getMergeableClipPathData(shape) : null;

      if (pathData) {
        mergedPathData.push(pathData);
        continue;
      }

      const painted = shape.cloneNode(true) as SVGElement;
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
  svg: SVGElement,
  state: Pick<QraftyState, "data" | "dotsPalette">,
  allDotShapes: SVGElement[],
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
