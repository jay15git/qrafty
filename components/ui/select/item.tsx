"use client";

import { forwardRef, useContext, useRef, type ReactNode, type HTMLAttributes } from "react";
import { m, AnimatePresence } from "motion/react";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import type { IconComponent } from "@/lib/icon-context";
import { cn } from "@/lib/utils";
import { useRegisterFluidHoverItem } from "@/components/ui/use-fluid-hover";
import { useSize } from "@/lib/size-context";
import { useSelectContext, SelectContentContext, popupShape } from "./context";

interface SelectItemProps extends HTMLAttributes<HTMLDivElement> {
  icon?: IconComponent;
  index: number;
  value: string;
  disabled?: boolean;
  /** Trigger label when children aren't a string (e.g. icon tiles). */
  label?: string;
  /** Rich trigger content (icon + text) when `label` alone isn't enough. */
  triggerLabel?: ReactNode;
}

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  (
    {
      className,
      children,
      icon: Icon,
      label,
      triggerLabel,
      value,
      index,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const selectCtx = useSelectContext();
    const contentCtx = useContext(SelectContentContext);
    const internalRef = useRef<HTMLDivElement>(null);
    const shape = popupShape;
    const sizeClasses = useSize();
    const compact = sizeClasses.variant === "compact";

    // Register with fluid hover. Depends on the (stable) registerItem
    // rather than the content context, which is rebuilt on every activeIndex
    // change: keying the effect to the whole context re-ran it per mousemove,
    // unregistering and re-registering every row and so keeping the hook's
    // measurement permanently unsettled while the pointer moved.
    const registerItem = contentCtx?.registerItem;
    useRegisterFluidHoverItem(registerItem, index, internalRef);

    const isActive = contentCtx?.activeIndex === index;
    const isChecked = selectCtx.value === value;

    return (
      <SelectPrimitive.Item
        value={value}
        disabled={disabled}
        label={
          label ??
          (typeof triggerLabel === "string"
            ? triggerLabel
            : typeof children === "string"
              ? children
              : undefined)
        }
        render={
          <div
            ref={(node: HTMLDivElement | null) => {
              (internalRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
              if (typeof ref === "function") ref(node);
              else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }}
            data-fluid-hover-index={index}
            data-value={value}
            className={cn(
              // Fixed height (was py-2 around a 19.5px line box ≈ 35.5px) so
              // the text-box trim on the item text doesn't shrink the row.
              // shrink-0: the popup is a max-height flex column, so without it
              // a long list compresses rows to fit instead of scrolling.
              `relative z-10 flex ${sizeClasses.control} shrink-0 items-center ${sizeClasses.gap} ${shape.item} ${sizeClasses.itemPx} ${sizeClasses.text} cursor-pointer outline-none select-none`,
              "transition-[color] duration-80",
              isActive || isChecked ? "text-foreground" : "text-muted-foreground",
              disabled && "opacity-50 pointer-events-none",
              className,
            )}
            {...props}
          />
        }
      >
        {Icon && (
          <Icon
            size={sizeClasses.icon}
            strokeWidth={isActive || isChecked ? 2 : 1.5}
            className="shrink-0 transition-[color,stroke-width] duration-80"
          />
        )}

        <SelectPrimitive.ItemText
          // py-1/-my-1 keeps truncate's overflow:hidden from clipping
          // ascenders/descenders outside the trimmed box.
          render={
            <span className="flex-1 min-w-0 truncate [text-box:trim-both_cap_alphabetic] py-1 -my-1" />
          }
        >
          {children}
        </SelectPrimitive.ItemText>

        {/* Always-rendered fixed slot so the check appearing/disappearing
            never changes the row's intrinsic width — without it the whole
            popup resizes when a selection lands. */}
        <span aria-hidden className={cn("shrink-0", compact ? "w-3.5 h-3.5" : "w-4 h-4")}>
          {/* `initial={false}` skips the draw-in on the row's first mount (the
              check is already selected); later selections animate normally. */}
          <AnimatePresence initial={false}>
            {isChecked && (
              <m.svg
                key="check"
                width={sizeClasses.icon}
                height={sizeClasses.icon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-foreground"
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
              >
                <m.path
                  d="M4 12L9 17L20 6"
                  initial={{ pathLength: 0 }}
                  animate={{
                    pathLength: 1,
                    transition: { duration: 0.08, ease: "easeOut" },
                  }}
                  exit={{
                    pathLength: 0,
                    transition: { duration: 0.04, ease: "easeIn" },
                  }}
                />
              </m.svg>
            )}
          </AnimatePresence>
        </span>
      </SelectPrimitive.Item>
    );
  },
);

SelectItem.displayName = "SelectItem";
