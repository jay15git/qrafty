// @vitest-environment jsdom

import { act } from "react"
import { beforeEach, describe, expect, it } from "vitest"

import {
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
})
