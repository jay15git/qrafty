import { getMobileDrawerBottomOffsetPx } from "@/features/desktop-shell/components/mobile-family-drawer-viewport"

export const MOBILE_LAYER_TOOLBAR_GAP_PX = 8

export function syncMobileWorkspaceChromeInsets({
  drawerHeight,
  toolbarHeight,
  drawerBottomGapPx = 16,
  keyboardInsetPx = 0,
}: {
  drawerHeight: number
  toolbarHeight: number
  drawerBottomGapPx?: number
  keyboardInsetPx?: number
}) {
  const bottomOffset = getMobileDrawerBottomOffsetPx(drawerBottomGapPx, keyboardInsetPx)
  const drawerInset = Math.max(0, Math.round(drawerHeight + bottomOffset))
  const toolbarInset = Math.max(0, Math.round(toolbarHeight))
  const combinedInset = Math.max(
    0,
    Math.round(drawerInset + toolbarInset + (toolbarInset > 0 ? MOBILE_LAYER_TOOLBAR_GAP_PX : 0)),
  )

  const targets: Array<HTMLElement | null> = [
    document.documentElement,
    document.querySelector<HTMLElement>('[data-slot="desktop-workspace"]'),
    document.querySelector<HTMLElement>('[data-slot="desktop-floating-toolbar-root"]'),
  ]

  const chromeUnmeasured = drawerHeight === 0

  for (const target of targets) {
    target?.style.setProperty(
      "--mobile-drawer-keyboard-inset",
      `${Math.max(0, Math.round(keyboardInsetPx))}px`,
    )

    if (chromeUnmeasured) {
      // Keep CSS fallback inset (12rem drawer reserve) until chrome is measured.
      target?.style.removeProperty("--desktop-mobile-drawer-height")
      target?.style.removeProperty("--desktop-mobile-layer-toolbar-height")
      target?.style.removeProperty("--desktop-workspace-canvas-inset-bottom")
      continue
    }

    target?.style.setProperty("--desktop-mobile-drawer-height", `${drawerInset}px`)
    target?.style.setProperty("--desktop-mobile-layer-toolbar-height", `${toolbarInset}px`)
    target?.style.setProperty("--desktop-workspace-canvas-inset-bottom", `${combinedInset}px`)
  }
}

export function clearMobileWorkspaceChromeInsets() {
  syncMobileWorkspaceChromeInsets({ drawerHeight: 0, toolbarHeight: 0 })
}
