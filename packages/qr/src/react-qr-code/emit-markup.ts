import type { CSSProperties } from "react";

import {
  CIRCUIT_BOARD_PAD_RADIUS,
  DEFAULT_LEVEL,
  DEFAULT_MINVERSION,
  DEFAULT_NUM_STAR_POINTS,
  DEFAULT_SIZE,
  ERROR_LEVEL_MAP,
  FINDER_PATTERN_INNER_RADIUSES,
  FINDER_PATTERN_INNER_SIZE,
  FINDER_PATTERN_OUTER_RADIUSES,
  FINDER_PATTERN_OUTER_ROTATIONS,
  FINDER_PATTERN_SIZE,
} from "../../vendor/react-qr-code/src/constants";
import qrcodegen from "../../vendor/react-qr-code/src/lib/qrcodegen";
import type {
  BackgroundSettings,
  FinderPatternOuterStyle,
  GradientSettings,
  ReactQRCodeProps,
} from "../../vendor/react-qr-code/src/types/lib";
import type { CalculatedImageSettings } from "../../vendor/react-qr-code/src/types/utils";
import {
  bottomLeftRounded,
  bottomRightRounded,
  bottomRounded,
  circle,
  circuitBoardPad,
  circuitBoardShouldDrawPad,
  dataModuleCanBeRandomSize,
  diamond,
  getModuleNeighbours,
  getRenderableDataModuleNeighbours,
  getScaleFactor,
  leaf,
  leftRounded,
  rect,
  rightRounded,
  roundedDataModule,
  square,
  topLeftRounded,
  topRightRounded,
  topRounded,
} from "../../vendor/react-qr-code/src/utils/data-modules";
import {
  finderPatternsInnerInOutPoint,
  finderPatternsInnerLeaf,
  isFinderPatternInnerModule,
} from "../../vendor/react-qr-code/src/utils/finder-patterns-inner";
import {
  finderPatternsOuterInOutPoint,
  finderPatternsOuterLeaf,
  finderPatternsOuterRoundedSquare,
  isFinderPatternOuterModule,
} from "../../vendor/react-qr-code/src/utils/finder-patterns-outer";
import {
  excavateModules,
  getImageSettings,
  getMarginSize,
} from "../../vendor/react-qr-code/src/utils/qr-code";
import {
  sanitizeDataModulesSettings,
  sanitizeFinderPatternInnerSettings,
  sanitizeFinderPatternOuterSettings,
} from "../../vendor/react-qr-code/src/utils/settings";
import {
  calculateGradientVectors,
  hashtag,
  heart,
  microchip,
  pinchedSquare,
  star,
} from "../../vendor/react-qr-code/src/utils/svg";

// Matches the useId() output React produces for the standalone SSR tree this
// emitter replaces (`renderToStaticMarkup(<ReactQRCode/>)` → `_R_0_`).
const BASE_SVG_ID_SUFFIX = "_R_0_";

const SVG_ATTR_NAMES: Record<string, string> = {
  crossOrigin: "crossorigin",
  shapeRendering: "shape-rendering",
  stopColor: "stop-color",
};

const escapeAttr = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

const camelToKebab = (name: string) => name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const styleToAttr = (style: CSSProperties) =>
  Object.entries(style)
    .map(([key, value]) => `${camelToKebab(key)}:${value}`)
    .join(";");

type Attr = [string, string | number | boolean | CSSProperties | undefined];

const renderAttrs = (attrs: Attr[]) =>
  attrs
    .flatMap(([name, value]) => {
      if (value === undefined || value === null || value === false) {
        return [];
      }
      if (name === "style" && typeof value === "object") {
        return [`style="${escapeAttr(styleToAttr(value))}"`];
      }
      const attrName = SVG_ATTR_NAMES[name] ?? name;
      return [`${attrName}="${escapeAttr(String(value))}"`];
    })
    .join(" ");

const el = (tag: string, attrs: Attr[], children = "") => {
  const rendered = renderAttrs(attrs);
  return `<${tag}${rendered ? ` ${rendered}` : ""}>${children}</${tag}>`;
};

const testid = (value: string): Attr => ["data-testid", value];

