"use client"

import { useEffect, useMemo, useState } from "react"

import {
  filterCuratedIconstackIcons,
  toCuratedSearchResult,
} from "@/features/qr/assets/iconstack-curated"
import type { IconstackLibraryId, IconstackSearchResult } from "@/features/qr/assets/iconstack-api"
import { fetchAndCacheIconstackSvg } from "@/features/qr/assets/iconstack-svg-cache"
import { isValidIconstackSvgMarkup } from "@/features/qr/assets/iconstack-svg"

type UseIconstackCuratedIconsParams = {
  enabled?: boolean
  library: IconstackLibraryId | "all"
}

export function useIconstackCuratedIcons({
  enabled = true,
  library,
}: UseIconstackCuratedIconsParams) {
  const [icons, setIcons] = useState<IconstackSearchResult[]>([])
  const [previewSvgs, setPreviewSvgs] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const curatedIcons = useMemo(() => filterCuratedIconstackIcons(library), [library])
  const curatedIconKey = useMemo(
    () => curatedIcons.map((icon) => `${icon.library}:${icon.id}`).join("|"),
    [curatedIcons],
  )

  useEffect(() => {
    if (!enabled || curatedIcons.length === 0) {
      setIcons([])
      setPreviewSvgs({})
      setIsLoading(false)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)

    void (async () => {
      try {
        const previewEntries = await Promise.all(
          curatedIcons.map(async (icon) => {
            const result = toCuratedSearchResult(icon)

            try {
              const svg = await fetchAndCacheIconstackSvg({
                library: icon.library,
                id: icon.id,
              })

              if (!isValidIconstackSvgMarkup(svg)) {
                return null
              }

              return [result.id, svg, result] as const
            } catch {
              return null
            }
          }),
        )

        if (cancelled) {
          return
        }

        const validEntries = previewEntries.filter(
          (entry): entry is readonly [string, string, IconstackSearchResult] => entry !== null,
        )

        setPreviewSvgs(Object.fromEntries(validEntries.map(([id, svg]) => [id, svg])))
        setIcons(validEntries.map(([, , result]) => result))
      } catch (loadError) {
        if (cancelled) {
          return
        }

        setIcons([])
        setPreviewSvgs({})
        setError(loadError instanceof Error ? loadError.message : "Failed to load icons")
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [curatedIconKey, curatedIcons, enabled])

  return useMemo(
    () => ({
      error,
      icons,
      isLoading,
      previewSvgs,
    }),
    [error, icons, isLoading, previewSvgs],
  )
}
