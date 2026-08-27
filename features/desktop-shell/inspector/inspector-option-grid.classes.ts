import { cn } from "@/lib/utils"

const DESKTOP_INSPECTOR_OPTION_GRID_COLS_CLASS = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const

export type DesktopInspectorOptionGridColumns = keyof typeof DESKTOP_INSPECTOR_OPTION_GRID_COLS_CLASS

const DESKTOP_INSPECTOR_OPTION_GRID_ITEM_PADDING_CLASS = {
  tight: "p-[length:var(--dn-space-inline)]",
  loose: "p-[length:var(--dn-space-stack)]",
} as const

export type DesktopInspectorOptionGridSpacing = keyof typeof DESKTOP_INSPECTOR_OPTION_GRID_ITEM_PADDING_CLASS

export function desktopInspectorOptionGridClass(
  columns: DesktopInspectorOptionGridColumns,
  className?: string,
) {
  return cn("grid gap-0", DESKTOP_INSPECTOR_OPTION_GRID_COLS_CLASS[columns], className)
}

export function desktopInspectorOptionStackClass(className?: string) {
  return cn("grid gap-0", className)
}

export function desktopInspectorOptionGridItemClass(
  spacing: DesktopInspectorOptionGridSpacing = "tight",
) {
  return cn("w-full min-w-0", DESKTOP_INSPECTOR_OPTION_GRID_ITEM_PADDING_CLASS[spacing])
}