const emitGradientDef = (gradient: GradientSettings, gradientId: string) => {
  const vectors = calculateGradientVectors(gradient.rotation || 0);
  const stops = (gradient.stops ?? [])
    .map((stop) =>
      el("stop", [
        ["offset", stop.offset],
        ["stopColor", stop.color],
      ]),
    )
    .join("");

  if (gradient.type === "linear") {
    return el(
      "defs",
      [],
      el(
        "linearGradient",
        [
          ["id", gradientId],
          ["gradientUnits", "userSpaceOnUse"],
          ["x1", vectors.x1],
          ["y1", vectors.y1],
          ["x2", vectors.x2],
          ["y2", vectors.y2],
        ],
        stops,
      ),
    );
  }

  return el(
    "defs",
    [],
    el(
      "radialGradient",
      [
        ["id", gradientId],
        ["gradientUnits", "userSpaceOnUse"],
        ["cx", "50%"],
        ["cy", "50%"],
        ["r", "50%"],
      ],
      stops,
    ),
  );
};

const emitBackground = (
  background: BackgroundSettings | undefined,
  bgGradientId: string,
  numCells: number,
) => {
  if (!background) {
    return "";
  }

  if (typeof background === "string") {
    return el("path", [
      ["fill", background],
      ["d", `M0,0 h${numCells}v${numCells}H0z`],
      testid("background"),
    ]);
  }

  const defs = emitGradientDef(background, bgGradientId);
  return (
    defs +
    el("path", [
      ["fill", `url(#${bgGradientId})`],
      ["d", `M0,0 h${numCells}v${numCells}H0z`],
      testid("background"),
    ])
  );
};

type FinderPatternCoordinate = { x: number; y: number };

const OUTER_SHAPE_STYLES: FinderPatternOuterStyle[] = [
  "rounded-sm",
  "rounded",
  "rounded-lg",
  "circle",
  "square",
  "pinched-square",
];

const buildOuterShapePathOps = (
  style: FinderPatternOuterStyle,
  coordinates: FinderPatternCoordinate[],
) => {
  const ops: string[] = [];

  for (const { x, y } of coordinates) {
    if (style === "rounded-sm" || style === "rounded" || style === "rounded-lg") {
      ops.push(
        finderPatternsOuterRoundedSquare({
          x,
          y,
          radius: FINDER_PATTERN_OUTER_RADIUSES[style],
        }),
      );
    } else if (style === "circle") {
      ops.push(
        `M ${x + FINDER_PATTERN_SIZE / 2} ${y}` +
          `a ${FINDER_PATTERN_SIZE / 2} ${FINDER_PATTERN_SIZE / 2} 0 1 0 0.01 0z` +
          "z" +
          "m 0 1" +
          `a ${FINDER_PATTERN_SIZE / 2 - 1} ${FINDER_PATTERN_SIZE / 2 - 1} 0 1 1 -0.01 0` +
          "Z",
      );
    } else if (style === "pinched-square") {
      const PINCH_CONTROL_POINT = 0.5;
      const INNER_CONTROL_POINT = 1.25;
      ops.push(
        `M ${x} ${y}` +
          `Q ${x + PINCH_CONTROL_POINT} ${y + FINDER_PATTERN_SIZE / 2}, ${x} ${y + FINDER_PATTERN_SIZE}` +
          `Q ${x + FINDER_PATTERN_SIZE / 2} ${y + FINDER_PATTERN_SIZE - PINCH_CONTROL_POINT}, ${x + FINDER_PATTERN_SIZE} ${y + FINDER_PATTERN_SIZE}` +
          `Q ${x + FINDER_PATTERN_SIZE - PINCH_CONTROL_POINT} ${y + FINDER_PATTERN_SIZE / 2}, ${x + FINDER_PATTERN_SIZE} ${y}` +
          `Q ${x + FINDER_PATTERN_SIZE / 2} ${y + PINCH_CONTROL_POINT}, ${x} ${y}` +
          "z" +
          `M ${x + 1} ${y + 1}` +
          `Q ${x + FINDER_PATTERN_SIZE / 2} ${y + INNER_CONTROL_POINT}, ${x + FINDER_PATTERN_SIZE - 1} ${y + 1}` +
          `Q ${x + FINDER_PATTERN_SIZE - INNER_CONTROL_POINT} ${y + FINDER_PATTERN_SIZE / 2}, ${x + FINDER_PATTERN_SIZE - 1} ${y + FINDER_PATTERN_SIZE - 1}` +
          `Q ${x + FINDER_PATTERN_SIZE / 2} ${y + FINDER_PATTERN_SIZE - INNER_CONTROL_POINT}, ${x + 1} ${y + FINDER_PATTERN_SIZE - 1}` +
          `Q ${x + INNER_CONTROL_POINT} ${y + FINDER_PATTERN_SIZE / 2}, ${x + 1} ${y + 1}` +
          "z",
      );
    } else {
      ops.push(
        `M ${x} ${y}` +
          `v ${FINDER_PATTERN_SIZE}` +
          `h ${FINDER_PATTERN_SIZE}` +
          `v ${-FINDER_PATTERN_SIZE}` +
          "z" +
          `M ${x + 1} ${y + 1}` +
          `h ${FINDER_PATTERN_SIZE - 2}` +
          `v ${FINDER_PATTERN_SIZE - 2}` +
          `h ${-FINDER_PATTERN_SIZE + 2}` +
          "z",
      );
    }
  }

  return ops;
};

