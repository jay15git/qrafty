// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { AnimationPreset } from "./animations";
import { buildDotMatrixAnimationTargets } from "./run-dot-matrix-animation";

describe("buildDotMatrixAnimationTargets", () => {
  it("skips finder corner frame and eye elements", () => {
    document.body.innerHTML = `
      <div id="qr-root">
        <svg>
          <rect class="module" data-column="0" data-row="0"></rect>
          <rect class="module" data-column="1" data-row="0"></rect>
          <g class="position-ring" data-column="0" data-row="0"></g>
          <g class="position-center" data-column="1" data-row="1"></g>
        </svg>
      </div>
    `;

    const root = document.getElementById("qr-root")!;
    const targets = buildDotMatrixAnimationTargets(root, AnimationPreset.NeonDrift);
    const classNames = targets.map((target) => target.element.getAttribute("class") ?? "");

    expect(classNames.some((value) => value.includes("position-ring"))).toBe(false);
    expect(classNames.some((value) => value.includes("position-center"))).toBe(false);
    expect(classNames.some((value) => value.includes("module"))).toBe(true);
  });
});
