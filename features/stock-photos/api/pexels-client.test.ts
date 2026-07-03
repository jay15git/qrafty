import { afterEach, describe, expect, it, vi } from "vitest"

import {
  fetchCuratedPexelsPhotosClient,
  searchPexelsPhotosClient,
} from "@/features/stock-photos/api/pexels-client"

describe("pexels client", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("requests curated photos from the app API route", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          page: 1,
          perPage: 24,
          totalResults: 1,
          hasMore: false,
          photos: [
            {
              id: 1,
              width: 1000,
              height: 800,
              alt: "Lake",
              photographer: "Alex",
              photographerUrl: "https://www.pexels.com/@alex",
              previewUrl: "https://images.pexels.com/photos/1/medium.jpg",
              imageUrl: "https://images.pexels.com/photos/1/large.jpg",
            },
          ],
        }),
        { status: 200 },
      ),
    )

    const response = await fetchCuratedPexelsPhotosClient({ page: 1, perPage: 24 })

    expect(fetchMock).toHaveBeenCalledWith("/api/pexels/curated?page=1&per_page=24")
    expect(response.photos).toHaveLength(1)
    expect(response.photos[0]?.imageUrl).toContain("/large.jpg")
  })

  it("requests search photos with orientation filter", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          page: 1,
          perPage: 24,
          totalResults: 0,
          hasMore: false,
          photos: [],
        }),
        { status: 200 },
      ),
    )

    await searchPexelsPhotosClient({
      query: "forest",
      page: 2,
      perPage: 12,
      orientation: "portrait",
    })

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/pexels/search?query=forest&page=2&per_page=12&orientation=portrait",
    )
  })

  it("surfaces API error messages from failed responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Pexels API key is not configured." }), {
        status: 503,
      }),
    )

    await expect(fetchCuratedPexelsPhotosClient()).rejects.toThrow(
      "Pexels API key is not configured.",
    )
  })
})
