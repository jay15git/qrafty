"use client";

import { type ReactNode } from "react";

import {
  SETTINGS_CONTROL_HEIGHT_COMPACT_CLASS,
  SETTINGS_LABEL_CLASS,
  SETTINGS_RADIUS_CLASS,
} from "@/features/shell/components/settings-tokens";
import { SettingsInlineSlider } from "@/features/shell/settings/settings-ui";
import {
  SettingsScrubNumberInput,
  useSettingsNumberScrub,
} from "@/features/shell/components/SettingsControls";
import { cn } from "@/lib/utils";

export {
  SettingsOptionGridScrollArea,
  SettingsScrollArea,
} from "@/features/shell/settings/SettingsOptionGrid";

export function SettingsSliderRow({
  ariaLabel,
  label,
  max,
  min,
  onChange,
  step = 1,
  value,
  valueLabel,
}: {
  ariaLabel?: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
  valueLabel: string;
}) {
  return (
    <div data-slot="elastic-slider-row" className="grid min-w-0 py-1.5">
      <div data-slot="elastic-slider">
        <SettingsInlineSlider
          ariaLabel={ariaLabel}
          formatValue={() => valueLabel}
          label={label}
          max={max}
          min={min}
          step={step}
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
}

export function SettingsValueGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-2 gap-x-5 gap-y-3 [&>:nth-child(even)]:justify-self-end [&>:nth-child(odd)]:justify-self-start",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SettingsNumberField({
  disabled,
  fill = false,
  label,
  max,
  min,
  onChange,
  step,
  value,
  className,
  labelClassName,
}: {
  disabled?: boolean;
  fill?: boolean;
  label: string;
  max?: number;
  min?: number;
  onChange: (value: number) => void;
  step?: number;
  value: number;
  className?: string;
  labelClassName?: string;
}) {
  const scrub = useSettingsNumberScrub({
    disabled,
    max,
    min,
    onChange,
    step,
    value,
  });

  return (
    <div
      className={cn(
        fill
          ? "grid w-full min-w-0 grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2"
          : "grid grid-cols-[1.25rem_var(--settings-preview-col)] items-center gap-x-2.5",
        className,
      )}
      role="group"
    >
      <span
        className={cn(
          fill ? "text-left" : "text-center",
          SETTINGS_LABEL_CLASS,
          fill && "truncate-none",
          labelClassName,
          scrub.canScrub && "cursor-ew-resize touch-pan-y select-none",
        )}
        {...scrub.labelScrubHandlers}
      >
        {label}
      </span>
      <SettingsScrubNumberInput
        aria-label={label}
        className={cn(
          fill ? "w-full min-w-0" : "w-[4.75rem]",
          SETTINGS_CONTROL_HEIGHT_COMPACT_CLASS,
        )}
        disabled={disabled}
        inputClassName={cn(
          SETTINGS_CONTROL_HEIGHT_COMPACT_CLASS,
          "w-full px-1.5",
          SETTINGS_RADIUS_CLASS,
        )}
        scrub={scrub}
        step={step}
      />
    </div>
  );
}
