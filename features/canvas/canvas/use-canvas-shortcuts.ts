"use client";

import { useEffect, type MutableRefObject } from "react";

import type { CanvasLayer, CanvasLayerStateByNodeId } from "@/features/canvas/model/layers/shared";
import { createDefaultCanvasLayers } from "@/features/canvas/model/layers/card-qr";
import {
  getCanvasLayerClipboardPayload,
  isEditableShortcutTarget,
  parseCanvasLayerClipboardPayload,
} from "@/features/canvas/components/canvas-operations";
import type { CanvasLayerMenuAction } from "@/features/canvas/components/Artboard";
import type { CanvasCardState } from "@/features/canvas/model/card-state";
import type { QraftyState } from "@/features/qr/model/state";

const ARROW_KEY_DELTAS: Record<string, readonly [number, number]> = {
  arrowleft: [-1, 0],
  arrowright: [1, 0],
  arrowup: [0, -1],
  arrowdown: [0, 1],
};

export type CanvasShortcutKeyboardState = {
  activeQrLayerId: string;
  activeQrNodeId: string;
  canvasQraftyState: QraftyState;
  layerStateByNodeId: CanvasLayerStateByNodeId;
  qrLayerCount: number;
  selectedCardState: CanvasCardState;
  selectedLayerIds: string[];
};

export type CanvasShortcutHandlers = {
  clearCanvasLayerSelection: () => void;
  copySelectedCanvasLayers: (layerIds?: string[], boardId?: string) => Promise<void>;
  deleteSelectedLayersOrBoard: () => void;
  duplicateSelectedLayers: (layerIds?: string[]) => void;
  handleLayerAction: (boardId: string, layerIds: string[], action: CanvasLayerMenuAction) => void;
  handleLayerChange: (boardId: string, layerId: string, patch: Partial<CanvasLayer>) => void;
  handleRedoCanvasWorkspace: () => void;
  handleUndoCanvasWorkspace: () => void;
  pasteCanvasLayers: (
    point?: { x: number; y: number },
    payloadText?: string,
    boardId?: string,
  ) => Promise<void>;
  selectAllActiveCanvasLayers: () => void;
};

