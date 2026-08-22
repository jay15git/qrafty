"use client";

import * as React from "react";
import { useGradientPickerContext } from "@/components/ui/fill-picker-base/public-api";
import type { GradientType } from "@/components/ui/fill-picker-base/public-api";
import { FieldSelect, FieldSelectItem } from "./field";
import { GRADIENT_TYPE_OPTIONS } from "@/components/ui/fill-picker/lib/gradient-options";

const TYPES = GRADIENT_TYPE_OPTIONS;

/**
 * Base UI port of `<GradientPicker.TypeSwitcher>`. Bound to `gradient.type`.
 * Built on `<FieldSelect>` (Base UI `Select` under the hood) so it shares
 * its border, focus ring, font, and chevron with every other dropdown in
 * the Base UI picker.
 *
 * Width is intrinsic (not `w-full`) so it can sit next to icon buttons
 * like `<GradientPickerBase.ReverseStops>` without stretching the row.
 */
export const TypeSwitcher = React.forwardRef<
  HTMLButtonElement,
  { className?: string; allowedTypes?: GradientType[] }
>(function TypeSwitcher({ className, allowedTypes }, ref) {
  const ctx = useGradientPickerContext();
  const types = allowedTypes
    ? TYPES.filter((type) => allowedTypes.includes(type.value))
    : TYPES;
  const typeItems = Object.fromEntries(
    types.map((type) => [type.value, type.label]),
  ) as Record<GradientType, string>;

  return (
    <FieldSelect
      ref={ref}
      aria-label="Gradient type"
      value={ctx.gradient.type}
      onValueChange={(v) => ctx.setType(v as GradientType)}
      items={typeItems}
      wrapperProps={{
        "data-slot": "gradient-type-switcher",
        className,
      }}
    >
      {types.map((t) => (
        <FieldSelectItem key={t.value} value={t.value}>
          {t.label}
        </FieldSelectItem>
      ))}
    </FieldSelect>
  );
});
