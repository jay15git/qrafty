import { cn } from "@/lib/utils";

const SETTINGS_OPTION_GRID_COLS_CLASS = {
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
} as const;

export type SettingsOptionGridColumns = keyof typeof SETTINGS_OPTION_GRID_COLS_CLASS;

const SETTINGS_OPTION_GRID_ITEM_PADDING_CLASS = {
  tight: "p-[length:var(--space-inline)]",
  loose: "p-[length:var(--space-stack)]",
} as const;

export type SettingsOptionGridSpacing = keyof typeof SETTINGS_OPTION_GRID_ITEM_PADDING_CLASS;

export function settingsOptionGridClass(columns: SettingsOptionGridColumns, className?: string) {
  return cn("grid gap-0", SETTINGS_OPTION_GRID_COLS_CLASS[columns], className);
}

export function settingsOptionStackClass(className?: string) {
  return cn("grid gap-0", className);
}

export function settingsOptionGridItemClass(spacing: SettingsOptionGridSpacing = "tight") {
  return cn("w-full min-w-0", SETTINGS_OPTION_GRID_ITEM_PADDING_CLASS[spacing]);
}
