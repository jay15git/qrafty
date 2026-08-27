import { cn } from "@/lib/utils"

export const DESKTOP_INSPECTOR_PRESS_CLASS = "desktop-inspector-press"

export const DESKTOP_INSPECTOR_CONTROL_HEIGHT_CLASS =
  "h-[length:var(--dn-control-height)]"
export const DESKTOP_INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS =
  "h-[length:var(--dn-control-height-compact)]"
export const DESKTOP_INSPECTOR_RADIUS_CLASS =
  "rounded-[length:var(--desktop-inspector-radius)]"
export const DESKTOP_INSPECTOR_ICON_HIT_CLASS =
  "size-[length:var(--dn-icon-hit)]"

export const DESKTOP_INSPECTOR_FG_SECONDARY =
  "text-[var(--desktop-inspector-fg-secondary)]"
export const DESKTOP_INSPECTOR_FG_TERTIARY =
  "text-[var(--desktop-inspector-fg-tertiary)]"
export const DESKTOP_INSPECTOR_FG_MUTED =
  "text-[var(--desktop-inspector-fg-muted)]"
export const DESKTOP_INSPECTOR_TYPE_VALUE_CLASS =
  "text-[length:var(--desktop-inspector-type-value)] leading-[1.45]"
export const DESKTOP_INSPECTOR_TYPE_LABEL_CLASS =
  "text-[length:var(--desktop-inspector-type-label)]"
export const DESKTOP_INSPECTOR_TYPE_CAPTION_CLASS =
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
export const DESKTOP_INSPECTOR_ROW_GAP_CLASS = "gap-[length:var(--dn-space-inline)]"
export const DESKTOP_INSPECTOR_ROW_CLASS =
  "flex min-h-[length:var(--dn-control-height)] min-w-0 items-center justify-between gap-[length:var(--dn-row-px)] rounded-[length:var(--desktop-inspector-radius)] bg-[var(--desktop-inspector-control)] px-[length:var(--dn-row-px)]"
export const DESKTOP_INSPECTOR_FIELD_ROW_CLASS =
  "min-w-0 py-2.5"
export const DESKTOP_INSPECTOR_LABEL_CLASS = cn(
  "truncate font-medium text-[var(--desktop-inspector-fg-label)]",
  DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
)
export const DESKTOP_INSPECTOR_CONTROL_CLASS =
  "desktop-inspector-press cursor-pointer rounded-[length:var(--desktop-inspector-radius)] border border-transparent bg-transparent text-[var(--desktop-inspector-fg-tertiary)] transition-[background-color,border-color,color] duration-150 ease-out hover:border-[var(--desktop-inspector-control-border-hover)] hover:bg-[var(--desktop-inspector-control-hover-bg)] hover:text-[var(--desktop-inspector-fg-primary)] active:bg-[var(--desktop-inspector-control-active-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)] disabled:cursor-not-allowed"
export const DESKTOP_INSPECTOR_SELECTED_CLASS =
  "border-transparent bg-[var(--desktop-inspector-option-selected-bg)] text-[var(--desktop-inspector-option-selected-fg)] hover:border-transparent hover:bg-[var(--desktop-inspector-option-selected-bg)] hover:text-[var(--desktop-inspector-option-selected-fg)]"
export const DESKTOP_INSPECTOR_INPUT_CLASS = cn(
  "desktop-inspector-input-bg bg-[var(--desktop-inspector-field-bg)] font-medium text-[var(--desktop-inspector-fg-primary)] outline-none placeholder:text-[var(--desktop-inspector-fg-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]",
  DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
)
export const DESKTOP_INSPECTOR_FOOTER_CLASS =
  "px-3 py-3"
