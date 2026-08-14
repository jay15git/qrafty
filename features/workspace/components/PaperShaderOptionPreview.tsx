"use client"

import type { PaperShaderId } from "@/features/workspace/rendering/paper-shaders"

const PAPER_SHADER_OPTION_PREVIEW_PATH = "/shader-previews"

export function getPaperShaderOptionPreviewUrl(shaderId: PaperShaderId) {
  return `${PAPER_SHADER_OPTION_PREVIEW_PATH}/${encodeURIComponent(shaderId)}.webp`
}

export function PaperShaderOptionPreview({
  className,
  shaderId,
}: {
  className?: string
  isSelected?: boolean
  shaderId: PaperShaderId
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=""
      className={className ?? "block size-full object-cover"}
      data-slot="paper-shader-option-preview-image"
      draggable={false}
      src={getPaperShaderOptionPreviewUrl(shaderId)}
    />
  )
}

/** @deprecated Use PaperShaderOptionPreview */
export const DraftingPaperShaderOptionPreview = PaperShaderOptionPreview
