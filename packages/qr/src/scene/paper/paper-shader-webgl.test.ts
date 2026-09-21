import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"

beforeEach(() => {
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function stubWebGlDocument({
  getContextImpl,
  liveCanvas = false,
}: {
  getContextImpl?: ReturnType<typeof vi.fn>
  liveCanvas?: boolean
} = {}) {
  const loseContext = vi.fn()
  const getExtension = vi.fn(() => ({ loseContext }))
  const getContext =
    getContextImpl ??
    vi.fn(() => ({
      getExtension,
    }))
  const canvas = { getContext }
  const createElement = vi.fn((tag: string) => (tag === "canvas" ? canvas : {}))
  const querySelector = vi.fn((selector: string) => {
    if (liveCanvas && selector.includes("data-shader-canvas-host")) {
      return {}
    }

    return null
  })

  vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0" })
  vi.stubGlobal("document", {
    createElement,
    querySelector,
  })

  return { createElement, getContext, loseContext, querySelector }
}

describe("hasPaperShaderWebGlSupport", () => {
  it("probes once then returns the cached result", async () => {
    const { hasPaperShaderWebGlSupport } = await import("./paper-shader-webgl")
    const { createElement, getContext, loseContext } = stubWebGlDocument()

    expect(hasPaperShaderWebGlSupport()).toBe(true)
    expect(hasPaperShaderWebGlSupport()).toBe(true)
    expect(createElement).toHaveBeenCalledTimes(1)
    expect(getContext).toHaveBeenCalledTimes(1)
    expect(loseContext).toHaveBeenCalledTimes(1)
  })

  it("skips probing when a live shader canvas already exists", async () => {
    const { hasPaperShaderWebGlSupport } = await import("./paper-shader-webgl")
    const { createElement } = stubWebGlDocument({ liveCanvas: true })

    expect(hasPaperShaderWebGlSupport()).toBe(true)
    expect(createElement).not.toHaveBeenCalled()
  })

  it("does not cache a failed probe", async () => {
    const { hasPaperShaderWebGlSupport } = await import("./paper-shader-webgl")
    const { createElement } = stubWebGlDocument({
      getContextImpl: vi.fn(() => null),
    })

    expect(hasPaperShaderWebGlSupport()).toBe(false)
    expect(hasPaperShaderWebGlSupport()).toBe(false)
    expect(createElement).toHaveBeenCalledTimes(2)
  })
})
