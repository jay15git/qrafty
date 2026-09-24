"use client";

import type { MutableRefObject } from "react";

import type { CanvasLayerMenuAction } from "@/features/canvas/components/Artboard";
import { DRAFTING_LAYER_PASTE_OFFSET } from "@/features/canvas/components/canvas.constants";
import {
  findDraftingLayerById,
  getDraftingLayerClipboardPayload,
  parseDraftingLayerClipboardPayload,
  patchDraftingLayerById,
} from "@/features/canvas/components/canvas-operations";
import type {
  CanvasSurfaceSetters,
  CanvasSurfaceState,
} from "@/features/canvas/components/canvas-reducer";
import { createQrControls } from "@/features/canvas/canvas/qr-controls";
import type { CanvasShortcutKeyboardState } from "@/features/canvas/canvas/use-canvas-shortcuts";
import {
  getDraftingCardLayerId,
  getDraftingQrLayerId,
  getQrCanvasLayers,
  isDraftingCardLayerId,
  isDraftingQrLayerId,
  isLayerDeletable,
  isProtectedDraftingLayerId,
  type CanvasLayer,
  type DraftingLayerAlignAction,
  type DraftingLayerDistributeAction,
  type DraftingLayerReorderAction,
} from "@/features/canvas/model/layers/shared";
import { cloneCanvasLayer } from "@/features/canvas/model/layers/fallback";
import { patchCanvasLayer } from "@/features/canvas/model/layers/patch";
import {
  clampLayerGeometryToCanvas,
  createDefaultDraftingLayers,
} from "@/features/canvas/model/layers/card-qr";
import { createDraftingTextLayer } from "@/features/canvas/model/layers/factories";
import {
  alignCanvasLayers,
  cloneCanvasLayersForPaste,
  distributeCanvasLayers,
  reorderCanvasLayer,
} from "@/features/canvas/model/layers/operations";
import { groupCanvasLayers, ungroupCanvasLayer } from "@/features/canvas/model/layers/group";
import {
  cloneDraftingQrState,
  createDefaultDraftingWorkspaceQrState,
  type DraftingQrStateByNodeId,
} from "@/features/canvas/model/document";
import {
  cloneDraftingCardState,
  createDefaultDraftingCardState,
  type DraftingCardState,
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
  draftingLayerClipboardRef,
  draftingQraftyState,
  draftingCanvasRef,
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
    draftingLayerClipboardRef: MutableRefObject<string>;
    draftingQraftyState: QraftyState;
    activateQrLayer: (layerId: string) => void;
    draftingCanvasRef: MutableRefObject<HTMLElement | null>;
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
    draftingCanvasRef.current?.focus({ preventScroll: true });
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
      createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState);
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
            ? draftingQraftyState
            : (qrStateByLayerId[layer.id] ?? draftingQraftyState);
        nextQrStateByLayerId[duplicatedLayer.id] = cloneDraftingQrState(sourceState);
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
      draftingQraftyState;

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
    draftingCanvasRef.current?.focus({ preventScroll: true });
  }

  function handleRemoveQrCode(layerId: string) {
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState);

    if (!isLayerDeletable(layerId, layers)) {
      return;
    }

    const fallbackLayerId =
      getQrCanvasLayers(layers).find((layer) => layer.id !== layerId)?.id ??
      getDraftingQrLayerId(activeQrNodeId);

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
        qrStateByLayerId[fallbackLayerId] ?? createDefaultDraftingWorkspaceQrState();
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
      createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState);
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
    draftingCanvasRef.current?.focus({ preventScroll: true });
  }

  function handleAddTextLayer() {
    handleInsertLayer(createDraftingTextLayer(activeQrNodeId));
  }

  function handleAddTextLayerAt(boardId: string, point: { x: number; y: number }) {
    const targetQrState =
      boardId === activeQrNodeId
        ? draftingQraftyState
        : (qrStateByNodeId[boardId] ?? createDefaultDraftingWorkspaceQrState());
    const targetCardState =
      boardId === activeQrNodeId
        ? selectedCardState
        : (cardStateByNodeId[boardId] ?? createDefaultDraftingCardState());
    const layers =
      layerStateByNodeId[boardId] ??
      createDefaultDraftingLayers(boardId, targetQrState, targetCardState);
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
    const textLayer = createDraftingTextLayer(boardId, {
      id: `${boardId}:text:${Date.now()}`,
      x: draftPosition.x,
      y: draftPosition.y,
      zIndex: maxZIndex + 1,
    });

    if (boardId !== activeQrNodeId) {
      shouldReplaceCurrentEntryRef.current = true;
      setQrStateByNodeId((current) => ({
        ...current,
        [activeQrNodeId]: cloneDraftingQrState(draftingQraftyState),
        [boardId]: cloneDraftingQrState(targetQrState),
      }));
      setCardStateByNodeId((current) => ({
        ...current,
        [activeQrNodeId]: cloneDraftingCardState(selectedCardState),
        [boardId]: cloneDraftingCardState(targetCardState),
      }));
      setActiveQrNodeId(boardId);
      qrControls.applyQrState(targetQrState);
      setSelectedCardState(cloneDraftingCardState(targetCardState));
    }

    setLayerStateByNodeId((current) => ({
      ...current,
      [boardId]: [...layers.map(cloneCanvasLayer), textLayer],
    }));
    selectSingleLayer(textLayer.id);
    draftingCanvasRef.current?.focus({ preventScroll: true });
  }

  function handleAddFrameCardLayer() {
    const cardLayerId = getDraftingCardLayerId(activeQrNodeId);
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState);

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
    draftingCanvasRef.current?.focus({ preventScroll: true });
  }

  function handleLayerSelect(
    boardId: string,
    layerId: string | null,
    options?: { additive?: boolean; preserveActiveTool?: boolean },
  ) {
    draftingCanvasRef.current?.focus({ preventScroll: true });

    if (layerId && isDraftingQrLayerId(layerId) && !options?.additive) {
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

    const selectedLayer = findDraftingLayerById(
      layerStateByNodeId[boardId] ??
        createDefaultDraftingLayers(boardId, draftingQraftyState, selectedCardState),
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
      selectedKind === "group" ? "layers" : isDraftingCardLayerId(layerId) ? "shape" : "content",
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
      draftingQraftyState: currentDraftingQraftyState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
    } = keyboardStateRef.current;
    const layers =
      currentLayerStateByNodeId[currentActiveQrNodeId] ??
      createDefaultDraftingLayers(
        currentActiveQrNodeId,
        currentDraftingQraftyState,
        currentSelectedCardState,
      );

    return layers.filter((layer) => layer.isVisible);
  }

  function getSelectedActiveLayers() {
    const {
      activeQrNodeId: currentActiveQrNodeId,
      draftingQraftyState: currentDraftingQraftyState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
      selectedLayerIds: currentSelectedLayerIds,
    } = keyboardStateRef.current;
    const selectedLayerIdSet = new Set(currentSelectedLayerIds);
    const layers =
      currentLayerStateByNodeId[currentActiveQrNodeId] ??
      createDefaultDraftingLayers(
        currentActiveQrNodeId,
        currentDraftingQraftyState,
        currentSelectedCardState,
      );

    return layers.filter((layer) => selectedLayerIdSet.has(layer.id));
  }

  function selectAllActiveDraftingLayers() {
    const layerIds = getActiveSelectableLayers().map((layer) => layer.id);

    applyLayerSelection(layerIds);
  }

  function clearDraftingLayerSelection() {
    applyLayerSelection([]);
  }

  function deleteSelectedLayersOrBoard() {
    const {
      activeQrNodeId: currentActiveQrNodeId,
      draftingQraftyState: currentDraftingQraftyState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
      selectedLayerIds: currentSelectedLayerIds,
    } = keyboardStateRef.current;
    const layers =
      currentLayerStateByNodeId[currentActiveQrNodeId] ??
      createDefaultDraftingLayers(
        currentActiveQrNodeId,
        currentDraftingQraftyState,
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
        if (isDraftingQrLayerId(layerId)) {
          delete next[layerId];
        }
      }
      return next;
    });
    setContentTypeByLayerId((current) => {
      const next = { ...current };
      for (const layerId of removableLayerIds) {
        if (isDraftingQrLayerId(layerId)) {
          delete next[layerId];
        }
      }
      return next;
    });
    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[currentActiveQrNodeId] ??
        createDefaultDraftingLayers(
          currentActiveQrNodeId,
          currentDraftingQraftyState,
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
      getDraftingQrLayerId(currentActiveQrNodeId);

    if (removableLayerIdSet.has(activeQrLayerId)) {
      const fallbackState =
        qrStateByLayerId[fallbackLayerId] ?? createDefaultDraftingWorkspaceQrState();
      setActiveQrLayerId(fallbackLayerId);
      qrControls.applyQrState(fallbackState);
      setSelectedContentType(contentTypeByLayerId[fallbackLayerId] ?? DEFAULT_QR_INPUT_TYPE);
    }

    applyLayerSelection(nextSelection.length > 0 ? nextSelection : [fallbackLayerId]);
  }

  function handleLayerChange(boardId: string, layerId: string, patch: Partial<CanvasLayer>) {
    const layers =
      layerStateByNodeId[boardId] ??
      createDefaultDraftingLayers(boardId, draftingQraftyState, selectedCardState);

    if (isProtectedDraftingLayerId(layerId, layers)) {
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
        createDefaultDraftingLayers(boardId, draftingQraftyState, selectedCardState);

      return {
        ...current,
        [boardId]: currentLayers.map((layer) => patchDraftingLayerById(layer, layerId, patch)),
      };
    });
  }

  function handleLayerReorder(orderedIds: string[]) {
    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[activeQrNodeId] ??
        createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState);
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

  async function copySelectedDraftingLayers(
    layerIds = selectedLayerIds,
    boardId = keyboardStateRef.current.activeQrNodeId,
  ) {
    const {
      draftingQraftyState: currentDraftingQraftyState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
    } = keyboardStateRef.current;
    const layers =
      currentLayerStateByNodeId[boardId] ??
      createDefaultDraftingLayers(boardId, currentDraftingQraftyState, currentSelectedCardState);
    const payload = getDraftingLayerClipboardPayload({
      layerIds,
      layers,
      boardId,
    });

    if (!payload) {
      return;
    }

    draftingLayerClipboardRef.current = payload;
    await navigator.clipboard?.writeText(payload).catch(() => undefined);
  }

  async function pasteDraftingLayers(
    point?: { x: number; y: number },
    payloadText?: string,
    boardId = keyboardStateRef.current.activeQrNodeId,
  ) {
    const rawPayload =
      payloadText ??
      (await navigator.clipboard?.readText().catch(() => draftingLayerClipboardRef.current)) ??
      draftingLayerClipboardRef.current;
    const payload = parseDraftingLayerClipboardPayload(rawPayload);

    if (!payload) {
      return;
    }

    const {
      draftingQraftyState: currentDraftingQraftyState,
      selectedCardState: currentSelectedCardState,
    } = keyboardStateRef.current;
    const layers =
      layerStateByNodeId[boardId] ??
      createDefaultDraftingLayers(boardId, currentDraftingQraftyState, currentSelectedCardState);
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
        createDefaultDraftingLayers(boardId, currentDraftingQraftyState, currentSelectedCardState);

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
      createDefaultDraftingLayers(boardId, draftingQraftyState, selectedCardState);

    if (action === "delete") {
      const removableLayerIds = new Set(
        layerIds.filter((layerId) => isLayerDeletable(layerId, currentLayers)),
      );

      if (removableLayerIds.size > 0) {
        setQrStateByLayerId((current) => {
          const next = { ...current };
          for (const layerId of removableLayerIds) {
            if (isDraftingQrLayerId(layerId)) {
              delete next[layerId];
            }
          }
          return next;
        });
        setContentTypeByLayerId((current) => {
          const next = { ...current };
          for (const layerId of removableLayerIds) {
            if (isDraftingQrLayerId(layerId)) {
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
        createDefaultDraftingLayers(boardId, draftingQraftyState, selectedCardState);
      const reorderActions: DraftingLayerReorderAction[] = ["back", "backward", "forward", "front"];
      const alignActions: DraftingLayerAlignAction[] = [
        "bottom",
        "center-x",
        "center-y",
        "left",
        "right",
        "top",
      ];
      const distributeActions: DraftingLayerDistributeAction[] = ["horizontal", "vertical"];

      let nextLayers = layers;

      if (reorderActions.includes(action as DraftingLayerReorderAction)) {
        for (const layerId of layerIds.filter((id) => !isProtectedDraftingLayerId(id, layers))) {
          nextLayers = reorderCanvasLayer(
            nextLayers,
            layerId,
            action as DraftingLayerReorderAction,
          );
        }
      } else if (alignActions.includes(action as DraftingLayerAlignAction)) {
        nextLayers = alignCanvasLayers(nextLayers, layerIds, action as DraftingLayerAlignAction);
      } else if (action === "group") {
        nextLayers = groupCanvasLayers(nextLayers, layerIds, {
          groupId: `${boardId}:group:${Date.now()}`,
          name: "Group",
        });
      } else if (action === "ungroup") {
        for (const layerId of layerIds) {
          nextLayers = ungroupCanvasLayer(nextLayers, layerId);
        }
      } else if (distributeActions.includes(action as DraftingLayerDistributeAction)) {
        nextLayers = distributeCanvasLayers(
          nextLayers,
          layerIds,
          action as DraftingLayerDistributeAction,
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
          layerIds.filter((layerId) => !isProtectedDraftingLayerId(layerId, layers)),
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
    clearDraftingLayerSelection,
    copySelectedDraftingLayers,
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
    pasteDraftingLayers,
    selectAllActiveDraftingLayers,
    selectSingleLayer,
  };
}
