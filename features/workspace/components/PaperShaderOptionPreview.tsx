"use client"

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"

import {
  DraftingCardPaperShaderRenderer,
  hasDraftingPaperShaderWebGlSupport,
} from "@/features/workspace/components/CardPaperShaderLayer"
import { createDefaultDraftingCardPaperShader } from "@/features/workspace/model/card-state"
import type { DraftingCardPaperShaderState } from "@/features/workspace/model/card-state"
import type { PaperShaderId } from "@/features/workspace/rendering/paper-shaders"
import { hasLiveCanvasPaperShaderMount } from "@/features/workspace/rendering/paper-shader-runtime"
import { LIVE_PAPER_SHADER_WEBGL_CONTEXT_ATTRIBUTES } from "@new-qr/qr-internal/scene"

const PAPER_SHADER_THUMBNAIL_CACHE_VERSION = "paper-shader-thumbnail-v1"
const PAPER_SHADER_THUMBNAIL_WIDTH = 96
const PAPER_SHADER_THUMBNAIL_HEIGHT = 80
const PAPER_SHADER_THUMBNAIL_FRAME = 120
const PAPER_SHADER_THUMBNAIL_MAX_PIXEL_COUNT =
  PAPER_SHADER_THUMBNAIL_WIDTH * PAPER_SHADER_THUMBNAIL_HEIGHT
const PAPER_SHADER_THUMBNAIL_RENDER_OPTIONS = {
  maxPixelCount: PAPER_SHADER_THUMBNAIL_MAX_PIXEL_COUNT,
  minPixelRatio: 1,
  webGlContextAttributes: {
    ...LIVE_PAPER_SHADER_WEBGL_CONTEXT_ATTRIBUTES,
    preserveDrawingBuffer: true,
  },
}
const PAPER_SHADER_THUMBNAIL_CAPTURE_STYLE: CSSProperties = {
  height: "100%",
  inset: 0,
  overflow: "hidden",
  pointerEvents: "none",
  position: "absolute",
  width: "100%",
}
const PAPER_SHADER_THUMBNAIL_SHADER_STYLE: CSSProperties = {
  height: "100%",
  width: "100%",
}

const paperShaderThumbnailCache = new Map<string, string>()
const paperShaderThumbnailFailures = new Set<string>()
const paperShaderThumbnailSubscribers = new Map<string, Set<() => void>>()
const paperShaderThumbnailQueue: string[] = []
let activePaperShaderThumbnailKey: string | null = null
let thumbnailDeferTimeoutId = 0

export function createDraftingPaperShaderThumbnailCacheKey(
  paperShader: DraftingCardPaperShaderState,
) {
  return JSON.stringify({
    frame: paperShader.frame,
    image: paperShader.image,
    params: paperShader.params,
    presetName: paperShader.presetName,
    renderer: PAPER_SHADER_THUMBNAIL_CACHE_VERSION,
    shaderId: paperShader.shaderId,
  })
}

function notifyPaperShaderThumbnailSubscribers(cacheKey: string) {
  paperShaderThumbnailSubscribers.get(cacheKey)?.forEach((listener) => listener())
}

function subscribeToPaperShaderThumbnail(cacheKey: string, listener: () => void) {
  const listeners = paperShaderThumbnailSubscribers.get(cacheKey) ?? new Set<() => void>()
  listeners.add(listener)
  paperShaderThumbnailSubscribers.set(cacheKey, listeners)

  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      paperShaderThumbnailSubscribers.delete(cacheKey)
    }
  }
}

function requestPaperShaderThumbnail(cacheKey: string, priority: boolean) {
  if (
    paperShaderThumbnailCache.has(cacheKey) ||
    paperShaderThumbnailFailures.has(cacheKey) ||
    activePaperShaderThumbnailKey === cacheKey ||
    paperShaderThumbnailQueue.includes(cacheKey)
  ) {
    return
  }

  if (priority) {
    paperShaderThumbnailQueue.unshift(cacheKey)
  } else {
    paperShaderThumbnailQueue.push(cacheKey)
  }

  processNextPaperShaderThumbnail()
}

function processNextPaperShaderThumbnail() {
  if (activePaperShaderThumbnailKey !== null) {
    return
  }

  if (hasLiveCanvasPaperShaderMount()) {
    window.clearTimeout(thumbnailDeferTimeoutId)
    thumbnailDeferTimeoutId = window.setTimeout(processNextPaperShaderThumbnail, 750)
    return
  }

  const nextKey = paperShaderThumbnailQueue.shift()
  if (!nextKey) {
    return
  }

  activePaperShaderThumbnailKey = nextKey
  notifyPaperShaderThumbnailSubscribers(nextKey)
}

function finishPaperShaderThumbnail(cacheKey: string, dataUrl?: string) {
  if (dataUrl) {
    paperShaderThumbnailCache.set(cacheKey, dataUrl)
  } else {
    paperShaderThumbnailFailures.add(cacheKey)
  }

  if (activePaperShaderThumbnailKey === cacheKey) {
    activePaperShaderThumbnailKey = null
  }

  notifyPaperShaderThumbnailSubscribers(cacheKey)
  processNextPaperShaderThumbnail()
}

