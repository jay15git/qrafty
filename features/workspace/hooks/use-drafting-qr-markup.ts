"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import type { QrStudioState } from "@/features/qr-code/model/state"
import { buildDashboardQrNodePayload } from "@/features/qr-code/rendering/qr-svg"
import {
  createDraftingQrArtworkState,
  sanitizeDraftingQrArtworkMarkup,
} from "@/features/workspace/rendering/qr-artwork"

const markupCache = new Map<string, string>()

export function clearDraftingQrMarkupCache() {
  markupCache.clear()
}

export function useDraftingQrMarkup(state: QrStudioState) {
  const [markup, setMarkup] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)
  const requestRef = useRef(0)
  const qrArtworkState = useMemo(() => createDraftingQrArtworkState(state), [state])
  const stateCacheKey = useMemo(() => JSON.stringify(qrArtworkState), [qrArtworkState])

  useEffect(() => {
    const requestId = ++requestRef.current
    const cachedMarkup = markupCache.get(stateCacheKey)

    if (cachedMarkup) {
      setMarkup(cachedMarkup)
      setHasError(false)
      return
    }

    void buildDashboardQrNodePayload(qrArtworkState)
      .then((payload) => {
        if (requestRef.current !== requestId) return
        const nextMarkup = sanitizeDraftingQrArtworkMarkup(payload.markup)
        markupCache.set(stateCacheKey, nextMarkup)
        setMarkup(nextMarkup)
        setHasError(false)
      })
      .catch(() => {
        if (requestRef.current !== requestId) return
        setMarkup(null)
        setHasError(true)
      })
  }, [qrArtworkState, stateCacheKey])

  return { hasError, isLoading: markup === null && !hasError, markup }
}
