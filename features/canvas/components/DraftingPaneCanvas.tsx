"use client";

import type { DragEvent } from "react";

import type { DraftingCardState } from "@/features/canvas/model/card-state";
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared";
import { DraftingPaneViewport } from "@/features/canvas/components/drafting-pane-viewport";
import { useDraftingPaneCanvasInteractions } from "@/features/canvas/components/use-drafting-pane-canvas-interactions";
import type {
  DraftingLayerInteractionProps,
  DraftingPaneInteractionState,
} from "@/features/canvas/components/canvas-control-props";
import type { QraftyState } from "@/features/qr/model/state";
import type { StaticQrValidationResult } from "@/features/qr/content/static-payload";
import type { DraftingQrStateByLayerId } from "@/features/canvas/model/document";
import type { ThemeMode } from "@/features/shell/components/FloatingToolbar";

export type DraftingPaneToolbarVariant = "default" | "zoom";
export type DraftingPaneCanvasTool = "select" | "pan" | "text";

function resolveDraftingCanvasTool(tool?: DraftingPaneCanvasTool | null): DraftingPaneCanvasTool {
  return tool === "select" || tool === "text" ? tool : "pan";
}

export type DraftingPane = {
  activeQrLayerId?: string;
  cardState: DraftingCardState;
  contentValidation?: StaticQrValidationResult;
  id: string;
  layers?: DraftingCanvasLayer[];
  name: string;
  qrStateByLayerId: DraftingQrStateByLayerId;
  sceneComposition?: import("@/features/canvas/model/scene-templates").SceneCompositionState;
  state: QraftyState;
};

type DraftingPaneCanvasProps = {
  areaName?: string;
  interaction: DraftingPaneInteractionState;
  draggingPaneId: string | null;
  onPaneQrClick: (paneId: string) => void;
  onPaneSelect: (paneId: string) => void;
  onPaneDragEnd: () => void;
  onPaneDragStart: (paneId: string, event: DragEvent<HTMLDivElement>) => void;
  onPaneDrop: (paneId: string, event: DragEvent<HTMLDivElement>) => void;
  onPaneDragOver: (paneId: string, event: DragEvent<HTMLDivElement>) => void;
  onPaneDragLeave: (paneId: string, event: DragEvent<HTMLDivElement>) => void;
  onPanePan: (paneId: string, nextPan: { x: number; y: number }) => void;
  onPaneZoom: (paneId: string, nextZoom: number) => void;
  onLayerChange?: DraftingLayerInteractionProps["onLayerChange"];
  onLayerAction?: DraftingLayerInteractionProps["onLayerAction"];
  onLayerCopy?: DraftingLayerInteractionProps["onLayerCopy"];
  onLayerPaste?: DraftingLayerInteractionProps["onLayerPaste"];
  onLayerSelect?: DraftingLayerInteractionProps["onLayerSelect"];
  onLayerSelectionChange?: DraftingLayerInteractionProps["onLayerSelectionChange"];
  activeCanvasTool?: DraftingPaneCanvasTool | null;
  onAddTextLayerAt?: (paneId: string, point: { x: number; y: number }) => void;
  onCanvasToolChange?: (tool: DraftingPaneCanvasTool | null) => void;
  layerEditingEnabled?: boolean;
  pane: DraftingPane;
  panePan: { x: number; y: number };
  paneZoom: number;
  previewLocked?: boolean;
  fitCanvasToViewport?: boolean;
  selectedLayerId?: string | null;
  selectedLayerIds?: string[];
  snapEnabled: boolean;
  toolbarVariant?: DraftingPaneToolbarVariant;
  theme?: ThemeMode;
};