const POINT_OUTER_STYLES = new Set([
  "inpoint-sm",
  "inpoint",
  "inpoint-lg",
  "outpoint-sm",
  "outpoint",
  "outpoint-lg",
  "leaf-sm",
  "leaf",
  "leaf-lg",
]);

const rotateStyle = (rotation: number): CSSProperties => ({
  transform: `rotate(${rotation}deg)`,
  transformOrigin: "center",
  transformBox: "fill-box",
});

const emitOuterPointPatterns = (
  style: keyof typeof FINDER_PATTERN_OUTER_ROTATIONS,
  coordinates: FinderPatternCoordinate[],
  fill: string,
) => {
  const pathFn = style.startsWith("leaf") ? finderPatternsOuterLeaf : finderPatternsOuterInOutPoint;

  return coordinates
    .map((coordinate, index) => {
      const rotation = FINDER_PATTERN_OUTER_ROTATIONS[style][index];
      const path = pathFn({
        x: coordinate.x,
        y: coordinate.y,
        radius: FINDER_PATTERN_OUTER_RADIUSES[style],
      });
      return el("path", [
        ["fill", fill],
        ["d", path],
        ["style", rotateStyle(rotation)],
        testid("finder-patterns-outer"),
      ]);
    })
    .join("");
};

const emitFinderPatternsOuter = ({
  modules,
  margin,
  settings,
  gradient,
  gradientId,
}: {
  modules: boolean[][];
  margin: number;
  settings?: ReactQRCodeProps["finderPatternOuterSettings"];
  gradient?: GradientSettings;
  gradientId: string;
}) => {
  const { style, color } = sanitizeFinderPatternOuterSettings(settings);
  const fill = gradient ? `url(#${gradientId})` : color;

  const coordinates = [
    { x: margin, y: margin },
    { x: modules.length + margin - FINDER_PATTERN_SIZE, y: margin },
    { x: margin, y: modules.length + margin - FINDER_PATTERN_SIZE },
  ];

  if (OUTER_SHAPE_STYLES.includes(style)) {
    return el("path", [
      ["fill", fill],
      ["d", buildOuterShapePathOps(style, coordinates).join("")],
      testid("finder-patterns-outer"),
    ]);
  }

  if (POINT_OUTER_STYLES.has(style)) {
    return emitOuterPointPatterns(
      style as keyof typeof FINDER_PATTERN_OUTER_ROTATIONS,
      coordinates,
      fill,
    );
  }

  return "";
};

