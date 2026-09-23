import {
  DEFAULT_DOT_MATRIX_ANIMATION,
  QR_DOT_MATRIX_ANIMATION_SPEED_MAX,
  QR_DOT_MATRIX_ANIMATION_SPEED_MIN,
  type QrDotMatrixAnimationOptions,
  type QraftyState,
} from "@/features/qr/model/state";
import { resolveMotionColors } from "@/features/qr/motion/motion-color";
import { type QrAnimationRenderMode, type QrSvgExtensionOptions } from "./types";
import { SVG_NS, formatSvgNumber } from "./svg-dom-utils";
import {
  DEFAULT_DOT_MATRIX_TILE_SIZE,
  type DotMatrixMetrics,
  type DotMatrixTrack,
  type DotMatrixCell,
  getDotMatrixAnchor,
  type DotMatrixSquareLoaderId,
} from "./dot-matrix-model";
import { rowMajorIndex } from "./dot-matrix-cell-math";
import { getDotMatrixDensitySpeedFactor } from "./dot-matrix-loaders";

export function getDotMatrixAnimationDuration(animation: QrDotMatrixAnimationOptions) {
  const speed = Math.min(
    QR_DOT_MATRIX_ANIMATION_SPEED_MAX,
    Math.max(QR_DOT_MATRIX_ANIMATION_SPEED_MIN, animation.speed),
  );
  const densityFactor = getDotMatrixDensitySpeedFactor(animation);

  return formatSvgNumber(Math.max(0.55, (4.7 - speed * 0.31) / densityFactor));
}

export function getDotMatrixBaseOpacity(animation: QrDotMatrixAnimationOptions) {
  return animation.opacityBase;
}

export function getDotMatrixOverlayScale(animation: QrDotMatrixAnimationOptions) {
  return Math.max(DEFAULT_DOT_MATRIX_ANIMATION.overlayScale, animation.overlayScale);
}

export function getDotMatrixTrackStyle(track: DotMatrixTrack) {
  const style = [
    `--qr-dot-track:${track.index}`,
    `--qr-dot-duration-ms:${track.durationMs}`,
    `--qr-dot-speed-multiplier:${formatSvgNumber(track.speedMultiplier)}`,
    `--qr-dot-easing:${track.timingFunction}`,
    `--qr-dot-keyframes-name:${track.keyframes}`,
    ...Object.entries(track.styleVars).map(([key, value]) => `${key}:${value}`),
  ];

  if (track.opacity !== undefined) {
    style.push(`opacity:${formatSvgNumber(track.opacity)}`);
  }

  return style.join(";");
}

export function getDotMatrixCoverRect(
  svg: SVGElement,
  options: QrSvgExtensionOptions,
  metrics: DotMatrixMetrics,
) {
  const width =
    Number(options.width) ||
    Number(svg.getAttribute("width")) ||
    Math.max(metrics.maxX, metrics.originX + metrics.cellSize);
  const height =
    Number(options.height) ||
    Number(svg.getAttribute("height")) ||
    Math.max(metrics.maxY, metrics.originY + metrics.cellSize);

  return {
    height,
    width,
    x: 0,
    y: 0,
  };
}

export function applyDotMatrixOverlayScale(
  shape: SVGElement,
  metrics: DotMatrixMetrics,
  overlayScale: number,
) {
  const scale = overlayScale / 100;

  if (!Number.isFinite(scale) || Math.abs(scale - 1) < 0.001) {
    return;
  }

  const anchor = getDotMatrixAnchor(shape);

  if (!anchor) {
    return;
  }

  const size = anchor.size ?? metrics.cellSize;
  const centerX = anchor.x + size / 2;
  const centerY = anchor.y + size / 2;
  const existingTransform = shape.getAttribute("transform");
  const scaleTransform = [
    `translate(${formatSvgNumber(centerX)} ${formatSvgNumber(centerY)})`,
    `scale(${formatSvgNumber(scale)})`,
    `translate(${formatSvgNumber(-centerX)} ${formatSvgNumber(-centerY)})`,
  ].join(" ");

  shape.setAttribute(
    "transform",
    existingTransform ? `${existingTransform} ${scaleTransform}` : scaleTransform,
  );
}

