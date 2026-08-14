import {
  fetchIconSvg,
  ICONSTACK_SELECTION_PREFIX,
} from "@/features/qr-code/assets/iconstack-api"

const iconstackSvgCache = new Map<string, string>()

export function getIconstackSelectionCacheKey(library: string, iconId: string) {
  return `${ICONSTACK_SELECTION_PREFIX}${library}:${iconId}`
}

export function getCachedIconstackSvg(selectionId: string) {
  return iconstackSvgCache.get(selectionId)
}

function setCachedIconstackSvg(selectionId: string, svg: string) {
  iconstackSvgCache.set(selectionId, svg)
}

export function clearIconstackSvgCache() {
  iconstackSvgCache.clear()
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

  const response = await fetchIconSvg({ library, id })
  setCachedIconstackSvg(selectionId, response.svg)
  return response.svg
}
