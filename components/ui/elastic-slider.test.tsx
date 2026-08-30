// @vitest-environment jsdom

import { act, type ReactElement } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ElasticSlider } from "@/components/ui/elastic-slider"
import { renderWithJsdomRoot } from "@/test-utils/jsdom-react-root"

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      disconnect() {}
      observe() {}
      unobserve() {}
    },
  )
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("ElasticSlider", () => {
  it("renders accessible slider state and formatted value text", () => {
    const { container } = renderSlider(
      <ElasticSlider
        label="Opacity"
        max={1}
        min={0}
        step={0.1}
        value={0.5}
        formatValue={(value) => `${Math.round(value * 100)}%`}
        onValueChange={vi.fn()}
      />,
    )

    const slider = getRequiredSlider(container, "Opacity")

    expect(slider.getAttribute("aria-valuemin")).toBe("0")
    expect(slider.getAttribute("aria-valuemax")).toBe("1")
    expect(slider.getAttribute("aria-valuenow")).toBe("0.5")
    expect(slider.getAttribute("aria-valuetext")).toBe("50%")
    expect(container.textContent).toContain("Opacity")
    expect(slider.getAttribute("aria-valuenow")).toBe("0.5")
  })

  it("uses slots animation for formatted numeric labels", () => {
    const { container } = renderSlider(
      <ElasticSlider
        label="Opacity"
        max={100}
        min={0}
        step={1}
        value={50}
        formatValue={(nextValue) => `${Math.round(nextValue)}%`}
        onValueChange={vi.fn()}
      />,
    )

    const valueSlot = container.querySelector('[data-slot="elastic-slider-value"]')

    expect(valueSlot?.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(0)
  })

  it("nudges controlled values from keyboard input", () => {
    const onValueChange = vi.fn()
    const { container } = renderSlider(
      <ElasticSlider
        label="Size"
        max={100}
        min={0}
        step={5}
        value={40}
        onValueChange={onValueChange}
      />,
    )
    const slider = getRequiredSlider(container, "Size")

    act(() => {
      slider.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }))
      slider.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }))
      slider.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Home" }))
      slider.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "End" }))
    })

    expect(onValueChange).toHaveBeenNthCalledWith(1, 45)
    expect(onValueChange).toHaveBeenNthCalledWith(2, 35)
    expect(onValueChange).toHaveBeenNthCalledWith(3, 0)
    expect(onValueChange).toHaveBeenNthCalledWith(4, 100)
  })

  it("renders muted variable hooks for desktop theming", () => {
    const { container } = renderSlider(
      <ElasticSlider
        className="desktop-elastic-slider"
        label="Speed"
        max={10}
        min={1}
        step={1}
        value={4}
        onValueChange={vi.fn()}
      />,
    )

    const root = container.querySelector('[data-slot="elastic-slider"]')

    expect(root?.className).toContain("--elastic-slider-bg")
    expect(root?.className).toContain("--elastic-slider-fill")
    expect(root?.className).toContain("--elastic-slider-handle")
    expect(root?.className).toContain("--elastic-slider-label")
    expect(root?.className).toContain("desktop-elastic-slider")
  })

  it("renders signed formatted values without animating the minus sign in slots mode", () => {
    const { container } = renderSlider(
      <ElasticSlider
        label="Rotation"
        max={360}
        min={-360}
        step={1}
        value={-18}
        formatValue={(nextValue) => `${Math.round(nextValue)}°`}
        onValueChange={vi.fn()}
      />,
    )

    const valueSlot = container.querySelector('[data-slot="elastic-slider-value"]')
    const calligraph = valueSlot?.querySelector(".elastic-slider-calligraph")

    expect(valueSlot?.textContent?.startsWith("-")).toBe(true)
    expect(calligraph?.getAttribute("aria-label")).toBe("18°")
    expect(valueSlot?.querySelector(':scope > span[aria-hidden="true"]')?.textContent).toBe("-")
  })

  it("updates the animated value readout when the controlled value changes", () => {
    const { container, rerender } = renderSlider(
      <ElasticSlider
        label="Radius"
        max={100}
        min={0}
        step={1}
        value={12}
        onValueChange={vi.fn()}
      />,
    )

    const slider = getRequiredSlider(container, "Radius")

    expect(slider.getAttribute("aria-valuenow")).toBe("12")
    expect(slider.getAttribute("aria-valuetext")).toBe("12")

    rerender(
      <ElasticSlider
        label="Radius"
        max={100}
        min={0}
        step={1}
        value={24}
        onValueChange={vi.fn()}
      />,
    )

    expect(slider.getAttribute("aria-valuenow")).toBe("24")
    expect(slider.getAttribute("aria-valuetext")).toBe("24")
  })

  it("yields vertical touch drags so the settings panel can scroll", () => {
    const onValueChange = vi.fn()
    const { container } = renderSlider(
      <ElasticSlider
        label="Spread"
        max={100}
        min={0}
        step={1}
        value={40}
        onValueChange={onValueChange}
      />,
    )
    const slider = stubSliderGeometry(getRequiredSlider(container, "Spread"))

    act(() => {
      slider.dispatchEvent(createPointerEvent("pointerdown", 80, 10, "touch"))
      slider.dispatchEvent(createPointerEvent("pointermove", 82, 40, "touch"))
      slider.dispatchEvent(createPointerEvent("pointerup", 82, 40, "touch"))
    })

    expect(onValueChange).not.toHaveBeenCalled()
    expect(slider.getAttribute("aria-valuenow")).toBe("40")
  })

  it("scrubs on a horizontal touch drag after the axis lock", () => {
    const onValueChange = vi.fn()
    const { container } = renderSlider(
      <ElasticSlider
        label="Spread"
        max={100}
        min={0}
        step={1}
        value={40}
        onValueChange={onValueChange}
      />,
    )
    const slider = stubSliderGeometry(getRequiredSlider(container, "Spread"))

    act(() => {
      slider.dispatchEvent(createPointerEvent("pointerdown", 80, 10, "touch"))
      slider.dispatchEvent(createPointerEvent("pointermove", 140, 12, "touch"))
      slider.dispatchEvent(createPointerEvent("pointerup", 140, 12, "touch"))
    })

    expect(onValueChange).toHaveBeenCalled()
    expect(Number(onValueChange.mock.calls.at(-1)?.[0])).toBeGreaterThan(40)
  })
})

function renderSlider(element: ReactElement) {
  return renderWithJsdomRoot(element)
}

function getRequiredSlider(container: HTMLElement, name: string) {
  const slider = container.querySelector<HTMLElement>(`[role="slider"][aria-label="${name}"]`)

  if (!slider) {
    throw new Error(`Missing slider: ${name}`)
  }

  return slider
}

function stubSliderGeometry(slider: HTMLElement) {
  const wrapper = slider.parentElement
  const rect = {
    x: 0,
    y: 0,
    width: 200,
    height: 36,
    top: 0,
    left: 0,
    right: 200,
    bottom: 36,
    toJSON() {
      return this
    },
  } as DOMRect

  if (wrapper) {
    Object.defineProperty(wrapper, "offsetWidth", { configurable: true, value: 200 })
    wrapper.getBoundingClientRect = () => rect
  }

  slider.getBoundingClientRect = () => rect
  return slider
}

function createPointerEvent(
  type: string,
  clientX: number,
  clientY: number,
  pointerType: "mouse" | "touch" | "pen",
) {
  return new PointerEvent(type, {
    bubbles: true,
    button: 0,
    cancelable: true,
    clientX,
    clientY,
    pointerId: 1,
    pointerType,
  })
}
