/**
 * Server-safe paper-shader metadata: ids, presets, controls, and pure getters.
 *
 * This module must stay importable from React Server Components, so it only
 * depends on `@paper-design/shaders` (plain data, no "use client") and the
 * checked-in preset snapshot. It must NEVER import from
 * `@paper-design/shaders-react` (its entry carries `"use client"`, which makes
 * Next.js serve a client flight proxy on the server — data exports like
 * `meshGradientPresets` come back `undefined` there and crash module evaluation).
 *
 * Client-only rendering (shader component references) lives in
 * `./paper-shaders` (`"use client"` wrapper around this module).
 */
import { BACKGROUND_SHADER_CONTROL_CONFIG } from "@/features/canvas/rendering/paper-shaders/backgrounds";
import { BORDER_SHADER_CONTROL_CONFIG } from "@/features/canvas/rendering/paper-shaders/borders";
import { IMAGE_FILTER_SHADER_CONTROL_CONFIG } from "@/features/canvas/rendering/paper-shaders/image-filters";
import {
  type PaperShaderControlConfig,
  type PaperShaderDefinition,
  snapshotPresets,
} from "@/features/canvas/rendering/paper-shaders/shared";
import { TEXTURE_SHADER_CONTROL_CONFIG } from "@/features/canvas/rendering/paper-shaders/textures";

export type {
  // fallow-ignore-next-line unused-type
  PaperShaderBooleanControl,
  // fallow-ignore-next-line unused-type
  PaperShaderColorArrayControl,
  // fallow-ignore-next-line unused-type
  PaperShaderColorControl,
  PaperShaderControlDefinition,
  PaperShaderEnumControl,
  // fallow-ignore-next-line unused-type
  PaperShaderImageControl,
  // fallow-ignore-next-line unused-type
  PaperShaderNumberControl,
  PaperShaderParams,
  PaperShaderParamValue,
} from "@/features/canvas/rendering/paper-shaders/shared";

const PAPER_SHADER_CONTROL_CONFIG: Record<string, PaperShaderControlConfig> = {
  ...BACKGROUND_SHADER_CONTROL_CONFIG,
  ...TEXTURE_SHADER_CONTROL_CONFIG,
  ...BORDER_SHADER_CONTROL_CONFIG,
  ...IMAGE_FILTER_SHADER_CONTROL_CONFIG,
};

