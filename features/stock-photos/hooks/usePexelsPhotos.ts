"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  fetchCuratedPexelsPhotosClient,
  searchPexelsPhotosClient,
} from "@/features/stock-photos/api/pexels-client"
import type {
  PexelsPhoto,
  PexelsPhotoOrientationFilter,
} from "@/features/stock-photos/model/pexels"

const SEARCH_DEBOUNCE_MS = 300
const MIN_QUERY_LENGTH = 2
const DEFAULT_PER_PAGE = 24

type UsePexelsPhotosParams = {
  enabled?: boolean
  orientation: PexelsPhotoOrientationFilter
  query: string
}

export function usePexelsPhotos({
  enabled = true,
  orientation,
  query,
}: UsePexelsPhotosParams) {
  const [photos, setPhotos] = useState<PexelsPhoto[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [totalResults, setTotalResults] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const trimmedQuery = query.trim()
  const canSearch = enabled && trimmedQuery.length >= MIN_QUERY_LENGTH

  useEffect(() => {
    setPage(1)
  }, [orientation, trimmedQuery, enabled])

  useEffect(() => {
    if (!enabled) {
      setPhotos([])
      setHasMore(false)
      setTotalResults(0)
      setIsLoading(false)
      setIsLoadingMore(false)
      setError(null)
      return
    }

    let cancelled = false
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true)
        setError(null)

        try {
          const response = canSearch
            ? await searchPexelsPhotosClient({
                query: trimmedQuery,
                page: 1,
                perPage: DEFAULT_PER_PAGE,
                orientation,
              })
            : await fetchCuratedPexelsPhotosClient({
                page: 1,
                perPage: DEFAULT_PER_PAGE,
              })

          if (cancelled) {
            return
          }

          setPhotos(response.photos)
          setPage(response.page)
          setHasMore(response.hasMore)
          setTotalResults(response.totalResults)
        } catch (loadError) {
          if (cancelled) {
            return
          }

          setPhotos([])
          setHasMore(false)
          setTotalResults(0)
          setError(
            loadError instanceof Error ? loadError.message : "Photo search failed",
          )
        } finally {
          if (!cancelled) {
            setIsLoading(false)
          }
        }
      })()
    }, canSearch ? SEARCH_DEBOUNCE_MS : 0)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [canSearch, enabled, orientation, trimmedQuery])

  const loadMore = useCallback(async () => {
    if (!enabled || isLoading || isLoadingMore || !hasMore) {
      return
    }

    const nextPage = page + 1
    setIsLoadingMore(true)
    setError(null)

    try {
      const response = canSearch
        ? await searchPexelsPhotosClient({
            query: trimmedQuery,
            page: nextPage,
            perPage: DEFAULT_PER_PAGE,
            orientation,
          })
        : await fetchCuratedPexelsPhotosClient({
            page: nextPage,
            perPage: DEFAULT_PER_PAGE,
          })

      setPhotos((current) => [...current, ...response.photos])
      setPage(response.page)
      setHasMore(response.hasMore)
      setTotalResults(response.totalResults)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load more photos")
    } finally {
      setIsLoadingMore(false)
    }
  }, [
    canSearch,
    enabled,
    hasMore,
    isLoading,
    isLoadingMore,
    orientation,
    page,
    trimmedQuery,
  ])

  return useMemo(
    () => ({
      canSearch,
      error,
      hasMore,
      isLoading,
      isLoadingMore,
      loadMore,
      photos,
      totalResults,
    }),
    [canSearch, error, hasMore, isLoading, isLoadingMore, loadMore, photos, totalResults],
  )
}
