import {
  createDefaultCanvasCardPaperShader,
  createDefaultCanvasCardState,
  type CanvasCardState,
} from "@/features/canvas/model/card-state";
import { createDefaultCanvasWorkspaceQrState } from "@/features/canvas/model/document";
import { createDefaultCanvasLayers } from "@/features/canvas/model/layers/card-qr";
import {
  createCanvasImageLayer,
  createCanvasShaderLayer,
  createCanvasShapeLayer,
  createCanvasTextLayer,
} from "@/features/canvas/model/layers/factories";
import { getCanvasCardLayerId, type CanvasLayer } from "@/features/canvas/model/layers/shared";
import type { QraftyState } from "@/features/qr/model/state";
import type { ExportClockMode } from "@/features/canvas/export/pipeline/clock";

/** Tiny opaque pixel used for every image-valued fixture field. Data URLs are
 * inlined verbatim, so the export never touches the network. */
const GOLDEN_PIXEL_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

/** Stand-in for a WebGL shader capture. The shader renderer is browser-only;
 * export goldens inject this constant where `captureWorkspaceShaderSnapshots`
 * would write a frame. */
const GOLDEN_SHADER_FRAME = "data:image/png;base64,golden-shader-frame";

export type GoldenFixture = {
  name: string;
  nodeId: string;
  mode: ExportClockMode;
  videoTimeMs: number;
  /** Canned shader captures keyed by layer id, replacing the browser-only
   * WebGL capture pass. */
  shaderSnapshots?: Record<string, string>;
  build: () => { cardState: CanvasCardState; layers: CanvasLayer[]; state: QraftyState };
};

type FixtureOptions = {
  mode?: ExportClockMode;
  shaderSnapshots?: Record<string, string>;
  videoTimeMs?: number;
};

function fixture(
  name: string,
  build: () => { cardState: CanvasCardState; layers: CanvasLayer[]; state: QraftyState },
  options: FixtureOptions = {},
): GoldenFixture {
  return {
    name,
    nodeId: `golden-${name}`,
    mode: options.mode ?? "photo",
    videoTimeMs: options.videoTimeMs ?? 0,
    shaderSnapshots: options.shaderSnapshots,
    build,
  };
}

/** Default workspace inputs (default QR state + card) with optional overrides
 * applied before the card/QR layers are laid out. The default card style is a
 * paused paper shader, so callers must pass a card snapshot key when keeping
 * it. */
function base(
  nodeId: string,
  tweak?: (input: { cardState: CanvasCardState; state: QraftyState }) => void,
) {
  const state = createDefaultCanvasWorkspaceQrState();
  const cardState = createDefaultCanvasCardState();
  tweak?.({ cardState, state });
  const layers = createDefaultCanvasLayers(nodeId, state, cardState);
  return { cardState, layers, state };
}

function cardShaderSnapshot(nodeId: string) {
  return { [getCanvasCardLayerId(nodeId)]: GOLDEN_SHADER_FRAME };
}

