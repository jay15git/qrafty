"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TouchEvent,
  type WheelEvent,
} from "react";

import type { CanvasBoardPane } from "@/features/canvas/components/CanvasBoard";
import { isTouchLikePointer } from "@/features/canvas/components/canvas-interaction-utils";
import { WORKSPACE_MOBILE_QUERY } from "@/lib/hooks/use-media-query";
import {
  computeCanvasFit,
  DESKTOP_ARTBOARD_VIEW_INSETS,
  DESKTOP_CANVAS_FIT_PADDING,
  MOBILE_ARTBOARD_VIEW_INSETS,
} from "@/features/canvas/model/canvas-fit";
import {
  ENTRANCE_COMPLETE_EVENT,
  ENTRANCE_PRE_REVEAL_EVENT,
} from "@/features/shell/components/WorkspaceEntrance";

const CANVAS_PAN_CURSOR_LOCK_CLASS = "canvas-panning";

const MIN_PREVIEW_ZOOM = 0.1;
const MAX_PREVIEW_ZOOM = 4;
const WHEEL_ZOOM_SENSITIVITY = 0.001;
const TOUCH_PAN_THRESHOLD_PX = 8;

function lockCanvasPanCursor() {
  document.documentElement.classList.add(CANVAS_PAN_CURSOR_LOCK_CLASS);
  document.body.classList.add(CANVAS_PAN_CURSOR_LOCK_CLASS);
}

function unlockCanvasPanCursor() {
  document.documentElement.classList.remove(CANVAS_PAN_CURSOR_LOCK_CLASS);
  document.body.classList.remove(CANVAS_PAN_CURSOR_LOCK_CLASS);
}

function clampPreviewZoom(value: number) {
  return Math.min(MAX_PREVIEW_ZOOM, Math.max(MIN_PREVIEW_ZOOM, value));
}

function getTouchDistance(touches: React.TouchList) {
  const first = touches.item(0);
  const second = touches.item(1);

  if (!first || !second) {
    return null;
  }

  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY);
}

type UseCanvasInteractionsArgs = {
  fitCanvasToViewport?: boolean;
  layerEditingEnabled?: boolean;
  onLayerSelect?: (layerId: string | null, options?: { additive?: boolean }) => void;
  onBoardPan: (boardId: string, nextPan: { x: number; y: number }) => void;
  onBoardSelect: (boardId: string) => void;
  onBoardZoom: (boardId: string, nextZoom: number) => void;
  board: CanvasBoardPane;
  boardPan: { x: number; y: number };
  boardZoom: number;
};

