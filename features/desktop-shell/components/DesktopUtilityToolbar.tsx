"use client"

import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

import {
  DESKTOP_UTILITY_TOOLBAR_SHELL_CLASS,
} from "@/features/desktop-shell/components/desktop-utility-toolbar.constants"
import { desktopCuelumeAttrs } from "@/features/desktop-shell/audio/desktop-cuelume"

const DESKTOP_UTILITY_TOOLBAR_BUTTON_CLASS =
  "relative grid size-9 cursor-pointer place-items-center overflow-visible rounded-none border-0 bg-transparent p-0 text-current shadow-none transition-colors duration-150 hover:bg-transparent hover:text-[var(--desktop-glass-button-hover-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-glass-button-focus-ring)] disabled:cursor-not-allowed max-md:size-8 [&_svg]:size-3.5"

export function DesktopUtilityToolbar({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-toolbar-appearance="desktop-glass"
      className={cn(DESKTOP_UTILITY_TOOLBAR_SHELL_CLASS, className)}
      {...props}
    />
  )
}

export function DesktopUtilityToolbarButton({
  className,
  cuelume = "button",
  type = "button",
  ...props
}: ComponentProps<"button"> & {
  cuelume?: "button" | "none" | "toggle"
}) {
  const cuelumeAttrs = desktopCuelumeAttrs(cuelume)

  return (
    <button
      className={cn(DESKTOP_UTILITY_TOOLBAR_BUTTON_CLASS, className)}
      type={type}
      {...cuelumeAttrs}
      {...props}
    />
  )
}
