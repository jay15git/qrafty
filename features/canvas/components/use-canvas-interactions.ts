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

import type { CanvasBoardPane, CanvasBoardTool } from "@/features/canvas/components/CanvasBoard";
import { isTouchLikePointer } from "@/features/canvas/components/canvas-interaction-utils";
import { WORKSPACE_MOBILE_QUERY } from "@/lib/hooks/use-media-query";
import {
  computeTemplatePreviewFit,
  DESKTOP_ARTBOARD_VIEW_INSETS,
  DESKTOP_CANVAS_FIT_PADDING,
  MOBILE_ARTBOARD_VIEW_INSETS,
} from "@/features/canvas/model/template-preview-fit";
import { previewDrawerResize } from "@/features/canvas/preview/preview-drawer-resize";
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
  activeCanvasTool?: CanvasBoardTool | null;
  fitCanvasToViewport?: boolean;
  layerEditingEnabled?: boolean;
  onAddTextLayerAt?: (boardId: string, point: { x: number; y: number }) => void;
  onCanvasToolChange?: (tool: CanvasBoardTool | null) => void;
  onLayerSelect?: (
    boardId: string,
    layerId: string | null,
    options?: { additive?: boolean },
  ) => void;
  onBoardPan: (boardId: string, nextPan: { x: number; y: number }) => void;
  onBoardQrClick: (boardId: string) => void;
  onBoardSelect: (boardId: string) => void;
  onBoardZoom: (boardId: string, nextZoom: number) => void;
  board: CanvasBoardPane;
  boardPan: { x: number; y: number };
  boardZoom: number;
  previewLocked?: boolean;
  toolbarVariant?: "default" | "zoom";
};

