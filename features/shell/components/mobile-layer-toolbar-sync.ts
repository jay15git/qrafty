import { getMobileDrawerBottomOffsetPx } from "@/features/shell/components/mobile-family-drawer-viewport";

export const MOBILE_LAYER_TOOLBAR_GAP_PX = 8;

export function syncMobileWorkspaceChromeInsets({
  drawerHeight,
  toolbarHeight,
  drawerBottomGapPx = 16,
  keyboardInsetPx = 0,
}: {
  drawerHeight: number;
  toolbarHeight: number;
  drawerBottomGapPx?: number;
  keyboardInsetPx?: number;
}) {
  const bottomOffset = getMobileDrawerBottomOffsetPx(drawerBottomGapPx, keyboardInsetPx);
  const drawerInset = Math.max(0, Math.round(drawerHeight + bottomOffset));
  const toolbarInset = Math.max(0, Math.round(toolbarHeight));
  const combinedInset = Math.max(
    0,
    Math.round(drawerInset + toolbarInset + (toolbarInset > 0 ? MOBILE_LAYER_TOOLBAR_GAP_PX : 0)),
  );

  const targets: Array<HTMLElement | null> = [
    document.documentElement,
    document.querySelector<HTMLElement>('[data-slot="workspace"]'),
    document.querySelector<HTMLElement>('[data-slot="floating-toolbar-root"]'),
  ];

  const chromeUnmeasured = drawerHeight === 0;

  for (const target of targets) {
    target?.style.setProperty(
      "--mobile-drawer-keyboard-inset",
      `${Math.max(0, Math.round(keyboardInsetPx))}px`,
    );

    if (chromeUnmeasured) {
      // Keep CSS fallback inset (12rem drawer reserve) until chrome is measured.
      target?.style.removeProperty("--mobile-drawer-height");
      target?.style.removeProperty("--mobile-layer-toolbar-height");
      target?.style.removeProperty("--canvas-inset-bottom");
      continue;
    }

    target?.style.setProperty("--mobile-drawer-height", `${drawerInset}px`);
    target?.style.setProperty("--mobile-layer-toolbar-height", `${toolbarInset}px`);
    target?.style.setProperty("--canvas-inset-bottom", `${combinedInset}px`);
  }
}

export function clearMobileWorkspaceChromeInsets() {
  syncMobileWorkspaceChromeInsets({ drawerHeight: 0, toolbarHeight: 0 });
}
