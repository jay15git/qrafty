import { describe, expect, it } from "vitest"

import {
  DRAFTING_CANVAS_BASELINE_MAX_EDGE,
  SIZE_TEMPLATE_GROUPS,
  SIZE_TEMPLATES,
  findMatchingRatioTemplate,
  formatAspectRatio,
  getCanvasSizeFromTemplate,
  getSizeTemplate,
  getSizeTemplateSections,
  getSizeTemplatesByGroup,
  normalizeCanvasSize,
} from "@/features/workspace/model/size-templates"

describe("size templates catalog", () => {
  it("contains platform presets across all groups", () => {
    expect(SIZE_TEMPLATES.length).toBeGreaterThanOrEqual(70)

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
      expect(template.subtitle?.length).toBeGreaterThan(0)
    }
  })

  it("looks up templates by id and group", () => {
    expect(getSizeTemplate("qr-business-card")).toMatchObject({
      label: "Business card",
      width: 1050,
      height: 600,
      group: "qr-physical",
    })
    expect(getSizeTemplate("instagram-story")).toMatchObject({
      label: "Story",
      group: "instagram",
      brandIconId: "instagram",
    })
    expect(getSizeTemplatesByGroup("instagram")).toHaveLength(4)
    expect(getSizeTemplatesByGroup("web")).toHaveLength(1)
    expect(getSizeTemplate("web-x-card")).toMatchObject({
      group: "x",
      label: "Card",
    })
    expect(getSizeTemplate("whatsapp-status")).toMatchObject({
      label: "Status",
      group: "whatsapp",
      brandIconId: "whatsapp",
      ratioLabel: "9:16",
    })
    expect(getSizeTemplate("spotify-cover")).toMatchObject({
      label: "Cover",
      group: "spotify",
      brandIconId: "spotify",
      ratioLabel: "1:1",
    })
    expect(getSizeTemplate("reddit-post")).toMatchObject({
      label: "Post",
      group: "reddit",
      width: 1200,
      height: 628,
    })
    expect(getSizeTemplatesByGroup("whatsapp")).toHaveLength(3)
    expect(getSizeTemplatesByGroup("twitch")).toHaveLength(3)
  })

  it("builds ordered sections for the inspector", () => {
    const sections = getSizeTemplateSections()
    expect(sections[0]?.group).toBe("instagram")
    expect(sections.some((section) => section.group === "app-store")).toBe(true)
    expect(sections.some((section) => section.group === "whatsapp")).toBe(true)
    expect(sections.some((section) => section.group === "spotify")).toBe(true)
    expect(sections.every((section) => section.templates.length > 0)).toBe(true)
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
