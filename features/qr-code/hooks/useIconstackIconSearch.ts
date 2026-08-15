"use client"

import { useEffect, useMemo, useState } from "react"

import {
  parseIconstackResultIconId,
  searchIcons,
  toIconstackSelectionId,
  type IconstackLibraryId,
  type IconstackSearchResult,
} from "@/features/qr-code/assets/iconstack-api"
import {
  fetchAndCacheIconstackSvg,
  getCachedIconstackSvg,
} from "@/features/qr-code/assets/iconstack-svg-cache"
import { isValidIconstackSvgMarkup } from "@/features/qr-code/assets/iconstack-svg"

const SEARCH_DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2
const PREVIEW_LIMIT = 24

type UseIconstackIconSearchParams = {
  enabled?: boolean
  library: IconstackLibraryId | "all"
  query: string
}

export function useIconstackIconSearch({
  enabled = true,
  library,
  query,
}: UseIconstackIconSearchParams) {
  const [results, setResults] = useState<IconstackSearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewSvgs, setPreviewSvgs] = useState<Record<string, string>>({})

  const trimmedQuery = query.trim()
  const canSearch = enabled && trimmedQuery.length >= MIN_QUERY_LENGTH

  useEffect(() => {
    if (!canSearch) {
      setResults([])
      setTotal(0)
      setIsLoading(false)
      setError(null)
      setPreviewSvgs({})
      return
    }

    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true)
        setError(null)

        try {
          const response = await searchIcons({
            q: trimmedQuery,
            library,
            limit: PREVIEW_LIMIT,
          })

          if (cancelled) {
            return
          }

          const previewEntries = await Promise.all(
            response.results.map(async (result) => {
              try {
                const iconId = parseIconstackResultIconId(result)
                const selectionId = toIconstackSelectionId(result)
                const cachedSvg = getCachedIconstackSvg(selectionId)
                const svg =
                  cachedSvg ??
                  (await fetchAndCacheIconstackSvg({
                    library: result.library,
                    id: iconId,
                  }))

                if (!isValidIconstackSvgMarkup(svg)) {
                  return null
                }

                return [result.id, svg] as const
              } catch {
                return null
              }
            }),
          )

          if (cancelled) {
            return
          }

          const nextPreviewSvgs = Object.fromEntries(
            previewEntries.filter(
              (entry): entry is readonly [string, string] => entry !== null,
            ),
          )
          const svgResults = response.results.filter((result) => result.id in nextPreviewSvgs)

          setPreviewSvgs(nextPreviewSvgs)
          setResults(svgResults)
          setTotal(svgResults.length)
        } catch (searchError) {
          if (cancelled) {
            return
          }

          setResults([])
          setTotal(0)
          setPreviewSvgs({})
          setError(
            searchError instanceof Error
              ? searchError.message
              : "Icon search failed",
          )
        } finally {
          setIsLoading(false)
        }
      })()
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [canSearch, library, trimmedQuery])

  return useMemo(
    () => ({
      canSearch,
      error,
      isLoading,
      previewSvgs,
      results,
      total,
    }),
    [canSearch, error, isLoading, previewSvgs, results, total],
  )
}
