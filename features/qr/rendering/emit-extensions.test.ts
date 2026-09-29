import { describe, expect, it } from "vitest";

import {
  emitDescendants,
  getEmitAttr,
  getFinderCornerRegions,
  getQrSvgNumCells,
  parseEmitSvgMarkup,
  type EmitNode,
} from "@qrafty/qr-internal/core";
import { emitReactQrCodeMarkup } from "@qrafty/qr-internal/react-qr-code";

import { toReactQrCodeProps } from "@/features/qr/adapters/react-qr-adapter";
import { getQraftyQrQuietZoneFraction } from "@/features/qr/model/qr-module-metrics";
import { createDefaultQraftyState, type QraftyState, clampQrSize } from "@/features/qr/model/state";
import { buildQrEmitExtensions } from "@/features/qr/rendering/emit-extensions";
import {
  getCanvasQrLayerLayout,
  getQrRenderedDimensions,
} from "@/features/qr/rendering/background-shape-layout";
import {
  getQrBackgroundShapeContentFrame,
  getQrBackgroundShapeDefinition,
} from "@/features/qr/styles/background-shapes";

function emitQrSvg(state: QraftyState): EmitNode {
  const markup = emitReactQrCodeMarkup(toReactQrCodeProps(state), buildQrEmitExtensions(state));
  return parseEmitSvgMarkup(markup.replace(/<\?xml[\s\S]*?\?>\s*/i, ""));
}

function findByLayer(svg: EmitNode, layer: string): EmitNode | undefined {
  return [...emitDescendants(svg)].find((node) => getEmitAttr(node, "data-qr-layer") === layer);
}

function findAllByLayer(svg: EmitNode, layer: string): EmitNode[] {
  return [...emitDescendants(svg)].filter((node) => getEmitAttr(node, "data-qr-layer") === layer);
}

