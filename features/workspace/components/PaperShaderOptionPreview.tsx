"use client"

import Image from "next/image"

import type { PaperShaderId } from "@/features/workspace/rendering/paper-shaders"
import { getPaperShaderOptionPreviewUrl } from "@/features/workspace/components/paper-shader-option-preview.utils"

export function PaperShaderOptionPreview({
  className,
  shaderId,
}: {
  className?: string
  isSelected?: boolean
  shaderId: PaperShaderId
}) {
  return (
    <Image
      alt=""
      className={className ?? "block size-full object-cover"}
      data-slot="paper-shader-option-preview-image"
      draggable={false}
      height={64}
      src={getPaperShaderOptionPreviewUrl(shaderId)}
      width={64}
    />
  )
}

/** @deprecated Use PaperShaderOptionPreview */
const DraftingPaperShaderOptionPreview = PaperShaderOptionPreview
