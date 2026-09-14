import { scheduleIconstackRequest } from "@/features/qr-code/assets/iconstack-rate-limit"
import { isValidIconstackSvgMarkup, normalizeIconstackSvgMarkup } from "@/features/qr-code/assets/iconstack-svg"

export const ICONSTACK_API_BASE =
  "https://sglpxftkuzsqdpdhftwv.supabase.co/functions/v1"

export const ICONSTACK_SELECTION_PREFIX = "iconstack:"

export const ICONSTACK_LIBRARIES = [
  { id: "tabler", label: "Tabler" },
  { id: "lucide", label: "Lucide" },
  { id: "feather", label: "Feather" },
  { id: "heroicons", label: "Heroicons" },
  { id: "phosphor", label: "Phosphor" },
  { id: "material", label: "Material Design" },
  { id: "fluent", label: "Fluent UI" },
  { id: "bootstrap", label: "Bootstrap" },
  { id: "solar", label: "Solar" },
  { id: "iconsax", label: "Iconsax" },
  { id: "radix", label: "Radix" },
  { id: "line", label: "Line" },
  { id: "pixelart", label: "Pixel Art" },
  { id: "hugeicon", label: "Huge Icons" },
  { id: "mingcute", label: "Mingcute" },
  { id: "carbon", label: "Carbon" },
  { id: "iconamoon", label: "Iconamoon" },
  { id: "iconoir", label: "Iconoir" },
  { id: "majesticons", label: "Majesticon" },
  { id: "octicons", label: "Octicons" },
  { id: "simple", label: "Simple Icons" },
] as const

export type IconstackLibraryId = (typeof ICONSTACK_LIBRARIES)[number]["id"]

export type IconstackSearchResult = {
  id: string
  name: string
  library: string
  libraryName: string
  category: string | null
  tags: string[]
  style: string
  url: string
  score?: number
}

export type IconstackSearchResponse = {
  query: string
  total: number
  limit: number
  offset: number
  results: IconstackSearchResult[]
}

export type IconstackSvgResponse = {
  library: string
  id: string
  fullId: string
  svg: string
  url: string
}

export type IconstackSearchParams = {
  q: string
  library?: IconstackLibraryId | "all"
  style?: "outline" | "filled"
  limit?: number
  offset?: number
}

export function toIconstackSelectionId(result: Pick<IconstackSearchResult, "library" | "id">) {
  const iconId = parseIconstackResultIconId(result)
  return `${ICONSTACK_SELECTION_PREFIX}${result.library}:${iconId}`
}

export function parseIconstackResultIconId(result: Pick<IconstackSearchResult, "library" | "id">) {
  const prefix = `${result.library}-`
  if (result.id.startsWith(prefix)) {
    return result.id.slice(prefix.length)
  }

  return result.id
}

export function parseIconstackSelectionId(
  selectionId?: string,
): { library: string; iconId: string } | null {
  if (!selectionId?.startsWith(ICONSTACK_SELECTION_PREFIX)) {
    return null
  }

  const payload = selectionId.slice(ICONSTACK_SELECTION_PREFIX.length)
  const separatorIndex = payload.indexOf(":")

  if (separatorIndex <= 0 || separatorIndex === payload.length - 1) {
    return null
  }

  return {
    library: payload.slice(0, separatorIndex),
    iconId: payload.slice(separatorIndex + 1),
  }
}

const RETRY_DELAY_MS = 500
const SEARCH_CACHE_LIMIT = 60

const searchCache = new Map<string, Promise<IconstackSearchResponse>>()

export function clearIconstackSearchCache() {
  searchCache.clear()
}

function isRetryableStatus(status: number) {
  return status === 429 || status >= 500
}

async function fetchIconstack(url: string, errorLabel: string) {
  let lastError: unknown

  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (attempt > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
    }

    try {
      const response = await scheduleIconstackRequest(() => fetch(url))

      if (response.ok) {
        return response
      }

      lastError = new Error(`${errorLabel} (${response.status})`)

      if (!isRetryableStatus(response.status)) {
        break
      }
    } catch (error) {
      lastError = error
    }
  }

  throw lastError
}

export async function searchIcons({
  q,
  library,
  style,
  limit = 24,
  offset = 0,
}: IconstackSearchParams): Promise<IconstackSearchResponse> {
  const params = new URLSearchParams({
    q: q.trim(),
    limit: String(limit),
    offset: String(offset),
  })

  if (library && library !== "all") {
    params.set("library", library)
  }

  if (style) {
    params.set("style", style)
  }

  const cacheKey = params.toString()
  const cached = searchCache.get(cacheKey)

  if (cached) {
    return cached
  }

  const request = fetchIconstack(
    `${ICONSTACK_API_BASE}/icon-search?${cacheKey}`,
    "Iconstack search failed",
  ).then(async (response) => (await response.json()) as IconstackSearchResponse)

  searchCache.set(cacheKey, request)

  if (searchCache.size > SEARCH_CACHE_LIMIT) {
    const oldestKey = searchCache.keys().next().value
    if (oldestKey !== undefined) {
      searchCache.delete(oldestKey)
    }
  }

  try {
    return await request
  } catch (error) {
    searchCache.delete(cacheKey)
    throw error
  }
}

export async function fetchIconSvg({
  library,
  id,
}: {
  library: string
  id: string
}): Promise<IconstackSvgResponse> {
  const params = new URLSearchParams({ library, id })
  const response = await fetchIconstack(
    `${ICONSTACK_API_BASE}/icon-svg?${params.toString()}`,
    "Iconstack SVG fetch failed",
  )

  const payload = (await response.json()) as IconstackSvgResponse
  const svg = normalizeIconstackSvgMarkup(payload.svg ?? "")

  if (!isValidIconstackSvgMarkup(svg)) {
    throw new Error(`Iconstack SVG fetch returned invalid markup for ${library}/${id}`)
  }

  return {
    ...payload,
    svg,
  }
}
