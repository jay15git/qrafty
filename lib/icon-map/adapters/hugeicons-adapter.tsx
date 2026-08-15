"use client";

import { HugeiconsIcon } from "@hugeicons/react";

import type { IconComponentProps } from "../types";

// HugeIcons: wraps icon definition in HugeiconsIcon renderer
export function HugeIconsAdapter({
  iconDef,
  size,
  strokeWidth,
  className,
}: IconComponentProps & { iconDef: unknown }) {
  return (
    <HugeiconsIcon
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      icon={iconDef as any}
      size={size}
      strokeWidth={strokeWidth}
      className={className}
    />
  );
}
