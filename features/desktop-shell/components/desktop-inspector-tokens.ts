import { cn } from "@/lib/utils"

export const DESKTOP_INSPECTOR_PRESS_CLASS = "desktop-inspector-press"

export const DESKTOP_INSPECTOR_FG_SECONDARY =
  "text-[var(--desktop-inspector-fg-secondary)]"
export const DESKTOP_INSPECTOR_FG_TERTIARY =
  "text-[var(--desktop-inspector-fg-tertiary)]"
export const DESKTOP_INSPECTOR_FG_MUTED =
  "text-[var(--desktop-inspector-fg-muted)]"
const DESKTOP_INSPECTOR_TYPE_VALUE_CLASS =
  "text-[length:var(--desktop-inspector-type-value)] leading-[1.45]"
export const DESKTOP_INSPECTOR_TYPE_LABEL_CLASS =
  "text-[length:var(--desktop-inspector-type-label)]"
const DESKTOP_INSPECTOR_TYPE_CAPTION_CLASS =
  "text-[length:var(--desktop-inspector-type-caption)]"
export const DESKTOP_INSPECTOR_SECTION_HEADING_CLASS =
  cn(
    "mb-0 truncate pl-0.5 font-medium uppercase tracking-[0.05em] text-[var(--desktop-inspector-fg-muted)]",
    DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
  )
export const DESKTOP_INSPECTOR_VALUE_CLASS = cn(
  "font-medium tabular-nums text-[var(--desktop-inspector-fg-primary)]",
  DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
)
export const DESKTOP_INSPECTOR_CAPTION_CLASS = cn(
  "font-medium text-[var(--desktop-inspector-fg-muted)]",
  DESKTOP_INSPECTOR_TYPE_CAPTION_CLASS,
)
export const DESKTOP_INSPECTOR_SECTION_GAP_CLASS = "mt-2"
export const DESKTOP_INSPECTOR_ROW_GAP_CLASS = "gap-2"
export const DESKTOP_INSPECTOR_ROW_CLASS =
  "flex min-h-[2.375rem] min-w-0 items-center justify-between gap-3 rounded-md bg-[var(--desktop-inspector-control)] px-3"
export const DESKTOP_INSPECTOR_FIELD_ROW_CLASS =
  "min-w-0 py-2.5"
export const DESKTOP_INSPECTOR_LABEL_CLASS = cn(
  "truncate font-medium text-[var(--desktop-inspector-fg-label)]",
  DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
)
export const DESKTOP_INSPECTOR_CONTROL_CLASS =
  "desktop-inspector-press cursor-pointer rounded-[6px] border border-transparent bg-transparent text-[var(--desktop-inspector-fg-tertiary)] transition-[background-color,border-color,color] duration-150 ease-out hover:border-[var(--desktop-inspector-control-border-hover)] hover:bg-[var(--desktop-inspector-control-hover-bg)] hover:text-[var(--desktop-inspector-fg-primary)] active:bg-[var(--desktop-inspector-control-active-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)] disabled:cursor-not-allowed"
export const DESKTOP_INSPECTOR_SELECTED_CLASS =
  "border-transparent bg-[var(--desktop-inspector-option-selected-bg)] text-[var(--desktop-inspector-option-selected-fg)] hover:border-transparent hover:bg-[var(--desktop-inspector-option-selected-bg)] hover:text-[var(--desktop-inspector-option-selected-fg)]"
export const DESKTOP_INSPECTOR_INPUT_CLASS = cn(
  "desktop-inspector-input-bg bg-[var(--desktop-inspector-field-bg)] font-medium text-[var(--desktop-inspector-fg-primary)] outline-none placeholder:text-[var(--desktop-inspector-fg-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]",
  DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
)
export const DESKTOP_INSPECTOR_FOOTER_CLASS =
  "px-3 py-3"
export const DESKTOP_INSPECTOR_RESET_CLASS = cn(
  "desktop-inspector-press flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-[6px] border border-transparent bg-transparent px-3 font-medium text-[var(--desktop-inspector-fg-secondary)] transition-[background-color,border-color,color] duration-150 ease-out hover:border-[var(--desktop-inspector-control-border-hover)] hover:bg-[var(--desktop-inspector-control-hover-bg)] hover:text-[var(--desktop-inspector-fg-primary)] active:bg-[var(--desktop-inspector-control-active-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]",
  DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
)
export const DESKTOP_INSPECTOR_DROPDOWN_ITEM_CLASS = cn(
  "h-8 cursor-pointer rounded-[6px] px-3 font-medium text-[var(--desktop-inspector-fg-tertiary)] outline-none transition focus:bg-[var(--desktop-inspector-control-hover-bg)] focus:text-[var(--desktop-inspector-fg-primary)] focus:**:text-[var(--desktop-inspector-fg-primary)] data-[highlighted]:bg-[var(--desktop-inspector-control-hover-bg)] data-[highlighted]:text-[var(--desktop-inspector-fg-primary)] data-[highlighted]:**:text-[var(--desktop-inspector-fg-primary)] data-[state=checked]:bg-[var(--desktop-inspector-option-selected-bg)] data-[state=checked]:text-[var(--desktop-inspector-fg-primary)] data-[state=checked]:focus:bg-[var(--desktop-inspector-option-selected-bg)] data-[state=checked]:focus:text-[var(--desktop-inspector-fg-primary)] data-[state=checked]:data-[highlighted]:bg-[var(--desktop-inspector-option-selected-bg)] data-[state=checked]:data-[highlighted]:text-[var(--desktop-inspector-fg-primary)] [&_[data-slot=dropdown-menu-radio-item-indicator]]:hidden",
  DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
)
export const DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS =
  "desktop-inspector-press cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
/** Option tiles: no grey hover fill. Selected chrome stays white pill; preview scales via SCALE_PREVIEW. */
export const DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS = cn(
  "rounded-[7px] border-2 border-transparent bg-transparent font-medium text-[var(--desktop-inspector-fg-tertiary)] transition-colors hover:bg-transparent hover:text-[var(--desktop-inspector-fg-primary)]",
  DESKTOP_INSPECTOR_TYPE_CAPTION_CLASS,
)
export const DESKTOP_INSPECTOR_OPTION_TILE_SCALE_SURFACE_CLASS =
  DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS
/** Preview scale timing lives in desktop-inspector-motion.css */
export const DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS = ""
