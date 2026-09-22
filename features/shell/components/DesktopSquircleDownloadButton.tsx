"use client"

import { Download02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { BorderBeam, type BorderBeamTheme } from "border-beam"
import { forwardRef, type ComponentPropsWithoutRef } from "react"

import type { DesktopThemeMode } from "@/features/shell/components/FloatingToolbar"
import { CUELUME_BUTTON } from "@/features/shell/audio/desktop-cuelume"
import { cn } from "@/lib/utils"

type DesktopSquircleDownloadButtonProps = Omit<ComponentPropsWithoutRef<"button">, "children"> & {
  desktopTheme?: DesktopThemeMode
}

const borderBeamThemeByDesktopTheme = {
  dark: "dark",
  light: "light",
} satisfies Record<DesktopThemeMode, BorderBeamTheme>

export const DesktopSquircleDownloadButton = forwardRef<
  HTMLButtonElement,
  DesktopSquircleDownloadButtonProps
>(function DesktopSquircleDownloadButton(
  { className, desktopTheme = "dark", onClick, type = "button", ...props },
  ref,
) {
  return (
    <BorderBeam
      borderRadius={18}
      className="inline-flex shrink-0"
      size="sm"
      theme={borderBeamThemeByDesktopTheme[desktopTheme]}
    >
      <button
        ref={ref}
        aria-label="Download"
        className={cn(
          "relative inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 border border-[var(--glass-border)] bg-[var(--glass-bg)] px-3 text-[var(--glass-fg)] shadow-none transition hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--glass-button-focus-ring)] motion-reduce:transition-none",
          "rounded-full",
          className,
        )}
        data-slot="desktop-download-trigger"
        type={type}
        onClick={onClick}
        {...CUELUME_BUTTON}
        {...props}
      >
        <HugeiconsIcon icon={Download02Icon} size={16} color="currentColor" strokeWidth={1.8} />
        <span className="text-[12px] font-semibold leading-none tracking-tight">Download</span>
      </button>
    </BorderBeam>
  )
})
