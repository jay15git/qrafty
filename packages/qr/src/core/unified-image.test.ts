// @vitest-environment jsdom

import { describe, expect, it } from "vitest"

import { applyUnifiedQrImageFill } from "./unified-image"

describe("unified qr image fill", () => {
  it("places one covering image and masks it with modules, frames, and eyes", () => {
    const svgMarkup = `<svg viewBox="0 0 49 49" xmlns="http://www.w3.org/2000/svg">
      <path data-testid="data-modules" fill="#111827" d="M12 12h1v1h-1z" />
      <path data-testid="finder-patterns-outer" fill="#111827" d="M12 12h7v7H12z" />
      <rect data-testid="finder-patterns-inner" fill="#111827" x="14" y="14" width="3" height="3" />
    </svg>`

    const document = new DOMParser().parseFromString(svgMarkup, "image/svg+xml")
    const svg = document.documentElement as unknown as SVGElement

    applyUnifiedQrImageFill(svg, {
      imageHref: "https://example.com/texture.png",
      imageId: "qrafty-dots-image",
      margin: 12,
    })

    const image = svg.querySelector("#qrafty-dots-image")
    const clipPath = svg.querySelector("#qrafty-dots-image-clip")
    const modules = svg.querySelector('[data-testid="data-modules"]')
    const finderOuter = svg.querySelector('[data-testid="finder-patterns-outer"]')
    const finderInner = svg.querySelector('[data-testid="finder-patterns-inner"]')

    expect(clipPath).not.toBeNull()
    expect(clipPath?.getAttribute("clipPathUnits")).toBe("userSpaceOnUse")
    expect(clipPath?.children.length).toBe(3)
    expect(image?.getAttribute("x")).toBe("12")
    expect(image?.getAttribute("y")).toBe("12")
    expect(image?.getAttribute("width")).toBe("25")
    expect(image?.getAttribute("height")).toBe("25")
    expect(image?.getAttribute("preserveAspectRatio")).toBe("xMidYMid slice")
    expect(image?.getAttribute("clip-path")).toBe("url(#qrafty-dots-image-clip)")
    expect(image?.getAttribute("href")).toBe("https://example.com/texture.png")
    expect(modules?.getAttribute("opacity")).toBe("0")
    expect(finderOuter?.getAttribute("opacity")).toBe("0")
    expect(finderInner?.getAttribute("opacity")).toBe("0")
    expect(svg.querySelector("pattern")).toBeNull()
  })

  it("masks unified image through the logo icon alpha instead of a square", () => {
    const svgMarkup = `<svg viewBox="0 0 49 49" xmlns="http://www.w3.org/2000/svg">
      <path data-testid="data-modules" fill="#111827" d="M12 12h1v1h-1z" />
      <image href="https://example.com/logo.png" x="18" y="18" width="12" height="12" />
    </svg>`

    const document = new DOMParser().parseFromString(svgMarkup, "image/svg+xml")
    const svg = document.documentElement as unknown as SVGElement

    applyUnifiedQrImageFill(svg, {
      imageHref: "https://example.com/texture.png",
      imageId: "qrafty-dots-image",
      margin: 12,
    })

    const clipPath = svg.querySelector("#qrafty-dots-image-clip")
    const logoMask = svg.querySelector("#qrafty-dots-image-logo-mask")
    const logoFill = svg.querySelector("#qrafty-dots-image-logo")
    const cover = svg.querySelector("#qrafty-dots-image")
    const logo = Array.from(svg.children).find(
      (child) =>
        child.tagName.toLowerCase() === "image" &&
        child.id !== "qrafty-dots-image" &&
        child.id !== "qrafty-dots-image-logo",
    )

    expect(clipPath?.querySelector("rect")).toBeNull()
    expect(logoMask?.getAttribute("maskUnits")).toBe("userSpaceOnUse")
    expect(logoMask?.querySelector("image")?.getAttribute("href")).toBe("https://example.com/logo.png")
    expect(logoFill?.getAttribute("href")).toBe("https://example.com/texture.png")
    expect(logoFill?.getAttribute("mask")).toBe("url(#qrafty-dots-image-logo-mask)")
    expect(logoFill?.getAttribute("preserveAspectRatio")).toBe("xMidYMid slice")
    expect(logo?.getAttribute("opacity")).toBe("0")
    expect(cover?.nextSibling).toBe(logoFill)
    expect(logoFill?.nextSibling).toBe(logo)
  })

  it("merges module clip segments into one path so adjacent cells stay seamless", () => {
    const svgMarkup = `<svg viewBox="0 0 49 49" xmlns="http://www.w3.org/2000/svg">
      <path data-testid="data-modules" fill="#111827" d="M12 12h1v1h-1zM13 12h1v1h-1zM12 13h1v1h-1z" />
    </svg>`

    const document = new DOMParser().parseFromString(svgMarkup, "image/svg+xml")
    const svg = document.documentElement as unknown as SVGElement
    const moduleShapes = [
      "M12 12h1v1h-1z",
      "M13 12h1v1h-1z",
      "M12 13h1v1h-1z",
    ].map((d) => {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path")
      path.setAttribute("d", d)
      return path as unknown as SVGElement
    })

    applyUnifiedQrImageFill(svg, {
      imageHref: "https://example.com/texture.png",
      imageId: "qrafty-dots-image",
      margin: 12,
      moduleClipShapes: moduleShapes,
      modulePaintTargets: [svg.querySelector('[data-testid="data-modules"]') as SVGElement],
    })

    const clipPath = svg.querySelector("#qrafty-dots-image-clip")

    expect(clipPath?.children.length).toBe(1)
    const merged = clipPath?.children[0]
    expect(merged?.tagName.toLowerCase()).toBe("path")
    expect(merged?.getAttribute("clip-rule")).toBe("nonzero")
    expect(merged?.getAttribute("d")).toBe(
      "M12 12h1v1h-1z M13 12h1v1h-1z M12 13h1v1h-1z",
    )
  })

  it("clips through inner module shapes instead of wrapper rects", () => {
    const svgMarkup = `<svg viewBox="0 0 49 49" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="module-shape-0">
          <path d="M12 12h1v1h-1z" />
        </clipPath>
      </defs>
      <rect clip-path="url(#module-shape-0)" data-testid="data-modules" fill="#111827" height="1" width="1" x="12" y="12" />
      <path data-testid="finder-patterns-outer" fill="#111827" d="M12 12h7v7H12z" />
    </svg>`

    const document = new DOMParser().parseFromString(svgMarkup, "image/svg+xml")
    const svg = document.documentElement as unknown as SVGElement
    const moduleRect = svg.querySelector('[data-testid="data-modules"]') as SVGElement
    const moduleShape = svg.querySelector("#module-shape-0 path") as SVGElement

    applyUnifiedQrImageFill(svg, {
      imageHref: "https://example.com/texture.png",
      imageId: "qrafty-dots-image",
      margin: 12,
      moduleClipShapes: [moduleShape],
      modulePaintTargets: [moduleRect],
    })

    const clipPath = svg.querySelector("#qrafty-dots-image-clip")

    expect(clipPath?.querySelector("rect")).toBeNull()
    expect(clipPath?.querySelector("path")?.getAttribute("d")).toBe("M12 12h1v1h-1z")
  })
})
