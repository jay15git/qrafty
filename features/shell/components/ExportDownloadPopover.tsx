"use client";

import { useState } from "react";

import { MoreVerticalIcon } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOptionalBlurFadeThemeTransition } from "@/components/ui/BlurFadeThemeTransition";
import { DownloadButton } from "@/features/shell/components/DownloadButton";
import { CUELUME_BUTTON } from "@/features/shell/audio/cuelume";
import { useCuelume } from "@/features/shell/hooks/use-cuelume";
import type { SettingsModel, ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import { ExportSettingsPanel } from "@/features/shell/settings/ExportSettingsPanel";
import { SettingsSwitchRow } from "@/features/shell/settings/settings-ui";
import { SettingsThemeContext } from "@/features/shell/settings/theme-context";
import { cn } from "@/lib/utils";

import "@/features/shell/settings/settings.css";

const OPTION_ROW_CLASS =
  "relative grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent p-0 text-[var(--glass-fg)] shadow-none transition-colors hover:text-[var(--glass-button-hover-fg,currentColor)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--glass-button-focus-ring)] motion-reduce:transition-none max-md:size-11";

/** Dark mode + sound preferences behind the pill's ellipsis. */
function WorkspaceOptionsMenu({ model, theme }: { model: SettingsModel; theme: ThemeMode }) {
  const [open, setOpen] = useState(false);
  const { soundsEnabled, setSoundsEnabled } = useCuelume();
  const themeTransition = useOptionalBlurFadeThemeTransition();

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          aria-label="More options"
          className={OPTION_ROW_CLASS}
          data-slot="workspace-options-trigger"
          data-state={open ? "open" : "closed"}
          type="button"
          {...CUELUME_BUTTON}
        >
          <MoreVerticalIcon aria-hidden className="size-4" strokeWidth={2} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={12}
        data-slot="workspace-options-menu"
        data-theme={theme}
        side="bottom"
        sideOffset={12}
        className={cn(
          "ds-portal-surface ds-popover-content ds-popover-flat z-[var(--z-popover)] w-[11rem] overflow-hidden p-1 ds-squircle-md",
          theme === "dark" && "dark",
        )}
      >
        <div className="ds-root ds-embedded flex w-full min-w-0 flex-col gap-1" data-theme={theme}>
          <SettingsThemeContext.Provider value={theme}>
            <SettingsSwitchRow checked={soundsEnabled} label="Sound" onChange={setSoundsEnabled} />
            <SettingsSwitchRow
              checked={theme === "dark"}
              label="Dark mode"
              onChange={() => {
                if (themeTransition) {
                  themeTransition.triggerTransition();
                } else {
                  model.onThemeChange(theme === "light" ? "dark" : "light");
                }
              }}
            />
          </SettingsThemeContext.Provider>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ExportDownloadPopover({
  model,
  theme,
}: {
  model: SettingsModel;
  theme: ThemeMode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <div
        data-slot="island-pill"
        className="ds-resize t-resize inline-flex items-center rounded-full bg-[var(--glass-bg)] p-1 backdrop-blur-xl"
      >
        <PopoverTrigger asChild>
          <DownloadButton data-state={open ? "open" : "closed"} />
        </PopoverTrigger>
        <WorkspaceOptionsMenu model={model} theme={theme} />
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
          data-slot="settings-scroll-area"
          scrollFade
          viewportClassName="px-3 py-3"
        >
          <div
            className="ds-root ds-embedded w-full min-w-0"
            data-theme={theme}
            data-slot="export-popover-content"
          >
            <SettingsThemeContext.Provider value={theme}>
              <ExportSettingsPanel model={model} />
            </SettingsThemeContext.Provider>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
