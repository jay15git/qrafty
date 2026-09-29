"use client";

import type { DragEvent } from "react";

import type { CanvasCardState } from "@/features/canvas/model/card-state";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import { CanvasViewport } from "@/features/canvas/components/canvas-viewport";
import { useCanvasInteractions } from "@/features/canvas/components/use-canvas-interactions";
import type {
  CanvasLayerInteractionProps,
  CanvasBoardInteractionState,
} from "@/features/canvas/components/canvas-control-props";
import type { QraftyState } from "@/features/qr/model/state";
import type { StaticQrValidationResult } from "@/features/qr/content/static-payload";
import type { CanvasQrStateByLayerId } from "@/features/canvas/model/document";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";

export type CanvasBoardPane = {
  activeQrLayerId?: string;
  cardState: CanvasCardState;
  contentValidation?: StaticQrValidationResult;
  id: string;
  layers?: CanvasLayer[];
  name: string;
  qrStateByLayerId: CanvasQrStateByLayerId;
  state: QraftyState;
};

type CanvasBoardProps = {
  areaName?: string;
  interaction: CanvasBoardInteractionState;
  draggingBoardId: string | null;
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
  layerEditingEnabled?: boolean;
  board: CanvasBoardPane;
  boardPan: { x: number; y: number };
  boardZoom: number;
  fitCanvasToViewport?: boolean;
  selectedLayerId?: string | null;
  selectedLayerIds?: string[];
  snapEnabled: boolean;
  theme?: ThemeMode;
};

export function CanvasBoard({
  areaName,
  interaction,
  draggingBoardId,
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
  layerEditingEnabled = true,
  board,
  boardPan,
  boardZoom,
  fitCanvasToViewport = false,
  selectedLayerId,
  selectedLayerIds,
  snapEnabled,
  theme,
}: CanvasBoardProps) {
  const { canSwap, isSelected, isSnapTarget } = interaction;
  const interactions = useCanvasInteractions({
    fitCanvasToViewport,
    layerEditingEnabled,
    onLayerSelect,
    onBoardPan,
    onBoardSelect,
    onBoardZoom,
    board,
    boardPan,
    boardZoom,
  });

  return (
    <CanvasViewport
      areaName={areaName}
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
      onSelect={interactions.handleSelect}
      onCanvasClick={interactions.handleCanvasClick}
      onCanvasKeyDown={interactions.handleCanvasKeyDown}
      onCanvasPointerCancel={interactions.handleBoardPointerEnd}
      onCanvasPointerDown={interactions.handleBoardPointerDown}
      onCanvasPointerMove={interactions.handleBoardPointerMove}
      onCanvasPointerUp={interactions.handleBoardPointerEnd}
      onCanvasTouchEnd={interactions.handleTouchEnd}
      onCanvasTouchMove={interactions.handleTouchMove}
      onCanvasTouchStart={interactions.handleTouchStart}
      board={board}
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
