"use client";

import { m } from "motion/react";
import { useState, type ReactNode } from "react";

import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { cuelumeAttrs } from "@/features/shell/audio/cuelume";
import { cn } from "@/lib/utils";

export type IslandItem = {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
  dataSlot?: string;
  popover?: ReactNode;
  variant?: "icon" | "text" | "icon-label";
  pressed?: boolean;
  group?: string;
  cuelume?: "button" | "none" | "toggle";
};

type IslandCardProps = {
  items: IslandItem[];
  trailing?: ReactNode;
};

/**
 * Floating pill card for the workspace island. Items sharing a `group` sit in
 * one pill; a new group starts a new pill. Items can open popovers instead of
 * firing `onClick`.
 */
export function IslandCard({ items, trailing }: IslandCardProps) {
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);

  const runs = items.reduce<{ item: IslandItem; index: number }[][]>((acc, item, index) => {
    const last = acc[acc.length - 1];
    if (last && last[0].item.group === item.group) {
      last.push({ item, index });
    } else {
      acc.push([{ item, index }]);
    }
    return acc;
  }, []);

  const renderItemButton = (item: IslandItem, index: number) => {
    const isText = item.variant === "text";
    const isIconLabel = item.variant === "icon-label";
    const attrs = cuelumeAttrs(item.cuelume ?? "button");

    return (
      <button
        type="button"
        aria-label={item.ariaLabel ?? item.label}
        data-slot={item.dataSlot}
        disabled={item.disabled}
        onClick={item.onClick}
        aria-pressed={item.pressed || undefined}
        {...attrs}
        className={cn(
          isIconLabel
            ? "flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors hover:text-[var(--glass-button-hover-fg,currentColor)] disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4"
            : isText
              ? "flex h-9 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors hover:text-[var(--glass-button-hover-fg,currentColor)] disabled:cursor-not-allowed disabled:opacity-40"
              : "flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:text-[var(--glass-button-hover-fg,currentColor)] disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4",
          item.pressed && "text-[var(--glass-button-hover-fg,currentColor)]",
        )}
      >
        {isIconLabel ? (
          <>
            <div className="flex items-center justify-center">{item.icon}</div>
            <span>{item.label}</span>
          </>
        ) : isText ? (
          <span>{item.label}</span>
        ) : (
          <>
            <div className="flex items-center justify-center">{item.icon}</div>
            <span className="sr-only">{item.label}</span>
          </>
        )}
      </button>
    );
  };

  return (
    <div className="overflow-visible">
      <div className="flex items-center justify-center gap-2 overflow-visible text-[var(--glass-fg,rgba(255,255,255,0.72))]">
        {runs.map((run, runIndex) => (
          <m.div
            key={runIndex}
            layout
            transition={{ duration: 0.27, ease: [0.25, 1, 0.5, 1] }}
            data-slot="island-pill"
            className="ds-resize t-resize inline-flex items-center justify-center gap-1 rounded-full bg-[var(--glass-bg,rgba(22,22,22,0.95))] p-1 backdrop-blur-xl"
          >
            {run.map(({ item, index }) => {
              const button = renderItemButton(item, index);

              if (item.popover) {
                return (
                  <Popover
                    key={index}
                    modal={false}
                    open={openPopoverIndex === index}
                    onOpenChange={(open) => setOpenPopoverIndex(open ? index : null)}
                  >
                    <PopoverTrigger asChild>{button}</PopoverTrigger>
                    {item.popover}
                  </Popover>
                );
              }

              return <span key={index}>{button}</span>;
            })}
            {runIndex === runs.length - 1 ? trailing : null}
          </m.div>
        ))}
        {runs.length === 0 && trailing ? (
          <m.div
            layout
            transition={{ duration: 0.27, ease: [0.25, 1, 0.5, 1] }}
            data-slot="island-pill"
            className="ds-resize t-resize inline-flex items-center justify-center gap-1 rounded-full bg-[var(--glass-bg,rgba(22,22,22,0.95))] p-1 backdrop-blur-xl"
          >
            {trailing}
          </m.div>
        ) : null}
      </div>
    </div>
  );
}
