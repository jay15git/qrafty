import { afterEach, describe, expect, it, vi } from "vitest"

import * as iconstackApi from "@/features/qr/assets/iconstack-api"
import {
  filterCuratedIconstackIcons,
  toCuratedSearchResult,
} from "@/features/qr/assets/iconstack-curated"
import {
  clearIconstackSvgCache,
  fetchAndCacheIconstackSvg,
} from "@/features/qr/assets/iconstack-svg-cache"
import { isValidIconstackSvgMarkup } from "@/features/qr/assets/iconstack-svg"

async function loadCuratedPreviewSvgs(library: "all" | "lucide") {
  const curatedIcons = filterCuratedIconstackIcons(library)
  const previewEntries = await Promise.all(
    curatedIcons.map(async (icon) => {
      const result = toCuratedSearchResult(icon)

      try {
        const svg = await fetchAndCacheIconstackSvg({
          library: icon.library,
          id: icon.id,
        })

        if (!isValidIconstackSvgMarkup(svg)) {
          return null
        }

        return [result.id, svg, result] as const
      } catch {
        return null
      }
    }),
  )

  return previewEntries.filter(
    (entry): entry is readonly [string, string, ReturnType<typeof toCuratedSearchResult>] =>
      entry !== null,
  )
}

describe("useIconstackCuratedIcons loading", () => {
  afterEach(() => {
    clearIconstackSvgCache()
    vi.restoreAllMocks()
  })

  it("loads curated icons and reuses the shared svg cache", async () => {
    const fetchMock = vi.spyOn(iconstackApi, "fetchIconSvg").mockResolvedValue({
      fullId: "lucide-link",
      id: "link",
      library: "lucide",
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>',
      url: "https://iconstack.io/icon/lucide/link",
    })

    const firstLoad = await loadCuratedPreviewSvgs("lucide")
    const secondLoad = await loadCuratedPreviewSvgs("lucide")

    expect(firstLoad.length).toBeGreaterThan(0)
    expect(secondLoad).toEqual(firstLoad)
    expect(fetchMock).toHaveBeenCalledTimes(filterCuratedIconstackIcons("lucide").length)
  })
})
