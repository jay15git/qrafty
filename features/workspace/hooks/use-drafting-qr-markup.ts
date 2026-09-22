"use client"

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react"
import DOMPurify from "dompurify"

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

// Markup is generated in-repo, but user content (QR data, logo URLs) flows
// through it unescaped — sanitize before it reaches dangerouslySetInnerHTML.
function sanitizeQrMarkup(markup: string) {
  if (typeof window === "undefined") return markup
  return DOMPurify.sanitize(markup, {
    USE_PROFILES: { svg: true, svgFilters: true },
  })
}

export function clearDraftingQrMarkupCache() {
  markupCache.clear()
}

export function useDraftingQrMarkup(state: QraftyState) {
  const qrArtworkState = useMemo(() => createDraftingQrArtworkState(state), [state])
  const stateCacheKey = useMemo(() => JSON.stringify(qrArtworkState), [qrArtworkState])
  const lastMarkupRef = useRef<string | null>(null)
  // Interaction state is a real render input: when a gesture ends the memo
  // below recomputes, so a rebuild deferred mid-gesture actually lands.
  const isInteracting = useSyncExternalStore(
    previewSession.subscribe,
    previewSession.getIsInteracting,
  )

  const { markup, hasError } = useMemo(() => {
    const cachedMarkup = markupCache.get(stateCacheKey)
    if (cachedMarkup) {
      return { markup: cachedMarkup, hasError: false }
    }

    // Defer the expensive rebuild while the user is mid-gesture; the
    // subscription above re-renders once interaction ends.
    if (isInteracting && lastMarkupRef.current !== null) {
      return { markup: lastMarkupRef.current, hasError: false }
    }

    try {
      markPreviewPerformance(PREVIEW_PERF_MARKS.qrMarkupBuildBegin)
      const nextMarkup = sanitizeQrMarkup(buildDraftingQraftyMarkup(qrArtworkState))
      markPreviewPerformance(PREVIEW_PERF_MARKS.qrMarkupBuildEnd)
      measurePreviewPerformance(
        "qr-markup-build",
        PREVIEW_PERF_MARKS.qrMarkupBuildBegin,
        PREVIEW_PERF_MARKS.qrMarkupBuildEnd,
      )
      markupCache.set(stateCacheKey, nextMarkup)
      return { markup: nextMarkup, hasError: false }
    } catch {
      return { markup: null, hasError: true }
    }
  }, [qrArtworkState, stateCacheKey, isInteracting])

  // Render must stay pure: the "last good markup" fallback is recorded on
  // commit, not while the memo runs.
  useEffect(() => {
    if (markup !== null) {
      lastMarkupRef.current = markup
    }
  }, [markup])

  return { hasError, isLoading: markup === null && !hasError, markup }
}
