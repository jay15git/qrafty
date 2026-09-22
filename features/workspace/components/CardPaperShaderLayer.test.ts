import { describe, expect, it } from "vitest"

import { resolveShaderPlaybackVisible } from "@/features/workspace/components/card-paper-shader.utils"

describe("resolveShaderPlaybackVisible", () => {
  it("forces visible playback when visibility gate is ignored", () => {
    expect(resolveShaderPlaybackVisible(false, true)).toBe(true)
  })

  it("respects intersection observer visibility by default", () => {
    expect(resolveShaderPlaybackVisible(false, false)).toBe(false)
    expect(resolveShaderPlaybackVisible(true)).toBe(true)
  })
})
