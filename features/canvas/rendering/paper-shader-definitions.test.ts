import { describe, expect, it } from "vitest"
import * as shadersReact from "@paper-design/shaders-react"

import {
  getAllPaperShaderDefinitions,
  getPaperShaderDefinition,
  getPaperShaderPreset,
} from "@/features/canvas/rendering/paper-shader-definitions"
import { PAPER_SHADER_PRESET_SNAPSHOTS } from "@/features/canvas/rendering/paper-shader-presets.generated"

function presetExportName(shaderId: string) {
  return `${shaderId
    .split("-")
    .map((part, index) => (index === 0 ? part : part[0].toUpperCase() + part.slice(1)))
    .join("")}Presets`
}

describe("paper-shader preset snapshot", () => {
  it("covers every shader definition id", () => {
    const definitionIds = getAllPaperShaderDefinitions().map((definition) => definition.id)
    expect(new Set(Object.keys(PAPER_SHADER_PRESET_SNAPSHOTS))).toEqual(new Set(definitionIds))
  })

  it("matches the installed @paper-design/shaders-react presets", () => {
    const library = shadersReact as unknown as Record<
      string,
      Array<{ name: string; params: unknown }> | undefined
    >

    for (const definition of getAllPaperShaderDefinitions()) {
      const live = library[presetExportName(definition.id)]
      expect(live, presetExportName(definition.id)).toBeDefined()
      expect(PAPER_SHADER_PRESET_SNAPSHOTS[definition.id].map((preset) => preset.name)).toEqual(
        live?.map((preset) => preset.name),
      )
      expect(PAPER_SHADER_PRESET_SNAPSHOTS[definition.id]).toEqual(live)
    }
  })

  it("resolves the defaults used by server-side state", () => {
    expect(getPaperShaderPreset("mesh-gradient").name).toBe("Default")
    expect(getPaperShaderPreset("warp", "Live Ink").name).toBe("Live Ink")
    expect(getPaperShaderDefinition("unknown-id").id).toBe("mesh-gradient")
    expect(getPaperShaderDefinition("image-dithering").requiresImage).toBe(true)
  })
})
