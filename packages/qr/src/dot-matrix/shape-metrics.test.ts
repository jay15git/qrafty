import { describe, expect, it } from "vitest";

import {
  diamondExpansionMetric,
  heartExpansionMetric,
  heartImplicit,
  starExpansionMetric,
} from "./shape-metrics";

const STAR_SPIKES = 5;

describe("shape-metrics", () => {
  it("places heart lobes above center and tip below", () => {
    const size = 25;
    const center = (size - 1) / 2;
    const topLobe = heartExpansionMetric(4, center - 4, size);
    const bottomTip = heartExpansionMetric(size - 1, center, size);
    const centerMetric = heartExpansionMetric(center, center, size);

    expect(centerMetric).toBe(0);
    expect(topLobe).toBeGreaterThan(centerMetric);
    expect(bottomTip).toBeGreaterThan(topLobe);
  });

  it("keeps the heart notch above its two upper lobes", () => {
    const size = 25;
    const center = (size - 1) / 2;
    const topNotch = heartExpansionMetric(0, center, size);
    const upperLobe = heartExpansionMetric(4, center - 4, size);

    expect(topNotch).toBeGreaterThan(upperLobe);
  });

  it("forms star tips farther than indent notches", () => {
    const size = 25;
    const center = (size - 1) / 2;
    const radius = center;
    const notchAngle = -Math.PI / 2 + Math.PI / STAR_SPIKES;
    const indentRow = center + Math.round(-Math.sin(notchAngle) * radius * 0.72);
    const indentCol = center + Math.round(Math.cos(notchAngle) * radius * 0.72);
    const tip = starExpansionMetric(0, center, size);
    const indent = starExpansionMetric(indentRow, indentCol, size);

    expect(tip).toBeGreaterThan(indent);
  });

  it("heart implicit is negative at center", () => {
    expect(heartImplicit(0, 0)).toBeLessThan(0);
  });

  it("increases diamond expansion metric from center toward the tips", () => {
    const size = 25;
    const center = (size - 1) / 2;
    const topTip = diamondExpansionMetric(0, center, size);
    const upperInner = diamondExpansionMetric(2, center, size);
    const centerMetric = diamondExpansionMetric(center, center, size);

    expect(centerMetric).toBe(0);
    expect(topTip).toBeGreaterThan(upperInner);
    expect(upperInner).toBeGreaterThan(centerMetric);
  });
});
