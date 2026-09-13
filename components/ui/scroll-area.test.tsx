/**
 * @vitest-environment jsdom
 */
import { createElement, type CSSProperties } from "react"
import { act } from "react"
import { describe, expect, it, vi } from "vitest"

import { ScrollArea } from "@/components/ui/scroll-area"
import { renderWithJsdomRoot } from "@/test-utils/jsdom-react-root"

const touchState = vi.hoisted(() => ({ current: false }))

vi.mock("@/hooks/use-touch-primary", () => ({
  useTouchPrimary: () => touchState.current,
}))

function mockScrollBox(
  element: HTMLElement,
  {
    scrollWidth,
    clientWidth,
    scrollLeft = 0,
  }: { scrollWidth: number; clientWidth: number; scrollLeft?: number },
) {
  Object.defineProperties(element, {
    scrollWidth: { configurable: true, get: () => scrollWidth },
    clientWidth: { configurable: true, get: () => clientWidth },
    scrollLeft: { configurable: true, get: () => scrollLeft },
  })
}

function cueOpacity(container: HTMLElement, edge: "left" | "right") {
  const cues = Array.from(container.querySelectorAll<HTMLElement>(".scroll-edge-cue-gradient"))
  const match = cues.find((node) => {
    const band = node.parentElement
    if (!band) return false
    return edge === "right" ? band.style.right === "0px" : band.style.left === "0px"
  })
  return match?.parentElement?.style.opacity
}

describe("ScrollArea", () => {
  it("hides native scrollbars and keeps fade after the touch remount", () => {
    touchState.current = false

    const { container, rerender } = renderWithJsdomRoot(
      createElement(
        ScrollArea,
        {
          chevron: false,
          orientation: "horizontal",
          scrollFade: true,
          showScrollbar: false,
        },
        createElement("div", { style: { width: 800 } }, "Content QR Motion"),
      ),
    )

    expect(container.querySelector("[data-radix-scroll-area-viewport]")).not.toBeNull()

    touchState.current = true
    rerender(
      createElement(
        ScrollArea,
        {
          chevron: false,
          orientation: "horizontal",
          scrollFade: true,
          showScrollbar: false,
        },
        createElement("div", { style: { width: 800 } }, "Content QR Motion"),
      ),
    )

    expect(container.querySelector("[data-radix-scroll-area-viewport]")).toBeNull()
    expect(container.querySelector('[data-slot="scroll-area-scrollbar"]')).toBeNull()

    const viewport = container.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')
    expect(viewport).not.toBeNull()
    expect(viewport?.className).toContain("overflow-x-auto")

    const content = viewport?.querySelector<HTMLElement>('[data-slot="scroll-area-inner"] > div')
    expect(content).not.toBeNull()
    mockScrollBox(viewport as HTMLElement, { scrollWidth: 800, clientWidth: 300 })
    mockScrollBox(content as HTMLElement, { scrollWidth: 800, clientWidth: 800 })
    act(() => {
      viewport?.dispatchEvent(new Event("scroll"))
    })

    expect(cueOpacity(container, "right")).toBe("1")
    expect(cueOpacity(container, "left")).toBe("0")
  })

  it.each([false, true])("hides reached edge fades in touch mode %s", (isTouch) => {
    touchState.current = isTouch

    const { container } = renderWithJsdomRoot(
      createElement(
        "div",
        {
          className: "desktopnew-root",
          style: {
            "--dn-preview-tile": "56px",
            "--dn-space-inline": "6px",
          } as CSSProperties,
        },
        createElement(
          ScrollArea,
          {
            chevron: false,
            orientation: "horizontal",
            scrollFade: true,
            showScrollbar: false,
          },
          createElement(
            "div",
            { className: "dn-preview-row" },
            Array.from({ length: 13 }, (_, index) =>
              createElement("button", { key: index }),
            ),
          ),
        ),
      ),
    )

    const viewport = container.querySelector<HTMLElement>(
      '[data-slot="scroll-area-viewport"]',
    )
    expect(viewport).not.toBeNull()

    mockScrollBox(viewport as HTMLElement, { scrollWidth: 730, clientWidth: 248, scrollLeft: 0 })
    act(() => {
      viewport?.dispatchEvent(new Event("scroll"))
    })
    expect(cueOpacity(container, "left")).toBe("0")
    expect(cueOpacity(container, "right")).toBe("1")

    mockScrollBox(viewport as HTMLElement, { scrollWidth: 730, clientWidth: 248, scrollLeft: 200 })
    act(() => {
      viewport?.dispatchEvent(new Event("scroll"))
    })
    expect(cueOpacity(container, "left")).toBe("1")
    expect(cueOpacity(container, "right")).toBe("1")

    mockScrollBox(viewport as HTMLElement, { scrollWidth: 730, clientWidth: 248, scrollLeft: 482 })
    act(() => {
      viewport?.dispatchEvent(new Event("scroll"))
    })
    expect(cueOpacity(container, "left")).toBe("1")
    expect(cueOpacity(container, "right")).toBe("0")

    mockScrollBox(viewport as HTMLElement, { scrollWidth: 730, clientWidth: 248, scrollLeft: 0 })
    act(() => {
      viewport?.dispatchEvent(new Event("scroll"))
    })
    expect(cueOpacity(container, "left")).toBe("0")
    expect(cueOpacity(container, "right")).toBe("1")

    mockScrollBox(viewport as HTMLElement, { scrollWidth: 780, clientWidth: 780, scrollLeft: 0 })
    act(() => {
      viewport?.dispatchEvent(new Event("scroll"))
    })
    expect(cueOpacity(container, "left")).toBe("0")
    expect(cueOpacity(container, "right")).toBe("0")

    touchState.current = false
  })
})