const PAPER_SHADER_DEFINITIONS: PaperShaderDefinition[] = [
  {
    id: "mesh-gradient",
    label: "Mesh gradient",
    group: "background",
    presets: snapshotPresets("mesh-gradient"),
    ...PAPER_SHADER_CONTROL_CONFIG["mesh-gradient"],
  },
  {
    id: "static-mesh-gradient",
    label: "Static mesh",
    group: "background",
    presets: snapshotPresets("static-mesh-gradient"),
    ...PAPER_SHADER_CONTROL_CONFIG["static-mesh-gradient"],
  },
  {
    id: "grain-gradient",
    label: "Grain gradient",
    group: "background",
    presets: snapshotPresets("grain-gradient"),
    ...PAPER_SHADER_CONTROL_CONFIG["grain-gradient"],
  },
  {
    id: "warp",
    label: "Warp",
    group: "background",
    presets: snapshotPresets("warp"),
    ...PAPER_SHADER_CONTROL_CONFIG.warp,
  },
  {
    id: "waves",
    label: "Waves",
    group: "texture",
    presets: snapshotPresets("waves"),
    ...PAPER_SHADER_CONTROL_CONFIG.waves,
  },
  {
    id: "dot-orbit",
    label: "Dot orbit",
    group: "texture",
    presets: snapshotPresets("dot-orbit"),
    ...PAPER_SHADER_CONTROL_CONFIG["dot-orbit"],
  },
  {
    id: "voronoi",
    label: "Voronoi",
    group: "background",
    presets: snapshotPresets("voronoi"),
    ...PAPER_SHADER_CONTROL_CONFIG.voronoi,
  },
  {
    id: "smoke-ring",
    label: "Smoke ring",
    group: "background",
    presets: snapshotPresets("smoke-ring"),
    ...PAPER_SHADER_CONTROL_CONFIG["smoke-ring"],
  },
  {
    id: "neuro-noise",
    label: "Neuro noise",
    group: "background",
    presets: snapshotPresets("neuro-noise"),
    ...PAPER_SHADER_CONTROL_CONFIG["neuro-noise"],
  },
  {
    id: "dot-grid",
    label: "Dot grid",
    group: "texture",
    presets: snapshotPresets("dot-grid"),
    ...PAPER_SHADER_CONTROL_CONFIG["dot-grid"],
  },
  {
    id: "simplex-noise",
    label: "Simplex noise",
    group: "background",
    presets: snapshotPresets("simplex-noise"),
    ...PAPER_SHADER_CONTROL_CONFIG["simplex-noise"],
  },
  {
    id: "metaballs",
    label: "Metaballs",
    group: "background",
    presets: snapshotPresets("metaballs"),
    ...PAPER_SHADER_CONTROL_CONFIG.metaballs,
  },
  {
    id: "perlin-noise",
    label: "Perlin noise",
    group: "texture",
    presets: snapshotPresets("perlin-noise"),
    ...PAPER_SHADER_CONTROL_CONFIG["perlin-noise"],
  },
  {
    id: "god-rays",
    label: "God rays",
    group: "background",
    presets: snapshotPresets("god-rays"),
    ...PAPER_SHADER_CONTROL_CONFIG["god-rays"],
  },
  {
    id: "spiral",
    label: "Spiral",
    group: "texture",
    presets: snapshotPresets("spiral"),
    ...PAPER_SHADER_CONTROL_CONFIG.spiral,
  },
  {
    id: "swirl",
    label: "Swirl",
    group: "background",
    presets: snapshotPresets("swirl"),
    ...PAPER_SHADER_CONTROL_CONFIG.swirl,
  },
  {
    id: "dithering",
    label: "Dithering",
    group: "texture",
    presets: snapshotPresets("dithering"),
    ...PAPER_SHADER_CONTROL_CONFIG.dithering,
  },
  {
    id: "pulsing-border",
    label: "Pulsing border",
    group: "border",
    presets: snapshotPresets("pulsing-border"),
    ...PAPER_SHADER_CONTROL_CONFIG["pulsing-border"],
  },
  {
    id: "color-panels",
    label: "Color panels",
    group: "background",
    presets: snapshotPresets("color-panels"),
    ...PAPER_SHADER_CONTROL_CONFIG["color-panels"],
  },
  {
    id: "static-radial-gradient",
    label: "Static radial",
    group: "background",
    presets: snapshotPresets("static-radial-gradient"),
    ...PAPER_SHADER_CONTROL_CONFIG["static-radial-gradient"],
  },
  {
    id: "paper-texture",
    label: "Paper texture",
    group: "texture",
    presets: snapshotPresets("paper-texture"),
    ...PAPER_SHADER_CONTROL_CONFIG["paper-texture"],
  },
  {
    id: "water",
    label: "Water",
    group: "texture",
    presets: snapshotPresets("water"),
    ...PAPER_SHADER_CONTROL_CONFIG.water,
  },
  {
    id: "fluted-glass",
    label: "Fluted glass",
    group: "image-filter",
    presets: snapshotPresets("fluted-glass"),
    ...PAPER_SHADER_CONTROL_CONFIG["fluted-glass"],
  },
  {
    id: "image-dithering",
    label: "Image dithering",
    group: "image-filter",
    presets: snapshotPresets("image-dithering"),
    ...PAPER_SHADER_CONTROL_CONFIG["image-dithering"],
  },
  {
    id: "heatmap",
    label: "Heatmap",
    group: "image-filter",
    presets: snapshotPresets("heatmap"),
    ...PAPER_SHADER_CONTROL_CONFIG.heatmap,
  },
  {
    id: "liquid-metal",
    label: "Liquid metal",
    group: "image-filter",
    presets: snapshotPresets("liquid-metal"),
    ...PAPER_SHADER_CONTROL_CONFIG["liquid-metal"],
  },
  {
    id: "halftone-dots",
    label: "Halftone dots",
    group: "image-filter",
    presets: snapshotPresets("halftone-dots"),
    ...PAPER_SHADER_CONTROL_CONFIG["halftone-dots"],
  },
  {
    id: "halftone-cmyk",
    label: "Halftone CMYK",
    group: "image-filter",
    presets: snapshotPresets("halftone-cmyk"),
    ...PAPER_SHADER_CONTROL_CONFIG["halftone-cmyk"],
  },
  {
    id: "gem-smoke",
    label: "Gem smoke",
    group: "image-filter",
    presets: snapshotPresets("gem-smoke"),
    ...PAPER_SHADER_CONTROL_CONFIG["gem-smoke"],
  },
] as const;

export type PaperShaderId = string;

export const DEFAULT_PAPER_SHADER_ID: PaperShaderId = "mesh-gradient";
const CARD_IMAGE_FILTER_SHADER_IDS = [
  "paper-texture",
  "fluted-glass",
  "water",
  "image-dithering",
  "halftone-dots",
  "halftone-cmyk",
] as const;

export function getPaperShaderDefinition(shaderId: PaperShaderId | string) {
  return (
    PAPER_SHADER_DEFINITIONS.find((definition) => definition.id === shaderId) ??
    PAPER_SHADER_DEFINITIONS[0]
  );
}

export function paperShaderHasPlayback(shaderId: PaperShaderId | string) {
  return getPaperShaderDefinition(shaderId).controls.some((control) => control.key === "speed");
}

export function getAllPaperShaderDefinitions() {
  return PAPER_SHADER_DEFINITIONS;
}

export function formatPaperShaderParamLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getCardImageFilterDefinitions() {
  return CARD_IMAGE_FILTER_SHADER_IDS.map((shaderId) => getPaperShaderDefinition(shaderId));
}

export function getCardGeneratedShaderDefinitions() {
  return PAPER_SHADER_DEFINITIONS.filter(
    (definition) =>
      definition.group !== "image-filter" &&
      !definition.requiresImage &&
      !CARD_IMAGE_FILTER_SHADER_IDS.includes(
        definition.id as (typeof CARD_IMAGE_FILTER_SHADER_IDS)[number],
      ),
  );
}

export function getPaperShaderPreset(shaderId: PaperShaderId | string, presetName?: string) {
  const definition = getPaperShaderDefinition(shaderId);
  return definition.presets.find((preset) => preset.name === presetName) ?? definition.presets[0];
}

export function createDefaultPaperShaderParams(shaderId: PaperShaderId | string) {
  return structuredClone(getPaperShaderPreset(shaderId).params);
}
