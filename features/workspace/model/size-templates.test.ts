import { describe, expect, it } from "vitest"

import {
  DRAFTING_CANVAS_BASELINE_MAX_EDGE,
  SIZE_TEMPLATE_GROUPS,
  SIZE_TEMPLATES,
  findMatchingRatioTemplate,
  formatAspectRatio,
  getCanvasSizeFromTemplate,
  getSizeTemplate,
  getSizeTemplatesByGroup,
  normalizeCanvasSize,
} from "@/features/workspace/model/size-templates"

describe("size templates catalog", () => {
  it("contains roughly twenty presets across four groups", () => {
    expect(SIZE_TEMPLATES.length).toBeGreaterThanOrEqual(20)
    expect(SIZE_TEMPLATES.length).toBeLessThanOrEqual(24)

    for (const group of SIZE_TEMPLATE_GROUPS) {
      expect(getSizeTemplatesByGroup(group).length).toBeGreaterThan(0)
    }
  })

  it("uses unique ids and positive dimensions", () => {
    const ids = new Set<string>()

    for (const template of SIZE_TEMPLATES) {
      expect(ids.has(template.id)).toBe(false)
      ids.add(template.id)
      expect(template.width).toBeGreaterThan(0)
      expect(template.height).toBeGreaterThan(0)
      expect(template.ratioLabel.length).toBeGreaterThan(0)
    }
  })

  it("looks up templates by id and group", () => {
    expect(getSizeTemplate("qr-business-card")).toMatchObject({
      label: "Business card",
      width: 1050,
      height: 600,
      group: "qr-physical",
    })
    expect(getSizeTemplatesByGroup("web")).toHaveLength(2)
  })

  it("formats aspect ratios and finds ratio presets", () => {
    expect(formatAspectRatio(1920, 1080)).toBe("16:9")
    expect(findMatchingRatioTemplate(1920, 1080)?.id).toBe("ratio-16-9")
  })

  it("normalizes canvas sizes to a shared max-edge baseline", () => {
    expect(DRAFTING_CANVAS_BASELINE_MAX_EDGE).toBe(1080)
    expect(normalizeCanvasSize(600, 600)).toEqual({ width: 1080, height: 1080 })
    expect(normalizeCanvasSize(1920, 1080)).toEqual({ width: 1080, height: 608 })
    expect(normalizeCanvasSize(5400, 7200)).toEqual({ width: 810, height: 1080 })
    expect(getCanvasSizeFromTemplate(getSizeTemplate("qr-sticker-2x2")!)).toEqual({
      width: 1080,
      height: 1080,
    })
    expect(getCanvasSizeFromTemplate(getSizeTemplate("qr-business-card")!)).toEqual({
      width: 1080,
      height: 617,
    })
    expect(getSizeTemplate("ratio-16-9")).toMatchObject({ width: 1080, height: 608 })
    expect(getSizeTemplate("ratio-1-1")).toMatchObject({ width: 1080, height: 1080 })
  })
})
