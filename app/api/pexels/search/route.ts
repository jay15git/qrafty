import { NextResponse } from "next/server"

import {
  PexelsApiKeyMissingError,
  PexelsApiRequestError,
  parsePexelsOrientationFilter,
  searchPexelsPhotos,
} from "@/features/stock-photos/api/pexels-server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")?.trim() ?? ""

  if (!query) {
    return NextResponse.json({ error: "Search query is required." }, { status: 400 })
  }

  const page = Number(searchParams.get("page") ?? "1")
  const perPage = Number(searchParams.get("per_page") ?? "24")
  const orientation = parsePexelsOrientationFilter(searchParams.get("orientation"))

  try {
    const payload = await searchPexelsPhotos({
      query,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      perPage: Number.isFinite(perPage) && perPage > 0 ? perPage : 24,
      orientation,
    })

    return NextResponse.json(payload)
  } catch (error) {
    if (error instanceof PexelsApiKeyMissingError) {
      return NextResponse.json({ error: error.message }, { status: 503 })
    }

    if (error instanceof PexelsApiRequestError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({ error: "Pexels search failed." }, { status: 500 })
  }
}
