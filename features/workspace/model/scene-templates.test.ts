import { describe, expect, it } from "vitest"

import { applySceneTemplate } from "@/features/workspace/model/apply-scene-template"
import { createDefaultDraftingWorkspaceDocument } from "@/features/workspace/model/document"
import {
  getSceneTemplate,
  MOCKUP_STYLE_PRESETS,
  SCENE_TEMPLATES,
  SCENE_LAYOUT_PRESETS,
} from "@/features/workspace/model/scene-templates"
import { getExportPreset, resolveExportDimensions } from "@/features/workspace/model/export-presets"

describe("scene templates", () => {
  it("exposes a catalog with unique ids", () => {
    const ids = new Set<string>()
    for (const template of SCENE_TEMPLATES) {
      expect(ids.has(template.id)).toBe(false)
      ids.add(template.id)
      expect(template.title.length).toBeGreaterThan(0)
      expect(getSceneTemplate(template.id)).toBe(template)
    }
  })

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

describe("applySceneTemplate", () => {
  it("applies a scene template while preserving qr data", () => {
    const document = createDefaultDraftingWorkspaceDocument()
    const nodeId = document.activeQrNodeId
    const originalData = document.qrStateByNodeId[nodeId]!.data
    document.qrStateByNodeId[nodeId]!.data = "https://preserve-me.example"

    const nextDocument = applySceneTemplate(document, "gradient-ocean", {
      nodeId,
      preserveContent: true,
    })

    expect(nextDocument.qrStateByNodeId[nodeId]?.data).toBe("https://preserve-me.example")
    expect(nextDocument.cardStateByNodeId[nodeId]?.sizePresetId).toBe("ratio-16-9")
    expect(nextDocument.sceneCompositionByNodeId[nodeId]?.templateId).toBe("gradient-ocean")
    expect(nextDocument.sceneCompositionByNodeId[nodeId]?.background.kind).toBe("gradient")
    expect(originalData).not.toBe("https://preserve-me.example")
  })

  it("stores export preset on composition when template defines one", () => {
    const document = createDefaultDraftingWorkspaceDocument()
    const nextDocument = applySceneTemplate(document, "minimal-neutral")
    const composition = nextDocument.sceneCompositionByNodeId[document.activeQrNodeId]
    expect(composition?.exportPresetId).toBe("og-1x")
  })
})

describe("export presets", () => {
  it("resolves platform dimensions from size templates", () => {
    const preset = getExportPreset("og-1x")
    expect(preset).toBeDefined()
    expect(resolveExportDimensions(preset!)).toEqual({ width: 1200, height: 630 })
  })
})