export function useCanvasShortcuts({
  clipboardRef,
  handlersRef,
  stateRef,
  canvasRef,
}: {
  clipboardRef: MutableRefObject<string>;
  handlersRef: MutableRefObject<CanvasShortcutHandlers>;
  stateRef: MutableRefObject<CanvasShortcutKeyboardState>;
  canvasRef: MutableRefObject<HTMLElement | null>;
}) {
  useEffect(() => {
    const MODIFIER_SHORTCUTS: Record<string, (event: KeyboardEvent) => void> = {
      z: (event) =>
        event.shiftKey
          ? handlersRef.current.handleRedoCanvasWorkspace()
          : handlersRef.current.handleUndoCanvasWorkspace(),
      y: () => handlersRef.current.handleRedoCanvasWorkspace(),
      d: () => handlersRef.current.duplicateSelectedLayers(),
      a: () => handlersRef.current.selectAllActiveCanvasLayers(),
      v: () => void handlersRef.current.pasteCanvasLayers(),
    };

    const nudgeSelectedLayers = (event: KeyboardEvent, arrowDelta: readonly [number, number]) => {
      const delta = event.shiftKey ? 10 : 1;
      const {
        activeQrNodeId: currentActiveQrNodeId,
        layerStateByNodeId: currentLayerStateByNodeId,
        selectedLayerIds: currentSelectedLayerIds,
      } = stateRef.current;
      const activeLayers = currentLayerStateByNodeId[currentActiveQrNodeId] ?? [];
      const activeLayerById = new Map(activeLayers.map((item) => [item.id, item]));

      if (currentSelectedLayerIds.length === 0) {
        return;
      }

      event.preventDefault();
      for (const layerId of currentSelectedLayerIds) {
        const layer = activeLayerById.get(layerId);

        if (layer) {
          handlersRef.current.handleLayerChange(currentActiveQrNodeId, layerId, {
            x: layer.x + arrowDelta[0] * delta,
            y: layer.y + arrowDelta[1] * delta,
          });
        }
      }
    };

    const handlePlainKey = (event: KeyboardEvent, key: string) => {
      const arrowDelta = ARROW_KEY_DELTAS[key];
      if (arrowDelta) {
        nudgeSelectedLayers(event, arrowDelta);
        return;
      }

      if (key === "delete" || key === "backspace") {
        event.preventDefault();
        handlersRef.current.deleteSelectedLayersOrBoard();
        return;
      }

      if (key === "escape") {
        event.preventDefault();
        handlersRef.current.clearCanvasLayerSelection();
      }
    };

    const handleModifierKey = (event: KeyboardEvent, key: string) => {
      const withSelection = (action: (selectedLayerIds: string[]) => void) => {
        const selectedLayerIds = stateRef.current.selectedLayerIds;
        if (selectedLayerIds.length > 0) {
          event.preventDefault();
          action(selectedLayerIds);
        }
      };
      const reorder = (shifted: string, plain: string) =>
        withSelection((selectedLayerIds) =>
          handlersRef.current.handleLayerAction(
            stateRef.current.activeQrNodeId,
            selectedLayerIds,
            (event.shiftKey ? shifted : plain) as Parameters<
              CanvasShortcutHandlers["handleLayerAction"]
            >[2],
          ),
        );

      const shortcut = MODIFIER_SHORTCUTS[key];
      if (shortcut) {
        event.preventDefault();
        shortcut(event);
        return;
      }

      if (key === "c") {
        withSelection(
          (selectedLayerIds) => void handlersRef.current.copySelectedCanvasLayers(selectedLayerIds),
        );
        return;
      }

      if (key === "[") {
        reorder("back", "backward");
        return;
      }

      if (key === "]") {
        reorder("front", "forward");
        return;
      }

      if (key === "g") {
        reorder("ungroup", "group");
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isBodyOrDocumentTarget =
        target === document.body || target === document.documentElement || target === document;
      const targetInCanvas = target instanceof Node && canvasRef.current?.contains(target);

      if (
        !canvasRef.current ||
        (!targetInCanvas && !isBodyOrDocumentTarget) ||
        isEditableShortcutTarget(target)
      ) {
        return;
      }

      const key = event.key.toLowerCase();

      if (event.metaKey || event.ctrlKey) {
        handleModifierKey(event, key);
      } else {
        handlePlainKey(event, key);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
    // Keyboard listener is stable; current workspace values are read via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const shouldUseCanvasClipboardEvent = (event: ClipboardEvent) => {
      const target = event.target;
      const isBodyOrDocumentTarget =
        target === document.body || target === document.documentElement || target === document;
      const targetInCanvas = target instanceof Node && canvasRef.current?.contains(target);

      return Boolean(
        canvasRef.current &&
        (targetInCanvas || isBodyOrDocumentTarget) &&
        !isEditableShortcutTarget(target),
      );
    };

    const handleCopy = (event: ClipboardEvent) => {
      if (!shouldUseCanvasClipboardEvent(event)) {
        return;
      }

      const {
        activeQrNodeId: currentActiveQrNodeId,
        canvasQraftyState: currentCanvasQraftyState,
        layerStateByNodeId: currentLayerStateByNodeId,
        selectedCardState: currentSelectedCardState,
        selectedLayerIds: currentSelectedLayerIds,
      } = stateRef.current;
      const payload = getCanvasLayerClipboardPayload({
        layerIds: currentSelectedLayerIds,
        layers:
          currentLayerStateByNodeId[currentActiveQrNodeId] ??
          createDefaultCanvasLayers(
            currentActiveQrNodeId,
            currentCanvasQraftyState,
            currentSelectedCardState,
          ),
        boardId: currentActiveQrNodeId,
      });

      if (!payload) {
        return;
      }

      event.preventDefault();
      clipboardRef.current = payload;
      event.clipboardData?.setData("text/plain", payload);
    };

    const handlePaste = (event: ClipboardEvent) => {
      if (!shouldUseCanvasClipboardEvent(event)) {
        return;
      }

      const rawPayload = event.clipboardData?.getData("text/plain") ?? "";

      if (!parseCanvasLayerClipboardPayload(rawPayload)) {
        return;
      }

      event.preventDefault();
      void handlersRef.current.pasteCanvasLayers(undefined, rawPayload);
    };

    window.addEventListener("copy", handleCopy, true);
    window.addEventListener("paste", handlePaste, true);
    return () => {
      window.removeEventListener("copy", handleCopy, true);
      window.removeEventListener("paste", handlePaste, true);
    };
    // Clipboard handlers read the latest state via refs; register once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
