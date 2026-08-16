import {
  DEFAULT_DOT_MATRIX_ANIMATION,
  MOTION_COLOR_SWATCHES,
  type QrDotMatrixAnimationOptions,
} from "@/features/qr-code/model/state";

export type MotionColorPair = {
  base: string;
  accent: string;
};

export const MOTION_OPACITY_ANCHORS = {
  base: DEFAULT_DOT_MATRIX_ANIMATION.opacityBase,
  mid: DEFAULT_DOT_MATRIX_ANIMATION.opacityBase,
  peak: DEFAULT_DOT_MATRIX_ANIMATION.opacityPeak,
} as const;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function componentToHex(value: number) {
  return Math.round(clamp01(value / 255) * 255)
    .toString(16)
    .padStart(2, "0");
}

export function motionColorRgbHex(input: string, fallback = "#000000") {
  const parsed = parseMotionColorChannel(input);
  if (!parsed) {
    return fallback;
  }

  return `#${componentToHex(parsed.r)}${componentToHex(parsed.g)}${componentToHex(parsed.b)}`;
}

function parseMotionColorChannel(input: string) {
  const value = input.trim();
  if (!value) {
    return null;
  }

  if (value.startsWith("#")) {
    const hex = value.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b, a: 1 };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if ([r, g, b].some(Number.isNaN)) {
        return null;
      }
      return { r, g, b, a: 1 };
    }
    if (hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      const a = parseInt(hex.slice(6, 8), 16) / 255;
      if ([r, g, b, a].some(Number.isNaN)) {
        return null;
      }
      return { r, g, b, a: clamp01(a) };
    }
    return null;
  }

  const rgbMatch = value.match(/^rgba?\(\s*([^)]+)\)$/i);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) {
      return null;
    }
    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    let a = 1;
    if (parts[3] !== undefined) {
      a = parts[3].endsWith("%") ? Number(parts[3]) / 100 : Number(parts[3]);
    }
    if ([r, g, b, a].some(Number.isNaN)) {
      return null;
    }
    return { r, g, b, a: clamp01(a) };
  }

  return null;
}

function resolveMotionColorChannel(
  color: string,
  fallbackOpacity: number,
  fallbackColor = "#000000",
) {
  const parsed = parseMotionColorChannel(color);
  if (!parsed) {
    return {
      color: fallbackColor,
      opacity: fallbackOpacity,
    };
  }

  return {
    color: motionColorRgbHex(color, fallbackColor),
    opacity: parsed.a < 1 ? parsed.a : 1,
  };
}

function resolveMotionPeakColorChannel(animation: QrDotMatrixAnimationOptions) {
  const peakColor =
    animation.colorPreset === "theme"
      ? animation.customColorPeak
      : MOTION_COLOR_SWATCHES[animation.colorPreset][1];

  return resolveMotionColorChannel(
    peakColor,
    MOTION_OPACITY_ANCHORS.peak,
    peakColor,
  );
}

export function resolveMotionBaseColor(qrModuleColor: string) {
  return resolveMotionColorChannel(
    qrModuleColor,
    MOTION_OPACITY_ANCHORS.base,
    qrModuleColor,
  );
}

export function resolveMotionOpacityAnchors(
  animation: QrDotMatrixAnimationOptions,
  qrModuleColor: string,
) {
  const base = resolveMotionBaseColor(qrModuleColor);
  if (animation.colorPreset !== "theme") {
    return {
      base: base.opacity,
      mid: base.opacity,
      peak: MOTION_OPACITY_ANCHORS.peak,
    };
  }

  const accent = resolveMotionPeakColorChannel(animation);

  return {
    base: base.opacity,
    mid: base.opacity,
    peak: accent.opacity,
  };
}

export function resolveMotionColors(
  animation: QrDotMatrixAnimationOptions,
  qrModuleColor: string,
): MotionColorPair {
  const base = resolveMotionBaseColor(qrModuleColor);
  const accent = resolveMotionPeakColorChannel(animation);

  return {
    base: base.color,
    accent: accent.color,
  };
}
