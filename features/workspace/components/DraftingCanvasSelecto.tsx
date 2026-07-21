"use client"

import { useEffect, useRef } from "react"
import Selecto from "react-selecto"

type DraftingCanvasSelectoProps = {
  container: HTMLElement | null
  disabled?: boolean
  onSelectionChange: (layerIds: string[], options?: { additive?: boolean }) => void
  selectedLayerIds: string[]
}

export function DraftingCanvasSelecto({
  container,
  disabled = false,
  onSelectionChange,
  selectedLayerIds,
}: DraftingCanvasSelectoProps) {
  const selectoRef = useRef<Selecto | null>(null)

  useEffect(() => {
    if (!selectoRef.current) {
      return
    }

    selectoRef.current.setSelectedTargets(
      selectedLayerIds
        .map((layerId) =>
          container?.querySelector<HTMLElement>(`[data-layer-id="${layerId}"]`),
        )
        .filter((element): element is HTMLElement => element instanceof HTMLElement),
    )
  }, [container, selectedLayerIds])

  if (!container || disabled) {
    return null
  }

  return (
    <Selecto
      ref={selectoRef}
      container={container}
      dragContainer={container}
      selectableTargets={["[data-layer-id]"]}
      selectByClick={false}
      selectFromInside={false}
      continueSelect={false}
      toggleContinueSelect={["shift"]}
      keyContainer={window}
      hitRate={0}
      ratio={0}
      onSelect={(event) => {
        const layerIds = event.selected
          .map((element) => element.getAttribute("data-layer-id"))
          .filter((layerId): layerId is string => Boolean(layerId))

        onSelectionChange(layerIds, {
          additive: event.inputEvent.shiftKey || event.inputEvent.metaKey || event.inputEvent.ctrlKey,
        })
      }}
      onDragStart={(event) => {
        const target = event.inputEvent.target

        if (!(target instanceof Element)) {
          return
        }

        if (target.closest("[data-layer-id], [data-slot='drafting-layer-resize-frame']")) {
          event.stop()
        }
      }}
    />
  )
}
