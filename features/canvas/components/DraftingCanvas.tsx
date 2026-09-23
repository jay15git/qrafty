"use client"

import { type ReactNode } from "react"

import {
  Canvas,
  type DraftingPaneToolbarVariant,
} from "@/features/canvas/components/Canvas"
import type {
  ThemeMode,
  ToolbarController,
  ToolbarToolId,
} from "@/features/shell/components/FloatingToolbar"
import { MobileWorkspaceInsetTransitionBridge } from "@/features/canvas/components/MobileWorkspaceInsetTransitionBridge"
import { useDraftingCanvasViewModel } from "@/features/canvas/components/use-drafting-canvas-view-model"
import { cn } from "@/lib/utils"

type DraftingWorkspaceController = ToolbarController

type DraftingCanvasProps = {
  theme?: ThemeMode
  fontClassName?: string
  initialActiveTool?: ToolbarToolId
  onThemeChange?: (theme: ThemeMode) => void
  paneToolbarVariant?: DraftingPaneToolbarVariant
  renderOverlay?: (controller: DraftingWorkspaceController) => ReactNode
}

export function DraftingCanvas({
  theme = "light",
  fontClassName,
  initialActiveTool,
  onThemeChange,
  paneToolbarVariant = "default",
  renderOverlay,
}: DraftingCanvasProps = {}) {
  const {
    activeQrNodeId,
    desktopCanvasTool,
    desktopController,
    draftingCanvasRef,
    isDraftingWorkspaceReady,
    panes,
    selectedBackgroundShapeId,
    selectedContentType,
    selectedContentValue,
    selectedLayerId,
    selectedLayerIds,
    selectedLogoColorMode,
    selectedLogoPresetId,
    selectedLogoPresetValue,
    selectedLogoSourceMode,
    selectedQrErrorCorrectionLevel,
    selectedQrMargin,
    selectedQrRadius,
    selectedQrSize,
    selectedQrTypeNumber,
    copySelectedDraftingLayers,
    handleAddTextLayerAt,
    handleLayerAction,
    handleLayerChange,
    handleLayerSelect,
    handleLayerSelectionChange,
    handlePaneQrClick,
    handlePaneSelection,
    pasteDraftingLayers,
    setDesktopCanvasTool,
  } = useDraftingCanvasViewModel({
    initialActiveTool,
    paneToolbarVariant,
  })

  return (
    <section
      ref={draftingCanvasRef}
      aria-label="Drafting workspace"
      data-logo-color-mode={selectedLogoColorMode}
      data-background-shape-id={selectedBackgroundShapeId}
      data-logo-preset-id={selectedLogoPresetId ?? ""}
      data-logo-preset-value={selectedLogoPresetValue ?? ""}
      data-logo-source-mode={selectedLogoSourceMode}
      data-qr-content-type={selectedContentType}
      data-qr-content-value={selectedContentValue}
      data-qr-error-correction-level={selectedQrErrorCorrectionLevel}
      data-qr-margin={selectedQrMargin}
      data-qr-radius={selectedQrRadius}
      data-qr-size={selectedQrSize}
      data-qr-type-number={selectedQrTypeNumber}
      data-slot="drafting-surface"
      tabIndex={-1}
      className={cn(
        "relative grid h-dvh w-full overflow-hidden overscroll-none bg-[var(--canvas-surface-bg)] outline-none focus:outline-none focus-visible:outline-none sm:h-dvh lg:shadow-[var(--canvas-shadow-shell)]",
        "grid-rows-1 sm:h-dvh",
      )}
      data-compose-edit-mode="false"
      data-compose-selected-node-id={activeQrNodeId ?? ""}
    >
      <MobileWorkspaceInsetTransitionBridge />

      <div
        data-slot="drafting-content-grid"
        className="min-h-0 min-w-0 block h-full"
      >
        <section
          aria-label="Workspace frame"
          data-slot="drafting-workspace"
          data-canvas-frame="true"
          className={cn("min-h-0 min-w-0 overflow-hidden", "h-full")}
        >
          <div
            data-slot="drafting-workspace-inset"
            className="h-full min-h-0 p-0"
          >
            <div
              data-slot="desktop-canvas-viewport"
              className="h-full min-h-0 min-w-0"
            >
            {isDraftingWorkspaceReady ? (
            <Canvas
              activePaneId={activeQrNodeId}
              layerEditingEnabled
              onLayerChange={handleLayerChange}
              onLayerAction={handleLayerAction}
              onLayerCopy={(_paneId, layerIds) => {
                void copySelectedDraftingLayers(layerIds, _paneId)
              }}
              activeCanvasTool={desktopCanvasTool}
              onAddTextLayerAt={handleAddTextLayerAt}
              onCanvasToolChange={setDesktopCanvasTool}
              onLayerPaste={(_paneId, point) => {
                void pasteDraftingLayers(point, undefined, _paneId)
              }}
              onLayerSelect={handleLayerSelect}
              onLayerSelectionChange={handleLayerSelectionChange}
              onPaneQrClick={handlePaneQrClick}
              onPaneSelect={handlePaneSelection}
              panes={panes}
              fitCanvasToViewport
              toolbarVariant={paneToolbarVariant}
              selectedLayerId={selectedLayerId}
              selectedLayerIds={selectedLayerIds}
              theme={theme}
            />
            ) : (
              <div
                aria-busy="true"
                aria-label="Loading workspace"
                className="grid h-full place-items-center text-sm font-medium text-[var(--canvas-ink-muted)]"
                data-slot="drafting-workspace-loading"
              >
                Loading workspace…
              </div>
            )}
            </div>
          </div>
        </section>
      </div>
      {renderOverlay ? renderOverlay(desktopController) : null}
    </section>
  )
}
