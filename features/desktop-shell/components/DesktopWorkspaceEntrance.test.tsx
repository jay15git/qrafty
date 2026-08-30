/**
 * @vitest-environment jsdom
 */

import { act, createElement } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DesktopWorkspaceEntrance } from "@/features/desktop-shell/components/DesktopWorkspaceEntrance"

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

describe("DesktopWorkspaceEntrance", () => {
  let container: HTMLDivElement

  beforeEach(() => {
    container = document.createElement("div")
    document.body.appendChild(container)
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      callback(0)
      return 1
    })
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    container.remove()
  })

  it("stays loading until the workspace canvas is ready", () => {
    mount(
      createElement(DesktopWorkspaceEntrance, {
        theme: "dark",
        children: createElement("div", { "data-slot": "drafting-workspace-loading" }, "Loading"),
      }),
      container,
    )

    const root = document.querySelector('[data-slot="desktop-entrance-root"]')
    expect(root?.getAttribute("data-desktop-entrance")).toBe("loading")
  })

  it("reveals once drafting-surface is mounted and loading is gone", () => {
    mount(
      createElement(DesktopWorkspaceEntrance, {
        theme: "dark",
        children: createElement("div", { "data-slot": "drafting-surface" }, "Canvas"),
      }),
      container,
    )

    const root = document.querySelector('[data-slot="desktop-entrance-root"]')
    expect(root?.getAttribute("data-desktop-entrance")).toBe("revealing")
  })

  it("marks the entrance done after the staggered reveal window", () => {
    vi.useFakeTimers()

    mount(
      createElement(DesktopWorkspaceEntrance, {
        theme: "light",
        children: createElement("div", { "data-slot": "drafting-surface" }, "Canvas"),
      }),
      container,
    )

    act(() => {
      vi.advanceTimersByTime(950)
    })

    const root = document.querySelector('[data-slot="desktop-entrance-root"]')
    expect(root?.getAttribute("data-desktop-entrance")).toBe("done")
  })
})
