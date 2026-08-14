// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { dotMatrixLoaderToPresetName } from "@new-qr/qr/dot-matrix";

import {
  adaptQrcodeReactSvgForDotMatrix,
  renderQrcodeReactSvg,
  toDotMatrixQrConfig,
  toQrcodeReactProps,
} from "@/features/qr-code/motion/dot-matrix-bridge";
import { adaptCanvasSvgMarkupForDotMatrixMotion } from "@/features/qr-code/motion/canvas-svg-adapter";
import { renderDashboardQrSvgMarkup } from "@/features/qr-code/rendering/qr-svg";
import {
  createDefaultQrStudioState,
  resolveDotMatrixMotionPreset,
  setDotMatrixAnimationOptions,
} from "@/features/qr-code/model/state";
import { createDraftingQrArtworkState } from "@/features/workspace/rendering/qr-artwork";

describe("dot matrix motion bridge", () => {
  it("maps desktop loaders to preset names", () => {
    expect(dotMatrixLoaderToPresetName("neon-drift")).toBe("NeonDrift");
  });

  it("renders qrcode.react svg markup for desktop state", () => {
    const state = createDefaultQrStudioState();

    const markup = renderQrcodeReactSvg(state);

    expect(markup).toContain("<svg");
    expect(markup).toContain('d="M');
  });

  it("adapts qrcode.react svg into animatable modules", () => {
    const state = createDefaultQrStudioState();
    const adapted = adaptQrcodeReactSvgForDotMatrix(state);

    expect(adapted?.moduleCount).toBeGreaterThan(0);
    expect(adapted?.svg).toContain('class="module"');
    expect(adapted?.svg).toContain("data-column");
  });

  it("maps dot matrix state to animated qr config", () => {
    const state = setDotMatrixAnimationOptions(createDefaultQrStudioState(), {
      enabled: true,
      animated: true,
      preset: "neon-drift",
      presetCategory: "dotMatrix",
      speed: 6,
    });

    const config = toDotMatrixQrConfig(state);

    expect(config.animationPreset).toBe("NeonDrift");
    expect(config.animationSpeed).toBe(2);
    expect(config.useExternalSvg).toBe(true);
    expect(config.externalSvg).toContain('class="module"');
    expect(resolveDotMatrixMotionPreset(state.dotMatrixAnimation)).toBe("NeonDrift");
  });

  it("builds qrcode.react props from studio state", () => {
    const state = createDefaultQrStudioState();
    state.data = "https://example.com";
    state.margin = 8;

    const props = toQrcodeReactProps(state);

    expect(props.value).toBe("https://example.com");
    expect(props.marginSize).toBe(8);
    expect(props.level).toBe(state.qrOptions.errorCorrectionLevel);
  });

  it("adapts canvas svg for dot matrix motion while preserving styled markers", () => {
    const state = createDefaultQrStudioState();
    state.data = "https://styled.example";
    state.finderPatternInnerSettings.type = "heart";
    state.finderPatternOuterSettings.type = "rounded-lg";

    const canvasMarkup = renderDashboardQrSvgMarkup(createDraftingQrArtworkState(state));
    const adapted = adaptCanvasSvgMarkupForDotMatrixMotion(canvasMarkup, state);

    expect(adapted?.moduleCount).toBeGreaterThan(0);
    expect(adapted?.svg).toContain('class="module"');
    expect(adapted?.svg).toContain("data-column");
    expect(adapted?.svg).toContain('data-testid="finder-patterns-outer"');
    expect(adapted?.svg).toContain('data-testid="finder-patterns-inner"');

    const moduleTags = adapted!.svg.match(/<[^>]*class="module"[^>]*>/g) ?? [];
    const duplicateCoordinateModules = moduleTags.filter((tag, index, tags) => {
      const coordinate = `${tag.match(/data-column="(\d+)"/)?.[1]}:${tag.match(/data-row="(\d+)"/)?.[1]}`;
      return tags.findIndex((candidate) => {
        const candidateCoordinate = `${candidate.match(/data-column="(\d+)"/)?.[1]}:${candidate.match(/data-row="(\d+)"/)?.[1]}`;
        return candidateCoordinate === coordinate;
      }) !== index;
    });

    expect(duplicateCoordinateModules).toEqual([]);
  });

  it("groups fragmented module paths into one animatable target per grid cell", () => {
    const state = createDefaultQrStudioState();
    const canvasMarkup = renderDashboardQrSvgMarkup(createDraftingQrArtworkState(state));
    const adapted = adaptCanvasSvgMarkupForDotMatrixMotion(canvasMarkup, state);

    const moduleTags = adapted!.svg.match(/<[^>]*class="module"[^>]*>/g) ?? [];
    const coordinates = moduleTags.map((tag) => {
      const col = tag.match(/data-column="(\d+)"/)?.[1];
      const row = tag.match(/data-row="(\d+)"/)?.[1];
      return `${col}:${row}`;
    });

    expect(new Set(coordinates).size).toBe(coordinates.length);
    expect(adapted!.svg).toContain("<g class=\"module\"");
  });

  it("prefers canvas svg markup over qrcode.react when building config", () => {
    const state = setDotMatrixAnimationOptions(createDefaultQrStudioState(), {
      enabled: true,
      animated: true,
    });
    state.data = "https://canvas.example";

    const canvasMarkup = renderDashboardQrSvgMarkup(createDraftingQrArtworkState(state));
    const config = toDotMatrixQrConfig(state, { canvasSvgMarkup: canvasMarkup });

    expect(config.useExternalSvg).toBe(true);
    expect(config.externalSvg).toContain('class="module"');
    expect(config.externalSvg).toContain('data-testid="finder-patterns-outer"');
    expect(config.contents).toBe("https://canvas.example");
  });

  it("uses gradient fills on motion modules instead of solid module color", () => {
    const state = createDefaultQrStudioState();
    state.dotsColorMode = "gradient";
    state.dataModulesGradient = {
      enabled: true,
      type: "linear",
      rotation: 0,
      colorStops: [
        { offset: 0, color: "#101010" },
        { offset: 1, color: "#fafafa" },
      ],
    };

    const canvasMarkup = renderDashboardQrSvgMarkup(createDraftingQrArtworkState(state));
    const adapted = adaptCanvasSvgMarkupForDotMatrixMotion(canvasMarkup, state);

    expect(adapted?.svg).toContain("fill=\"url('#dot-gradient-definition')\"");
    expect(adapted?.svg).not.toMatch(/class="module"[^>]*fill="#111827"/);
  });

  it("uses palette colors on motion modules instead of solid module color", () => {
    const state = createDefaultQrStudioState();
    state.dotsColorMode = "palette";
    state.dotsPalette = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];

    const canvasMarkup = renderDashboardQrSvgMarkup(createDraftingQrArtworkState(state));
    const adapted = adaptCanvasSvgMarkupForDotMatrixMotion(canvasMarkup, state);

    expect(adapted?.svg).toContain('fill="#ff0000"');
    expect(adapted?.svg).not.toMatch(/class="module"[^>]*fill="#111827"/);
  });
});
