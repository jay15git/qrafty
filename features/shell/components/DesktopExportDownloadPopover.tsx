"use client"

import { useState } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DesktopDownloadButton } from "@/features/shell/components/DesktopDownloadButton"
import type {
  DesktopInspectorModel,
  DesktopThemeMode,
} from "@/features/shell/components/FloatingToolbar"
import { DesktopExportSettingsPanel } from "@/features/shell/inspector/DesktopExportSettingsPanel"
import { DesktopnewThemeContext } from "@/features/shell/inspector/theme-context"
import { cn } from "@/lib/utils"

import "@/features/shell/inspector/inspector.css"

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
      <div
        data-slot="tooltip-navbar-shell"
        className="inline-flex items-center rounded-full bg-[var(--glass-bg)] p-1 backdrop-blur-xl"
      >
        <PopoverTrigger asChild>
          <DesktopDownloadButton data-state={open ? "open" : "closed"} />
        </PopoverTrigger>
      </div>
      <PopoverContent
        align="end"
        collisionPadding={12}
        data-slot="desktop-export-popover"
        data-theme={theme}
        side="bottom"
        sideOffset={12}
        className={cn(
          "dn-portal-surface desktopnew-popover-content dn-popover-flat z-[20000] grid max-h-[min(28rem,calc(100dvh-8rem))] w-[min(18rem,calc(100vw-1rem))] grid-rows-[minmax(0,1fr)] overflow-hidden p-0 dn-squircle-md",
          theme === "dark" && "dark",
        )}
      >
        <ScrollArea
          chevron
          cueSize="comfortable"
          className="min-h-0"
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
