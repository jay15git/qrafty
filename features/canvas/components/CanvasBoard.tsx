"use client";

import type { DragEvent } from "react";

import type { DraftingCardState } from "@/features/canvas/model/card-state";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import { CanvasViewport } from "@/features/canvas/components/canvas-viewport";
import { useCanvasInteractions } from "@/features/canvas/components/use-canvas-interactions";
import type {
  CanvasLayerInteractionProps,
  CanvasBoardInteractionState,
} from "@/features/canvas/components/canvas-control-props";
import type { QraftyState } from "@/features/qr/model/state";
import type { StaticQrValidationResult } from "@/features/qr/content/static-payload";
import type { DraftingQrStateByLayerId } from "@/features/canvas/model/document";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";

export type CanvasBoardToolbarVariant = "default" | "zoom";
export type CanvasBoardTool = "select" | "pan" | "text";

function resolveCanvasSurfaceTool(tool?: CanvasBoardTool | null): CanvasBoardTool {
  return tool === "select" || tool === "text" ? tool : "pan";
}

export type CanvasBoardPane = {
  activeQrLayerId?: string;
  cardState: DraftingCardState;
  contentValidation?: StaticQrValidationResult;
  id: string;
  layers?: CanvasLayer[];
  name: string;
  qrStateByLayerId: DraftingQrStateByLayerId;
  sceneComposition?: import("@/features/canvas/model/scene-templates").SceneCompositionState;
  state: QraftyState;
};

type CanvasBoardProps = {
  areaName?: string;
  interaction: CanvasBoardInteractionState;
  draggingBoardId: string | null;
  onBoardQrClick: (boardId: string) => void;
  onBoardSelect: (boardId: string) => void;
  onBoardDragEnd: () => void;
  onBoardDragStart: (boardId: string, event: DragEvent<HTMLDivElement>) => void;
  onBoardDrop: (boardId: string, event: DragEvent<HTMLDivElement>) => void;
  onBoardDragOver: (boardId: string, event: DragEvent<HTMLDivElement>) => void;
  onBoardDragLeave: (boardId: string, event: DragEvent<HTMLDivElement>) => void;
  onBoardPan: (boardId: string, nextPan: { x: number; y: number }) => void;
  onBoardZoom: (boardId: string, nextZoom: number) => void;
  onLayerChange?: CanvasLayerInteractionProps["onLayerChange"];
  onLayerAction?: CanvasLayerInteractionProps["onLayerAction"];
  onLayerCopy?: CanvasLayerInteractionProps["onLayerCopy"];
  onLayerPaste?: CanvasLayerInteractionProps["onLayerPaste"];
  onLayerSelect?: CanvasLayerInteractionProps["onLayerSelect"];
  onLayerSelectionChange?: CanvasLayerInteractionProps["onLayerSelectionChange"];
  activeCanvasTool?: CanvasBoardTool | null;
  onAddTextLayerAt?: (boardId: string, point: { x: number; y: number }) => void;
  onCanvasToolChange?: (tool: CanvasBoardTool | null) => void;
  layerEditingEnabled?: boolean;
  board: CanvasBoardPane;
  boardPan: { x: number; y: number };
  boardZoom: number;
  previewLocked?: boolean;
  fitCanvasToViewport?: boolean;
  selectedLayerId?: string | null;
  selectedLayerIds?: string[];
  snapEnabled: boolean;
  toolbarVariant?: CanvasBoardToolbarVariant;
  theme?: ThemeMode;
};

export function CanvasBoard({
  areaName,
  interaction,
  draggingBoardId,
  onBoardQrClick,
  onBoardSelect,
  onBoardDragEnd,
  onBoardDragStart,
  onBoardDrop,
  onBoardDragOver,
  onBoardDragLeave,
  onBoardZoom,
  onBoardPan,
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
  board,
  boardPan,
  boardZoom,
  previewLocked = false,
  fitCanvasToViewport = false,
  selectedLayerId,
  selectedLayerIds,
  snapEnabled,
  toolbarVariant = "default",
  theme,
}: CanvasBoardProps) {
  const { canSwap, isSelected, isSnapTarget } = interaction;
  // Desktop compose workspace has one interaction mode: select.
  const canvasTool =
    toolbarVariant === "zoom" ? "select" : resolveCanvasSurfaceTool(activeCanvasTool);

  const interactions = useCanvasInteractions({
    activeCanvasTool: canvasTool,
    fitCanvasToViewport,
    layerEditingEnabled,
    onAddTextLayerAt,
    onCanvasToolChange,
    onLayerSelect,
    onBoardPan,
    onBoardQrClick,
    onBoardSelect,
    onBoardZoom,
    board,
    boardPan,
    boardZoom,
    previewLocked,
    toolbarVariant,
  });

  return (
    <CanvasViewport
      areaName={areaName}
      activeCanvasTool={canvasTool}
      canSwap={canSwap}
      draggingBoardId={draggingBoardId}
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
      onBeginBoardPan={interactions.beginBoardPan}
      onBoardDragEnd={onBoardDragEnd}
      onBoardDragLeave={onBoardDragLeave}
      onBoardDragOver={onBoardDragOver}
      onBoardDragStart={onBoardDragStart}
      onBoardDrop={onBoardDrop}
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
      onCanvasPointerCancel={interactions.handleBoardPointerEnd}
      onCanvasPointerDown={interactions.handleBoardPointerDown}
      onCanvasPointerDownCapture={interactions.handleBoardPointerDownCapture}
      onCanvasPointerMove={interactions.handleBoardPointerMove}
      onCanvasPointerUp={interactions.handleBoardPointerEnd}
      onCanvasTouchEnd={interactions.handleTouchEnd}
      onCanvasTouchMove={interactions.handleTouchMove}
      onCanvasTouchStart={interactions.handleTouchStart}
      board={board}
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
