"use client"

import { ExportDownloadPopover } from "@/features/shell/components/ExportDownloadPopover"
import { UtilityToolbar } from "@/features/shell/components/UtilityToolbar"
import {
  MobileRedoIcon,
  MobileUndoIcon,
} from "@/features/shell/components/MobileHistoryIcons"
import type { InspectorModel } from "@/features/shell/hooks/use-toolbar-inspector-model"
import type { ThemeMode } from "@/features/shell/model/toolbar-types"
import { cn } from "@/lib/utils"

export function MobileWorkspaceTopBar({
  controller,
  model,
  theme,
}: {
  controller?: InspectorModel["controller"]
  model: InspectorModel
  theme: ThemeMode
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between px-2.5 pt-[max(0.625rem,env(safe-area-inset-top,0px))]"
      data-slot="mobile-workspace-top-bar"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[var(--glass-bg)] p-1 text-[var(--glass-fg)] shadow-sm backdrop-blur-md">
        <button
          aria-label="Undo"
          className={cn(
            "flex size-9 items-center justify-center rounded-full text-[var(--glass-fg)] transition-colors hover:text-[var(--glass-button-hover-fg)] disabled:opacity-40",
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
            "flex size-9 items-center justify-center rounded-full text-[var(--glass-fg)] transition-colors hover:text-[var(--glass-button-hover-fg)] disabled:opacity-40",
          )}
          disabled={!controller?.canRedo || !controller?.onRedo}
          type="button"
          onClick={() => controller?.onRedo?.()}
        >
          <MobileRedoIcon className="size-3.5" />
        </button>
      </div>
      <UtilityToolbar
        data-slot="mobile-utility-toolbar"
        className="pointer-events-auto gap-0 p-0"
      >
        <ExportDownloadPopover model={model} theme={theme} />
      </UtilityToolbar>
    </div>
  )
}
