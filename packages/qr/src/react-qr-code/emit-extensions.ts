// Emit-time implementation of the QR svg extensions. These run against
// ordered-attribute EmitNodes while `emitReactQrCodeMarkup` builds the tree,
// producing markup identical to the former parse→mutate→serialize IR pass.
//
// Every mutation here replicates the DOM-layer semantics it replaces:
// attribute order (Map-like set order), child insertion points, id/layer
// naming, and gradient endpoint math are all load-bearing — golden exports
// pin the bytes.

import {
  getFinderCornerRegions,
  type FinderCornerKind,
  type FinderCornerRegion,
} from "../core/finder-gradient-overlays";
import {
  balanceDotPaletteAssignments,
  collectDotMatrixAnchors,
  collectDotMatrixMetricsFromAnchors,
  createDotPaletteShapeGroups,
  getActiveDotsPalette,
  getDotMatrixAnchor,
  getDotPaletteIndex,
  getFallbackDotMatrixMetricsFromAnchors,
  hashDotPaletteString,
  resolveDotMatrixAnchorCoordinates,
  type DotMatrixMetrics,
  type DotMatrixShapeLike,
} from "../core/dot-palette";
import {
  appendEmitChild,
  cloneEmitNode,
  createEmitNode,
  getEmitAttr,
  getEmitAttrNS,
  getEmitAttrNormalized,
  insertEmitBefore,
  removeEmitAttr,
  removeEmitNode,
  setEmitAttr,
  setEmitAttrNS,
  type EmitNode,
} from "../core/emit-node";
import {
  formatSvgNumber,
  getLinearGradientEndpoints,
  getSvgPathSubpathStartPoint,
  splitSvgPathData,
} from "../core/svg-utils";

export type QrSvgEmitGradient = {
  type: "linear" | "radial";
  rotation: number;
  /** Normalized radial center in 0..1 (defaults to the box center). */
  center?: { x: number; y: number };
  stops: { offset: number; color: string }[];
};

export type QrSvgEmitRegion = {
  height: number;
  width: number;
  x: number;
  y: number;
};

export type QrSvgEmitShapeOptions = {
  strokeColor: string;
  strokeOpacity: number;
  strokeWidth: number;
};

export type QrSvgEmitBackgroundMetrics = {
  backingRegion: QrSvgEmitRegion;
  contentScale: number;
  outerHeight: number;
  outerWidth: number;
  translateX: number;
  translateY: number;
};

export type QrSvgCustomCornerDotGeometry = {
  d: string;
  fillRule?: "evenodd";
  originX: number;
  originY: number;
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
};

export type QrSvgEmitBackgroundResolution = {
  metrics: QrSvgEmitBackgroundMetrics;
  shapeOptions: QrSvgEmitShapeOptions;
  /** Precomputed shape transform; only used by the decorative shape layer. */
  transform?: string;
};

export type QrSvgEmitExtensions = {
  /** Rendered pixel size (clamped) used for the background image extents. */
  height: number;
  width: number;
  /** Raw (unclamped) state margin — extensions historically read it directly. */
  margin: number;
  customCornerDot?: {
    color: string;
    geometry: (x: number, y: number, size: number) => QrSvgCustomCornerDotGeometry;
  };
  backgroundImage?: {
    href: string;
    round: number;
  };
  dotsGradient?: QrSvgEmitGradient;
  dotsPalette?: {
    colors: string[];
    /** Raw `state.data`; trimmed internally for the palette seed. */
    seedData: string;
  };
  unified?: { kind: "gradient"; gradient: QrSvgEmitGradient } | { kind: "image"; href: string };
  cornerGradients?: {
    inner?: QrSvgEmitGradient;
    outer?: QrSvgEmitGradient;
  };
  backgroundShape?: {
    path: string;
    viewBoxHeight: number;
    viewBoxWidth: number;
    fill: { color: string; gradient?: QrSvgEmitGradient };
    resolve: (numCells: number) => QrSvgEmitBackgroundResolution;
  };
  backgroundSurface?: {
    round: number;
    fill: { color: string; gradient?: QrSvgEmitGradient };
    resolve: (numCells: number) => QrSvgEmitBackgroundResolution;
  };
};

export type QrEmitContext = {
  dataModules: EmitNode;
  finderInner: EmitNode[];
  finderOuter: EmitNode[];
  image: EmitNode | null;
  numCells: number;
  svg: EmitNode;
};

const XLINK_NS = "http://www.w3.org/1999/xlink";

function nextEmitSibling(node: EmitNode) {
  const parent = node.parentNode;

  if (!parent) {
    return null;
  }

  return parent.children[parent.children.indexOf(node) + 1] ?? null;
}

function ensureDefs(svg: EmitNode): EmitNode {
  const existing = svg.children.find((child) => child.tagName.toLowerCase() === "defs");

  if (existing) {
    return existing;
  }

  const defs = createEmitNode("defs");
  insertEmitBefore(svg, defs, svg.children[0] ?? null);
  return defs;
}

function firstTopLevelImage(svg: EmitNode) {
  return svg.children.find((child) => child.tagName.toLowerCase() === "image") ?? null;
}

function pathShapeLike(d: string): DotMatrixShapeLike {
  return {
    tagName: "path",
    getAttribute: (name: string) => (name === "d" ? d : null),
  };
}

function nodeShapeLike(node: EmitNode): DotMatrixShapeLike {
  return {
    tagName: node.tagName,
    getAttribute: (name: string) => getEmitAttr(node, name),
  };
}

