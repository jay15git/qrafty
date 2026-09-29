"use client";

import { type ReactNode } from "react";

import { Canvas } from "@/features/canvas/components/Canvas";
import type {
  ThemeMode,
  SettingsController,
  SettingsToolId,
} from "@/features/shell/components/WorkspaceChrome";
import { useCanvasViewModel } from "@/features/canvas/components/use-canvas-view-model";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import { cn } from "@/lib/utils";

type CanvasWorkspaceController = SettingsController;

type CanvasSurfaceProps = {
  theme?: ThemeMode;

  initialActiveTool?: SettingsToolId;
  onThemeChange?: (theme: ThemeMode) => void;
  renderOverlay?: (controller: CanvasWorkspaceController) => ReactNode;
};

export function CanvasSurface({
  theme = "light",
  initialActiveTool,
  onThemeChange,
  renderOverlay,
}: CanvasSurfaceProps = {}) {
  const {
    desktopController,
    canvasRef,
    boards,
    selectedContentValue,
    selectedLayerId,
    selectedLayerIds,
    copySelectedCanvasLayers,
    handleLayerAction,
    handleLayerChange,
    handleLayerSelect,
    handleLayerSelectionChange,
    handleBoardSelection,
    pasteCanvasLayers,
  } = useCanvasViewModel({
    initialActiveTool,
  });

  return (
    <section
      ref={canvasRef}
      aria-label="Canvas workspace"
      data-qr-content-value={selectedContentValue}
      data-slot="canvas-root"
      tabIndex={-1}
      className={cn(
        "relative grid h-dvh w-full overflow-hidden overscroll-none bg-[var(--canvas-surface-bg)] outline-none focus:outline-none focus-visible:outline-none sm:h-dvh lg:shadow-[var(--canvas-shadow-shell)]",
        "grid-rows-1 sm:h-dvh",
      )}
      data-compose-edit-mode="false"
      data-compose-selected-node-id={DASHBOARD_QR_NODE_ID}
    >
      <div data-slot="canvas-content-grid" className="min-h-0 min-w-0 block h-full">
        <section
          aria-label="Workspace frame"
          data-slot="canvas-workspace"
          data-canvas-frame="true"
          className={cn("min-h-0 min-w-0 overflow-hidden", "h-full")}
        >
          <div data-slot="canvas-workspace-inset" className="h-full min-h-0 p-0">
            <div data-slot="canvas-viewport" className="h-full min-h-0 min-w-0">
              <Canvas
                activeBoardId={DASHBOARD_QR_NODE_ID}
                layerEditingEnabled
                onLayerChange={handleLayerChange}
                onLayerAction={handleLayerAction}
                onLayerCopy={(layerIds) => {
                  void copySelectedCanvasLayers(layerIds);
                }}
                onLayerPaste={(point) => {
                  void pasteCanvasLayers(point);
                }}
                onLayerSelect={handleLayerSelect}
                onLayerSelectionChange={handleLayerSelectionChange}
                onBoardSelect={handleBoardSelection}
                boards={boards}
                fitCanvasToViewport
                selectedLayerId={selectedLayerId}
                selectedLayerIds={selectedLayerIds}
                theme={theme}
              />
            </div>
          </div>
        </section>
      </div>
      {renderOverlay ? renderOverlay(desktopController) : null}
    </section>
  );
}
