"use client"

import { Download02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { cn } from "@/lib/utils"

export function DesktopSquircleDownloadButton({
  className,
  onClick,
}: {
  className?: string
  onClick?: () => void
}) {
  return (
    <button
      aria-label="Download"
      className={cn(
        "inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 border-0 bg-white px-3 text-[#0a0a0a] shadow-[0_1px_2px_rgba(0,0,0,0.24)] transition hover:bg-white/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        "rounded-[10px] [corner-shape:squircle]",
        className,
      )}
      data-slot="desktop-download-trigger"
      type="button"
      onClick={onClick}
    >
      <HugeiconsIcon
        icon={Download02Icon}
        size={16}
        color="currentColor"
        strokeWidth={1.8}
      />
      <span className="text-[12px] font-semibold leading-none tracking-tight">Download</span>
    </button>
  )
}
