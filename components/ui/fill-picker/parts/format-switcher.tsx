"use client";

import * as React from "react";
import { useColorPickerContext } from "../context";
import type { ColorFormat } from "../lib/types";
import { cn } from "@/lib/utils";
import { colorPickerControlShellClass } from "../lib/surface";

interface FormatSwitcherProps
  extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    "value" | "onChange" | "children"
  > {
  /** Override the formats from <ColorPicker.Root formats={...} />. */
  formats?: ColorFormat[];
  selectClassName?: string;
}

export const FormatSwitcher = React.forwardRef<
  HTMLSelectElement,
  FormatSwitcherProps
>(function FormatSwitcher(
  { formats: formatsProp, className, selectClassName, ...rest },
  ref,
) {
  const { format, setFormat, formats: ctxFormats } = useColorPickerContext();
  const formats = formatsProp ?? ctxFormats;

  return (
    <div
      data-slot="color-picker-format-switcher"
      className={cn(
        "relative inline-flex items-center",
        className,
      )}
    >
      <select
        ref={ref}
        data-slot="color-picker-format-switcher-select"
        aria-label="Color format"
        value={format}
        onChange={(e) => setFormat(e.target.value as ColorFormat)}
        className={cn(
          "h-8 w-full appearance-none rounded-lg border pl-2.5 pr-7 font-mono text-xs uppercase tracking-wide text-[var(--color-picker-fg,var(--foreground))] shadow-xs outline-none transition-colors",
          colorPickerControlShellClass,
          "hover:bg-[var(--color-picker-control-hover-bg,var(--muted))] focus-visible:border-[var(--color-picker-focus,var(--ring))] focus-visible:ring-2 focus-visible:ring-[var(--color-picker-focus,var(--ring))]/30",
          "cursor-pointer",
          selectClassName,
        )}
        {...rest}
      >
        {formats.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="pointer-events-none absolute right-2 size-3 text-[var(--color-picker-muted-fg,var(--muted-foreground))]"
      >
        <path
          d="M3 4.5l3 3 3-3"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
});
