// @vitest-environment jsdom

import { describe, expect, it } from "vitest";
import { dotMatrixLoaderToPresetName } from "@qrafty/qr/dot-matrix";

import {
  shouldUseDotMatrixMotionPreview,
  toDotMatrixQrConfig,
} from "@/features/qr-code/motion/dot-matrix-bridge";
import { adaptCanvasSvgMarkupForDotMatrixMotion } from "@/features/qr-code/motion/canvas-svg-adapter";
import { renderDashboardQrSvgMarkup } from "@/features/qr-code/rendering/qr-svg";
import {
  createDefaultQraftyState,
  resolveDotMatrixMotionPreset,
  setDotMatrixAnimationOptions,
} from "@/features/qr-code/model/state";
import { buildAnimatedQrMarkupAtTime } from "@/features/workspace/export/pipeline/qr-frames";
import { createDraftingQrArtworkState } from "@/features/workspace/rendering/qr-artwork";

describe("dot matrix motion bridge", () => {
  it("maps desktop loaders to preset names", () => {
    expect(dotMatrixLoaderToPresetName("neon-drift")).toBe("NeonDrift");
    expect(dotMatrixLoaderToPresetName("fan-rotate")).toBe("NeonDrift");
    expect(dotMatrixLoaderToPresetName("tunnel")).toBe("NeonDrift");
    expect(dotMatrixLoaderToPresetName("wave")).toBe("NeonDrift");
    expect(dotMatrixLoaderToPresetName("scan")).toBe("NeonDrift");
  });

  it("adapts rendered qr svg into animatable modules", () => {
    const state = createDefaultQraftyState();
    const adapted = adaptCanvasSvgMarkupForDotMatrixMotion(
      renderDashboardQrSvgMarkup(createDraftingQrArtworkState(state)),
      state,
    );

    expect(adapted?.moduleCount).toBeGreaterThan(0);
    expect(adapted?.svg).toContain('class="module"');
    expect(adapted?.svg).toContain("data-column");
  });

  it("maps dot matrix state to animated qr config", () => {
    const state = setDotMatrixAnimationOptions(createDefaultQraftyState(), {
      enabled: true,
      animated: true,
      preset: "neon-drift",
      presetCategory: "dotMatrix",
      speed: 6,
      colorPreset: "neon",
    });
    state.dataModulesSettings.color = "#334155";

    const config = toDotMatrixQrConfig(state);

    expect(config.animationPreset).toBe("NeonDrift");
    expect(config.animationSpeed).toBe(2);
    expect(config.useExternalSvg).toBe(true);
    expect(config.externalSvg).toContain('class="module"');
    expect(config.dotMatrixColorBase).toBe("#334155");
    expect(config.dotMatrixColorPeak).toBe("#f8fafc");
    expect(resolveDotMatrixMotionPreset(state.dotMatrixAnimation)).toBe("NeonDrift");
  });


  it("adapts canvas svg for dot matrix motion while preserving styled markers", () => {
    const state = createDefaultQraftyState();
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
    const state = createDefaultQraftyState();
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
    const state = setDotMatrixAnimationOptions(createDefaultQraftyState(), {
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

  it("serializes non-rest module transforms into animated export frames", () => {
    const state = setDotMatrixAnimationOptions(createDefaultQraftyState(), {
      enabled: true,
      animated: true,
      loader: "neon-drift",
      preset: "neon-drift",
    });
    const canvasMarkup = renderDashboardQrSvgMarkup(createDraftingQrArtworkState(state));

    const frameMarkup = buildAnimatedQrMarkupAtTime(canvasMarkup, state, 500);
    const document = new DOMParser().parseFromString(frameMarkup, "image/svg+xml");
    const transforms = Array.from(document.querySelectorAll<SVGElement>(".module"))
      .map((moduleElement) => moduleElement.style.transform)
      .filter(Boolean);

    expect(transforms.some((transform) => /^translate\([^,]+, [^)]+\) scale\([^)]+\)$/.test(transform))).toBe(
      true,
    );
  });

  it("keeps radial modules visible in detached video frames", () => {
    const state = setDotMatrixAnimationOptions(createDefaultQraftyState(), {
      enabled: true,
      animated: true,
      loader: "radial-expand",
      preset: "radial-expand",
    });
    const canvasMarkup = renderDashboardQrSvgMarkup(createDraftingQrArtworkState(state));

    const frameMarkup = buildAnimatedQrMarkupAtTime(canvasMarkup, state, 500);
    const document = new DOMParser().parseFromString(frameMarkup, "image/svg+xml");
    const field = document.querySelector<SVGRectElement>('[data-qr-layer="motion-field"] rect');
    const clipModules = document.querySelectorAll("#qrafty-motion-field-clip > .module");

    expect(Number(field?.getAttribute("width"))).toBeGreaterThan(1);
    expect(Number(field?.getAttribute("height"))).toBeGreaterThan(1);
    expect(clipModules.length).toBeGreaterThan(0);
  });

  it("uses gradient fills on motion modules instead of solid module color", () => {
    const state = createDefaultQraftyState();
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
    const state = createDefaultQraftyState();
    state.dotsColorMode = "palette";
    state.dotsPalette = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];

    const canvasMarkup = renderDashboardQrSvgMarkup(createDraftingQrArtworkState(state));
    const adapted = adaptCanvasSvgMarkupForDotMatrixMotion(canvasMarkup, state);

    expect(adapted?.svg).toContain('fill="#ff0000"');
    expect(adapted?.svg).not.toMatch(/class="module"[^>]*fill="#111827"/);
  });

  it("keeps one animatable module per cell for palette fills", () => {
    const state = createDefaultQraftyState();
    state.dotsColorMode = "palette";
    state.dotsPalette = ["#ff0000", "#00ff00", "#0000ff", "#ffff00"];

    const canvasMarkup = renderDashboardQrSvgMarkup(createDraftingQrArtworkState(state));
    const adapted = adaptCanvasSvgMarkupForDotMatrixMotion(canvasMarkup, state);

    const moduleTags = adapted!.svg.match(/<[^>]*class="module"[^>]*>/g) ?? [];
    const coordinates = moduleTags.map((tag) => {
      const col = tag.match(/data-column="(\d+)"/)?.[1];
      const row = tag.match(/data-row="(\d+)"/)?.[1];
      return `${col}:${row}`;
    });

    expect(moduleTags.length).toBeGreaterThan(state.dotsPalette.length);
    expect(new Set(coordinates).size).toBe(coordinates.length);
  });

  it("expands merged palette fill paths back into per-cell modules", () => {
    const state = createDefaultQraftyState();
    state.dotsColorMode = "palette";
    state.dotsPalette = ["#ff0000", "#00ff00"];

    const canvasMarkup = renderDashboardQrSvgMarkup(createDraftingQrArtworkState(state));
    const adapted = adaptCanvasSvgMarkupForDotMatrixMotion(canvasMarkup, state);
    const document = new DOMParser().parseFromString(adapted!.svg, "image/svg+xml");
    const palettePaths = document.querySelectorAll(
      '[data-qr-layer="dot-palette-fill"] > path',
    );
    const modulesInsideDefs = document.querySelectorAll("defs .module");

    expect(palettePaths.length).toBeGreaterThan(state.dotsPalette.length);
    expect(modulesInsideDefs.length).toBe(0);
  });

  it("animates per-cell image slices for module image fills", () => {
    const state = createDefaultQraftyState();
    state.dotsColorMode = "image";
    state.moduleFillImage = {
      source: "upload",
      value: "data:image/png;base64,iVBORw0KGgo=",
    };

    const canvasMarkup = renderDashboardQrSvgMarkup(createDraftingQrArtworkState(state));
    const adapted = adaptCanvasSvgMarkupForDotMatrixMotion(canvasMarkup, state);
    const document = new DOMParser().parseFromString(adapted!.svg, "image/svg+xml");

    const coveringImage = document.querySelector('[data-qr-layer="unified-image-definition"]');
    const cells = document.querySelectorAll(
      '[data-qr-layer="dot-matrix-motion-modules"] > path, [data-qr-layer="dot-matrix-motion-modules"] > rect, [data-qr-layer="dot-matrix-motion-modules"] > circle',
    );
    const modules = document.querySelectorAll(".module");
    const pattern = document.querySelector("#dot-matrix-motion-image-fill");
    const patternImage = pattern?.querySelector("image");

    expect(coveringImage?.getAttribute("opacity")).toBe("0");
    expect(cells.length).toBeGreaterThan(1);
    expect(modules.length).toBeGreaterThan(1);
    expect(document.querySelectorAll("defs .module, clipPath .module").length).toBe(0);
    expect(pattern?.getAttribute("patternUnits")).toBe("userSpaceOnUse");
    expect(patternImage?.getAttribute("href")).toBe(state.moduleFillImage.value);

    for (const cell of Array.from(cells)) {
      expect(cell.getAttribute("fill")).toBe("url(#dot-matrix-motion-image-fill)");
      expect(cell.getAttribute("clip-path")).toBeNull();
    }

    const finderSources = document.querySelectorAll(
      '[data-qr-layer="unified-image-source"][data-testid^="finder-patterns-"]',
    );
    expect(finderSources.length).toBeGreaterThan(0);
    for (const finder of Array.from(finderSources)) {
      expect(finder.getAttribute("fill")).toBe("url(#dot-matrix-motion-image-fill)");
      expect(finder.getAttribute("opacity")).not.toBe("0");
    }

    const coordinates = new Set(
      Array.from(modules).map(
        (element) =>
          `${element.getAttribute("data-column")}:${element.getAttribute("data-row")}`,
      ),
    );
    expect(coordinates.size).toBe(modules.length);
  });

  it("keeps unified gradient fills on motion modules", () => {
    const state = createDefaultQraftyState();
    state.dotsColorMode = "gradient";
    state.gradientLinkMode = "unified";
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

    expect(adapted?.svg).toContain('class="module"');
    expect(adapted?.svg).toContain('fill="url(#unified-gradient-definition)"');
  });

  it("enables preserve mode for gradient and palette qr colors", () => {
    const gradientState = createDefaultQraftyState();
    gradientState.dotsColorMode = "gradient";

    const paletteState = createDefaultQraftyState();
    paletteState.dotsColorMode = "palette";

    const solidState = createDefaultQraftyState();
    solidState.dotsColorMode = "solid";

    expect(toDotMatrixQrConfig(gradientState).preserveModuleFills).toBe(true);
    expect(toDotMatrixQrConfig(paletteState).preserveModuleFills).toBe(true);
    expect(toDotMatrixQrConfig(solidState).preserveModuleFills).toBe(false);
  });

});
