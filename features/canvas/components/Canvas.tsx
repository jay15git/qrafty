"use client";

import { useCallback, useState } from "react";

import type { CanvasLayerInteractionProps } from "@/features/canvas/components/canvas-control-props";
import type { CanvasBoardPane } from "@/features/canvas/components/CanvasBoard";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";

import { CanvasBoard } from "@/features/canvas/components/CanvasBoard";

const MIN_PREVIEW_ZOOM = 0.1;
const MAX_PREVIEW_ZOOM = 4;

type CanvasProps = {
  boards: CanvasBoardPane[];
  activeBoardId: string;
  onBoardSelect: (boardId: string) => void;
  onLayerChange?: CanvasLayerInteractionProps["onLayerChange"];
  onLayerAction?: CanvasLayerInteractionProps["onLayerAction"];
  onLayerCopy?: CanvasLayerInteractionProps["onLayerCopy"];
  onLayerPaste?: CanvasLayerInteractionProps["onLayerPaste"];
  onLayerSelect?: CanvasLayerInteractionProps["onLayerSelect"];
  onLayerSelectionChange?: CanvasLayerInteractionProps["onLayerSelectionChange"];
  selectedLayerId?: string | null;
  selectedLayerIds?: string[];
  layerEditingEnabled?: boolean;
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
  onLayerChange,
  onLayerAction,
  onLayerCopy,
  onLayerPaste,
  onLayerSelect,
  onLayerSelectionChange,
  selectedLayerId,
  selectedLayerIds,
  layerEditingEnabled = true,
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
    <div className="relative flex h-full w-full flex-col">
      <div className="relative min-h-0 flex-1">
        {!activeBoard ? (
          <div className="grid h-full place-items-center text-sm font-medium text-[var(--canvas-ink-muted)]">
            No QR codes
          </div>
        ) : (
          <CanvasBoard
            fitCanvasToViewport={fitCanvasToViewport}
            interaction={{
              canSwap: false,
              isSelected: true,
              isSnapTarget: false,
            }}
            draggingBoardId={null}
            layerEditingEnabled={layerEditingEnabled}
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
            onBoardSelect={onBoardSelect}
            onBoardZoom={handleBoardZoom}
            board={activeBoard}
            boardPan={panOffsets[activeBoard.id] ?? { x: 0, y: 0 }}
            boardZoom={zoomLevels[activeBoard.id] ?? 1}
            selectedLayerId={selectedLayerId}
            selectedLayerIds={selectedLayerIds}
            snapEnabled
            theme={theme}
          />
        )}
      </div>
    </div>
  );
}
