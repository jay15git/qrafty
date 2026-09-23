"use client"

import { cn } from "@/lib/utils"
import type { ComponentProps } from "react"

import {
  UTILITY_TOOLBAR_SHELL_CLASS,
} from "@/features/shell/components/utility-toolbar.constants"
import { cuelumeAttrs } from "@/features/shell/audio/cuelume"

const UTILITY_TOOLBAR_BUTTON_CLASS =
  "relative grid size-9 cursor-pointer place-items-center overflow-visible rounded-none border-0 bg-transparent p-0 text-current shadow-none transition-colors duration-150 hover:bg-transparent hover:text-[var(--glass-button-hover-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--glass-button-focus-ring)] disabled:cursor-not-allowed max-md:size-8 [&_svg]:size-3.5"

export function UtilityToolbar({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-toolbar-appearance="glass"
      className={cn(UTILITY_TOOLBAR_SHELL_CLASS, className)}
      {...props}
    />
  )
}

function UtilityToolbarButton({
  className,
  cuelume = "button",
  type = "button",
  ...props
}: ComponentProps<"button"> & {
  cuelume?: "button" | "none" | "toggle"
}) {
  const attrs = cuelumeAttrs(cuelume)

  return (
    <button
      className={cn(UTILITY_TOOLBAR_BUTTON_CLASS, className)}
      type={type}
      {...attrs}
      {...props}
    />
  )
}
