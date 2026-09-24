"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import DOMPurify from "dompurify";

import type { QraftyState } from "@/features/qr/model/state";
import { buildCanvasQraftyMarkup } from "@/features/qr/rendering/qrafty-markup";
import { previewSession } from "@/features/canvas/preview/preview-session";
import {
  markPreviewPerformance,
  measurePreviewPerformance,
  PREVIEW_PERF_MARKS,
} from "@/features/canvas/preview/preview-performance";
import { createCanvasQrArtworkState } from "@/features/canvas/rendering/qr-artwork";

const markupCache = new Map<string, string>();

// Markup is generated in-repo, but user content (QR data, logo URLs) flows
// through it unescaped — sanitize before it reaches dangerouslySetInnerHTML.
function sanitizeQrMarkup(markup: string) {
  if (typeof window === "undefined") return markup;
  return DOMPurify.sanitize(markup, {
    USE_PROFILES: { svg: true, svgFilters: true },
  });
}

export function clearCanvasQrMarkupCache() {
  markupCache.clear();
}

export function useCanvasQrMarkup(state: QraftyState) {
  const qrArtworkState = useMemo(() => createCanvasQrArtworkState(state), [state]);
  const stateCacheKey = useMemo(() => JSON.stringify(qrArtworkState), [qrArtworkState]);
  const [lastMarkup, setLastMarkup] = useState<string | null>(null);
  // Interaction state is a real render input: when a gesture ends the memo
  // below recomputes, so a rebuild deferred mid-gesture actually lands.
  const isInteracting = useSyncExternalStore(
    previewSession.subscribe,
    previewSession.getIsInteracting,
  );

  const { markup, hasError } = useMemo(() => {
    const cachedMarkup = markupCache.get(stateCacheKey);
    if (cachedMarkup) {
      return { markup: cachedMarkup, hasError: false };
    }

    // Defer the expensive rebuild while the user is mid-gesture; the
    // subscription above re-renders once interaction ends.
    if (isInteracting && lastMarkup !== null) {
      return { markup: lastMarkup, hasError: false };
    }

    try {
      markPreviewPerformance(PREVIEW_PERF_MARKS.qrMarkupBuildBegin);
      const nextMarkup = sanitizeQrMarkup(buildCanvasQraftyMarkup(qrArtworkState));
      markPreviewPerformance(PREVIEW_PERF_MARKS.qrMarkupBuildEnd);
      measurePreviewPerformance(
        "qr-markup-build",
        PREVIEW_PERF_MARKS.qrMarkupBuildBegin,
        PREVIEW_PERF_MARKS.qrMarkupBuildEnd,
      );
      markupCache.set(stateCacheKey, nextMarkup);
      return { markup: nextMarkup, hasError: false };
    } catch {
      return { markup: null, hasError: true };
    }
  }, [qrArtworkState, stateCacheKey, isInteracting, lastMarkup]);

  // The last good markup is a render input: the memo above falls back to it
  // while a gesture defers the rebuild. Adjust it during render, guarded so the
  // update converges instead of looping.
  if (markup !== null && markup !== lastMarkup) {
    setLastMarkup(markup);
  }

  return { hasError, isLoading: markup === null && !hasError, markup };
}
