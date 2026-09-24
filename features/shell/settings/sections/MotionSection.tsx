"use client";

import { fillPreviewHex } from "@/features/shell/settings/FillPicker.utils";
import {
  dotMatrixAnimationSpeedToSliderPercent,
  MOTION_COLOR_SWATCHES,
  QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS,
  sliderPercentToDotMatrixAnimationSpeed,
  type QrDotMatrixAnimationOptions,
  type QrDotMatrixColorPreset,
  type QrDotMatrixSquareLoader,
} from "@/features/qr/model/state";
import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import { SECTION_STACK } from "@/features/shell/settings/sections/shared";
import { solidColorToFillCss } from "@/features/shell/settings/settings-bridge";
import {
  SettingsFillPresetSection,
  SettingsLabeledSelect,
  SettingsSlider,
  SettingsSwitchRow,
} from "@/features/shell/settings/settings-ui";

function MotionPresetSelect({
  selected,
  onSelect,
}: {
  selected: QrDotMatrixSquareLoader;
  onSelect: (loader: QrDotMatrixSquareLoader) => void;
}) {
  const options = QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS;
  const selectedLabel =
    options.find((option) => option.value === selected)?.label ?? options[0].label;

  return (
    <SettingsLabeledSelect
      items={options.map((option) => option.label)}
      label="Preset"
      placeholder="Preset"
      value={selectedLabel}
      onChange={(label) => {
        const option = options.find((item) => item.label === label);
        if (option) onSelect(option.value);
      }}
    />
  );
}

/** Motion animates a single accent color, so presets are solids: the accent
 *  each named motion preset resolves to (see `resolveMotionColors`). The
 *  `theme` slot is the custom color and lives on the swatch instead. */
const MOTION_COLOR_PRESETS = (Object.keys(MOTION_COLOR_SWATCHES) as QrDotMatrixColorPreset[])
  .filter((preset) => preset !== "theme")
  .map((preset) => ({
    preset,
    fill: solidColorToFillCss(MOTION_COLOR_SWATCHES[preset][1]),
  }));

function MotionColorControls({
  animation,
  onChange,
}: {
  animation: QrDotMatrixAnimationOptions;
  onChange: (patch: Partial<QrDotMatrixAnimationOptions>) => void;
}) {
  const customFill = solidColorToFillCss(animation.customColorPeak);
  const activeFill = MOTION_COLOR_PRESETS.find(
    (option) => option.preset === animation.colorPreset,
  )?.fill;

  return (
    <SettingsFillPresetSection
      lockedFillMode="solid"
      presets={MOTION_COLOR_PRESETS.map((option) => option.fill)}
      value={activeFill ?? customFill}
      onSelect={(_fill, css) => {
        const hex = fillPreviewHex(css);
        const preset = MOTION_COLOR_PRESETS.find((option) => option.fill === css);

        onChange({
          colorPreset: preset?.preset ?? "theme",
          customColorMid: hex,
          customColorPeak: hex,
        });
      }}
    />
  );
}

export function MotionSection({ model }: { model: SettingsModel }) {
  const { actualMotionSettings, onMotionSettingsChange } = model;
  const loader = actualMotionSettings.loader;

  return (
    <div className={SECTION_STACK}>
      <SettingsSwitchRow
        checked={actualMotionSettings.enabled}
        label="Enabled"
        onChange={(enabled) => onMotionSettingsChange({ enabled })}
      />
      {actualMotionSettings.enabled ? (
        <>
          <MotionPresetSelect
            selected={loader}
            onSelect={(nextLoader) =>
              onMotionSettingsChange({
                loader: nextLoader,
                preset: nextLoader,
                presetCategory: "dotMatrix",
              })
            }
          />
          <SettingsSlider
            label="Speed"
            max={100}
            min={0}
            value={dotMatrixAnimationSpeedToSliderPercent(actualMotionSettings.speed)}
            onChange={(speedPercent) =>
              onMotionSettingsChange({
                speed: sliderPercentToDotMatrixAnimationSpeed(speedPercent),
              })
            }
          />
          <MotionColorControls animation={actualMotionSettings} onChange={onMotionSettingsChange} />
        </>
      ) : null}
    </div>
  );
}
