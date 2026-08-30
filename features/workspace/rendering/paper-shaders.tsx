"use client"

import type { ComponentType } from "react"
import {
  DitheringShapes,
  DitheringTypes,
  DotGridShapes,
  GemSmokeShapes,
  GlassDistortionShapes,
  GlassGridShapes,
  GrainGradientShapes,
  HalftoneCmykTypes,
  HalftoneDotsGrids,
  HalftoneDotsTypes,
  LiquidMetalShapes,
  PulsingBorderAspectRatios,
  WarpPatterns,
  colorPanelsMeta,
  gemSmokeMeta,
  godRaysMeta,
  grainGradientMeta,
  heatmapMeta,
  meshGradientMeta,
  metaballsMeta,
  pulsingBorderMeta,
  simplexNoiseMeta,
  smokeRingMeta,
  staticMeshGradientMeta,
  staticRadialGradientMeta,
  swirlMeta,
  voronoiMeta,
  warpMeta,
} from "@paper-design/shaders"
import {
  ColorPanels,
  Dithering,
  DotGrid,
  DotOrbit,
  FlutedGlass,
  GemSmoke,
  GodRays,
  GrainGradient,
  HalftoneCmyk,
  HalftoneDots,
  Heatmap,
  ImageDithering,
  LiquidMetal,
  MeshGradient,
  Metaballs,
  NeuroNoise,
  PaperTexture,
  PerlinNoise,
  PulsingBorder,
  SimplexNoise,
  SmokeRing,
  Spiral,
  StaticMeshGradient,
  StaticRadialGradient,
  Swirl,
  Voronoi,
  Warp,
  Water,
  Waves,
  colorPanelsPresets,
  ditheringPresets,
  dotGridPresets,
  dotOrbitPresets,
  flutedGlassPresets,
  gemSmokePresets,
  godRaysPresets,
  grainGradientPresets,
  halftoneCmykPresets,
  halftoneDotsPresets,
  heatmapPresets,
  imageDitheringPresets,
  liquidMetalPresets,
  meshGradientPresets,
  metaballsPresets,
  neuroNoisePresets,
  paperTexturePresets,
  perlinNoisePresets,
  pulsingBorderPresets,
  simplexNoisePresets,
  smokeRingPresets,
  spiralPresets,
  staticMeshGradientPresets,
  staticRadialGradientPresets,
  swirlPresets,
  voronoiPresets,
  warpPresets,
  waterPresets,
  wavesPresets,
} from "@paper-design/shaders-react"

export type PaperShaderParamValue =
  | boolean
  | number
  | number[]
  | number[][]
  | string
  | string[]
  | undefined

export type PaperShaderParams = Record<string, PaperShaderParamValue>

type PaperShaderPreset = {
  name: string
  params: PaperShaderParams
}

type PaperShaderComponent = ComponentType<Record<string, unknown>>

type PaperShaderGroup = "background" | "texture" | "border" | "image-filter"

export type PaperShaderNumberControl = {
  key: string
  max: number
  min: number
  order: number
  step?: number
  type: "number"
}

export type PaperShaderEnumControl = {
  key: string
  options: string[]
  order: number
  type: "enum"
}

export type PaperShaderBooleanControl = {
  key: string
  order: number
  type: "boolean"
}

export type PaperShaderColorControl = {
  key: string
  order: number
  type: "color"
}

export type PaperShaderColorArrayControl = {
  key: "colors"
  order: number
  type: "colors"
}

export type PaperShaderImageControl = {
  key: "image"
  order: number
  type: "image"
}

export type PaperShaderControlDefinition =
  | PaperShaderBooleanControl
  | PaperShaderColorArrayControl
  | PaperShaderColorControl
  | PaperShaderEnumControl
  | PaperShaderImageControl
  | PaperShaderNumberControl

type PaperShaderRenderOptions = {
  maxPixelCount?: number
  minPixelRatio?: number
}

type PaperShaderDefinition = {
  id: string
  label: string
  group: PaperShaderGroup
  component: PaperShaderComponent
  controls: PaperShaderControlDefinition[]
  hiddenParams: string[]
  maxColorCount?: number
  presets: PaperShaderPreset[]
  renderOptions?: PaperShaderRenderOptions
  requiresImage?: boolean
}

function asPaperShaderComponent(component: unknown) {
  return component as unknown as PaperShaderComponent
}

