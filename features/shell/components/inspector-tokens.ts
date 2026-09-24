import { cn } from "@/lib/utils";

export const INSPECTOR_CONTROL_HEIGHT_CLASS = "h-[length:var(--control-height)]";
export const INSPECTOR_CONTROL_HEIGHT_COMPACT_CLASS = "h-[length:var(--control-height-compact)]";
export const INSPECTOR_RADIUS_CLASS = "rounded-[length:var(--radius-control)]";

const INSPECTOR_FG_SECONDARY = "text-[var(--fg-secondary)]";
const INSPECTOR_FG_MUTED = "text-[var(--fg-muted)]";
export const INSPECTOR_TYPE_VALUE_CLASS = "text-[length:var(--type-value)] leading-[1.45]";
const INSPECTOR_TYPE_LABEL_CLASS = "text-[length:var(--type-label)]";
const INSPECTOR_TYPE_CAPTION_CLASS = "text-[length:var(--type-caption)]";
export const INSPECTOR_SECTION_HEADING_CLASS = cn(
  "mb-0 truncate pl-0.5 font-medium uppercase tracking-[0.05em] text-[var(--fg-muted)]",
  INSPECTOR_TYPE_LABEL_CLASS,
);
const INSPECTOR_VALUE_CLASS = cn(
  "font-medium tabular-nums text-[var(--fg-primary)]",
  INSPECTOR_TYPE_VALUE_CLASS,
);
export const INSPECTOR_CAPTION_CLASS = cn(
  "font-medium text-[var(--fg-muted)]",
  INSPECTOR_TYPE_CAPTION_CLASS,
);
export const INSPECTOR_SECTION_GAP_CLASS = "mt-2";
const INSPECTOR_ROW_GAP_CLASS = "gap-[length:var(--space-inline)]";
const INSPECTOR_ROW_CLASS =
  "flex min-h-[length:var(--control-height)] min-w-0 items-center justify-between gap-[length:var(--row-px)] rounded-[length:var(--radius-control)] bg-[var(--control)] px-[length:var(--row-px)]";
export const INSPECTOR_LABEL_CLASS = cn(
  "truncate font-medium text-[var(--fg-label)]",
  INSPECTOR_TYPE_LABEL_CLASS,
);
export const INSPECTOR_CONTROL_CLASS =
  "cursor-pointer rounded-[length:var(--radius-control)] border border-transparent bg-transparent text-[var(--fg-tertiary)] transition-[background-color,border-color,color] duration-150 ease-out hover:border-[var(--control-border-hover)] hover:bg-[var(--control-hover)] hover:text-[var(--fg-primary)] active:bg-[var(--control-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:cursor-not-allowed";
export const INSPECTOR_SELECTED_CLASS =
  "border-transparent bg-[var(--option-selected-bg)] text-[var(--option-selected-fg)] hover:border-transparent hover:bg-[var(--option-selected-bg)] hover:text-[var(--option-selected-fg)]";
export const INSPECTOR_INPUT_CLASS = cn(
  "inspector-input-bg bg-[var(--control)] font-medium text-[var(--fg-primary)] outline-none placeholder:text-[var(--fg-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
  INSPECTOR_TYPE_VALUE_CLASS,
);
const INSPECTOR_RESET_CLASS = cn(
  "flex h-[length:var(--control-height)] w-full cursor-pointer items-center justify-center gap-[length:var(--space-inline)] rounded-[length:var(--radius-control)] border border-transparent bg-transparent px-[length:var(--row-px)] font-medium text-[var(--fg-secondary)] transition-[background-color,border-color,color] duration-150 ease-out hover:border-[var(--control-border-hover)] hover:bg-[var(--control-hover)] hover:text-[var(--fg-primary)] active:bg-[var(--control-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
  INSPECTOR_TYPE_VALUE_CLASS,
);
const INSPECTOR_DROPDOWN_ITEM_CLASS = cn(
  "h-[length:var(--control-height-compact)] cursor-pointer rounded-[length:var(--radius-control)] px-[length:var(--row-px)] font-medium text-[var(--fg-tertiary)] outline-none transition focus:bg-[var(--control-hover)] focus:text-[var(--fg-primary)] focus:**:text-[var(--fg-primary)] data-[highlighted]:bg-[var(--control-hover)] data-[highlighted]:text-[var(--fg-primary)] data-[highlighted]:**:text-[var(--fg-primary)] data-[state=checked]:bg-[var(--option-selected-bg)] data-[state=checked]:text-[var(--fg-primary)] data-[state=checked]:focus:bg-[var(--option-selected-bg)] data-[state=checked]:focus:text-[var(--fg-primary)] data-[state=checked]:data-[highlighted]:bg-[var(--option-selected-bg)] data-[state=checked]:data-[highlighted]:text-[var(--fg-primary)] [&_[data-slot=dropdown-menu-radio-item-indicator]]:hidden",
  INSPECTOR_TYPE_VALUE_CLASS,
);
export const INSPECTOR_OPTION_TILE_BUTTON_CLASS =
  "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35";
/** Option tiles: no grey hover fill. Selected chrome stays white pill. */
export const INSPECTOR_OPTION_TILE_SURFACE_CLASS = cn(
  "rounded-[length:var(--radius-control)] border-2 border-transparent bg-transparent font-medium text-[var(--fg-tertiary)] transition-colors hover:bg-transparent hover:text-[var(--fg-primary)]",
  INSPECTOR_TYPE_CAPTION_CLASS,
);
export const INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS = "";
export const INSPECTOR_LAYER_ROW_SELECTED_CLASS =
  "bg-[var(--option-selected-bg)] text-[var(--option-selected-fg,var(--fg-primary))]";
export const INSPECTOR_LAYER_ACTION_CLASS = cn(
  "layer-row-action grid size-[length:var(--icon-hit)] shrink-0 place-items-center rounded-[length:var(--radius-control)] text-[var(--fg-tertiary)] transition-[background-color,color,opacity] duration-150 ease-out",
  "hover:bg-[var(--control-hover)] hover:text-[var(--fg-primary)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)]",
  "disabled:cursor-not-allowed disabled:opacity-30",
  "group-data-[selected=true]:text-[var(--option-selected-fg,var(--fg-primary))]",
);
export const INSPECTOR_POPOVER_HEADER_CLASS =
  "flex items-center justify-between gap-3 border-b border-[var(--control-border-hover,rgba(255,255,255,0.08))] px-3 py-2.5";
