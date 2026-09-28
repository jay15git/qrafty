"use client";

import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

import { UTILITY_TOOLBAR_SHELL_CLASS } from "@/features/shell/components/utility-toolbar.constants";

export function UtilityToolbar({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn(UTILITY_TOOLBAR_SHELL_CLASS, className)} {...props} />;
}
