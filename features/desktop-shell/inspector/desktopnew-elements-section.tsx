"use client"

import { useState } from "react"

import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import { DesktopLayersPopoverContent } from "@/features/desktop-shell/components/DesktopLayersPopoverContent"
import { SettingsRowPopover } from "@/features/desktop-shell/inspector/settings-ui"
import { InsertMenuPanelStack } from "@/features/workspace/components/insert-menu/InsertMenuPanelStack"

const SECTION_STACK = "dn-section-stack"

export function ElementsSection({ model }: { model: DesktopInspectorModel }) {
  const [addElementOpen, setAddElementOpen] = useState(false)
  const controller = model.controller
  const nodeId = controller?.insertNodeId
  const onInsertLayer = controller?.onInsertLayer

  return (
    <div className={SECTION_STACK} data-slot="desktop-elements-section">
      {nodeId && onInsertLayer ? (
        <SettingsRowPopover
          contentClassName="dn-insert-menu-popover w-[17.25rem] p-0"
          hideHint
          open={addElementOpen}
          trigger="Add element"
          onOpenChange={setAddElementOpen}
        >
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
        </SettingsRowPopover>
      ) : null}

      <DesktopLayersPopoverContent
        canDeleteLayer={controller?.canDeleteLayer}
        embedded
        layersSettings={model.actualLayersSettings}
        onLayerDelete={controller?.onLayerDelete}
        onLayersReorder={model.onLayersReorder}
        onLayersSettingsChange={model.onLayersSettingsChange}
      />
    </div>
  )
}