function getEmitElementRegion(node: EmitNode): QrSvgEmitRegion | null {
  const parse = (name: string) => {
    const value = getEmitAttr(node, name);
    if (value === null) {
      return null;
    }
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  };
  const x = parse("x");
  const y = parse("y");
  const width = parse("width");
  const height = parse("height");

  if (x === null || y === null || width === null || height === null || width <= 0 || height <= 0) {
    return null;
  }

  return { height, width, x, y };
}

// Mirrors `createBackgroundShapeGradient` from the DOM layer: id, data-qr-layer,
// gradientUnits, then coords — linear endpoints rounded.
function emitQraftyGradientDef(
  gradient: QrSvgEmitGradient,
  {
    height,
    id,
    layer,
    width,
    x = 0,
    y = 0,
  }: { height: number; id: string; layer: string; width: number; x?: number; y?: number },
) {
  const node = createEmitNode(gradient.type === "radial" ? "radialGradient" : "linearGradient", [
    ["id", id],
    ["data-qr-layer", layer],
    ["gradientUnits", "userSpaceOnUse"],
  ]);

  if (gradient.type === "radial") {
    const center = gradient.center ?? { x: 0.5, y: 0.5 };
    setEmitAttr(node, "cx", String(x + center.x * width));
    setEmitAttr(node, "cy", String(y + center.y * height));
    setEmitAttr(node, "r", String(Math.max(width, height) / 2));
  } else {
    const endpoints = getLinearGradientEndpoints({
      height,
      rotation: gradient.rotation,
      width,
      x,
      y,
      round: true,
    });

    setEmitAttr(node, "x1", String(endpoints.x1));
    setEmitAttr(node, "y1", String(endpoints.y1));
    setEmitAttr(node, "x2", String(endpoints.x2));
    setEmitAttr(node, "y2", String(endpoints.y2));
  }

  for (const stop of gradient.stops) {
    appendEmitChild(
      node,
      createEmitNode("stop", [
        ["offset", String(stop.offset)],
        ["stop-color", stop.color],
      ]),
    );
  }

  return node;
}

// Mirrors core `createCornerGradientElement`: id, gradientUnits, coords —
// linear endpoints unrounded — with data-qr-layer appended afterwards.
function emitUnifiedGradientDef(
  gradient: QrSvgEmitGradient,
  id: string,
  layer: string,
  region: QrSvgEmitRegion,
) {
  const node = createEmitNode(gradient.type === "radial" ? "radialGradient" : "linearGradient", [
    ["id", id],
    ["gradientUnits", "userSpaceOnUse"],
  ]);

  if (gradient.type === "radial") {
    const center = gradient.center ?? { x: 0.5, y: 0.5 };
    setEmitAttr(node, "cx", String(region.x + center.x * region.width));
    setEmitAttr(node, "cy", String(region.y + center.y * region.height));
    setEmitAttr(node, "r", String(Math.max(region.width, region.height) / 2));
  } else {
    const endpoints = getLinearGradientEndpoints({
      height: region.height,
      rotation: gradient.rotation,
      width: region.width,
      x: region.x,
      y: region.y,
    });

    setEmitAttr(node, "x1", String(endpoints.x1));
    setEmitAttr(node, "y1", String(endpoints.y1));
    setEmitAttr(node, "x2", String(endpoints.x2));
    setEmitAttr(node, "y2", String(endpoints.y2));
  }

  for (const stop of gradient.stops) {
    appendEmitChild(
      node,
      createEmitNode("stop", [
        ["offset", String(stop.offset)],
        ["stop-color", stop.color],
      ]),
    );
  }

  setEmitAttr(node, "data-qr-layer", layer);

  return node;
}

function applyCustomCornerDot(
  ctx: QrEmitContext,
  dot: NonNullable<QrSvgEmitExtensions["customCornerDot"]>,
) {
  const existing = ctx.finderInner;

  if (existing.length === 0) {
    return;
  }

  const regions = existing
    .map((element) => getFinderInnerElementRegion(element))
    .filter((region): region is { size: number; x: number; y: number } => region !== null);

  if (regions.length === 0) {
    return;
  }

  const insertBefore = nextEmitSibling(existing[existing.length - 1]);

  for (const element of existing) {
    removeEmitNode(element);
  }

  const replacements: EmitNode[] = [];

  for (const region of regions) {
    const geometry = dot.geometry(region.x, region.y, region.size);
    const transform =
      `translate(${geometry.translateX} ${geometry.translateY}) ` +
      `scale(${geometry.scaleX} ${geometry.scaleY}) ` +
      `translate(${geometry.originX} ${geometry.originY})`;
    const attrs: [string, string][] = [
      ["d", geometry.d],
      ["fill", dot.color],
      ["transform", transform],
      ["data-testid", "finder-patterns-inner"],
      ["data-qr-layer", "custom-corner-dot"],
    ];

    if (geometry.fillRule) {
      attrs.push(["fill-rule", geometry.fillRule]);
    }

    const path = createEmitNode("path", attrs);
    insertEmitBefore(ctx.svg, path, insertBefore);
    replacements.push(path);
  }

  ctx.finderInner = replacements;
}

