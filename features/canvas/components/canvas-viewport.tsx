"use client";

import type {
  DragEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
  TouchEvent,
} from "react";

import type { CanvasLayerInteractionProps } from "@/features/canvas/components/canvas-control-props";
import { Artboard } from "@/features/canvas/components/Artboard";
import type { CanvasBoardPane, CanvasBoardTool } from "@/features/canvas/components/CanvasBoard";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import { cn } from "@/lib/utils";

type CanvasViewportProps = {
  areaName?: string;
  activeCanvasTool?: CanvasBoardTool | null;
  canSwap: boolean;
  draggingBoardId: string | null;
  effectivePan: { x: number; y: number };
  effectiveZoom: number;
  fitCanvasToViewport?: boolean;
  hideLayerSelectionChrome: boolean;
  isFreeEditWorkspace: boolean;
  isPanning: boolean;
  isSelected: boolean;
  isSnapTarget: boolean;
  layerEditingEnabled?: boolean;
  onAddTextLayerAt?: (boardId: string, point: { x: number; y: number }) => void;
  onBoardDragEnd: () => void;
  onBoardDragLeave: (boardId: string, event: DragEvent<HTMLDivElement>) => void;
  onBoardDragOver: (boardId: string, event: DragEvent<HTMLDivElement>) => void;
  onBoardDragStart: (boardId: string, event: DragEvent<HTMLDivElement>) => void;
  onBoardDrop: (boardId: string, event: DragEvent<HTMLDivElement>) => void;
  onLayerAction?: CanvasLayerInteractionProps["onLayerAction"];
  onLayerChange?: CanvasLayerInteractionProps["onLayerChange"];
  onLayerCopy?: CanvasLayerInteractionProps["onLayerCopy"];
  onLayerPaste?: CanvasLayerInteractionProps["onLayerPaste"];
  onLayerSelect?: CanvasLayerInteractionProps["onLayerSelect"];
  onLayerSelectionChange?: CanvasLayerInteractionProps["onLayerSelectionChange"];
  onQrClick: () => void;
  onSelect: () => void;
  onCanvasClick: (event: ReactMouseEvent<HTMLDivElement>) => void;
  onCanvasKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onCanvasPointerCancel: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onCanvasPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onCanvasPointerDownCapture: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onCanvasPointerMove: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onCanvasPointerUp: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onCanvasTouchEnd: (event: TouchEvent<HTMLDivElement>) => void;
  onCanvasTouchMove: (event: TouchEvent<HTMLDivElement>) => void;
  onCanvasTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  onBeginBoardPan: (event: ReactPointerEvent<HTMLDivElement>) => void;
  board: CanvasBoardPane;
  panOverlayRef: RefObject<HTMLDivElement | null>;
  previewLocked?: boolean;
  selectedLayerId?: string | null;
  selectedLayerIds?: string[];
  snapEnabled: boolean;
  canvasAppearance: "template" | "workspace" | "neutral";
  canvasRef: RefObject<HTMLDivElement | null>;
  viewFitScale?: number;
  theme?: ThemeMode;
};

type CanvasBoardContentProps = Pick<
  CanvasViewportProps,
  | "effectivePan"
  | "effectiveZoom"
  | "fitCanvasToViewport"
  | "hideLayerSelectionChrome"
  | "isFreeEditWorkspace"
  | "isSelected"
  | "layerEditingEnabled"
  | "onLayerAction"
  | "onLayerChange"
  | "onLayerCopy"
  | "onLayerPaste"
  | "onLayerSelect"
  | "onLayerSelectionChange"
  | "onQrClick"
  | "onSelect"
  | "board"
  | "previewLocked"
  | "selectedLayerId"
  | "selectedLayerIds"
  | "snapEnabled"
  | "viewFitScale"
  | "theme"
>;

