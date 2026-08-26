import {
  LIVE_PAPER_SHADER_MAX_PIXEL_COUNT,
  LIVE_PAPER_SHADER_MIN_PIXEL_RATIO,
  LIVE_PAPER_SHADER_WEBGL_CONTEXT_ATTRIBUTES,
} from "@new-qr/qr-internal/scene"

const MOBILE_PREVIEW_MAX_PIXEL_COUNT = 1280 * 720

export type LivePaperShaderRenderOptions = {
  maxPixelCount: number
  minPixelRatio: number
  webGlContextAttributes: {
    alpha: boolean
    antialias: boolean
    depth: boolean
    preserveDrawingBuffer: boolean
    powerPreference: WebGLPowerPreference
    stencil: boolean
  }
}

export function getLivePaperShaderRenderOptions(input?: {
  displayHeight?: number
  displayWidth?: number
  preferLowPower?: boolean
}): LivePaperShaderRenderOptions {
  const preferLowPower = input?.preferLowPower ?? false
  const displayWidth = input?.displayWidth
  const displayHeight = input?.displayHeight
  const displayPixelCount =
    displayWidth && displayHeight && displayWidth > 0 && displayHeight > 0
      ? displayWidth * displayHeight
      : MOBILE_PREVIEW_MAX_PIXEL_COUNT

  if (!preferLowPower) {
    return {
      maxPixelCount: LIVE_PAPER_SHADER_MAX_PIXEL_COUNT,
      minPixelRatio: LIVE_PAPER_SHADER_MIN_PIXEL_RATIO,
      webGlContextAttributes: LIVE_PAPER_SHADER_WEBGL_CONTEXT_ATTRIBUTES,
    }
  }

  return {
    maxPixelCount: Math.min(displayPixelCount, MOBILE_PREVIEW_MAX_PIXEL_COUNT),
    minPixelRatio: 1,
    webGlContextAttributes: {
      ...LIVE_PAPER_SHADER_WEBGL_CONTEXT_ATTRIBUTES,
      powerPreference: "low-power",
    },
  }
}
