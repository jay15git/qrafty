"use client";

import type { MutableRefObject } from "react";

import type { CanvasLayerMenuAction } from "@/features/canvas/components/Artboard";
import { DRAFTING_LAYER_PASTE_OFFSET } from "@/features/canvas/components/canvas.constants";
import {
  findCanvasLayerById,
  getCanvasLayerClipboardPayload,
  parseCanvasLayerClipboardPayload,
  patchCanvasLayerById,
} from "@/features/canvas/components/canvas-operations";
import type {
  CanvasSurfaceSetters,
  CanvasSurfaceState,
} from "@/features/canvas/components/canvas-reducer";
import type { ActiveQrApi } from "@/features/canvas/components/use-active-qr";
import type { CanvasShortcutKeyboardState } from "@/features/canvas/canvas/use-canvas-shortcuts";
import { DASHBOARD_QR_NODE_ID } from "@/features/qr/rendering/compose-scene";
import {
  getCanvasQrLayerId,
  getQrCanvasLayers,
  isCanvasCardLayerId,
  isCanvasQrLayerId,
  isLayerDeletable,
  isProtectedCanvasLayerId,
  type CanvasLayer,
  type CanvasLayerAlignAction,
  type CanvasLayerDistributeAction,
  type CanvasLayerReorderAction,
} from "@/features/canvas/model/layers/shared";
import { cloneCanvasLayer } from "@/features/canvas/model/layers/fallback";
import { patchCanvasLayer } from "@/features/canvas/model/layers/patch";
import {
  alignCanvasLayers,
  cloneCanvasLayersForPaste,
  distributeCanvasLayers,
  reorderCanvasLayer,
} from "@/features/canvas/model/layers/operations";
import { groupCanvasLayers, ungroupCanvasLayer } from "@/features/canvas/model/layers/group";
import {
  cloneCanvasQrState,
  createDefaultCanvasWorkspaceQrState,
} from "@/features/canvas/model/document";
import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr/content/input-options";
import type { QraftyState } from "@/features/qr/model/state";

type LayerActionState = Pick<
  CanvasSurfaceState,
  | "activeQrLayerId"
  | "canvasLayers"
  | "contentTypeByLayerId"
  | "qrStateByLayerId"
  | "selectedCardState"
  | "selectedContentType"
  | "selectedLayerIds"
>;

type LayerActionSetters = Pick<
  CanvasSurfaceSetters,
  | "setCanvasLayers"
  | "setContentTypeByLayerId"
  | "setDesktopRailTool"
  | "setQrStateByLayerId"
  | "setSelectedCardState"
  | "setSelectedLayerId"
  | "setSelectedLayerIds"
>;

