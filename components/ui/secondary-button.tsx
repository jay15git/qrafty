import * as React from "react";

import { cn } from "@/lib/utils";

interface SecondaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export const SecondaryButton = React.forwardRef<HTMLButtonElement, SecondaryButtonProps>(
  ({ className, selected = false, children, ...props }, ref) => {
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
          "transition-all duration-[var(--motion-fast)] ease-out",
          "outline-none select-none",
          "focus-visible:ring-2 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-45",
          // Icon sizing
          "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
          // Rest
          "bg-(--secondary-button-bg) text-(--secondary-button-fg)",
          "shadow-[var(--canvas-shadow-rest)]",
          // Hover
          "hover:-translate-y-px hover:bg-(--secondary-button-bg-hover) hover:text-(--secondary-button-fg-hover)",
          "hover:shadow-[var(--canvas-shadow-hover)]",
          // Active/pressed
          "active:translate-y-0 active:bg-(--secondary-button-bg-active) active:text-(--secondary-button-fg-active)",
          "active:shadow-[var(--canvas-shadow-active)]",
          // Selected
          "data-[selected=true]:bg-(--secondary-button-bg-selected) data-[selected=true]:text-(--secondary-button-fg-selected)",
          "data-[selected=true]:shadow-[var(--canvas-shadow-rest)]",
          "data-[selected=true]:hover:-translate-y-px",
          "data-[selected=true]:hover:shadow-[var(--canvas-shadow-hover)]",
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);
SecondaryButton.displayName = "SecondaryButton";
