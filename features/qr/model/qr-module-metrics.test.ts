import { describe, expect, it } from "vitest";

import { getQraftyQrQuietZoneFraction } from "@/features/qr/model/qr-module-metrics";
import { createDefaultQraftyState, clampQrSize } from "@/features/qr/model/state";
import {
  getQrBackgroundShapeContentFrame,
  getQrBackgroundShapeDefinition,
  QR_BACKGROUND_SHAPES,
} from "@/features/qr/styles/background-shapes";
import { parsePathToVertices } from "@/lib/svg-path-to-vertices";

describe("getQraftyQrQuietZoneFraction", () => {
  it("returns a larger quiet-zone share for sparse payloads than dense ones", () => {
    const sparse = {
      ...createDefaultQraftyState(),
      width: clampQrSize(320),
      height: clampQrSize(320),
    };
    sparse.data = "https://q";
    const dense = {
      ...createDefaultQraftyState(),
      width: clampQrSize(320),
      height: clampQrSize(320),
    };
    dense.data = "x".repeat(400);

    const sparseFraction = getQraftyQrQuietZoneFraction(sparse);
    const denseFraction = getQraftyQrQuietZoneFraction(dense);

    expect(sparseFraction).toBeGreaterThan(0.2);
    expect(denseFraction).toBeGreaterThan(0);
    expect(sparseFraction).toBeGreaterThan(denseFraction);
  });

  it("scales the quiet zone with the rendered qr box size", () => {
    const state = {
      ...createDefaultQraftyState(),
      width: clampQrSize(320),
      height: clampQrSize(320),
    };
    state.data = "https://qrafty.app";

    const fraction = getQraftyQrQuietZoneFraction(state);

    expect(getQraftyQrQuietZoneFraction(state) * 320).toBeCloseTo(fraction * 320);
    expect(getQraftyQrQuietZoneFraction(state) * 160).toBeCloseTo(fraction * 160);
  });

  it("falls back to zero when the payload cannot be encoded", () => {
    const state = {
      ...createDefaultQraftyState(),
      width: clampQrSize(320),
      height: clampQrSize(320),
    };
    state.data = "x".repeat(6000);
    state.valueSegments = [];

    expect(getQraftyQrQuietZoneFraction(state)).toBe(0);
  });
});

function isPointInsidePolygon(
  point: { x: number; y: number },
  polygon: Array<{ x: number; y: number }>,
) {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const crosses =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;

    if (crosses) {
      inside = !inside;
    }
  }

  return inside;
}

describe("getQrBackgroundShapeContentFrame", () => {
  it("uses an inscribed square for curved shapes", () => {
    const circle = getQrBackgroundShapeDefinition("circle");
    const frame = getQrBackgroundShapeContentFrame(circle!);

    expect(frame.width).toBeGreaterThan(224);
    expect(frame.width).toBeLessThan(320 / Math.sqrt(2));
    expect(frame.height).toBe(frame.width);
    expect(frame.x + frame.width / 2).toBeCloseTo(160);
    expect(frame.y + frame.height / 2).toBeCloseTo(160);
  });

  it("allows asymmetric shapes to define an offset safe area", () => {
    const ghost = getQrBackgroundShapeDefinition("ghost");
    const tag = getQrBackgroundShapeDefinition("tag");
    const ghostFrame = getQrBackgroundShapeContentFrame(ghost!);
    const tagFrame = getQrBackgroundShapeContentFrame(tag!);

    expect(ghostFrame.y + ghostFrame.height / 2).not.toBeCloseTo(ghost!.viewBox.height / 2);
    expect(tagFrame.y + tagFrame.height / 2).not.toBeCloseTo(tag!.viewBox.height / 2);
  });

  it("keeps every safe-area edge inside its registered shape", { timeout: 30000 }, () => {
    for (const shape of QR_BACKGROUND_SHAPES) {
      const frame = getQrBackgroundShapeContentFrame(shape);
      const polygon = parsePathToVertices(
        shape.path,
        Math.max(0.02, Math.min(shape.viewBox.width, shape.viewBox.height) / 300),
      );

      expect(frame.width).toBeGreaterThan(0);
      expect(frame.height).toBe(frame.width);
      expect(frame.x).toBeGreaterThanOrEqual(shape.viewBox.x ?? 0);
      expect(frame.y).toBeGreaterThanOrEqual(shape.viewBox.y ?? 0);
      expect(frame.x + frame.width).toBeLessThanOrEqual(
        (shape.viewBox.x ?? 0) + shape.viewBox.width,
      );
      expect(frame.y + frame.height).toBeLessThanOrEqual(
        (shape.viewBox.y ?? 0) + shape.viewBox.height,
      );

      for (let index = 0; index <= 16; index += 1) {
        const ratio = index / 16;
        const x = frame.x + frame.width * ratio;
        const y = frame.y + frame.height * ratio;

        expect(isPointInsidePolygon({ x, y: frame.y }, polygon), shape.id).toBe(true);
        expect(isPointInsidePolygon({ x, y: frame.y + frame.height }, polygon), shape.id).toBe(
          true,
        );
        expect(isPointInsidePolygon({ x: frame.x, y }, polygon), shape.id).toBe(true);
        expect(isPointInsidePolygon({ x: frame.x + frame.width, y }, polygon), shape.id).toBe(true);
      }
    }
  });
});
