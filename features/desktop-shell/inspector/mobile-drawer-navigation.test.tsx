// @vitest-environment jsdom

import { act, useState } from "react"
import { beforeEach, describe, expect, it } from "vitest"

import { ElasticSlider } from "@/components/ui/elastic-slider"
import {
  MobileDetailStackOutlets,
  MobileDrawerNavigationProvider,
  useMobileDrawerNavigation,
} from "@/features/desktop-shell/inspector/mobile-drawer-navigation-context"
import { LogoIconPicker } from "@/features/desktop-shell/inspector/settings-pickers"
import { MobileInspectorDensityContext } from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import { SettingsRowPopover } from "@/features/desktop-shell/inspector/settings-ui"
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root"

function NavigationProbe({
  onReady,
}: {
  onReady: (nav: ReturnType<typeof useMobileDrawerNavigation>) => void
}) {
  const nav = useMobileDrawerNavigation()
  onReady(nav)
  return <div data-slot="navigation-probe" />
}

describe("MobileDrawerNavigationProvider", () => {
  beforeEach(() => {
    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(window, "ResizeObserver", {
      configurable: true,
      writable: true,
      value: MockResizeObserver,
    })
  })

  it("opens and closes setting detail views with return navigation", async () => {
    let currentView = "qr"
    const setView = (view: string) => {
      currentView = view
    }

    let navigation: ReturnType<typeof useMobileDrawerNavigation> = null

    const surface = await renderWithAsyncJsdomRoot(
      <MobileDrawerNavigationProvider currentView={currentView} setView={setView}>
        <NavigationProbe
          onReady={(nav) => {
            navigation = nav
          }}
        />
      </MobileDrawerNavigationProvider>,
    )

    expect(surface.container.querySelector('[data-slot="navigation-probe"]')).not.toBeNull()
    expect(navigation).not.toBeNull()

    await act(async () => {
      navigation?.openDetail({
        title: "Fill",
        content: <div data-slot="detail-content">Picker</div>,
      })
    })

    expect(currentView).toBe("setting-detail")
    expect(navigation?.detailPayload?.title).toBe("Fill")

    await act(async () => {
      navigation?.closeDetail()
    })

    expect(currentView).toBe("qr")
    expect(navigation?.detailPayload).toBeNull()
  })

  it("pops nested setting details before returning to the section view", async () => {
    let currentView = "background"
    const setView = (view: string) => {
      currentView = view
    }

    let navigation: ReturnType<typeof useMobileDrawerNavigation> = null

    await renderWithAsyncJsdomRoot(
      <MobileDrawerNavigationProvider currentView={currentView} setView={setView}>
        <NavigationProbe
          onReady={(nav) => {
            navigation = nav
          }}
        />
      </MobileDrawerNavigationProvider>,
    )

    await act(async () => {
      navigation?.openDetail({
        title: "Shader settings",
        content: <div data-slot="shader-options">Options</div>,
      })
    })

    expect(currentView).toBe("setting-detail")
    expect(navigation?.detailPayload?.title).toBe("Shader settings")

    await act(async () => {
      currentView = "setting-detail"
      navigation?.openDetail({
        title: "Colors",
        content: <div data-slot="shader-colors">Colors</div>,
      })
    })

    expect(currentView).toBe("setting-detail")
    expect(navigation?.detailPayload?.title).toBe("Colors")

    await act(async () => {
      navigation?.closeDetail()
    })

    expect(currentView).toBe("setting-detail")
    expect(navigation?.detailPayload?.title).toBe("Shader settings")

    await act(async () => {
      navigation?.closeDetail()
    })

    expect(currentView).toBe("background")
    expect(navigation?.detailPayload).toBeNull()
  })

  it("recovers to default when closing an empty setting-detail view", async () => {
    let currentView = "setting-detail"
    const setView = (view: string) => {
      currentView = view
    }

    let navigation: ReturnType<typeof useMobileDrawerNavigation> = null

    await renderWithAsyncJsdomRoot(
      <MobileDrawerNavigationProvider currentView={currentView} setView={setView}>
        <NavigationProbe
          onReady={(nav) => {
            navigation = nav
          }}
        />
      </MobileDrawerNavigationProvider>,
    )

    await act(async () => {
      navigation?.closeDetail()
    })

    expect(currentView).toBe("default")
    expect(navigation?.detailPayload).toBeNull()
  })

  it("does not close setting detail when a logo is selected", async () => {
    let currentView = "qr"
    const setView = (view: string) => {
      currentView = view
    }

    const surface = await renderWithAsyncJsdomRoot(
      <MobileInspectorDensityContext.Provider value={true}>
        <MobileDrawerNavigationProvider currentView={currentView} setView={setView}>
          <SettingsRowPopover hideHint open trigger="Logo">
            <LogoIconPicker
              selectedId="github"
              onSelect={() => {}}
            />
          </SettingsRowPopover>
          <MobileDetailStackOutlets />
        </MobileDrawerNavigationProvider>
      </MobileInspectorDensityContext.Provider>,
    )

    const openButton = surface.container.querySelector<HTMLButtonElement>(
      'button[type="button"]',
    )

    await act(async () => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(currentView).toBe("setting-detail")

    const logoTile = surface.container.querySelector<HTMLButtonElement>(
      'button[aria-label*="brand icon"]',
    )

    await act(async () => {
      logoTile?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(currentView).toBe("setting-detail")
  })

  it("keeps nested setting-detail sliders live after parent state changes", async () => {
    HTMLElement.prototype.setPointerCapture = () => {}
    HTMLElement.prototype.releasePointerCapture = () => {}
    HTMLElement.prototype.hasPointerCapture = () => false

    let currentView = "element"
    const setView = (view: string) => {
      currentView = view
    }

    function ShaderSliderHarness() {
      const [value, setValue] = useState(0.13)

      return (
        <MobileInspectorDensityContext.Provider value={true}>
          <MobileDrawerNavigationProvider currentView={currentView} setView={setView}>
            <SettingsRowPopover title="Shader settings" trigger="Options">
              <ElasticSlider
                label="Distortion"
                max={1}
                min={0}
                step={0.01}
                value={value}
                onValueChange={setValue}
              />
            </SettingsRowPopover>
            <MobileDetailStackOutlets />
          </MobileDrawerNavigationProvider>
        </MobileInspectorDensityContext.Provider>
      )
    }

    const surface = await renderWithAsyncJsdomRoot(<ShaderSliderHarness />)
    const openButton = surface.container.querySelector<HTMLButtonElement>(
      'button[type="button"]',
    )

    await act(async () => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(currentView).toBe("setting-detail")

    const slider = surface.container.querySelector<HTMLElement>(
      '[role="slider"][aria-label="Distortion"]',
    )

    if (!slider) {
      throw new Error("Missing Distortion slider")
    }

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

    expect(slider.getAttribute("aria-valuenow")).toBe("0.13")

    await act(async () => {
      slider.dispatchEvent(
        new PointerEvent("pointerdown", {
          bubbles: true,
          button: 0,
          cancelable: true,
          clientX: 26,
          clientY: 10,
          pointerId: 1,
          pointerType: "mouse",
        }),
      )
      slider.dispatchEvent(
        new PointerEvent("pointermove", {
          bubbles: true,
          button: 0,
          cancelable: true,
          clientX: 160,
          clientY: 10,
          pointerId: 1,
          pointerType: "mouse",
        }),
      )
      slider.dispatchEvent(
        new PointerEvent("pointerup", {
          bubbles: true,
          button: 0,
          cancelable: true,
          clientX: 160,
          clientY: 10,
          pointerId: 1,
          pointerType: "mouse",
        }),
      )
    })

    expect(Number(slider.getAttribute("aria-valuenow"))).toBeGreaterThan(0.13)
  })
})
