"use client"

import Image from "next/image"

import type { StylePreviewKind } from "@/features/qr-code/components/StylePreview"
import { getQrStyleOptionPreviewUrl } from "@/features/qr-code/styles/qr-style-option-preview.registry"
import { cn } from "@/lib/utils"

export function QrStyleOptionPreview({
  className,
  previewKind,
  value,
}: {
  className?: string
  previewKind: StylePreviewKind
  value: string
}) {
  const src = getQrStyleOptionPreviewUrl(previewKind, value)

  return (
    <Image
      alt=""
      className={cn("dn-qr-style-option-preview size-full object-contain", className)}
      data-preview-kind={previewKind}
      data-preview-style={value}
      data-slot="qr-style-option-preview"
      draggable={false}
      height={64}
      src={src}
      width={64}
    />
  )
}
