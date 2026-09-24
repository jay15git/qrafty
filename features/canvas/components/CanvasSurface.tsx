"use client";

import { type ReactNode } from "react";

import { Canvas, type CanvasBoardToolbarVariant } from "@/features/canvas/components/Canvas";
import type {
  ThemeMode,
  ToolbarController,
  ToolbarToolId,
} from "@/features/shell/components/WorkspaceChrome";
import { MobileWorkspaceInsetTransitionBridge } from "@/features/canvas/components/MobileWorkspaceInsetTransitionBridge";
import { useCanvasViewModel } from "@/features/canvas/components/use-canvas-view-model";
import { cn } from "@/lib/utils";

type DraftingWorkspaceController = ToolbarController;

type CanvasSurfaceProps = {
  theme?: ThemeMode;
  fontClassName?: string;
  initialActiveTool?: ToolbarToolId;
  onThemeChange?: (theme: ThemeMode) => void;
  boardToolbarVariant?: CanvasBoardToolbarVariant;
  renderOverlay?: (controller: DraftingWorkspaceController) => ReactNode;
};

export function CanvasSurface({
  theme = "light",
  fontClassName,
  initialActiveTool,
  onThemeChange,
  boardToolbarVariant = "default",
  renderOverlay,
}: CanvasSurfaceProps = {}) {
  const {
    activeQrNodeId,
    desktopCanvasTool,
    desktopController,
    draftingCanvasRef,
    isDraftingWorkspaceReady,
    boards,
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
    handleBoardQrClick,
    handleBoardSelection,
    pasteDraftingLayers,
    setDesktopCanvasTool,
  } = useCanvasViewModel({
    initialActiveTool,
    boardToolbarVariant,
  });

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
      data-slot="canvas-root"
      tabIndex={-1}
      className={cn(
        "relative grid h-dvh w-full overflow-hidden overscroll-none bg-[var(--canvas-surface-bg)] outline-none focus:outline-none focus-visible:outline-none sm:h-dvh lg:shadow-[var(--canvas-shadow-shell)]",
        "grid-rows-1 sm:h-dvh",
      )}
      data-compose-edit-mode="false"
      data-compose-selected-node-id={activeQrNodeId ?? ""}
    >
      <MobileWorkspaceInsetTransitionBridge />

      <div data-slot="canvas-content-grid" className="min-h-0 min-w-0 block h-full">
        <section
          aria-label="Workspace frame"
          data-slot="canvas-workspace"
          data-canvas-frame="true"
          className={cn("min-h-0 min-w-0 overflow-hidden", "h-full")}
        >
          <div data-slot="canvas-workspace-inset" className="h-full min-h-0 p-0">
            <div data-slot="canvas-viewport" className="h-full min-h-0 min-w-0">
              {isDraftingWorkspaceReady ? (
                <Canvas
                  activeBoardId={activeQrNodeId}
                  layerEditingEnabled
                  onLayerChange={handleLayerChange}
                  onLayerAction={handleLayerAction}
                  onLayerCopy={(_boardId, layerIds) => {
                    void copySelectedDraftingLayers(layerIds, _boardId);
                  }}
                  activeCanvasTool={desktopCanvasTool}
                  onAddTextLayerAt={handleAddTextLayerAt}
                  onCanvasToolChange={setDesktopCanvasTool}
                  onLayerPaste={(_boardId, point) => {
                    void pasteDraftingLayers(point, undefined, _boardId);
                  }}
                  onLayerSelect={handleLayerSelect}
                  onLayerSelectionChange={handleLayerSelectionChange}
                  onBoardQrClick={handleBoardQrClick}
                  onBoardSelect={handleBoardSelection}
                  boards={boards}
                  fitCanvasToViewport
                  toolbarVariant={boardToolbarVariant}
                  selectedLayerId={selectedLayerId}
                  selectedLayerIds={selectedLayerIds}
                  theme={theme}
                />
              ) : (
                <div
                  aria-busy="true"
                  aria-label="Loading workspace"
                  className="grid h-full place-items-center text-sm font-medium text-[var(--canvas-ink-muted)]"
                  data-slot="canvas-workspace-loading"
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
  );
}
