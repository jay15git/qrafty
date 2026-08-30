// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest"

import { syncMobileWorkspaceChromeInsets } from "@/features/desktop-shell/components/mobile-layer-toolbar-sync"

describe("syncMobileWorkspaceChromeInsets", () => {
  afterEach(() => {
    document.documentElement.style.cssText = ""
  })

  it("keeps css fallback insets before mobile chrome is measured", () => {
    document.documentElement.style.setProperty("--desktop-workspace-canvas-inset-bottom", "240px")

    syncMobileWorkspaceChromeInsets({
      drawerHeight: 0,
      toolbarHeight: 0,
      drawerBottomGapPx: 16,
      keyboardInsetPx: 0,
    })

    expect(
      document.documentElement.style.getPropertyValue("--desktop-workspace-canvas-inset-bottom"),
    ).toBe("")
  })

  it("skips partial inset sync when only the toolbar is measured", () => {
    document.documentElement.style.setProperty("--desktop-workspace-canvas-inset-bottom", "240px")

    syncMobileWorkspaceChromeInsets({
      drawerHeight: 0,
      toolbarHeight: 54,
      drawerBottomGapPx: 16,
      keyboardInsetPx: 0,
    })

    expect(
      document.documentElement.style.getPropertyValue("--desktop-workspace-canvas-inset-bottom"),
    ).toBe("")
  })

  it("keeps the resting bottom gap when the keyboard is closed", () => {
    syncMobileWorkspaceChromeInsets({
      drawerHeight: 120,
      toolbarHeight: 0,
      drawerBottomGapPx: 16,
      keyboardInsetPx: 0,
    })

    expect(document.documentElement.style.getPropertyValue("--desktop-mobile-drawer-height")).toBe(
      "136px",
    )
    expect(document.documentElement.style.getPropertyValue("--mobile-drawer-keyboard-inset")).toBe(
      "0px",
    )
  })

  it("lifts chrome by the keyboard overlap instead of stacking it on the resting gap", () => {
    syncMobileWorkspaceChromeInsets({
      drawerHeight: 120,
      toolbarHeight: 40,
      drawerBottomGapPx: 16,
      keyboardInsetPx: 300,
    })

    expect(document.documentElement.style.getPropertyValue("--desktop-mobile-drawer-height")).toBe(
      "420px",
    )
    expect(document.documentElement.style.getPropertyValue("--mobile-drawer-keyboard-inset")).toBe(
      "300px",
    )
    expect(
      document.documentElement.style.getPropertyValue("--desktop-workspace-canvas-inset-bottom"),
    ).toBe("468px")
  })
})
