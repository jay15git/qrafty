import type {
  PexelsCuratedParams,
  PexelsPhotosResponse,
  PexelsSearchParams,
} from "@/features/stock-photos/model/pexels"

async function readPexelsApiResponse(response: Response): Promise<PexelsPhotosResponse> {
  if (!response.ok) {
    let message = `Pexels request failed (${response.status}).`

    try {
      const payload = (await response.json()) as { error?: string }
      if (payload.error) {
        message = payload.error
      }
    } catch {
      // Keep default message when response body is not JSON.
    }

    throw new Error(message)
  }

  return (await response.json()) as PexelsPhotosResponse
}

export async function searchPexelsPhotosClient({
  query,
  page = 1,
  perPage = 24,
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

  const response = await fetch(`/api/pexels/search?${params.toString()}`)
  return readPexelsApiResponse(response)
}

export async function fetchCuratedPexelsPhotosClient({
  page = 1,
  perPage = 24,
}: PexelsCuratedParams = {}): Promise<PexelsPhotosResponse> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  })

  const response = await fetch(`/api/pexels/curated?${params.toString()}`)
  return readPexelsApiResponse(response)
}
