"use client"

import type { ComponentType } from "react"
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
} from "@paper-design/shaders-react"

export type PaperShaderComponent = ComponentType<Record<string, unknown>>

function asPaperShaderComponent(component: unknown): PaperShaderComponent {
  return component as unknown as PaperShaderComponent
}

/**
 * Client-only shader component registry. Component references cannot cross the
 * server boundary as data, so files that only need metadata (ids, presets,
 * controls) must import from `./paper-shader-definitions` instead — that
 * module is server-safe. Only import this module when rendering shaders.
 */
const PAPER_SHADER_COMPONENTS: Record<string, PaperShaderComponent> = {
  "mesh-gradient": asPaperShaderComponent(MeshGradient),
  "static-mesh-gradient": asPaperShaderComponent(StaticMeshGradient),
  "grain-gradient": asPaperShaderComponent(GrainGradient),
  warp: asPaperShaderComponent(Warp),
  waves: asPaperShaderComponent(Waves),
  "dot-orbit": asPaperShaderComponent(DotOrbit),
  voronoi: asPaperShaderComponent(Voronoi),
  "smoke-ring": asPaperShaderComponent(SmokeRing),
  "neuro-noise": asPaperShaderComponent(NeuroNoise),
  "dot-grid": asPaperShaderComponent(DotGrid),
  "simplex-noise": asPaperShaderComponent(SimplexNoise),
  metaballs: asPaperShaderComponent(Metaballs),
  "perlin-noise": asPaperShaderComponent(PerlinNoise),
  "god-rays": asPaperShaderComponent(GodRays),
  spiral: asPaperShaderComponent(Spiral),
  swirl: asPaperShaderComponent(Swirl),
  dithering: asPaperShaderComponent(Dithering),
  "pulsing-border": asPaperShaderComponent(PulsingBorder),
  "color-panels": asPaperShaderComponent(ColorPanels),
  "static-radial-gradient": asPaperShaderComponent(StaticRadialGradient),
  "paper-texture": asPaperShaderComponent(PaperTexture),
  water: asPaperShaderComponent(Water),
  "fluted-glass": asPaperShaderComponent(FlutedGlass),
  "image-dithering": asPaperShaderComponent(ImageDithering),
  heatmap: asPaperShaderComponent(Heatmap),
  "liquid-metal": asPaperShaderComponent(LiquidMetal),
  "halftone-dots": asPaperShaderComponent(HalftoneDots),
  "halftone-cmyk": asPaperShaderComponent(HalftoneCmyk),
  "gem-smoke": asPaperShaderComponent(GemSmoke),
}

export function getPaperShaderComponent(shaderId: string): PaperShaderComponent {
  return PAPER_SHADER_COMPONENTS[shaderId] ?? PAPER_SHADER_COMPONENTS["mesh-gradient"]
}
