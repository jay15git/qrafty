"use client";

import { useRef, useState, type PointerEvent } from "react";

import { type CanvasLayer } from "@/features/canvas/model/layers/shared";
import { getCanvasMarqueeSelection } from "@/features/canvas/model/layers/operations";
import { getMarqueeBounds } from "@/features/canvas/components/canvas-layer-geometry";
import { isTouchLikePointer } from "@/features/canvas/components/canvas-interaction-utils";

export type CanvasMarqueeState = {
  additive: boolean;
  end: { x: number; y: number };
  pointerId: number;
  start: { x: number; y: number };
};

export type CanvasMarqueeSelectionInput = {
  closeContextMenu: () => void;
  commitEditingTextDraft: () => void;
  editingTextLayerId: string | null;
  getScenePointFromClientPoint: (clientX: number, clientY: number) => { x: number; y: number };
  onLayerSelectionChange?: (layerIds: string[], options?: { additive?: boolean }) => void;
  visibleLayers: CanvasLayer[];
};

export function useMarqueeSelection({
  closeContextMenu,
  commitEditingTextDraft,
  editingTextLayerId,
  getScenePointFromClientPoint,
  onLayerSelectionChange,
  visibleLayers,
}: CanvasMarqueeSelectionInput) {
  const [marquee, setMarquee] = useState<CanvasMarqueeState | null>(null);
  const marqueeRef = useRef<typeof marquee>(null);
  const suppressCanvasClickRef = useRef(false);

  function startMarqueeSelection(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0 || event.target !== event.currentTarget) {
      return;
    }

    if (isTouchLikePointer(event)) {
      return;
    }

    if (editingTextLayerId) {
      commitEditingTextDraft();
    }

    const point = getScenePointFromClientPoint(event.clientX, event.clientY);

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    closeContextMenu();
    const nextMarquee = {
      additive: event.shiftKey || event.metaKey || event.ctrlKey,
      end: point,
      pointerId: event.pointerId,
      start: point,
    };
    marqueeRef.current = nextMarquee;
    setMarquee(nextMarquee);
  }

  function updateMarqueeSelection(event: PointerEvent<HTMLElement>) {
    const current = marqueeRef.current;

    if (!current || current.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const nextMarquee = {
      ...current,
      end: getScenePointFromClientPoint(event.clientX, event.clientY),
    };
    marqueeRef.current = nextMarquee;
    setMarquee(nextMarquee);
  }

  function endMarqueeSelection(event: PointerEvent<HTMLElement>) {
    const current = marqueeRef.current;

    if (!current || current.pointerId !== event.pointerId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    marqueeRef.current = null;
    setMarquee(null);

    const moved =
      Math.abs(current.end.x - current.start.x) > 1 ||
      Math.abs(current.end.y - current.start.y) > 1;
    suppressCanvasClickRef.current = moved;

    const selectedIds = getCanvasMarqueeSelection(
      visibleLayers,
      getMarqueeBounds(current.start, current.end),
    );

    onLayerSelectionChange?.(selectedIds, { additive: current.additive });
  }

  return {
    marquee,
    suppressCanvasClickRef,
    endMarqueeSelection,
    startMarqueeSelection,
    updateMarqueeSelection,
  };
}
