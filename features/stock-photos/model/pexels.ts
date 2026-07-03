export type PexelsPhotoOrientation = "landscape" | "portrait" | "square"

export type PexelsPhotoOrientationFilter = PexelsPhotoOrientation | "all"

export const PEXELS_ORIENTATION_FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Landscape", value: "landscape" },
  { label: "Portrait", value: "portrait" },
  { label: "Square", value: "square" },
] as const satisfies ReadonlyArray<{
  label: string
  value: PexelsPhotoOrientationFilter
}>

export type PexelsPhoto = {
  id: number
  width: number
  height: number
  alt: string
  photographer: string
  photographerUrl: string
  previewUrl: string
  imageUrl: string
}

export type PexelsPhotosResponse = {
  page: number
  perPage: number
  totalResults: number
  hasMore: boolean
  photos: PexelsPhoto[]
}

export type PexelsSearchParams = {
  query: string
  page?: number
  perPage?: number
  orientation?: PexelsPhotoOrientationFilter
}

export type PexelsCuratedParams = {
  page?: number
  perPage?: number
}

export type PexelsApiPhotoSrc = {
  original: string
  large2x: string
  large: string
  medium: string
  small: string
  portrait: string
  landscape: string
  tiny: string
}

export type PexelsApiPhoto = {
  id: number
  width: number
  height: number
  alt: string
  photographer: string
  photographer_url: string
  url: string
  src: PexelsApiPhotoSrc
}

export type PexelsApiPhotosPayload = {
  page: number
  per_page: number
  photos: PexelsApiPhoto[]
  total_results?: number
  next_page?: string
}

export function normalizePexelsPhoto(photo: PexelsApiPhoto): PexelsPhoto {
  return {
    id: photo.id,
    width: photo.width,
    height: photo.height,
    alt: photo.alt || `Photo by ${photo.photographer}`,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    previewUrl: photo.src.medium,
    imageUrl: photo.src.large,
  }
}

export function normalizePexelsPhotosResponse(
  payload: PexelsApiPhotosPayload,
  options?: { totalResults?: number },
): PexelsPhotosResponse {
  const totalResults = options?.totalResults ?? payload.total_results ?? payload.photos.length
  const loadedCount = (payload.page - 1) * payload.per_page + payload.photos.length

  return {
    page: payload.page,
    perPage: payload.per_page,
    totalResults,
    hasMore: Boolean(payload.next_page) || loadedCount < totalResults,
    photos: payload.photos.map(normalizePexelsPhoto),
  }
}
