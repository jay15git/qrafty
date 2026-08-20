"use client"

import { Download02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { BorderBeam, type BorderBeamTheme } from "border-beam"
import { forwardRef, type ComponentPropsWithoutRef } from "react"

import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
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
      borderRadius={16}
      className="inline-flex shrink-0"
      size="sm"
      theme={borderBeamThemeByDesktopTheme[desktopTheme]}
    >
      <button
        ref={ref}
        aria-label="Download"
        className={cn(
          "relative inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 border border-[var(--desktop-glass-border)] bg-[var(--desktop-glass-bg)] px-3 text-[var(--desktop-glass-fg)] shadow-none transition hover:brightness-[1.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-glass-button-focus-ring)] active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
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
    </BorderBeam>
  )
})
