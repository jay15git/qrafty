"use client";

import type { ComponentType } from "react";

import type { IconComponentProps } from "../types";

// Phosphor: uses filled paths per weight variant, not CSS stroke.
// Map numeric strokeWidth → discrete weight prop.
type PhosphorWeight = "thin" | "light" | "regular" | "bold";

export function PhosphorAdapter({
  Icon,
  size,
  strokeWidth,
  className,
}: IconComponentProps & {
  Icon: ComponentType<{ size?: number; weight?: PhosphorWeight; className?: string }>;
}) {
  const weight: PhosphorWeight = strokeWidth != null && strokeWidth >= 1.75 ? "regular" : "light";
  return <Icon size={size} weight={weight} className={className} />;
}
