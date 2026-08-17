"use client"

import { Download02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { forwardRef, type ComponentPropsWithoutRef } from "react"

import { cn } from "@/lib/utils"

export const DesktopSquircleDownloadButton = forwardRef<
  HTMLButtonElement,
  Omit<ComponentPropsWithoutRef<"button">, "children">
>(function DesktopSquircleDownloadButton(
  { className, onClick, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label="Download"
      className={cn(
        "relative inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden border-0 bg-white px-3 text-[#0a0a0a] shadow-[0_1px_2px_rgba(0,0,0,0.24)] transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        "rounded-[10px] [corner-shape:squircle]",
        className,
      )}
      data-slot="desktop-download-trigger"
      type={type}
      onClick={onClick}
      {...props}
    >
      <HugeiconsIcon icon={Download02Icon} size={16} color="currentColor" strokeWidth={1.8} />
      <span className="text-[12px] font-semibold leading-none tracking-tight">Download</span>
    </button>
  )
})
