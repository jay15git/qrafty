import { describe, expect, it } from "vitest";

import {
  heartExpansionMetric,
  heartImplicit,
  rippleRingIndex,
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

  it("groups modules into discrete circular ripple rings", () => {
    const size = 25;
    const center = (size - 1) / 2;
    const ring0 = rippleRingIndex(center, center, size);
    const ring1 = rippleRingIndex(center, center + 1, size);
    const ring2 = rippleRingIndex(center, center + 2, size);

    expect(ring0).toBe(0);
    expect(ring1).toBe(1);
    expect(ring2).toBe(2);
  });

  it("heart implicit is negative at center", () => {
    expect(heartImplicit(0, 0)).toBeLessThan(0);
  });
});
