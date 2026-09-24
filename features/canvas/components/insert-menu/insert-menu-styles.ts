import type { ThemeMode } from "@/features/shell/components/FloatingToolbar";
import { cn } from "@/lib/utils";

export const INSERT_MENU_POPOVER_WIDTH = "w-[min(20rem,calc(100vw-2rem))]";

export const INSERT_MENU_POPOVER_SHELL =
  "ds-insert-menu-popover ds-portal-surface z-[20000] overflow-hidden border-0 bg-transparent p-0 text-[var(--fg)] shadow-none outline-none ds-squircle-md";

export const INSERT_MENU_SCROLL_CLASS = "ds-insert-menu-scroll h-[min(20rem,60dvh)]";

export const INSERT_MENU_ROOT_SCROLL_CLASS =
  "ds-insert-menu-root-scroll h-[min(20rem,60dvh)] w-full min-w-0";

export const INSERT_MENU_EMOJI_SHELL_CLASS =
  "ds-insert-menu-emoji flex h-[min(20rem,60dvh)] min-w-0 flex-col";

export const INSERT_MENU_PANEL_CONTENT_CLASS =
  "ds-insert-menu-panel-content flex flex-col gap-[length:var(--space-stack)] p-[length:var(--row-px)]";

export const INSERT_MENU_ITEM_CLASS =
  "ds-settings-row ds-squircle-sm ds-pressable flex h-[length:var(--control-height)] w-full items-center gap-[length:var(--space-inline)] px-[length:var(--space-inline)] text-left font-semibold";

export const INSERT_MENU_PANEL_TITLE = "ds-insert-menu-panel-heading";

export const INSERT_MENU_BACK_BUTTON = "ds-insert-menu-panel-back ds-pressable-subtle shrink-0";

export const INSERT_MENU_INPUT_CLASS =
  "ds-settings-input h-[length:var(--control-height)] min-w-0 px-[length:var(--row-px)] shadow-none";

export function insertMenuPortalClass(theme: ThemeMode, className?: string) {
  return cn(className, theme === "dark" && "dark");
}
