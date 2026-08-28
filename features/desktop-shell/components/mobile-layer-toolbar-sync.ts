export const MOBILE_LAYER_TOOLBAR_GAP_PX = 8

export function syncMobileWorkspaceChromeInsets({
  drawerHeight,
  toolbarHeight,
  drawerBottomGapPx = 16,
}: {
  drawerHeight: number
  toolbarHeight: number
  drawerBottomGapPx?: number
}) {
  const drawerInset = Math.max(0, Math.round(drawerHeight + drawerBottomGapPx))
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

  for (const target of targets) {
    target?.style.setProperty("--desktop-mobile-drawer-height", `${drawerInset}px`)
    target?.style.setProperty("--desktop-mobile-layer-toolbar-height", `${toolbarInset}px`)
    target?.style.setProperty("--desktop-workspace-canvas-inset-bottom", `${combinedInset}px`)
  }
}

export function clearMobileWorkspaceChromeInsets() {
  syncMobileWorkspaceChromeInsets({ drawerHeight: 0, toolbarHeight: 0 })
}
