"use client"

import type { MutableRefObject } from "react"

import type { DraftingLayerMenuAction } from "@/features/canvas/components/Pane"
import {
  DRAFTING_LAYER_PASTE_OFFSET,
} from "@/features/canvas/components/workspace-surface.constants"
import {
  findDraftingLayerById,
  getDraftingLayerClipboardPayload,
  parseDraftingLayerClipboardPayload,
  patchDraftingLayerById,
} from "@/features/canvas/components/workspace-surface-helpers"
import type {
  WorkspaceSurfaceSetters,
  WorkspaceSurfaceState,
} from "@/features/canvas/components/workspace-surface-reducer"
import { createQrControls } from "@/features/canvas/canvas/qr-controls"
import type { DraftingShortcutKeyboardState } from "@/features/canvas/canvas/use-drafting-shortcuts"
import {
  alignDraftingCanvasLayers,
  clampLayerGeometryToCanvas,
  cloneDraftingCanvasLayer,
  cloneDraftingCanvasLayersForPaste,
  createDefaultDraftingLayers,
  createDraftingTextLayer,
  distributeDraftingCanvasLayers,
  getDraftingCardLayerId,
  getDraftingQrLayerId,
  getQrCanvasLayers,
  groupDraftingCanvasLayers,
  isDraftingCardLayerId,
  isDraftingQrLayerId,
  isLayerDeletable,
  isProtectedDraftingLayerId,
  patchDraftingCanvasLayer,
  reorderDraftingCanvasLayer,
  ungroupDraftingCanvasLayer,
  type DraftingCanvasLayer,
  type DraftingLayerAlignAction,
  type DraftingLayerDistributeAction,
  type DraftingLayerReorderAction,
} from "@/features/canvas/model/layers"
import {
  cloneDraftingQrState,
  createDefaultDraftingWorkspaceQrState,
  type DraftingQrStateByNodeId,
} from "@/features/canvas/model/document"
import {
  cloneDraftingCardState,
  createDefaultDraftingCardState,
  type DraftingCardState,
} from "@/features/canvas/model/card-state"
import { DEFAULT_QR_INPUT_TYPE, type QrInputType } from "@/features/qr/content/input-options"
import type { QraftyState } from "@/features/qr/model/state"

type LayerActionState = Pick<
  WorkspaceSurfaceState,
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
>

type LayerActionSetters = Pick<
  WorkspaceSurfaceSetters,
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
>

