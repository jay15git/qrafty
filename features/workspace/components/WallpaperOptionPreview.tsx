"use client"

import Image from "next/image"

export function WallpaperOptionPreview({
  alt,
  className,
  previewPath,
}: {
  alt: string
  className?: string
  previewPath: string
}) {
  return (
    <Image
      alt={alt}
      className={className ?? "block size-full object-cover"}
      data-slot="wallpaper-option-preview-image"
      draggable={false}
      height={64}
      src={previewPath}
      width={64}
    />
  )
}
