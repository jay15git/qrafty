import { QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS } from "@/features/qr/model/state";

import type { MobileRailRowProps } from "../rail-context";
import { MobileRailPill } from "../tiles";

export function MobileMotionRailRow({ model, openDrawer }: MobileRailRowProps) {
  const { actualMotionSettings, onMotionSettingsChange } = model;
  const enabled = actualMotionSettings.enabled;

  return (
    <>
      <MobileRailPill
        label="Off"
        pressed={!enabled}
        onClick={() => onMotionSettingsChange({ enabled: false })}
      />
      {QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS.map((option) => (
        <MobileRailPill
          key={option.value}
          label={option.label}
          pressed={enabled && actualMotionSettings.loader === option.value}
          onClick={() =>
            onMotionSettingsChange({
              enabled: true,
              loader: option.value,
              preset: option.value,
              presetCategory: "dotMatrix",
            })
          }
        />
      ))}
      <MobileRailPill label="More" onClick={openDrawer} />
    </>
  );
}