export function useLayerActions({
  activateQrLayer,
  activeQrLayerId,
  activeQrNodeId,
  cardStateByNodeId,
  contentTypeByLayerId,
  draftingLayerClipboardRef,
  draftingQraftyState,
  draftingSurfaceRef,
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
    draftingLayerClipboardRef: MutableRefObject<string>
    draftingQraftyState: QraftyState
    activateQrLayer: (layerId: string) => void
    draftingSurfaceRef: MutableRefObject<HTMLElement | null>
    shouldReplaceCurrentEntryRef: MutableRefObject<boolean>
    keyboardStateRef: MutableRefObject<DraftingShortcutKeyboardState>
    persistActiveQrLayerState: (nextState?: QraftyState) => void
    qrControls: ReturnType<typeof createQrControls>
  }) {

  function selectSingleLayer(layerId: string | null) {
    setSelectedLayerId(layerId)
    setSelectedLayerIds(layerId ? [layerId] : [])
  }

  function applyLayerSelection(nextLayerIds: string[]) {
    setSelectedLayerIds(nextLayerIds)
    setSelectedLayerId(nextLayerIds.at(-1) ?? null)
  }

  function handlePaneSelection(_paneId: string) {
    draftingSurfaceRef.current?.focus({ preventScroll: true })
  }

  function handlePaneQrClick(paneId: string) {
    if (paneId !== activeQrNodeId) {
      handlePaneSelection(paneId)
    }
  }

  function duplicateSelectedLayers(layerIds = selectedLayerIds) {
    if (layerIds.length === 0) {
      return
    }

    persistActiveQrLayerState()

    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState)
    const selectedIdSet = new Set(layerIds)
    const selectedLayers = layers.filter((layer) => selectedIdSet.has(layer.id))

    if (selectedLayers.length === 0) {
      return
    }

    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1)
    const duplicatedLayers: DraftingCanvasLayer[] = []
    const nextQrStateByLayerId: Record<string, QraftyState> = {}
    const nextContentTypeByLayerId: Record<string, QrInputType> = {}

    selectedLayers.forEach((layer, index) => {
      const duplicatedLayer = patchDraftingCanvasLayer(
        {
          ...cloneDraftingCanvasLayer(layer),
          id: `${activeQrNodeId}:${layer.kind}:${Date.now()}-${index}`,
          x: layer.x + DRAFTING_LAYER_PASTE_OFFSET,
          y: layer.y + DRAFTING_LAYER_PASTE_OFFSET,
          zIndex: maxZIndex + index + 1,
        },
        {},
      )
      duplicatedLayers.push(duplicatedLayer)

      if (layer.kind === "qr") {
        const sourceState =
          layer.id === activeQrLayerId
            ? draftingQraftyState
            : (qrStateByLayerId[layer.id] ?? draftingQraftyState)
        nextQrStateByLayerId[duplicatedLayer.id] = cloneDraftingQrState(sourceState)
        nextContentTypeByLayerId[duplicatedLayer.id] =
          contentTypeByLayerId[layer.id] ?? selectedContentType
      }
    })

    if (Object.keys(nextQrStateByLayerId).length > 0) {
      setQrStateByLayerId((current) => ({
        ...current,
        ...nextQrStateByLayerId,
      }))
      setContentTypeByLayerId((current) => ({
        ...current,
        ...nextContentTypeByLayerId,
      }))
    }

    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: [
        ...(current[activeQrNodeId] ?? layers).map(cloneDraftingCanvasLayer),
        ...duplicatedLayers,
      ],
    }))

    const nextActiveLayerId = duplicatedLayers.at(-1)?.id ?? activeQrLayerId
    const nextActiveState =
      nextQrStateByLayerId[nextActiveLayerId] ??
      qrStateByLayerId[nextActiveLayerId] ??
      draftingQraftyState

    if (nextActiveLayerId !== activeQrLayerId) {
      setActiveQrLayerId(nextActiveLayerId)
      qrControls.applyQrState(nextActiveState)
      setSelectedContentType(
        nextContentTypeByLayerId[nextActiveLayerId] ??
          contentTypeByLayerId[nextActiveLayerId] ??
          selectedContentType,
      )
    }

    applyLayerSelection(duplicatedLayers.map((layer) => layer.id))
    draftingSurfaceRef.current?.focus({ preventScroll: true })
  }

  function handleRemoveQrCode(layerId: string) {
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState)

    if (!isLayerDeletable(layerId, layers)) {
      return
    }

    const fallbackLayerId =
      getQrCanvasLayers(layers).find((layer) => layer.id !== layerId)?.id ??
      getDraftingQrLayerId(activeQrNodeId)

    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: (current[activeQrNodeId] ?? layers).filter(
        (layer) => layer.id !== layerId,
      ),
    }))
    setQrStateByLayerId((current) => {
      const next = { ...current }
      delete next[layerId]
      return next
    })
    setContentTypeByLayerId((current) => {
      const next = { ...current }
      delete next[layerId]
      return next
    })

    if (layerId === activeQrLayerId) {
      const fallbackState =
        qrStateByLayerId[fallbackLayerId] ?? createDefaultDraftingWorkspaceQrState()
      setActiveQrLayerId(fallbackLayerId)
      qrControls.applyQrState(fallbackState)
      setSelectedContentType(contentTypeByLayerId[fallbackLayerId] ?? DEFAULT_QR_INPUT_TYPE)
      selectSingleLayer(fallbackLayerId)
      return
    }

    selectSingleLayer(fallbackLayerId)
  }

  function handleInsertLayer(layer: DraftingCanvasLayer) {
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState)
    const maxZIndex = layers.reduce((max, currentLayer) => Math.max(max, currentLayer.zIndex), -1)
    const nextLayer = patchDraftingCanvasLayer(
      {
        ...cloneDraftingCanvasLayer(layer),
        id: `${activeQrNodeId}:${layer.kind}:${Date.now()}`,
        nodeId: activeQrNodeId,
        zIndex: maxZIndex + 1,
      },
      {},
    )

    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: [...layers.map(cloneDraftingCanvasLayer), nextLayer],
    }))
    selectSingleLayer(nextLayer.id)
    draftingSurfaceRef.current?.focus({ preventScroll: true })
  }

  function handleAddTextLayer() {
    handleInsertLayer(createDraftingTextLayer(activeQrNodeId))
  }

  function handleAddTextLayerAt(paneId: string, point: { x: number; y: number }) {
    const targetQrState =
      paneId === activeQrNodeId
        ? draftingQraftyState
        : (qrStateByNodeId[paneId] ?? createDefaultDraftingWorkspaceQrState())
    const targetCardState =
      paneId === activeQrNodeId
        ? selectedCardState
        : (cardStateByNodeId[paneId] ?? createDefaultDraftingCardState())
    const layers =
      layerStateByNodeId[paneId] ??
      createDefaultDraftingLayers(paneId, targetQrState, targetCardState)
    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1)
    const draftPosition = clampLayerGeometryToCanvas(
      {
        height: 48,
        width: 240,
        x: Math.round(point.x - 120),
        y: Math.round(point.y - 24),
      },
      targetCardState,
    )
    const textLayer = createDraftingTextLayer(paneId, {
      id: `${paneId}:text:${Date.now()}`,
      x: draftPosition.x,
      y: draftPosition.y,
      zIndex: maxZIndex + 1,
    })

    if (paneId !== activeQrNodeId) {
      shouldReplaceCurrentEntryRef.current = true
      setQrStateByNodeId((current) => ({
        ...current,
        [activeQrNodeId]: cloneDraftingQrState(draftingQraftyState),
        [paneId]: cloneDraftingQrState(targetQrState),
      }))
      setCardStateByNodeId((current) => ({
        ...current,
        [activeQrNodeId]: cloneDraftingCardState(selectedCardState),
        [paneId]: cloneDraftingCardState(targetCardState),
      }))
      setActiveQrNodeId(paneId)
      qrControls.applyQrState(targetQrState)
      setSelectedCardState(cloneDraftingCardState(targetCardState))
    }

    setLayerStateByNodeId((current) => ({
      ...current,
      [paneId]: [...layers.map(cloneDraftingCanvasLayer), textLayer],
    }))
    selectSingleLayer(textLayer.id)
    draftingSurfaceRef.current?.focus({ preventScroll: true })
  }

  function handleAddFrameCardLayer() {
    const cardLayerId = getDraftingCardLayerId(activeQrNodeId)
    const layers =
      layerStateByNodeId[activeQrNodeId] ??
      createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState)

    setSelectedCardState((current) => ({
      ...current,
      enabled: true,
    }))
    setLayerStateByNodeId((current) => ({
      ...current,
      [activeQrNodeId]: layers.map((layer) =>
        layer.id === cardLayerId
          ? patchDraftingCanvasLayer(layer, {
              isVisible: true,
              shadow: selectedCardState.shadow,
            })
          : cloneDraftingCanvasLayer(layer),
      ),
    }))
    selectSingleLayer(cardLayerId)
    setDesktopRailTool("shape")
    draftingSurfaceRef.current?.focus({ preventScroll: true })
  }

  function handleLayerSelect(
    paneId: string,
    layerId: string | null,
    options?: { additive?: boolean; preserveActiveTool?: boolean },
  ) {
    draftingSurfaceRef.current?.focus({ preventScroll: true })

    if (layerId && isDraftingQrLayerId(layerId) && !options?.additive) {
      activateQrLayer(layerId)
    }

    if (options?.additive && paneId === activeQrNodeId && layerId !== null) {
      const next = selectedLayerIds.includes(layerId)
        ? selectedLayerIds.filter((id) => id !== layerId)
        : [...selectedLayerIds, layerId]

      applyLayerSelection(next)
    } else {
      selectSingleLayer(layerId)
    }

    if (layerId === null) {
      setDesktopRailTool("content")
      return
    }

    if (options?.preserveActiveTool) {
      return
    }

    const selectedLayer = findDraftingLayerById(
      layerStateByNodeId[paneId] ??
        createDefaultDraftingLayers(paneId, draftingQraftyState, selectedCardState),
      layerId,
    )
    const selectedKind = selectedLayer?.kind

    if (
      selectedKind === "text" ||
      selectedKind === "image" ||
      selectedKind === "shape" ||
      selectedKind === "shader"
    ) {
      setDesktopRailTool(null)
      return
    }

    setDesktopRailTool(
      selectedKind === "group"
        ? "layers"
        : isDraftingCardLayerId(layerId)
          ? "shape"
          : "content",
    )
  }

  function handleLayerSelectionChange(
    paneId: string,
    layerIds: string[],
    options?: { additive?: boolean },
  ) {
    if (paneId !== activeQrNodeId) {
      handlePaneSelection(paneId)
    }

    const next = options?.additive
      ? Array.from(new Set([...selectedLayerIds, ...layerIds]))
      : layerIds

    applyLayerSelection(next)
  }

  function getActiveSelectableLayers() {
    const {
      activeQrNodeId: currentActiveQrNodeId,
      draftingQraftyState: currentDraftingQraftyState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
    } = keyboardStateRef.current
    const layers =
      currentLayerStateByNodeId[currentActiveQrNodeId] ??
      createDefaultDraftingLayers(
        currentActiveQrNodeId,
        currentDraftingQraftyState,
        currentSelectedCardState,
      )

    return layers.filter((layer) => layer.isVisible)
  }

  function getSelectedActiveLayers() {
    const {
      activeQrNodeId: currentActiveQrNodeId,
      draftingQraftyState: currentDraftingQraftyState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
      selectedLayerIds: currentSelectedLayerIds,
    } = keyboardStateRef.current
    const selectedLayerIdSet = new Set(currentSelectedLayerIds)
    const layers =
      currentLayerStateByNodeId[currentActiveQrNodeId] ??
      createDefaultDraftingLayers(
        currentActiveQrNodeId,
        currentDraftingQraftyState,
        currentSelectedCardState,
      )

    return layers.filter((layer) => selectedLayerIdSet.has(layer.id))
  }

  function selectAllActiveDraftingLayers() {
    const layerIds = getActiveSelectableLayers().map((layer) => layer.id)

    applyLayerSelection(layerIds)
  }

  function clearDraftingLayerSelection() {
    applyLayerSelection([])
  }

  function deleteSelectedLayersOrPane() {
    const {
      activeQrNodeId: currentActiveQrNodeId,
      draftingQraftyState: currentDraftingQraftyState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
      selectedLayerIds: currentSelectedLayerIds,
    } = keyboardStateRef.current
    const layers =
      currentLayerStateByNodeId[currentActiveQrNodeId] ??
      createDefaultDraftingLayers(
        currentActiveQrNodeId,
        currentDraftingQraftyState,
        currentSelectedCardState,
      )
    const selectedLayerIdSet = new Set(currentSelectedLayerIds)
    const removableLayerIds = layers.flatMap((layer) =>
      selectedLayerIdSet.has(layer.id) && isLayerDeletable(layer.id, layers) ? [layer.id] : [],
    )

    if (removableLayerIds.length === 0) {
      return
    }

    const removableLayerIdSet = new Set(removableLayerIds)

    setQrStateByLayerId((current) => {
      const next = { ...current }
      for (const layerId of removableLayerIds) {
        if (isDraftingQrLayerId(layerId)) {
          delete next[layerId]
        }
      }
      return next
    })
    setContentTypeByLayerId((current) => {
      const next = { ...current }
      for (const layerId of removableLayerIds) {
        if (isDraftingQrLayerId(layerId)) {
          delete next[layerId]
        }
      }
      return next
    })
    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[currentActiveQrNodeId] ??
        createDefaultDraftingLayers(
          currentActiveQrNodeId,
          currentDraftingQraftyState,
          currentSelectedCardState,
        )

      return {
        ...current,
        [currentActiveQrNodeId]: currentLayers.flatMap((layer) =>
          removableLayerIdSet.has(layer.id) ? [] : [cloneDraftingCanvasLayer(layer)],
        ),
      }
    })

    const nextSelection = currentSelectedLayerIds.filter(
      (layerId) => !removableLayerIdSet.has(layerId),
    )
    const fallbackLayerId =
      getQrCanvasLayers(
        layers.filter((layer) => !removableLayerIdSet.has(layer.id)),
      ).at(-1)?.id ?? getDraftingQrLayerId(currentActiveQrNodeId)

    if (removableLayerIdSet.has(activeQrLayerId)) {
      const fallbackState =
        qrStateByLayerId[fallbackLayerId] ?? createDefaultDraftingWorkspaceQrState()
      setActiveQrLayerId(fallbackLayerId)
      qrControls.applyQrState(fallbackState)
      setSelectedContentType(contentTypeByLayerId[fallbackLayerId] ?? DEFAULT_QR_INPUT_TYPE)
    }

    applyLayerSelection(
      nextSelection.length > 0 ? nextSelection : [fallbackLayerId],
    )
  }

  function handleLayerChange(
    paneId: string,
    layerId: string,
    patch: Partial<DraftingCanvasLayer>,
  ) {
    const layers =
      layerStateByNodeId[paneId] ??
      createDefaultDraftingLayers(paneId, draftingQraftyState, selectedCardState)

    if (isProtectedDraftingLayerId(layerId, layers)) {
      const { isVisible: _isVisible, ...safePatch } = patch
      if (Object.keys(safePatch).length === 0) {
        return
      }
      patch = safePatch
    } else {
      const { isVisible: _isVisible, ...patchWithoutVisibility } = patch
      patch = patchWithoutVisibility
    }

    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[paneId] ??
        createDefaultDraftingLayers(paneId, draftingQraftyState, selectedCardState)

      return {
        ...current,
        [paneId]: currentLayers.map((layer) => patchDraftingLayerById(layer, layerId, patch)),
      }
    })
  }

  function handleLayerReorder(orderedIds: string[]) {
    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[activeQrNodeId] ??
        createDefaultDraftingLayers(activeQrNodeId, draftingQraftyState, selectedCardState)
      const layerById = new Map(currentLayers.map((layer) => [layer.id, layer]))
      const cardLayerId = currentLayers.find((layer) => layer.kind === "card")?.id
      const orderedIdSet = new Set(orderedIds)
      const reorderableIds = orderedIds.filter(
        (layerId) => layerId !== cardLayerId && layerById.has(layerId),
      )
      const nextOrder = [
        ...reorderableIds,
        ...(cardLayerId ? [cardLayerId] : []),
        ...currentLayers.flatMap((layer) =>
          orderedIdSet.has(layer.id) || layer.id === cardLayerId ? [] : [layer.id],
        ),
      ]
      const zIndexByLayerId = new Map(
        nextOrder.map((layerId, index) => [layerId, nextOrder.length - index]),
      )

      return {
        ...current,
        [activeQrNodeId]: currentLayers.map((layer) =>
          patchDraftingCanvasLayer(layer, {
            zIndex: zIndexByLayerId.get(layer.id) ?? layer.zIndex,
          }),
        ),
      }
    })
  }

  async function copySelectedDraftingLayers(
    layerIds = selectedLayerIds,
    paneId = keyboardStateRef.current.activeQrNodeId,
  ) {
    const {
      draftingQraftyState: currentDraftingQraftyState,
      layerStateByNodeId: currentLayerStateByNodeId,
      selectedCardState: currentSelectedCardState,
    } = keyboardStateRef.current
    const layers =
      currentLayerStateByNodeId[paneId] ??
      createDefaultDraftingLayers(paneId, currentDraftingQraftyState, currentSelectedCardState)
    const payload = getDraftingLayerClipboardPayload({
      layerIds,
      layers,
      paneId,
    })

    if (!payload) {
      return
    }

    draftingLayerClipboardRef.current = payload
    await navigator.clipboard?.writeText(payload).catch(() => undefined)
  }

  async function pasteDraftingLayers(
    point?: { x: number; y: number },
    payloadText?: string,
    paneId = keyboardStateRef.current.activeQrNodeId,
  ) {
    const rawPayload =
      payloadText ??
      (await navigator.clipboard?.readText().catch(() => draftingLayerClipboardRef.current)) ??
      draftingLayerClipboardRef.current
    const payload = parseDraftingLayerClipboardPayload(rawPayload)

    if (!payload) {
      return
    }

    const {
      draftingQraftyState: currentDraftingQraftyState,
      selectedCardState: currentSelectedCardState,
    } = keyboardStateRef.current
    const layers =
      layerStateByNodeId[paneId] ??
      createDefaultDraftingLayers(paneId, currentDraftingQraftyState, currentSelectedCardState)
    const maxZIndex = layers.reduce((max, layer) => Math.max(max, layer.zIndex), -1)
    const offset = point
      ? {
          x: point.x - payload.bounds.x,
          y: point.y - payload.bounds.y,
        }
      : { x: DRAFTING_LAYER_PASTE_OFFSET, y: DRAFTING_LAYER_PASTE_OFFSET }
    const pastedLayers = cloneDraftingCanvasLayersForPaste({
      layers: payload.layers,
      nodeId: paneId,
      offset,
      startingZIndex: maxZIndex + 1,
    })

    applyLayerSelection(pastedLayers.map((layer) => layer.id))

    setLayerStateByNodeId((current) => {
      const currentLayers =
        current[paneId] ??
        createDefaultDraftingLayers(paneId, currentDraftingQraftyState, currentSelectedCardState)

      return {
        ...current,
        [paneId]: [...currentLayers.map(cloneDraftingCanvasLayer), ...pastedLayers],
      }
    })
  }

  function handleLayerAction(
    paneId: string,
    layerIds: string[],
    action: DraftingLayerMenuAction,
  ) {
    if (layerIds.length === 0) {
      return
    }

    const currentLayers =
      layerStateByNodeId[paneId] ??
      createDefaultDraftingLayers(paneId, draftingQraftyState, selectedCardState)

    if (action === "delete") {
      const removableLayerIds = new Set(
        layerIds.filter((layerId) => isLayerDeletable(layerId, currentLayers)),
      )

      if (removableLayerIds.size > 0) {
        setQrStateByLayerId((current) => {
          const next = { ...current }
          for (const layerId of removableLayerIds) {
            if (isDraftingQrLayerId(layerId)) {
              delete next[layerId]
            }
          }
          return next
        })
        setContentTypeByLayerId((current) => {
          const next = { ...current }
          for (const layerId of removableLayerIds) {
            if (isDraftingQrLayerId(layerId)) {
              delete next[layerId]
            }
          }
          return next
        })
        applyLayerSelection(
          selectedLayerIds.filter((layerId) => !removableLayerIds.has(layerId)),
        )
      }
    }

    setLayerStateByNodeId((current) => {
      const layers =
        current[paneId] ??
        createDefaultDraftingLayers(paneId, draftingQraftyState, selectedCardState)
      const reorderActions: DraftingLayerReorderAction[] = [
        "back",
        "backward",
        "forward",
        "front",
      ]
      const alignActions: DraftingLayerAlignAction[] = [
        "bottom",
        "center-x",
        "center-y",
        "left",
        "right",
        "top",
      ]
      const distributeActions: DraftingLayerDistributeAction[] = [
        "horizontal",
        "vertical",
      ]

      let nextLayers = layers

      if (reorderActions.includes(action as DraftingLayerReorderAction)) {
        for (const layerId of layerIds.filter(
          (id) => !isProtectedDraftingLayerId(id, layers),
        )) {
          nextLayers = reorderDraftingCanvasLayer(
            nextLayers,
            layerId,
            action as DraftingLayerReorderAction,
          )
        }
      } else if (alignActions.includes(action as DraftingLayerAlignAction)) {
        nextLayers = alignDraftingCanvasLayers(
          nextLayers,
          layerIds,
          action as DraftingLayerAlignAction,
        )
      } else if (action === "group") {
        nextLayers = groupDraftingCanvasLayers(nextLayers, layerIds, {
          groupId: `${paneId}:group:${Date.now()}`,
          name: "Group",
        })
      } else if (action === "ungroup") {
        for (const layerId of layerIds) {
          nextLayers = ungroupDraftingCanvasLayer(nextLayers, layerId)
        }
      } else if (distributeActions.includes(action as DraftingLayerDistributeAction)) {
        nextLayers = distributeDraftingCanvasLayers(
          nextLayers,
          layerIds,
          action as DraftingLayerDistributeAction,
        )
      } else if (action === "delete") {
        const removableLayerIds = new Set(
          layerIds.filter((layerId) => isLayerDeletable(layerId, layers)),
        )

        if (removableLayerIds.size > 0) {
          nextLayers = nextLayers.flatMap((layer) =>
            removableLayerIds.has(layer.id) ? [] : [cloneDraftingCanvasLayer(layer)],
          )
        }
      } else if (action === "reset-rotation") {
        const actionableLayerIdSet = new Set(
          layerIds.filter((layerId) => !isProtectedDraftingLayerId(layerId, layers)),
        )

        if (actionableLayerIdSet.size === 0) {
          return current
        }

        nextLayers = nextLayers.map((layer) => {
          if (!actionableLayerIdSet.has(layer.id)) {
            return cloneDraftingCanvasLayer(layer)
          }

          return patchDraftingCanvasLayer(layer, { rotation: 0 })
        })
      }

      return {
        ...current,
        [paneId]: nextLayers,
      }
    })
  }
  return {
    applyLayerSelection,
    clearDraftingLayerSelection,
    copySelectedDraftingLayers,
    deleteSelectedLayersOrPane,
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
    handlePaneQrClick,
    handlePaneSelection,
    handleRemoveQrCode,
    pasteDraftingLayers,
    selectAllActiveDraftingLayers,
    selectSingleLayer,
  }
}
