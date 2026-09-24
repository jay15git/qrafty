import { formatFill, parseFill } from "@/components/ui/fill-picker/lib/gradient";
import { applyShapeFill, readShapeFillCss } from "@/features/shell/settings/settings-bridge";
import { SETTINGS_FILL_PRESETS } from "@/features/shell/settings/settings-fill-presets";
import { DEFAULT_DESKTOP_SHAPE_SETTINGS } from "@/features/shell/model/toolbar-defaults";

/** Match presets against shape fill after the same storage path as CardSection. */
function canonicalShapeFillCssFromPreset(preset: string): string | null {
  const fill = parseFill(preset);
  if (!fill) {
    return null;
  }

  const nextSettings = {
    ...DEFAULT_DESKTOP_SHAPE_SETTINGS,
    ...applyShapeFill(fill, DEFAULT_DESKTOP_SHAPE_SETTINGS),
  };

  return readShapeFillCss(nextSettings);
}

function storedFillCssMatches(value: string, preset: string): boolean {
  const current = parseFill(value);
  const presetFill = parseFill(preset);

  // Direct fill comparison first — surfaces like the card background store
  // the picker output verbatim via applyCardFill (formatFill), not the
  // lossy qrafty-gradient round-trip the canonical path emulates.
  if (current && presetFill && formatFill(current) === formatFill(presetFill)) {
    return true;
  }

  const canonical = canonicalShapeFillCssFromPreset(preset);
  if (!canonical) {
    return false;
  }

  const stored = parseFill(canonical);
  if (!current || !stored) {
    return value.trim() === canonical.trim();
  }

  return formatFill(current) === formatFill(stored);
}

export function getActiveFillPresetForStoredValue(
  value: string,
  presets: readonly string[] = SETTINGS_FILL_PRESETS,
): string | null {
  for (const preset of presets) {
    if (storedFillCssMatches(value, preset)) {
      return preset;
    }
  }

  return null;
}
