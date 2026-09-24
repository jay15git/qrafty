"use client";

import { useState } from "react";

import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import { LayersPopoverContent } from "@/features/shell/components/LayersPopoverContent";
import { useMobileSettingsDensity } from "@/features/shell/settings/MobileSettingsDensityContext";
import { SettingsRowPopover } from "@/features/shell/settings/settings-ui";
import { InsertMenuPanelStack } from "@/features/canvas/components/insert-menu/InsertMenuPanelStack";

const SECTION_STACK = "ds-section-stack";

export function ElementsSection({ model }: { model: SettingsModel }) {
  const [addElementOpen, setAddElementOpen] = useState(false);
  const mobileDensity = useMobileSettingsDensity();
  const controller = model.controller;
  const nodeId = controller?.insertNodeId;
  const onInsertLayer = controller?.onInsertLayer;
  const layerCount = model.actualLayersSettings.layers.length;

  const insertMenu =
    nodeId && onInsertLayer ? (
      <InsertMenuPanelStack
        canAddQrCode={controller?.canAddQrCode}
        isPopover
        nodeId={nodeId}
        onAddQrCode={controller?.onAddQrCode}
        onBrowseWallpapers={
          controller?.onOpenComposeSidebar
            ? () => controller.onOpenComposeSidebar?.("wallpapers")
            : undefined
        }
        onClose={() => setAddElementOpen(false)}
        onInsertLayer={onInsertLayer}
      />
    ) : null;

  const layersContent = (
    <LayersPopoverContent
      canDeleteLayer={controller?.canDeleteLayer}
      embedded
      layersSettings={model.actualLayersSettings}
      onLayerDelete={controller?.onLayerDelete}
      onLayersReorder={model.onLayersReorder}
      onLayersSettingsChange={model.onLayersSettingsChange}
    />
  );

  if (mobileDensity) {
    return (
      <div className={SECTION_STACK} data-slot="elements-section">
        {insertMenu ? (
          <SettingsRowPopover
            hideHint
            title="Add element"
            trigger="Add element"
            open={addElementOpen}
            onOpenChange={setAddElementOpen}
          >
            {insertMenu}
          </SettingsRowPopover>
        ) : null}

        <SettingsRowPopover
          hint={layerCount > 0 ? String(layerCount) : undefined}
          title="Layers"
          trigger="Layers"
        >
          {layersContent}
        </SettingsRowPopover>
      </div>
    );
  }

  return (
    <div className={SECTION_STACK} data-slot="elements-section">
      {layersContent}
    </div>
  );
}
