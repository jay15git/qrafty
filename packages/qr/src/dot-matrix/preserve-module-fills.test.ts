import { describe, expect, it } from "vitest";

import {
  AnimationPreset,
  PRESERVE_MODULE_FILL,
  getAnimationPreset,
  QRCodeEntity,
} from "./animations";

describe("preserve module fills", () => {
  it("keeps gradient and palette configs on preserve mode", () => {
    const preset = getAnimationPreset(AnimationPreset.RadialExpand);
    const animation = preset(
      {},
      10,
      10,
      21,
      QRCodeEntity.Module,
      {
        dotMatrixOpacityBase: 1,
        dotMatrixOpacityMid: 1,
        dotMatrixOpacityPeak: 1,
        dotMatrixColorPeak: "#22d3ee",
        preserveModuleFills: true,
      },
    );
    const fillFrames = animation.web?.fill;

    expect(Array.isArray(fillFrames)).toBe(true);
    if (!Array.isArray(fillFrames)) {
      return;
    }

    const values = fillFrames.map((frame) =>
      typeof frame === "string" ? frame : (frame as { value: string }).value,
    );

    expect(values).toContain(PRESERVE_MODULE_FILL);
    expect(values).toContain("#22d3ee");
  });
});
