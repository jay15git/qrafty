"use client";

import { useContext } from "react";

import {
  GRADIENT_INTERP_OPTIONS,
  GRADIENT_TYPE_OPTIONS,
} from "@/components/ui/fill-picker/lib/gradient-options";
import { useFillPickerPortalSurface } from "@/components/ui/fill-picker/base/contexts/portal-surface";
import {
  useGradientPickerContext,
  type GradientInterp,
  type GradientType,
} from "@/components/ui/fill-picker/public-api";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { InspectorThemeContext } from "@/features/shell/inspector/theme-context";
import { cn } from "@/lib/utils";

function inspectorPortalClass(theme: "light" | "dark", className?: string) {
  return cn(className, theme === "dark" && "dark");
}

function GradientSelectField({
  "aria-label": ariaLabel,
  onValueChange,
  options,
  slot,
  value,
}: {
  "aria-label": string;
  onValueChange: (next: string) => void;
  options: { value: string; label: string }[];
  slot: string;
  value: string;
}) {
  const theme = useContext(InspectorThemeContext);
  const portalSurface = useFillPickerPortalSurface();

  return (
    <div className="ds-fill-picker-select min-w-0 flex-1" data-slot={slot}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          aria-label={ariaLabel}
          className="ds-fill-picker-select-trigger w-full min-w-0 ds-squircle-sm"
          variant="borderless"
        />
        <SelectContent
          className={inspectorPortalClass(
            theme,
            cn(
              portalSurface.portaledSurfaceClassName,
              "ds-portal-surface ds-popover-content overflow-hidden p-0 ds-squircle-md",
            ),
          )}
          data-theme={portalSurface.portaledSurfaceDataTheme ?? theme}
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
}

export function GradientTypeRow({ allowedTypes }: { allowedTypes?: readonly GradientType[] }) {
  const ctx = useGradientPickerContext();
  const options = allowedTypes
    ? GRADIENT_TYPE_OPTIONS.filter((option) => allowedTypes.includes(option.value))
    : GRADIENT_TYPE_OPTIONS;

  return (
    <GradientSelectField
      aria-label="Gradient type"
      options={options}
      slot="gradient-type-switcher"
      value={ctx.gradient.type}
      onValueChange={(next) => ctx.setType(next as GradientType)}
    />
  );
}

export function GradientInterpRow() {
  const ctx = useGradientPickerContext();

  return (
    <GradientSelectField
      aria-label="Gradient blend"
      options={GRADIENT_INTERP_OPTIONS.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      slot="gradient-interp-switcher"
      value={ctx.gradient.interp}
      onValueChange={(next) => ctx.setInterp(next as GradientInterp)}
    />
  );
}
