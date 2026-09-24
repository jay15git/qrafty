// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { createDefaultQraftyState, clampQrSize } from "@/features/qr/model/state";
import { buildCanvasQrBackgroundSvgPayload } from "@/features/canvas/components/canvas-qr-background";
import { createDefaultCanvasLayers } from "@/features/canvas/model/layers/card-qr";
import { createDefaultCanvasCardState } from "@/features/canvas/model/card-state";

describe("background shape svg payload", () => {
  it("renders decorative shapes as inline svg markup", () => {
    const state = {
      ...createDefaultQraftyState(),
      width: clampQrSize(240),
      height: clampQrSize(240),
    };
    state.backgroundShapeId = "flower";
    const [layer] = createDefaultCanvasLayers(
      "preview",
      state,
      createDefaultCanvasCardState(),
    ).filter((entry) => entry.kind === "qr");

    const payload = buildCanvasQrBackgroundSvgPayload(layer, state);

    expect(payload?.shapeId).toBe("flower");
    expect(payload?.markup).toContain("<svg");
    expect(payload?.markup).toContain("<path");
    expect(payload?.width).toBeGreaterThan(0);
    expect(payload?.height).toBeGreaterThan(0);
  });

  it("keeps gradient and stroke attributes in inline svg markup", () => {
    const state = {
      ...createDefaultQraftyState(),
      width: clampQrSize(240),
      height: clampQrSize(240),
    };
    state.backgroundShapeId = "circle";
    state.backgroundShapeOptions = {
      ...state.backgroundShapeOptions,
      strokeWidth: 6,
      strokeColor: "#ff00aa",
    };
    state.backgroundGradient = {
      ...state.backgroundGradient,
      enabled: true,
    };
    const [layer] = createDefaultCanvasLayers(
      "preview",
      state,
      createDefaultCanvasCardState(),
    ).filter((entry) => entry.kind === "qr");

    const payload = buildCanvasQrBackgroundSvgPayload(layer, state);
    const markup = payload?.markup ?? "";

    expect(markup).toContain("linearGradient");
    expect(markup).toContain('stroke-width="16"');
    expect(markup).toContain('stroke="#ff00aa"');
    expect(markup).toContain('clip-path="url(#preview-qr-qr-background-stroke-clip)"');
  });

  it("keeps decorative shape layout proportional when the qr layer is resized", () => {
    const state = {
      ...createDefaultQraftyState(),
      width: clampQrSize(240),
      height: clampQrSize(240),
    };
    state.backgroundShapeId = "flower";
    state.backgroundShapeOptions = {
      ...state.backgroundShapeOptions,
      paddingPx: 24,
    };
    const [layer] = createDefaultCanvasLayers(
      "preview",
      state,
      createDefaultCanvasCardState(),
    ).filter((entry) => entry.kind === "qr");

    const fullSize = buildCanvasQrBackgroundSvgPayload(layer, state);
    const resizeScale = 0.6;
    const resizedLayer = {
      ...layer,
      width: Math.round(layer.width * resizeScale),
      height: Math.round(layer.height * resizeScale),
    };
    const resized = buildCanvasQrBackgroundSvgPayload(resizedLayer, state);

    expect(resized?.width).toBeCloseTo((fullSize?.width ?? 0) * resizeScale, 0);
    expect(resized?.height).toBeCloseTo((fullSize?.height ?? 0) * resizeScale, 0);
    expect(resized?.markup).toContain("<path");
    expect(resized?.width).toBeLessThan(fullSize?.width ?? 0);
  });

  it("fits background outer metrics to the layer box at small resize sizes", () => {
    const state = {
      ...createDefaultQraftyState(),
      width: clampQrSize(240),
      height: clampQrSize(240),
    };
    state.backgroundShapeId = "flower";
    state.backgroundShapeOptions = {
      ...state.backgroundShapeOptions,
      edgeBlur: 10,
      paddingPx: 20,
      shadowOffsetX: -14,
      shadowOffsetY: 18,
      strokeWidth: 8,
    };
    const [layer] = createDefaultCanvasLayers(
      "preview",
      state,
      createDefaultCanvasCardState(),
    ).filter((entry) => entry.kind === "qr");

    for (const size of [100, 50, 30, 24]) {
      const resizedLayer = { ...layer, width: size, height: size };
      const payload = buildCanvasQrBackgroundSvgPayload(resizedLayer, state);

      expect(payload?.width).toBe(size);
      expect(payload?.height).toBe(size);
    }
  });

  it("skips background markup when shape is none and surface options are inactive", () => {
    const state = {
      ...createDefaultQraftyState(),
      width: clampQrSize(240),
      height: clampQrSize(240),
    };
    state.backgroundOptions.round = 0.2;
    state.backgroundOptions.transparent = true;
    state.backgroundOptions.color = "";
    const [layer] = createDefaultCanvasLayers(
      "preview",
      state,
      createDefaultCanvasCardState(),
    ).filter((entry) => entry.kind === "qr");

    const payload = buildCanvasQrBackgroundSvgPayload(layer, state);

    expect(payload).toBeNull();
  });

  it("uses rounded rect markup when shape is none but surface options are active", () => {
    const state = {
      ...createDefaultQraftyState(),
      width: clampQrSize(240),
      height: clampQrSize(240),
    };
    state.backgroundOptions.round = 0.2;
    state.backgroundShapeOptions = {
      ...state.backgroundShapeOptions,
      paddingPx: 24,
    };
    const [layer] = createDefaultCanvasLayers(
      "preview",
      state,
      createDefaultCanvasCardState(),
    ).filter((entry) => entry.kind === "qr");

    const payload = buildCanvasQrBackgroundSvgPayload(layer, state);

    expect(payload?.shapeId).toBe("rect");
    expect(payload?.markup).toContain("<rect");
    expect(payload?.markup).toMatch(/rx="[^"]+"/);
  });
});