export function useLayerActions({
  activateQrLayer,
  activeQrLayerId,
  canvasLayers,
  contentTypeByLayerId,
  canvasLayerClipboardRef,
  canvasQraftyState,
  canvasRef,
  keyboardStateRef,
  persistActiveQrLayerState,
  setActiveQrState,
  qrStateByLayerId,
  selectedCardState,
  selectedContentType,
  selectedLayerIds,
  setCanvasLayers,
  setContentTypeByLayerId,
  setDesktopRailTool,
  setQrStateByLayerId,
  setSelectedCardState,
  setSelectedLayerId,
  setSelectedLayerIds,
}: LayerActionState &
  LayerActionSetters & {
    canvasLayerClipboardRef: MutableRefObject<string>;
    canvasQraftyState: QraftyState;
    activateQrLayer: (layerId: string) => void;
    canvasRef: MutableRefObject<HTMLElement | null>;
    keyboardStateRef: MutableRefObject<CanvasShortcutKeyboardState>;
    persistActiveQrLayerState: (nextState?: QraftyState) => void;
    setActiveQrState: ActiveQrApi["setActiveQrState"];
  }) {
  function selectSingleLayer(layerId: string | null) {
    setSelectedLayerId(layerId);
    setSelectedLayerIds(layerId ? [layerId] : []);
  }

  function applyLayerSelection(nextLayerIds: string[]) {
    setSelectedLayerIds(nextLayerIds);
    setSelectedLayerId(nextLayerIds.at(-1) ?? null);
  }

  function handleBoardSelection() {
    canvasRef.current?.focus({ preventScroll: true });
  }

  function duplicateSelectedLayers(layerIds = selectedLayerIds) {
    if (layerIds.length === 0) {
      return;
    }

    persistActiveQrLayerState();

    const layers = canvasLayers;
    const selectedIdSet = new Set(layerIds);
    const selectedLayers = layers.filter((layer) => selectedIdSet.has(layer.id));

    if (selectedLayers.length === 0) {
      return;
    }

    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1);
    const duplicatedLayers: CanvasLayer[] = [];
    const nextQrStateByLayerId: Record<string, QraftyState> = {};
    const nextContentTypeByLayerId: Record<string, QrInputType> = {};

    selectedLayers.forEach((layer, index) => {
      const duplicatedLayer = patchCanvasLayer(
        {
          ...cloneCanvasLayer(layer),
          id: `${DASHBOARD_QR_NODE_ID}:${layer.kind}:${Date.now()}-${index}`,
          x: layer.x + DRAFTING_LAYER_PASTE_OFFSET,
          y: layer.y + DRAFTING_LAYER_PASTE_OFFSET,
          zIndex: maxZIndex + index + 1,
        },
        {},
      );
      duplicatedLayers.push(duplicatedLayer);

      if (layer.kind === "qr") {
        const sourceState =
          layer.id === activeQrLayerId
            ? canvasQraftyState
            : (qrStateByLayerId[layer.id] ?? canvasQraftyState);
        nextQrStateByLayerId[duplicatedLayer.id] = cloneCanvasQrState(sourceState);
        nextContentTypeByLayerId[duplicatedLayer.id] =
          contentTypeByLayerId[layer.id] ?? selectedContentType;
      }
    });

    if (Object.keys(nextQrStateByLayerId).length > 0) {
      setQrStateByLayerId((current) => ({
        ...current,
        ...nextQrStateByLayerId,
      }));
      setContentTypeByLayerId((current) => ({
        ...current,
        ...nextContentTypeByLayerId,
      }));
    }

    setCanvasLayers((current) => [...current.map(cloneCanvasLayer), ...duplicatedLayers]);

    const nextActiveLayerId = duplicatedLayers.at(-1)?.id ?? activeQrLayerId;
    const nextActiveState =
      nextQrStateByLayerId[nextActiveLayerId] ??
      qrStateByLayerId[nextActiveLayerId] ??
      canvasQraftyState;

    if (nextActiveLayerId !== activeQrLayerId) {
      setActiveQrState(nextActiveState, {
        layerId: nextActiveLayerId,
        contentType:
          nextContentTypeByLayerId[nextActiveLayerId] ??
          contentTypeByLayerId[nextActiveLayerId] ??
          selectedContentType,
      });
    }

    applyLayerSelection(duplicatedLayers.map((layer) => layer.id));
    canvasRef.current?.focus({ preventScroll: true });
  }

  function handleInsertLayer(layer: CanvasLayer) {
    const layers = canvasLayers;
    const maxZIndex = layers.reduce((max, currentLayer) => Math.max(max, currentLayer.zIndex), -1);
    const nextLayer = patchCanvasLayer(
      {
        ...cloneCanvasLayer(layer),
        id: `${DASHBOARD_QR_NODE_ID}:${layer.kind}:${Date.now()}`,
        nodeId: DASHBOARD_QR_NODE_ID,
        zIndex: maxZIndex + 1,
      },
      {},
    );

    setCanvasLayers((current) => [...current.map(cloneCanvasLayer), nextLayer]);
    selectSingleLayer(nextLayer.id);
    canvasRef.current?.focus({ preventScroll: true });
  }

  function handleLayerSelect(
    layerId: string | null,
    options?: { additive?: boolean; preserveActiveTool?: boolean },
  ) {
    canvasRef.current?.focus({ preventScroll: true });

    if (layerId && isCanvasQrLayerId(layerId) && !options?.additive) {
      activateQrLayer(layerId);
    }

    if (options?.additive && layerId !== null) {
      const next = selectedLayerIds.includes(layerId)
        ? selectedLayerIds.filter((id) => id !== layerId)
        : [...selectedLayerIds, layerId];

      applyLayerSelection(next);
    } else {
      selectSingleLayer(layerId);
    }

    if (layerId === null) {
      setDesktopRailTool("content");
      return;
    }

    if (options?.preserveActiveTool) {
      return;
    }

    const selectedLayer = findCanvasLayerById(canvasLayers, layerId);
    const selectedKind = selectedLayer?.kind;

    if (selectedKind === "text" || selectedKind === "image" || selectedKind === "shape") {
      setDesktopRailTool(null);
      return;
    }

    setDesktopRailTool(
      selectedKind === "group" ? "layers" : isCanvasCardLayerId(layerId) ? "shape" : "content",
    );
  }

  function handleLayerSelectionChange(layerIds: string[]) {
    applyLayerSelection(layerIds);
  }

  function getActiveSelectableLayers() {
    return keyboardStateRef.current.canvasLayers.filter((layer) => layer.isVisible);
  }

  function getSelectedActiveLayers() {
    const { canvasLayers: currentCanvasLayers, selectedLayerIds: currentSelectedLayerIds } =
      keyboardStateRef.current;
    const selectedLayerIdSet = new Set(currentSelectedLayerIds);

    return currentCanvasLayers.filter((layer) => selectedLayerIdSet.has(layer.id));
  }

  function selectAllActiveCanvasLayers() {
    const layerIds = getActiveSelectableLayers().map((layer) => layer.id);

    applyLayerSelection(layerIds);
  }

  function clearCanvasLayerSelection() {
    applyLayerSelection([]);
  }

  function deleteSelectedLayersOrBoard() {
    const { canvasLayers: currentCanvasLayers, selectedLayerIds: currentSelectedLayerIds } =
      keyboardStateRef.current;
    const layers = currentCanvasLayers;
    const selectedLayerIdSet = new Set(currentSelectedLayerIds);
    const removableLayerIds = layers.flatMap((layer) =>
      selectedLayerIdSet.has(layer.id) && isLayerDeletable(layer.id, layers) ? [layer.id] : [],
    );

    if (removableLayerIds.length === 0) {
      return;
    }

    const removableLayerIdSet = new Set(removableLayerIds);

    setQrStateByLayerId((current) => {
      const next = { ...current };
      for (const layerId of removableLayerIds) {
        if (isCanvasQrLayerId(layerId)) {
          delete next[layerId];
        }
      }
      return next;
    });
    setContentTypeByLayerId((current) => {
      const next = { ...current };
      for (const layerId of removableLayerIds) {
        if (isCanvasQrLayerId(layerId)) {
          delete next[layerId];
        }
      }
      return next;
    });
    setCanvasLayers((current) =>
      current.flatMap((layer) =>
        removableLayerIdSet.has(layer.id) ? [] : [cloneCanvasLayer(layer)],
      ),
    );

    const nextSelection = currentSelectedLayerIds.filter(
      (layerId) => !removableLayerIdSet.has(layerId),
    );
    const fallbackLayerId =
      getQrCanvasLayers(layers.filter((layer) => !removableLayerIdSet.has(layer.id))).at(-1)?.id ??
      getCanvasQrLayerId(DASHBOARD_QR_NODE_ID);

    if (removableLayerIdSet.has(activeQrLayerId)) {
      const fallbackState =
        qrStateByLayerId[fallbackLayerId] ?? createDefaultCanvasWorkspaceQrState();
      setActiveQrState(fallbackState, {
        layerId: fallbackLayerId,
        contentType: contentTypeByLayerId[fallbackLayerId] ?? DEFAULT_QR_INPUT_TYPE,
      });
    }

    applyLayerSelection(nextSelection.length > 0 ? nextSelection : [fallbackLayerId]);
  }

  function handleLayerChange(layerId: string, patch: Partial<CanvasLayer>) {
    const layers = canvasLayers;

    if (isProtectedCanvasLayerId(layerId, layers)) {
      const { isVisible: _isVisible, ...safePatch } = patch;
      if (Object.keys(safePatch).length === 0) {
        return;
      }
      patch = safePatch;
    } else {
      const { isVisible: _isVisible, ...patchWithoutVisibility } = patch;
      patch = patchWithoutVisibility;
    }

    setCanvasLayers((current) =>
      current.map((layer) => patchCanvasLayerById(layer, layerId, patch)),
    );
  }

  function handleLayerReorder(orderedIds: string[]) {
    setCanvasLayers((current) => {
      const layerById = new Map(current.map((layer) => [layer.id, layer]));
      const cardLayerId = current.find((layer) => layer.kind === "card")?.id;
      const orderedIdSet = new Set(orderedIds);
      const reorderableIds = orderedIds.filter(
        (layerId) => layerId !== cardLayerId && layerById.has(layerId),
      );
      const nextOrder = [
        ...reorderableIds,
        ...(cardLayerId ? [cardLayerId] : []),
        ...current.flatMap((layer) =>
          orderedIdSet.has(layer.id) || layer.id === cardLayerId ? [] : [layer.id],
        ),
      ];
      const zIndexByLayerId = new Map(
        nextOrder.map((layerId, index) => [layerId, nextOrder.length - index]),
      );

      return current.map((layer) =>
        patchCanvasLayer(layer, {
          zIndex: zIndexByLayerId.get(layer.id) ?? layer.zIndex,
        }),
      );
    });
  }

  async function copySelectedCanvasLayers(layerIds = selectedLayerIds) {
    const { canvasLayers: currentCanvasLayers } = keyboardStateRef.current;
    const payload = getCanvasLayerClipboardPayload({
      layerIds,
      layers: currentCanvasLayers,
      boardId: DASHBOARD_QR_NODE_ID,
    });

    if (!payload) {
      return;
    }

    canvasLayerClipboardRef.current = payload;
    await navigator.clipboard?.writeText(payload).catch(() => undefined);
  }

  async function pasteCanvasLayers(point?: { x: number; y: number }, payloadText?: string) {
    const rawPayload =
      payloadText ??
      (await navigator.clipboard?.readText().catch(() => canvasLayerClipboardRef.current)) ??
      canvasLayerClipboardRef.current;
    const payload = parseCanvasLayerClipboardPayload(rawPayload);

    if (!payload) {
      return;
    }

    const { canvasLayers: currentCanvasLayers } = keyboardStateRef.current;
    const maxZIndex = currentCanvasLayers.reduce((max, layer) => Math.max(max, layer.zIndex), -1);
    const offset = point
      ? {
          x: point.x - payload.bounds.x,
          y: point.y - payload.bounds.y,
        }
      : { x: DRAFTING_LAYER_PASTE_OFFSET, y: DRAFTING_LAYER_PASTE_OFFSET };
    const pastedLayers = cloneCanvasLayersForPaste({
      layers: payload.layers,
      nodeId: DASHBOARD_QR_NODE_ID,
      offset,
      startingZIndex: maxZIndex + 1,
    });

    applyLayerSelection(pastedLayers.map((layer) => layer.id));

    setCanvasLayers((current) => [...current.map(cloneCanvasLayer), ...pastedLayers]);
  }

  function handleLayerAction(layerIds: string[], action: CanvasLayerMenuAction) {
    if (layerIds.length === 0) {
      return;
    }

    const layers = canvasLayers;

    if (action === "delete") {
      const removableLayerIds = new Set(
        layerIds.filter((layerId) => isLayerDeletable(layerId, layers)),
      );

      if (removableLayerIds.size > 0) {
        setQrStateByLayerId((current) => {
          const next = { ...current };
          for (const layerId of removableLayerIds) {
            if (isCanvasQrLayerId(layerId)) {
              delete next[layerId];
            }
          }
          return next;
        });
        setContentTypeByLayerId((current) => {
          const next = { ...current };
          for (const layerId of removableLayerIds) {
            if (isCanvasQrLayerId(layerId)) {
              delete next[layerId];
            }
          }
          return next;
        });
        applyLayerSelection(selectedLayerIds.filter((layerId) => !removableLayerIds.has(layerId)));
      }
    }

    setCanvasLayers((current) => {
      const reorderActions: CanvasLayerReorderAction[] = ["back", "backward", "forward", "front"];
      const alignActions: CanvasLayerAlignAction[] = [
        "bottom",
        "center-x",
        "center-y",
        "left",
        "right",
        "top",
      ];
      const distributeActions: CanvasLayerDistributeAction[] = ["horizontal", "vertical"];

      let nextLayers = current;

      if (reorderActions.includes(action as CanvasLayerReorderAction)) {
        for (const layerId of layerIds.filter((id) => !isProtectedCanvasLayerId(id, current))) {
          nextLayers = reorderCanvasLayer(nextLayers, layerId, action as CanvasLayerReorderAction);
        }
      } else if (alignActions.includes(action as CanvasLayerAlignAction)) {
        nextLayers = alignCanvasLayers(nextLayers, layerIds, action as CanvasLayerAlignAction);
      } else if (action === "group") {
        nextLayers = groupCanvasLayers(nextLayers, layerIds, {
          groupId: `${DASHBOARD_QR_NODE_ID}:group:${Date.now()}`,
          name: "Group",
        });
      } else if (action === "ungroup") {
        for (const layerId of layerIds) {
          nextLayers = ungroupCanvasLayer(nextLayers, layerId);
        }
      } else if (distributeActions.includes(action as CanvasLayerDistributeAction)) {
        nextLayers = distributeCanvasLayers(
          nextLayers,
          layerIds,
          action as CanvasLayerDistributeAction,
        );
      } else if (action === "delete") {
        const removableLayerIds = new Set(
          layerIds.filter((layerId) => isLayerDeletable(layerId, current)),
        );

        if (removableLayerIds.size > 0) {
          nextLayers = nextLayers.flatMap((layer) =>
            removableLayerIds.has(layer.id) ? [] : [cloneCanvasLayer(layer)],
          );
        }
      } else if (action === "reset-rotation") {
        const actionableLayerIdSet = new Set(
          layerIds.filter((layerId) => !isProtectedCanvasLayerId(layerId, current)),
        );

        if (actionableLayerIdSet.size === 0) {
          return current;
        }

        nextLayers = nextLayers.map((layer) => {
          if (!actionableLayerIdSet.has(layer.id)) {
            return cloneCanvasLayer(layer);
          }

          return patchCanvasLayer(layer, { rotation: 0 });
        });
      }

      return nextLayers;
    });
  }
  return {
    clearCanvasLayerSelection,
    copySelectedCanvasLayers,
    deleteSelectedLayersOrBoard,
    duplicateSelectedLayers,
    handleInsertLayer,
    handleLayerAction,
    handleLayerChange,
    handleLayerReorder,
    handleLayerSelect,
    handleLayerSelectionChange,
    handleBoardSelection,
    pasteCanvasLayers,
    selectAllActiveCanvasLayers,
    selectSingleLayer,
  };
}
