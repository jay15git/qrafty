import { describe, expect, it } from "vitest"

import {
  getLivePaperShaderRenderOptions,
  getMotionShaderFillRenderOptions,
} from "@/features/workspace/preview/preview-shader-budget"

describe("preview shader budget", () => {
  it("enables preserveDrawingBuffer for motion shader fill capture", () => {
    const live = getLivePaperShaderRenderOptions()
    const motion = getMotionShaderFillRenderOptions({ displayWidth: 320, displayHeight: 320 })

    expect(live.webGlContextAttributes.preserveDrawingBuffer).toBe(false)
    expect(motion.webGlContextAttributes.preserveDrawingBuffer).toBe(true)
    expect(motion.maxPixelCount).toBe(live.maxPixelCount)
  })
})
