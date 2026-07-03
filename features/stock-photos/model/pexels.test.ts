import { describe, expect, it } from "vitest"

import {
  normalizePexelsPhoto,
  normalizePexelsPhotosResponse,
  type PexelsApiPhoto,
} from "@/features/stock-photos/model/pexels"

const sampleApiPhoto: PexelsApiPhoto = {
  id: 42,
  width: 4000,
  height: 3000,
  alt: "Mountain lake",
  photographer: "Jane Doe",
  photographer_url: "https://www.pexels.com/@jane",
  url: "https://www.pexels.com/photo/mountain-lake-42/",
  src: {
    original: "https://images.pexels.com/photos/42/original.jpg",
    large2x: "https://images.pexels.com/photos/42/large2x.jpg",
    large: "https://images.pexels.com/photos/42/large.jpg",
    medium: "https://images.pexels.com/photos/42/medium.jpg",
    small: "https://images.pexels.com/photos/42/small.jpg",
    portrait: "https://images.pexels.com/photos/42/portrait.jpg",
    landscape: "https://images.pexels.com/photos/42/landscape.jpg",
    tiny: "https://images.pexels.com/photos/42/tiny.jpg",
  },
}

describe("pexels model", () => {
  it("normalizes API photos into client photo shape", () => {
    expect(normalizePexelsPhoto(sampleApiPhoto)).toEqual({
      id: 42,
      width: 4000,
      height: 3000,
      alt: "Mountain lake",
      photographer: "Jane Doe",
      photographerUrl: "https://www.pexels.com/@jane",
      previewUrl: "https://images.pexels.com/photos/42/medium.jpg",
      imageUrl: "https://images.pexels.com/photos/42/large.jpg",
    })
  })

  it("falls back to photographer-based alt text when alt is empty", () => {
    expect(
      normalizePexelsPhoto({
        ...sampleApiPhoto,
        alt: "",
      }).alt,
    ).toBe("Photo by Jane Doe")
  })

  it("normalizes search responses with pagination metadata", () => {
    expect(
      normalizePexelsPhotosResponse(
        {
          page: 2,
          per_page: 24,
          total_results: 100,
          next_page: "https://api.pexels.com/v1/search?page=3",
          photos: [sampleApiPhoto],
        },
        { totalResults: 100 },
      ),
    ).toEqual({
      page: 2,
      perPage: 24,
      totalResults: 100,
      hasMore: true,
      photos: [normalizePexelsPhoto(sampleApiPhoto)],
    })
  })
})
