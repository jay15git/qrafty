import { describe, expect, it } from "vitest"

import {
  computeTemplatePreviewFit,
  TEMPLATE_PREVIEW_FIT_PADDING,
} from "@/features/workspace/model/template-preview-fit"

describe("template-preview-fit", () => {
  it("fits a landscape card into a portrait viewport by width", () => {
    const scale = computeTemplatePreviewFit(
      { width: 1920, height: 1080 },
      { width: 800, height: 600 },
    )

    expect(scale).toBeCloseTo((800 - TEMPLATE_PREVIEW_FIT_PADDING * 2) / 1920, 5)
  })

  it("fits a portrait card into a landscape viewport by height", () => {
    const scale = computeTemplatePreviewFit(
      { width: 1080, height: 1920 },
      { width: 900, height: 700 },
    )

    expect(scale).toBeCloseTo((700 - TEMPLATE_PREVIEW_FIT_PADDING * 2) / 1920, 5)
  })

  it("never upscales past 100%", () => {
    const scale = computeTemplatePreviewFit(
      { width: 320, height: 320 },
      { width: 1200, height: 900 },
    )

    expect(scale).toBe(1)
  })

  it("handles tiny viewports with a sensible minimum scale", () => {
    const scale = computeTemplatePreviewFit(
      { width: 1080, height: 1080 },
      { width: 120, height: 120 },
    )

    expect(scale).toBeGreaterThan(0)
    expect(scale).toBeLessThan(1)
  })
})
