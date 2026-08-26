import { describe, expect, it } from "vitest"

import {
  getPreviewCameraStyle,
  getPreviewDisplaySize,
  getPreviewStageSize,
  scalePreviewCornerRadiiState,
} from "@/features/workspace/preview/preview-camera"
import { getLivePaperShaderRenderOptions } from "@/features/workspace/preview/preview-shader-budget"

describe("preview camera", () => {
  it("maps document artboard to view-sized stage", () => {
    expect(getPreviewStageSize(1080, 1080, 0.35)).toEqual({
      width: 378,
      height: 378,
    })
  })

  it("keeps document geometry in camera while scaling to view", () => {
    expect(getPreviewCameraStyle(1080, 720, 0.5)).toEqual({
      width: 1080,
      height: 720,
      transform: "scale(0.5)",
      transformOrigin: "top left",
    })
  })

  it("scales corner radii for stage clipping", () => {
    expect(
      scalePreviewCornerRadiiState(
        { topLeft: 28, topRight: 28, bottomLeft: 28, bottomRight: 28 },
        0.5,
      ),
    ).toEqual({
      topLeft: 14,
      topRight: 14,
      bottomLeft: 14,
      bottomRight: 14,
    })
  })

  it("derives on-screen shader display size from document size", () => {
    expect(getPreviewDisplaySize(1080, 0.35)).toBe(378)
  })
})

describe("preview shader budget", () => {
  it("uses low-power mobile pixel caps", () => {
    expect(
      getLivePaperShaderRenderOptions({
        preferLowPower: true,
        displayWidth: 360,
        displayHeight: 360,
      }),
    ).toMatchObject({
      minPixelRatio: 1,
      maxPixelCount: 360 * 360,
      webGlContextAttributes: {
        powerPreference: "low-power",
      },
    })
  })
})
