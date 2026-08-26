/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from "vitest"
import { createElement } from "react"
import { createRoot } from "react-dom/client"
import { act } from "react"

import { ScrollEdgeCue, useScrollEdges } from "@/lib/scroll-fade"
import { renderWithJsdomRoot } from "@/test-utils/jsdom-react-root"

function mockScrollBox(
  element: HTMLElement,
  {
    scrollWidth = 0,
    clientWidth = 0,
    scrollLeft = 0,
    scrollHeight = 0,
    clientHeight = 0,
    scrollTop = 0,
  }: {
    scrollWidth?: number
    clientWidth?: number
    scrollLeft?: number
    scrollHeight?: number
    clientHeight?: number
    scrollTop?: number
  },
) {
  Object.defineProperties(element, {
    scrollWidth: { configurable: true, get: () => scrollWidth },
    clientWidth: { configurable: true, get: () => clientWidth },
    scrollLeft: { configurable: true, get: () => scrollLeft },
    scrollHeight: { configurable: true, get: () => scrollHeight },
    clientHeight: { configurable: true, get: () => clientHeight },
    scrollTop: { configurable: true, get: () => scrollTop },
  })
}

function EdgesProbe({
  element,
  axis = "horizontal",
}: {
  element: HTMLElement | null
  axis?: "horizontal" | "vertical"
}) {
  const edges = useScrollEdges(element, { axis })
  return createElement("div", {
    "data-left": String(edges.left),
    "data-right": String(edges.right),
    "data-top": String(edges.top),
    "data-bottom": String(edges.bottom),
  })
}

describe("ScrollEdgeCue", () => {
  it("renders a CSS fallback gradient class for mobile browsers without color-mix", async () => {
    const container = document.createElement("div")
    container.style.setProperty("--scroll-edge-fade-color", "#07080a")
    const root = createRoot(container)

    await act(async () => {
      root.render(
        createElement(ScrollEdgeCue, {
          edge: "right",
          mode: "absolute",
          visible: true,
          chevron: false,
        }),
      )
    })

    const gradient = container.querySelector(".scroll-edge-cue-gradient")
    expect(gradient).not.toBeNull()
    expect(getComputedStyle(gradient as Element).getPropertyValue("--scroll-edge-cue-direction").trim()).toBe(
      "to right",
    )

    await act(async () => {
      root.unmount()
    })
  })
})

describe("useScrollEdges", () => {
  it("rebinds when the scroller node identity changes", () => {
    const overflowing = document.createElement("div")
    mockScrollBox(overflowing, { scrollWidth: 800, clientWidth: 300 })
    const fitted = document.createElement("div")
    mockScrollBox(fitted, { scrollWidth: 300, clientWidth: 300 })

    const { container, rerender } = renderWithJsdomRoot(
      createElement(EdgesProbe, { element: overflowing }),
    )

    expect(container.querySelector("[data-right]")?.getAttribute("data-right")).toBe("true")
    expect(container.querySelector("[data-left]")?.getAttribute("data-left")).toBe("false")

    rerender(createElement(EdgesProbe, { element: fitted }))

    expect(container.querySelector("[data-right]")?.getAttribute("data-right")).toBe("false")
  })

  it("attaches after a late-mounted scroller", () => {
    const { container, rerender } = renderWithJsdomRoot(
      createElement(EdgesProbe, { element: null }),
    )

    expect(container.querySelector("[data-right]")?.getAttribute("data-right")).toBe("false")

    const overflowing = document.createElement("div")
    mockScrollBox(overflowing, { scrollWidth: 800, clientWidth: 300 })
    rerender(createElement(EdgesProbe, { element: overflowing }))

    expect(container.querySelector("[data-right]")?.getAttribute("data-right")).toBe("true")
  })
})
