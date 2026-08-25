import { describe, expect, it } from "vitest"

import { createDefaultQrStudioState } from "@/features/qr-code/model/state"
import { createDefaultDraftingCardState } from "@/features/workspace/model/card-state"
import {
  frameIndexToTimeMs,
  isQrTimeVarying,
  isShaderTimeVarying,
  resolveQrExportTimeMs,
  resolveShaderExportFrameMs,
  sceneHasVideoExportContent,
} from "@/features/workspace/export/pipeline/clock"

describe("export clock", () => {
  it("maps frame indices to milliseconds", () => {
    expect(frameIndexToTimeMs(0, 30)).toBe(0)
    expect(frameIndexToTimeMs(30, 30)).toBe(1000)
    expect(frameIndexToTimeMs(1, 60)).toBeCloseTo(16.666, 2)
  })

  it("uses live shader frame for photo exports when paused", () => {
    expect(
      resolveShaderExportFrameMs(
        { frame: 4200, paused: true, speed: 0 },
        "photo",
        0,
      ),
    ).toBe(4200)
  })

  it("uses video clock for shader exports in video mode", () => {
    expect(
      resolveShaderExportFrameMs(
        { frame: 4200, paused: false, speed: 1 },
        "video",
        250,
      ),
    ).toBe(250)
  })

  it("detects time-varying QR and shader scenes", () => {
    const state = createDefaultQrStudioState()
    state.dotMatrixAnimation.enabled = true
    state.dotMatrixAnimation.animated = true

    const cardState = createDefaultDraftingCardState()
    cardState.paperShader.paused = false
    cardState.paperShader.speed = 1

    expect(isQrTimeVarying(state)).toBe(true)
    expect(isShaderTimeVarying(cardState.paperShader)).toBe(true)
    expect(sceneHasVideoExportContent(cardState, [], state)).toBe(true)
  })

  it("scales QR export time by animation speed in video mode", () => {
    const state = createDefaultQrStudioState()
    state.dotMatrixAnimation.enabled = true
    state.dotMatrixAnimation.animated = true
    state.dotMatrixAnimation.speed = 2

    expect(resolveQrExportTimeMs(state, "video", 500)).toBe(1000)
  })
})
