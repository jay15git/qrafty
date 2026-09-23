import { cn } from "@/lib/utils";

const INSPECTOR_OPTION_GRID_COLS_CLASS = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const;

export type InspectorOptionGridColumns = keyof typeof INSPECTOR_OPTION_GRID_COLS_CLASS;

const INSPECTOR_OPTION_GRID_ITEM_PADDING_CLASS = {
  tight: "p-[length:var(--space-inline)]",
  loose: "p-[length:var(--space-stack)]",
} as const;

export type InspectorOptionGridSpacing = keyof typeof INSPECTOR_OPTION_GRID_ITEM_PADDING_CLASS;

export function inspectorOptionGridClass(columns: InspectorOptionGridColumns, className?: string) {
  return cn("grid gap-0", INSPECTOR_OPTION_GRID_COLS_CLASS[columns], className);
}

export function inspectorOptionStackClass(className?: string) {
  return cn("grid gap-0", className);
}

export function inspectorOptionGridItemClass(spacing: InspectorOptionGridSpacing = "tight") {
  return cn("w-full min-w-0", INSPECTOR_OPTION_GRID_ITEM_PADDING_CLASS[spacing]);
}
