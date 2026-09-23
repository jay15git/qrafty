"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  IconstackApiError,
  isIconstackAbortError,
  searchIcons,
  type IconstackLibraryId,
  type IconstackSearchResult,
} from "@/features/qr/assets/iconstack-api";

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_INTERVAL_MS = 400;
const MIN_QUERY_LENGTH = 2;
const PAGE_LIMIT = 32;
const MAX_RESULTS = 256;
const API_MAX_OFFSET = 1000;

type UseIconstackIconSearchParams = {
  enabled?: boolean;
  library: IconstackLibraryId | "all";
  query: string;
};

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function mergeResults(previous: IconstackSearchResult[], next: IconstackSearchResult[]) {
  const seen = new Set(previous.map((result) => result.id));
  return [...previous, ...next.filter((result) => !seen.has(result.id))];
}

export function useIconstackIconSearch({
  enabled = true,
  library,
  query,
}: UseIconstackIconSearchParams) {
  const [results, setResults] = useState<IconstackSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<IconstackApiError | null>(null);

  const requestAbortRef = useRef<AbortController | null>(null);
  const lastRequestAtRef = useRef(0);
  const nextOffsetRef = useRef(0);

  const trimmedQuery = query.trim();
  const canSearch = enabled && trimmedQuery.length >= MIN_QUERY_LENGTH;

  const runSearch = useCallback(
    async ({ append = false }: { append?: boolean } = {}) => {
      requestAbortRef.current?.abort();
      const requestController = new AbortController();
      requestAbortRef.current = requestController;
      const requestToken = requestAbortRef.current;

      const offset = append ? nextOffsetRef.current : 0;

      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const waitMs = lastRequestAtRef.current + SEARCH_MIN_INTERVAL_MS - Date.now();

      try {
        if (waitMs > 0) {
          await delay(waitMs);
        }
        if (requestController.signal.aborted) {
          return;
        }
        lastRequestAtRef.current = Date.now();

        const response = await searchIcons({
          q: trimmedQuery,
          library,
          limit: PAGE_LIMIT,
          offset,
          signal: requestController.signal,
        });

        if (requestController.signal.aborted) {
          return;
        }

        nextOffsetRef.current = offset + response.results.length;
        setTotal(response.total);
        setResults((previous) =>
          append ? mergeResults(previous, response.results) : response.results,
        );
      } catch (searchError) {
        if (requestController.signal.aborted || isIconstackAbortError(searchError)) {
          return;
        }

        setError(
          searchError instanceof IconstackApiError
            ? searchError
            : new IconstackApiError("network", "Icon search failed"),
        );
        if (!append) {
          nextOffsetRef.current = 0;
          setResults([]);
          setTotal(0);
        }
      } finally {
        if (requestAbortRef.current === requestToken) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [library, trimmedQuery],
  );

  useEffect(() => {
    if (!canSearch) {
      requestAbortRef.current?.abort();
      requestAbortRef.current = null;
      nextOffsetRef.current = 0;
      setResults([]);
      setTotal(0);
      setIsLoading(false);
      setIsLoadingMore(false);
      setError(null);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void runSearch();
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [canSearch, runSearch]);

  useEffect(() => {
    return () => {
      requestAbortRef.current?.abort();
    };
  }, []);

  const hasMore =
    canSearch &&
    results.length > 0 &&
    results.length < Math.min(total, MAX_RESULTS) &&
    nextOffsetRef.current <= API_MAX_OFFSET;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoading || isLoadingMore) {
      return;
    }
    void runSearch({ append: true });
  }, [hasMore, isLoading, isLoadingMore, runSearch]);

  const retry = useCallback(() => {
    if (!canSearch) {
      return;
    }
    void runSearch();
  }, [canSearch, runSearch]);

  return useMemo(
    () => ({
      canSearch,
      error,
      hasMore,
      isLoading,
      isLoadingMore,
      loadMore,
      results,
      retry,
      total,
    }),
    [canSearch, error, hasMore, isLoading, isLoadingMore, loadMore, results, retry, total],
  );
}
