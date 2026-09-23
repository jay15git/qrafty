import { parseColor } from "./color";
import type { ColorFormat, OklchColor } from "./types";

export type ColorComponent = "l" | "c" | "h" | "alpha";

export const ALL_FORMATS: ColorFormat[] = ["hex", "rgb", "hsl", "hsb", "oklch", "oklab", "p3"];

export const BLACK: OklchColor = { l: 0, c: 0, h: 0, alpha: 1 };
export const WHITE: OklchColor = { l: 1, c: 0, h: 0, alpha: 1 };

export function coerce(input: string | OklchColor | undefined, fallback: OklchColor): OklchColor {
  if (!input) return fallback;
  if (typeof input === "string") {
    return parseColor(input) ?? fallback;
  }
  return input;
}

function clamp(x: number, lo: number, hi: number) {
  return Math.min(Math.max(x, lo), hi);
}

function wrapHue(h: number) {
  const m = h % 360;
  return m < 0 ? m + 360 : m;
}

const HUE_EPS = 1e-4;
export function isAchromatic(c: OklchColor): boolean {
  return c.c <= HUE_EPS || c.l <= HUE_EPS || c.l >= 1 - HUE_EPS;
}

export function applyComponent(c: OklchColor, key: ColorComponent, raw: number): OklchColor {
  switch (key) {
    case "l":
      return { ...c, l: clamp(raw, 0, 1) };
    case "c":
      return { ...c, c: Math.max(raw, 0) };
    case "h":
      return { ...c, h: wrapHue(raw) };
    case "alpha":
      return { ...c, alpha: clamp(raw, 0, 1) };
  }
}
