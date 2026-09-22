"use client"

import { useEffect, type MutableRefObject } from "react"

import {
  createDefaultDraftingLayers,
  type DraftingCanvasLayer,
  type DraftingLayerStateByNodeId,
} from "@/features/workspace/model/layers"
import {
  getDraftingLayerClipboardPayload,
  isEditableShortcutTarget,
  parseDraftingLayerClipboardPayload,
} from "@/features/workspace/components/workspace-surface-helpers"
import type { DraftingLayerMenuAction } from "@/features/workspace/components/Pane"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { QraftyState } from "@/features/qr-code/model/state"

const ARROW_KEY_DELTAS: Record<string, readonly [number, number]> = {
  arrowleft: [-1, 0],
  arrowright: [1, 0],
  arrowup: [0, -1],
  arrowdown: [0, 1],
}

export type DraftingShortcutKeyboardState = {
  activeQrLayerId: string
  activeQrNodeId: string
  draftingQraftyState: QraftyState
  layerStateByNodeId: DraftingLayerStateByNodeId
  qrLayerCount: number
  selectedCardState: DraftingCardState
  selectedLayerIds: string[]
}

export type DraftingShortcutHandlers = {
  clearDraftingLayerSelection: () => void
  copySelectedDraftingLayers: (layerIds?: string[], paneId?: string) => Promise<void>
  deleteSelectedLayersOrPane: () => void
  duplicateSelectedLayers: (layerIds?: string[]) => void
  handleLayerAction: (
    paneId: string,
    layerIds: string[],
    action: DraftingLayerMenuAction,
  ) => void
  handleLayerChange: (
    paneId: string,
    layerId: string,
    patch: Partial<DraftingCanvasLayer>,
  ) => void
  handleRedoDraftingWorkspace: () => void
  handleUndoDraftingWorkspace: () => void
  pasteDraftingLayers: (
    point?: { x: number; y: number },
    payloadText?: string,
    paneId?: string,
  ) => Promise<void>
  selectAllActiveDraftingLayers: () => void
}

