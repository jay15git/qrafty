// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import { applyUnifiedQrGradientFill } from "./unified-gradient"

describe("unified qr gradient fill", () => {
  it("applies one gradient definition with direct fill on modules and finders", () => {
    const svgMarkup = `<svg viewBox="0 0 49 49" xmlns="http://www.w3.org/2000/svg">
      <path data-testid="data-modules" fill="#111827" d="M12 12h1v1h-1z" />
      <path data-testid="finder-patterns-outer" fill="#111827" d="M12 12h7v7H12z" />
      <rect data-testid="finder-patterns-inner" fill="#111827" x="14" y="14" width="3" height="3" />
    </svg>`

    const document = new DOMParser().parseFromString(svgMarkup, "image/svg+xml")
    const svg = document.documentElement as unknown as SVGElement

    applyUnifiedQrGradientFill(svg, {
      gradient: {
        type: "linear",
        rotation: Math.PI / 2,
        stops: [
          { offset: 0, color: "#101010" },
          { offset: 1, color: "#fafafa" },
        ],
      },
      gradientId: "qrafty-dots-gradient",
      margin: 12,
    })

    const serialized = new XMLSerializer().serializeToString(svg)

    expect(serialized).toContain('id="qrafty-dots-gradient"')
    expect(serialized).toContain('fill="url(#qrafty-dots-gradient)"')
    expect(serialized).toContain('data-qr-layer="unified-gradient-fill"')
    expect(serialized).not.toContain('corner-frame-gradient')
    expect(serialized).not.toContain('corner-dot-gradient')
  })

  it("does not modify logo images in unified mode", () => {
    const svgMarkup = `<svg viewBox="0 0 49 49" xmlns="http://www.w3.org/2000/svg">
      <path data-testid="data-modules" fill="#111827" d="M12 12h1v1h-1z" />
      <image href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23111827' d='M12 2h10v20H12z'/%3E%3C/svg%3E" x="18" y="18" width="12" height="12" />
    </svg>`

    const document = new DOMParser().parseFromString(svgMarkup, "image/svg+xml")
    const svg = document.documentElement as unknown as SVGElement

    applyUnifiedQrGradientFill(svg, {
      gradient: {
        type: "linear",
        rotation: Math.PI / 2,
        stops: [
          { offset: 0, color: "#101010" },
          { offset: 1, color: "#fafafa" },
        ],
      },
      gradientId: "qrafty-dots-gradient",
      margin: 12,
    })

    const serialized = new XMLSerializer().serializeToString(svg)

    expect(serialized).toContain("<image")
    expect(serialized).not.toContain('data-qr-layer="logo-unified-gradient"')
    expect(serialized).not.toContain('data-qr-layer="logo-unified-gradient-fill"')
  })
})
