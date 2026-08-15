import { describe, expect, it } from "vitest"

import { getPaperShaderOptionPreviewUrl } from "@/features/workspace/components/paper-shader-option-preview.utils"
import { getAllPaperShaderDefinitions } from "@/features/workspace/rendering/paper-shaders"

describe("paper shader option previews", () => {
  it("provides a shipped WebP path for every shader option", () => {
    for (const shader of getAllPaperShaderDefinitions()) {
      const previewUrl = getPaperShaderOptionPreviewUrl(shader.id)

      expect(previewUrl).toBe(`/shader-previews/${shader.id}.webp`)
    }
  })

  it("keeps preview URLs deterministic without a canvas capture", () => {
    const previewUrl = getPaperShaderOptionPreviewUrl("static-mesh-gradient")

    expect(previewUrl).toBe(getPaperShaderOptionPreviewUrl("static-mesh-gradient"))
    expect(previewUrl).toBe("/shader-previews/static-mesh-gradient.webp")
  })
})
