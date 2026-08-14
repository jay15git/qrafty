"use client"

import * as React from "react"
import { Switch as SwitchPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default"
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
        className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-[3px] border border-transparent p-[2px] outline-none transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-[20px] data-[size=default]:w-[34px] data-[size=sm]:h-[16px] data-[size=sm]:w-[26px] dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:bg-primary data-unchecked:bg-input dark:data-unchecked:bg-input/80 data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-[2px] border border-black/8 bg-background shadow-[0_1px_2px_rgba(15,23,42,0.18)] ring-0 transition-transform duration-[220ms] ease-[cubic-bezier(0.34,1.15,0.64,1)] group-data-[size=default]/switch:size-4 group-data-[size=sm]/switch:size-3 group-data-[size=default]/switch:data-checked:translate-x-[15px] group-data-[size=sm]/switch:data-checked:translate-x-[11px] group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:border-white/12 dark:data-checked:bg-primary-foreground dark:data-unchecked:bg-foreground dark:shadow-[0_1px_2px_rgba(0,0,0,0.38)]"
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
