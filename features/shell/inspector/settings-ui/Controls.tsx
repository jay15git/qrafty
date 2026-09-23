import { useCallback, useRef } from "react";

import { InlineSlider } from "@/features/shell/components/motion/range-slider-inline";
import { Switch } from "@/components/ui/switch";
import { playPressSound } from "@/features/shell/audio/cuelume";
import { SettingsRowButton } from "@/features/shell/inspector/settings-ui/Shared";
import { cn } from "@/lib/utils";

export function SettingsInput({
  value,
  readOnly,
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn("dn-settings-input w-full dn-squircle-sm", className)}
      readOnly={readOnly}
      value={value}
      {...props}
    />
  );
}

export function SettingsSwitchRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <Switch
      checked={checked}
      label={label}
      onToggle={() => onChange(!checked)}
      size="default"
      className="dn-switch-row"
    />
  );
}

const SETTINGS_INLINE_SLIDER_CLASS = "dn-settings-inline-slider h-9 w-full";

const INLINE_SLIDER_TICK_INTERVAL_MS = 80;

function useThrottledPressSound() {
  const lastTickAtRef = useRef(0);

  return useCallback(() => {
    const now = Date.now();
    if (now - lastTickAtRef.current < INLINE_SLIDER_TICK_INTERVAL_MS) return;
    lastTickAtRef.current = now;
    playPressSound();
  }, []);
}

export function SettingsInlineSlider({
  ariaLabel,
  formatValue,
  label,
  max = 100,
  min = 0,
  onChange,
  step = 1,
  value,
}: {
  ariaLabel?: string;
  formatValue?: (value: number) => string;
  label: string;
  max?: number;
  min?: number;
  onChange?: (value: number) => void;
  step?: number;
  value: number;
}) {
  const tick = useThrottledPressSound();
  const stepDecimals = step.toString().includes(".")
    ? (step.toString().split(".")[1]?.length ?? 0)
    : 0;
  const normalizedValue = parseFloat((Math.round(value / step) * step).toFixed(stepDecimals));
  const format = formatValue ?? ((next: number) => `${next}`);

  return (
    <InlineSlider
      aria-label={ariaLabel ?? label}
      className={SETTINGS_INLINE_SLIDER_CLASS}
      format={format}
      formatValueText={format}
      label={label}
      max={max}
      min={min}
      step={step}
      value={normalizedValue}
      onValueChange={(next) => {
        tick();
        onChange?.(next);
      }}
    />
  );
}

export function SettingsSlider(props: {
  label: string;
  value: number;
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  formatValue?: (value: number) => string;
}) {
  return <SettingsInlineSlider {...props} />;
}

export function SettingsPrimaryButton({
  children,
  onClick,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <SettingsRowButton
      className="dn-settings-primary dn-control-surface dn-pressable-press-only w-full font-medium tracking-tight"
      type="button"
      onClick={onClick}
      {...props}
    >
      {children}
    </SettingsRowButton>
  );
}
