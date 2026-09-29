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
  popoverSide?: "top" | "bottom" | "left" | "right";
  theme?: ThemeMode;
};

export function InsertMenuPopoverContent({
  nodeId,
  onInsertLayer,
  canAddQrCode = true,
  onAddQrCode,
  onBrowseWallpapers,
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
      align="center"
      className={insertMenuPortalClass(
        theme,
        cn(INSERT_MENU_POPOVER_SHELL, INSERT_MENU_POPOVER_WIDTH, "flex flex-col"),
      )}
      data-slot="canvas-insert-menu-popover"
      data-mobile-settings={mobileDensity ? "" : undefined}
      data-theme={theme}
      side={popoverSide}
      sideOffset={12}
    >
      <div className="ds-settings-popover-header">
        <p className="ds-settings-popover-title">Add element</p>
        <PopoverClose asChild>
          <SettingsPopoverCloseButton title="Add element" />
        </PopoverClose>
      </div>
      <InsertMenuPanelStack
        canAddQrCode={canAddQrCode}
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
