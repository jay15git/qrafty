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
        "relative inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden border border-[var(--desktop-glass-border)] bg-[var(--desktop-glass-bg)] px-3 text-[var(--desktop-glass-fg)] shadow-none transition hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-glass-button-focus-ring)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        "rounded-[1rem] [corner-shape:squircle]",
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
