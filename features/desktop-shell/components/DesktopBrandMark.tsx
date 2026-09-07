"use client"

import Image from "next/image"
import { TransitionLink } from "glimm/next"

import type { DesktopThemeMode } from "@/features/desktop-shell/model/desktop-toolbar-types"
import { cn } from "@/lib/utils"

const homeSweep = { palette: "berry", midpoint: 0.92 } as const

export function DesktopBrandMark({
  theme,
  className,
}: {
  theme: DesktopThemeMode
  className?: string
}) {
  return (
    <TransitionLink
      href="/"
      sweep={homeSweep}
      aria-label="QRafty home"
      className={cn(
        "inline-flex items-center gap-2 font-caveat text-[2rem] font-semibold leading-none tracking-tight select-none outline-none focus-visible:ring-2 focus-visible:ring-white/30",
        theme === "light" ? "text-neutral-950" : "text-white",
        className,
      )}
      data-slot="desktop-brand-mark"
    >
      <Image
        src="/logo.png"
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-[0.35rem] object-cover"
        aria-hidden
        priority
      />
      QRafty
    </TransitionLink>
  )
}