function coercePresets<TParams extends PaperShaderParams>(
  presets: Array<{ name: string; params: TParams }>,
): PaperShaderPreset[] {
  return presets.map((preset) => ({
    name: preset.name,
    params: structuredClone(preset.params),
  }))
}

const COMMON_HIDDEN_PARAMS = ["frame", "speed", "originX", "originY", "worldWidth", "worldHeight"]
const IMAGE_SHADER_HIDDEN_PARAMS = [...COMMON_HIDDEN_PARAMS, "image"]
const SHADER_FIT_OPTIONS = ["contain", "cover"]
const HIGH_RES_SHADER_MAX_PIXEL_COUNT = 6016 * 3384

function color(key: string, order: number): PaperShaderColorControl {
  return { key, order, type: "color" }
}

function number(
  key: string,
  min: number,
  max: number,
  order: number,
  step?: number,
): PaperShaderNumberControl {
  return { key, max, min, order, step, type: "number" }
}

function option(key: string, options: string[], order: number): PaperShaderEnumControl {
  return { key, options, order, type: "enum" }
}

function toggle(key: string, order: number): PaperShaderBooleanControl {
  return { key, order, type: "boolean" }
}

function controls(...items: PaperShaderControlDefinition[]) {
  return items.sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))
}

function withColors(
  maxColorCount: number,
  items: PaperShaderControlDefinition[],
): {
  controls: PaperShaderControlDefinition[]
  maxColorCount: number
} {
  return {
    controls: controls({ key: "colors", order: 90, type: "colors" }, ...items),
    maxColorCount,
  }
}

function withImageControls(items: PaperShaderControlDefinition[]) {
  return controls({ key: "image", order: 0, type: "image" }, ...items)
}

const PAPER_SHADER_CONTROL_CONFIG: Record<
  string,
  Pick<
    PaperShaderDefinition,
    "controls" | "hiddenParams" | "maxColorCount" | "renderOptions" | "requiresImage"
  >
