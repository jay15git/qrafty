"use client";

import * as React from "react";
import {
  Children,
  isValidElement,
  type ReactNode,
} from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useFillPickerPortalSurface } from "@/components/ui/fill-picker-base/contexts/portal-surface";
import { cn } from "@/lib/utils";

function collectItems(children: ReactNode) {
  const items: { value: string; label: ReactNode }[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const props = child.props as {
      value?: string;
      children?: ReactNode;
      "data-value"?: string;
    };
    const value = props.value ?? props["data-value"];
    if (typeof value === "string") {
      items.push({ value, label: props.children });
    }
  });
  return items;
}

export function DesktopAccordionFieldSelectOption({
  value,
  children,
}: {
  value: string;
  children?: ReactNode;
}) {
  return <span data-value={value}>{children}</span>;
}

export interface DesktopAccordionFieldSelectProps {
  variant?: "standalone" | "inline";
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  wrapperProps?: React.HTMLAttributes<HTMLDivElement> & {
    [key: `data-${string}`]: string | undefined;
  };
  "aria-label"?: string;
  children?: ReactNode;
}

/**
 * Accordion-aligned select for the desktop fill picker — same Select
 * compound as the content-type row (fluid hover, portal tokens).
 */
export const DesktopAccordionFieldSelect = React.forwardRef<
  HTMLButtonElement,
  DesktopAccordionFieldSelectProps
>(function DesktopAccordionFieldSelect(
  {
    variant = "standalone",
    value = "",
    onValueChange,
    disabled,
    placeholder = "Select…",
    className,
    wrapperProps,
    children,
    "aria-label": ariaLabel,
  },
  ref,
) {
  const portalSurface = useFillPickerPortalSurface();
  const inline = variant === "inline";
  const options = collectItems(children);
  const { className: wrapperClassName, ...wrapperRest } = wrapperProps ?? {};

  return (
    <div
      className={cn(
        inline
          ? "relative inline-flex h-full shrink-0 items-center"
          : "relative inline-flex min-w-0 items-center",
        wrapperClassName,
      )}
      {...wrapperRest}
    >
      <Select
        disabled={disabled}
        size="compact"
        value={value}
        onValueChange={(next) => onValueChange?.(next)}
      >
        <SelectTrigger
          ref={ref}
          aria-label={ariaLabel}
          placeholder={placeholder}
          variant="borderless"
          className={cn(
            "min-w-0 font-mono text-xs uppercase tracking-wide shadow-none",
            inline
              ? "h-full px-2"
              : "h-[var(--dn-control-height,2rem)] w-full px-2.5 dn-squircle-xs",
            className,
          )}
        />
        <SelectContent
          className={cn(
            portalSurface.portaledSurfaceClassName,
            "desktopnew-popover-content dn-portal-surface overflow-hidden p-0 dn-squircle-md",
          )}
          data-theme={portalSurface.portaledSurfaceDataTheme}
          positionerClassName="z-[20002]"
        >
          {options.map((option, index) => (
            <SelectItem key={option.value} index={index} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
});
