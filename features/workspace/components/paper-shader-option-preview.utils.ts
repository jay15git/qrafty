import type { PaperShaderId } from "@/features/workspace/rendering/paper-shaders"

const PAPER_SHADER_OPTION_PREVIEW_PATH = "/shader-previews"

export function getPaperShaderOptionPreviewUrl(shaderId: PaperShaderId) {
  return `${PAPER_SHADER_OPTION_PREVIEW_PATH}/${encodeURIComponent(shaderId)}.webp`
}
