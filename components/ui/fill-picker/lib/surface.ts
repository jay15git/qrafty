import { cn } from "@/lib/utils";

/**
 * Opaque fill-picker surfaces. Controls and portaled popups must never fall
 * back to `transparent` — unthemed hosts and body portals still need a solid
 * paint server.
 */
export const colorPickerControlBgClass =
  "bg-[var(--color-picker-control-bg,var(--popover,var(--card,var(--background,#fafafa))))]";

export const colorPickerControlBorderClass =
  "border-[var(--color-picker-control-border,var(--border,var(--input,#e4e4e7)))]";

export const colorPickerPopupSurfaceClass =
  "bg-[var(--color-picker-bg,var(--popover,var(--card,var(--background,#fafafa))))] text-[var(--color-picker-fg,var(--popover-foreground,var(--foreground)))]";

export const colorPickerControlShellClass = cn(
  colorPickerControlBgClass,
  colorPickerControlBorderClass,
);
