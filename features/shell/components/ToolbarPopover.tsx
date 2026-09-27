"use client";

import type { ReactNode } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { PopoverClose, PopoverContent } from "@/components/ui/popover";
import { SettingsPopoverCloseButton } from "@/features/shell/settings/settings-ui";
import { cn } from "@/lib/utils";

/**
 * Popover shell for the dynamic-island toolbar buttons.
 *
 * The body is a grid row (`minmax(0, 1fr)`) rather than a flex child: a flex
 * child of an auto-height popover resolves to its content height, so the
 * ScrollArea viewport grew past the popover's `max-h` and the overflow was
 * clipped instead of scrolled. A grid row clamped by the popover's `max-h`
 * gives the viewport a definite height, so it actually scrolls.
 */
export function ToolbarPopoverContent({
  children,
  dataSlot = "toolbar-popover",
  disableScroll = false,
  fitContent = true,
  flush = false,
  theme = "dark",
  title,
}: {
  children: ReactNode;
  dataSlot?: string;
  disableScroll?: boolean;
  fitContent?: boolean;
  flush?: boolean;
  theme?: "light" | "dark";
  /** Popover chrome header — centered title + top-right close, matching the
   *  settings-panel popovers. */
  title?: string;
}) {
  const heightClass = fitContent
    ? "max-h-[var(--popover-max-h)]"
    : "h-[var(--popover-max-h)] max-h-[var(--popover-max-h)]";

  const content = disableScroll ? (
    <div
      className={cn(
        "flex h-full min-h-0 flex-1 flex-col overflow-hidden",
        flush ? "p-0" : "px-3 py-3",
      )}
      data-slot="settings-scroll"
    >
      {children}
    </div>
  ) : (
    <ScrollArea
      chevron
      cueSize="comfortable"
      className="min-h-0"
      data-slot="settings-scroll-area"
      scrollFade
      viewportClassName={flush ? "p-0" : "px-3 py-3"}
    >
      <div data-slot="settings-scroll">{children}</div>
    </ScrollArea>
  );

  return (
    <PopoverContent
      align="center"
      collisionPadding={12}
      data-slot={dataSlot}
      data-theme={theme}
      side="bottom"
      sideOffset={12}
      className={cn(
        "ds-portal-surface ds-popover-content ds-popover-flat z-[var(--z-popover)] grid w-[var(--popover-width)] overflow-hidden p-0 ds-squircle-md",
        title ? "grid-rows-[auto_minmax(0,1fr)]" : "grid-rows-[minmax(0,1fr)]",
        theme === "dark" && "dark",
        heightClass,
      )}
    >
      {title ? (
        <div className="ds-settings-popover-header">
          <p className="ds-settings-popover-title">{title}</p>
          <PopoverClose asChild>
            <SettingsPopoverCloseButton title={title} />
          </PopoverClose>
        </div>
      ) : null}
      {content}
    </PopoverContent>
  );
}
