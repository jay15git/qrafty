import * as React from "react"

import { cn } from "@/lib/utils"

interface SecondaryButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

export const SecondaryButton = React.forwardRef<
  HTMLButtonElement,
  SecondaryButtonProps
>(({ className, selected = false, children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      data-slot="secondary-button"
      data-selected={selected}
      className={cn(
        // Layout
        "group inline-flex shrink-0 items-center justify-center gap-2",
        "h-10 rounded-md px-4",
        "text-sm font-medium whitespace-nowrap",
        // Interaction
        "transition-all duration-150 ease-out",
        "outline-none select-none",
        "focus-visible:ring-2 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:opacity-45",
        // Icon sizing
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Light mode — default
        "bg-[#00000003] text-[#00000073]",
        "shadow-[var(--ws-shadow-rest)]",
        // Light mode — hover
        "hover:-translate-y-px hover:bg-[#00000006] hover:text-[#000000A6]",
        "hover:shadow-[var(--ws-shadow-hover)]",
        // Light mode — active/pressed
        "active:translate-y-0 active:bg-[#00000007] active:text-[#262626]",
        "active:shadow-[var(--ws-shadow-active)]",
        // Light mode — selected
        "data-[selected=true]:bg-[#111111] data-[selected=true]:text-white",
        "data-[selected=true]:shadow-[var(--ws-shadow-rest)]",
        // Light mode — selected hover
        "data-[selected=true]:hover:-translate-y-px",
        "data-[selected=true]:hover:shadow-[var(--ws-shadow-hover)]",
        // Dark mode — default
        "dark:bg-[#FFFFFF08] dark:text-[#A8B0BD]",
        "dark:shadow-[var(--ws-button-shadow-rest)]",
        // Dark mode — hover
        "dark:hover:-translate-y-px dark:hover:bg-[#FFFFFF0D] dark:hover:text-[#C8D0DC]",
        "dark:hover:shadow-[var(--ws-button-shadow-hover)]",
        // Dark mode — active/pressed
        "dark:active:translate-y-0 dark:active:bg-[#FFFFFF14] dark:active:text-[#DFE5EE]",
        "dark:active:shadow-[var(--ws-button-shadow-active)]",
        // Dark mode — selected
        "dark:data-[selected=true]:bg-[#F6F8FB] dark:data-[selected=true]:text-[#101216]",
        "dark:data-[selected=true]:shadow-[var(--ws-button-shadow-selected)]",
        // Dark mode — selected hover
        "dark:data-[selected=true]:hover:-translate-y-px",
        "dark:data-[selected=true]:hover:shadow-[var(--ws-button-shadow-selected-hover)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
})
SecondaryButton.displayName = "SecondaryButton"
