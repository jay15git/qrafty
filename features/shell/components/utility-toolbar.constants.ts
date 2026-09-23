export const UTILITY_TOOLBAR_SHELL_CLASS =
  "inline-flex min-h-11 items-center gap-1 border-0 bg-transparent p-0 text-[var(--glass-fg)] shadow-none";

const GLASS_TOOLBAR_ICON_BUTTON_CLASS =
  "relative grid size-9 shrink-0 cursor-pointer place-items-center overflow-visible rounded-none border-0 bg-transparent p-0 text-current shadow-none transition-colors duration-150 hover:bg-transparent hover:text-[var(--glass-button-hover-fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--glass-button-focus-ring)] disabled:cursor-not-allowed disabled:opacity-35 [&_svg]:size-3.5";

const BOXED_TOOLBAR_ICON_CLASS = "size-5 shrink-0";

const BOXED_TOOLBAR_BUTTON_CLASS = "[&_svg]:!size-5";

const COMPOSE_TOOLBAR_ICON_BUTTON_CLASS = GLASS_TOOLBAR_ICON_BUTTON_CLASS;
