/**
 * Live / studio defaults from Paper Shaders performance guide:
 * https://paper-design-shaders.mintlify.app/guides/performance
 *
 * Viewport pause + concurrent caps are editor-host concerns — do not gate
 * `speed` here or canvas shaders appear frozen.
 */

/** Guide: minPixelRatio 1 is fastest; enough for canvas editing. */
export const LIVE_PAPER_SHADER_MIN_PIXEL_RATIO = 1

/**
 * Guide: lower maxPixelCount for better performance.
 * 1080p×2 ≈ soft cap without crushing grain/dither.
 */
export const LIVE_PAPER_SHADER_MAX_PIXEL_COUNT = 1920 * 1080 * 2

/**
 * Guide WebGL context attrs for 2D paper shaders.
 * Thumbnails / snapshot capture override `preserveDrawingBuffer: true`.
 */
export const LIVE_PAPER_SHADER_WEBGL_CONTEXT_ATTRIBUTES = {
  alpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  preserveDrawingBuffer: false,
  powerPreference: "default" as WebGLPowerPreference,
}

export const LIVE_PAPER_SHADER_RENDER_OPTIONS = {
  minPixelRatio: LIVE_PAPER_SHADER_MIN_PIXEL_RATIO,
  maxPixelCount: LIVE_PAPER_SHADER_MAX_PIXEL_COUNT,
  webGlContextAttributes: LIVE_PAPER_SHADER_WEBGL_CONTEXT_ATTRIBUTES,
} as const
