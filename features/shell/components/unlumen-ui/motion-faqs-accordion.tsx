"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { m } from "motion/react";

import { CUELUME_BUTTON } from "@/features/shell/audio/cuelume";
import {
  SettingsAccordionPopoverOpenMarker,
  SettingsAccordionPopoverProvider,
} from "@/features/shell/inspector/SettingsAccordionPopoverContext";
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
   * Pins the whole accordion card to a fixed pixel height. Open panels are
   * capped so every section header stays visible; tall panels scroll inside.
   */
  cardHeight?: number | null;
  /** Pinned content rendered at the top of the card, inside the surface. */
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
  maxPanelHeight,
}: {
  item: MotionAccordionItem;
  isOpen: boolean;
  onToggle: () => void;
  itemId: string;
  panelId: string;
  maxPanelHeight?: number | null;
}) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [contentH, setContentH] = React.useState(0);

  React.useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContentH(el.scrollHeight));
    ro.observe(el);
    setContentH(el.scrollHeight);
    return () => ro.disconnect();
  }, []);

  const panelHeight =
    maxPanelHeight != null ? Math.min(contentH, maxPanelHeight) : contentH;
  const panelScrolls = isOpen && contentH > panelHeight + 1;

  return (
    <div
      data-slot="motion-accordion-item"
      data-focused={isOpen ? "true" : undefined}
      className={cn(
        "rounded-[30px] bg-surface text-foreground shadow-xs",
        maxPanelHeight != null && "shrink-0",
      )}
    >
      <button
        id={itemId}
        type="button"
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={onToggle}
        {...CUELUME_BUTTON}
        className="flex w-full cursor-pointer select-none items-center justify-between gap-4 px-7 py-5 text-left"
      >
        <span className="inline-flex min-w-0 items-center gap-2 font-medium tracking-tight">
          {item.icon ? (
            <span aria-hidden className="dn-settings-section-icon-slot">
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
          gridTemplateRows: isOpen ? `${panelHeight}px` : "0px",
          opacity: isOpen ? 1 : 0,
        }}
        transition={{
          gridTemplateRows: { type: "spring", stiffness: 340, damping: 34, mass: 0.9 },
          opacity: { duration: 0.2, ease: "easeOut" },
        }}
        style={{ display: "grid" }}
      >
        <div
          ref={contentRef}
          className="min-h-0"
          style={{
            overflow: "hidden",
            overflowY: panelScrolls ? "auto" : "hidden",
          }}
        >
          <m.div
            animate={{ y: isOpen ? 0 : -8 }}
            transition={{
              type: "spring",
              stiffness: 360,
              damping: 30,
              mass: 0.8,
            }}
            className="min-w-0 px-7 pb-7"
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
  cardHeight = null,
  header,
  footer,
}: MotionAccordionProps) {
  const rawId = React.useId();
  const baseId = `accordion-${rawId.replace(/:/g, "")}`;
  const [itemKeyMap] = React.useState(
    () => new WeakMap<MotionAccordionItem, string>(),
  );

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

  const [internalOpenIndex, setInternalOpenIndex] = React.useState<number | null>(
    null,
  );
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

  // Space left for the open panel once every header + card chrome is paid for.
  const [panelCapPx, setPanelCapPx] = React.useState<number | null>(null);

  React.useLayoutEffect(() => {
    const el = accordionRef.current;
    if (!el || cardHeight == null) {
      setPanelCapPx(null);
      return;
    }

    const measure = () => {
      let headers = 0;
      el.querySelectorAll<HTMLElement>(':scope > [data-slot="motion-accordion-item"] > button').forEach(
        (button) => {
          headers += button.offsetHeight;
        },
      );
      const style = getComputedStyle(el);
      const padY =
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const headerH =
        el.querySelector<HTMLElement>('[data-slot="motion-accordion-header"]')
          ?.offsetHeight ?? 0;
      const footerH =
        el.querySelector<HTMLElement>('[data-slot="motion-accordion-footer"]')
          ?.offsetHeight ?? 0;
      setPanelCapPx(
        Math.max(
          0,
          cardHeight -
            headers -
            padY -
            headerH -
            footerH -
            gap * Math.max(0, items.length - 1 + (header ? 1 : 0) + (footer ? 1 : 0)),
        ),
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cardHeight, gap, items.length, header, footer]);

  const maxPanelHeight = cardHeight == null ? null : (panelCapPx ?? cardHeight);

  return (
    <SettingsAccordionPopoverProvider cardRef={accordionRef}>
      <SettingsAccordionPopoverOpenMarker className={cn("w-full min-w-0 max-w-full", className)}>
        <div
          ref={accordionRef}
          className="flex flex-col rounded-[34px] p-3"
          style={
            {
              gap,
              height: cardHeight ?? undefined,
              "--settings-accordion-gap": `${gap}px`,
            } as React.CSSProperties
          }
        >
        {header ? (
          <div
            data-slot="motion-accordion-header"
            className="sticky -top-1.5 z-10 shrink-0 bg-inherit"
          >
            {header}
          </div>
        ) : null}
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
              maxPanelHeight={maxPanelHeight}
            />
          )
        })}
        {footer ? (
          <div
            data-slot="motion-accordion-footer"
            className="sticky bottom-0 z-10 mt-auto shrink-0 bg-inherit"
          >
            {footer}
          </div>
        ) : null}
        </div>
      </SettingsAccordionPopoverOpenMarker>
    </SettingsAccordionPopoverProvider>
  );
}
