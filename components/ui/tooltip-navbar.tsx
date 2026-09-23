"use client";

import { AnimatePresence, m } from "motion/react";
import { useRef, useState, type ReactNode } from "react";

import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { desktopCuelumeAttrs } from "@/features/shell/audio/desktop-cuelume";
import { cn } from "@/lib/utils";

export type TooltipItem = {
  icon?: ReactNode;
  label: string;
  labelHasKeyword?: (string | ReactNode)[] | false;
  hasBadge?: boolean;
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

import {
  MessageCircle,
  Inbox,
  Circle,
  Crosshair,
  Download,
  Menu,
  CommandIcon,
} from "lucide-react";

interface TooltipNavbarProps {
  items: TooltipItem[];
  tooltipDelay?: number; //in ms
  trailing?: ReactNode;
}

const DEFAULT_ITEMS: TooltipItem[] = [
  {
    icon: <MessageCircle className="h-full w-full" />,
    label: "Comment",
    labelHasKeyword: ["C"],
    hasBadge: false,
  },
  {
    icon: <Inbox className="h-full w-full" />,
    label: "Inbox",
    labelHasKeyword: ["I"],
    hasBadge: true,
  },
  {
    icon: <Circle className="h-full w-full" />,
    label: "Record",
    labelHasKeyword: ["R"],
    hasBadge: false,
  },
  {
    icon: <Crosshair className="h-full w-full" />,
    label: "Focus Mode",
    labelHasKeyword: ["F"],
    hasBadge: false,
  },
  {
    icon: <Download className="h-full w-full" />,
    label: "Share",
    labelHasKeyword: ["S"],
    hasBadge: false,
  },
  {
    icon: <Menu className="h-full w-full" />,
    label: "Menu",
    labelHasKeyword: ["M"],
    hasBadge: false,
  },
];
export const TooltipNavbar = ({
  items = DEFAULT_ITEMS,
  tooltipDelay = 300,
  trailing,
}: TooltipNavbarProps) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [coords, setCoords] = useState({ clipPath: "", translateX: 0 });

  const measureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [isEntering, setIsEntering] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [openPopoverIndex, setOpenPopoverIndex] = useState<number | null>(null);
  const runs = items.reduce<{ item: TooltipItem; index: number }[][]>(
    (acc, item, index) => {
      const last = acc[acc.length - 1];
      if (last && last[0].item.group === item.group) {
        last.push({ item, index });
      } else {
        acc.push([{ item, index }]);
      }
      return acc;
    },
    [],
  );

  const renderItemButton = (item: TooltipItem, index: number) => {
    const isText = item.variant === "text";
    const isIconLabel = item.variant === "icon-label";
    const cuelumeAttrs = desktopCuelumeAttrs(item.cuelume ?? "button");

    return (
      <button
        type="button"
        aria-label={item.ariaLabel ?? item.label}
        data-slot={item.dataSlot}
        disabled={item.disabled}
        onClick={item.onClick}
        onMouseEnter={() => handleMouseEnter(index)}
        ref={(el) => {
          buttonRefs.current[index] = el;
        }}
        aria-pressed={item.pressed || undefined}
        {...cuelumeAttrs}
        className={cn(
          isIconLabel
            ? "flex h-9 cursor-pointer items-center justify-center gap-2 rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors hover:bg-[var(--glass-button-hover-bg,rgba(255,255,255,0.11))] hover:text-[var(--glass-button-hover-fg,currentColor)] disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4"
            : isText
            ? "flex h-9 cursor-pointer items-center justify-center rounded-full px-3 text-sm font-medium whitespace-nowrap transition-colors hover:bg-[var(--glass-button-hover-bg,rgba(255,255,255,0.11))] hover:text-[var(--glass-button-hover-fg,currentColor)] disabled:cursor-not-allowed disabled:opacity-40"
            : "flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-[var(--glass-button-hover-bg,rgba(255,255,255,0.11))] hover:text-[var(--glass-button-hover-fg,currentColor)] disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4",
          item.pressed &&
            "bg-[var(--glass-button-hover-bg,rgba(255,255,255,0.11))] text-[var(--glass-button-hover-fg,currentColor)]",
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

  const calculatePosition = (index: number) => {
    const activeLabel = measureRefs.current[index];
    const activeIcon = buttonRefs.current[index];

    if (!activeLabel || !activeIcon) return null;

    const labelLeft = activeLabel.offsetLeft;
    const labelWidth = activeLabel.offsetWidth;

    const iconRect = activeIcon.getBoundingClientRect();
    const stripRect = activeIcon.offsetParent?.getBoundingClientRect();
    if (!stripRect) return null;
    const translateX =
      iconRect.left + iconRect.width / 2 - (stripRect.left + labelLeft + labelWidth / 2);

    const totalWidth = measureRefs.current.reduce(
      (acc, el) => acc + (el?.offsetWidth || 0),
      0,
    );

    if (totalWidth <= 0 || labelWidth <= 0) {
      return null;
    }

    const cLeft = (labelLeft / totalWidth) * 100;
    const cRight = 100 - ((labelLeft + labelWidth) / totalWidth) * 100;

    return {
      clipPath: `inset(0 ${cRight}% 0 ${cLeft}% round 8px)`,
      translateX,
    };
  };

  const clearTooltip = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveIndex(null);
    setCoords({ clipPath: "", translateX: 0 });
    setIsEntering(true);
  };

  const handleMouseEnter = (index: number) => {
    if (openPopoverIndex !== null) return;
    if (items[index]?.variant === "text" || items[index]?.variant === "icon-label") {
      clearTooltip();
      return;
    }

    const newCoords = calculatePosition(index);
    if (!newCoords) return;

    if (activeIndex === null) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsEntering(true);

      timeoutRef.current = setTimeout(() => {
        setCoords(newCoords);
        setActiveIndex(index);
      }, tooltipDelay);
    } else {
      setCoords(newCoords);
      setActiveIndex(index);
    }
  };

  const handleMouseLeave = () => {
    clearTooltip();
  };

  return (
    <div className="overflow-visible">
      <div className="flex items-center justify-center overflow-visible">
        <div
          className="relative overflow-visible text-[var(--glass-fg,rgba(255,255,255,0.72))]"
          onMouseLeave={handleMouseLeave}
        >
          <AnimatePresence>
            {activeIndex !== null && coords.clipPath !== "" && openPopoverIndex === null && (
              <m.div
                className="pointer-events-none absolute top-full left-0 z-20 mt-1"
                data-slot="tooltip-navbar-tooltip"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <m.div
                  className="flex bg-black dark:bg-[#1d1d1d]"
                  animate={{
                    clipPath: coords.clipPath,
                    x: coords.translateX,
                  }}
                  transition={{
                    type: "spring",
                    bounce: 0,

                    duration: isEntering ? 0 : 0.4,
                  }}
                  onUpdate={() => {
                    if (isEntering) {
                      setIsEntering(false);
                    }
                  }}
                >
                  <div className="inline-flex h-8 items-center justify-center">
                    {items.map((item, index) => (
                      <div
                        key={`real-${index}`}
                        className="flex items-center justify-center gap-1 px-2 text-sm font-medium whitespace-nowrap "
                      >
                        <span className="text-white">{item.label}</span>
                        {item.hasBadge && (
                          <div className="flex items-center gap-0.5 text-white/40">
                            <span className="flex items-center justify-center rounded-sm border border-white/20 p-1">
                              <CommandIcon className="size-3 text-neutral-500" />
                            </span>
                          </div>
                        )}
                        {item.labelHasKeyword && (
                          <div className="flex items-center gap-0.5 text-white/40">
                            {item.labelHasKeyword.map((cap, i) => {
                              const caps = item.labelHasKeyword as (
                                | string
                                | ReactNode
                              )[]
                              return (
                                <span
                                  key={`${typeof cap === "string" ? cap : "cap"}-${caps.slice(0, i).filter((entry) => entry === cap).length}`}
                                  className="flex items-center justify-center rounded-sm border border-white/20 px-1 tabular-nums"
                                >
                                  {cap}
                                </span>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </m.div>
              </m.div>
            )}
          </AnimatePresence>

          <div className="z-10 flex items-center justify-center gap-2">
            {runs.map((run, runIndex) => (
              <div
                key={runIndex}
                data-slot="tooltip-navbar-shell"
                className="inline-flex items-center justify-center gap-1 rounded-full bg-[var(--glass-bg,rgba(22,22,22,0.95))] p-1 backdrop-blur-xl"
              >
                {run.map(({ item, index }) => {
                  const button = renderItemButton(item, index);

                  if (item.popover) {
                    return (
                      <Popover
                        key={index}
                        modal={false}
                        open={openPopoverIndex === index}
                        onOpenChange={(open) => {
                          setOpenPopoverIndex(open ? index : null);
                          if (open) clearTooltip();
                        }}
                      >
                        <PopoverTrigger asChild>{button}</PopoverTrigger>
                        {item.popover}
                      </Popover>
                    );
                  }

                  return <span key={index}>{button}</span>;
                })}
                {runIndex === runs.length - 1 ? trailing : null}
              </div>
            ))}
            {runs.length === 0 && trailing ? (
              <div
                data-slot="tooltip-navbar-shell"
                className="inline-flex items-center justify-center gap-1 rounded-full bg-[var(--glass-bg,rgba(22,22,22,0.95))] p-1 backdrop-blur-xl"
              >
                {trailing}
              </div>
            ) : null}
          </div>

          <div
            aria-hidden
            className="pointer-events-none fixed top-0 left-[-10000px] flex h-8 overflow-hidden whitespace-nowrap opacity-0"
          >
            {items.map((item, index) => (
              <div
                key={`measure-${index}`}
                ref={(el) => {
                  measureRefs.current[index] = el;
                }}
                className="flex items-center justify-center gap-1 px-2 text-sm font-medium whitespace-nowrap"
              >
                <span>{item.label}</span>
                {item.hasBadge && (
                  <div className="flex items-center gap-0.5 text-white/40">
                    <span className="flex items-center justify-center rounded-sm border border-white/20 p-1">
                      <CommandIcon className="size-3 text-neutral-500" />
                    </span>
                  </div>
                )}
                {item.labelHasKeyword && (
                  <div className="flex items-center gap-0.5 text-white/40">
                    {item.labelHasKeyword.map((key, i) => (
                      <span
                        key={i}
                        className="flex items-center justify-center rounded-sm border border-white/20 px-1 tabular-nums"
                      >
                        {typeof key === "string" ? key : "⌘"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