function CanvasBoardContent({
  effectivePan,
  effectiveZoom,
  fitCanvasToViewport = false,
  hideLayerSelectionChrome,
  isFreeEditWorkspace,
  isSelected,
  layerEditingEnabled = true,
  onLayerAction,
  onLayerChange,
  onLayerCopy,
  onLayerPaste,
  onLayerSelect,
  onLayerSelectionChange,
  onQrClick,
  onSelect,
  board,
  previewLocked = false,
  selectedLayerId,
  selectedLayerIds,
  snapEnabled,
  viewFitScale = 1,
  theme,
}: CanvasBoardContentProps) {
  return (
    <div
      data-slot={
        previewLocked || fitCanvasToViewport
          ? "template-edit-zone"
          : isFreeEditWorkspace
            ? "free-edit-artboard"
            : undefined
      }
      style={{
        transform: isFreeEditWorkspace
          ? undefined
          : `translate3d(${effectivePan.x}px, ${effectivePan.y}px, 0) scale(${effectiveZoom})`,
        transformOrigin: "center center",
        transition: "transform 150ms ease-out",
      }}
      className="flex h-full w-full items-center justify-center"
    >
      <Artboard
        activeQrLayerId={board.activeQrLayerId}
        cardState={board.cardState}
        contentPan={isFreeEditWorkspace ? effectivePan : undefined}
        contentOnlyZoom={isFreeEditWorkspace}
        contentValidation={board.contentValidation}
        interactionScale={effectiveZoom}
        viewFitScale={viewFitScale}
        layers={board.layers}
        qrStateByLayerId={board.qrStateByLayerId}
        sceneComposition={board.sceneComposition}
        snapEnabled={snapEnabled}
        state={board.state}
        isSelected={isSelected}
        onLayerChange={
          layerEditingEnabled
            ? (layerId, patch) => onLayerChange?.(board.id, layerId, patch)
            : undefined
        }
        onLayerAction={
          layerEditingEnabled
            ? (layerIds, action) => onLayerAction?.(board.id, layerIds, action)
            : undefined
        }
        onLayerCopy={
          layerEditingEnabled ? (layerIds) => onLayerCopy?.(board.id, layerIds) : undefined
        }
        onLayerPaste={layerEditingEnabled ? (point) => onLayerPaste?.(board.id, point) : undefined}
        onLayerSelect={(layerId, options) => onLayerSelect?.(board.id, layerId, options)}
        onLayerSelectionChange={(layerIds, options) =>
          onLayerSelectionChange?.(board.id, layerIds, options)
        }
        onQrClick={onQrClick}
        onSelect={onSelect}
        selectedLayerId={isSelected && !hideLayerSelectionChrome ? selectedLayerId : null}
        selectedLayerIds={isSelected && !hideLayerSelectionChrome ? selectedLayerIds : undefined}
        theme={theme}
      />
    </div>
  );
}

type CanvasPanOverlayProps = Pick<
  CanvasViewportProps,
  | "activeCanvasTool"
  | "isPanning"
  | "onBeginBoardPan"
  | "onCanvasPointerCancel"
  | "onCanvasPointerMove"
  | "onCanvasPointerUp"
  | "panOverlayRef"
  | "previewLocked"
>;

function CanvasPanOverlay({
  activeCanvasTool,
  isPanning,
  onBeginBoardPan,
  onCanvasPointerCancel,
  onCanvasPointerMove,
  onCanvasPointerUp,
  panOverlayRef,
  previewLocked = false,
}: CanvasPanOverlayProps) {
  if (activeCanvasTool !== "pan" || previewLocked) {
    return null;
  }

  return (
    <div
      ref={panOverlayRef}
      aria-hidden="true"
      className="absolute inset-0 z-[1] cursor-grab touch-none data-[panning=true]:cursor-move"
      data-panning={isPanning ? "true" : "false"}
      data-slot="canvas-pan-overlay"
      onPointerCancel={onCanvasPointerCancel}
      onPointerDown={onBeginBoardPan}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerUp}
    />
  );
}

type CanvasTextPlacementOverlayProps = Pick<
  CanvasViewportProps,
  "activeCanvasTool" | "layerEditingEnabled" | "onAddTextLayerAt"
>;

function CanvasTextPlacementOverlay({
  activeCanvasTool,
  layerEditingEnabled = true,
  onAddTextLayerAt,
}: CanvasTextPlacementOverlayProps) {
  if (activeCanvasTool !== "text" || !layerEditingEnabled || !onAddTextLayerAt) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-[var(--z-compose-toolbar)] cursor-text touch-none"
      data-slot="canvas-text-placement-overlay"
    />
  );
}

