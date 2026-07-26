"use client"

import { HugeiconsIcon } from "@hugeicons/react"

import { getContentTypeIcon } from "@/features/qr-code/content/content-type-icons"
import type { QrInputType } from "@/features/qr-code/content/input-options"
import { cn } from "@/lib/utils"

type ContentTypeGridIconProps = {
  className?: string
  type: QrInputType
}

export function ContentTypeGridIcon({ className, type }: ContentTypeGridIconProps) {
  const iconDef = getContentTypeIcon(type)

  if (iconDef.kind === "brand") {
    const BrandIcon = iconDef.icon
    return <BrandIcon aria-hidden className={cn("size-5 shrink-0", className)} />
  }

  return (
    <HugeiconsIcon
      aria-hidden
      className={cn("size-5 shrink-0", className)}
      color="currentColor"
      icon={iconDef.icon}
      size={20}
      strokeWidth={1.75}
    />
  )
}
