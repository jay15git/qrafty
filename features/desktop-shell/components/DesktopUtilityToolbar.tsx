"use client"

import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

import {
  DESKTOP_UTILITY_TOOLBAR_SHELL_CLASS,
} from "@/features/desktop-shell/components/desktop-utility-toolbar.constants"

const DESKTOP_UTILITY_TOOLBAR_BUTTON_CLASS =
  "grid size-9 cursor-pointer place-items-center rounded-[7px] text-current transition-colors duration-150 hover:bg-[var(--desktop-glass-button-hover-bg)] hover:text-[var(--desktop-glass-button-hover-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-glass-button-focus-ring)] disabled:cursor-not-allowed max-md:size-8 [&_svg]:size-3.5"

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
  type = "button",
  ...props
}: ComponentProps<"button">) {
  return (
    <button
      className={cn(DESKTOP_UTILITY_TOOLBAR_BUTTON_CLASS, className)}
      type={type}
      {...props}
    />
  )
}
