"use client";

import { useEffect, useState, type MouseEvent } from "react";

import {
  CONTEXT_MENU_POINTER_OFFSET_PX,
  type CanvasLayerMenuAction,
} from "@/features/canvas/components/canvas-layer-chrome.constants";

export type CanvasContextMenuState = {
  layerIds: string[];
  scenePoint?: { x: number; y: number };
  x: number;
  y: number;
};

export type CanvasLayerContextMenuInput = {
  activeSelectedLayerIds: string[];
  getScenePointFromClientPoint: (clientX: number, clientY: number) => { x: number; y: number };
  onLayerAction?: (layerIds: string[], action: CanvasLayerMenuAction) => void;
  onLayerCopy?: (layerIds: string[]) => void;
  onLayerSelect?: (layerId: string | null, options?: { additive?: boolean }) => void;
  selectedVisibleLayerIds: string[];
};

export function useLayerContextMenu({
  activeSelectedLayerIds,
  getScenePointFromClientPoint,
  onLayerAction,
  onLayerCopy,
  onLayerSelect,
  selectedVisibleLayerIds,
}: CanvasLayerContextMenuInput) {
  const [contextMenu, setContextMenu] = useState<CanvasContextMenuState | null>(null);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    function closeContextMenuOnOutsidePointer(event: Event) {
      const target = event.target;

      if (target instanceof Element && target.closest('[data-slot="canvas-layer-context-menu"]')) {
        return;
      }

      setContextMenu(null);
    }

    document.addEventListener("pointerdown", closeContextMenuOnOutsidePointer, true);

    return () => {
      document.removeEventListener("pointerdown", closeContextMenuOnOutsidePointer, true);
    };
  }, [contextMenu]);

  function openLayerContextMenu(event: MouseEvent<HTMLElement>, layerIds: string[]) {
    if (layerIds.length === 0) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      layerIds,
      scenePoint: getScenePointFromClientPoint(event.clientX, event.clientY),
      x: event.clientX,
      y: event.clientY + CONTEXT_MENU_POINTER_OFFSET_PX,
    });
    onLayerSelect?.(layerIds.at(-1) ?? null);
  }

  function openFloatingLayerContextMenu(event: MouseEvent<HTMLButtonElement>, layerIds: string[]) {
    if (layerIds.length === 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left;
    const y = rect.bottom + CONTEXT_MENU_POINTER_OFFSET_PX;

    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      layerIds,
      scenePoint: getScenePointFromClientPoint(rect.left + rect.width / 2, rect.bottom),
      x,
      y,
    });
    onLayerSelect?.(layerIds.at(-1) ?? null);
  }

  function openCanvasContextMenu(event: MouseEvent<HTMLElement>) {
    if (event.target !== event.currentTarget) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      layerIds: activeSelectedLayerIds,
      scenePoint: getScenePointFromClientPoint(event.clientX, event.clientY),
      x: event.clientX,
      y: event.clientY + CONTEXT_MENU_POINTER_OFFSET_PX,
    });
  }

  function runLayerAction(action: CanvasLayerMenuAction) {
    if (!contextMenu || contextMenu.layerIds.length === 0) {
      return;
    }

    onLayerAction?.(contextMenu.layerIds, action);
    setContextMenu(null);
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  function runSelectedLayerAction(action: CanvasLayerMenuAction) {
    if (selectedVisibleLayerIds.length === 0) {
      return;
    }

    onLayerAction?.(selectedVisibleLayerIds, action);
  }

  function runSelectedLayerCopy() {
    if (selectedVisibleLayerIds.length === 0) {
      return;
    }

    onLayerCopy?.(selectedVisibleLayerIds);
  }

  return {
    contextMenu,
    closeContextMenu,
    openCanvasContextMenu,
    openFloatingLayerContextMenu,
    openLayerContextMenu,
    runLayerAction,
    runSelectedLayerAction,
    runSelectedLayerCopy,
  };
}
