"use client"

import { useEffect, useRef, useState } from "react"
import Moveable from "react-moveable"

import { resizeDraftingLayer, type ResizeDirection } from "@/features/workspace/components/Pane"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

type DraftingLayerMoveableProps = {
  container: HTMLElement | null
  layer: DraftingCanvasLayer
  onLayerChange: (layerId: string, patch: Partial<DraftingCanvasLayer>) => void
  scale?: number
}

function mapDirectionToResize(direction: number[]): ResizeDirection | null {
  const [horizontal, vertical] = direction

  if (horizontal === 0 && vertical === -1) return "n"
  if (horizontal === 1 && vertical === -1) return "ne"
  if (horizontal === 1 && vertical === 0) return "e"
  if (horizontal === 1 && vertical === 1) return "se"
  if (horizontal === 0 && vertical === 1) return "s"
  if (horizontal === -1 && vertical === 1) return "sw"
  if (horizontal === -1 && vertical === 0) return "w"
  if (horizontal === -1 && vertical === -1) return "nw"

  return null
}

export function DraftingLayerMoveable({
  container,
  layer,
  onLayerChange,
  scale = 1,
}: DraftingLayerMoveableProps) {
  const [target, setTarget] = useState<HTMLElement | null>(null)
  const dragOriginRef = useRef({ x: layer.x, y: layer.y })
  const resizeDirectionRef = useRef<ResizeDirection | null>(null)
  const resizeOriginRef = useRef({
    height: layer.height,
    width: layer.width,
    x: layer.x,
    y: layer.y,
  })

  useEffect(() => {
    if (!container) {
      setTarget(null)
      return
    }

    setTarget(container.querySelector<HTMLElement>(`[data-layer-id="${layer.id}"]`))
  }, [container, layer.id, layer.x, layer.y, layer.width, layer.height, layer.rotation])

  if (!target || layer.isLocked) {
    return null
  }

  return (
    <Moveable
      target={target}
      container={container}
      origin={false}
      zoom={scale > 0 ? 1 / scale : 1}
      draggable
      resizable
      rotatable
      keepRatio={layer.kind === "qr"}
      throttleDrag={0}
      throttleResize={0}
      throttleRotate={0}
      onDragStart={() => {
        dragOriginRef.current = { x: layer.x, y: layer.y }
      }}
      onDrag={({ beforeTranslate }) => {
        onLayerChange(layer.id, {
          x: dragOriginRef.current.x + beforeTranslate[0],
          y: dragOriginRef.current.y + beforeTranslate[1],
        })
      }}
      onResizeStart={({ direction }) => {
        resizeDirectionRef.current = mapDirectionToResize(direction)
        resizeOriginRef.current = {
          height: layer.height,
          width: layer.width,
          x: layer.x,
          y: layer.y,
        }
      }}
      onResize={({ width, height, drag }) => {
        const direction = resizeDirectionRef.current
        if (!direction) {
          return
        }

        const next = resizeDraftingLayer(
          {
            ...layer,
            ...resizeOriginRef.current,
          },
          direction,
          drag.beforeTranslate[0],
          drag.beforeTranslate[1],
        )

        onLayerChange(layer.id, {
          ...next,
          width: Math.max(24, Math.round(width)),
          height: Math.max(24, Math.round(height)),
        })
      }}
      onRotate={({ rotation }) => {
        onLayerChange(layer.id, { rotation })
      }}
    />
  )
}
