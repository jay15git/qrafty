function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function componentToHex(value: number) {
  return Math.round(clamp01(value / 255) * 255)
    .toString(16)
    .padStart(2, "0");
}

export function parseHexColor(input: string) {
  const value = input.trim();
  if (!value.startsWith("#")) {
    return null;
  }

  const hex = value.slice(1);
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return { r, g, b };
  }

  if (hex.length === 6) {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    if ([r, g, b].some(Number.isNaN)) {
      return null;
    }
    return { r, g, b };
  }

  return null;
}

export function isMixableHexColor(input: string) {
  return parseHexColor(input) !== null;
}

export function mixHexColors(base: string, accent: string, mix: number, fallback = "#000000") {
  const from = parseHexColor(base);
  const to = parseHexColor(accent);
  if (!from || !to) {
    return mix >= 0.5 ? accent : base;
  }

  const progress = clamp01(mix);
  const r = from.r + (to.r - from.r) * progress;
  const g = from.g + (to.g - from.g) * progress;
  const b = from.b + (to.b - from.b) * progress;

  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

export function dualAccentMixFromCssBlend(blend: {
  base: number;
  mid: number;
  peak: number;
}) {
  const accentWeight = blend.peak + blend.mid * 0.5;
  const total = blend.base + blend.mid + blend.peak;
  if (total <= 0) {
    return 0;
  }

  return clamp01(accentWeight / total);
}

export function dualAccentMixFromOpacity(
  opacity: number,
  baseAnchor: number,
  peakAnchor: number,
) {
  if (!Number.isFinite(opacity)) {
    return 0;
  }

  if (peakAnchor <= baseAnchor) {
    return opacity >= peakAnchor ? 1 : 0;
  }

  return clamp01((opacity - baseAnchor) / (peakAnchor - baseAnchor));
}