> = {
  "mesh-gradient": {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(meshGradientMeta.maxColorCount, [
      number("distortion", 0, 1, 200),
      number("swirl", 0, 1, 201),
      number("grainMixer", 0, 1, 202),
      number("grainOverlay", 0, 1, 203),
      number("speed", 0, 2, 300),
      number("scale", 0.01, 4, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
    ]),
  },
  "static-mesh-gradient": {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(staticMeshGradientMeta.maxColorCount, [
      number("positions", 0, 100, 200),
      number("waveX", 0, 1, 201),
      number("waveXShift", 0, 1, 202),
      number("waveY", 0, 1, 203),
      number("waveYShift", 0, 1, 204),
      number("mixing", 0, 1, 205),
      number("grainMixer", 0, 1, 206),
      number("grainOverlay", 0, 1, 207),
      number("scale", 0.01, 4, 300),
      number("rotation", 0, 360, 301, 1),
      number("offsetX", -1, 1, 302),
      number("offsetY", -1, 1, 303),
    ]),
  },
  "grain-gradient": {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(grainGradientMeta.maxColorCount, [
      color("colorBack", 100),
      number("softness", 0, 1, 200),
      number("intensity", 0, 1, 201),
      number("noise", 0, 1, 202),
      option("shape", Object.keys(GrainGradientShapes), 203),
      number("speed", 0, 2, 300),
      number("scale", 0.01, 4, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
    ]),
  },
  warp: {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(warpMeta.maxColorCount, [
      number("proportion", 0, 1, 100),
      number("softness", 0, 1, 101),
      number("distortion", 0, 1, 102),
      number("swirl", 0, 1, 103),
      number("swirlIterations", 0, 20, 104),
      option("shape", Object.keys(WarpPatterns), 105),
      number("shapeScale", 0, 1, 106),
      number("speed", 0, 20, 300),
      number("scale", 0.01, 5, 301),
      number("rotation", 0, 360, 302, 1),
    ]),
  },
  waves: {
    controls: controls(
      color("colorBack", 100),
      color("colorFront", 101),
      number("frequency", 0, 2, 300),
      number("amplitude", 0, 1, 301),
      number("spacing", 0, 2, 302),
      number("proportion", 0, 1, 303),
      number("softness", 0, 1, 304),
      number("shape", 0, 3, 350),
      number("scale", 0.01, 4, 400),
      number("rotation", 0, 360, 401, 1),
    ),
    hiddenParams: COMMON_HIDDEN_PARAMS,
    renderOptions: { maxPixelCount: HIGH_RES_SHADER_MAX_PIXEL_COUNT },
  },
  "dot-orbit": {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(10, [
      color("colorBack", 100),
      number("stepsPerColor", 1, 4, 200, 1),
      number("size", 0, 1, 201),
      number("sizeRange", 0, 1, 202),
      number("spreading", 0, 1, 203),
      number("speed", 0, 20, 300),
      number("scale", 0.01, 5, 301),
    ]),
  },
  voronoi: {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(voronoiMeta.maxColorCount, [
      color("colorGlow", 100),
      color("colorGap", 101),
      number("stepsPerColor", 1, 3, 200, 1),
      number("distortion", 0, 0.5, 201),
      number("gap", 0, 0.1, 202),
      number("glow", 0, 1, 203),
      number("speed", 0, 1, 300),
      number("scale", 0.01, 4, 301),
      number("rotation", 0, 360, 302, 1),
    ]),
  },
  "smoke-ring": {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(smokeRingMeta.maxColorCount, [
      color("colorBack", 100),
      number("noiseScale", 0.01, 5, 200),
      number("noiseIterations", 1, smokeRingMeta.maxNoiseIterations, 201, 1),
      number("radius", 0, 1, 202),
      number("thickness", 0.01, 1, 203),
      number("innerShape", 0, 4, 204),
      number("speed", 0, 4, 300),
      number("scale", 0.01, 4, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
    ]),
  },
  "neuro-noise": {
    controls: controls(
      color("colorFront", 100),
      color("colorMid", 101),
      color("colorBack", 102),
      number("brightness", 0, 1, 200),
      number("contrast", 0, 1, 201),
      number("speed", 0, 2, 300),
      number("scale", 0.01, 4, 301),
      number("rotation", 0, 360, 302, 1),
    ),
    hiddenParams: COMMON_HIDDEN_PARAMS,
  },
  "dot-grid": {
    controls: controls(
      color("colorBack", 100),
      color("colorFill", 101),
      color("colorStroke", 102),
      option("shape", Object.keys(DotGridShapes), 199),
      number("size", 1, 100, 200),
      number("gapX", 2, 500, 201),
      number("gapY", 2, 500, 202),
      number("strokeWidth", 0, 50, 203),
      number("sizeRange", 0, 1, 204),
      number("opacityRange", 0, 1, 205),
      number("rotation", 0, 360, 303, 1),
    ),
    hiddenParams: COMMON_HIDDEN_PARAMS,
    renderOptions: { maxPixelCount: HIGH_RES_SHADER_MAX_PIXEL_COUNT },
  },
  "simplex-noise": {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(simplexNoiseMeta.maxColorCount, [
      number("stepsPerColor", 1, 10, 300, 1),
      number("softness", 0, 1, 301),
      number("speed", 0, 2, 400),
      number("scale", 0.01, 4, 401),
      number("rotation", 0, 360, 402, 1),
    ]),
  },
  metaballs: {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(metaballsMeta.maxColorCount, [
      color("colorBack", 100),
      number("count", 1, metaballsMeta.maxBallsCount, 200, 1),
      number("size", 0, 1, 201),
      number("speed", 0, 2, 300),
      number("scale", 0.01, 4, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
    ]),
  },
  "perlin-noise": {
    controls: controls(
      color("colorBack", 100),
      color("colorFront", 101),
      number("proportion", 0, 1, 200),
      number("softness", 0, 1, 201),
      number("octaveCount", 1, 8, 202, 1),
      number("persistence", 0.3, 1, 203),
      number("lacunarity", 1.5, 10, 204),
      number("speed", 0, 0.5, 300),
      number("scale", 0.01, 4, 301),
      number("rotation", 0, 360, 302, 1),
    ),
    hiddenParams: COMMON_HIDDEN_PARAMS,
  },
  "god-rays": {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(godRaysMeta.maxColorCount, [
      color("colorBack", 100),
      color("colorBloom", 101),
      number("bloom", 0, 1, 200),
      number("intensity", 0, 1, 201),
      number("density", 0, 1, 204),
      number("spotty", 0, 1, 205),
      number("midSize", 0, 1, 206),
      number("midIntensity", 0, 1, 207),
      number("speed", 0, 2, 300),
      number("scale", 0.01, 4, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
    ]),
  },
  spiral: {
    controls: controls(
      color("colorBack", 100),
      color("colorFront", 101),
      number("density", 0, 1, 200),
      number("distortion", 0, 1, 201),
      number("strokeWidth", 0, 1, 202),
      number("strokeTaper", 0, 1, 203),
      number("strokeCap", 0, 1, 204),
      number("noise", 0, 1, 205),
      number("noiseFrequency", 0, 1, 206),
      number("softness", 0, 1, 207),
      number("speed", 0, 2, 300),
      number("scale", 0.01, 4, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
    ),
    hiddenParams: COMMON_HIDDEN_PARAMS,
  },
  swirl: {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(swirlMeta.maxColorCount, [
      color("colorBack", 100),
      number("bandCount", 0, 15, 200, 1),
      number("twist", 0, 1, 201),
      number("center", 0, 1, 202),
      number("proportion", 0, 1, 203),
      number("softness", 0, 1, 204),
      number("noise", 0, 1, 205),
      number("noiseFrequency", 0, 1, 206),
      number("speed", 0, 2, 300),
      number("scale", 0.01, 4, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
    ]),
  },
  dithering: {
    controls: controls(
      color("colorBack", 100),
      color("colorFront", 101),
      option("shape", Object.keys(DitheringShapes), 200),
      option("type", Object.keys(DitheringTypes), 201),
      number("size", 1, 20, 202),
      number("speed", 0, 2, 300),
      number("scale", 0.01, 4, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
    ),
    hiddenParams: COMMON_HIDDEN_PARAMS,
  },
  "pulsing-border": {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(pulsingBorderMeta.maxColorCount, [
      color("colorBack", 100),
      number("roundness", 0, 1, 200),
      number("thickness", 0, 1, 201),
      number("softness", 0, 1, 202),
      option("aspectRatio", Object.keys(PulsingBorderAspectRatios), 204),
      number("intensity", 0, 1, 205),
      number("bloom", 0, 1, 206),
      number("spotSize", 0, 1, 206),
      number("spots", 1, pulsingBorderMeta.maxSpots, 207, 1),
      number("pulse", 0, 1, 207),
      number("smoke", 0, 1, 208),
      number("smokeSize", 0, 1, 209),
      number("speed", 0, 2, 300),
      number("scale", 0.01, 1.5, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
      number("margin", 0, 1, 403),
      number("marginLeft", 0, 0.5, 403),
      number("marginRight", 0, 0.5, 403),
      number("marginTop", 0, 0.5, 403),
      number("marginBottom", 0, 0.5, 403),
    ]),
  },
  "color-panels": {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(colorPanelsMeta.maxColorCount, [
      color("colorBack", 100),
      number("density", 0.25, 7, 200),
      number("angle1", -1, 1, 201),
      number("angle2", -1, 1, 202),
      number("length", 0, 3, 203),
      toggle("edges", 204),
      number("blur", 0, 0.5, 205),
      number("fadeIn", 0, 1, 205),
      number("fadeOut", 0, 1, 207),
      number("gradient", 0, 1, 208),
      number("speed", 0, 4, 300),
      number("scale", 0.01, 4, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
    ]),
  },
  "static-radial-gradient": {
    hiddenParams: COMMON_HIDDEN_PARAMS,
    ...withColors(staticRadialGradientMeta.maxColorCount, [
      color("colorBack", 100),
      number("radius", 0, 3, 200),
      number("focalDistance", 0, 3, 201),
      number("falloff", -1, 1, 201),
      number("focalAngle", 0, 360, 202, 1),
      number("mixing", 0, 1, 204),
      number("distortion", 0, 1, 205),
      number("distortionShift", -1, 1, 206),
      number("distortionFreq", 0, 20, 207, 1),
      number("grainMixer", 0, 1, 208),
      number("grainOverlay", 0, 1, 209),
      number("offsetX", -1, 1, 300),
      number("offsetY", -1, 1, 301),
    ]),
  },
  "paper-texture": {
    controls: controls(
      color("colorBack", 100),
      color("colorFront", 101),
      number("contrast", 0, 1, 200),
      number("roughness", 0, 1, 201),
      number("fiber", 0, 1, 202),
      number("fiberSize", 0.01, 1, 203),
      number("crumples", 0, 1, 204),
      number("crumpleSize", 0.01, 1, 205),
      number("folds", 0, 1, 206),
      number("foldCount", 1, 15, 207, 1),
      number("fade", 0, 1, 208),
      number("drops", 0, 1, 209),
      number("seed", 0, 1000, 250, 1),
      number("scale", 0.5, 4, 300),
      option("fit", SHADER_FIT_OPTIONS, 301),
    ),
    hiddenParams: ["frame", "speed", "rotation", "offsetX", "offsetY", "originX", "originY", "worldWidth", "worldHeight"],
  },
  water: {
    controls: controls(
      color("colorBack", 100),
      color("colorHighlight", 101),
      number("highlights", 0, 1, 200),
      number("layering", 0, 1, 201),
      number("edges", 0, 1, 202),
      number("waves", 0, 1, 203),
      number("caustic", 0, 1, 204),
      number("size", 0.01, 5, 205),
      number("speed", 0, 3, 300),
      number("scale", 0.1, 4, 301),
      option("fit", SHADER_FIT_OPTIONS, 302),
    ),
    hiddenParams: ["frame", "speed", "rotation", "offsetX", "offsetY", "originX", "originY", "worldWidth", "worldHeight"],
  },
  "fluted-glass": {
    controls: withImageControls([
      color("colorBack", 100),
      color("colorShadow", 101),
      color("colorHighlight", 102),
      number("shadows", 0, 1, 200),
      number("highlights", 0, 1, 201),
      number("size", 0.01, 1, 210, 0.01),
      option("shape", Object.keys(GlassGridShapes), 211),
      number("angle", 0, 180, 212),
      option("distortionShape", Object.keys(GlassDistortionShapes), 213),
      number("distortion", 0, 1, 214),
      number("shift", -1, 1, 215),
      number("stretch", 0, 1, 216),
      number("blur", 0, 1, 220),
      number("edges", 0, 1, 221),
      number("margin", 0, 0.5, 500),
      number("grainMixer", 0, 1, 550),
      number("grainOverlay", 0, 1, 551),
      number("scale", 0.5, 4, 600),
      option("fit", SHADER_FIT_OPTIONS, 604),
    ]),
    hiddenParams: [...IMAGE_SHADER_HIDDEN_PARAMS, "rotation", "offsetX", "offsetY", "marginLeft", "marginRight", "marginTop", "marginBottom"],
    requiresImage: true,
  },
  "image-dithering": {
    controls: withImageControls([
      color("colorBack", 100),
      color("colorFront", 102),
      color("colorHighlight", 103),
      toggle("originalColors", 104),
      toggle("inverted", 105),
      option("type", Object.keys(DitheringTypes), 200),
      number("size", 1, 20, 201),
      number("colorSteps", 1, 7, 202, 1),
      number("scale", 0.5, 4, 300),
      option("fit", SHADER_FIT_OPTIONS, 301),
    ]),
    hiddenParams: [...IMAGE_SHADER_HIDDEN_PARAMS, "rotation", "offsetX", "offsetY"],
    requiresImage: true,
  },
  heatmap: {
    hiddenParams: IMAGE_SHADER_HIDDEN_PARAMS,
    requiresImage: true,
    ...withColors(heatmapMeta.maxColorCount, [
      { key: "image", order: 0, type: "image" },
      color("colorBack", 102),
      number("contour", 0, 1, 103),
      number("angle", 0, 360, 104, 1),
      number("noise", 0, 1, 105),
      number("innerGlow", 0, 1, 106),
      number("outerGlow", 0, 1, 107),
      number("speed", 0, 2, 300),
      number("scale", 0.01, 4, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
    ]),
  },
  "liquid-metal": {
    controls: withImageControls([
      color("colorBack", 100),
      color("colorTint", 101),
      option("shape", Object.keys(LiquidMetalShapes), 102),
      number("repetition", 1, 10, 200),
      number("softness", 0, 1, 201),
      number("shiftRed", -1, 1, 202),
      number("shiftBlue", -1, 1, 203),
      number("distortion", 0, 1, 204),
      number("contour", 0, 1, 205),
      number("angle", 0, 360, 206, 1),
      number("speed", 0, 4, 300),
      number("scale", 0.2, 4, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
      option("fit", SHADER_FIT_OPTIONS, 305),
    ]),
    hiddenParams: IMAGE_SHADER_HIDDEN_PARAMS,
    requiresImage: true,
  },
  "halftone-dots": {
    controls: withImageControls([
      color("colorBack", 100),
      color("colorFront", 101),
      toggle("originalColors", 102),
      option("type", Object.keys(HalftoneDotsTypes), 201),
      option("grid", Object.keys(HalftoneDotsGrids), 202),
      toggle("inverted", 203),
      number("size", 0.01, 1, 300, 0.001),
      number("radius", 0, 2, 301),
      number("contrast", 0.01, 1, 302),
      number("grainMixer", 0, 1, 350),
      number("grainOverlay", 0, 1, 351),
      number("grainSize", 0, 1, 352),
      number("scale", 0.1, 4, 400),
      number("offsetX", -1, 1, 401),
      number("offsetY", -1, 1, 402),
      number("rotation", 0, 360, 420, 1),
      option("fit", SHADER_FIT_OPTIONS, 450),
    ]),
    hiddenParams: IMAGE_SHADER_HIDDEN_PARAMS,
    requiresImage: true,
  },
  "halftone-cmyk": {
    controls: withImageControls([
      color("colorBack", 100),
      color("colorC", 101),
      color("colorM", 102),
      color("colorY", 103),
      color("colorK", 104),
      number("size", 0.01, 1, 120, 0.01),
      number("gridNoise", 0, 1, 121, 0.01),
      option("type", Object.keys(HalftoneCmykTypes), 123),
      number("softness", 0, 1, 124, 0.01),
      number("contrast", 0, 2, 130, 0.01),
      number("gainC", -1, 1, 200, 0.01),
      number("gainM", -1, 1, 201, 0.01),
      number("gainY", -1, 1, 202, 0.01),
      number("gainK", -1, 1, 203, 0.01),
      number("floodC", 0, 1, 210, 0.01),
      number("floodM", 0, 1, 211, 0.01),
      number("floodY", 0, 1, 212, 0.01),
      number("floodK", 0, 1, 213, 0.01),
      number("grainMixer", 0, 1, 350),
      number("grainOverlay", 0, 1, 351),
      number("grainSize", 0, 1, 352),
      number("offsetX", -1, 1, 401),
      number("offsetY", -1, 1, 402),
      number("rotation", 0, 360, 420, 1),
      number("scale", 0, 4, 420),
      option("fit", SHADER_FIT_OPTIONS, 450),
    ]),
    hiddenParams: IMAGE_SHADER_HIDDEN_PARAMS,
    requiresImage: true,
  },
  "gem-smoke": {
    hiddenParams: IMAGE_SHADER_HIDDEN_PARAMS,
    requiresImage: true,
    ...withColors(gemSmokeMeta.maxColorCount, [
      { key: "image", order: 0, type: "image" },
      color("colorBack", 100),
      color("colorInner", 101),
      option("shape", Object.keys(GemSmokeShapes), 102),
      number("innerDistortion", 0, 1, 201),
      number("outerDistortion", 0, 1, 202),
      number("outerGlow", 0, 1, 203),
      number("innerGlow", 0, 1, 204),
      number("offset", -1, 1, 205),
      number("angle", 0, 360, 250, 1),
      number("size", 0.1, 1, 251),
      number("speed", 0, 4, 300),
      number("scale", 0.1, 4, 301),
      number("rotation", 0, 360, 302, 1),
      number("offsetX", -1, 1, 303),
      number("offsetY", -1, 1, 304),
      option("fit", SHADER_FIT_OPTIONS, 305),
    ]),
  },
}

const PAPER_SHADER_DEFINITIONS: PaperShaderDefinition[] = [
  {
    id: "mesh-gradient",
    label: "Mesh gradient",
    group: "background",
    component: asPaperShaderComponent(MeshGradient),
    presets: coercePresets(meshGradientPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["mesh-gradient"],
  },
  {
    id: "static-mesh-gradient",
    label: "Static mesh",
    group: "background",
    component: asPaperShaderComponent(StaticMeshGradient),
    presets: coercePresets(staticMeshGradientPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["static-mesh-gradient"],
  },
  {
    id: "grain-gradient",
    label: "Grain gradient",
    group: "background",
    component: asPaperShaderComponent(GrainGradient),
    presets: coercePresets(grainGradientPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["grain-gradient"],
  },
  {
    id: "warp",
    label: "Warp",
    group: "background",
    component: asPaperShaderComponent(Warp),
    presets: coercePresets(warpPresets),
    ...PAPER_SHADER_CONTROL_CONFIG.warp,
  },
  {
    id: "waves",
    label: "Waves",
    group: "texture",
    component: asPaperShaderComponent(Waves),
    presets: coercePresets(wavesPresets),
    ...PAPER_SHADER_CONTROL_CONFIG.waves,
  },
  {
    id: "dot-orbit",
    label: "Dot orbit",
    group: "texture",
    component: asPaperShaderComponent(DotOrbit),
    presets: coercePresets(dotOrbitPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["dot-orbit"],
  },
  {
    id: "voronoi",
    label: "Voronoi",
    group: "background",
    component: asPaperShaderComponent(Voronoi),
    presets: coercePresets(voronoiPresets),
    ...PAPER_SHADER_CONTROL_CONFIG.voronoi,
  },
  {
    id: "smoke-ring",
    label: "Smoke ring",
    group: "background",
    component: asPaperShaderComponent(SmokeRing),
    presets: coercePresets(smokeRingPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["smoke-ring"],
  },
  {
    id: "neuro-noise",
    label: "Neuro noise",
    group: "background",
    component: asPaperShaderComponent(NeuroNoise),
    presets: coercePresets(neuroNoisePresets),
    ...PAPER_SHADER_CONTROL_CONFIG["neuro-noise"],
  },
  {
    id: "dot-grid",
    label: "Dot grid",
    group: "texture",
    component: asPaperShaderComponent(DotGrid),
    presets: coercePresets(dotGridPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["dot-grid"],
  },
  {
    id: "simplex-noise",
    label: "Simplex noise",
    group: "background",
    component: asPaperShaderComponent(SimplexNoise),
    presets: coercePresets(simplexNoisePresets),
    ...PAPER_SHADER_CONTROL_CONFIG["simplex-noise"],
  },
  {
    id: "metaballs",
    label: "Metaballs",
    group: "background",
    component: asPaperShaderComponent(Metaballs),
    presets: coercePresets(metaballsPresets),
    ...PAPER_SHADER_CONTROL_CONFIG.metaballs,
  },
  {
    id: "perlin-noise",
    label: "Perlin noise",
    group: "texture",
    component: asPaperShaderComponent(PerlinNoise),
    presets: coercePresets(perlinNoisePresets),
    ...PAPER_SHADER_CONTROL_CONFIG["perlin-noise"],
  },
  {
    id: "god-rays",
    label: "God rays",
    group: "background",
    component: asPaperShaderComponent(GodRays),
    presets: coercePresets(godRaysPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["god-rays"],
  },
  {
    id: "spiral",
    label: "Spiral",
    group: "texture",
    component: asPaperShaderComponent(Spiral),
    presets: coercePresets(spiralPresets),
    ...PAPER_SHADER_CONTROL_CONFIG.spiral,
  },
  {
    id: "swirl",
    label: "Swirl",
    group: "background",
    component: asPaperShaderComponent(Swirl),
    presets: coercePresets(swirlPresets),
    ...PAPER_SHADER_CONTROL_CONFIG.swirl,
  },
  {
    id: "dithering",
    label: "Dithering",
    group: "texture",
    component: asPaperShaderComponent(Dithering),
    presets: coercePresets(ditheringPresets),
    ...PAPER_SHADER_CONTROL_CONFIG.dithering,
  },
  {
    id: "pulsing-border",
    label: "Pulsing border",
    group: "border",
    component: asPaperShaderComponent(PulsingBorder),
    presets: coercePresets(pulsingBorderPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["pulsing-border"],
  },
  {
    id: "color-panels",
    label: "Color panels",
    group: "background",
    component: asPaperShaderComponent(ColorPanels),
    presets: coercePresets(colorPanelsPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["color-panels"],
  },
  {
    id: "static-radial-gradient",
    label: "Static radial",
    group: "background",
    component: asPaperShaderComponent(StaticRadialGradient),
    presets: coercePresets(staticRadialGradientPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["static-radial-gradient"],
  },
  {
    id: "paper-texture",
    label: "Paper texture",
    group: "texture",
    component: asPaperShaderComponent(PaperTexture),
    presets: coercePresets(paperTexturePresets),
    ...PAPER_SHADER_CONTROL_CONFIG["paper-texture"],
  },
  {
    id: "water",
    label: "Water",
    group: "texture",
    component: asPaperShaderComponent(Water),
    presets: coercePresets(waterPresets),
    ...PAPER_SHADER_CONTROL_CONFIG.water,
  },
  {
    id: "fluted-glass",
    label: "Fluted glass",
    group: "image-filter",
    component: asPaperShaderComponent(FlutedGlass),
    presets: coercePresets(flutedGlassPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["fluted-glass"],
  },
  {
    id: "image-dithering",
    label: "Image dithering",
    group: "image-filter",
    component: asPaperShaderComponent(ImageDithering),
    presets: coercePresets(imageDitheringPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["image-dithering"],
  },
  {
    id: "heatmap",
    label: "Heatmap",
    group: "image-filter",
    component: asPaperShaderComponent(Heatmap),
    presets: coercePresets(heatmapPresets),
    ...PAPER_SHADER_CONTROL_CONFIG.heatmap,
  },
  {
    id: "liquid-metal",
    label: "Liquid metal",
    group: "image-filter",
    component: asPaperShaderComponent(LiquidMetal),
    presets: coercePresets(liquidMetalPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["liquid-metal"],
  },
  {
    id: "halftone-dots",
    label: "Halftone dots",
    group: "image-filter",
    component: asPaperShaderComponent(HalftoneDots),
    presets: coercePresets(halftoneDotsPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["halftone-dots"],
  },
  {
    id: "halftone-cmyk",
    label: "Halftone CMYK",
    group: "image-filter",
    component: asPaperShaderComponent(HalftoneCmyk),
    presets: coercePresets(halftoneCmykPresets),
    ...PAPER_SHADER_CONTROL_CONFIG["halftone-cmyk"],
  },
  {
    id: "gem-smoke",
    label: "Gem smoke",
    group: "image-filter",
    component: asPaperShaderComponent(GemSmoke),
    presets: coercePresets(gemSmokePresets),
    ...PAPER_SHADER_CONTROL_CONFIG["gem-smoke"],
  },
] as const

export type PaperShaderId = string

export const DEFAULT_PAPER_SHADER_ID: PaperShaderId = "mesh-gradient"
const CARD_IMAGE_FILTER_SHADER_IDS = [
  "paper-texture",
  "fluted-glass",
  "water",
  "image-dithering",
  "halftone-dots",
  "halftone-cmyk",
] as const

export function getPaperShaderDefinition(shaderId: PaperShaderId | string) {
  return (
    PAPER_SHADER_DEFINITIONS.find((definition) => definition.id === shaderId) ??
    PAPER_SHADER_DEFINITIONS[0]
  )
}

export function paperShaderHasPlayback(shaderId: PaperShaderId | string) {
  return getPaperShaderDefinition(shaderId).controls.some(
    (control) => control.key === "speed",
  )
}

export function getAllPaperShaderDefinitions() {
  return PAPER_SHADER_DEFINITIONS
}

export function formatPaperShaderParamLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function formatPaperShaderNumberValue(paramKey: string, value: number) {
  if (paramKey.toLowerCase().includes("angle") || paramKey === "rotation") {
    return `${Math.round(value)}°`
  }

  return Number.isInteger(value) ? `${value}` : value.toFixed(2)
}

export function getCardImageFilterDefinitions() {
  return CARD_IMAGE_FILTER_SHADER_IDS.map((shaderId) => getPaperShaderDefinition(shaderId))
}

export function getCardGeneratedShaderDefinitions() {
  return PAPER_SHADER_DEFINITIONS.filter(
    (definition) =>
      !definition.requiresImage &&
      !CARD_IMAGE_FILTER_SHADER_IDS.includes(
        definition.id as (typeof CARD_IMAGE_FILTER_SHADER_IDS)[number],
      ),
  )
}

export function getPaperShaderPreset(
  shaderId: PaperShaderId | string,
  presetName?: string,
) {
  const definition = getPaperShaderDefinition(shaderId)
  return (
    definition.presets.find((preset) => preset.name === presetName) ??
    definition.presets[0]
  )
}

export function createDefaultPaperShaderParams(shaderId: PaperShaderId | string) {
  return structuredClone(getPaperShaderPreset(shaderId).params)
}
