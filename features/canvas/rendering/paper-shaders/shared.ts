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
import { PAPER_SHADER_PRESET_SNAPSHOTS } from "../paper-shader-presets.generated"

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

export type PaperShaderDefinition = {
  id: string
  label: string
  group: PaperShaderGroup
  controls: PaperShaderControlDefinition[]
  hiddenParams: string[]
  maxColorCount?: number
  presets: PaperShaderPreset[]
  renderOptions?: PaperShaderRenderOptions
  requiresImage?: boolean
}

export function snapshotPresets(shaderId: string): PaperShaderPreset[] {
  const presets = PAPER_SHADER_PRESET_SNAPSHOTS[shaderId] ?? []
  return structuredClone(presets) as PaperShaderPreset[]
}

export const COMMON_HIDDEN_PARAMS = ["frame", "speed", "originX", "originY", "worldWidth", "worldHeight"]
export const IMAGE_SHADER_HIDDEN_PARAMS = [...COMMON_HIDDEN_PARAMS, "image"]
export const SHADER_FIT_OPTIONS = ["contain", "cover"]
export const HIGH_RES_SHADER_MAX_PIXEL_COUNT = 6016 * 3384

export function color(key: string, order: number): PaperShaderColorControl {
  return { key, order, type: "color" }
}

export function number(
  key: string,
  min: number,
  max: number,
  order: number,
  step?: number,
): PaperShaderNumberControl {
  return { key, max, min, order, step, type: "number" }
}

export function option(key: string, options: string[], order: number): PaperShaderEnumControl {
  return { key, options, order, type: "enum" }
}

export function toggle(key: string, order: number): PaperShaderBooleanControl {
  return { key, order, type: "boolean" }
}

export function controls(...items: PaperShaderControlDefinition[]) {
  return items.sort((a, b) => a.order - b.order || a.key.localeCompare(b.key))
}

export function withColors(
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

export function withImageControls(items: PaperShaderControlDefinition[]) {
  return controls({ key: "image", order: 0, type: "image" }, ...items)
}

export type PaperShaderControlConfig = Pick<
  PaperShaderDefinition,
  "controls" | "hiddenParams" | "maxColorCount" | "renderOptions" | "requiresImage"
>