export function useCanvasInteractions({
  fitCanvasToViewport = false,
  layerEditingEnabled = true,
  onLayerSelect,
  onBoardPan,
  onBoardSelect,
  onBoardZoom,
  board,
  boardPan,
  boardZoom,
}: UseCanvasInteractionsArgs) {
  const hideLayerSelectionChrome = !layerEditingEnabled;
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const onBoardSelectRef = useRef(onBoardSelect);
  const panInteractionRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const pinchDistanceRef = useRef<number | null>(null);
  const pinchZoomRef = useRef(boardZoom);
  const pendingTouchPanRef = useRef<{
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const didTouchPanRef = useRef(false);
  const [viewFitScale, setViewFitScale] = useState(1);
  const effectiveZoom = boardZoom;
  const effectivePan = boardPan;
  const isFreeEditWorkspace = layerEditingEnabled;
  const shouldAutoFitViewport = fitCanvasToViewport;
  const canvasAppearance: "workspace" | "neutral" = isFreeEditWorkspace ? "workspace" : "neutral";
  const hasSeededFitZoomRef = useRef(false);
  const updateFitScaleRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!shouldAutoFitViewport && !isFreeEditWorkspace) {
      return;
    }

    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const updateFitScale = () => {
      const isMobileViewport =
        typeof window !== "undefined" && window.matchMedia(WORKSPACE_MOBILE_QUERY).matches;
      const entrancePhase = document
        .querySelector('[data-slot="entrance-root"]')
        ?.getAttribute("data-entrance");

      if (isMobileViewport && entrancePhase === "revealing") {
        return;
      }

      const rect = canvas.getBoundingClientRect();

      if (rect.width <= 0 || rect.height <= 0) {
        return;
      }

      const artboardInsets =
        isMobileViewport && isFreeEditWorkspace
          ? MOBILE_ARTBOARD_VIEW_INSETS
          : DESKTOP_ARTBOARD_VIEW_INSETS;

      const nextFitScale = computeCanvasFit(
        { width: board.cardState.width, height: board.cardState.height },
        { width: rect.width, height: rect.height },
        isFreeEditWorkspace
          ? { allowUpscale: true, insets: artboardInsets }
          : { allowUpscale: true, padding: DESKTOP_CANVAS_FIT_PADDING },
      );

      if (isFreeEditWorkspace) {
        setViewFitScale(nextFitScale);
        return;
      }

      if (shouldAutoFitViewport) {
        onBoardZoom(board.id, nextFitScale);
        return;
      }

      if (!hasSeededFitZoomRef.current) {
        onBoardZoom(board.id, nextFitScale);
        hasSeededFitZoomRef.current = true;
      }
    };

    updateFitScaleRef.current = updateFitScale;
    updateFitScale();

    const observer = new ResizeObserver(updateFitScale);
    observer.observe(canvas);
    const handleEntrancePreReveal = () => {
      updateFitScaleRef.current?.();
    };

    const handleEntranceComplete = () => {
      updateFitScaleRef.current?.();
    };

    window.addEventListener(ENTRANCE_PRE_REVEAL_EVENT, handleEntrancePreReveal);
    window.addEventListener(ENTRANCE_COMPLETE_EVENT, handleEntranceComplete);

    return () => {
      window.removeEventListener(ENTRANCE_PRE_REVEAL_EVENT, handleEntrancePreReveal);
      window.removeEventListener(ENTRANCE_COMPLETE_EVENT, handleEntranceComplete);
      updateFitScaleRef.current = null;
    };
  }, [
    fitCanvasToViewport,
    isFreeEditWorkspace,
    onBoardZoom,
    board.cardState.height,
    board.cardState.width,
    board.id,
    shouldAutoFitViewport,
  ]);

  useEffect(() => {
    if (!isFreeEditWorkspace) {
      hasSeededFitZoomRef.current = false;
    }
  }, [isFreeEditWorkspace]);

  useEffect(() => {
    onBoardSelectRef.current = onBoardSelect;
  }, [onBoardSelect]);

  useEffect(() => {
    pinchZoomRef.current = boardZoom;
  }, [boardZoom]);

  useEffect(() => {
    return () => {
      unlockCanvasPanCursor();
    };
  }, []);

  const handleSelect = useCallback(() => {
    onBoardSelectRef.current(board.id);
  }, [board.id]);

  const isPlacementTarget = useCallback(
    (event: ReactMouseEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>) =>
      !(
        event.target instanceof Element &&
        event.target.closest("[data-layer-id], [data-slot='canvas-layer-resize-frame'], button")
      ),
    [],
  );

  const handleCanvasClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (didTouchPanRef.current) {
        didTouchPanRef.current = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      handleSelect();
    },
    [handleSelect],
  );
  const handleCanvasKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      handleCanvasClick(event as unknown as ReactMouseEvent<HTMLDivElement>);
    },
    [handleCanvasClick],
  );

  const handleBoardPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      if (!isPlacementTarget(event)) {
        return;
      }

      if (isTouchLikePointer(event)) {
        pendingTouchPanRef.current = {
          pointerId: event.pointerId,
          startClientX: event.clientX,
          startClientY: event.clientY,
          startPanX: boardPan.x,
          startPanY: boardPan.y,
        };
        didTouchPanRef.current = false;
        return;
      }

      onBoardSelectRef.current(board.id);
      onLayerSelect?.(null);
    },
    [isPlacementTarget, onLayerSelect, board.id, boardPan.x, boardPan.y],
  );

  const handleBoardPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const pending = pendingTouchPanRef.current;

      if (pending && pending.pointerId === event.pointerId) {
        const distance = Math.hypot(
          event.clientX - pending.startClientX,
          event.clientY - pending.startClientY,
        );

        if (distance < TOUCH_PAN_THRESHOLD_PX) {
          return;
        }

        pendingTouchPanRef.current = null;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture(event.pointerId);
        onBoardSelectRef.current(board.id);
        panInteractionRef.current = pending;
        didTouchPanRef.current = true;
        lockCanvasPanCursor();
        setIsPanning(true);
      }

      const interaction = panInteractionRef.current;

      if (!interaction || interaction.pointerId !== event.pointerId) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onBoardPan(board.id, {
        x: interaction.startPanX + event.clientX - interaction.startClientX,
        y: interaction.startPanY + event.clientY - interaction.startClientY,
      });
    },
    [onBoardPan, board.id],
  );

  const handleBoardPointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (pendingTouchPanRef.current?.pointerId === event.pointerId) {
      pendingTouchPanRef.current = null;
    }

    if (panInteractionRef.current?.pointerId === event.pointerId) {
      panInteractionRef.current = null;
      unlockCanvasPanCursor();
      setIsPanning(false);
    }
  }, []);

  const handleWheel = useCallback(
    (event: Pick<WheelEvent<HTMLDivElement>, "preventDefault" | "stopPropagation" | "deltaY">) => {
      if (isFreeEditWorkspace) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      onBoardSelectRef.current(board.id);

      const nextZoom = clampPreviewZoom(
        boardZoom * Math.exp(-event.deltaY * WHEEL_ZOOM_SENSITIVITY),
      );
      onBoardZoom(board.id, nextZoom);
    },
    [isFreeEditWorkspace, onBoardZoom, board.id, boardZoom],
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || isFreeEditWorkspace) {
      return;
    }

    const onWheel = (event: globalThis.WheelEvent) => {
      handleWheel(event);
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [handleWheel, isFreeEditWorkspace]);

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const distance = getTouchDistance(event.touches);

      if (distance === null) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      pendingTouchPanRef.current = null;
      if (panInteractionRef.current) {
        panInteractionRef.current = null;
        unlockCanvasPanCursor();
        setIsPanning(false);
      }
      onBoardSelectRef.current(board.id);
      pinchDistanceRef.current = distance;
      pinchZoomRef.current = boardZoom;
    },
    [board.id, boardZoom],
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const startDistance = pinchDistanceRef.current;
      const nextDistance = getTouchDistance(event.touches);

      if (startDistance === null || nextDistance === null || startDistance <= 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      didTouchPanRef.current = true;
      onBoardZoom(
        board.id,
        clampPreviewZoom(pinchZoomRef.current * (nextDistance / startDistance)),
      );
    },
    [onBoardZoom, board.id],
  );

  const handleTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      pinchDistanceRef.current = null;
    }
  }, []);

  return {
    effectivePan,
    effectiveZoom,
    hideLayerSelectionChrome,
    isFreeEditWorkspace,
    isPanning,
    canvasAppearance,
    canvasRef,
    viewFitScale,
    handleSelect,
    handleBoardPointerDown,
    handleBoardPointerEnd,
    handleBoardPointerMove,
    handleCanvasClick,
    handleCanvasKeyDown,
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
  };
}
