import { describe, expect, it } from "vitest";

import { toReactQrCodeProps } from "@/features/qr-code/adapters/react-qr-adapter";
import {
  clampBackgroundShapeOffset,
  clampBackgroundShapeOpacity,
  clampBackgroundShapePaddingPx,
  clampBackgroundShapeTilt,
  clampRasterExportQualityPercent,
  clampQrBackgroundRound,
  clampQrSize,
  createDefaultQrStudioState,
  setRasterExportQualityPercent,
  setSquareQrSize,
} from "@/features/qr-code/model/state";

describe("qr studio state helpers", () => {
  it("starts with shared asset state for logo and background", () => {
    const state = createDefaultQrStudioState();

    expect(state.backgroundShapeId).toBe("none");
    expect(state.backgroundShapeOptions).toEqual({
      edgeBlur: 0,
      paddingPx: 0,
      shadowColor: "#111827",
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      shadowOpacity: 72,
      strokeColor: "#f8fafc",
      strokeOpacity: 100,
      strokeWidth: 0,
      tiltX: 0,
      tiltY: 0,
    });
    expect(state.logo).toEqual({
      source: "none",
      value: undefined,
      presetId: undefined,
      presetColor: undefined,
    });
    expect(state.backgroundImage).toEqual({
      source: "none",
      value: undefined,
      presetId: undefined,
      presetColor: undefined,
    });
  });

  it("passes boostLevel, moduleSize, lineWidth, logo opacity, and aria-label to ReactQRCode", () => {
    const state = createDefaultQrStudioState()
    state.qrOptions.boostLevel = false
    state.dataModulesSettings.moduleSize = 0.85
    state.dataModulesSettings.lineWidth = 0.5
    state.ariaLabel = "Event ticket"
    state.imageOptions.opacity = 0.6
    state.logo = { source: "url", value: "https://example.com/logo.png" }

    const props = toReactQrCodeProps(state)

    expect(props.boostLevel).toBe(false)
    expect(props.dataModulesSettings?.size).toBe(0.85)
    expect(props.dataModulesSettings?.lineWidth).toBe(0.5)
    expect(props.svgProps?.["aria-label"]).toBe("Event ticket")
    expect(props.imageSettings?.opacity).toBe(0.6)
  })

  it("builds ReactQRCode props from the default state", () => {
    const state = createDefaultQrStudioState();
    const props = toReactQrCodeProps(state);

    expect(props.size).toBe(320);
    expect(props.value).toContain("https://");
    expect(props.imageSettings).toBeUndefined();
    expect(props.background).toBe("#f8fafc");
    expect(props.level).toBe("Q");
    expect(props.dataModulesSettings?.style).toBe("rounded");
  });

  it("keeps upstream qr background transparent when a vector background shape is active", () => {
    const state = createDefaultQrStudioState();
    state.backgroundShapeId = "circle";
    state.backgroundOptions.color = "#d0bcff";

    const props = toReactQrCodeProps(state);

    expect(props.background).toBe("transparent");
  });

  it("maps qr background radius onto upstream background round", () => {
    const state = createDefaultQrStudioState();
    state.backgroundOptions.round = 0.42;

    const props = toReactQrCodeProps(state);

    expect(props.svgProps?.style).toEqual(
      expect.objectContaining({ borderRadius: "42%" }),
    );
  });

  it("clamps qr background radius to the upstream round range", () => {
    const lowRadiusState = createDefaultQrStudioState();
    lowRadiusState.backgroundOptions.round = -0.5;

    const highRadiusState = createDefaultQrStudioState();
    highRadiusState.backgroundOptions.round = 2;

    expect(toReactQrCodeProps(lowRadiusState).svgProps?.style).toEqual(
      expect.objectContaining({ borderRadius: "0%" }),
    );
    expect(toReactQrCodeProps(highRadiusState).svgProps?.style).toEqual(
      expect.objectContaining({ borderRadius: "100%" }),
    );
    expect(clampQrBackgroundRound(Number.NaN)).toBe(0);
  });

  it("clamps shared qr size updates to the supported square range", () => {
    const state = createDefaultQrStudioState();
    const undersized = setSquareQrSize(state, 24);
    const oversized = setSquareQrSize(state, 2400);

    expect(undersized.width).toBe(120);
    expect(undersized.height).toBe(120);
    expect(oversized.width).toBe(1200);
    expect(oversized.height).toBe(1200);
    expect(clampQrSize(Number.NaN)).toBe(320);
  });

  it("starts dashboard raster export quality at 100 percent", () => {
    const state = createDefaultQrStudioState();

    expect(state.rasterExportQualityPercent).toBe(100);
  });









  it("clamps raster export quality updates to the supported range", () => {
    const state = createDefaultQrStudioState();
    const lowQuality = setRasterExportQualityPercent(state, 10);
    const highQuality = setRasterExportQualityPercent(state, 240);

    expect(lowQuality.rasterExportQualityPercent).toBe(25);
    expect(highQuality.rasterExportQualityPercent).toBe(100);
    expect(clampRasterExportQualityPercent(Number.NaN)).toBe(100);
  });

  it("clamps background shape padding to the supported pixel range", () => {
    expect(clampBackgroundShapePaddingPx(-12)).toBe(0);
    expect(clampBackgroundShapePaddingPx(96)).toBe(96);
    expect(clampBackgroundShapePaddingPx(240)).toBe(192);
    expect(clampBackgroundShapePaddingPx(Number.NaN)).toBe(0);
  });

  it("clamps background shape shadow values to the supported ranges", () => {
    expect(clampBackgroundShapeOpacity(-12)).toBe(0);
    expect(clampBackgroundShapeOpacity(72)).toBe(72);
    expect(clampBackgroundShapeOpacity(240)).toBe(100);
    expect(clampBackgroundShapeOffset(-96)).toBe(-64);
    expect(clampBackgroundShapeOffset(24)).toBe(24);
    expect(clampBackgroundShapeOffset(96)).toBe(64);
    expect(clampBackgroundShapeOffset(Number.NaN)).toBe(0);
  });

  it("clamps background shape tilt to the supported range", () => {
    expect(clampBackgroundShapeTilt(-90)).toBe(-60);
    expect(clampBackgroundShapeTilt(24)).toBe(24);
    expect(clampBackgroundShapeTilt(90)).toBe(60);
    expect(clampBackgroundShapeTilt(Number.NaN)).toBe(0);
  });

  it("uses the reference swatch colors as the default body palette", () => {
    const state = createDefaultQrStudioState();

    expect(state.dotsPalette).toEqual([
      "#04879c",
      "#0c3c78",
      "#090030",
      "#f30a49",
    ]);
  });

  it("keeps solid colors when gradients are disabled", () => {
    const state = createDefaultQrStudioState();
    state.dataModulesSettings.color = "#112233";
    state.dotsColorMode = "solid";

    const options = toReactQrCodeProps(state);

    expect(options.dataModulesSettings?.color).toBe("#112233");
    expect(options.gradient).toBeUndefined();
  });

  it("keeps module solid colors when finder pattern gradients are enabled", () => {
    const state = createDefaultQrStudioState();
    state.dataModulesSettings.color = "#112233";
    state.dotsColorMode = "solid";
    state.finderPatternOuterGradient.enabled = true;
    state.finderPatternInnerGradient.enabled = true;

    const options = toReactQrCodeProps(state);

    expect(options.dataModulesSettings?.color).toBe("#112233");
    expect(options.gradient).toBeUndefined();
  });

  it("omits upstream gradients for module gradient mode so finder patterns stay solid", () => {
    const state = createDefaultQrStudioState();
    state.dotsColorMode = "gradient";
    state.dataModulesGradient.enabled = true;
    state.dataModulesGradient.type = "radial";
    state.dataModulesGradient.rotation = 1.2;
    state.dataModulesGradient.colorStops = [
      { offset: 0, color: "#101010" },
      { offset: 1, color: "#fafafa" },
    ];

    const options = toReactQrCodeProps(state);

    expect(options.dataModulesSettings?.color).toBeUndefined();
    expect(options.gradient).toBeUndefined();
  });

  it("omits upstream dot colors when palette mode is enabled", () => {
    const state = createDefaultQrStudioState();
    state.dotsColorMode = "palette";
    state.dataModulesSettings.color = "#112233";
    state.dataModulesGradient.enabled = true;
    state.dataModulesGradient.type = "radial";
    state.dataModulesGradient.rotation = 1.2;
    state.dataModulesGradient.colorStops = [
      { offset: 0, color: "#101010" },
      { offset: 1, color: "#fafafa" },
    ];

    const options = toReactQrCodeProps(state);

    expect(options.dataModulesSettings?.color).toBeUndefined();
    expect(options.gradient).toBeUndefined();
  });

  it("still emits background gradient payloads when enabled", () => {
    const state = createDefaultQrStudioState();
    state.backgroundGradient.enabled = true;
    state.backgroundGradient.type = "radial";
    state.backgroundGradient.rotation = 1.2;
    state.backgroundGradient.colorStops = [
      { offset: 0, color: "#101010" },
      { offset: 1, color: "#fafafa" },
    ];

    const options = toReactQrCodeProps(state);

    expect(options.background).toEqual({
      type: "radial",
      rotation: 1.2,
      stops: [
        { offset: "0", color: "#101010" },
        { offset: "1", color: "#fafafa" },
      ],
    });
  });

  it("omits empty image values from the QR options", () => {
    const state = createDefaultQrStudioState();
    state.logo = {
      source: "url",
      value: "   ",
    };

    const options = toReactQrCodeProps(state);

    expect(options.imageSettings).toBeUndefined();
  });

  it("preserves intentionally blank content instead of swapping in a hidden URL", () => {
    const state = createDefaultQrStudioState();
    state.data = "   ";

    const options = toReactQrCodeProps(state);

    expect(options.value).toBe("");
  });

  it("passes native heart dots to the ReactQRCode renderer", () => {
    const state = createDefaultQrStudioState();
    state.dataModulesSettings.type = "heart" as typeof state.dataModulesSettings.type;

    const options = toReactQrCodeProps(state);

    expect(options.dataModulesSettings?.style).toBe("heart");
  });

  it("passes native diamond dots to the ReactQRCode renderer", () => {
    const state = createDefaultQrStudioState();
    state.dataModulesSettings.type = "diamond" as typeof state.dataModulesSettings.type;

    const options = toReactQrCodeProps(state);

    expect(options.dataModulesSettings?.style).toBe("diamond");
  });

  it("maps the shared logo asset onto ReactQRCode image settings", () => {
    const state = createDefaultQrStudioState();
    state.logo = {
      source: "url",
      value: "https://example.com/logo.png",
    };

    const options = toReactQrCodeProps(state);

    expect(options.imageSettings?.src).toBe("https://example.com/logo.png");
  });

  it("keeps upstream logo size coefficients within the full 0 to 1 range", () => {
    const zeroSizeState = createDefaultQrStudioState();
    zeroSizeState.imageOptions.imageSize = -0.2;

    const fullSizeState = createDefaultQrStudioState();
    fullSizeState.imageOptions.imageSize = 1.4;

    expect(toReactQrCodeProps(zeroSizeState).imageSettings).toBeUndefined();
    fullSizeState.logo = { source: "url", value: "https://example.com/logo.png" };
    expect(toReactQrCodeProps(fullSizeState).imageSettings?.width).toBe(308);
  });

  it("maps preset logo assets onto the upstream image field", () => {
    const state = createDefaultQrStudioState();
    state.logo = {
      source: "preset",
      presetId: "whatsapp" as never,
      presetColor: "#111827",
      value: "data:image/svg+xml,%3Csvg%20xmlns%3D%22http://www.w3.org/2000/svg%22%20/%3E",
    };

    const options = toReactQrCodeProps(state);

    expect(options.imageSettings?.src).toBe(
      "data:image/svg+xml,%3Csvg%20xmlns%3D%22http://www.w3.org/2000/svg%22%20/%3E",
    );
  });

  it("suppresses background fill and gradient when a background image is active", () => {
    const state = createDefaultQrStudioState();
    state.backgroundOptions.color = "#112233";
    state.backgroundGradient.enabled = true;
    state.backgroundGradient.type = "radial";
    state.backgroundGradient.colorStops = [
      { offset: 0, color: "#010203" },
      { offset: 1, color: "#f8f9fa" },
    ];
    state.backgroundImage = {
      source: "upload",
      value: "blob:https://new-qr-studio.local/background.png",
    };

    const options = toReactQrCodeProps(state);

    expect(options.background).toBe("transparent");
  });
});
