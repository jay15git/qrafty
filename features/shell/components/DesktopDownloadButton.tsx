"use client"

import { Download02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { forwardRef, type ComponentPropsWithoutRef } from "react"

import { CUELUME_BUTTON } from "@/features/shell/audio/desktop-cuelume"
import { cn } from "@/lib/utils"

type DesktopDownloadButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children">

export const DesktopDownloadButton = forwardRef<
  HTMLButtonElement,
  DesktopDownloadButtonProps
>(function DesktopDownloadButton(
  { className, onClick, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label="Download"
      className={cn(
        "relative inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-transparent px-2.5 text-xs font-medium whitespace-nowrap text-[var(--glass-fg)] shadow-none transition-colors hover:bg-[var(--glass-button-hover-bg,rgba(255,255,255,0.11))] hover:text-[var(--glass-button-hover-fg,currentColor)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--glass-button-focus-ring)] motion-reduce:transition-none",
        className,
      )}
      data-slot="desktop-download-trigger"
      type={type}
      onClick={onClick}
      {...CUELUME_BUTTON}
      {...props}
    >
      <HugeiconsIcon icon={Download02Icon} size={16} color="currentColor" strokeWidth={1.8} />
      <span className="leading-none tracking-tight">Download</span>
    </button>
  )
})