export function DraftingPaneCanvas({
  areaName,
  interaction,
  draggingPaneId,
  onPaneQrClick,
  onPaneSelect,
  onPaneDragEnd,
  onPaneDragStart,
  onPaneDrop,
  onPaneDragOver,
  onPaneDragLeave,
  onPaneZoom,
  onPanePan,
  onLayerChange,
  onLayerAction,
  onLayerCopy,
  onLayerPaste,
  onLayerSelect,
  onLayerSelectionChange,
  activeCanvasTool,
  onAddTextLayerAt,
  onCanvasToolChange,
  layerEditingEnabled = true,
  pane,
  panePan,
  paneZoom,
  previewLocked = false,
  fitCanvasToViewport = false,
  selectedLayerId,
  selectedLayerIds,
  snapEnabled,
  toolbarVariant = "default",
  theme,
}: DraftingPaneCanvasProps) {
  const { canSwap, isSelected, isSnapTarget } = interaction;
  // Desktop compose workspace has one interaction mode: select.
  const canvasTool =
    toolbarVariant === "zoom" ? "select" : resolveDraftingCanvasTool(activeCanvasTool);

  const interactions = useDraftingPaneCanvasInteractions({
    activeCanvasTool: canvasTool,
    fitCanvasToViewport,
    layerEditingEnabled,
    onAddTextLayerAt,
    onCanvasToolChange,
    onLayerSelect,
    onPanePan,
    onPaneQrClick,
    onPaneSelect,
    onPaneZoom,
    pane,
    panePan,
    paneZoom,
    previewLocked,
    toolbarVariant,
  });

  return (
    <DraftingPaneViewport
      areaName={areaName}
      activeCanvasTool={canvasTool}
      canSwap={canSwap}
      draggingPaneId={draggingPaneId}
      effectivePan={interactions.effectivePan}
      effectiveZoom={interactions.effectiveZoom}
      fitCanvasToViewport={fitCanvasToViewport}
      hideLayerSelectionChrome={interactions.hideLayerSelectionChrome}
      isFreeEditWorkspace={interactions.isFreeEditWorkspace}
      isPanning={interactions.isPanning}
      isSelected={isSelected}
      isSnapTarget={isSnapTarget}
      layerEditingEnabled={layerEditingEnabled}
      onAddTextLayerAt={onAddTextLayerAt}
      onBeginPanePan={interactions.beginPanePan}
      onPaneDragEnd={onPaneDragEnd}
      onPaneDragLeave={onPaneDragLeave}
      onPaneDragOver={onPaneDragOver}
      onPaneDragStart={onPaneDragStart}
      onPaneDrop={onPaneDrop}
      onLayerAction={onLayerAction}
      onLayerChange={onLayerChange}
      onLayerCopy={onLayerCopy}
      onLayerPaste={onLayerPaste}
      onLayerSelect={onLayerSelect}
      onLayerSelectionChange={onLayerSelectionChange}
      onQrClick={interactions.handleQrClick}
      onSelect={interactions.handleSelect}
      onCanvasClick={interactions.handleCanvasClick}
      onCanvasKeyDown={interactions.handleCanvasKeyDown}
      onCanvasPointerCancel={interactions.handlePanePointerEnd}
      onCanvasPointerDown={interactions.handlePanePointerDown}
      onCanvasPointerDownCapture={interactions.handlePanePointerDownCapture}
      onCanvasPointerMove={interactions.handlePanePointerMove}
      onCanvasPointerUp={interactions.handlePanePointerEnd}
      onCanvasTouchEnd={interactions.handleTouchEnd}
      onCanvasTouchMove={interactions.handleTouchMove}
      onCanvasTouchStart={interactions.handleTouchStart}
      pane={pane}
      panOverlayRef={interactions.panOverlayRef}
      previewLocked={previewLocked}
      selectedLayerId={selectedLayerId}
      selectedLayerIds={selectedLayerIds}
      snapEnabled={snapEnabled}
      canvasAppearance={interactions.canvasAppearance}
      canvasRef={interactions.canvasRef}
      viewFitScale={interactions.viewFitScale}
      theme={theme}
    />
  );
}
