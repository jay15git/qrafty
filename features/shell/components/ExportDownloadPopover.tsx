"use client";

import { useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DownloadButton } from "@/features/shell/components/DownloadButton";
import type { InspectorModel, ThemeMode } from "@/features/shell/components/FloatingToolbar";
import { ExportSettingsPanel } from "@/features/shell/inspector/ExportSettingsPanel";
import { InspectorThemeContext } from "@/features/shell/inspector/theme-context";
import { cn } from "@/lib/utils";

import "@/features/shell/inspector/inspector.css";

export function ExportDownloadPopover({
  model,
  theme,
}: {
  model: InspectorModel;
  theme: ThemeMode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <div
        data-slot="tooltip-navbar-shell"
        className="inline-flex items-center rounded-full bg-[var(--glass-bg)] p-1 backdrop-blur-xl"
      >
        <PopoverTrigger asChild>
          <DownloadButton data-state={open ? "open" : "closed"} />
        </PopoverTrigger>
      </div>
      <PopoverContent
        align="end"
        collisionPadding={12}
        data-slot="export-popover"
        data-theme={theme}
        side="bottom"
        sideOffset={12}
        className={cn(
          "ds-portal-surface ds-popover-content ds-popover-flat z-[var(--z-popover)] grid max-h-[var(--popover-max-h)] w-[var(--popover-width)] grid-rows-[minmax(0,1fr)] overflow-hidden p-0 ds-squircle-md",
          theme === "dark" && "dark",
        )}
      >
        <ScrollArea
          chevron
          cueSize="comfortable"
          className="min-h-0"
          data-slot="inspector-scroll-area"
          scrollFade
          viewportClassName="px-3 py-3"
        >
          <div
            className="ds-root ds-embedded w-full min-w-0"
            data-theme={theme}
            data-slot="export-popover-content"
          >
            <InspectorThemeContext.Provider value={theme}>
              <ExportSettingsPanel model={model} />
            </InspectorThemeContext.Provider>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
