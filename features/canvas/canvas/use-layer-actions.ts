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
import { createQrControls } from "@/features/canvas/canvas/qr-controls";
import type { CanvasShortcutKeyboardState } from "@/features/canvas/canvas/use-canvas-shortcuts";
import {
  getCanvasCardLayerId,
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
  clampLayerGeometryToCanvas,
  createDefaultCanvasLayers,
} from "@/features/canvas/model/layers/card-qr";
import { createCanvasTextLayer } from "@/features/canvas/model/layers/factories";
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
  type CanvasQrStateByNodeId,
} from "@/features/canvas/model/document";
import {
  cloneCanvasCardState,
  createDefaultCanvasCardState,
  type CanvasCardState,
} from "@/features/canvas/model/card-state";
import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr/content/input-options";
import type { QraftyState } from "@/features/qr/model/state";

type LayerActionState = Pick<
  CanvasSurfaceState,
  | "activeQrLayerId"
  | "activeQrNodeId"
  | "cardStateByNodeId"
  | "contentTypeByLayerId"
  | "layerStateByNodeId"
  | "qrStateByNodeId"
  | "qrStateByLayerId"
  | "selectedCardState"
  | "selectedContentType"
  | "selectedLayerIds"
>;

type LayerActionSetters = Pick<
  CanvasSurfaceSetters,
  | "setActiveQrLayerId"
  | "setActiveQrNodeId"
  | "setCardStateByNodeId"
  | "setContentTypeByLayerId"
  | "setDesktopRailTool"
  | "setLayerStateByNodeId"
  | "setQrStateByLayerId"
  | "setQrStateByNodeId"
  | "setSelectedCardState"
  | "setSelectedContentType"
  | "setSelectedLayerId"
  | "setSelectedLayerIds"
>;

