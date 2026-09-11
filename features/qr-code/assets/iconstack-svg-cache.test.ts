import { afterEach, describe, expect, it, vi } from "vitest"

import * as iconstackApi from "@/features/qr-code/assets/iconstack-api"
import {
  clearIconstackSvgCache,
  fetchAndCacheIconstackSvg,
  getCachedIconstackSvg,
  getIconstackSelectionCacheKey,
  listCachedIconstackSelectionIds,
  subscribeIconstackSvgCache,
} from "@/features/qr-code/assets/iconstack-svg-cache"

describe("iconstack-svg-cache", () => {
  afterEach(() => {
    clearIconstackSvgCache()
    vi.restoreAllMocks()
  })

  it("builds stable selection cache keys", () => {
    expect(getIconstackSelectionCacheKey("lucide", "link")).toBe("iconstack:lucide:link")
  })

  it("reuses cached svg markup across fetches", async () => {
    const fetchMock = vi.spyOn(iconstackApi, "fetchIconSvg").mockResolvedValue({
      fullId: "lucide-link",
      id: "link",
      library: "lucide",
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>',
      url: "https://iconstack.io/icon/lucide/link",
    })

    const first = await fetchAndCacheIconstackSvg({ id: "link", library: "lucide" })
    const second = await fetchAndCacheIconstackSvg({ id: "link", library: "lucide" })

    expect(first).toContain("<svg")
    expect(second).toBe(first)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(getCachedIconstackSvg("iconstack:lucide:link")).toBe(first)
  })

  it("lists cached selection ids and notifies subscribers", async () => {
    const listener = vi.fn()
    const unsubscribe = subscribeIconstackSvgCache(listener)

    expect(listCachedIconstackSelectionIds()).toEqual([])

    vi.spyOn(iconstackApi, "fetchIconSvg").mockResolvedValue({
      fullId: "lucide-link",
      id: "link",
      library: "lucide",
      svg: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>',
      url: "https://iconstack.io/icon/lucide/link",
    })

    await fetchAndCacheIconstackSvg({ id: "link", library: "lucide" })

    expect(listCachedIconstackSelectionIds()).toEqual(["iconstack:lucide:link"])
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    clearIconstackSvgCache()
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
