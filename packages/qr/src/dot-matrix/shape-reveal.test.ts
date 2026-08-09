import { describe, expect, it } from "vitest";

import { sampleDotMatrixAnimationFrame } from "./animations";
import { heartExpansionMetric, heartMaxExpansionMetric } from "./shape-metrics";

describe("shape reveal sampling", () => {
  it("reveals a single heart fill from center outward", () => {
    const size = 21;
    const center = (size - 1) / 2;
    const maxMetric = heartMaxExpansionMetric(size);
    const animation = {
      targets: {} as HTMLElement,
      duration: 1500,
      easing: "ease-in-out",
      web: {
        shapeReveal: {
          edgeWidth: 1.4,
          maxMetric,
          metric: heartExpansionMetric(center, center, size),
        },
        opacity: [
          { offset: 0, value: 1 },
          { offset: 1, value: 1 },
        ],
        fill: ["#111827", "#22d3ee"],
      },
    };

    const start = sampleDotMatrixAnimationFrame(animation, 0);
    const peak = sampleDotMatrixAnimationFrame(animation, 750);
    const end = sampleDotMatrixAnimationFrame(animation, 1500);

    expect(start.fill).toBe("#111827");
    expect(peak.fill).toBe("#22d3ee");
    expect(end.fill).toBe("#111827");
  });

  it("keeps outside-shape modules on base color at full reveal", () => {
    const size = 21;
    const maxMetric = heartMaxExpansionMetric(size);
    const outsideMetric = maxMetric + 2;
    const animation = {
      targets: {} as HTMLElement,
      duration: 1500,
      easing: "ease-in-out",
      web: {
        shapeReveal: {
          edgeWidth: 1.4,
          maxMetric,
          metric: outsideMetric,
        },
        opacity: [
          { offset: 0, value: 1 },
          { offset: 1, value: 1 },
        ],
        fill: ["#111827", "#22d3ee"],
      },
    };

    expect(outsideMetric).toBeGreaterThan(maxMetric);
    expect(sampleDotMatrixAnimationFrame(animation, 750).fill).toBe("#111827");
  });
});