function getFinderInnerElementRegion(element: EmitNode) {
  const tagName = element.tagName.toLowerCase();

  if (tagName === "rect") {
    const x = Number.parseFloat(getEmitAttr(element, "x") ?? "");
    const y = Number.parseFloat(getEmitAttr(element, "y") ?? "");
    const width = Number.parseFloat(getEmitAttr(element, "width") ?? "3");
    const height = Number.parseFloat(getEmitAttr(element, "height") ?? "3");

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
    const transform = getEmitAttr(element, "transform");

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

function applyBackgroundImage(
  ctx: QrEmitContext,
  image: NonNullable<QrSvgEmitExtensions["backgroundImage"]>,
  ext: QrSvgEmitExtensions,
) {
  const width = String(ext.width ?? 300);
  const height = String(ext.height ?? 300);

  const backgroundImage = createEmitNode("image", [
    ["data-qr-layer", "background-image"],
    ["href", image.href],
    ["x", "0"],
    ["y", "0"],
    ["width", width],
    ["height", height],
    ["preserveAspectRatio", "xMidYMid slice"],
  ]);
  setEmitAttrNS(backgroundImage, XLINK_NS, "xlink:href", image.href);

  if (image.round > 0) {
    const numericWidth = ext.width ?? 300;
    const numericHeight = ext.height ?? 300;
    const size = Math.min(numericWidth, numericHeight);
    const clipPathId = "clip-path-background-image";
    const clipPath = createEmitNode("clipPath", [
      ["id", clipPathId],
      ["data-qr-layer", "background-image-clip"],
    ]);
    appendEmitChild(
      clipPath,
      createEmitNode("rect", [
        ["x", String((numericWidth - size) / 2)],
        ["y", String((numericHeight - size) / 2)],
        ["width", String(size)],
        ["height", String(size)],
        ["rx", String((size / 2) * image.round)],
      ]),
    );
    appendEmitChild(ensureDefs(ctx.svg), clipPath);
    setEmitAttr(backgroundImage, "clip-path", "url('#clip-path-background-image')");
  }

  const children = ctx.svg.children;
  const backgroundRectIndex = children.findIndex(
    (child) =>
      child.tagName.toLowerCase() === "rect" ||
      getEmitAttr(child, "data-qr-layer") === "background-surface-stroke",
  );
  const insertReference =
    backgroundRectIndex >= 0
      ? (children[backgroundRectIndex + 1] ?? null)
      : (children.find((child) => child.tagName.toLowerCase() !== "defs") ?? null);

  insertEmitBefore(ctx.svg, backgroundImage, insertReference);
}

function collectDataModuleSegments(ctx: QrEmitContext) {
  return splitSvgPathData(getEmitAttr(ctx.dataModules, "d"));
}

function getSegmentMetrics(segments: string[]): DotMatrixMetrics | null {
  const shapes = segments.map(pathShapeLike);
  const anchors = collectDotMatrixAnchors(shapes, getDotMatrixAnchor);

  return collectDotMatrixMetricsFromAnchors(anchors) ?? null;
}

function applyDotsGradient(ctx: QrEmitContext, gradient: QrSvgEmitGradient) {
  const segments = collectDataModuleSegments(ctx);
  const metrics =
    segments.length > 0
      ? (getSegmentMetrics(segments) ?? getFallbackDotMatrixMetricsFromAnchors([]))
      : null;

  const coverRect: QrSvgEmitRegion = metrics
    ? {
        height: Math.max(metrics.cellSize, metrics.maxY - metrics.originY),
        width: Math.max(metrics.cellSize, metrics.maxX - metrics.originX),
        x: metrics.originX,
        y: metrics.originY,
      }
    : { height: ctx.numCells, width: ctx.numCells, x: 0, y: 0 };

  const gradientId = "dot-gradient-definition";
  appendEmitChild(
    ensureDefs(ctx.svg),
    emitQraftyGradientDef(gradient, {
      height: coverRect.height,
      id: gradientId,
      layer: "dot-gradient-definition",
      width: coverRect.width,
      x: coverRect.x,
      y: coverRect.y,
    }),
  );

  setEmitAttr(ctx.dataModules, "fill", `url('#${gradientId}')`);
  setEmitAttr(ctx.dataModules, "data-qr-layer", "dot-gradient-fill");
  removeEmitAttr(ctx.dataModules, "opacity");
}

function applyDotsPalette(
  ctx: QrEmitContext,
  paletteOption: NonNullable<QrSvgEmitExtensions["dotsPalette"]>,
) {
  const palette = getActiveDotsPalette(paletteOption.colors);

  if (palette.length === 0) {
    return;
  }

  const segments = collectDataModuleSegments(ctx);

  if (segments.length === 0) {
    return;
  }

  const shapes = segments.map(pathShapeLike);
  const anchors = collectDotMatrixAnchors(shapes, getDotMatrixAnchor);
  const metrics =
    collectDotMatrixMetricsFromAnchors(anchors) ?? getFallbackDotMatrixMetricsFromAnchors(anchors);
  const seed = hashDotPaletteString(paletteOption.seedData.trim());
  const groups = createDotPaletteShapeGroups(shapes, metrics, (shape, activeMetrics) => {
    const anchor = getDotMatrixAnchor(shape);
    return anchor ? resolveDotMatrixAnchorCoordinates(anchor, activeMetrics) : null;
  });
  const assignments = palette.map((color, paletteIndex) => ({
    color,
    paletteIndex,
    shapes: [] as string[],
  }));
  const groupAssignments = groups.map((group) => ({
    group,
    paletteIndex: getDotPaletteIndex(group, palette.length, seed),
  }));

  balanceDotPaletteAssignments(groupAssignments, palette.length, seed);

  for (const { group, paletteIndex } of groupAssignments) {
    assignments[paletteIndex]?.shapes.push(
      ...group.shapes.map((shape) => shape.getAttribute("d") ?? ""),
    );
  }

  const activeAssignments = assignments.filter((assignment) => assignment.shapes.length > 0);

  if (activeAssignments.length === 0) {
    return;
  }

  removeEmitNode(ctx.dataModules);

  const group = createEmitNode("g", [
    ["data-qr-layer", "dot-palette"],
    ["data-qr-palette-size", String(palette.length)],
  ]);

  for (const { color, paletteIndex, shapes: colorShapes } of activeAssignments) {
    const colorGroup = createEmitNode("g", [
      ["fill", color],
      ["data-qr-layer", "dot-palette-fill"],
      ["data-qr-palette-index", String(paletteIndex)],
    ]);
    const mergedPath = createEmitNode("path", [
      ["d", colorShapes.join(" ")],
      ["fill", color],
      ["fill-rule", "nonzero"],
      ["data-qr-palette-index", String(paletteIndex)],
    ]);
    appendEmitChild(colorGroup, mergedPath);
    appendEmitChild(group, colorGroup);
  }

  insertEmitBefore(ctx.svg, group, firstTopLevelImage(ctx.svg));
}

function applyDirectFill(target: EmitNode, gradientRef: string) {
  const fill = getEmitAttr(target, "fill");
  const stroke = getEmitAttr(target, "stroke");

  if (fill !== null && fill !== "none") {
    setEmitAttr(target, "fill", gradientRef);
  } else if (stroke !== null && stroke !== "none") {
    setEmitAttr(target, "stroke", gradientRef);
  } else if (fill === null && stroke === null) {
    setEmitAttr(target, "fill", gradientRef);
  }
}

function collectUnifiedTargets(ctx: QrEmitContext) {
  const customCornerDots = ctx.finderInner.filter(
    (node) => getEmitAttr(node, "data-qr-layer") === "custom-corner-dot",
  );

  return {
    finderTargets: [...ctx.finderOuter, ...ctx.finderInner, ...customCornerDots],
    moduleTargets: [ctx.dataModules],
  };
}

function getModuleCoverRect(ctx: QrEmitContext, margin: number): QrSvgEmitRegion | null {
  const moduleCount = ctx.numCells - margin * 2;

  if (moduleCount <= 0) {
    return null;
  }

  return { height: moduleCount, width: moduleCount, x: margin, y: margin };
}

function applyUnifiedGradient(ctx: QrEmitContext, gradient: QrSvgEmitGradient, margin: number) {
  const coverRect = getModuleCoverRect(ctx, margin);

  if (!coverRect) {
    return;
  }

  const gradientId = "unified-gradient-definition";
  appendEmitChild(
    ensureDefs(ctx.svg),
    emitUnifiedGradientDef(gradient, gradientId, "unified-gradient-definition", coverRect),
  );

  const gradientRef = `url(#${gradientId})`;
  const { finderTargets, moduleTargets } = collectUnifiedTargets(ctx);

  for (const target of [...moduleTargets, ...finderTargets]) {
    applyDirectFill(target, gradientRef);
    setEmitAttr(target, "data-qr-layer", "unified-gradient-fill");
    removeEmitAttr(target, "opacity");
  }

  const logo = ctx.image;

  if (logo) {
    const logoHref = getEmitAttr(logo, "href") ?? getEmitAttrNS(logo, XLINK_NS, "href");
    const logoX = getEmitAttr(logo, "x");
    const logoY = getEmitAttr(logo, "y");
    const logoWidth = getEmitAttr(logo, "width");
    const logoHeight = getEmitAttr(logo, "height");

    if (logoHref && logoX && logoY && logoWidth && logoHeight) {
      const maskId = `${gradientId}-logo-mask`;
      const logoFillId = `${gradientId}-logo-gradient-fill`;
      const mask = createEmitNode("mask", [
        ["id", maskId],
        ["maskUnits", "userSpaceOnUse"],
        ["maskContentUnits", "userSpaceOnUse"],
        ["data-qr-layer", "logo-unified-gradient"],
      ]);
      const maskImage = createEmitNode("image", [["href", logoHref]]);
      setEmitAttrNS(maskImage, XLINK_NS, "href", logoHref);
      setEmitAttr(maskImage, "x", logoX);
      setEmitAttr(maskImage, "y", logoY);
      setEmitAttr(maskImage, "width", logoWidth);
      setEmitAttr(maskImage, "height", logoHeight);

      const preserveAspectRatio = getEmitAttr(logo, "preserveAspectRatio");

      if (preserveAspectRatio) {
        setEmitAttr(maskImage, "preserveAspectRatio", preserveAspectRatio);
      }

      appendEmitChild(mask, maskImage);
      appendEmitChild(ensureDefs(ctx.svg), mask);

      const logoFill = createEmitNode("rect", [
        ["id", logoFillId],
        ["x", formatSvgNumber(coverRect.x)],
        ["y", formatSvgNumber(coverRect.y)],
        ["width", formatSvgNumber(coverRect.width)],
        ["height", formatSvgNumber(coverRect.height)],
        ["fill", gradientRef],
        ["mask", `url(#${maskId})`],
        ["data-qr-layer", "logo-unified-gradient-fill"],
      ]);

      const logoOpacity = getEmitAttr(logo, "opacity");

      if (logoOpacity) {
        setEmitAttr(logoFill, "opacity", logoOpacity);
      }

      insertEmitBefore(ctx.svg, logoFill, logo);
      setEmitAttr(logo, "data-qr-layer", "unified-gradient-source");
      setEmitAttr(logo, "opacity", "0");
    }
  }
}

function cloneShapeForClipPath(source: EmitNode) {
  const clone = cloneEmitNode(source, true);

  removeEmitAttr(clone, "id");
  removeEmitAttr(clone, "fill");
  removeEmitAttr(clone, "stroke");
  removeEmitAttr(clone, "opacity");
  removeEmitAttr(clone, "clip-path");
  removeEmitAttr(clone, "data-testid");
  removeEmitAttr(clone, "data-qr-layer");
  removeEmitAttr(clone, "style");

  setEmitAttr(clone, "clip-rule", getEmitAttr(source, "fill-rule") ?? "evenodd");

  return clone;
}

function shapeGeometryString(shape: DotMatrixShapeLike) {
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

function applyUnifiedImage(ctx: QrEmitContext, imageHref: string, margin: number) {
  const coverRect = getModuleCoverRect(ctx, margin);

  if (!coverRect) {
    return;
  }

  const imageId = "unified-image-definition";
  const { finderTargets, moduleTargets } = collectUnifiedTargets(ctx);
  const maskTargets = [...moduleTargets, ...finderTargets];

  if (maskTargets.length === 0) {
    return;
  }

  const clipPathId = `${imageId}-clip`;
  const moduleClipShapes: DotMatrixShapeLike[] = [];

  for (const target of moduleTargets) {
    const pathData = getEmitAttr(target, "d");

    if (pathData === null) {
      continue;
    }

    for (const segment of splitSvgPathData(pathData.replace(/[\t\n\r]/g, " "))) {
      if (segment.length > 0) {
        moduleClipShapes.push(pathShapeLike(segment));
      }
    }
  }

  const clipShapes = [...moduleClipShapes, ...finderTargets.map(nodeShapeLike)];
  const moduleClipCount = moduleClipShapes.length;
  const mergedPathData: string[] = [];
  const clonedShapes: EmitNode[] = [];

  for (const [index, shape] of clipShapes.entries()) {
    const pathData = index < moduleClipCount ? shapeGeometryString(shape) : null;

    if (pathData) {
      mergedPathData.push(pathData);
      continue;
    }

    clonedShapes.push(cloneShapeForClipPath(finderTargets[index - moduleClipCount]));
  }

  const clipPath = createEmitNode("clipPath", [
    ["id", clipPathId],
    ["clipPathUnits", "userSpaceOnUse"],
    ["data-qr-layer", "unified-image-clip"],
  ]);

  if (mergedPathData.length > 0) {
    appendEmitChild(
      clipPath,
      createEmitNode("path", [
        ["d", mergedPathData.join(" ")],
        ["clip-rule", "nonzero"],
      ]),
    );
  }

  for (const shape of clonedShapes) {
    appendEmitChild(clipPath, shape);
  }

  appendEmitChild(ensureDefs(ctx.svg), clipPath);

  const image = createEmitNode("image", [
    ["id", imageId],
    ["href", imageHref],
  ]);
  setEmitAttrNS(image, XLINK_NS, "href", imageHref);
  setEmitAttr(image, "x", formatSvgNumber(coverRect.x));
  setEmitAttr(image, "y", formatSvgNumber(coverRect.y));
  setEmitAttr(image, "width", formatSvgNumber(coverRect.width));
  setEmitAttr(image, "height", formatSvgNumber(coverRect.height));
  setEmitAttr(image, "preserveAspectRatio", "xMidYMid slice");
  setEmitAttr(image, "clip-path", `url(#${clipPathId})`);
  setEmitAttr(image, "data-qr-layer", imageId);

  for (const target of maskTargets) {
    setEmitAttr(target, "data-qr-layer", "unified-image-source");
    setEmitAttr(target, "opacity", "0");
  }

  const logo = ctx.image;

  if (logo) {
    insertEmitBefore(ctx.svg, image, logo);

    const logoHref = getEmitAttr(logo, "href") ?? getEmitAttrNS(logo, XLINK_NS, "href");
    const logoX = getEmitAttr(logo, "x");
    const logoY = getEmitAttr(logo, "y");
    const logoWidth = getEmitAttr(logo, "width");
    const logoHeight = getEmitAttr(logo, "height");

    if (logoHref && logoX && logoY && logoWidth && logoHeight) {
      const maskId = `${imageId}-logo-mask`;
      const logoFillId = `${imageId}-logo`;
      const mask = createEmitNode("mask", [
        ["id", maskId],
        ["maskUnits", "userSpaceOnUse"],
        ["maskContentUnits", "userSpaceOnUse"],
        ["data-qr-layer", "unified-image-logo-mask"],
      ]);
      const maskImage = createEmitNode("image", [["href", logoHref]]);
      setEmitAttrNS(maskImage, XLINK_NS, "href", logoHref);
      setEmitAttr(maskImage, "x", logoX);
      setEmitAttr(maskImage, "y", logoY);
      setEmitAttr(maskImage, "width", logoWidth);
      setEmitAttr(maskImage, "height", logoHeight);

      const preserveAspectRatio = getEmitAttr(logo, "preserveAspectRatio");

      if (preserveAspectRatio) {
        setEmitAttr(maskImage, "preserveAspectRatio", preserveAspectRatio);
      }

      appendEmitChild(mask, maskImage);
      appendEmitChild(ensureDefs(ctx.svg), mask);

      const logoFill = createEmitNode("image", [
        ["id", logoFillId],
        ["href", imageHref],
      ]);
      setEmitAttrNS(logoFill, XLINK_NS, "href", imageHref);
      setEmitAttr(logoFill, "x", formatSvgNumber(coverRect.x));
      setEmitAttr(logoFill, "y", formatSvgNumber(coverRect.y));
      setEmitAttr(logoFill, "width", formatSvgNumber(coverRect.width));
      setEmitAttr(logoFill, "height", formatSvgNumber(coverRect.height));
      setEmitAttr(logoFill, "preserveAspectRatio", "xMidYMid slice");
      setEmitAttr(logoFill, "mask", `url(#${maskId})`);
      setEmitAttr(logoFill, "data-qr-layer", "unified-image-logo-fill");

      const logoOpacity = getEmitAttr(logo, "opacity");

      if (logoOpacity) {
        setEmitAttr(logoFill, "opacity", logoOpacity);
      }

      insertEmitBefore(ctx.svg, logoFill, logo);
      setEmitAttr(logo, "data-qr-layer", "unified-image-source");
      setEmitAttr(logo, "opacity", "0");
    }
  } else {
    appendEmitChild(ctx.svg, image);
  }
}

function cornerIndexForPoint(point: { x: number; y: number }, regions: FinderCornerRegion[]) {
  for (const [index, region] of regions.entries()) {
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

  for (const [index, region] of regions.entries()) {
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

function cornerIndexForElement(element: EmitNode, regions: FinderCornerRegion[]) {
  const tagName = element.tagName.toLowerCase();

  if (tagName === "rect") {
    const x = Number.parseFloat(getEmitAttr(element, "x") ?? "");
    const y = Number.parseFloat(getEmitAttr(element, "y") ?? "");
    const width = Number.parseFloat(getEmitAttr(element, "width") ?? "0");
    const height = Number.parseFloat(getEmitAttr(element, "height") ?? "0");

    if (Number.isFinite(x) && Number.isFinite(y)) {
      return cornerIndexForPoint({ x: x + width / 2, y: y + height / 2 }, regions);
    }
  }

  if (tagName === "path") {
    const transform = getEmitAttr(element, "transform");

    if (transform) {
      const translateMatch = transform.match(/translate\(([-\d.]+)[,\s]+([-\d.]+)\)/);
      const x = Number.parseFloat(translateMatch?.[1] ?? "");
      const y = Number.parseFloat(translateMatch?.[2] ?? "");

      if (Number.isFinite(x) && Number.isFinite(y)) {
        return cornerIndexForPoint({ x: x + 1.5, y: y + 1.5 }, regions);
      }
    }

    const start = getSvgPathSubpathStartPoint(getEmitAttr(element, "d"));

    if (start) {
      return cornerIndexForPoint(start, regions);
    }
  }

  return 0;
}

function splitPatternIntoCornerElements(
  pattern: EmitNode,
  regions: FinderCornerRegion[],
  testId: string,
): EmitNode[] | null {
  if (pattern.tagName.toLowerCase() !== "path") {
    return regions.map(() => cloneEmitNode(pattern, true));
  }

  const groupedSubpaths = regions.map(() => [] as string[]);

  for (const subpath of splitSvgPathData(getEmitAttr(pattern, "d"))) {
    const start = getSvgPathSubpathStartPoint(subpath);

    if (!start) {
      continue;
    }

    const cornerIndex = cornerIndexForPoint(start, regions);
    groupedSubpaths[cornerIndex]?.push(subpath);
  }

  const elements: EmitNode[] = [];

  for (const subpaths of groupedSubpaths) {
    if (subpaths.length === 0) {
      return null;
    }

    const path = createEmitNode("path", [
      ["d", subpaths.join("")],
      ["data-testid", testId],
    ]);

    for (const attribute of ["class", "shape-rendering", "style", "transform", "fill-rule"]) {
      const value = getEmitAttr(pattern, attribute);

      if (value) {
        setEmitAttr(path, attribute, value);
      }
    }

    const layer = getEmitAttr(pattern, "data-qr-layer");

    if (layer) {
      setEmitAttr(path, "data-qr-layer", layer);
    }

    elements.push(path);
  }

  return elements;
}

function applyCornerGradient(
  ctx: QrEmitContext,
  kind: FinderCornerKind,
  gradient: QrSvgEmitGradient,
  margin: number,
) {
  const testId = kind === "outer" ? "finder-patterns-outer" : "finder-patterns-inner";
  const groupLayer = kind === "outer" ? "corner-frame-gradient" : "corner-dot-gradient";
  const gradientIdPrefix = kind === "outer" ? "corners-square-color-" : "corners-dot-color-";
  const patterns = kind === "outer" ? ctx.finderOuter : ctx.finderInner;

  if (patterns.length === 0) {
    return;
  }

  const cornerRegions = getFinderCornerRegions(margin, ctx.numCells, kind);

  if (cornerRegions.length === 0) {
    return;
  }

  let cornerElements: EmitNode[] | null = null;

  if (patterns.length === cornerRegions.length) {
    cornerElements = [...patterns]
      .sort(
        (left, right) =>
          cornerIndexForElement(left, cornerRegions) - cornerIndexForElement(right, cornerRegions),
      )
      .map((pattern) => cloneEmitNode(pattern, true));
  } else if (patterns.length === 1) {
    cornerElements = splitPatternIntoCornerElements(patterns[0], cornerRegions, testId);
  }

  if (!cornerElements || cornerElements.length !== cornerRegions.length) {
    return;
  }

  const insertReference = nextEmitSibling(patterns[0]) ?? firstTopLevelImage(ctx.svg);

  for (const pattern of patterns) {
    removeEmitNode(pattern);
  }

  if (kind === "inner") {
    ctx.finderInner = [];
  } else {
    ctx.finderOuter = [];
  }

  const group = createEmitNode("g", [["data-qr-layer", groupLayer]]);
  const defs = ensureDefs(ctx.svg);

  for (const [index, region] of cornerRegions.entries()) {
    const element = cornerElements[index];

    if (!element) {
      continue;
    }

    const gradientId = `${gradientIdPrefix}${Math.round(region.x)}-${Math.round(region.y)}-1`;

    // The old aligned-corner-gradient pass rewrote linear gradient endpoints
    // over the painted rect's region when the painted element was a <rect>
    // (only reachable for rect-style inner corners).
    const paintedIsRect = element.tagName.toLowerCase() === "rect";
    const alignedRegion =
      kind === "inner" && gradient.type === "linear" && paintedIsRect
        ? (getEmitElementRegion(element) ?? region)
        : region;

    appendEmitChild(
      defs,
      emitQraftyGradientDef(gradient, {
        height: alignedRegion.height,
        id: gradientId,
        layer: `${groupLayer}-definition`,
        width: alignedRegion.width,
        x: alignedRegion.x,
        y: alignedRegion.y,
      }),
    );

    const sourceLayer = getEmitAttr(element, "data-qr-layer");

    setEmitAttr(element, "fill", `url('#${gradientId}')`);
    setEmitAttr(element, "data-qr-layer", `${groupLayer}-fill`);
    removeEmitAttr(element, "opacity");

    if (sourceLayer === "custom-corner-dot") {
      setEmitAttr(element, "data-qr-layer", "custom-corner-dot");
    }

    appendEmitChild(group, element);
  }

  if (group.children.length === 0) {
    return;
  }

  if (insertReference && insertReference.parentNode === ctx.svg) {
    insertEmitBefore(ctx.svg, group, insertReference);
    return;
  }

  appendEmitChild(ctx.svg, group);
}

function applySvgRenderBounds(svg: EmitNode, metrics: QrSvgEmitBackgroundMetrics) {
  setEmitAttr(svg, "width", formatSvgNumber(metrics.outerWidth));
  setEmitAttr(svg, "height", formatSvgNumber(metrics.outerHeight));
  setEmitAttr(
    svg,
    "viewBox",
    `0 0 ${formatSvgNumber(metrics.outerWidth)} ${formatSvgNumber(metrics.outerHeight)}`,
  );
}

function isManagedBackgroundLayer(node: EmitNode) {
  return getEmitAttr(node, "data-qr-layer")?.startsWith("background-") ?? false;
}

function wrapQrContent(
  svg: EmitNode,
  translateX: number,
  translateY: number,
  contentScale: number,
): EmitNode | null {
  const hasScale = Math.abs(contentScale - 1) > 1e-9;
  const transform = hasScale
    ? `translate(${formatSvgNumber(translateX)} ${formatSvgNumber(translateY)}) scale(${formatSvgNumber(contentScale)})`
    : `translate(${formatSvgNumber(translateX)} ${formatSvgNumber(translateY)})`;
  const drawable = (child: EmitNode) =>
    child.tagName.toLowerCase() !== "defs" && !isManagedBackgroundLayer(child);

  if (!hasScale && translateX === 0 && translateY === 0) {
    return svg.children.find(drawable) ?? null;
  }

  const group = createEmitNode("g", [
    ["data-qr-layer", "qr-content"],
    ["transform", transform],
  ]);

  for (const child of [...svg.children]) {
    if (drawable(child)) {
      appendEmitChild(group, child);
    }
  }

  appendEmitChild(svg, group);

  return group;
}

function applyBackgroundLayerStroke(
  ctx: QrEmitContext,
  element: EmitNode,
  shapeOptions: QrSvgEmitShapeOptions,
  clipPathId: string,
  strokeLayerTag: string,
  strokeScale = 1,
) {
  if (shapeOptions.strokeWidth <= 0) {
    removeEmitAttr(element, "stroke");
    removeEmitAttr(element, "stroke-width");
    removeEmitAttr(element, "stroke-opacity");
    removeEmitAttr(element, "stroke-linejoin");
    return null;
  }

  const renderedStrokeWidth = shapeOptions.strokeWidth / Math.max(0.000001, strokeScale);

  setEmitAttr(element, "stroke", shapeOptions.strokeColor);
  setEmitAttr(element, "stroke-opacity", formatSvgNumber(shapeOptions.strokeOpacity / 100));
  setEmitAttr(element, "stroke-linejoin", "round");
  setEmitAttr(element, "stroke-width", formatSvgNumber(renderedStrokeWidth * 2));

  const clipPath = createEmitNode("clipPath", [
    ["id", clipPathId],
    ["data-qr-layer", strokeLayerTag],
  ]);
  const clipShape = cloneEmitNode(element, false);

  setEmitAttr(clipShape, "data-qr-layer", strokeLayerTag);
  removeEmitAttr(clipShape, "clip-path");
  removeEmitAttr(clipShape, "stroke");
  removeEmitAttr(clipShape, "stroke-width");
  removeEmitAttr(clipShape, "stroke-opacity");
  removeEmitAttr(clipShape, "stroke-linejoin");
  appendEmitChild(clipPath, clipShape);
  appendEmitChild(ensureDefs(ctx.svg), clipPath);

  const group = createEmitNode("g", [
    ["clip-path", `url(#${clipPathId})`],
    ["data-qr-layer", strokeLayerTag],
  ]);
  appendEmitChild(group, element);

  return group;
}

function emitBackgroundLayerFill(
  ctx: QrEmitContext,
  fill: { color: string; gradient?: QrSvgEmitGradient },
  width: number,
  height: number,
) {
  if (!fill.gradient) {
    return fill.color;
  }

  const gradientId = "background-shape-gradient";
  const gradient = emitQraftyGradientDef(fill.gradient, {
    height,
    id: gradientId,
    layer: "background-shape-gradient",
    width,
  });

  appendEmitChild(ensureDefs(ctx.svg), gradient);

  return `url('#${gradientId}')`;
}

function applyBackgroundShape(
  ctx: QrEmitContext,
  shape: NonNullable<QrSvgEmitExtensions["backgroundShape"]>,
  ext: QrSvgEmitExtensions,
) {
  const { metrics, shapeOptions, transform } = shape.resolve(ctx.numCells);
  const fill = emitBackgroundLayerFill(ctx, shape.fill, metrics.outerWidth, metrics.outerHeight);
  const path = createEmitNode("path", [
    ["data-qr-layer", "background-shape"],
    ["d", shape.path],
    ["transform", transform ?? ""],
    ["fill", fill],
  ]);

  applySvgRenderBounds(ctx.svg, metrics);
  const insertReference = wrapQrContent(
    ctx.svg,
    metrics.translateX,
    metrics.translateY,
    metrics.contentScale,
  );

  const strokedShape = applyBackgroundLayerStroke(
    ctx,
    path,
    shapeOptions,
    "clip-path-background-shape-stroke",
    "background-shape-stroke",
    Math.min(
      metrics.backingRegion.width / shape.viewBoxWidth,
      metrics.backingRegion.height / shape.viewBoxHeight,
    ),
  );

  insertEmitBefore(ctx.svg, strokedShape ?? path, insertReference);
}

function applyBackgroundSurface(
  ctx: QrEmitContext,
  surface: NonNullable<QrSvgEmitExtensions["backgroundSurface"]>,
  ext: QrSvgEmitExtensions,
) {
  const { metrics, shapeOptions } = surface.resolve(ctx.numCells);
  const region = metrics.backingRegion;
  const radius = (Math.min(region.width, region.height) / 2) * surface.round;
  const fill = emitBackgroundLayerFill(ctx, surface.fill, metrics.outerWidth, metrics.outerHeight);
  const backgroundRect = createEmitNode("rect");

  setEmitAttr(backgroundRect, "data-qr-layer", "background-surface");
  setEmitAttr(backgroundRect, "fill", fill);
  applySvgRenderBounds(ctx.svg, metrics);
  const insertReference = wrapQrContent(
    ctx.svg,
    metrics.translateX,
    metrics.translateY,
    metrics.contentScale,
  );

  setEmitAttr(backgroundRect, "x", formatSvgNumber(region.x));
  setEmitAttr(backgroundRect, "y", formatSvgNumber(region.y));
  setEmitAttr(backgroundRect, "width", formatSvgNumber(region.width));
  setEmitAttr(backgroundRect, "height", formatSvgNumber(region.height));
  setEmitAttr(backgroundRect, "rx", formatSvgNumber(radius));
  setEmitAttr(backgroundRect, "ry", formatSvgNumber(radius));

  const strokedSurface = applyBackgroundLayerStroke(
    ctx,
    backgroundRect,
    shapeOptions,
    "clip-path-background-surface-stroke",
    "background-surface-stroke",
  );

  insertEmitBefore(ctx.svg, strokedSurface ?? backgroundRect, insertReference);
}

export function applyQrEmitExtensions(ctx: QrEmitContext, ext: QrSvgEmitExtensions) {
  if (ext.customCornerDot) {
    applyCustomCornerDot(ctx, ext.customCornerDot);
  }

  if (ext.backgroundImage) {
    applyBackgroundImage(ctx, ext.backgroundImage, ext);
  }

  if (ext.dotsGradient) {
    applyDotsGradient(ctx, ext.dotsGradient);
  }

  if (ext.dotsPalette) {
    applyDotsPalette(ctx, ext.dotsPalette);
  }

  if (ext.unified) {
    if (ext.unified.kind === "image") {
      applyUnifiedImage(ctx, ext.unified.href, ext.margin);
    } else {
      applyUnifiedGradient(ctx, ext.unified.gradient, ext.margin);
    }
  } else if (ext.cornerGradients) {
    if (ext.cornerGradients.outer) {
      applyCornerGradient(ctx, "outer", ext.cornerGradients.outer, ext.margin);
    }

    if (ext.cornerGradients.inner) {
      applyCornerGradient(ctx, "inner", ext.cornerGradients.inner, ext.margin);
    }
  }

  if (ext.backgroundShape) {
    applyBackgroundShape(ctx, ext.backgroundShape, ext);
  } else if (ext.backgroundSurface) {
    applyBackgroundSurface(ctx, ext.backgroundSurface, ext);
  }
}
