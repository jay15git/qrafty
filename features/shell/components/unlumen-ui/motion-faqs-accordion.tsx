"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { m } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CUELUME_BUTTON } from "@/features/shell/audio/cuelume";
import {
  SettingsAccordionPopoverOpenMarker,
  SettingsAccordionPopoverProvider,
} from "@/features/shell/settings/SettingsAccordionPopoverContext";
import { cn } from "@/lib/utils";

export interface MotionAccordionItem {
  question: React.ReactNode;
  answer: React.ReactNode;
  icon?: React.ReactNode;
}

// Monotonic sequence for stable per-item keys when the question is not a
// string. Module-scoped so the counter is never mutated through React state.
let accordionItemKeySeq = 0;

export interface MotionAccordionProps {
  items: MotionAccordionItem[];
  /** @default 10 */
  gap?: number;
  className?: string;
  openIndex?: number | null;
  onOpenIndexChange?: (index: number | null) => void;
  /**
   * The card is a fixed-height flex column: `header` and `footer` render as
   * pinned rows outside the scrollable section list.
   */
  header?: React.ReactNode;
  /** Pinned content rendered at the bottom of the card, inside the surface. */
  footer?: React.ReactNode;
}

function AccordionItem({
  item,
  isOpen,
  onToggle,
  itemId,
  panelId,
}: {
  item: MotionAccordionItem;
  isOpen: boolean;
  onToggle: () => void;
  itemId: string;
  panelId: string;
}) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = React.useState(0);

  React.useEffect(() => {
    const wrapper = contentRef.current;
    if (!wrapper) return;
    // Measure the inner content box, not the clipping wrapper: the wrapper's
    // own box is capped by the animated grid row, so a ResizeObserver on it
    // never fires when children grow — open panels stay at their first height
    // and new controls get cropped. The inner box tracks content height even
    // while clipped (its scrollHeight keeps the natural height).
    const inner = wrapper.firstElementChild;
    if (!(inner instanceof HTMLElement)) return;
    const measure = () => setContentH(inner.scrollHeight);
    const ro = new ResizeObserver(measure);
    ro.observe(inner);
    measure();
    return () => ro.disconnect();
  }, []);

  return (
    <div
      data-slot="motion-accordion-item"
      data-focused={isOpen ? "true" : undefined}
      className="rounded-[30px] bg-surface text-foreground shadow-xs"
    >
      <button
        id={itemId}
        type="button"
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={onToggle}
        {...CUELUME_BUTTON}
        className="flex w-full cursor-pointer select-none items-center justify-between gap-4 text-left"
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          {item.icon ? (
            <span aria-hidden className="ds-settings-section-icon-slot">
              {item.icon}
            </span>
          ) : null}
          <span className="truncate">{item.question}</span>
        </span>

        <m.span
          aria-hidden="true"
          initial={false}
          animate={{
            rotate: isOpen ? 90 : 0,
          }}
          transition={{ type: "spring", stiffness: 480, damping: 28 }}
          className="inline-flex size-12 shrink-0 items-center justify-center text-foreground"
        >
          <ChevronRight className="size-4.5" strokeWidth={1.75} />
        </m.span>
      </button>

      {/*
        Height is animated as grid-template-rows 0px → Npx, not `layout` —
        `layout` would scaleY-distort the header and panel contents on every
        open/close and whenever the panel re-measures mid-interaction. The
        track animates on the compositor-friendly grid row instead of the
        element's own height.
      */}
      <m.div
        id={panelId}
        role="region"
        aria-labelledby={itemId}
        initial={false}
        animate={{
          gridTemplateRows: isOpen ? `${contentH}px` : "0px",
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          gridTemplateRows: { type: "spring", stiffness: 340, damping: 34, mass: 0.9 },
          opacity: { duration: 0.2, ease: "easeOut" },
        }}
        style={{ display: "grid" }}
      >
        <div ref={contentRef} className="min-h-0 overflow-hidden">
          <m.div
            animate={{ y: isOpen ? 0 : -8 }}
            transition={{
              type: "spring",
              stiffness: 360,
              damping: 30,
              mass: 0.8,
            }}
            className="min-w-0"
          >
            {item.answer}
          </m.div>
        </div>
      </m.div>
    </div>
  );
}

export function MotionAccordion({
  items,
  gap = 10,
  className,
  openIndex = null,
  onOpenIndexChange,
  header,
  footer,
}: MotionAccordionProps) {
  const rawId = React.useId();
  const baseId = `accordion-${rawId.replace(/:/g, "")}`;
  const [itemKeyMap] = React.useState(() => new WeakMap<MotionAccordionItem, string>());

  const getStableItemKey = React.useCallback(
    (item: MotionAccordionItem) => {
      if (typeof item.question === "string") {
        return `${baseId}-${item.question}`;
      }

      const cachedKey = itemKeyMap.get(item);
      if (cachedKey) {
        return cachedKey;
      }

      const nextKey = `${baseId}-item-${accordionItemKeySeq}`;
      accordionItemKeySeq += 1;
      itemKeyMap.set(item, nextKey);
      return nextKey;
    },
    [baseId, itemKeyMap],
  );

  const [internalOpenIndex, setInternalOpenIndex] = React.useState<number | null>(null);
  const isControlled = onOpenIndexChange !== undefined;
  const currentOpenIndex = isControlled ? openIndex : internalOpenIndex;

  const toggle = (index: number) => {
    const next = currentOpenIndex === index ? null : index;

    if (isControlled) {
      onOpenIndexChange?.(next);
      return;
    }

    setInternalOpenIndex(next);
  };

  const accordionRef = React.useRef<HTMLDivElement>(null);

  return (
    <SettingsAccordionPopoverProvider cardRef={accordionRef}>
      <SettingsAccordionPopoverOpenMarker className={cn("w-full min-w-0 max-w-full", className)}>
        <div
          ref={accordionRef}
          className="flex flex-col overflow-hidden rounded-[34px] p-3"
          style={
            {
              gap,
              "--accordion-gap": `${gap}px`,
            } as React.CSSProperties
          }
        >
          {header ? (
            <div data-slot="motion-accordion-header" className="z-10 shrink-0">
              {header}
            </div>
          ) : null}
          <ScrollArea
            className="min-h-0 flex-1"
            data-slot="settings-panel-scroll"
            persistKey="settings-panel"
            scrollFade={false}
            viewportClassName="px-0"
          >
            <div className="flex flex-col" style={{ gap }}>
              {items.map((item, i) => {
                const itemKey = getStableItemKey(item);

                return (
                  <AccordionItem
                    key={itemKey}
                    item={item}
                    isOpen={currentOpenIndex === i}
                    onToggle={() => toggle(i)}
                    itemId={`${baseId}-trigger-${i}`}
                    panelId={`${baseId}-panel-${i}`}
                  />
                );
              })}
            </div>
          </ScrollArea>
          {footer ? (
            <div data-slot="motion-accordion-footer" className="z-10 shrink-0">
              {footer}
            </div>
          ) : null}
        </div>
      </SettingsAccordionPopoverOpenMarker>
    </SettingsAccordionPopoverProvider>
  );
}
