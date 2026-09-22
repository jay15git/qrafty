import { afterEach, describe, expect, it, vi } from "vitest"

import {
  fetchIconSvg,
  getIconstackErrorMessage,
  ICONSTACK_API_BASE,
  ICONSTACK_SEARCH_PATH,
  IconstackApiError,
  isIconstackAbortError,
  parseIconstackResultIconId,
  parseIconstackSelectionId,
  searchIcons,
  toIconstackSelectionId,
} from "@/features/qr/assets/iconstack-api"

describe("iconstack-api", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("encodes and decodes iconstack selection ids", () => {
    const result = {
      id: "lucide-user",
      library: "lucide",
    }

    expect(toIconstackSelectionId(result)).toBe("iconstack:lucide:user")
    expect(parseIconstackSelectionId("iconstack:lucide:user")).toEqual({
      library: "lucide",
      iconId: "user",
    })
    expect(parseIconstackSelectionId("whatsapp")).toBeNull()
  })

  it("parses icon ids from search results", () => {
    expect(
      parseIconstackResultIconId({
        id: "tabler-heart",
        library: "tabler",
      }),
    ).toBe("heart")
  })

  it("searches icons with optional library filter", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          query: "heart",
          total: 1,
          limit: 24,
          offset: 0,
          results: [
            {
              id: "lucide-heart",
              name: "Heart",
              library: "lucide",
              libraryName: "Lucide",
              category: "shapes",
              tags: ["heart"],
              style: "outline",
              url: "https://iconstack.io/icon/lucide/heart",
            },
          ],
        }),
        { status: 200 },
      ),
    )

    const response = await searchIcons({ q: "heart", library: "lucide", limit: 24 })

    expect(fetchMock).toHaveBeenCalledWith(
      `${ICONSTACK_SEARCH_PATH}?q=heart&limit=24&offset=0&library=lucide`,
      { signal: expect.any(AbortSignal) },
    )
    expect(response.results).toHaveLength(1)
    expect(response.results[0]?.name).toBe("Heart")
  })

  it("fetches svg markup for a library icon", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          library: "lucide",
          id: "heart",
          fullId: "lucide-heart",
          svg: '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>',
          url: "https://iconstack.io/icon/lucide/heart",
        }),
        { status: 200 },
      ),
    )

    const response = await fetchIconSvg({ library: "lucide", id: "heart" })

    expect(fetchMock).toHaveBeenCalledWith(
      `${ICONSTACK_API_BASE}/icon-svg?library=lucide&id=heart`,
      { signal: expect.any(AbortSignal) },
    )
    expect(response.svg).toContain("<svg")
    expect(response.svg).toContain("<path")
  })

  it("rejects with a typed http error on non-ok responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("nope", { status: 500 }),
    )

    const error = await searchIcons({ q: "heart" }).catch(
      (caught: unknown) => caught,
    )

    expect(error).toBeInstanceOf(IconstackApiError)
    expect((error as IconstackApiError).kind).toBe("http")
    expect((error as IconstackApiError).status).toBe(500)
    expect(getIconstackErrorMessage(error)).toBe("Icon service unavailable")
  })

  it("rejects with a typed aborted error when the caller aborts", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal
          signal?.addEventListener("abort", () => {
            reject(signal.reason)
          })
        }),
    )

    const controller = new AbortController()
    const pending = searchIcons({ q: "heart", signal: controller.signal })
    controller.abort()

    const error = await pending.catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(IconstackApiError)
    expect(isIconstackAbortError(error)).toBe(true)
  })

  it("rejects with a typed timeout error when the request stalls", async () => {
    vi.useFakeTimers()
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal
          signal?.addEventListener("abort", () => {
            reject(signal.reason)
          })
        }),
    )

    const pending = searchIcons({ q: "heart" })
    const assertion = expect(pending).rejects.toMatchObject({
      kind: "timeout",
      name: "IconstackApiError",
    })
    await vi.advanceTimersByTimeAsync(10_000)
    await assertion
    vi.useRealTimers()
  })
})
