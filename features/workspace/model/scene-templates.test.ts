import { describe, expect, it } from "vitest"

import {
  MOCKUP_STYLE_PRESETS,
  SCENE_LAYOUT_PRESETS,
} from "@/features/workspace/model/scene-templates"
import { getExportPreset, resolveExportDimensions } from "@/features/workspace/model/export-presets"

describe("desktop scene settings", () => {
  it("includes layout presets", () => {
    expect(SCENE_LAYOUT_PRESETS.length).toBeGreaterThanOrEqual(8)
    expect(SCENE_LAYOUT_PRESETS[0]?.id).toBe("flat")
  })

  it("exposes twelve mockup style presets", () => {
    expect(MOCKUP_STYLE_PRESETS).toHaveLength(12)
    expect(MOCKUP_STYLE_PRESETS.map((preset) => preset.id)).toEqual([
      "default",
      "glass-light",
      "glass-dark",
      "liquid",
      "inset-light",
      "inset-dark",
      "outline",
      "border",
      "retro",
      "card",
      "stack",
      "stack-2",
    ])
  })
})

describe("export presets", () => {
  it("resolves platform dimensions from size templates", () => {
    const preset = getExportPreset("og-1x")
    expect(preset).toBeDefined()
    expect(resolveExportDimensions(preset!)).toEqual({ width: 1200, height: 630 })
  })
})
