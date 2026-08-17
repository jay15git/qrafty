"use client"

import type { DesktopThemeMode } from "@/features/desktop-shell/model/desktop-toolbar-types"
import { cn } from "@/lib/utils"

export function DesktopBrandMark({
  theme,
  className,
}: {
  theme: DesktopThemeMode
  className?: string
}) {
  return (
    <span
      className={cn(
        "font-caveat text-[2rem] font-semibold leading-none tracking-tight select-none",
        theme === "light" ? "text-neutral-950" : "text-white",
        className,
      )}
      data-slot="desktop-brand-mark"
    >
      QRafty
    </span>
  )
}
