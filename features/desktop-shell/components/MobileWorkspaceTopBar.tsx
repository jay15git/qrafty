"use client"

import { DesktopExportDownloadPopover } from "@/features/desktop-shell/components/DesktopExportDownloadPopover"
import { DesktopUtilityToolbar } from "@/features/desktop-shell/components/DesktopUtilityToolbar"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import type { DesktopThemeMode } from "@/features/desktop-shell/model/desktop-toolbar-types"
import { cn } from "@/lib/utils"

function MobileUndoIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M15.13 19.0596H7.13C6.72 19.0596 6.38 18.7196 6.38 18.3096C6.38 17.8996 6.72 17.5596 7.13 17.5596H15.13C17.47 17.5596 19.38 15.6496 19.38 13.3096C19.38 10.9696 17.47 9.05957 15.13 9.05957H4.13C3.72 9.05957 3.38 8.71957 3.38 8.30957C3.38 7.89957 3.72 7.55957 4.13 7.55957H15.13C18.3 7.55957 20.88 10.1396 20.88 13.3096C20.88 16.4796 18.3 19.0596 15.13 19.0596Z" />
      <path d="M6.43006 11.5599C6.24006 11.5599 6.05006 11.4899 5.90006 11.3399L3.34006 8.77988C3.05006 8.48988 3.05006 8.00988 3.34006 7.71988L5.90006 5.15988C6.19006 4.86988 6.67006 4.86988 6.96006 5.15988C7.25006 5.44988 7.25006 5.92988 6.96006 6.21988L4.93006 8.24988L6.96006 10.2799C7.25006 10.5699 7.25006 11.0499 6.96006 11.3399C6.82006 11.4899 6.62006 11.5599 6.43006 11.5599Z" />
    </svg>
  )
}

function MobileRedoIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16.87 19.0596H8.87C5.7 19.0596 3.12 16.4796 3.12 13.3096C3.12 10.1396 5.7 7.55957 8.87 7.55957H19.87C20.28 7.55957 20.62 7.89957 20.62 8.30957C20.62 8.71957 20.28 9.05957 19.87 9.05957H8.87C6.53 9.05957 4.62 10.9696 4.62 13.3096C4.62 15.6496 6.53 17.5596 8.87 17.5596H16.87C17.28 17.5596 17.62 17.8996 17.62 18.3096C17.62 18.7196 17.29 19.0596 16.87 19.0596Z" />
      <path d="M17.57 11.5599C17.38 11.5599 17.19 11.4899 17.04 11.3399C16.75 11.0499 16.75 10.5699 17.04 10.2799L19.07 8.24988L17.04 6.21988C16.75 5.92988 16.75 5.44988 17.04 5.15988C17.33 4.86988 17.81 4.86988 18.1 5.15988L20.66 7.71988C20.95 8.00988 20.95 8.48988 20.66 8.77988L18.1 11.3399C17.95 11.4899 17.76 11.5599 17.57 11.5599Z" />
    </svg>
  )
}

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
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/60 bg-background/90 p-1 shadow-sm backdrop-blur-md">
        <button
          aria-label="Undo"
          className={cn(
            "flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent disabled:opacity-40",
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
            "flex size-9 items-center justify-center rounded-full text-foreground transition-colors hover:bg-accent disabled:opacity-40",
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
