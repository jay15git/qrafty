import { describe, expect, it } from "vitest"

import {
  computeTemplatePreviewFit,
  MOBILE_ARTBOARD_VIEW_INSETS,
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

  it("never upscales past 100% without allowUpscale", () => {
    const scale = computeTemplatePreviewFit(
      { width: 320, height: 320 },
      { width: 1200, height: 900 },
    )

    expect(scale).toBe(1)
  })

  it("upscales to fill the viewport when allowUpscale is enabled", () => {
    const scale = computeTemplatePreviewFit(
      { width: 320, height: 320 },
      { width: 1200, height: 900 },
      { allowUpscale: true, padding: TEMPLATE_PREVIEW_FIT_PADDING },
    )

    expect(scale).toBeCloseTo((900 - TEMPLATE_PREVIEW_FIT_PADDING * 2) / 320, 5)
  })

  it("handles tiny viewports with a sensible minimum scale", () => {
    const scale = computeTemplatePreviewFit(
      { width: 1080, height: 1080 },
      { width: 120, height: 120 },
    )

    expect(scale).toBeGreaterThan(0)
    expect(scale).toBeLessThan(1)
  })

  it("uses tighter mobile insets for more artboard area", () => {
    const viewport = { width: 390, height: 420 }
    const card = { width: 1080, height: 1080 }

    const mobileScale = computeTemplatePreviewFit(card, viewport, {
      allowUpscale: true,
      insets: MOBILE_ARTBOARD_VIEW_INSETS,
    })
    const desktopScale = computeTemplatePreviewFit(card, viewport, {
      allowUpscale: true,
      insets: { top: 56, right: 72, bottom: 56, left: 40 },
    })

    expect(mobileScale).toBeGreaterThan(desktopScale)
  })

  it("respects asymmetric viewport insets", () => {
    const scale = computeTemplatePreviewFit(
      { width: 800, height: 800 },
      { width: 1000, height: 900 },
      {
        allowUpscale: true,
        insets: { top: 56, right: 72, bottom: 56, left: 40 },
      },
    )

    expect(scale).toBeCloseTo(Math.min((1000 - 40 - 72) / 800, (900 - 56 - 56) / 800), 5)
  })
})
