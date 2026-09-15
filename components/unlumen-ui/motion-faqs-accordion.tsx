"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { m } from "motion/react";

import { CUELUME_BUTTON } from "@/features/desktop-shell/audio/desktop-cuelume";
import {
  SettingsAccordionPopoverOpenMarker,
  SettingsAccordionPopoverProvider,
} from "@/features/desktop-shell/inspector/settings-accordion-popover-context";
import { cn } from "@/lib/utils";

export interface MotionAccordionItem {
  question: React.ReactNode;
  answer: React.ReactNode;
  icon?: React.ReactNode;
}

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
    <m.div
      layout
      data-focused={isOpen ? "true" : undefined}
      className={cn(
        "rounded-[30px] bg-surface text-foreground shadow-xs",
        maxPanelHeight != null && "shrink-0",
        isOpen && " ",
      )}
      transition={{ type: "spring", stiffness: 280, damping: 28, mass: 0.9 }}
      initial={false}
      style={{ originX: 0.5, originY: 0 }}
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

      <m.div
        id={panelId}
        role="region"
        aria-labelledby={itemId}
        animate={{
          height: isOpen ? panelHeight : 0,
          opacity: isOpen ? 1 : 0,
        }}
        initial={false}
        transition={{
          height: { type: "spring", stiffness: 340, damping: 34, mass: 0.9 },
          opacity: { duration: 0.2, ease: "easeOut" },
        }}
        style={{
          overflow: "hidden",
          overflowY: panelScrolls ? "auto" : "hidden",
        }}
      >
        <m.div
          ref={contentRef}
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
      </m.div>
    </m.div>
  );
}

export function MotionAccordion({
  items,
  gap = 10,
  className,
  openIndex = null,
  onOpenIndexChange,
  cardHeight = null,
  footer,
}: MotionAccordionProps) {
  const rawId = React.useId();
  const baseId = `accordion-${rawId.replace(/:/g, "")}`;
  const itemKeyMapRef = React.useRef(new WeakMap<MotionAccordionItem, string>());
  const itemKeyCounterRef = React.useRef(0);

  const getStableItemKey = React.useCallback(
    (item: MotionAccordionItem) => {
      if (typeof item.question === "string") {
        return `${baseId}-${item.question}`;
      }

      const cachedKey = itemKeyMapRef.current.get(item);
      if (cachedKey) {
        return cachedKey;
      }

      const nextKey = `${baseId}-item-${itemKeyCounterRef.current}`;
      itemKeyCounterRef.current += 1;
      itemKeyMapRef.current.set(item, nextKey);
      return nextKey;
    },
    [baseId],
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
      el.querySelectorAll<HTMLElement>(":scope > div > button").forEach(
        (button) => {
          headers += button.offsetHeight;
        },
      );
      const style = getComputedStyle(el);
      const padY =
        parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
      const footerH =
        el.querySelector<HTMLElement>('[data-slot="motion-accordion-footer"]')
          ?.offsetHeight ?? 0;
      setPanelCapPx(
        Math.max(
          0,
          cardHeight -
            headers -
            padY -
            footerH -
            gap * Math.max(0, items.length - 1 + (footer ? 1 : 0)),
        ),
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cardHeight, gap, items.length, footer]);

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
              "--dn-accordion-gap": `${gap}px`,
            } as React.CSSProperties
          }
        >
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
            className="mt-auto shrink-0"
          >
            {footer}
          </div>
        ) : null}
        </div>
      </SettingsAccordionPopoverOpenMarker>
    </SettingsAccordionPopoverProvider>
  );
}