export function resolveDotMatrixColors(state: QraftyState) {
  const animation = state.dotMatrixAnimation;

  return resolveMotionColors(animation, state.dataModulesSettings.color);
}

export function createGeneratedDotMatrixKeyframes(
  name: string,
  upstreamLoader: DotMatrixSquareLoaderId,
  region: string,
) {
  const [col = 0, row = 0] = region.split(" ")[0]?.split(",").map(Number) ?? [];
  const matrixSize = getMatrixSizeFromRegion(region);
  const samples = getGeneratedDotMatrixOpacitySamples(upstreamLoader, {
    col,
    index: rowMajorIndex(row, col, matrixSize),
    matrixSize,
    row,
  });

  return createDotMatrixOpacityKeyframes(name, samples);
}

export function getMatrixSizeFromRegion(region: string) {
  return region
    .split(" ")
    .flatMap((coordinate) => coordinate.split(",").map(Number))
    .filter(Number.isFinite)
    .reduce((max, value) => Math.max(max, value + 1), DEFAULT_DOT_MATRIX_TILE_SIZE);
}

export function getGeneratedDotMatrixOpacitySamples(
  _upstreamLoader: DotMatrixSquareLoaderId,
  _cell: DotMatrixCell,
) {
  return [0.08, 1, 0.32, 0.08];
}

export function createDotMatrixOpacityKeyframes(name: string, samples: number[]) {
  const last = Math.max(1, samples.length - 1);
  const frames = samples.map((opacity, index) => {
    const percent = formatSvgNumber((index / last) * 100);

    const anchor = getDotMatrixAnchorValue(opacity);

    return `${percent}% { opacity: var(--qr-dot-matrix-opacity-${anchor}); fill: var(--qr-dot-matrix-color-${anchor}); }`;
  });

  return `@keyframes ${name} { ${frames.join(" ")} }`;
}

export function getDotMatrixAnchorValue(sourceOpacity: number) {
  if (!Number.isFinite(sourceOpacity) || sourceOpacity <= 0.08) {
    return "base";
  }

  if (sourceOpacity >= 0.94) {
    return "peak";
  }

  return "peak";
}

export const SOFT_ECHO_WAVE_KEYFRAME_BODY =
  "0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 20% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 82%, var(--qr-dot-matrix-color-peak)); } 32% { opacity: var(--qr-dot-matrix-opacity-peak); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 28%, var(--qr-dot-matrix-color-peak)); } 45% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 58%, var(--qr-dot-matrix-color-peak)); } 58% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 72%, var(--qr-dot-matrix-color-peak)); } 72% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 88%, var(--qr-dot-matrix-color-peak)); }";

export const SOFT_COLOR_WAVE_KEYFRAME_BODY =
  "0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 24% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 84%, var(--qr-dot-matrix-color-peak)); } 38% { opacity: var(--qr-dot-matrix-opacity-peak); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 32%, var(--qr-dot-matrix-color-peak)); } 54% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 62%, var(--qr-dot-matrix-color-peak)); } 68% { opacity: var(--qr-dot-matrix-opacity-base); fill: color-mix(in srgb, var(--qr-dot-matrix-color-base) 78%, var(--qr-dot-matrix-color-peak)); }";

