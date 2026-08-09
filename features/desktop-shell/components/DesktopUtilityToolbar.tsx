"use client"

import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

export const DESKTOP_UTILITY_TOOLBAR_SHELL_CLASS =
  "inline-flex min-h-11 items-center gap-0.5 rounded-[10px] border border-[var(--desktop-glass-border)] bg-[var(--desktop-glass-bg)] p-1 text-[var(--desktop-glass-fg)] shadow-[var(--desktop-glass-shadow)]"

export const DESKTOP_UTILITY_TOOLBAR_BUTTON_CLASS =
  "grid size-9 cursor-pointer place-items-center rounded-[7px] text-current transition-colors duration-150 hover:bg-[var(--desktop-glass-button-hover-bg)] hover:text-[var(--desktop-glass-button-hover-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-glass-button-focus-ring)] disabled:cursor-not-allowed max-md:size-8 [&_svg]:size-3.5"

export const DESKTOP_GLASS_TOOLBAR_ICON_BUTTON_CLASS =
  "grid size-9 shrink-0 cursor-pointer place-items-center rounded-[7px] text-current transition-colors duration-150 hover:bg-[var(--desktop-glass-button-hover-bg)] hover:text-[var(--desktop-glass-button-hover-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-glass-button-focus-ring)] disabled:cursor-not-allowed disabled:opacity-35 [&_svg]:size-3.5"

export const DESKTOP_CANVAS_GLASS_TOOLBAR_SHELL_CLASS =
  "inline-flex min-h-11 items-center gap-0.5 rounded-[10px] border border-[var(--desktop-glass-border)] bg-[var(--desktop-glass-bg)] px-1.5 py-1 text-[var(--desktop-glass-fg)] shadow-[var(--desktop-glass-shadow)]"

export const DESKTOP_CANVAS_GLASS_TOOLBAR_VERTICAL_SHELL_CLASS =
  "inline-flex min-w-11 flex-col items-center gap-0.5 rounded-[10px] border border-[var(--desktop-glass-border)] bg-[var(--desktop-glass-bg)] px-1 py-1.5 text-[var(--desktop-glass-fg)] shadow-[var(--desktop-glass-shadow)]"

export const DESKTOP_COMPOSE_TOOLBAR_ICON_BUTTON_CLASS = DESKTOP_GLASS_TOOLBAR_ICON_BUTTON_CLASS

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
