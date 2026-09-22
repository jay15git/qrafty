import { cn } from "@/lib/utils"

export const DESKTOP_INSPECTOR_CONTROL_HEIGHT_CLASS =
  "h-[length:var(--settings-control-height)]"
export const DESKTOP_INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS =
  "h-[length:var(--settings-control-height-compact)]"
export const DESKTOP_INSPECTOR_RADIUS_CLASS =
  "rounded-[length:var(--settings-radius)]"

const DESKTOP_INSPECTOR_FG_SECONDARY =
  "text-[var(--settings-fg-secondary)]"
const DESKTOP_INSPECTOR_FG_MUTED =
  "text-[var(--settings-fg-muted)]"
export const DESKTOP_INSPECTOR_TYPE_VALUE_CLASS =
  "text-[length:var(--settings-type-value)] leading-[1.45]"
const DESKTOP_INSPECTOR_TYPE_LABEL_CLASS =
  "text-[length:var(--settings-type-label)]"
const DESKTOP_INSPECTOR_TYPE_CAPTION_CLASS =
  "text-[length:var(--settings-type-caption)]"
export const DESKTOP_INSPECTOR_SECTION_HEADING_CLASS =
  cn(
    "mb-0 truncate pl-0.5 font-medium uppercase tracking-[0.05em] text-[var(--settings-fg-muted)]",
    DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
  )
const DESKTOP_INSPECTOR_VALUE_CLASS = cn(
  "font-medium tabular-nums text-[var(--settings-fg-primary)]",
  DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
)
export const DESKTOP_INSPECTOR_CAPTION_CLASS = cn(
  "font-medium text-[var(--settings-fg-muted)]",
  DESKTOP_INSPECTOR_TYPE_CAPTION_CLASS,
)
export const DESKTOP_INSPECTOR_SECTION_GAP_CLASS = "mt-2"
const DESKTOP_INSPECTOR_ROW_GAP_CLASS = "gap-[length:var(--space-inline)]"
const DESKTOP_INSPECTOR_ROW_CLASS =
  "flex min-h-[length:var(--settings-control-height)] min-w-0 items-center justify-between gap-[length:var(--settings-row-px)] rounded-[length:var(--settings-radius)] bg-[var(--settings-control)] px-[length:var(--settings-row-px)]"
export const DESKTOP_INSPECTOR_LABEL_CLASS = cn(
  "truncate font-medium text-[var(--settings-fg-label)]",
  DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
)
export const DESKTOP_INSPECTOR_CONTROL_CLASS =
  "cursor-pointer rounded-[length:var(--settings-radius)] border border-transparent bg-transparent text-[var(--settings-fg-tertiary)] transition-[background-color,border-color,color] duration-150 ease-out hover:border-[var(--settings-control-border-hover)] hover:bg-[var(--settings-control-hover-bg)] hover:text-[var(--settings-fg-primary)] active:bg-[var(--settings-control-active-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--settings-focus)] disabled:cursor-not-allowed"
export const DESKTOP_INSPECTOR_SELECTED_CLASS =
  "border-transparent bg-[var(--settings-option-selected-bg)] text-[var(--settings-option-selected-fg)] hover:border-transparent hover:bg-[var(--settings-option-selected-bg)] hover:text-[var(--settings-option-selected-fg)]"
export const DESKTOP_INSPECTOR_INPUT_CLASS = cn(
  "desktop-inspector-input-bg bg-[var(--settings-field-bg)] font-medium text-[var(--settings-fg-primary)] outline-none placeholder:text-[var(--settings-fg-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--settings-focus)]",
  DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
)
const DESKTOP_INSPECTOR_RESET_CLASS = cn(
  "flex h-[length:var(--settings-control-height)] w-full cursor-pointer items-center justify-center gap-[length:var(--space-inline)] rounded-[length:var(--settings-radius)] border border-transparent bg-transparent px-[length:var(--settings-row-px)] font-medium text-[var(--settings-fg-secondary)] transition-[background-color,border-color,color] duration-150 ease-out hover:border-[var(--settings-control-border-hover)] hover:bg-[var(--settings-control-hover-bg)] hover:text-[var(--settings-fg-primary)] active:bg-[var(--settings-control-active-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--settings-focus)]",
  DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
)
const DESKTOP_INSPECTOR_DROPDOWN_ITEM_CLASS = cn(
  "h-[length:var(--settings-control-height-compact)] cursor-pointer rounded-[length:var(--settings-radius)] px-[length:var(--settings-row-px)] font-medium text-[var(--settings-fg-tertiary)] outline-none transition focus:bg-[var(--settings-control-hover-bg)] focus:text-[var(--settings-fg-primary)] focus:**:text-[var(--settings-fg-primary)] data-[highlighted]:bg-[var(--settings-control-hover-bg)] data-[highlighted]:text-[var(--settings-fg-primary)] data-[highlighted]:**:text-[var(--settings-fg-primary)] data-[state=checked]:bg-[var(--settings-option-selected-bg)] data-[state=checked]:text-[var(--settings-fg-primary)] data-[state=checked]:focus:bg-[var(--settings-option-selected-bg)] data-[state=checked]:focus:text-[var(--settings-fg-primary)] data-[state=checked]:data-[highlighted]:bg-[var(--settings-option-selected-bg)] data-[state=checked]:data-[highlighted]:text-[var(--settings-fg-primary)] [&_[data-slot=dropdown-menu-radio-item-indicator]]:hidden",
  DESKTOP_INSPECTOR_TYPE_VALUE_CLASS,
)
export const DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS =
  "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35"
/** Option tiles: no grey hover fill. Selected chrome stays white pill. */
export const DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS = cn(
  "rounded-[length:var(--settings-radius)] border-2 border-transparent bg-transparent font-medium text-[var(--settings-fg-tertiary)] transition-colors hover:bg-transparent hover:text-[var(--settings-fg-primary)]",
  DESKTOP_INSPECTOR_TYPE_CAPTION_CLASS,
)
export const DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS = ""
export const DESKTOP_INSPECTOR_LAYER_ROW_SELECTED_CLASS =
  "bg-[var(--settings-option-selected-bg)] text-[var(--settings-option-selected-fg,var(--settings-fg-primary))]"
export const DESKTOP_INSPECTOR_LAYER_ACTION_CLASS = cn(
  "desktop-layer-row-action grid size-[length:var(--settings-icon-hit)] shrink-0 place-items-center rounded-[length:var(--settings-radius)] text-[var(--settings-fg-tertiary)] transition-[background-color,color,opacity] duration-150 ease-out",
  "hover:bg-[var(--settings-control-hover-bg)] hover:text-[var(--settings-fg-primary)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--settings-focus)]",
  "disabled:cursor-not-allowed disabled:opacity-30",
  "group-data-[selected=true]:text-[var(--settings-option-selected-fg,var(--settings-fg-primary))]",
)
export const DESKTOP_INSPECTOR_POPOVER_HEADER_CLASS =
  "flex items-center justify-between gap-3 border-b border-[var(--settings-control-border-hover,rgba(255,255,255,0.08))] px-3 py-2.5"
