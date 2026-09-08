import { afterEach, describe, expect, it, vi } from "vitest"

import { preloadRasterImage } from "@/features/workspace/rendering/preload-raster-image"

describe("preloadRasterImage", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("resolves immediately for empty urls", async () => {
    await expect(preloadRasterImage("")).resolves.toBeUndefined()
  })

  it("deduplicates concurrent requests for the same url", async () => {
    const instances: Array<{
      decode: ReturnType<typeof vi.fn>
      onerror: null | (() => void)
      onload: null | (() => void)
      src: string
    }> = []

    class MockImage {
      decode = vi.fn().mockResolvedValue(undefined)
      onerror: null | (() => void) = null
      onload: null | (() => void) = null
      src = ""

      constructor() {
        instances.push(this)
      }
    }

    vi.stubGlobal("Image", MockImage)

    const first = preloadRasterImage("/backgrounds/studio/aqua-glow.webp")
    const second = preloadRasterImage("/backgrounds/studio/aqua-glow.webp")

    instances[0]?.onload?.()

    await expect(Promise.all([first, second])).resolves.toEqual([undefined, undefined])
    expect(instances).toHaveLength(1)
    expect(instances[0]?.decode).toHaveBeenCalledTimes(1)
  })
})
