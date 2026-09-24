"use client";

import type { Fill } from "@/components/ui/fill-picker/public-api";
import { SettingsFillPresetSection } from "@/features/shell/settings/settings-ui";
import {
  SETTINGS_FILL_LINEAR_PRESETS,
  SETTINGS_FILL_RADIAL_PRESETS,
  SETTINGS_FILL_SOLID_PRESETS,
} from "@/features/shell/settings/settings-fill-presets";

export const SECTION_STACK = "ds-section-stack";

export const BACKGROUND_FILL_MODE_TABS = ["Solid", "Linear", "Radial"] as const;
export type BackgroundFillModeTab = (typeof BACKGROUND_FILL_MODE_TABS)[number];

export function backgroundFillModeTab(fill: string): BackgroundFillModeTab {
  if (fill.startsWith("radial-gradient")) return "Radial";
  if (fill.startsWith("linear-gradient")) return "Linear";
  return "Solid";
}

export function FillModePresetControls({
  applyFill,
  mode,
  value,
}: {
  applyFill: (fill: Fill) => void;
  mode: BackgroundFillModeTab;
  value: string;
}) {
  const presets =
    mode === "Solid"
      ? SETTINGS_FILL_SOLID_PRESETS
      : mode === "Linear"
        ? SETTINGS_FILL_LINEAR_PRESETS
        : SETTINGS_FILL_RADIAL_PRESETS;

  return (
    <SettingsFillPresetSection
      lockedFillMode={mode === "Solid" ? "solid" : "gradient"}
      presets={presets}
      qrGradient
      value={value}
      onSelect={(fill) => applyFill(fill)}
    />
  );
}
