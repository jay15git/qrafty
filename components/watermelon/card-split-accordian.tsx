'use client';

import React, { useId, useState, type FC, type ReactNode, type Ref } from 'react';
import { motion, MotionConfig, type Transition } from 'motion/react';
import { ChevronRight, Send } from 'lucide-react';
import { HiCursorArrowRipple } from 'react-icons/hi2';
import { Layers } from 'lucide-react';
import { IoIosTimer } from 'react-icons/io';
import { PiHandTap } from 'react-icons/pi';
import useMeasure from 'react-use-measure';

import { CUELUME_BUTTON } from '@/features/desktop-shell/audio/desktop-cuelume';
import { cn } from '@/lib/utils';

export interface AccordionItemData {
  id: number;
  title: string;
  icon: React.ReactNode;
  content: string;
}

export interface CardSplitAccordionItem {
  key: string;
  title: ReactNode;
  icon?: ReactNode;
  content: ReactNode;
}

interface CardSplitItemProps {
  item: CardSplitAccordionItem;
  index: number;
  total: number;
  openIndex: number;
  itemId: string;
  panelId: string;
  onToggle: () => void;
}

export interface CardSplitAccordionProps {
  items: CardSplitAccordionItem[];
  openIndex?: number | null;
  onOpenIndexChange?: (index: number | null) => void;
  /** Pinned content rendered after the items, inside the stack. */
  footer?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  /** Ref to the outer stack element (used to anchor overlays). */
  ref?: Ref<HTMLDivElement>;
}

interface AccordionProps {
  items?: AccordionItemData[];
}

const springTransition: Transition = {
  type: 'spring',
  stiffness: 600,
  damping: 50,
  mass: 1,
};

const DEFAULT_ITEMS: AccordionItemData[] = [
  {
    id: 1,
    title: 'What is Interaction Design?',
    icon: <HiCursorArrowRipple className="size-3 -rotate-10 md:size-4" />,
    content:
      'Interaction design focuses on creating engaging interfaces with well-thought-out behaviors and actions.',
  },
  {
    id: 2,
    title: 'Principles & Patterns',
    icon: <Layers size={24} />,
    content:
      'Fundamental guidelines and repeated solutions that ensure consistency and usability in design.',
  },
  {
    id: 3,
    title: 'Usability & Accessibility',
    icon: <PiHandTap size={26} className="-rotate-20" />,
    content:
      'Designing experiences that are easy to use and accessible to people of all abilities.',
  },
  {
    id: 4,
    title: 'Prototyping & Testing',
    icon: <Send size={24} />,
    content:
      'Rapid experimentation and validation of ideas through prototypes and real user testing.',
  },
  {
    id: 5,
    title: 'UX Optimisation',
    icon: <IoIosTimer size={26} />,
    content:
      'Improving user experience by analyzing behavior and refining interactions over time.',
  },
];

