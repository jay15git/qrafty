"use client";

import { useCallback, useState } from "react";

import type { CanvasLayerInteractionProps } from "@/features/canvas/components/canvas-control-props";
import {
  type CanvasBoardPane,
  type CanvasBoardTool,
  type CanvasBoardToolbarVariant,
} from "@/features/canvas/components/CanvasBoard";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";

import { CanvasBoard } from "@/features/canvas/components/CanvasBoard";
import { Tooltip as TooltipPrimitive } from "radix-ui";

export type {
  CanvasBoardTool,
  CanvasBoardToolbarVariant,
} from "@/features/canvas/components/CanvasBoard";

const MIN_PREVIEW_ZOOM = 0.1;
const MAX_PREVIEW_ZOOM = 4;

type CanvasProps = {
  boards: CanvasBoardPane[];
  activeBoardId: string;
  onBoardSelect: (boardId: string) => void;
  onBoardQrClick: (boardId: string) => void;
  onLayerChange?: CanvasLayerInteractionProps["onLayerChange"];
  onLayerAction?: CanvasLayerInteractionProps["onLayerAction"];
  onLayerCopy?: CanvasLayerInteractionProps["onLayerCopy"];
  onLayerPaste?: CanvasLayerInteractionProps["onLayerPaste"];
  onLayerSelect?: CanvasLayerInteractionProps["onLayerSelect"];
  onLayerSelectionChange?: CanvasLayerInteractionProps["onLayerSelectionChange"];
  activeCanvasTool?: CanvasBoardTool | null;
  onAddTextLayerAt?: (boardId: string, point: { x: number; y: number }) => void;
  onCanvasToolChange?: (tool: CanvasBoardTool | null) => void;
  selectedLayerId?: string | null;
  selectedLayerIds?: string[];
  toolbarVariant?: CanvasBoardToolbarVariant;
  layerEditingEnabled?: boolean;
  previewLocked?: boolean;
  fitCanvasToViewport?: boolean;
  theme?: ThemeMode;
};

function clampPreviewZoom(value: number) {
  return Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, value));
}

export function Canvas({
  boards,
  activeBoardId,
  onBoardSelect,
  onBoardQrClick,
  onLayerChange,
  onLayerAction,
  onLayerCopy,
  onLayerPaste,
  onLayerSelect,
  onLayerSelectionChange,
  activeCanvasTool,
  onAddTextLayerAt,
  onCanvasToolChange,
  selectedLayerId,
  selectedLayerIds,
  toolbarVariant = "default",
  layerEditingEnabled = true,
  previewLocked = false,
  fitCanvasToViewport = false,
  theme,
}: CanvasProps) {
  const [zoomLevels, setZoomLevels] = useState<Record<string, number>>({});
  const [panOffsets, setPanOffsets] = useState<Record<string, { x: number; y: number }>>({});

  const activeBoard = boards.find((board) => board.id === activeBoardId) ?? boards[0];

  const handleBoardZoom = useCallback((boardId: string, nextZoom: number) => {
    setZoomLevels((current) => ({
      ...current,
      [boardId]: clampPreviewZoom(nextZoom),
    }));
  }, []);

  const handleBoardPan = useCallback((boardId: string, nextPan: { x: number; y: number }) => {
    setPanOffsets((current) => ({
      ...current,
      [boardId]: nextPan,
    }));
  }, []);

  return (
    <TooltipPrimitive.Provider delayDuration={0}>
      <div className="relative flex h-full w-full flex-col">
        <div className="relative min-h-0 flex-1">
          {!activeBoard ? (
            <div className="grid h-full place-items-center text-sm font-medium text-[var(--canvas-ink-muted)]">
              No QR codes
            </div>
          ) : (
            <CanvasBoard
              activeCanvasTool={activeCanvasTool}
              fitCanvasToViewport={fitCanvasToViewport}
              interaction={{
                canSwap: false,
                isSelected: true,
                isSnapTarget: false,
              }}
              draggingBoardId={null}
              layerEditingEnabled={layerEditingEnabled}
              onAddTextLayerAt={onAddTextLayerAt}
              onCanvasToolChange={onCanvasToolChange}
              onLayerAction={onLayerAction}
              onLayerChange={onLayerChange}
              onLayerCopy={onLayerCopy}
              onLayerPaste={onLayerPaste}
              onLayerSelect={onLayerSelect}
              onLayerSelectionChange={onLayerSelectionChange}
              onBoardDragEnd={() => undefined}
              onBoardDragLeave={() => undefined}
              onBoardDragOver={() => undefined}
              onBoardDragStart={() => undefined}
              onBoardDrop={() => undefined}
              onBoardPan={handleBoardPan}
              onBoardQrClick={onBoardQrClick}
              onBoardSelect={onBoardSelect}
              onBoardZoom={handleBoardZoom}
              board={activeBoard}
              boardPan={panOffsets[activeBoard.id] ?? { x: 0, y: 0 }}
              boardZoom={zoomLevels[activeBoard.id] ?? 1}
              previewLocked={previewLocked}
              selectedLayerId={selectedLayerId}
              selectedLayerIds={selectedLayerIds}
              snapEnabled
              toolbarVariant={toolbarVariant}
              theme={theme}
            />
          )}
        </div>
      </div>
    </TooltipPrimitive.Provider>
  );
}
