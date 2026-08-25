import { EXPORT_PAPER_SHADER_MAX_PIXEL_COUNT } from "@new-qr/qr/shaders"

const PAPER_SHADER_RENDER_OPTIONS: Record<string, Record<string, unknown>> = {
  waves: { maxPixelCount: EXPORT_PAPER_SHADER_MAX_PIXEL_COUNT },
  "dot-grid": { maxPixelCount: EXPORT_PAPER_SHADER_MAX_PIXEL_COUNT },
}

export function getPaperShaderRenderOptions(shaderId: string) {
  return (
    PAPER_SHADER_RENDER_OPTIONS[shaderId] ?? {
      maxPixelCount: EXPORT_PAPER_SHADER_MAX_PIXEL_COUNT,
    }
  )
}

export { EXPORT_PAPER_SHADER_MAX_PIXEL_COUNT }
