import { afterEach, describe, expect, it, vi } from "vitest"

import { GET } from "@/app/api/pexels/search/route"
import * as pexelsServer from "@/features/stock-photos/api/pexels-server"

describe("GET /api/pexels/search", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns 400 when query is missing", async () => {
    const response = await GET(new Request("http://localhost/api/pexels/search"))
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ error: "Search query is required." })
  })

  it("returns 503 when the Pexels API key is missing", async () => {
    vi.spyOn(pexelsServer, "searchPexelsPhotos").mockRejectedValue(
      new pexelsServer.PexelsApiKeyMissingError(),
    )

    const response = await GET(
      new Request("http://localhost/api/pexels/search?query=nature"),
    )

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({
      error: "Pexels API key is not configured.",
    })
  })

  it("forwards search params to the server helper", async () => {
    const searchSpy = vi.spyOn(pexelsServer, "searchPexelsPhotos").mockResolvedValue({
      page: 1,
      perPage: 24,
      totalResults: 1,
      hasMore: false,
      photos: [],
    })

    const response = await GET(
      new Request(
        "http://localhost/api/pexels/search?query=mountains&page=2&per_page=12&orientation=landscape",
      ),
    )

    expect(searchSpy).toHaveBeenCalledWith({
      query: "mountains",
      page: 2,
      perPage: 12,
      orientation: "landscape",
    })
    expect(response.status).toBe(200)
  })
})
