"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";

import type { QraftyState } from "@/features/qr/model/state";
import { buildCanvasQraftyMarkup } from "@/features/qr/rendering/qrafty-markup";
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

  return useMemo(() => {
    const cachedMarkup = markupCache.get(stateCacheKey);
    if (cachedMarkup) {
      return cachedMarkup;
    }

    try {
      const nextMarkup = sanitizeQrMarkup(buildCanvasQraftyMarkup(qrArtworkState));
      markupCache.set(stateCacheKey, nextMarkup);
      return nextMarkup;
    } catch {
      return null;
    }
  }, [qrArtworkState, stateCacheKey]);
}
