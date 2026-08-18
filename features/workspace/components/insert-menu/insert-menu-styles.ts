import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import { cn } from "@/lib/utils"

export const INSERT_MENU_POPOVER_WIDTH = "w-[min(18rem,calc(100vw-2rem))]"
export const INSERT_MENU_EMOJI_POPOVER_WIDTH = "w-[min(22rem,calc(100vw-2rem))]"

export const INSERT_MENU_POPOVER_SHELL =
  "dn-portal-surface desktopnew-popover-content z-[20000] border-0 p-2 shadow-none outline-none dn-squircle-md"

export const INSERT_MENU_ITEM_CLASS =
  "dn-settings-row dn-squircle-sm dn-pressable flex h-10 w-full items-center gap-2 px-2 text-left font-semibold"

export const INSERT_MENU_PANEL_TITLE = "dn-popover-heading"

export const INSERT_MENU_BACK_BUTTON =
  "dn-pressable-subtle h-8 px-2 text-[var(--dn-muted)] hover:text-[var(--dn-fg)]"

export const INSERT_MENU_INPUT_CLASS = "dn-settings-input h-10 min-w-0 px-3 shadow-none"

export function insertMenuPortalClass(theme: DesktopThemeMode, className?: string) {
  return cn(className, theme === "dark" && "dark")
}
