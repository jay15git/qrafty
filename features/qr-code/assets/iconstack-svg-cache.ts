import {
  fetchIconSvg,
  ICONSTACK_SELECTION_PREFIX,
} from "@/features/qr-code/assets/iconstack-api"
import { enqueueIconstackRequest } from "@/features/qr-code/assets/iconstack-request-queue"

const iconstackSvgCache = new Map<string, string>()
const iconstackSvgCacheListeners = new Set<() => void>()
const EMPTY_CACHED_SELECTION_IDS: readonly string[] = []
let cachedSelectionIdsSnapshot: readonly string[] = EMPTY_CACHED_SELECTION_IDS

function syncCachedSelectionIdsSnapshot() {
  cachedSelectionIdsSnapshot =
    iconstackSvgCache.size === 0
      ? EMPTY_CACHED_SELECTION_IDS
      : Array.from(iconstackSvgCache.keys())
}

function notifyIconstackSvgCacheListeners() {
  syncCachedSelectionIdsSnapshot()

  for (const listener of iconstackSvgCacheListeners) {
    listener()
  }
}

export function getIconstackSelectionCacheKey(library: string, iconId: string) {
  return `${ICONSTACK_SELECTION_PREFIX}${library}:${iconId}`
}

export function getCachedIconstackSvg(selectionId: string) {
  return iconstackSvgCache.get(selectionId)
}

export function listCachedIconstackSelectionIds() {
  return cachedSelectionIdsSnapshot
}

export function subscribeIconstackSvgCache(listener: () => void) {
  iconstackSvgCacheListeners.add(listener)

  return () => {
    iconstackSvgCacheListeners.delete(listener)
  }
}

function setCachedIconstackSvg(selectionId: string, svg: string) {
  iconstackSvgCache.set(selectionId, svg)
  notifyIconstackSvgCacheListeners()
}

export function clearIconstackSvgCache() {
  iconstackSvgCache.clear()
  notifyIconstackSvgCacheListeners()
}

export async function fetchAndCacheIconstackSvg({
  library,
  id,
}: {
  library: string
  id: string
}) {
  const selectionId = getIconstackSelectionCacheKey(library, id)
  const cached = getCachedIconstackSvg(selectionId)

  if (cached) {
    return cached
  }

  return enqueueIconstackRequest(`svg:${selectionId}`, async () => {
    const response = await fetchIconSvg({ library, id })
    setCachedIconstackSvg(selectionId, response.svg)
    return response.svg
  })
}
