import { Suspense, useContext, useState } from "react";

import { parseFill } from "@/components/ui/fill-picker/lib/gradient";
import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import { useMobileDrawerNavigation } from "@/features/shell/settings/MobileDrawerNavigationContext";
import { DOTS_PALETTE_PRESETS } from "@/features/shell/settings/pattern-palettes";
import { PaletteColorBarPreview } from "@/features/shell/settings/PaletteColorBarPreview";
import { readPatternModuleFillCss } from "@/features/shell/settings/settings-bridge";
import { getActiveFillPresetForStoredValue } from "@/features/shell/settings/settings-fill-preset-match";
import {
  SETTINGS_PATTERN_OPTION_TILE_INNER,
  SETTINGS_PREVIEW_TILE,
} from "@/features/shell/settings/SettingsPreviewTiles";
import { SegmentTabs } from "@/features/shell/settings/settings-ui";
import { cn } from "@/lib/utils";

import { LazySettingsFillPicker, LazyPatternColorPickerContent } from "../lazy-details";
import { applyQrFill, applyQrImageFill, applyQrPalette, applyQrPalettePatch } from "../qr-fill";
import { MobileRailModeContext, useLatestModel, type MobileRailRowProps } from "../rail-context";
import {
  fillPresetsForMode,
  lockedFillModeForRailMode,
  qrFillModeFromPattern,
  QR_COLOR_FILL_MODES,
} from "../rail-modes";
import { MobileRailImageOptions, MobileRailPickerTile, MobileRailSwatchTile } from "../tiles";

/**
 * Palette editor pushed as a rail detail: the 4 wells on top, solid picker
 * below. The palette is kept in local state because detail content is frozen
 * at open time and can't re-read the model as the user picks colors.
 */
function MobileRailPatternPaletteDetail({ model }: { model: SettingsModel }) {
  const [palette, setPalette] = useState(() => [...model.actualPatternSettings.dotsPalette]);

  const applyColor = (index: number, color: string) => {
    const next = palette.map((entry, entryIndex) => (entryIndex === index ? color : entry));
    setPalette(next);
    applyQrPalettePatch(model, {
      dotsColorMode: "palette",
      dotsPalettePreset: "custom",
      dotsPalette: next,
    });
  };

  return (
    <Suspense fallback={null}>
      <LazyPatternColorPickerContent selectedPalette={palette} onPaletteColorChange={applyColor} />
    </Suspense>
  );
}

export function MobileColorRailRow({ model, openDrawer }: MobileRailRowProps) {
  const navigation = useMobileDrawerNavigation();
  const railMode = useContext(MobileRailModeContext);
  const modelRef = useLatestModel(model);
  const mode = railMode?.mode ?? qrFillModeFromPattern(model.actualPatternSettings);
  const value = readPatternModuleFillCss(model.actualPatternSettings);

  if (mode === "pattern") {
    const { dotsPalette, dotsPalettePreset } = model.actualPatternSettings;
    return (
      <>
        <MobileRailPickerTile
          ariaLabel="Custom pattern colors"
          onOpen={() => {
            const m = modelRef.current;
            // Palette wells edit live on the QR — switch to palette mode so
            // the preview reacts while the user picks.
            if (m.actualPatternSettings.dotsColorMode !== "palette") {
              applyQrPalettePatch(m, { dotsColorMode: "palette" });
            }
            if (navigation) {
              navigation.openDetail({
                title: "Pattern colors",
                content: <MobileRailPatternPaletteDetail model={m} />,
              });
              return;
            }
            openDrawer();
          }}
        />
        {DOTS_PALETTE_PRESETS.map((preset) => {
          const isSelected =
            dotsPalettePreset === preset.label ||
            (dotsPalettePreset === "custom" && dotsPalette.join() === preset.colors.join());
          return (
            <button
              key={preset.label}
              aria-label={`Use ${preset.label} pattern`}
              aria-pressed={isSelected}
              className={cn(SETTINGS_PREVIEW_TILE)}
              data-slot="mobile-rail-option"
              title={preset.label}
              type="button"
              onClick={() => applyQrPalette(modelRef.current, preset)}
            >
              <span aria-hidden className={SETTINGS_PATTERN_OPTION_TILE_INNER}>
                <PaletteColorBarPreview className="size-full" colors={preset.colors} size="md" />
              </span>
            </button>
          );
        })}
      </>
    );
  }

  if (mode === "image") {
    const imageUrl = model.actualPatternSettings.moduleFillImageUrl;
    return (
      <MobileRailImageOptions
        imageUrl={imageUrl}
        onClear={() => applyQrImageFill(modelRef.current, "", "upload")}
        onSelect={(path) => applyQrImageFill(modelRef.current, path, "url")}
        onUpload={(url) => applyQrImageFill(modelRef.current, url, "upload")}
      />
    );
  }

  const presets = fillPresetsForMode(mode);
  const activePreset = getActiveFillPresetForStoredValue(value, presets);

  return (
    <>
      <MobileRailPickerTile
        ariaLabel="Custom color"
        onOpen={() =>
          navigation?.openDetail({
            title: "Color",
            content: (
              <Suspense fallback={null}>
                <div className="ds-fill-popover w-full min-w-0" data-theme={model.actualTheme}>
                  <LazySettingsFillPicker
                    lockedFillMode={lockedFillModeForRailMode(mode)}
                    qrGradient
                    value={value}
                    onValueChange={(fill) => applyQrFill(modelRef.current, fill)}
                  />
                </div>
              </Suspense>
            ),
          })
        }
      />
      {presets.map((preset) => (
        <MobileRailSwatchTile
          key={preset}
          ariaLabel="Use this color"
          fill={preset}
          selected={activePreset === preset}
          onSelect={() => {
            const fill = parseFill(preset);
            if (fill) {
              applyQrFill(modelRef.current, fill);
            }
          }}
        />
      ))}
    </>
  );
}

/** Sliding-tab mode switcher under the Color options row — the pill slides to
 *  the browsed mode and the option set above crossfades with it. */
export function MobileColorRailFooter() {
  const railMode = useContext(MobileRailModeContext);

  if (!railMode?.selectedMode) {
    return null;
  }

  return (
    <div className="ds-mobile-settings-rail__tabs">
      <SegmentTabs
        className="ds-mobile-settings-rail__tabbar"
        items={QR_COLOR_FILL_MODES.map((mode) => ({
          id: mode.id,
          label: mode.label,
        }))}
        value={railMode.selectedMode}
        onChange={railMode.setMode}
      />
    </div>
  );
}