describe("qr rendering helpers", () => {
  it("derives three localized outer finder regions from qr geometry", () => {
    expect(getFinderCornerRegions(12, 57, "outer")).toEqual([
      { height: 7, width: 7, x: 12, y: 12 },
      { height: 7, width: 7, x: 38, y: 12 },
      { height: 7, width: 7, x: 12, y: 38 },
    ]);
  });

  it("derives three localized inner finder regions from qr geometry", () => {
    expect(getFinderCornerRegions(12, 57, "inner")).toEqual([
      { height: 4.5, width: 4.5, x: 13.25, y: 13.25 },
      { height: 4.5, width: 4.5, x: 39.25, y: 13.25 },
      { height: 4.5, width: 4.5, x: 13.25, y: 39.25 },
    ]);
  });

  it("reads qr num cells from a parsed view box", () => {
    const svg = parseEmitSvgMarkup('<svg viewBox="0 0 57 57"/>');

    expect(
      getQrSvgNumCells({
        getAttribute: (name: string) => getEmitAttr(svg, name),
      } as never),
    ).toBe(57);
  });

  it("returns no extensions for logo-only changes", () => {
    const state = createDefaultQraftyState();
    state.backgroundOptions.transparent = true;
    state.logo = {
      source: "url",
      value: "https://example.com/logo.png",
    };

    expect(buildQrEmitExtensions(state)).toBeUndefined();
  });

  it("applies palette module colors as merged path groups", () => {
    const state = createDefaultQraftyState();
    state.dotsColorMode = "palette";
    state.dotsPalette = ["#111111", "#eeeeee"];

    const svg = emitQrSvg(state);
    const palette = findByLayer(svg, "dot-palette");
    const fills = findAllByLayer(svg, "dot-palette-fill");

    expect(palette).toBeDefined();
    expect(getEmitAttr(palette!, "data-qr-palette-size")).toBe("2");
    expect(fills).toHaveLength(2);
    expect(fills.map((fill) => getEmitAttr(fill, "fill"))).toEqual(["#111111", "#eeeeee"]);
  });

  it("applies module gradients only to the data modules path", () => {
    const state = createDefaultQraftyState();
    state.dotsColorMode = "gradient";
    state.dataModulesGradient = {
      enabled: true,
      type: "linear",
      rotation: Math.PI / 2,
      colorStops: [
        { offset: 0, color: "#111111" },
        { offset: 1, color: "#eeeeee" },
      ],
    };

    const svg = emitQrSvg(state);
    const dataModules = [...emitDescendants(svg)].find(
      (node) => getEmitAttr(node, "data-testid") === "data-modules",
    );
    const gradientDefinition = findByLayer(svg, "dot-gradient-definition");

    expect(dataModules).toBeDefined();
    expect(getEmitAttr(dataModules!, "fill")).toBe("url('#dot-gradient-definition')");
    expect(getEmitAttr(dataModules!, "data-qr-layer")).toBe("dot-gradient-fill");
    expect(gradientDefinition?.tagName).toBe("linearGradient");
    expect(getEmitAttr(gradientDefinition!, "gradientUnits")).toBe("userSpaceOnUse");
  });

  it("adds a background image layer", () => {
    const state = createDefaultQraftyState();
    state.backgroundImage = {
      source: "upload",
      value: "blob:https://qrafty.local/background.png",
    };

    const svg = emitQrSvg(state);
    const backgroundImage = findByLayer(svg, "background-image");

    expect(backgroundImage).toBeDefined();
    expect(getEmitAttr(backgroundImage!, "href")).toBe("blob:https://qrafty.local/background.png");
    expect(getEmitAttr(backgroundImage!, "clip-path")).toBeNull();
  });

  it("clips background images with the configured qr background radius", () => {
    const state = createDefaultQraftyState();
    state.backgroundOptions.round = 0.5;
    state.backgroundImage = {
      source: "upload",
      value: "blob:https://qrafty.local/background.png",
    };

    const svg = emitQrSvg(state);
    const backgroundImage = findByLayer(svg, "background-image");
    const clipPath = findByLayer(svg, "background-image-clip");
    const clipRect = clipPath?.children[0];

    expect(getEmitAttr(backgroundImage!, "clip-path")).toBe("url('#clip-path-background-image')");
    expect(getEmitAttr(clipPath!, "id")).toBe("clip-path-background-image");
    expect(clipRect?.tagName).toBe("rect");
  });

  it("lets background images override vector background shapes", () => {
    const state = createDefaultQraftyState();
    state.backgroundShapeId = "circle";
    state.backgroundImage = {
      source: "upload",
      value: "blob:https://qrafty.local/background.png",
    };

    const svg = emitQrSvg(state);

    expect(findByLayer(svg, "background-image")).toBeDefined();
    expect(findByLayer(svg, "background-shape")).toBeUndefined();
  });

  it("adds a solid vector background shape fitted to the viewport", () => {
    const state = createDefaultQraftyState();
    state.backgroundShapeId = "hexagon";
    state.backgroundOptions.color = "#d0bcff";

    const svg = emitQrSvg(state);
    const backgroundShape = findByLayer(svg, "background-shape");

    expect(backgroundShape).toBeDefined();
    expect(getEmitAttr(backgroundShape!, "fill")).toBe("#d0bcff");
    expect(getEmitAttr(backgroundShape!, "transform")).toContain("translate");
  });

  it("expands the default qr background surface with padding and stroke", () => {
    const state = createDefaultQraftyState();
    state.backgroundOptions.color = "#f8fafc";
    state.backgroundOptions.round = 0.25;
    state.backgroundShapeOptions = {
      edgeBlur: 10,
      paddingPx: 20,
      shadowColor: "#020617",
      shadowOffsetX: -14,
      shadowOffsetY: 18,
      shadowOpacity: 60,
      strokeColor: "#0f172a",
      strokeOpacity: 55,
      strokeWidth: 8,
      tiltX: 0,
      tiltY: 0,
    };

    const svg = emitQrSvg(state);
    const qrContent = findByLayer(svg, "qr-content");
    const strokeWrap = findByLayer(svg, "background-surface-stroke");

    expect(getEmitAttr(svg, "viewBox")).toBe("0 0 53 53");
    expect(qrContent).toBeDefined();
    expect(getEmitAttr(qrContent!, "transform")).toContain("translate");
    expect(strokeWrap).toBeDefined();
    expect(findByLayer(svg, "background-surface-blur")).toBeUndefined();
  });

  it("fills vector background shapes with the active background gradient", () => {
    const state = createDefaultQraftyState();
    state.backgroundShapeId = "circle";
    state.backgroundGradient = {
      enabled: true,
      type: "linear",
      rotation: Math.PI / 2,
      colorStops: [
        { offset: 0, color: "#111111" },
        { offset: 1, color: "#eeeeee" },
      ],
    };

    const svg = emitQrSvg(state);
    const backgroundShape = findByLayer(svg, "background-shape");
    const gradient = findByLayer(svg, "background-shape-gradient");

    expect(getEmitAttr(backgroundShape!, "fill")).toBe("url('#background-shape-gradient')");
    expect(gradient?.tagName).toBe("linearGradient");
  });

  it("emits per-corner gradient definitions for corner-frame gradients", () => {
    const state = createDefaultQraftyState();
    state.finderPatternOuterGradient = {
      ...state.finderPatternOuterGradient,
      enabled: true,
      rotation: Math.PI / 4,
      type: "linear",
    };

    const svg = emitQrSvg(state);
    const gradients = [...emitDescendants(svg)].filter(
      (node) =>
        node.tagName === "linearGradient" &&
        (getEmitAttr(node, "id") ?? "").includes("corners-square-color-"),
    );

    expect(gradients.length).toBeGreaterThanOrEqual(3);
    expect(gradients.every((g) => getEmitAttr(g, "gradientUnits") === "userSpaceOnUse")).toBe(true);
  });
});

