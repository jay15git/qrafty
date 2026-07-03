/**
 * @vitest-environment jsdom
 */

import { createElement, useEffect, act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const fetchCuratedPexelsPhotosClient = vi.fn()
const searchPexelsPhotosClient = vi.fn()

vi.mock("@/features/stock-photos/api/pexels-client", () => ({
  fetchCuratedPexelsPhotosClient,
  searchPexelsPhotosClient,
}))

type UsePexelsPhotos = typeof import("@/features/stock-photos/hooks/usePexelsPhotos").usePexelsPhotos
type HookResult = ReturnType<UsePexelsPhotos>

async function loadHook() {
  const module = await import("@/features/stock-photos/hooks/usePexelsPhotos")
  return module.usePexelsPhotos
}

function renderPexelsHook(usePexelsPhotos: UsePexelsPhotos, props: Parameters<UsePexelsPhotos>[0]) {
  const container = document.createElement("div")
  const root: Root = createRoot(container)
  const state: { current: HookResult | null } = { current: null }

  function Probe() {
    const result = usePexelsPhotos(props)
    useEffect(() => {
      state.current = result
    }, [result])
    return null
  }

  act(() => {
    root.render(createElement(Probe))
  })

  return {
    get result() {
      return state.current
    },
    unmount() {
      act(() => {
        root.unmount()
      })
    },
  }
}

describe("usePexelsPhotos", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    fetchCuratedPexelsPhotosClient.mockResolvedValue({
      page: 1,
      perPage: 24,
      totalResults: 1,
      hasMore: false,
      photos: [
        {
          id: 1,
          width: 1200,
          height: 800,
          alt: "Curated",
          photographer: "Curator",
          photographerUrl: "https://www.pexels.com/@curator",
          previewUrl: "https://images.pexels.com/photos/1/medium.jpg",
          imageUrl: "https://images.pexels.com/photos/1/large.jpg",
        },
      ],
    })
    searchPexelsPhotosClient.mockResolvedValue({
      page: 1,
      perPage: 24,
      totalResults: 1,
      hasMore: false,
      photos: [
        {
          id: 2,
          width: 1200,
          height: 800,
          alt: "Search",
          photographer: "Searcher",
          photographerUrl: "https://www.pexels.com/@searcher",
          previewUrl: "https://images.pexels.com/photos/2/medium.jpg",
          imageUrl: "https://images.pexels.com/photos/2/large.jpg",
        },
      ],
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it("loads curated photos when the query is too short", async () => {
    const usePexelsPhotos = await loadHook()
    const harness = renderPexelsHook(usePexelsPhotos, { orientation: "all", query: "" })

    await act(async () => {
      await vi.runOnlyPendingTimersAsync()
    })

    expect(fetchCuratedPexelsPhotosClient).toHaveBeenCalledTimes(1)
    expect(searchPexelsPhotosClient).not.toHaveBeenCalled()
    expect(harness.result?.photos[0]?.id).toBe(1)

    harness.unmount()
  })

  it("debounces search requests once the query is long enough", async () => {
    const usePexelsPhotos = await loadHook()
    const harness = renderPexelsHook(usePexelsPhotos, { orientation: "all", query: "lake" })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(299)
    })
    expect(searchPexelsPhotosClient).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })

    expect(searchPexelsPhotosClient).toHaveBeenCalledWith({
      query: "lake",
      page: 1,
      perPage: 24,
      orientation: "all",
    })
    expect(harness.result?.photos[0]?.id).toBe(2)

    harness.unmount()
  })
})
