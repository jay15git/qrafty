import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import { cn } from "@/lib/utils"

export const INSERT_MENU_POPOVER_WIDTH = "w-[min(20rem,calc(100vw-2rem))]"

export const INSERT_MENU_POPOVER_SHELL =
  "dn-insert-menu-popover dn-portal-surface z-[20000] overflow-hidden border-0 bg-transparent p-0 text-[var(--dn-fg)] shadow-none outline-none dn-squircle-md"

export const INSERT_MENU_SCROLL_CLASS = "dn-insert-menu-scroll h-[min(20rem,60dvh)]"

export const INSERT_MENU_ROOT_SCROLL_CLASS = "dn-insert-menu-root-scroll w-full min-w-0"

export const INSERT_MENU_EMOJI_SHELL_CLASS =
  "dn-insert-menu-emoji flex h-[min(20rem,60dvh)] min-w-0 flex-col"

export const INSERT_MENU_PANEL_CONTENT_CLASS =
  "dn-insert-menu-panel-content flex flex-col gap-[length:var(--dn-space-stack)] p-[length:var(--dn-row-px)]"

export const INSERT_MENU_ITEM_CLASS =
  "dn-settings-row dn-squircle-sm dn-pressable flex h-[length:var(--dn-control-height)] w-full items-center gap-[length:var(--dn-space-inline)] px-[length:var(--dn-space-inline)] text-left font-semibold"

export const INSERT_MENU_PANEL_TITLE = "dn-insert-menu-panel-heading"

export const INSERT_MENU_BACK_BUTTON =
  "dn-insert-menu-panel-back dn-pressable-subtle shrink-0"

export const INSERT_MENU_INPUT_CLASS =
  "dn-settings-input h-[length:var(--dn-control-height)] min-w-0 px-[length:var(--dn-row-px)] shadow-none"

export function insertMenuPortalClass(theme: DesktopThemeMode, className?: string) {
  return cn(className, theme === "dark" && "dark")
}
