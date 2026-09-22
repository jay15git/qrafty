"use client"

import { useState } from "react"

import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import { DesktopLayersPopoverContent } from "@/features/desktop-shell/components/DesktopLayersPopoverContent"
import { useMobileInspectorDensity } from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import { SettingsRowPopover } from "@/features/desktop-shell/inspector/settings-ui"
import { InsertMenuPanelStack } from "@/features/workspace/components/insert-menu/InsertMenuPanelStack"

const SECTION_STACK = "dn-section-stack"

export function ElementsSection({ model }: { model: DesktopInspectorModel }) {
  const [addElementOpen, setAddElementOpen] = useState(false)
  const mobileDensity = useMobileInspectorDensity()
  const controller = model.controller
  const nodeId = controller?.insertNodeId
  const onInsertLayer = controller?.onInsertLayer
  const layerCount = model.actualLayersSettings.layers.length

  const insertMenu =
    nodeId && onInsertLayer ? (
      <InsertMenuPanelStack
        canAddQrCode={controller?.canAddQrCode}
        isDesktopPopover
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
    ) : null

  const layersContent = (
    <DesktopLayersPopoverContent
      canDeleteLayer={controller?.canDeleteLayer}
      embedded
      layersSettings={model.actualLayersSettings}
      onLayerDelete={controller?.onLayerDelete}
      onLayersReorder={model.onLayersReorder}
      onLayersSettingsChange={model.onLayersSettingsChange}
    />
  )

  if (mobileDensity) {
    return (
      <div className={SECTION_STACK} data-slot="desktop-elements-section">
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
    )
  }

  return (
    <div className={SECTION_STACK} data-slot="desktop-elements-section">
      {insertMenu ? (
        <SettingsRowPopover
          contentClassName="dn-insert-menu-popover w-[17.25rem] p-0"
          hideHint
          open={addElementOpen}
          trigger="Add element"
          onOpenChange={setAddElementOpen}
        >
          {insertMenu}
        </SettingsRowPopover>
      ) : null}

      {layersContent}
    </div>
  )
}