export function useDraftingShortcuts({
  clipboardRef,
  handlersRef,
  stateRef,
  surfaceRef,
}: {
  clipboardRef: MutableRefObject<string>
  handlersRef: MutableRefObject<DraftingShortcutHandlers>
  stateRef: MutableRefObject<DraftingShortcutKeyboardState>
  surfaceRef: MutableRefObject<HTMLElement | null>
}) {
  useEffect(() => {
    const MODIFIER_SHORTCUTS: Record<string, (event: KeyboardEvent) => void> = {
      z: (event) =>
        event.shiftKey
          ? handlersRef.current.handleRedoDraftingWorkspace()
          : handlersRef.current.handleUndoDraftingWorkspace(),
      y: () => handlersRef.current.handleRedoDraftingWorkspace(),
      d: () => handlersRef.current.duplicateSelectedLayers(),
      a: () => handlersRef.current.selectAllActiveDraftingLayers(),
      v: () => void handlersRef.current.pasteDraftingLayers(),
    }

    const nudgeSelectedLayers = (event: KeyboardEvent, arrowDelta: readonly [number, number]) => {
      const delta = event.shiftKey ? 10 : 1
      const {
        activeQrNodeId: currentActiveQrNodeId,
        layerStateByNodeId: currentLayerStateByNodeId,
        selectedLayerIds: currentSelectedLayerIds,
      } = stateRef.current
      const activeLayers = currentLayerStateByNodeId[currentActiveQrNodeId] ?? []
      const activeLayerById = new Map(activeLayers.map((item) => [item.id, item]))

      if (currentSelectedLayerIds.length === 0) {
        return
      }

      event.preventDefault()
      for (const layerId of currentSelectedLayerIds) {
        const layer = activeLayerById.get(layerId)

        if (layer) {
          handlersRef.current.handleLayerChange(currentActiveQrNodeId, layerId, {
            x: layer.x + arrowDelta[0] * delta,
            y: layer.y + arrowDelta[1] * delta,
          })
        }
      }
    }

    const handlePlainKey = (event: KeyboardEvent, key: string) => {
      const arrowDelta = ARROW_KEY_DELTAS[key]
      if (arrowDelta) {
        nudgeSelectedLayers(event, arrowDelta)
        return
      }

      if (key === "delete" || key === "backspace") {
        event.preventDefault()
        handlersRef.current.deleteSelectedLayersOrPane()
        return
      }

      if (key === "escape") {
        event.preventDefault()
        handlersRef.current.clearDraftingLayerSelection()
      }
    }

    const handleModifierKey = (event: KeyboardEvent, key: string) => {
      const withSelection = (action: (selectedLayerIds: string[]) => void) => {
        const selectedLayerIds = stateRef.current.selectedLayerIds
        if (selectedLayerIds.length > 0) {
          event.preventDefault()
          action(selectedLayerIds)
        }
      }
      const reorder = (shifted: string, plain: string) =>
        withSelection((selectedLayerIds) =>
          handlersRef.current.handleLayerAction(
            stateRef.current.activeQrNodeId,
            selectedLayerIds,
            (event.shiftKey ? shifted : plain) as Parameters<
              DraftingShortcutHandlers["handleLayerAction"]
            >[2],
          ),
        )

      const shortcut = MODIFIER_SHORTCUTS[key]
      if (shortcut) {
        event.preventDefault()
        shortcut(event)
        return
      }

      if (key === "c") {
        withSelection((selectedLayerIds) =>
          void handlersRef.current.copySelectedDraftingLayers(selectedLayerIds),
        )
        return
      }

      if (key === "[") {
        reorder("back", "backward")
        return
      }

      if (key === "]") {
        reorder("front", "forward")
        return
      }

      if (key === "g") {
        reorder("ungroup", "group")
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target
      const isBodyOrDocumentTarget =
        target === document.body || target === document.documentElement || target === document
      const targetInSurface =
        target instanceof Node && surfaceRef.current?.contains(target)

      if (
        !surfaceRef.current ||
        (!targetInSurface && !isBodyOrDocumentTarget) ||
        isEditableShortcutTarget(target)
      ) {
        return
      }

      const key = event.key.toLowerCase()

      if (event.metaKey || event.ctrlKey) {
        handleModifierKey(event, key)
      } else {
        handlePlainKey(event, key)
      }
    }

    window.addEventListener("keydown", handleKeyDown, true)
    return () => window.removeEventListener("keydown", handleKeyDown, true)
    // Keyboard listener is stable; current workspace values are read via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const shouldUseDraftingClipboardEvent = (event: ClipboardEvent) => {
      const target = event.target
      const isBodyOrDocumentTarget =
        target === document.body || target === document.documentElement || target === document
      const targetInSurface =
        target instanceof Node && surfaceRef.current?.contains(target)

      return Boolean(
        surfaceRef.current &&
          (targetInSurface || isBodyOrDocumentTarget) &&
          !isEditableShortcutTarget(target),
      )
    }

    const handleCopy = (event: ClipboardEvent) => {
      if (!shouldUseDraftingClipboardEvent(event)) {
        return
      }

      const {
        activeQrNodeId: currentActiveQrNodeId,
        draftingQraftyState: currentDraftingQraftyState,
        layerStateByNodeId: currentLayerStateByNodeId,
        selectedCardState: currentSelectedCardState,
        selectedLayerIds: currentSelectedLayerIds,
      } = stateRef.current
      const payload = getDraftingLayerClipboardPayload({
        layerIds: currentSelectedLayerIds,
        layers:
          currentLayerStateByNodeId[currentActiveQrNodeId] ??
          createDefaultDraftingLayers(
            currentActiveQrNodeId,
            currentDraftingQraftyState,
            currentSelectedCardState,
          ),
        paneId: currentActiveQrNodeId,
      })

      if (!payload) {
        return
      }

      event.preventDefault()
      clipboardRef.current = payload
      event.clipboardData?.setData("text/plain", payload)
    }

    const handlePaste = (event: ClipboardEvent) => {
      if (!shouldUseDraftingClipboardEvent(event)) {
        return
      }

      const rawPayload = event.clipboardData?.getData("text/plain") ?? ""

      if (!parseDraftingLayerClipboardPayload(rawPayload)) {
        return
      }

      event.preventDefault()
      void handlersRef.current.pasteDraftingLayers(undefined, rawPayload)
    }

    window.addEventListener("copy", handleCopy, true)
    window.addEventListener("paste", handlePaste, true)
    return () => {
      window.removeEventListener("copy", handleCopy, true)
      window.removeEventListener("paste", handlePaste, true)
    }
    // eslint-disable-next-line react-doctor/exhaustive-deps -- clipboard handlers read latest state via refs
  }, [])
}
