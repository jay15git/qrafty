// @vitest-environment jsdom

import { act, useState } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DesktopNewFillPicker } from "@/features/desktop-shell/inspector/desktopnew-fill-picker"
import { studioGradientToFillCss } from "@/features/desktop-shell/inspector/desktopnew-settings-bridge"
import { degreesToRadians } from "@/features/qr-code/styles/gradient-controls"

describe("DesktopNewFillPicker", () => {
  beforeEach(() => {
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
      .IS_REACT_ACT_ENVIRONMENT = true
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      value: vi.fn(),
    })
    class ResizeObserverStub {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverStub)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("switches to the gradient pane without a hooks crash", () => {
    const container = document.createElement("div")
    const root = createRoot(container)

    function Harness() {
      const [value, setValue] = useState("#111111")
      return <DesktopNewFillPicker value={value} onValueChange={(_fill, css) => setValue(css)} />
    }

    act(() => {
      root.render(<Harness />)
    })

    expect(container.querySelector('[data-slot="color-picker-area"]')).not.toBeNull()

    const gradientTab = Array.from(container.querySelectorAll('[role="tab"]')).find(
      (tab) => tab.textContent === "Gradient",
    )
    expect(gradientTab).toBeDefined()

    expect(() => {
      act(() => {
        gradientTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      })
    }).not.toThrow()

    expect(container.querySelector('[data-slot="gradient-bar"]')).not.toBeNull()
    expect(container.querySelector('[data-slot="color-picker-area"]')).toBeNull()

    act(() => {
      root.unmount()
    })
  })

  it("opens on the gradient tab when the value is a gradient", () => {
    const container = document.createElement("div")
    const root = createRoot(container)
    const css = studioGradientToFillCss({
      enabled: true,
      type: "linear",
      rotation: degreesToRadians(90),
      colorStops: [
        { offset: 0, color: "#111111" },
        { offset: 1, color: "#eeeeee" },
      ],
    })

    act(() => {
      root.render(<DesktopNewFillPicker value={css} onValueChange={() => undefined} />)
    })

    expect(container.querySelector('[data-slot="gradient-bar"]')).not.toBeNull()
    expect(
      container.querySelector('[role="tab"][aria-selected="true"]')?.textContent,
    ).toBe("Gradient")

    act(() => {
      root.unmount()
    })
  })
})