const emitFinderPatternsInner = ({
  modules,
  margin,
  settings,
  gradient,
  gradientId,
}: {
  modules: boolean[][];
  margin: number;
  settings?: ReactQRCodeProps["finderPatternInnerSettings"];
  gradient?: GradientSettings;
  gradientId: string;
}) => {
  const { color, style } = sanitizeFinderPatternInnerSettings(settings);
  const fill = gradient ? `url(#${gradientId})` : color;

  const coordinates = [
    { x: margin + 2, y: margin + 2 },
    { x: modules.length + margin - FINDER_PATTERN_SIZE + 2, y: margin + 2 },
    { x: margin + 2, y: modules.length + margin - FINDER_PATTERN_SIZE + 2 },
  ];

  if (
    style === "rounded-sm" ||
    style === "rounded" ||
    style === "rounded-lg" ||
    style === "circle" ||
    style === "square"
  ) {
    return coordinates
      .map(({ x, y }) =>
        el("rect", [
          ["x", x],
          ["y", y],
          ["width", FINDER_PATTERN_INNER_SIZE],
          ["height", FINDER_PATTERN_INNER_SIZE],
          ["fill", fill],
          ["rx", FINDER_PATTERN_INNER_RADIUSES[style]],
          testid("finder-patterns-inner"),
        ]),
      )
      .join("");
  }

  if (style === "pinched-square") {
    return coordinates
      .map(({ x, y }) =>
        el("path", [
          ["fill", fill],
          ["d", pinchedSquare(x, y, FINDER_PATTERN_INNER_SIZE, 0.25)],
          testid("finder-patterns-inner"),
        ]),
      )
      .join("");
  }

  if (style === "diamond") {
    const sizeDiff = Math.sqrt(1.5);
    const size = FINDER_PATTERN_INNER_SIZE / sizeDiff;
    const posDiff = size - size / sizeDiff;
    return coordinates
      .map(({ x, y }) =>
        el("rect", [
          ["x", x + posDiff / 2],
          ["y", y + posDiff / 2],
          ["width", size],
          ["height", size],
          ["fill", fill],
          ["style", rotateStyle(45)],
          testid("finder-patterns-inner"),
        ]),
      )
      .join("");
  }

  if (POINT_OUTER_STYLES.has(style)) {
    const pointStyle = style as keyof typeof FINDER_PATTERN_OUTER_ROTATIONS;
    const pathFn = style.startsWith("leaf")
      ? finderPatternsInnerLeaf
      : finderPatternsInnerInOutPoint;
    return coordinates
      .map((coordinate, index) => {
        const rotation = FINDER_PATTERN_OUTER_ROTATIONS[pointStyle][index];
        const path = pathFn({
          x: coordinate.x,
          y: coordinate.y,
          radius: FINDER_PATTERN_INNER_RADIUSES[pointStyle],
        });
        return el("path", [
          ["fill", fill],
          ["d", path],
          ["style", rotateStyle(rotation)],
          testid("finder-patterns-inner"),
        ]);
      })
      .join("");
  }

  if (style === "heart") {
    return coordinates
      .map(({ x, y }) =>
        el("path", [
          ["fill", fill],
          ["d", heart(x, y, FINDER_PATTERN_INNER_SIZE)],
          testid("finder-patterns-inner"),
        ]),
      )
      .join("");
  }

  if (style === "star") {
    return coordinates
      .map(({ x, y }) => {
        const cx = x + FINDER_PATTERN_INNER_SIZE / 2;
        const cy = y + FINDER_PATTERN_INNER_SIZE / 2;
        const path = star(cx, cy, FINDER_PATTERN_INNER_SIZE * 1.2, DEFAULT_NUM_STAR_POINTS);
        return el("path", [["fill", fill], ["d", path], testid("finder-patterns-inner")]);
      })
      .join("");
  }

  if (style === "microchip") {
    return coordinates
      .map(({ x, y }) =>
        el("path", [
          ["fill", fill],
          ["d", microchip(x, y, FINDER_PATTERN_INNER_SIZE)],
          testid("finder-patterns-inner"),
        ]),
      )
      .join("");
  }

  if (style === "hashtag") {
    return coordinates
      .map(({ x, y }) =>
        el("path", [
          ["fill", fill],
          ["d", hashtag(x - 0.25, y - 0.25, 3.5)],
          testid("finder-patterns-inner"),
        ]),
      )
      .join("");
  }

  return "";
};

