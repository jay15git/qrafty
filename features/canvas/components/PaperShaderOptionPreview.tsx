"use client";

import Image from "next/image";

import type { PaperShaderId } from "@/features/canvas/rendering/paper-shader-definitions";
import { getPaperShaderOptionPreviewUrl } from "@/features/canvas/components/paper-shader-option-preview";

export function PaperShaderOptionPreview({
  className,
  shaderId,
}: {
  className?: string;
  isSelected?: boolean;
  shaderId: PaperShaderId;
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
  );
}