export function useLayerActions({
  activateQrLayer,
  activeQrLayerId,
  activeQrNodeId,
  cardStateByNodeId,
  contentTypeByLayerId,
  canvasLayerClipboardRef,
  canvasQraftyState,
  canvasRef,
  keyboardStateRef,
  layerStateByNodeId,
  shouldReplaceCurrentEntryRef,
  persistActiveQrLayerState,
  qrControls,
  qrStateByLayerId,
  qrStateByNodeId,
  selectedCardState,
  selectedContentType,
  selectedLayerIds,
  setActiveQrLayerId,
  setActiveQrNodeId,
  setCardStateByNodeId,
  setContentTypeByLayerId,
  setDesktopRailTool,
  setLayerStateByNodeId,
  setQrStateByLayerId,
  setQrStateByNodeId,
  setSelectedCardState,
  setSelectedContentType,
  setSelectedLayerId,
  setSelectedLayerIds,
}: LayerActionState &
  LayerActionSetters & {
    canvasLayerClipboardRef: MutableRefObject<string>;
    canvasQraftyState: QraftyState;
    activateQrLayer: (layerId: string) => void;
    canvasRef: MutableRefObject<HTMLElement | null>;
    shouldReplaceCurrentEntryRef: MutableRefObject<boolean>;
    keyboardStateRef: MutableRefObject<CanvasShortcutKeyboardState>;
    persistActiveQrLayerState: (nextState?: QraftyState) => void;
    qrControls: ReturnType<typeof createQrControls>;
  }) {
  function selectSingleLayer(layerId: string | null) {
    setSelectedLayerId(layerId);
    setSelectedLayerIds(layerId ? [layerId] : []);
  }

  function applyLayerSelection(nextLayerIds: string[]) {
    setSelectedLayerIds(nextLayerIds);
    setSelectedLayerId(nextLayerIds.at(-1) ?? null);
  }

  function handleBoardSelection(_boardId: string) {
    canvasRef.current?.focus({ preventScroll: true });
  }

  function handleBoardQrClick(boardId: string) {
    if (boardId !== activeQrNodeId) {
      handleBoardSelection(boardId);
    }
  }

  function duplicateSelectedLayers(layerIds = selectedLayerIds) {
    if (layerIds.length === 0) {
      return;
    }

    persistActiveQrLayerState();

    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultCanvasLayers(activeQrNodeId, canvasQraftyState, selectedCardState);
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
          id: `${activeQrNodeId}:${layer.kind}:${Date.now()}-${index}`,
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

    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: [
        ...(current[activeQrNodeId] ?? layers).map(cloneCanvasLayer),
        ...duplicatedLayers,
      ],
    }));

    const nextActiveLayerId = duplicatedLayers.at(-1)?.id ?? activeQrLayerId;
    const nextActiveState =
      nextQrStateByLayerId[nextActiveLayerId] ??
      qrStateByLayerId[nextActiveLayerId] ??
      canvasQraftyState;

    if (nextActiveLayerId !== activeQrLayerId) {
      setActiveQrLayerId(nextActiveLayerId);
      qrControls.applyQrState(nextActiveState);
      setSelectedContentType(
        nextContentTypeByLayerId[nextActiveLayerId] ??
          contentTypeByLayerId[nextActiveLayerId] ??
          selectedContentType,
      );
    }

    applyLayerSelection(duplicatedLayers.map((layer) => layer.id));
    canvasRef.current?.focus({ preventScroll: true });
  }

  function handleRemoveQrCode(layerId: string) {
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultCanvasLayers(activeQrNodeId, canvasQraftyState, selectedCardState);

    if (!isLayerDeletable(layerId, layers)) {
      return;
    }

    const fallbackLayerId =
      getQrCanvasLayers(layers).find((layer) => layer.id !== layerId)?.id ??
      getCanvasQrLayerId(activeQrNodeId);

    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: (current[activeQrNodeId] ?? layers).filter((layer) => layer.id !== layerId),
    }));
    setQrStateByLayerId((current) => {
      const next = { ...current };
      delete next[layerId];
      return next;
    });
    setContentTypeByLayerId((current) => {
      const next = { ...current };
      delete next[layerId];
      return next;
    });

    if (layerId === activeQrLayerId) {
      const fallbackState =
        qrStateByLayerId[fallbackLayerId] ?? createDefaultCanvasWorkspaceQrState();
      setActiveQrLayerId(fallbackLayerId);
      qrControls.applyQrState(fallbackState);
      setSelectedContentType(contentTypeByLayerId[fallbackLayerId] ?? DEFAULT_QR_INPUT_TYPE);
      selectSingleLayer(fallbackLayerId);
      return;
    }

    selectSingleLayer(fallbackLayerId);
  }

  function handleInsertLayer(layer: CanvasLayer) {
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultCanvasLayers(activeQrNodeId, canvasQraftyState, selectedCardState);
    const maxZIndex = layers.reduce((max, currentLayer) => Math.max(max, currentLayer.zIndex), -1);
    const nextLayer = patchCanvasLayer(
      {
        ...cloneCanvasLayer(layer),
        id: `${activeQrNodeId}:${layer.kind}:${Date.now()}`,
        nodeId: activeQrNodeId,
        zIndex: maxZIndex + 1,
      },
      {},
    );

    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: [...layers.map(cloneCanvasLayer), nextLayer],
    }));
    selectSingleLayer(nextLayer.id);
    canvasRef.current?.focus({ preventScroll: true });
  }

  function handleAddTextLayer() {
    handleInsertLayer(createCanvasTextLayer(activeQrNodeId));
  }

  function handleAddTextLayerAt(boardId: string, point: { x: number; y: number }) {
    const targetQrState =
      boardId === activeQrNodeId
        ? canvasQraftyState
        : (qrStateByNodeId[boardId] ?? createDefaultCanvasWorkspaceQrState());
    const targetCardState =
      boardId === activeQrNodeId
        ? selectedCardState
        : (cardStateByNodeId[boardId] ?? createDefaultCanvasCardState());
    const layers =
      layerStateByNodeId[boardId] ??
      createDefaultCanvasLayers(boardId, targetQrState, targetCardState);
    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1);
    const draftPosition = clampLayerGeometryToCanvas(
      {
        height: 48,
        width: 240,
        x: Math.round(point.x - 120),
        y: Math.round(point.y - 24),
      },
      targetCardState,
    );
    const textLayer = createCanvasTextLayer(boardId, {
      id: `${boardId}:text:${Date.now()}`,
      x: draftPosition.x,
      y: draftPosition.y,
      zIndex: maxZIndex + 1,
    });

    if (boardId !== activeQrNodeId) {
      shouldReplaceCurrentEntryRef.current = true;
      setQrStateByNodeId((current) => ({
        ...current,
        [activeQrNodeId]: cloneCanvasQrState(canvasQraftyState),
        [boardId]: cloneCanvasQrState(targetQrState),
      }));
      setCardStateByNodeId((current) => ({
        ...current,
        [activeQrNodeId]: cloneCanvasCardState(selectedCardState),
        [boardId]: cloneCanvasCardState(targetCardState),
      }));
      setActiveQrNodeId(boardId);
      qrControls.applyQrState(targetQrState);
      setSelectedCardState(cloneCanvasCardState(targetCardState));
    }

    setLayerStateByNodeId((current) => ({
      ...current,
      [boardId]: [...layers.map(cloneCanvasLayer), textLayer],
    }));
    selectSingleLayer(textLayer.id);
    canvasRef.current?.focus({ preventScroll: true });
  }

  function handleAddFrameCardLayer() {
    const cardLayerId = getCanvasCardLayerId(activeQrNodeId);
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultCanvasLayers(activeQrNodeId, canvasQraftyState, selectedCardState);

    setSelectedCardState((current) => ({
      ...current,
      enabled: true,
    }));
    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: layers.map((layer) =>
        layer.id === cardLayerId
          ? patchCanvasLayer(layer, {
              isVisible: true,
              shadow: selectedCardState.shadow,
            })
          : cloneCanvasLayer(layer),
      ),
    }));
    selectSingleLayer(cardLayerId);
    setDesktopRailTool("shape");
    canvasRef.current?.focus({ preventScroll: true });
  }

  function handleLayerSelect(
    boardId: string,
    layerId: string | null,
    options?: { additive?: boolean; preserveActiveTool?: boolean },
  ) {
    canvasRef.current?.focus({ preventScroll: true });

    if (layerId && isCanvasQrLayerId(layerId) && !options?.additive) {
      activateQrLayer(layerId);
    }

    if (options?.additive && boardId === activeQrNodeId && layerId !== null) {
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

    const selectedLayer = findCanvasLayerById(
      layerStateByNodeId[boardId] ??
        createDefaultCanvasLayers(boardId, canvasQraftyState, selectedCardState),
      layerId,
    );
    const selectedKind = selectedLayer?.kind;

    if (
      selectedKind === "text" ||
      selectedKind === "image" ||
      selectedKind === "shape" ||
      selectedKind === "shader"
    ) {
      setDesktopRailTool(null);
      return;
    }

    setDesktopRailTool(
      selectedKind === "group" ? "layers" : isCanvasCardLayerId(layerId) ? "shape" : "content",
    );
  }

  function handleLayerSelectionChange(
    boardId: string,
    layerIds: string[],
    options?: { additive?: boolean },
  ) {
    if (boardId !== activeQrNodeId) {
      handleBoardSelection(boardId);
    }

    const next = options?.additive
      ? Array.from(new Set([...selectedLayerIds, ...layerIds]))
      : layerIds;

    applyLayerSelection(next);
  }

  function getActiveSelectableLayers() {
    const {
      activeQrNodeId: currentActiveQrNodeId,
      canvasQraftyState: currentCanvasQraftyState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
    } = keyboardStateRef.current;
    const layers =
      currentLayerStateByNodeId[currentActiveQrNodeId] ??
      createDefaultCanvasLayers(
        currentActiveQrNodeId,
        currentCanvasQraftyState,
        currentSelectedCardState,
      );

    return layers.filter((layer) => layer.isVisible);
  }

  function getSelectedActiveLayers() {
    const {
      activeQrNodeId: currentActiveQrNodeId,
      canvasQraftyState: currentCanvasQraftyState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
      selectedLayerIds: currentSelectedLayerIds,
    } = keyboardStateRef.current;
    const selectedLayerIdSet = new Set(currentSelectedLayerIds);
    const layers =
      currentLayerStateByNodeId[currentActiveQrNodeId] ??
      createDefaultCanvasLayers(
        currentActiveQrNodeId,
        currentCanvasQraftyState,
        currentSelectedCardState,
      );

    return layers.filter((layer) => selectedLayerIdSet.has(layer.id));
  }

  function selectAllActiveCanvasLayers() {
    const layerIds = getActiveSelectableLayers().map((layer) => layer.id);

    applyLayerSelection(layerIds);
  }

  function clearCanvasLayerSelection() {
    applyLayerSelection([]);
  }

  function deleteSelectedLayersOrBoard() {
    const {
      activeQrNodeId: currentActiveQrNodeId,
      canvasQraftyState: currentCanvasQraftyState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
      selectedLayerIds: currentSelectedLayerIds,
    } = keyboardStateRef.current;
    const layers =
      currentLayerStateByNodeId[currentActiveQrNodeId] ??
      createDefaultCanvasLayers(
        currentActiveQrNodeId,
        currentCanvasQraftyState,
        currentSelectedCardState,
      );
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
    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[currentActiveQrNodeId] ??
        createDefaultCanvasLayers(
          currentActiveQrNodeId,
          currentCanvasQraftyState,
          currentSelectedCardState,
        );

      return {
        ...current,
        [currentActiveQrNodeId]: currentLayers.flatMap((layer) =>
          removableLayerIdSet.has(layer.id) ? [] : [cloneCanvasLayer(layer)],
        ),
      };
    });

    const nextSelection = currentSelectedLayerIds.filter(
      (layerId) => !removableLayerIdSet.has(layerId),
    );
    const fallbackLayerId =
      getQrCanvasLayers(layers.filter((layer) => !removableLayerIdSet.has(layer.id))).at(-1)?.id ??
      getCanvasQrLayerId(currentActiveQrNodeId);

    if (removableLayerIdSet.has(activeQrLayerId)) {
      const fallbackState =
        qrStateByLayerId[fallbackLayerId] ?? createDefaultCanvasWorkspaceQrState();
      setActiveQrLayerId(fallbackLayerId);
      qrControls.applyQrState(fallbackState);
      setSelectedContentType(contentTypeByLayerId[fallbackLayerId] ?? DEFAULT_QR_INPUT_TYPE);
    }

    applyLayerSelection(nextSelection.length > 0 ? nextSelection : [fallbackLayerId]);
  }

  function handleLayerChange(boardId: string, layerId: string, patch: Partial<CanvasLayer>) {
    const layers =
      layerStateByNodeId[boardId] ??
      createDefaultCanvasLayers(boardId, canvasQraftyState, selectedCardState);

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

    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[boardId] ??
        createDefaultCanvasLayers(boardId, canvasQraftyState, selectedCardState);

      return {
        ...current,
        [boardId]: currentLayers.map((layer) => patchCanvasLayerById(layer, layerId, patch)),
      };
    });
  }

  function handleLayerReorder(orderedIds: string[]) {
    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[activeQrNodeId] ??
        createDefaultCanvasLayers(activeQrNodeId, canvasQraftyState, selectedCardState);
      const layerById = new Map(currentLayers.map((layer) => [layer.id, layer]));
      const cardLayerId = currentLayers.find((layer) => layer.kind === "card")?.id;
      const orderedIdSet = new Set(orderedIds);
      const reorderableIds = orderedIds.filter(
        (layerId) => layerId !== cardLayerId && layerById.has(layerId),
      );
      const nextOrder = [
        ...reorderableIds,
        ...(cardLayerId ? [cardLayerId] : []),
        ...currentLayers.flatMap((layer) =>
          orderedIdSet.has(layer.id) || layer.id === cardLayerId ? [] : [layer.id],
        ),
      ];
      const zIndexByLayerId = new Map(
        nextOrder.map((layerId, index) => [layerId, nextOrder.length - index]),
      );

      return {
        ...current,
        [activeQrNodeId]: currentLayers.map((layer) =>
          patchCanvasLayer(layer, {
            zIndex: zIndexByLayerId.get(layer.id) ?? layer.zIndex,
          }),
        ),
      };
    });
  }

  async function copySelectedCanvasLayers(
    layerIds = selectedLayerIds,
    boardId = keyboardStateRef.current.activeQrNodeId,
  ) {
    const {
      canvasQraftyState: currentCanvasQraftyState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
    } = keyboardStateRef.current;
    const layers =
      currentLayerStateByNodeId[boardId] ??
      createDefaultCanvasLayers(boardId, currentCanvasQraftyState, currentSelectedCardState);
    const payload = getCanvasLayerClipboardPayload({
      layerIds,
      layers,
      boardId,
    });

    if (!payload) {
      return;
    }

    canvasLayerClipboardRef.current = payload;
    await navigator.clipboard?.writeText(payload).catch(() => undefined);
  }

  async function pasteCanvasLayers(
    point?: { x: number; y: number },
    payloadText?: string,
    boardId = keyboardStateRef.current.activeQrNodeId,
  ) {
    const rawPayload =
      payloadText ??
      (await navigator.clipboard?.readText().catch(() => canvasLayerClipboardRef.current)) ??
      canvasLayerClipboardRef.current;
    const payload = parseCanvasLayerClipboardPayload(rawPayload);

    if (!payload) {
      return;
    }

    const {
      canvasQraftyState: currentCanvasQraftyState,
      selectedCardState: currentSelectedCardState,
    } = keyboardStateRef.current;
    const layers =
      layerStateByNodeId[boardId] ??
      createDefaultCanvasLayers(boardId, currentCanvasQraftyState, currentSelectedCardState);
    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1);
    const offset = point
      ? {
          x: point.x - payload.bounds.x,
          y: point.y - payload.bounds.y,
        }
      : { x: DRAFTING_LAYER_PASTE_OFFSET, y: DRAFTING_LAYER_PASTE_OFFSET };
    const pastedLayers = cloneCanvasLayersForPaste({
      layers: payload.layers,
      nodeId: boardId,
      offset,
      startingZIndex: maxZIndex + 1,
    });

    applyLayerSelection(pastedLayers.map((layer) => layer.id));

    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[boardId] ??
        createDefaultCanvasLayers(boardId, currentCanvasQraftyState, currentSelectedCardState);

      return {
        ...current,
        [boardId]: [...currentLayers.map(cloneCanvasLayer), ...pastedLayers],
      };
    });
  }

  function handleLayerAction(boardId: string, layerIds: string[], action: CanvasLayerMenuAction) {
    if (layerIds.length === 0) {
      return;
    }

    const currentLayers =
      layerStateByNodeId[boardId] ??
      createDefaultCanvasLayers(boardId, canvasQraftyState, selectedCardState);

    if (action === "delete") {
      const removableLayerIds = new Set(
        layerIds.filter((layerId) => isLayerDeletable(layerId, currentLayers)),
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

    setLayerStateByNodeId((current) => {
      const layers =
        current[boardId] ??
        createDefaultCanvasLayers(boardId, canvasQraftyState, selectedCardState);
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

      let nextLayers = layers;

      if (reorderActions.includes(action as CanvasLayerReorderAction)) {
        for (const layerId of layerIds.filter((id) => !isProtectedCanvasLayerId(id, layers))) {
          nextLayers = reorderCanvasLayer(nextLayers, layerId, action as CanvasLayerReorderAction);
        }
      } else if (alignActions.includes(action as CanvasLayerAlignAction)) {
        nextLayers = alignCanvasLayers(nextLayers, layerIds, action as CanvasLayerAlignAction);
      } else if (action === "group") {
        nextLayers = groupCanvasLayers(nextLayers, layerIds, {
          groupId: `${boardId}:group:${Date.now()}`,
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
          layerIds.filter((layerId) => isLayerDeletable(layerId, layers)),
        );

        if (removableLayerIds.size > 0) {
          nextLayers = nextLayers.flatMap((layer) =>
            removableLayerIds.has(layer.id) ? [] : [cloneCanvasLayer(layer)],
          );
        }
      } else if (action === "reset-rotation") {
        const actionableLayerIdSet = new Set(
          layerIds.filter((layerId) => !isProtectedCanvasLayerId(layerId, layers)),
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

      return {
        ...current,
        [boardId]: nextLayers,
      };
    });
  }
  return {
    applyLayerSelection,
    clearCanvasLayerSelection,
    copySelectedCanvasLayers,
    deleteSelectedLayersOrBoard,
    duplicateSelectedLayers,
    getActiveSelectableLayers,
    getSelectedActiveLayers,
    handleAddFrameCardLayer,
    handleAddTextLayer,
    handleAddTextLayerAt,
    handleInsertLayer,
    handleLayerAction,
    handleLayerChange,
    handleLayerReorder,
    handleLayerSelect,
    handleLayerSelectionChange,
    handleBoardQrClick,
    handleBoardSelection,
    handleRemoveQrCode,
    pasteCanvasLayers,
    selectAllActiveCanvasLayers,
    selectSingleLayer,
  };
}
