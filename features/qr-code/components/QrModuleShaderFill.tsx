"use client"

import { useCallback, useLayoutEffect, useRef, type RefObject } from "react"

import {
  findModuleShaderFillImage,
  syncModuleShaderFillImage,
} from "@/features/qr-code/motion/module-shader-fill"
import { DraftingCardPaperShaderLayer } from "@/features/workspace/components/CardPaperShaderLayer"
import type { DraftingCardPaperShaderState } from "@/features/workspace/model/card-state"

export function QrModuleShaderFill({
  containerRef,
  height,
  paperShader,
  qrMarkup,
  width,
}: {
  containerRef: RefObject<HTMLElement | null>
  height: number
  paperShader: DraftingCardPaperShaderState
  qrMarkup: string
  width: number
}) {
  const layoutWidth = Math.max(8, Math.round(width))
  const layoutHeight = Math.max(8, Math.round(height))
  const lastSyncedFrameRef = useRef<string | null>(null)

  const handleFrame = useCallback(
    (dataUrl: string, sourceCanvas: HTMLCanvasElement) => {
      const synced = syncModuleShaderFillImage(containerRef.current, dataUrl, sourceCanvas)

      if (synced) {
        lastSyncedFrameRef.current = dataUrl
      }

      return synced
    },
    [containerRef],
  )

  useLayoutEffect(() => {
    const container = containerRef.current

    if (!container || !lastSyncedFrameRef.current) {
      return
    }

    const image = findModuleShaderFillImage(container)

    if (!image) {
      return
    }

    syncModuleShaderFillImage(container, lastSyncedFrameRef.current)
  }, [containerRef, qrMarkup])

  return (
    <div
      aria-hidden="true"
      data-slot="qr-module-shader-host"
      style={{
        height: layoutHeight,
        inset: 0,
        opacity: 0.01,
        overflow: "hidden",
        pointerEvents: "none",
        position: "absolute",
        width: layoutWidth,
        zIndex: 0,
      }}
    >
      <DraftingCardPaperShaderLayer
        captureFrames
        ignoreVisibilityGate
        layoutHeight={layoutHeight}
        layoutWidth={layoutWidth}
        paperShader={paperShader}
        onFrame={handleFrame}
      />
    </div>
  )
}