export function createDotMatrixAnimationStyle(document: Document, tracks: DotMatrixTrack[]) {
  const style = document.createElementNS(SVG_NS, "style");
  const generatedKeyframes = tracks
    .flatMap((track) =>
      track.state === "active" && track.keyframes.includes("-dotm-square-")
        ? [createGeneratedDotMatrixKeyframes(track.keyframes, track.upstreamLoader, track.region)]
        : [],
    )
    .join("\n");

  style.setAttribute("data-qr-layer", "dot-matrix-animation");
  style.textContent = `
.qr-dot-matrix-layer {
  pointer-events: none;
}
.qr-dot-matrix-track {
  animation-duration: calc(var(--qr-dot-duration-ms, 2200) * 1ms);
  animation-iteration-count: infinite;
  animation-name: var(--qr-dot-keyframes-name);
  animation-timing-function: var(--qr-dot-easing, ease-in-out);
  fill: var(--qr-dot-matrix-color-base);
  filter: drop-shadow(0 0 3px var(--qr-dot-matrix-color));
  opacity: var(--qr-dot-matrix-opacity-base);
  transform-box: fill-box;
  transform-origin: center;
}
.qr-dot-matrix-track-quiet {
  animation: none !important;
  opacity: var(--qr-dot-matrix-opacity-base);
  filter: none;
}
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-diagonal-alt-sweep"] { animation-delay: calc((var(--dmx-path, 0) + var(--dmx-diagonal-parity, 0) * .08) * -1.5s * var(--qr-dot-speed-multiplier, 1)); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-square6-col-snake"] { animation-delay: calc(var(--dmx-col-pos, 0) * -110ms * var(--qr-dot-speed-multiplier, 1)); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-radial-expand"] { animation-delay: calc(var(--dmx-radial-radius, 0) * -120ms * var(--qr-dot-speed-multiplier, 1)); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-diamond-expand"] { animation-delay: calc(var(--dmx-diamond-progress, 0) * -630ms * var(--qr-dot-speed-multiplier, 1)); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-heart-expand"] { animation-delay: calc(var(--dmx-heart-progress, 0) * -630ms * var(--qr-dot-speed-multiplier, 1)); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-star-expand"] { animation-delay: calc(var(--dmx-star-progress, 0) * -630ms * var(--qr-dot-speed-multiplier, 1)); }
.qr-dot-matrix-track[data-qr-dot-upstream-class="dmx-chevron-sweep"] { animation-delay: calc(var(--dmx-chevron-distance, 0) * -110ms * var(--qr-dot-speed-multiplier, 1)); }
@keyframes qr-dot-loader-legacy { 0%, 100% { opacity: var(--qr-dot-matrix-opacity-base); fill: var(--qr-dot-matrix-color-base); } 50% { opacity: var(--qr-dot-matrix-opacity-peak); fill: var(--qr-dot-matrix-color-peak); } }
@keyframes dmx-diagonal-alt-sweep { ${SOFT_COLOR_WAVE_KEYFRAME_BODY} }
@keyframes dmx-square6-col-snake { ${SOFT_COLOR_WAVE_KEYFRAME_BODY} }
@keyframes dmx-radial-expand { ${SOFT_ECHO_WAVE_KEYFRAME_BODY} }
@keyframes dmx-diamond-expand { ${SOFT_ECHO_WAVE_KEYFRAME_BODY} }
@keyframes dmx-heart-expand { ${SOFT_ECHO_WAVE_KEYFRAME_BODY} }
@keyframes dmx-star-expand { ${SOFT_ECHO_WAVE_KEYFRAME_BODY} }
@keyframes dmx-chevron-sweep { ${SOFT_COLOR_WAVE_KEYFRAME_BODY} }
${generatedKeyframes}
@media (prefers-reduced-motion: reduce) {
  .qr-dot-matrix-layer {
    display: none;
  }
  .qr-dot-matrix-track {
    animation: none;
    opacity: 0;
  }
}`;

  return style;
}

export function shouldApplyDotMatrixAnimation(state: QraftyState, mode: QrAnimationRenderMode) {
  if (!state.dotMatrixAnimation.enabled || state.type !== "svg") {
    return false;
  }

  if (!state.dotMatrixAnimation.animated) {
    return false;
  }

  if (mode === "preview") {
    return true;
  }

  if (mode === "export") {
    return state.dotMatrixAnimation.exportAnimatedSvg;
  }

  return false;
}
