import { describe, expect, it } from "vitest"

import {
  createIconstackIconDataUrl,
  createIconstackIconGradientDataUrl,
  isValidIconstackSvgMarkup,
  normalizeIconstackSvgMarkup,
  recolorSvgMarkup,
} from "@/features/qr-code/assets/iconstack-svg"

const strokeSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" stroke="currentColor" fill="none"><path d="M0 0"/></svg>'

describe("iconstack-svg", () => {
  it("normalizes svg markup by stripping comments", () => {
    const svg = "<!-- meta -->\n<svg><path d=\"M0 0\"/></svg>"

    expect(normalizeIconstackSvgMarkup(svg)).toBe(
      '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>',
    )
    expect(isValidIconstackSvgMarkup(svg)).toBe(true)
  })

  it("adds viewBox from width and height when missing", () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M12 2"/></svg>'

    expect(normalizeIconstackSvgMarkup(svg)).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M12 2"/></svg>',
    )
  })

  it("preserves an existing viewBox", () => {
    const svg =
      '<svg width="24" height="24" viewBox="0 0 16 16"><path d="M0 0"/></svg>'

    expect(normalizeIconstackSvgMarkup(svg)).toBe(svg)
  })

  it("rejects markup without svg shapes", () => {
    expect(isValidIconstackSvgMarkup("<svg></svg>")).toBe(false)
    expect(isValidIconstackSvgMarkup("")).toBe(false)
  })

  it("recolors stroke-based svg markup", () => {
    expect(recolorSvgMarkup(strokeSvg, "#ff4f00")).toContain('stroke="#ff4f00"')
  })

  it("creates solid data urls", () => {
    const dataUrl = createIconstackIconDataUrl(strokeSvg, "#111827")

    expect(dataUrl.startsWith("data:image/svg+xml,")).toBe(true)
    expect(decodeURIComponent(dataUrl)).toContain("#111827")
  })

  it("creates gradient data urls", () => {
    const dataUrl = createIconstackIconGradientDataUrl(strokeSvg, {
      enabled: true,
      type: "linear",
      rotation: 0,
      colorStops: [
        { offset: 0, color: "#111827" },
        { offset: 1, color: "#ff4f00" },
      ],
    })

    expect(dataUrl.startsWith("data:image/svg+xml,")).toBe(true)
    expect(decodeURIComponent(dataUrl)).toContain("iconstack-icon-gradient")
    expect(decodeURIComponent(dataUrl)).toContain('stop-color="#ff4f00"')
  })
})