export const DESKTOP_INSPECTOR_RESET_CLASS = cn(
  "desktop-inspector-press flex h-[length:var(--dn-control-height)] w-full cursor-pointer items-center justify-center gap-[length:var(--dn-space-inline)] rounded-[length:var(--desktop-inspector-radius)] border border-transparent bg-transparent px-[length:var(--dn-row-px)] font-medium text-[var(--desktop-inspector-fg-secondary)] transition-[background-color,border-color,color] duration-150 ease-out hover:border-[var(--desktop-inspector-control-border-hover)] hover:bg-[var(--desktop-inspector-control-hover-bg)] hover:text-[var(--desktop-inspector-fg-primary)] active:bg-[var(--desktop-inspector-control-active-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]",
  DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
)
export const DESKTOP_INSPECTOR_DROPDOWN_ITEM_CLASS = cn(
  "h-[length:var(--dn-control-height-compact)] cursor-pointer rounded-[length:var(--desktop-inspector-radius)] px-[length:var(--dn-row-px)] font-medium text-[var(--desktop-inspector-fg-tertiary)] outline-none transition focus:bg-[var(--desktop-inspector-control-hover-bg)] focus:text-[var(--desktop-inspector-fg-primary)] focus:**:text-[var(--desktop-inspector-fg-primary)] data-[highlighted]:bg-[var(--desktop-inspector-control-hover-bg)] data-[highlighted]:text-[var(--desktop-inspector-fg-primary)] data-[highlighted]:**:text-[var(--desktop-inspector-fg-primary)] data-[state=checked]:bg-[var(--desktop-inspector-option-selected-bg)] data-[state=checked]:text-[var(--desktop-inspector-fg-primary)] data-[state=checked]:focus:bg-[var(--desktop-inspector-option-selected-bg)] data-[state=checked]:focus:text-[var(--desktop-inspector-fg-primary)] data-[state=checked]:data-[highlighted]:bg-[var(--desktop-inspector-option-selected-bg)] data-[state=checked]:data-[highlighted]:text-[var(--desktop-inspector-fg-primary)] [&_[data-slot=dropdown-menu-radio-item-indicator]]:hidden",
  DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
)
export const DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS =
  "desktop-inspector-press cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
/** Option tiles: no grey hover fill. Selected chrome stays white pill; preview scales via SCALE_PREVIEW. */
export const DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS = cn(
  "rounded-[length:var(--desktop-inspector-radius)] border-2 border-transparent bg-transparent font-medium text-[var(--desktop-inspector-fg-tertiary)] transition-colors hover:bg-transparent hover:text-[var(--desktop-inspector-fg-primary)]",
  DESKTOP_INSPECTOR_TYPE_CAPTION_CLASS,
)
export const DESKTOP_INSPECTOR_OPTION_TILE_SCALE_SURFACE_CLASS =
  DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS
/** Preview scale timing lives in desktop-inspector-motion.css */
export const DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS = ""
export const DESKTOP_INSPECTOR_LAYER_ROW_CLASS =
  "group grid h-[length:var(--dn-control-height-compact)] min-w-0 grid-cols-[1fr_auto] items-center gap-[length:var(--dn-space-inline)] rounded-[length:var(--desktop-inspector-radius)] px-[length:var(--dn-space-inline)] transition-[background-color,color] duration-150 ease-out"
export const DESKTOP_INSPECTOR_LAYER_ROW_SELECTED_CLASS =
  "bg-[var(--desktop-inspector-option-selected-bg)] text-[var(--desktop-inspector-option-selected-fg,var(--desktop-inspector-fg-primary))]"
export const DESKTOP_INSPECTOR_LAYER_ROW_IDLE_CLASS =
  "text-[var(--desktop-inspector-fg-secondary)] hover:bg-[var(--desktop-inspector-control-hover-bg)]"
export const DESKTOP_INSPECTOR_LAYER_ACTION_CLASS = cn(
  "desktop-layer-row-action grid size-[length:var(--dn-icon-hit)] shrink-0 place-items-center rounded-[length:var(--desktop-inspector-radius)] text-[var(--desktop-inspector-fg-tertiary)] transition-[background-color,color,opacity] duration-150 ease-out",
  "hover:bg-[var(--desktop-inspector-control-hover-bg)] hover:text-[var(--desktop-inspector-fg-primary)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]",
  "disabled:cursor-not-allowed disabled:opacity-30",
  "group-data-[selected=true]:text-[var(--desktop-inspector-option-selected-fg,var(--desktop-inspector-fg-primary))]",
)
export const DESKTOP_INSPECTOR_POPOVER_HEADER_CLASS =
  "flex items-center justify-between gap-3 border-b border-[var(--desktop-inspector-control-border-hover,rgba(255,255,255,0.08))] px-3 py-2.5"
