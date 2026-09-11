"use client"

import { cn } from "@/lib/utils"

const PALETTE_COLOR_FALLBACK = "#000000"

function isPaletteHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value)
}

export function PaletteColorBarPreview({
  className,
  colors,
  size = "sm",
}: {
  className?: string
  colors: string[]
  size?: "sm" | "md"
}) {
  const isMedium = size === "md"

  return (
    <span
      aria-hidden
      className={cn(
        "flex w-full flex-row overflow-hidden border border-[color-mix(in_srgb,var(--dn-line)_40%,transparent)]",
        isMedium ? "h-full min-h-0 rounded-[6px]" : "inline-flex h-3.5 rounded-[5px]",
        className,
      )}
    >
      {colors.map((color, index) => (
        <span
          key={`${color}-${index}`}
          className={cn(
            "min-w-0",
            isMedium ? "h-full flex-1" : "h-3.5 w-2.5 shrink-0",
          )}
          style={{
            backgroundColor: isPaletteHexColor(color) ? color : PALETTE_COLOR_FALLBACK,
          }}
        />
      ))}
    </span>
  )
}
