"use client";

import * as React from "react";
import { m } from "motion/react";

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
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setContentH(el.scrollHeight));
    ro.observe(el);
    setContentH(el.scrollHeight);
    return () => ro.disconnect();
  }, []);

  return (
    <m.div
      layout
      data-focused={isOpen ? "true" : undefined}
      className={cn(
        "overflow-hidden rounded-[30px] bg-surface text-foreground shadow-xs",
        isOpen && " ",
      )}
      transition={{ type: "spring", stiffness: 280, damping: 28, mass: 0.9 }}
      animate={{ scale: isOpen ? 1 : 0.985 }}
      initial={false}
      style={{ originX: 0.5, originY: 0 }}
    >
      <button
        id={itemId}
        type="button"
        aria-controls={panelId}
        aria-expanded={isOpen}
        onClick={onToggle}
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
            rotate: isOpen ? 180 : 0,
            scale: isOpen ? 1.05 : 1,
          }}
          transition={{ type: "spring", stiffness: 480, damping: 28 }}
          className="inline-flex size-12 shrink-0 items-center justify-center text-foreground"
        >
          {isOpen ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 2"
              fill="none"
              aria-hidden
            >
              <path
                d="M1 1h12"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden
            >
              <path
                d="M7 1v12M1 7h12"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          )}
        </m.span>
      </button>

      <m.div
        id={panelId}
        role="region"
        aria-labelledby={itemId}
        animate={{
          height: isOpen ? contentH : 0,
          opacity: isOpen ? 1 : 0,
        }}
        initial={false}
        transition={{
          height: { type: "spring", stiffness: 340, damping: 34, mass: 0.9 },
          opacity: { duration: 0.2, ease: "easeOut" },
        }}
        style={{ overflow: "hidden" }}
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

  return (
    <div className={cn("w-full min-w-0 max-w-full", className)}>
      <div className="flex flex-col rounded-[34px] p-3" style={{ gap }}>
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
          )
        })}
      </div>
    </div>
  );
}
