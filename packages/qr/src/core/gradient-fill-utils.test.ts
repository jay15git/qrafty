// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import {
  applyDirectGradientFillWithContext,
} from "./gradient-fill-utils"

describe("gradient fill utils", () => {
  it("applies gradient stroke to shape inheriting root stroke", () => {
    const document = new DOMParser().parseFromString(
      `<svg fill="none" stroke="#111827"><path d="M0 0"/></svg>`,
      "image/svg+xml",
    )
    const svg = document.documentElement as unknown as SVGElement
    const path = svg.querySelector("path") as SVGElement

    applyDirectGradientFillWithContext(path, "url(#gradient)", { fill: "none", stroke: "#111827" })

    expect(path.getAttribute("stroke")).toBe("url(#gradient)")
    expect(path.getAttribute("fill")).toBeNull()
  })

  it("applies gradient fill to shape inheriting root fill", () => {
    const document = new DOMParser().parseFromString(
      `<svg fill="#111827"><path d="M0 0"/></svg>`,
      "image/svg+xml",
    )
    const svg = document.documentElement as unknown as SVGElement
    const path = svg.querySelector("path") as SVGElement

    applyDirectGradientFillWithContext(path, "url(#gradient)", { fill: "#111827", stroke: null })

    expect(path.getAttribute("fill")).toBe("url(#gradient)")
  })
})