export function useCanvasInteractions({
  activeCanvasTool,
  fitCanvasToViewport = false,
  layerEditingEnabled = true,
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
  previewLocked = false,
  toolbarVariant = "default",
}: UseCanvasInteractionsArgs) {
  const hideLayerSelectionChrome = activeCanvasTool === "pan" || !layerEditingEnabled;
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const onBoardSelectRef = useRef(onBoardSelect);
  const onBoardQrClickRef = useRef(onBoardQrClick);
  const panOverlayRef = useRef<HTMLDivElement>(null);
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
  const effectivePan = previewLocked ? { x: 0, y: 0 } : boardPan;
  const isFreeEditWorkspace = toolbarVariant === "zoom" && layerEditingEnabled && !previewLocked;
  const shouldAutoFitViewport = previewLocked || fitCanvasToViewport;
  const canvasAppearance: "template" | "workspace" | "neutral" = previewLocked
    ? "template"
    : isFreeEditWorkspace
      ? "workspace"
      : "neutral";
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

      const nextFitScale = computeTemplatePreviewFit(
        { width: board.cardState.width, height: board.cardState.height },
        { width: rect.width, height: rect.height },
        isFreeEditWorkspace
          ? { allowUpscale: true, insets: artboardInsets }
          : fitCanvasToViewport
            ? { allowUpscale: true, padding: DESKTOP_CANVAS_FIT_PADDING }
            : undefined,
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

    const unsubscribeDrawerResizeEnded = previewDrawerResize.subscribeOnEnded(() => {
      updateFitScaleRef.current?.();
    });

    const handleEntrancePreReveal = () => {
      updateFitScaleRef.current?.();
    };

    const handleEntranceComplete = () => {
      updateFitScaleRef.current?.();
    };

    window.addEventListener(ENTRANCE_PRE_REVEAL_EVENT, handleEntrancePreReveal);
    window.addEventListener(ENTRANCE_COMPLETE_EVENT, handleEntranceComplete);

    return () => {
      observer.disconnect();
      unsubscribeDrawerResizeEnded();
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
    onBoardQrClickRef.current = onBoardQrClick;
  }, [onBoardQrClick]);

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

  const getPlacementPoint = useCallback(
    (event: ReactMouseEvent<HTMLDivElement> | ReactPointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const sceneScale = effectiveZoom * viewFitScale;

      return {
        x: (event.clientX - rect.left - rect.width / 2 - effectivePan.x) / sceneScale,
        y: (event.clientY - rect.top - rect.height / 2 - effectivePan.y) / sceneScale,
      };
    },
    [effectivePan.x, effectivePan.y, effectiveZoom, viewFitScale],
  );

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

      if (activeCanvasTool === "text" && onAddTextLayerAt && isPlacementTarget(event)) {
        event.preventDefault();
        event.stopPropagation();
        onBoardSelectRef.current(board.id);
        onAddTextLayerAt(board.id, getPlacementPoint(event));
        onCanvasToolChange?.(null);
        return;
      }

      handleSelect();
    },
    [
      activeCanvasTool,
      getPlacementPoint,
      handleSelect,
      isPlacementTarget,
      onAddTextLayerAt,
      onCanvasToolChange,
      board.id,
    ],
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

  const handleQrClick = useCallback(() => {
    onBoardQrClickRef.current(board.id);
  }, [board.id]);

  const shouldIgnorePanToolTarget = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) =>
      event.target instanceof Element &&
      Boolean(
        event.target.closest(
          "button, input, textarea, select, [data-slot='canvas-layer-floating-toolbar'], [data-slot='canvas-layer-context-menu']",
        ),
      ),
    [],
  );

  const beginBoardPan = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (previewLocked) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      const captureTarget = panOverlayRef.current ?? event.currentTarget;
      captureTarget.setPointerCapture(event.pointerId);
      onBoardSelectRef.current(board.id);
      panInteractionRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPanX: boardPan.x,
        startPanY: boardPan.y,
      };
      lockCanvasPanCursor();
      setIsPanning(true);
    },
    [board.id, boardPan.x, boardPan.y, previewLocked],
  );

  const handleBoardPointerDownCapture = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (activeCanvasTool !== "pan" || event.button !== 0 || isTouchLikePointer(event)) {
        return;
      }

      if (shouldIgnorePanToolTarget(event)) {
        return;
      }

      if (
        event.target instanceof Element &&
        event.target.closest("[data-slot='canvas-pan-overlay']")
      ) {
        return;
      }

      beginBoardPan(event);
    },
    [activeCanvasTool, beginBoardPan, shouldIgnorePanToolTarget],
  );

  const handleBoardPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      if (!isPlacementTarget(event)) {
        return;
      }

      if (activeCanvasTool === "text" && onAddTextLayerAt) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      if (isTouchLikePointer(event) && !previewLocked) {
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

      if (activeCanvasTool !== "pan") {
        onBoardSelectRef.current(board.id);
        onLayerSelect?.(board.id, null);
      }
    },
    [
      activeCanvasTool,
      isPlacementTarget,
      onAddTextLayerAt,
      onLayerSelect,
      board.id,
      boardPan.x,
      boardPan.y,
      previewLocked,
    ],
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
        const captureTarget = panOverlayRef.current ?? event.currentTarget;
        captureTarget.setPointerCapture(event.pointerId);
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
      if (previewLocked || isFreeEditWorkspace) {
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
    [isFreeEditWorkspace, onBoardZoom, board.id, boardZoom, previewLocked],
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || previewLocked || isFreeEditWorkspace) {
      return;
    }

    const onWheel = (event: globalThis.WheelEvent) => {
      handleWheel(event);
    };

    canvas.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      canvas.removeEventListener("wheel", onWheel);
    };
  }, [handleWheel, isFreeEditWorkspace, previewLocked]);

  const handleTouchStart = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (previewLocked) {
        return;
      }

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
    [board.id, boardZoom, previewLocked],
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      if (previewLocked) {
        return;
      }

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
    [onBoardZoom, board.id, previewLocked],
  );

  const handleTouchEnd = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length < 2) {
      pinchDistanceRef.current = null;
    }
  }, []);

  return {
    beginBoardPan,
    effectivePan,
    effectiveZoom,
    hideLayerSelectionChrome,
    isFreeEditWorkspace,
    isPanning,
    panOverlayRef,
    canvasAppearance,
    canvasRef,
    viewFitScale,
    handleQrClick,
    handleSelect,
    handleBoardPointerDown,
    handleBoardPointerDownCapture,
    handleBoardPointerEnd,
    handleBoardPointerMove,
    handleCanvasClick,
    handleCanvasKeyDown,
    handleTouchEnd,
    handleTouchMove,
    handleTouchStart,
  };
}