export function CanvasViewport({
  areaName,
  activeCanvasTool,
  canSwap,
  draggingBoardId,
  effectivePan,
  effectiveZoom,
  fitCanvasToViewport = false,
  hideLayerSelectionChrome,
  isFreeEditWorkspace,
  isPanning,
  isSelected,
  isSnapTarget,
  layerEditingEnabled = true,
  onAddTextLayerAt,
  onBeginBoardPan,
  onBoardDragEnd,
  onBoardDragLeave,
  onBoardDragOver,
  onBoardDragStart,
  onBoardDrop,
  onLayerAction,
  onLayerChange,
  onLayerCopy,
  onLayerPaste,
  onLayerSelect,
  onLayerSelectionChange,
  onQrClick,
  onSelect,
  onCanvasClick,
  onCanvasKeyDown,
  onCanvasPointerCancel,
  onCanvasPointerDown,
  onCanvasPointerDownCapture,
  onCanvasPointerMove,
  onCanvasPointerUp,
  onCanvasTouchEnd,
  onCanvasTouchMove,
  onCanvasTouchStart,
  board,
  panOverlayRef,
  previewLocked = false,
  selectedLayerId,
  selectedLayerIds,
  snapEnabled,
  canvasAppearance,
  canvasRef,
  viewFitScale = 1,
  theme,
}: CanvasViewportProps) {
  return (
    <div
      ref={canvasRef}
      key={board.id}
      data-slot="canvas-surface"
      data-canvas-appearance={canvasAppearance}
      data-preview-locked={previewLocked ? "true" : "false"}
      data-dragging={draggingBoardId === board.id ? "true" : "false"}
      data-panning={isPanning ? "true" : "false"}
      data-snap-target={isSnapTarget ? "true" : "false"}
      draggable={canSwap}
      className={cn(
        "relative flex h-full w-full flex-col items-center justify-center overflow-hidden touch-none overscroll-none outline-none transition-opacity duration-150 ease-out",
        isFreeEditWorkspace ? "bg-[var(--canvas-bg,#f0f1f2)]" : "bg-[var(--canvas-bg,#f0f1f2)]",
        canSwap && "cursor-grab active:cursor-grabbing",
        draggingBoardId === board.id && "opacity-55",
        isSnapTarget &&
          "after:pointer-events-none after:absolute after:inset-0 after:border-2 after:border-[var(--canvas-ink)] after:content-['']",
      )}
      style={{
        gridArea: areaName,
        backgroundImage:
          !isFreeEditWorkspace && !previewLocked
            ? "radial-gradient(circle, rgb(var(--canvas-dot-rgb) / var(--canvas-dot-opacity)) 2.4px, transparent 3px)"
            : "none",
        backgroundPosition: "0 0",
        backgroundSize: "30px 30px",
      }}
      role="group"
      aria-label="Canvas"
      onKeyDown={onCanvasKeyDown}
      onClick={onCanvasClick}
      onDragEnd={onBoardDragEnd}
      onDragLeave={(event) => onBoardDragLeave(board.id, event)}
      onDragOver={(event) => onBoardDragOver(board.id, event)}
      onDragStart={(event) => onBoardDragStart(board.id, event)}
      onDrop={(event) => onBoardDrop(board.id, event)}
      onPointerCancel={onCanvasPointerCancel}
      onPointerDownCapture={onCanvasPointerDownCapture}
      onPointerDown={onCanvasPointerDown}
      onPointerMove={onCanvasPointerMove}
      onPointerUp={onCanvasPointerUp}
      onTouchEnd={onCanvasTouchEnd}
      onTouchMove={onCanvasTouchMove}
      onTouchStart={onCanvasTouchStart}
    >
      <CanvasBoardContent
        effectivePan={effectivePan}
        effectiveZoom={effectiveZoom}
        fitCanvasToViewport={fitCanvasToViewport}
        hideLayerSelectionChrome={hideLayerSelectionChrome}
        isFreeEditWorkspace={isFreeEditWorkspace}
        isSelected={isSelected}
        layerEditingEnabled={layerEditingEnabled}
        onLayerAction={onLayerAction}
        onLayerChange={onLayerChange}
        onLayerCopy={onLayerCopy}
        onLayerPaste={onLayerPaste}
        onLayerSelect={onLayerSelect}
        onLayerSelectionChange={onLayerSelectionChange}
        onQrClick={onQrClick}
        onSelect={onSelect}
        board={board}
        previewLocked={previewLocked}
        selectedLayerId={selectedLayerId}
        selectedLayerIds={selectedLayerIds}
        snapEnabled={snapEnabled}
        viewFitScale={viewFitScale}
        theme={theme}
      />
      <CanvasPanOverlay
        activeCanvasTool={activeCanvasTool}
        isPanning={isPanning}
        onBeginBoardPan={onBeginBoardPan}
        onCanvasPointerCancel={onCanvasPointerCancel}
        onCanvasPointerMove={onCanvasPointerMove}
        onCanvasPointerUp={onCanvasPointerUp}
        panOverlayRef={panOverlayRef}
        previewLocked={previewLocked}
      />
      <CanvasTextPlacementOverlay
        activeCanvasTool={activeCanvasTool}
        layerEditingEnabled={layerEditingEnabled}
        onAddTextLayerAt={onAddTextLayerAt}
      />
    </div>
  );
}
