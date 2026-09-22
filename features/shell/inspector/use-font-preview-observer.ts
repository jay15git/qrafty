"use client"

import { useCallback, useEffect, useRef } from "react"

import { loadDraftingFontPreview } from "@/features/canvas/model/fonts"

const FONT_PREVIEW_ID_ATTR = "dataFontPreviewId"

/**
 * Returns a ref-callback factory for font picker rows. Rows render in a subset
 * preview of their typeface once they scroll near the viewport, so opening a
 * ~200-font list does not fetch ~200 full fonts.
 */
export function useFontPreviewObserver() {
  const observerRef = useRef<IntersectionObserver | null>(null)

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
      observerRef.current = null
    }
  }, [])

  return useCallback((fontId: string) => {
    return (node: HTMLElement | null) => {
      if (!node) {
        return
      }

      node.dataset[FONT_PREVIEW_ID_ATTR] = fontId

      if (typeof IntersectionObserver === "undefined") {
        loadDraftingFontPreview(fontId)
        return
      }

      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) {
                continue
              }

              const target = entry.target as HTMLElement
              const id = target.dataset[FONT_PREVIEW_ID_ATTR]
              if (id) {
                loadDraftingFontPreview(id)
              }
              observerRef.current?.unobserve(target)
            }
          },
          { rootMargin: "96px" },
        )
      }

      observerRef.current.observe(node)
    }
  }, [])
}
