"use client";

import { useRef } from "react";
import { PopoverClose, PopoverContent } from "@/components/ui/popover";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import { useMobileSettingsDensity } from "@/features/shell/settings/MobileSettingsDensityContext";
import { SettingsPopoverCloseButton } from "@/features/shell/settings/settings-ui";
import { InsertMenuPanelStack } from "@/features/canvas/components/insert-menu/InsertMenuPanelStack";
import {
  INSERT_MENU_POPOVER_SHELL,
  INSERT_MENU_POPOVER_WIDTH,
  insertMenuPortalClass,
} from "@/features/canvas/components/insert-menu/insert-menu-styles";
import { createCanvasTextLayer } from "@/features/canvas/model/layers/factories";
import { cn } from "@/lib/utils";

import "@/features/shell/settings/settings.css";

type InsertMenuPopoverContentProps = {
  nodeId: string;
  onInsertLayer: (layer: ReturnType<typeof createCanvasTextLayer>) => void;
  canAddQrCode?: boolean;
  onAddQrCode?: () => void;
  onBrowseWallpapers?: () => void;
  isPopover?: boolean;
  popoverSide?: "top" | "bottom" | "left" | "right";
  theme?: ThemeMode;
};

export function InsertMenuPopoverContent({
  nodeId,
  onInsertLayer,
  canAddQrCode = true,
  onAddQrCode,
  onBrowseWallpapers,
  isPopover = true,
  popoverSide = "bottom",
  theme = "dark",
}: InsertMenuPopoverContentProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const mobileDensity = useMobileSettingsDensity();

  function closeMenu() {
    closeRef.current?.click();
  }

  return (
    <PopoverContent
      align={isPopover ? "center" : "start"}
      className={
        isPopover
          ? insertMenuPortalClass(
              theme,
              cn(INSERT_MENU_POPOVER_SHELL, INSERT_MENU_POPOVER_WIDTH, "flex flex-col"),
            )
          : "w-[min(24rem,calc(100vw-2rem))] space-y-3 border-[var(--canvas-line)] bg-[var(--panel-bg)] p-3"
      }
      data-slot={isPopover ? "canvas-insert-menu-popover" : "canvas-insert-menu"}
      data-mobile-settings={isPopover && mobileDensity ? "" : undefined}
      data-theme={isPopover ? theme : undefined}
      side={popoverSide}
      sideOffset={isPopover ? 12 : undefined}
    >
      {isPopover ? (
        <div className="ds-settings-popover-header">
          <p className="ds-settings-popover-title">Add element</p>
          <PopoverClose asChild>
            <SettingsPopoverCloseButton title="Add element" />
          </PopoverClose>
        </div>
      ) : null}
      <InsertMenuPanelStack
        canAddQrCode={canAddQrCode}
        isPopover={isPopover}
        nodeId={nodeId}
        onAddQrCode={onAddQrCode}
        onBrowseWallpapers={onBrowseWallpapers}
        onClose={closeMenu}
        onInsertLayer={onInsertLayer}
        theme={theme}
      />
      <PopoverClose ref={closeRef} className="sr-only" type="button">
        Close
      </PopoverClose>
    </PopoverContent>
  );
}
