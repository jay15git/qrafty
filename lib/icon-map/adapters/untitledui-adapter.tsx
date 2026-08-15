"use client";

import type { ComponentType } from "react";

import type { IconComponentProps } from "../types";

// Untitled UI: standard 24px SVG components — `strokeWidth`/`className` pass
// through natively; only `size` needs mapping to `width`/`height`.
export function UntitledUiAdapter({
  Icon,
  size,
  strokeWidth,
  className,
}: IconComponentProps & {
  Icon: ComponentType<{ width?: number; height?: number; strokeWidth?: number; className?: string }>;
}) {
  return <Icon width={size} height={size} strokeWidth={strokeWidth} className={className} />;
}