const CardSplitItem: FC<CardSplitItemProps> = ({
  item,
  index,
  total,
  openIndex,
  itemId,
  panelId,
  onToggle,
}) => {
  const [ref, bounds] = useMeasure();
  const isOpen = index === openIndex;

  const isFirst = index === 0;
  const isLast = index === total - 1;

  const isBeforeOpen = index === openIndex - 1;
  const isAfterOpen = index === openIndex + 1;

  const isAlone = (isAfterOpen && isLast) || (isBeforeOpen && isFirst);

  let borderTopLeftRadius = 0;
  let borderTopRightRadius = 0;
  let borderBottomLeftRadius = 0;
  let borderBottomRightRadius = 0;

  if (isOpen || isAlone) {
    borderTopLeftRadius = 20;
    borderTopRightRadius = 20;
    borderBottomLeftRadius = 20;
    borderBottomRightRadius = 20;
  } else if (isBeforeOpen) {
    borderBottomLeftRadius = 20;
    borderBottomRightRadius = 20;
  } else if (isAfterOpen) {
    borderTopLeftRadius = 20;
    borderTopRightRadius = 20;
  } else if (isFirst) {
    borderTopLeftRadius = 20;
    borderTopRightRadius = 20;
  } else if (isLast) {
    borderBottomLeftRadius = 20;
    borderBottomRightRadius = 20;
  }

  return (
    <MotionConfig transition={springTransition}>
      <motion.div
        layout="position"
        data-focused={isOpen ? 'true' : undefined}
        className="card-split-item"
        animate={{
          borderTopLeftRadius,
          borderTopRightRadius,
          borderBottomLeftRadius,
          borderBottomRightRadius,
          marginTop: isOpen ? 10 : 0,
          marginBottom: isOpen ? 10 : 0,
        }}
      >
        <button
          id={itemId}
          type="button"
          aria-controls={panelId}
          aria-expanded={isOpen}
          onClick={onToggle}
          {...CUELUME_BUTTON}
          className="flex w-full cursor-pointer select-none items-center justify-between text-left"
        >
          <span className="inline-flex min-w-0 items-center">
            {item.icon ? (
              <span aria-hidden className="dn-settings-section-icon-slot">
                {item.icon}
              </span>
            ) : null}
            <span className="truncate">{item.title}</span>
          </span>

          <motion.span
            aria-hidden="true"
            initial={false}
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 480, damping: 28 }}
            className="inline-flex shrink-0 items-center justify-center"
          >
            <ChevronRight strokeWidth={1.75} />
          </motion.span>
        </button>

        <motion.div
          id={panelId}
          role="region"
          aria-labelledby={itemId}
          initial={false}
          animate={{
            height: isOpen ? bounds.height : 0,
            opacity: isOpen ? 1 : 0,
          }}
          className="overflow-hidden will-change-transform"
        >
          <div ref={ref}>{item.content}</div>
        </motion.div>
      </motion.div>
    </MotionConfig>
  );
};

export function CardSplitAccordion({
  items,
  openIndex,
  onOpenIndexChange,
  footer,
  className,
  style,
  ref,
}: CardSplitAccordionProps) {
  const rawId = useId();
  const baseId = `card-split-${rawId.replace(/:/g, '')}`;

  const [internalOpenIndex, setInternalOpenIndex] = useState<number | null>(
    null,
  );
  const isControlled = onOpenIndexChange !== undefined;
  const currentOpenIndex = isControlled ? (openIndex ?? null) : internalOpenIndex;
  const resolvedOpenIndex = currentOpenIndex ?? -1;

  const toggle = (index: number) => {
    const next = currentOpenIndex === index ? null : index;
    if (isControlled) {
      onOpenIndexChange?.(next);
    } else {
      setInternalOpenIndex(next);
    }
  };

  return (
    <div
      ref={ref}
      className={cn('card-split-accordion flex flex-col', className)}
      style={style}
    >
      {items.map((item, index) => (
        <CardSplitItem
          key={item.key}
          item={item}
          index={index}
          total={items.length}
          openIndex={resolvedOpenIndex}
          itemId={`${baseId}-trigger-${index}`}
          panelId={`${baseId}-panel-${index}`}
          onToggle={() => toggle(index)}
        />
      ))}
      {footer ? (
        <div
          data-slot="card-split-accordion-footer"
          className="mt-auto shrink-0"
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}

export const AccordionApp: FC<AccordionProps> = ({ items }) => {
  const defaultItems = items ?? DEFAULT_ITEMS;
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="flex w-full flex-col items-center justify-center p-6 transition-colors duration-500">
      <CardSplitAccordion
        className="w-xs md:w-sm"
        items={defaultItems.map((item) => ({
          key: String(item.id),
          title: item.title,
          icon: item.icon,
          content: item.content,
        }))}
        openIndex={openIndex}
        onOpenIndexChange={setOpenIndex}
      />
    </div>
  );
};
