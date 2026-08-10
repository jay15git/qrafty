const HIGH_RES_SHADER_MAX_PIXEL_COUNT = 6016 * 3384

const PAPER_SHADER_RENDER_OPTIONS: Record<string, Record<string, unknown>> = {
  waves: { maxPixelCount: HIGH_RES_SHADER_MAX_PIXEL_COUNT },
  "dot-grid": { maxPixelCount: HIGH_RES_SHADER_MAX_PIXEL_COUNT },
}

export function getPaperShaderRenderOptions(shaderId: string) {
  return PAPER_SHADER_RENDER_OPTIONS[shaderId]
}
