"use client";

import type { ComponentType } from "react";

import type { IconComponentProps } from "../types";

export function TablerAdapter({
  Icon,
  size,
  strokeWidth,
  className,
}: IconComponentProps & {
  Icon: ComponentType<{ size?: number; stroke?: number; className?: string }>;
}) {
  return <Icon size={size} stroke={strokeWidth} className={className} />;
}
