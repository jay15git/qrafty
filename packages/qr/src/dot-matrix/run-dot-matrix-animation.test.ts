// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { AnimationPreset, type QRCodeAnimation } from "./animations";
import { buildDotMatrixAnimationTargets, seekDotMatrixAnimation } from "./run-dot-matrix-animation";

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

  it("applies scale and module-relative translation to rendered svg modules", () => {
    document.body.innerHTML = `
      <div id="qr-root">
        <svg>
          <rect class="module" data-column="0" data-row="0"></rect>
        </svg>
      </div>
    `;

    const animation: QRCodeAnimation = (targets) => ({
      targets,
      duration: 1000,
      easing: "linear",
      web: {
        opacity: [1, 1, 1],
        scale: [1, 1.4, 1],
        x: [0, 0.35, 0],
        y: [0, -0.2, 0],
      },
    });
    const root = document.getElementById("qr-root")!;

    seekDotMatrixAnimation(root, animation, 500);

    const moduleElement = root.querySelector<SVGElement>(".module")!;
    expect(moduleElement.style.transform).toBe("translate(35%, -20%) scale(1.4)");
    expect(moduleElement.style.transformBox).toBe("fill-box");
    expect(moduleElement.style.transformOrigin).toBe("center");
  });

  it("uses module overrides as actual animation targets", () => {
    document.body.innerHTML = `
      <div id="qr-root">
        <svg>
          <rect class="module" data-column="0" data-row="0"></rect>
          <rect class="module" data-column="1" data-row="0"></rect>
        </svg>
      </div>
    `;

    const root = document.getElementById("qr-root")!;
    const overrides = Array.from(root.querySelectorAll(".module")).map(
      (module) => module.cloneNode(true) as Element,
    );
    const targets = buildDotMatrixAnimationTargets(
      root,
      AnimationPreset.RadialExpand,
      {},
      overrides,
    );

    expect(targets.map(({ element }) => element)).toEqual(overrides);
  });
});
