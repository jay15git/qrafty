import { describe, expect, it } from "vitest";

import {
  dualAccentMixFromCssBlend,
  dualAccentMixFromOpacity,
  mixHexColors,
} from "./color-mix";

describe("color-mix", () => {
  it("mixes hex colors along a gradient", () => {
    expect(mixHexColors("#000000", "#ffffff", 0)).toBe("#000000");
    expect(mixHexColors("#000000", "#ffffff", 1)).toBe("#ffffff");
    expect(mixHexColors("#000000", "#ffffff", 0.5)).toBe("#808080");
  });

  it("derives accent mix from css blend weights", () => {
    expect(dualAccentMixFromCssBlend({ base: 1, mid: 0, peak: 0 })).toBe(0);
    expect(dualAccentMixFromCssBlend({ base: 0, mid: 0, peak: 1 })).toBe(1);
    expect(dualAccentMixFromCssBlend({ base: 0.5, mid: 0.5, peak: 0 })).toBeCloseTo(
      0.25,
      5,
    );
  });

  it("derives accent mix from resolved opacity", () => {
    expect(dualAccentMixFromOpacity(1, 1, 1)).toBe(1);
    expect(dualAccentMixFromOpacity(0.5, 1, 1)).toBe(0);
    expect(dualAccentMixFromOpacity(0.75, 0.5, 1)).toBeCloseTo(0.5, 5);
  });
});