const emitDataModules = ({
  modules,
  margin,
  settings,
  gradient,
  gradientId,
}: {
  modules: boolean[][];
  margin: number;
  settings?: ReactQRCodeProps["dataModulesSettings"];
  gradient?: GradientSettings;
  gradientId: string;
}) => {
  const { color, style, randomSize, size, lineWidth } = sanitizeDataModulesSettings(settings);

  const ops: string[] = [];
  const numCells = modules.length;
  const isRandom = dataModuleCanBeRandomSize(style) && randomSize;

  modules.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (
        isFinderPatternOuterModule({ x, y, numCells }) ||
        isFinderPatternInnerModule({ x, y, numCells })
      ) {
        return;
      }

      const scale = getScaleFactor(style, isRandom, size);
      const moduleSize = 1 * scale;
      const posOffset = (1 - 1 * scale) / 2;
      const baseX = x + margin;
      const baseY = y + margin;
      const xPos = baseX + posOffset;
      const yPos = baseY + posOffset;
      const lwOffset = (1 - lineWidth) / 2;

      if (cell) {
        if (style === "circuit-board") {
          const cx = baseX + 0.5;
          const cy = baseY + 0.5;
          const traceHalf = lineWidth / 2;
          const traceLength = 1 + lineWidth;
          const neighbours = getRenderableDataModuleNeighbours(x, y, modules, numCells);
          const { right, bottom, count } = neighbours;

          if (right) {
            ops.push(rect(cx - traceHalf, cy - traceHalf, traceLength, lineWidth));
          }
          if (bottom) {
            ops.push(rect(cx - traceHalf, cy - traceHalf, lineWidth, traceLength));
          }
          if (count === 0) {
            const isolatedSize = 0.75;
            const isolatedOffset = (1 - isolatedSize) / 2;
            ops.push(square(baseX + isolatedOffset, baseY + isolatedOffset, isolatedSize));
          } else if (circuitBoardShouldDrawPad({ ...neighbours, count })) {
            ops.push(circuitBoardPad(cx, cy, CIRCUIT_BOARD_PAD_RADIUS));
          }
        } else if (style === "square" || style === "square-sm") {
          ops.push(square(xPos, yPos, moduleSize));
        } else if (style === "pinched-square") {
          ops.push(pinchedSquare(xPos, yPos, moduleSize, 0.25));
        } else if (style === "circle") {
          ops.push(circle(xPos, yPos, moduleSize));
        } else if (style === "diamond") {
          ops.push(diamond(xPos, yPos, moduleSize));
        } else if (style === "star") {
          ops.push(
            star(
              xPos + moduleSize / 2,
              yPos + moduleSize / 2,
              moduleSize * 1.1,
              DEFAULT_NUM_STAR_POINTS,
            ),
          );
        } else if (style === "heart") {
          ops.push(heart(xPos, yPos, moduleSize));
        } else if (style === "hashtag") {
          ops.push(hashtag(xPos, yPos, moduleSize));
        } else if (style === "rounded") {
          const neighbours = getModuleNeighbours(x, y, modules);
          const { left, right, top, bottom, count } = neighbours;

          if (lineWidth === 1) {
            if (count === 0) {
              ops.push(circle(xPos, yPos, 1));
            } else if (count > 2 || (left && right) || (top && bottom)) {
              ops.push(square(xPos, yPos, 1));
            } else if (count === 2) {
              if (left && top) {
                ops.push(bottomRightRounded(xPos, yPos));
              } else if (top && right) {
                ops.push(bottomLeftRounded(xPos, yPos));
              } else if (right && bottom) {
                ops.push(topLeftRounded(xPos, yPos));
              } else {
                ops.push(topRightRounded(xPos, yPos));
              }
            } else {
              if (top) {
                ops.push(bottomRounded(xPos, yPos));
              } else if (right) {
                ops.push(leftRounded(xPos, yPos));
              } else if (bottom) {
                ops.push(topRounded(xPos, yPos));
              } else {
                ops.push(rightRounded(xPos, yPos));
              }
            }
          } else {
            ops.push(roundedDataModule(baseX, baseY, lineWidth, neighbours));
          }
        } else if (style === "leaf") {
          const { left, right, top, bottom, count } = getModuleNeighbours(x, y, modules);

          if (count === 0) {
            ops.push(leaf(xPos, yPos, moduleSize));
          } else if (!left && !top) {
            ops.push(topLeftRounded(xPos, yPos));
            return;
          } else if (!right && !bottom) {
            ops.push(bottomRightRounded(xPos, yPos));
          } else {
            ops.push(square(xPos, yPos, 1));
          }
        } else if (style === "vertical-line") {
          const { left, right, top, bottom, count } = getModuleNeighbours(x, y, modules);

          if (count === 0 || (left && !(top || bottom)) || (right && !(top || bottom))) {
            ops.push(circle(baseX + lwOffset, baseY + lwOffset, lineWidth));
          } else if (top && bottom) {
            ops.push(rect(baseX + lwOffset, baseY, lineWidth, 1));
          } else if (top && !bottom) {
            ops.push(bottomRounded(baseX, baseY, lineWidth));
          } else if (bottom && !top) {
            ops.push(topRounded(baseX, baseY, lineWidth));
          }
        } else if (style === "horizontal-line") {
          const { left, right, top, bottom, count } = getModuleNeighbours(x, y, modules);

          if (count === 0 || (top && !(left || right)) || (bottom && !(left || right))) {
            ops.push(circle(baseX + lwOffset, baseY + lwOffset, lineWidth));
          } else if (left && right) {
            ops.push(rect(baseX, baseY + lwOffset, 1, lineWidth));
          } else if (left && !right) {
            ops.push(rightRounded(baseX, baseY, lineWidth));
          } else if (right && !left) {
            ops.push(leftRounded(baseX, baseY, lineWidth));
          }
        }
      }
    });
  });

  const paint = gradient ? `url(#${gradientId})` : color;

  return el("path", [
    ["fill", paint],
    ["d", ops.join("")],
    ["shapeRendering", style === "square" ? "crispEdges" : "geometricPrecision"],
    testid("data-modules"),
  ]);
};

