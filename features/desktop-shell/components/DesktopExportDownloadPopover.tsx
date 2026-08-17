"use client"

import { useState } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DesktopSquircleDownloadButton } from "@/features/desktop-shell/components/DesktopSquircleDownloadButton"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import type {
  DesktopInspectorModel,
  DesktopThemeMode,
} from "@/features/desktop-shell/components/FloatingToolbar"
import { DesktopExportSettingsPanel } from "@/features/desktop-shell/inspector/DesktopExportSettingsPanel"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"

import "@/features/desktop-shell/inspector/desktopnew.css"

export function DesktopExportDownloadPopover({
  model,
  theme,
}: {
  model: DesktopInspectorModel
  theme: DesktopThemeMode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <DesktopTooltip content="Export" side="left" sideOffset={10}>
        <PopoverTrigger asChild>
          <DesktopSquircleDownloadButton data-state={open ? "open" : "closed"} />
        </PopoverTrigger>
      </DesktopTooltip>
      <PopoverContent
        align="end"
        data-slot="desktop-export-popover"
        side="left"
        sideOffset={12}
        className="z-[20000] flex max-h-[min(28rem,calc(100dvh-8rem))] w-[min(18rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[16px] border border-[var(--desktop-appearance-popover-border)] bg-[var(--desktop-appearance-popover-bg)] p-0 text-[var(--desktop-inspector-fg-secondary)] shadow-[var(--desktop-appearance-popover-shadow)]"
      >
        <ScrollArea
          chevron
          cueSize="comfortable"
          className="min-h-0 flex-1"
          data-slot="desktop-inspector-scroll-area"
          scrollFade
          viewportClassName="px-3 py-3"
        >
          <div
            className="desktopnew-root desktopnew-embedded w-full min-w-0"
            data-theme={theme}
            data-slot="desktop-export-popover-content"
          >
            <DesktopnewThemeContext.Provider value={theme}>
              <DesktopExportSettingsPanel model={model} />
            </DesktopnewThemeContext.Provider>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