export const GOLDEN_FIXTURES: GoldenFixture[] = [
  fixture("default", () =>
    base("golden-default", ({ cardState }) => {
      cardState.styleMode = "solid";
    }),
  ),

  fixture("card-paper-shader", () => base("golden-card-paper-shader"), {
    shaderSnapshots: cardShaderSnapshot("golden-card-paper-shader"),
  }),

  fixture("card-solid", () => {
    const input = base("golden-card-solid", ({ cardState }) => {
      cardState.styleMode = "solid";
      cardState.fill = "#1e3a8a";
      cardState.cornerRadius = 48;
    });
    return input;
  }),

  fixture("card-image", () => {
    const input = base("golden-card-image", ({ cardState }) => {
      cardState.styleMode = "image";
      cardState.cardImage = { fit: "cover", opacity: 92, source: "url", value: GOLDEN_PIXEL_PNG };
    });
    return input;
  }),

  fixture(
    "card-image-filter",
    () => {
      const input = base("golden-card-image-filter", ({ cardState }) => {
        cardState.styleMode = "image-filter";
        cardState.cardImage = {
          fit: "cover",
          opacity: 100,
          source: "url",
          value: GOLDEN_PIXEL_PNG,
        };
        cardState.imageFilter = {
          ...createDefaultCanvasCardPaperShader("image-dithering"),
          paused: true,
          speed: 0,
        };
      });
      return input;
    },
    { shaderSnapshots: cardShaderSnapshot("golden-card-image-filter") },
  ),

  fixture("qr-solid", () =>
    base("golden-qr-solid", ({ state }) => {
      state.dotsColorMode = "solid";
      state.dataModulesSettings = { ...state.dataModulesSettings, color: "#7c2d12" };
      state.finderPatternOuterSettings = { ...state.finderPatternOuterSettings, color: "#7c2d12" };
      state.finderPatternInnerSettings = { ...state.finderPatternInnerSettings, color: "#ea580c" };
    }),
  ),

  fixture("qr-linear-gradient", () =>
    base("golden-qr-linear-gradient", ({ cardState, state }) => {
      cardState.styleMode = "solid";
      state.dotsColorMode = "gradient";
      state.dataModulesGradient = {
        enabled: true,
        type: "linear",
        rotation: 35,
        colorStops: [
          { color: "#0ea5e9", offset: 0 },
          { color: "#312e81", offset: 1 },
        ],
      };
    }),
  ),

  fixture("qr-radial-gradient", () =>
    base("golden-qr-radial-gradient", ({ cardState, state }) => {
      cardState.styleMode = "solid";
      state.dotsColorMode = "gradient";
      state.dataModulesGradient = {
        enabled: true,
        type: "radial",
        rotation: 0,
        center: { x: 0.3, y: 0.35 },
        colorStops: [
          { color: "#fbbf24", offset: 0 },
          { color: "#9f1239", offset: 1 },
        ],
      };
    }),
  ),

  fixture("qr-palette", () =>
    base("golden-qr-palette", ({ cardState, state }) => {
      cardState.styleMode = "solid";
      state.dotsColorMode = "palette";
      state.dotsPalette = ["#0f172a", "#2563eb", "#f97316", "#16a34a"];
    }),
  ),

  fixture("qr-image", () =>
    base("golden-qr-image", ({ cardState, state }) => {
      cardState.styleMode = "solid";
      state.dotsColorMode = "image";
      state.moduleFillImage = { source: "url", value: GOLDEN_PIXEL_PNG };
    }),
  ),

  fixture("qr-unified-gradient", () =>
    base("golden-qr-unified-gradient", ({ cardState, state }) => {
      cardState.styleMode = "solid";
      state.gradientLinkMode = "unified";
      state.dotsColorMode = "gradient";
      state.dataModulesGradient = {
        enabled: true,
        type: "linear",
        rotation: 90,
        colorStops: [
          { color: "#10b981", offset: 0 },
          { color: "#0f766e", offset: 1 },
        ],
      };
    }),
  ),

  fixture("qr-styled", () =>
    base("golden-qr-styled", ({ cardState, state }) => {
      cardState.styleMode = "solid";
      state.data = "mailto:hello@qrafty.local";
      state.dataModulesSettings = { ...state.dataModulesSettings, type: "leaf" };
      state.finderPatternOuterSettings = { ...state.finderPatternOuterSettings, type: "leaf" };
      state.finderPatternInnerSettings = { ...state.finderPatternInnerSettings, type: "star" };
      state.logo = { source: "url", value: GOLDEN_PIXEL_PNG };
    }),
  ),

  fixture(
    "motion-neon-drift",
    () =>
      base("golden-motion-neon-drift", ({ cardState, state }) => {
        cardState.styleMode = "solid";
        state.dotMatrixAnimation = {
          ...state.dotMatrixAnimation,
          enabled: true,
          animated: true,
          preset: "neon-drift",
          loader: "neon-drift",
          presetCategory: "dotMatrix",
          colorPreset: "sunset",
        };
      }),
    { mode: "video", videoTimeMs: 1250 },
  ),

  fixture(
    "motion-deprecated-preset",
    () =>
      base("golden-motion-deprecated-preset", ({ cardState, state }) => {
        cardState.styleMode = "solid";
        state.dotMatrixAnimation = {
          ...state.dotMatrixAnimation,
          enabled: true,
          animated: true,
          // "wave" is a deprecated loader id; resolution must fall back to the
          // loader field.
          preset: "wave",
          loader: "diamond-expand",
          presetCategory: "dotMatrix",
        };
      }),
    { mode: "video", videoTimeMs: 800 },
  ),

  fixture("layers-text-shape", () => {
    const nodeId = "golden-layers-text-shape";
    const input = base(nodeId, ({ cardState }) => {
      cardState.styleMode = "solid";
    });
    input.layers = [
      ...input.layers,
      createCanvasTextLayer(nodeId, {
        id: `${nodeId}:text:golden-text`,
        text: "Scan me",
        x: 60,
        y: 80,
        zIndex: 2,
      }),
      createCanvasShapeLayer(nodeId, "line", {
        id: `${nodeId}:shape:golden-line`,
        x: 40,
        y: 200,
        width: 300,
        rotation: 12,
        zIndex: 3,
      }),
    ];
    return input;
  }),

  fixture(
    "layers-image-shader",
    () => {
      const nodeId = "golden-layers-image-shader";
      const input = base(nodeId, ({ cardState }) => {
        cardState.styleMode = "solid";
      });
      input.layers = [
        ...input.layers,
        createCanvasImageLayer(nodeId, {
          id: `${nodeId}:image:golden-image`,
          imageSource: "url",
          imageValue: GOLDEN_PIXEL_PNG,
          imageFit: "cover",
          width: 160,
          height: 160,
          x: 640,
          y: 120,
          zIndex: 2,
        }),
        createCanvasShaderLayer(nodeId, "voronoi", {
          id: `${nodeId}:shader:golden-shader`,
          width: 320,
          height: 200,
          x: 400,
          y: 500,
          opacity: 0.6,
          zIndex: 1,
        }),
      ];
      return input;
    },
    {
      shaderSnapshots: {
        "golden-layers-image-shader:shader:golden-shader": GOLDEN_SHADER_FRAME,
      },
    },
  ),

  fixture(
    "composite",
    () => {
      const nodeId = "golden-composite";
      const input = base(nodeId, ({ state }) => {
        state.dotsColorMode = "gradient";
        state.dataModulesGradient = {
          enabled: true,
          type: "linear",
          rotation: 45,
          colorStops: [
            { color: "#7c3aed", offset: 0 },
            { color: "#db2777", offset: 1 },
          ],
        };
      });
      input.layers = [
        ...input.layers,
        createCanvasTextLayer(nodeId, {
          id: `${nodeId}:text:golden-caption`,
          text: "Follow us",
          x: 80,
          y: 920,
          zIndex: 3,
        }),
        createCanvasShapeLayer(nodeId, "burst-star", {
          id: `${nodeId}:shape:golden-star`,
          fill: "#facc15",
          x: 900,
          y: 90,
          width: 96,
          height: 96,
          zIndex: 4,
        }),
      ];
      return input;
    },
    { shaderSnapshots: cardShaderSnapshot("golden-composite") },
  ),
];
