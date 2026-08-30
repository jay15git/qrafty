/**
 * @vitest-environment jsdom
 */

import { act, createElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DESKTOP_WORKSPACE_MOBILE_QUERY, useMediaQuery } from "@/hooks/use-media-query"

function createMatchMedia(matches: boolean) {
  return vi.fn().mockImplementation((query: string) => ({
    matches,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function MediaQueryProbe({ query }: { query: string }) {
  const matches = useMediaQuery(query)
  return createElement("div", { "data-matches": matches ? "true" : "false" })
}

function mount(
  ui: React.ReactNode,
  container: HTMLElement,
): { root: Root; unmount: () => void } {
  const root = createRoot(container)
  act(() => {
    root.render(ui)
  })
  return {
    root,
    unmount: () => {
      act(() => {
        root.unmount()
      })
    },
  }
}

describe("useMediaQuery", () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    vi.stubGlobal("matchMedia", createMatchMedia(false))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    container.remove()
  })

  it("reads the current matchMedia value on first client render", () => {
    vi.stubGlobal("matchMedia", createMatchMedia(true))

    mount(createElement(MediaQueryProbe, { query: DESKTOP_WORKSPACE_MOBILE_QUERY }), container)

    expect(container.querySelector("[data-matches]")?.getAttribute("data-matches")).toBe("true")
  })

  it("returns false when the query does not match", () => {
    mount(createElement(MediaQueryProbe, { query: DESKTOP_WORKSPACE_MOBILE_QUERY }), container)

    expect(container.querySelector("[data-matches]")?.getAttribute("data-matches")).toBe("false")
  })

  it("subscribes to matchMedia changes", () => {
    const listeners: Array<() => void> = []
    const mediaQueryList = {
      matches: false,
      media: DESKTOP_WORKSPACE_MOBILE_QUERY,
      addEventListener: (_event: string, listener: () => void) => {
        listeners.push(listener)
      },
      removeEventListener: vi.fn(),
    }

    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockImplementation(() => mediaQueryList),
    )

    mount(createElement(MediaQueryProbe, { query: DESKTOP_WORKSPACE_MOBILE_QUERY }), container)
    expect(container.querySelector("[data-matches]")?.getAttribute("data-matches")).toBe("false")

    mediaQueryList.matches = true
    act(() => {
      listeners.forEach((listener) => listener())
    })

    expect(container.querySelector("[data-matches]")?.getAttribute("data-matches")).toBe("true")
  })
})
