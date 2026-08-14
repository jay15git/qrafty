import {
  normalizePexelsPhotosResponse,
  type PexelsApiPhotosPayload,
  type PexelsCuratedParams,
  type PexelsPhotoOrientationFilter,
  type PexelsPhotosResponse,
  type PexelsSearchParams,
} from "@/features/stock-photos/model/pexels"

const PEXELS_API_BASE = "https://api.pexels.com/v1"
const DEFAULT_PER_PAGE = 24

function getPexelsApiKey() {
  return process.env.PEXELS_API_KEY?.trim() ?? ""
}

async function fetchPexelsApi(path: string, searchParams?: URLSearchParams) {
  const apiKey = getPexelsApiKey()

  if (!apiKey) {
    throw new PexelsApiKeyMissingError()
  }

  const query = searchParams?.toString()
  const url = query ? `${PEXELS_API_BASE}${path}?${query}` : `${PEXELS_API_BASE}${path}`

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    throw new PexelsApiRequestError(response.status)
  }

  return (await response.json()) as PexelsApiPhotosPayload
}

export class PexelsApiKeyMissingError extends Error {
  constructor() {
    super("Pexels API key is not configured.")
    this.name = "PexelsApiKeyMissingError"
  }
}

export class PexelsApiRequestError extends Error {
  status: number

  constructor(status: number) {
    super(`Pexels API request failed (${status}).`)
    this.name = "PexelsApiRequestError"
    this.status = status
  }
}

export async function searchPexelsPhotos({
  query,
  page = 1,
  perPage = DEFAULT_PER_PAGE,
  orientation = "all",
}: PexelsSearchParams): Promise<PexelsPhotosResponse> {
  const params = new URLSearchParams({
    query: query.trim(),
    page: String(page),
    per_page: String(perPage),
  })

  if (orientation !== "all") {
    params.set("orientation", orientation)
  }

  const payload = await fetchPexelsApi("/search", params)

  return normalizePexelsPhotosResponse(payload, {
    totalResults: payload.total_results,
  })
}

export async function fetchCuratedPexelsPhotos({
  page = 1,
  perPage = DEFAULT_PER_PAGE,
}: PexelsCuratedParams = {}): Promise<PexelsPhotosResponse> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })

  const payload = await fetchPexelsApi("/curated", params)

  return normalizePexelsPhotosResponse(payload)
}

export function parsePexelsOrientationFilter(
  value: string | null,
): PexelsPhotoOrientationFilter {
  if (value === "landscape" || value === "portrait" || value === "square") {
    return value
  }

  return "all"
}
