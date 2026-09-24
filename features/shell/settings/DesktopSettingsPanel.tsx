"use client";

import { WallpaperPanel } from "@/features/shell/components/WallpaperPanel";
import type { SettingsModel, ToolbarToolId } from "@/features/shell/components/WorkspaceChrome";
import { SettingsPanel } from "@/features/shell/settings/SettingsPanel";
import { SettingsThemeContext } from "@/features/shell/settings/theme-context";
import { cn } from "@/lib/utils";

import "@/features/shell/settings/settings.css";

export function DesktopSettingsPanel({
  activeTool,
  className,
  model,
}: {
  activeTool: ToolbarToolId | null;
  className?: string;
  model: SettingsModel;
}) {
  const { actualTheme, controller } = model;
  const showWallpapersSettings = controller?.composeSidebarPanel === "wallpapers";

  if (showWallpapersSettings) {
    return (
      <aside
        aria-label="Wallpapers"
        className={cn("flex h-full min-h-0 min-w-0 flex-col overflow-hidden", className)}
        data-slot="desktop-settings-panel-host"
      >
        <WallpaperPanel
          onClose={() => controller?.onCloseComposeSidebar?.()}
          onSelectWallpaper={(imagePath) => controller?.onSelectWallpaper?.(imagePath)}
        />
      </aside>
    );
  }

  return (
    <aside
      aria-label="Settings"
      className={cn("flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden", className)}
      data-slot="desktop-settings-panel"
    >
      <div className="ds-root ds-embedded h-full min-h-0 w-full" data-theme={actualTheme}>
        <SettingsThemeContext.Provider value={actualTheme}>
          <SettingsPanel fillHeight model={model} />
        </SettingsThemeContext.Provider>
      </div>
    </aside>
  );
}
