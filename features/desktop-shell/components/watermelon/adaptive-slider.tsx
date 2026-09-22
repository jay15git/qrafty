'use client';

import { useState, useMemo, type FC, type ChangeEvent } from 'react';
import { m } from 'motion/react';
import { cn } from '@/lib/utils';

interface AdaptiveSliderProps {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  /** Render neutral state when no measured value is available. */
  indeterminate?: boolean;
  /** Render as a read-only meter (no drag interaction). */
  readOnly?: boolean;
}

interface ColorSettings {
  text: string;
  gradient: string;
  thumbBorder: string;
}

const DEFAULT_MIN = 50;
const DEFAULT_MAX = 350;
const DEFAULT_STEP = 25;
const DEFAULT_VALUE = 200;

const INDETERMINATE_COLOR_SETTINGS: ColorSettings = {
  gradient: 'linear-gradient(to right, #d4d4d8, #a1a1aa)',
  text: '#a1a1aa',
  thumbBorder: '#a1a1aa',
};

const HUE_STOPS: ReadonlyArray<{ at: number; color: string }> = [
  { at: 0, color: '#FF3B30' },
  { at: 0.2, color: '#FF6A00' },
  { at: 0.4, color: '#FF8C00' },
  { at: 0.58, color: '#FFB300' },
  { at: 0.76, color: '#8CD63F' },
  { at: 0.9, color: '#4CD964' },
  { at: 1, color: '#22C55E' },
];

const hexToRgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const rgbToHex = (r: number, g: number, b: number): string =>
  `#${[r, g, b]
    .map((channel) =>
      Math.round(channel)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;

const sampleTrackColor = (t: number): string => {
  const clamped = Math.min(Math.max(t, 0), 1);

  let lower = HUE_STOPS[0];
  let upper = HUE_STOPS[HUE_STOPS.length - 1];
  for (let i = 0; i < HUE_STOPS.length - 1; i += 1) {
    if (clamped >= HUE_STOPS[i].at && clamped <= HUE_STOPS[i + 1].at) {
      lower = HUE_STOPS[i];
      upper = HUE_STOPS[i + 1];
      break;
    }
  }

  const local = (clamped - lower.at) / (upper.at - lower.at || 1);
  const [r1, g1, b1] = hexToRgb(lower.color);
  const [r2, g2, b2] = hexToRgb(upper.color);

  return rgbToHex(
    r1 + (r2 - r1) * local,
    g1 + (g2 - g1) * local,
    b1 + (b2 - b1) * local,
  );
};

const getColorSettings = (
  value: number,
  min: number,
  max: number,
): ColorSettings => {
  const t = (value - min) / (max - min);
  const current = sampleTrackColor(t);

  return {
    text: current,
    gradient: `linear-gradient(to right, ${sampleTrackColor(t * 0.55)}, ${current})`,
    thumbBorder: current,
  };
};

export const AdaptiveSlider: FC<AdaptiveSliderProps> = ({
  value,
  min = DEFAULT_MIN,
  max = DEFAULT_MAX,
  step = DEFAULT_STEP,
  defaultValue = DEFAULT_VALUE,
  onChange,
  indeterminate = false,
  readOnly = false,
}) => {
  const [internalValue, setInternalValue] = useState<number>(defaultValue);

  const calories = value ?? internalValue;

  const colorSettings = useMemo(
    () =>
      indeterminate
        ? INDETERMINATE_COLOR_SETTINGS
        : getColorSettings(calories, min, max),
    [calories, indeterminate, min, max],
  );

  const percentage = ((calories - min) / (max - min)) * 100;

  const handleSliderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setInternalValue(val);
    onChange?.(val);
  };

  return (
    <AdaptiveSliderTrack
      colorSettings={colorSettings}
      indeterminate={indeterminate}
      max={max}
      min={min}
      onChange={handleSliderChange}
      percentage={percentage}
      readOnly={readOnly}
      step={step}
      value={calories}
    />
  );
};

interface AdaptiveSliderTrackProps {
  value: number;
  min: number;
  max: number;
  step: number;
  percentage: number;
  colorSettings: ColorSettings;
  indeterminate?: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  readOnly?: boolean;
}

const AdaptiveSliderTrack: FC<AdaptiveSliderTrackProps> = ({
  value,
  min,
  max,
  step,
  percentage,
  colorSettings,
  indeterminate = false,
  onChange,
  className,
  readOnly = false,
}) => {
  return (
      <div className={cn("group relative flex h-10 w-full items-center overflow-hidden rounded-full bg-[#f1f3f5] transition-colors dark:bg-neutral-800", className)}>
        <m.div
          className={cn(
            "pointer-events-none absolute top-0 left-0 h-full rounded-full",
            indeterminate && "animate-pulse",
          )}
          layout
          style={{
            width: `calc((${percentage} / 100) * (100% - 40px) + 40px)`,
          }}
          animate={{
            background: colorSettings.gradient,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />

        <input
          title="range"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          disabled={readOnly}
          tabIndex={readOnly ? -1 : undefined}
          aria-readonly={readOnly || undefined}
          className={cn(
            "absolute inset-0 z-50 h-10 w-full opacity-0",
            readOnly ? "pointer-events-none" : "cursor-pointer",
          )}
        />

        <m.div
          className="pointer-events-none absolute top-0 z-40 flex size-10 items-center justify-center rounded-full border-none"
          layout
          style={{
            left: `calc((${percentage} / 100) * (100% - 40px))`,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div className="size-8 rounded-full bg-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]" />
        </m.div>
      </div>
  );
};
