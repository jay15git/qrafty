"use client";

import { Tooltip, type TooltipProps } from "@/components/ui/fluid-tooltip";
import { cn } from "@/lib/utils";

const TOOLTIP_CLASS = "tooltip-content !rounded-full px-3 py-1.5 shadow-lg";

export function ToolbarTooltip({ className, delayDuration = 150, ...props }: TooltipProps) {
  return (
    <Tooltip delayDuration={delayDuration} className={cn(TOOLTIP_CLASS, className)} {...props} />
  );
}