export function PaperShaderOptionPreview({
  className,
  isSelected = false,
  shaderId,
}: {
  className?: string
  isSelected?: boolean
  shaderId: PaperShaderId
}) {
  const [, setRevision] = useState(0)
  const [mountGeneration, setMountGeneration] = useState(0)
  const captureHostRef = useRef<HTMLSpanElement | null>(null)
  const [canRenderShader] = useState(hasDraftingPaperShaderWebGlSupport)
  const previewShader = useMemo(
    () => ({
      ...createDefaultDraftingCardPaperShader(shaderId),
      frame: PAPER_SHADER_THUMBNAIL_FRAME,
      paused: true,
      speed: 0,
    }),
    [shaderId],
  )
  const cacheKey = useMemo(
    () => createDraftingPaperShaderThumbnailCacheKey(previewShader),
    [previewShader],
  )
  const cachedThumbnail = paperShaderThumbnailCache.get(cacheKey)
  const isGeneratingThumbnail = activePaperShaderThumbnailKey === cacheKey

  useEffect(
    () => subscribeToPaperShaderThumbnail(cacheKey, () => setRevision((revision) => revision + 1)),
    [cacheKey],
  )

  useEffect(() => {
    if (!canRenderShader || !isSelected) {
      return
    }

    requestPaperShaderThumbnail(cacheKey, true)
  }, [cacheKey, canRenderShader, isSelected])

  useEffect(() => {
    if (!isGeneratingThumbnail) {
      return
    }

    let isCancelled = false
    let didFinish = false
    let frameId = 0
    let timeoutId = 0
    let attempts = 0

    const getCanvasDataUrl = () => {
      const canvas = captureHostRef.current?.querySelector("canvas")
      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        return undefined
      }

      try {
        const sampleCanvas = document.createElement("canvas")
        sampleCanvas.width = 12
        sampleCanvas.height = 12
        const sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true })

        if (!sampleContext) {
          return undefined
        }

        sampleContext.drawImage(canvas, 0, 0, sampleCanvas.width, sampleCanvas.height)
        const pixels = sampleContext.getImageData(
          0,
          0,
          sampleCanvas.width,
          sampleCanvas.height,
        ).data
        let minChannel = 255
        let maxChannel = 0
        let visiblePixels = 0

        for (let index = 0; index < pixels.length; index += 4) {
          minChannel = Math.min(minChannel, pixels[index] ?? 255, pixels[index + 1] ?? 255, pixels[index + 2] ?? 255)
          maxChannel = Math.max(maxChannel, pixels[index] ?? 0, pixels[index + 1] ?? 0, pixels[index + 2] ?? 0)
          if ((pixels[index + 3] ?? 0) > 0) {
            visiblePixels += 1
          }
        }

        if (visiblePixels === 0 || maxChannel - minChannel < 4) {
          return undefined
        }

        return canvas.toDataURL("image/png")
      } catch {
        return canvas.toDataURL("image/png")
      }
    }

    const captureThumbnail = () => {
      if (isCancelled || didFinish) {
        return
      }

      const dataUrl = getCanvasDataUrl()
      if (!dataUrl && attempts < 30) {
        attempts += 1
        frameId = window.requestAnimationFrame(captureThumbnail)
        return
      }

      didFinish = true
      if (dataUrl) {
        finishPaperShaderThumbnail(cacheKey, dataUrl)
      } else {
        finishPaperShaderThumbnail(cacheKey)
      }
    }

    frameId = window.requestAnimationFrame(captureThumbnail)
    timeoutId = window.setTimeout(() => {
      if (!didFinish) {
        didFinish = true
        finishPaperShaderThumbnail(cacheKey, getCanvasDataUrl())
      }
    }, 2000)

    return () => {
      isCancelled = true
      window.cancelAnimationFrame(frameId)
      window.clearTimeout(timeoutId)
    }
  }, [cacheKey, isGeneratingThumbnail])

  return (
    <span
      aria-hidden="true"
      className={className ?? "relative block size-full overflow-hidden"}
      data-slot="paper-shader-option-preview"
    >
      {cachedThumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          alt=""
          className="block size-full object-cover"
          data-slot="paper-shader-option-preview-image"
          draggable={false}
          src={cachedThumbnail}
        />
      ) : !isGeneratingThumbnail ? (
        <span
          className="absolute inset-0 bg-[#15161a] opacity-70"
          data-slot="paper-shader-option-preview-fallback"
        />
      ) : null}
      {isGeneratingThumbnail ? (
        <span
          ref={captureHostRef}
          className="block"
          data-slot="paper-shader-option-preview-capture"
          style={PAPER_SHADER_THUMBNAIL_CAPTURE_STYLE}
        >
          <DraftingCardPaperShaderRenderer
            dataSlot="paper-shader-option-preview-source"
            layoutHeight={PAPER_SHADER_THUMBNAIL_HEIGHT}
            layoutWidth={PAPER_SHADER_THUMBNAIL_WIDTH}
            mountGeneration={mountGeneration}
            onError={() => finishPaperShaderThumbnail(cacheKey)}
            onRecover={() => setMountGeneration((current) => current + 1)}
            paperShader={previewShader}
            renderOptions={PAPER_SHADER_THUMBNAIL_RENDER_OPTIONS}
            style={PAPER_SHADER_THUMBNAIL_SHADER_STYLE}
          />
        </span>
      ) : null}
    </span>
  )
}

/** @deprecated Use PaperShaderOptionPreview */
export const DraftingPaperShaderOptionPreview = PaperShaderOptionPreview