describe("shape padding geometry", () => {
  function createShapeState(paddingPx: number, data = "https://qrafty.app") {
    const state = {
      ...createDefaultQraftyState(),
      width: clampQrSize(320),
      height: clampQrSize(320),
    };
    state.data = data;
    state.backgroundShapeId = "circle";
    state.backgroundShapeOptions = {
      ...state.backgroundShapeOptions,
      paddingPx,
    };

    return state;
  }

  function measureInkToShapeGap(state: QraftyState) {
    const shape = getQrBackgroundShapeDefinition(state.backgroundShapeId);

    if (!shape) {
      throw new Error("test requires a background shape");
    }

    const layout = getCanvasQrLayerLayout(400, state);
    const contentFrame = getQrBackgroundShapeContentFrame(shape);
    const scale = layout.metrics.backingRegion.width / shape.viewBox.width;
    const quietZonePx = getQraftyQrQuietZoneFraction(state) * layout.innerWidth;
    const contentFrameLeft =
      layout.metrics.backingRegion.x + (contentFrame.x - (shape.viewBox.x ?? 0)) * scale;

    return (layout.metrics.translateX + quietZonePx - contentFrameLeft) / layout.scale;
  }

  it("fills the layer box with the square surface and qr ink at slider 0", () => {
    const state = {
      ...createDefaultQraftyState(),
      width: clampQrSize(320),
      height: clampQrSize(320),
    };
    const layout = getCanvasQrLayerLayout(320, state);
    const quietZonePx = getQraftyQrQuietZoneFraction(state) * layout.innerWidth;
    const inkLeft = layout.metrics.translateX + quietZonePx;
    const inkRight = layout.metrics.translateX + layout.innerWidth - quietZonePx;

    expect(layout.metrics.backingRegion.x).toBeCloseTo(0, 6);
    expect(layout.metrics.backingRegion.y).toBeCloseTo(0, 6);
    expect(layout.metrics.backingRegion.width).toBeCloseTo(320, 6);
    expect(layout.metrics.backingRegion.height).toBeCloseTo(320, 6);
    expect(inkLeft).toBeCloseTo(0, 6);
    expect(inkRight).toBeCloseTo(320, 6);
  });

  it("insets the qr inside the square surface by the slider padding", () => {
    const state = {
      ...createDefaultQraftyState(),
      width: clampQrSize(320),
      height: clampQrSize(320),
    };
    state.backgroundShapeOptions = { ...state.backgroundShapeOptions, paddingPx: 24 };
    const layout = getCanvasQrLayerLayout(320, state);
    const quietZonePx = getQraftyQrQuietZoneFraction(state) * layout.innerWidth;
    const inkLeft = layout.metrics.translateX + quietZonePx;
    const inkRight = layout.metrics.translateX + layout.innerWidth - quietZonePx;

    expect(inkLeft).toBeCloseTo(24, 6);
    expect(inkRight).toBeCloseTo(296, 6);
    expect(layout.metrics.translateX + layout.innerWidth / 2).toBeCloseTo(160, 6);
  });

  it("starts with no minimum ink-to-shape gap at slider 0", () => {
    expect(measureInkToShapeGap(createShapeState(0))).toBeCloseTo(0, 6);
  });

  it("adds the slider value as minimum ink-to-shape padding", () => {
    expect(measureInkToShapeGap(createShapeState(24))).toBeCloseTo(24, 6);
    expect(measureInkToShapeGap(createShapeState(60))).toBeCloseTo(60, 6);
  });

  it("keeps the qr centered in asymmetric shapes", () => {
    const state = createShapeState(40);
    state.backgroundShapeId = "ghost";

    const shape = getQrBackgroundShapeDefinition("ghost");
    const layout = getCanvasQrLayerLayout(400, state);
    const contentFrame = getQrBackgroundShapeContentFrame(shape!);
    const scale = layout.metrics.backingRegion.width / shape!.viewBox.width;
    const contentFrameCenterX =
      layout.metrics.backingRegion.x +
      (contentFrame.x - (shape!.viewBox.x ?? 0) + contentFrame.width / 2) * scale;
    const qrCenterX = layout.metrics.translateX + layout.innerWidth / 2;

    expect(contentFrameCenterX).toBeCloseTo(qrCenterX, 6);
  });

  it("reports rendered dimensions from state", () => {
    const state = createDefaultQraftyState();
    const dims = getQrRenderedDimensions(state);

    expect(dims.width).toBe(clampQrSize(state.width));
    expect(dims.height).toBe(clampQrSize(state.height));
  });
});
