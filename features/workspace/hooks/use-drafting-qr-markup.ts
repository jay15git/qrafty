"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type { QraftyState } from "@/features/qr-code/model/state"
import { buildDraftingQraftyMarkup } from "@/features/qr-code/rendering/qrafty-markup"
import { previewSession } from "@/features/workspace/preview/preview-session"
import {
  markPreviewPerformance,
  measurePreviewPerformance,
  PREVIEW_PERF_MARKS,
} from "@/features/workspace/preview/preview-performance"
import { createDraftingQrArtworkState } from "@/features/workspace/rendering/qr-artwork"

const markupCache = new Map<string, string>()

export function clearDraftingQrMarkupCache() {
  markupCache.clear()
}

export function useDraftingQrMarkup(state: QraftyState) {
  const [markup, setMarkup] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  const requestRef = useRef(0)
  const qrArtworkState = useMemo(() => createDraftingQrArtworkState(state), [state])
  const stateCacheKey = useMemo(() => JSON.stringify(qrArtworkState), [qrArtworkState])
  const qrArtworkStateRef = useRef(qrArtworkState)
  const stateCacheKeyRef = useRef(stateCacheKey)

  qrArtworkStateRef.current = qrArtworkState
  stateCacheKeyRef.current = stateCacheKey

  const buildMarkupForCurrentState = useCallback(() => {
    const requestId = ++requestRef.current
    const cacheKey = stateCacheKeyRef.current
    const artworkState = qrArtworkStateRef.current
    const cachedMarkup = markupCache.get(cacheKey)

    if (cachedMarkup) {
      setMarkup(cachedMarkup)
      setHasError(false)
      return
    }

    try {
      markPreviewPerformance(PREVIEW_PERF_MARKS.qrMarkupBuildBegin)
      const nextMarkup = buildDraftingQraftyMarkup(artworkState)
      markPreviewPerformance(PREVIEW_PERF_MARKS.qrMarkupBuildEnd)
      measurePreviewPerformance(
        "qr-markup-build",
        PREVIEW_PERF_MARKS.qrMarkupBuildBegin,
        PREVIEW_PERF_MARKS.qrMarkupBuildEnd,
      )
      if (requestRef.current !== requestId) {
        return
      }

      markupCache.set(cacheKey, nextMarkup)
      setMarkup(nextMarkup)
      setHasError(false)
    } catch {
      if (requestRef.current !== requestId) {
        return
      }

      setMarkup(null)
      setHasError(true)
    }
  }, [])

  useEffect(() => {
    if (previewSession.getIsInteracting()) {
      return
    }

    buildMarkupForCurrentState()
  }, [buildMarkupForCurrentState, stateCacheKey])

  useEffect(() => {
    return previewSession.subscribe(() => {
      if (!previewSession.getIsInteracting()) {
        buildMarkupForCurrentState()
      }
    })
  }, [buildMarkupForCurrentState])

  return { hasError, isLoading: markup === null && !hasError, markup }
}
