"use client"

import { DesktopExportDownloadPopover } from "@/features/desktop-shell/components/DesktopExportDownloadPopover"
import { DesktopUtilityToolbar } from "@/features/desktop-shell/components/DesktopUtilityToolbar"
import {
  MobileRedoIcon,
  MobileUndoIcon,
} from "@/features/desktop-shell/components/MobileHistoryIcons"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import type { DesktopThemeMode } from "@/features/desktop-shell/model/desktop-toolbar-types"
import { cn } from "@/lib/utils"

export function MobileWorkspaceTopBar({
  controller,
  model,
  theme,
}: {
  controller?: DesktopInspectorModel["controller"]
  model: DesktopInspectorModel
  theme: DesktopThemeMode
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-2.5 pt-[max(0.625rem,env(safe-area-inset-top,0px))]"
      data-slot="mobile-workspace-top-bar"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-[var(--desktop-glass-border)] bg-[var(--desktop-glass-bg)] p-1 text-[var(--desktop-glass-fg)] shadow-sm backdrop-blur-md">
        <button
          aria-label="Undo"
          className={cn(
            "flex size-9 items-center justify-center rounded-full text-[var(--desktop-glass-fg)] transition-colors hover:bg-[var(--desktop-glass-button-hover-bg)] hover:text-[var(--desktop-glass-button-hover-fg)] disabled:opacity-40",
          )}
          disabled={!controller?.canUndo || !controller?.onUndo}
          type="button"
          onClick={() => controller?.onUndo?.()}
        >
          <MobileUndoIcon className="size-3.5" />
        </button>
        <button
          aria-label="Redo"
          className={cn(
            "flex size-9 items-center justify-center rounded-full text-[var(--desktop-glass-fg)] transition-colors hover:bg-[var(--desktop-glass-button-hover-bg)] hover:text-[var(--desktop-glass-button-hover-fg)] disabled:opacity-40",
          )}
          disabled={!controller?.canRedo || !controller?.onRedo}
          type="button"
          onClick={() => controller?.onRedo?.()}
        >
          <MobileRedoIcon className="size-3.5" />
        </button>
      </div>
      <DesktopUtilityToolbar
        data-slot="mobile-utility-toolbar"
        className="pointer-events-auto gap-0 p-0"
      >
        <DesktopExportDownloadPopover model={model} theme={theme} />
      </DesktopUtilityToolbar>
    </div>
  )
}