const emitImage = (
  imageSettings: NonNullable<ReactQRCodeProps["imageSettings"]>,
  calculated: CalculatedImageSettings,
  margin: number,
) =>
  el("image", [
    ["href", imageSettings.src],
    ["height", calculated.h],
    ["width", calculated.w],
    ["x", calculated.x + margin],
    ["y", calculated.y + margin],
    ["preserveAspectRatio", "none"],
    ["opacity", calculated.opacity],
    ["crossOrigin", calculated.crossOrigin],
  ]);

export const emitReactQrCodeMarkup = (props: ReactQRCodeProps): string => {
  const {
    value,
    size = DEFAULT_SIZE,
    level = DEFAULT_LEVEL,
    background,
    gradient,
    minVersion = DEFAULT_MINVERSION,
    boostLevel,
    marginSize,
    finderPatternOuterSettings,
    finderPatternInnerSettings,
    dataModulesSettings,
    imageSettings,
    svgProps,
  } = props;

  const values = Array.isArray(value) ? value : [value];
  const segments = values.reduce<qrcodegen.QrSegment[]>((accum, v) => {
    accum.push(...qrcodegen.QrSegment.makeSegments(v));
    return accum;
  }, []);
  const qrcode = qrcodegen.QrCode.encodeSegments(
    segments,
    ERROR_LEVEL_MAP[level],
    minVersion,
    undefined,
    undefined,
    boostLevel,
  );

  const cells = qrcode.getModules() as boolean[][];
  const margin = getMarginSize(marginSize);
  const numCells = cells.length + margin * 2;
  const calculatedImageSettings = getImageSettings(cells, size, margin, imageSettings);

  const gradientId = `react-qr-code-gradient-${BASE_SVG_ID_SUFFIX}`;
  const bgGradientId = `react-qr-code-bg-gradient-${BASE_SVG_ID_SUFFIX}`;

  let modules = cells;
  let image = "";
  if (imageSettings != null && calculatedImageSettings != null) {
    if (calculatedImageSettings.excavation != null) {
      modules = excavateModules(cells, calculatedImageSettings.excavation);
    }
    image = emitImage(imageSettings, calculatedImageSettings, margin);
  }

  const elementProps = { modules, margin, gradient, gradientId };

  const svgAttrs: Attr[] = [
    ["height", size],
    ["width", size],
    ["viewBox", `0 0 ${numCells} ${numCells}`],
    ["role", "img"],
    ["aria-label", (svgProps?.["aria-label"] as string | undefined) || "QR Code"],
  ];
  for (const [key, attrValue] of Object.entries(svgProps ?? {})) {
    if (key === "aria-label") {
      continue;
    }
    svgAttrs.push([key, attrValue as Attr[1]]);
  }

  const children =
    (gradient ? emitGradientDef(gradient, gradientId) : "") +
    emitBackground(background, bgGradientId, numCells) +
    emitFinderPatternsOuter({ ...elementProps, settings: finderPatternOuterSettings }) +
    emitFinderPatternsInner({ ...elementProps, settings: finderPatternInnerSettings }) +
    emitDataModules({ ...elementProps, settings: dataModulesSettings }) +
    image;

  return el("svg", svgAttrs, children);
};
