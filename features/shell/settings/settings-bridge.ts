import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import {
  formatFill,
  parseFill,
  type Fill,
  type Gradient,
  type GradientStop,
} from "@/components/ui/fill-picker/public-api";
import { formatColor, parseColor } from "@/components/ui/fill-picker/base/color-picker";
import type {
  CornersSettings,
  LogoSettings,
  PatternSettings,
  ShapeSettings,
} from "@/features/shell/components/WorkspaceChrome";
import type { QraftyGradient } from "@/features/qr/model/state";
import {
  clampQraftyGradientCenter,
  getQraftyGradientCenter,
} from "@/features/qr/styles/qrafty-gradient-geometry";
import { degreesToRadians, radiansToDegrees } from "@/features/qr/styles/gradient-controls";
import { fillFromHex, fillPreviewHex } from "@/features/shell/settings/FillPicker.utils";
import { paintFromPickerFill, type Paint } from "@/features/canvas/model/paint";
const FALLBACK_OKLCH = { l: 0, c: 0, h: 0, alpha: 1 } as const;

/** CSS `linear-gradient` angles are 90° ahead of studio SVG rotation. */
const CSS_STUDIO_ROTATION_OFFSET_DEG = 90;

function normalizeDegrees(value: number) {
  const mod = value % 360;
  return mod < 0 ? mod + 360 : mod;
}

function cssAngleToQraftyRotation(angleDeg: number) {
  return degreesToRadians(normalizeDegrees(angleDeg - CSS_STUDIO_ROTATION_OFFSET_DEG));
}

function qraftyRotationToCssAngle(rotationRad: number) {
  return normalizeDegrees(radiansToDegrees(rotationRad) + CSS_STUDIO_ROTATION_OFFSET_DEG);
}

function parseStopColor(color: string) {
  return parseColor(color) ?? FALLBACK_OKLCH;
}

function qraftyStopsToFillStops(gradient: QraftyGradient): GradientStop[] {
  const stops = gradient.colorStops.length
    ? gradient.colorStops
    : [
        { offset: 0, color: "#000000" },
        { offset: 1, color: "#ffffff" },
      ];

  return stops.map((stop, index) => ({
    id: `studio-stop-${index}`,
    color: parseStopColor(stop.color),
    position: stop.offset,
  }));
}

function qraftyGradientToFill(gradient: QraftyGradient): Fill {
  const stops = qraftyStopsToFillStops(gradient);

  if (gradient.type === "radial") {
    const center = getQraftyGradientCenter(gradient);
    return {
      kind: "gradient",
      gradient: {
        type: "radial",
        shape: "circle",
        center,
        size: "farthest-corner",
        interp: "oklch",
        stops,
      },
    };
  }

  return {
    kind: "gradient",
    gradient: {
      type: "linear",
      angle: qraftyRotationToCssAngle(gradient.rotation),
      interp: "oklch",
      stops,
    },
  };
}

export function solidColorToFillCss(color: string): string {
  return formatFill(fillFromHex(color));
}

export function qraftyGradientToFillCss(gradient: QraftyGradient): string {
  if (!gradient.enabled) {
    return solidColorToFillCss(gradient.colorStops[0]?.color ?? "#171717");
  }

  return formatFill(qraftyGradientToFill(gradient));
}

export function readPatternModuleFillCss(settings: PatternSettings): string {
  if (settings.dotsColorMode === "image") {
    // Image fills use a dedicated tab. Blob/data URLs are not valid fill-picker CSS.
    return solidColorToFillCss(settings.dotsSolidColor);
  }

  if (settings.dotsColorMode === "gradient") {
    return qraftyGradientToFillCss(settings.dataModulesGradient);
  }

  return solidColorToFillCss(settings.dotsSolidColor);
}

export function isPatternModuleImageFill(settings: PatternSettings): boolean {
  return settings.dotsColorMode === "image" && Boolean(settings.moduleFillImageUrl);
}

export function readCornerFillCss(
  mode: "solid" | "gradient",
  solidColor: string,
  gradient: QraftyGradient,
): string {
  if (mode === "gradient") {
    return qraftyGradientToFillCss(gradient);
  }

  return solidColorToFillCss(solidColor);
}

export function readShapeFillCss(settings: ShapeSettings): string {
  if (settings.shapeColorMode === "gradient") {
    return qraftyGradientToFillCss(settings.shapeGradient);
  }

  return solidColorToFillCss(settings.shapeSolidColor);
}

export function readLogoFillCss(settings: LogoSettings): string {
  if (settings.colorMode === "gradient") {
    return qraftyGradientToFillCss(settings.gradient);
  }

  return solidColorToFillCss(settings.solidColor);
}

function fillGradientToQrafty(gradient: Gradient, fallback: QraftyGradient): QraftyGradient {
  const stops = [...gradient.stops].sort((a, b) => a.position - b.position);

  if (stops.length === 0) {
    return fallback;
  }

  const colorStops: QraftyGradient["colorStops"] = stops.map((stop) => ({
    offset: Math.min(1, Math.max(0, stop.position)),
    color: formatColor(stop.color, "hex"),
  }));

  if (gradient.type === "linear") {
    return {
      enabled: true,
      type: "linear",
      rotation: cssAngleToQraftyRotation(gradient.angle ?? 0),
      colorStops,
    };
  }

  if (gradient.type === "conic") {
    return {
      enabled: true,
      type: "radial",
      rotation: fallback.rotation,
      colorStops,
      center: clampQraftyGradientCenter(gradient.center),
    };
  }

  const center =
    gradient.type === "radial"
      ? clampQraftyGradientCenter(gradient.center)
      : clampQraftyGradientCenter(fallback.center ?? getQraftyGradientCenter(fallback));

  return {
    enabled: true,
    type: "radial",
    rotation: fallback.rotation,
    colorStops,
    center,
  };
}

export function fillCssToQraftyGradient(css: string, fallback: QraftyGradient): QraftyGradient {
  const parsed = parseFill(css);

  if (!parsed || parsed.kind === "color") {
    const hex = fillPreviewHex(css);
    const fallbackStops = fallback.colorStops.length
      ? fallback.colorStops
      : [
          { offset: 0, color: hex },
          { offset: 1, color: hex },
        ];
    return {
      ...fallback,
      enabled: false,
      colorStops: fallbackStops.map((stop) => ({ ...stop, color: hex })),
    };
  }

  return fillGradientToQrafty(parsed.gradient, fallback);
}

function solidHexFromFill(fill: Fill): string {
  if (fill.kind === "color") {
    return formatColor(fill.color, "hex");
  }

  const stops = [...fill.gradient.stops].sort((a, b) => a.position - b.position);
  const first = stops[0]?.color;
  return first ? formatColor(first, "hex") : "#171717";
}

export function applyPatternModuleFill(
  fill: Fill,
  settings: PatternSettings,
): Partial<PatternSettings> {
  if (fill.kind === "gradient") {
    return {
      dotsColorMode: "gradient",
      dataModulesGradient: fillGradientToQrafty(fill.gradient, settings.dataModulesGradient),
    };
  }

  return {
    dotsColorMode: "solid",
    dotsSolidColor: solidHexFromFill(fill),
  };
}

function applyPatternModuleImageUrl(
  imageUrl: string,
  sourceMode: PatternSettings["moduleFillImageSourceMode"],
): Partial<PatternSettings> {
  return {
    dotsColorMode: "image",
    moduleFillImageUrl: imageUrl,
    moduleFillImageSourceMode: sourceMode,
  };
}

export function applyCornerFill(
  fill: Fill,
  part: "eye" | "frame",
  settings: CornersSettings,
): Partial<CornersSettings> {
  const gradient = part === "eye" ? settings.cornerDotGradient : settings.cornerSquareGradient;

  if (fill.kind === "gradient") {
    const nextGradient = fillGradientToQrafty(fill.gradient, gradient);
    return part === "eye"
      ? { cornerDotColorMode: "gradient", cornerDotGradient: nextGradient }
      : { cornerSquareColorMode: "gradient", cornerSquareGradient: nextGradient };
  }

  const hex = solidHexFromFill(fill);
  return part === "eye"
    ? { cornerDotColorMode: "solid", cornerDotSolidColor: hex }
    : { cornerSquareColorMode: "solid", cornerSquareSolidColor: hex };
}

export function applyShapeFill(fill: Fill, settings: ShapeSettings): Partial<ShapeSettings> {
  if (fill.kind === "gradient") {
    return {
      shapeColorMode: "gradient",
      shapeGradient: fillGradientToQrafty(fill.gradient, settings.shapeGradient),
    };
  }

  return {
    shapeColorMode: "solid",
    shapeSolidColor: solidHexFromFill(fill),
  };
}

export function applyLogoFill(fill: Fill, settings: LogoSettings): Partial<LogoSettings> {
  if (fill.kind === "gradient") {
    return {
      colorMode: "gradient",
      gradient: fillGradientToQrafty(fill.gradient, settings.gradient),
    };
  }

  return {
    colorMode: "solid",
    solidColor: solidHexFromFill(fill),
  };
}

export function applyCardFill(fill: Fill, previous?: Paint): { cardFill: Paint } {
  return { cardFill: paintFromPickerFill(fill, previous) };
}

export type UnifiedQrFillSettings = {
  pattern: PatternSettings;
  corners: CornersSettings;
  logo: LogoSettings;
};

export type UnifiedQrFillPatches = {
  pattern: Partial<PatternSettings>;
  corners: Partial<CornersSettings>;
  logo: Partial<LogoSettings>;
};

function mergeCornerFills(fill: Fill, settings: CornersSettings): Partial<CornersSettings> {
  return {
    ...applyCornerFill(fill, "eye", settings),
    ...applyCornerFill(fill, "frame", settings),
  };
}

export function applyUnifiedQrFill(
  fill: Fill,
  settings: UnifiedQrFillSettings,
): UnifiedQrFillPatches {
  return {
    pattern: {
      ...applyPatternModuleFill(fill, settings.pattern),
      gradientLinkMode: "unified",
    },
    corners: mergeCornerFills(fill, settings.corners),
    logo: applyLogoFill(fill, settings.logo),
  };
}

export function applyUnifiedQrModuleImageUrl(
  imageUrl: string,
  sourceMode: PatternSettings["moduleFillImageSourceMode"],
  settings: UnifiedQrFillSettings,
): UnifiedQrFillPatches {
  const representativeFill = fillFromHex(settings.pattern.dotsSolidColor);

  return {
    pattern: {
      ...applyPatternModuleImageUrl(imageUrl, sourceMode),
      gradientLinkMode: "unified",
    },
    corners: mergeCornerFills(representativeFill, settings.corners),
    logo: applyLogoFill(representativeFill, settings.logo),
  };
}

export function applyUnifiedQrModulePatternPatch(
  patternPatch: Partial<PatternSettings>,
  settings: UnifiedQrFillSettings,
): UnifiedQrFillPatches {
  const mergedPattern: PatternSettings = {
    ...settings.pattern,
    ...patternPatch,
    gradientLinkMode: "unified",
  };

  if (mergedPattern.dotsColorMode === "gradient") {
    const fill = parseFill(qraftyGradientToFillCss(mergedPattern.dataModulesGradient));

    if (fill) {
      return applyUnifiedQrFill(fill, { ...settings, pattern: mergedPattern });
    }
  }

  const representativeHex =
    mergedPattern.dotsColorMode === "palette"
      ? (mergedPattern.dotsPalette[0] ?? mergedPattern.dotsSolidColor)
      : mergedPattern.dotsSolidColor;
  const representativeFill = fillFromHex(representativeHex);

  return {
    pattern: {
      ...patternPatch,
      gradientLinkMode: "unified",
    },
    corners: mergeCornerFills(representativeFill, settings.corners),
    logo: applyLogoFill(representativeFill, settings.logo),
  };
}

function unifiedQrFillSettings(model: SettingsModel): UnifiedQrFillSettings {
  return {
    pattern: model.actualPatternSettings,
    corners: model.actualCornersSettings,
    logo: model.actualLogoSettings,
  };
}

/** Sends a unified patch set through the atomic handler when available. */
export function applyQrUnifiedFillPatches(model: SettingsModel, patches: UnifiedQrFillPatches) {
  if (model.onUnifiedQrFillSettingsChange) {
    model.onUnifiedQrFillSettingsChange(patches);
    return;
  }
  model.onPatternSettingsChange(patches.pattern);
  model.onCornersSettingsChange(patches.corners);
  model.onLogoSettingsChange(patches.logo);
}

/** Applies a fill to module dots — fans out to eye/frame/logo when unified. */
export function applyQrFill(model: SettingsModel, fill: Fill) {
  if (model.actualPatternSettings.gradientLinkMode === "unified") {
    applyQrUnifiedFillPatches(model, applyUnifiedQrFill(fill, unifiedQrFillSettings(model)));
    return;
  }
  model.onPatternSettingsChange(applyPatternModuleFill(fill, model.actualPatternSettings));
}

/** Forces the unified fan-out (e.g. toggling "Color separately" off). */
export function applyQrUnifiedFill(model: SettingsModel, fill: Fill) {
  applyQrUnifiedFillPatches(model, applyUnifiedQrFill(fill, unifiedQrFillSettings(model)));
}

export function applyQrImageFill(
  model: SettingsModel,
  imageUrl: string,
  sourceMode: PatternSettings["moduleFillImageSourceMode"],
) {
  if (model.actualPatternSettings.gradientLinkMode === "unified") {
    applyQrUnifiedFillPatches(
      model,
      applyUnifiedQrModuleImageUrl(imageUrl, sourceMode, unifiedQrFillSettings(model)),
    );
    return;
  }
  model.onPatternSettingsChange(applyPatternModuleImageUrl(imageUrl, sourceMode));
}

/** Palette-mode patches are module-only, but unified mode still syncs the rest. */
export function applyQrPalettePatch(model: SettingsModel, patch: Partial<PatternSettings>) {
  if (model.actualPatternSettings.gradientLinkMode === "unified") {
    applyQrUnifiedFillPatches(
      model,
      applyUnifiedQrModulePatternPatch(patch, unifiedQrFillSettings(model)),
    );
    return;
  }
  model.onPatternSettingsChange(patch);
}

/** Applies a palette picker selection — "custom" keeps the existing colors. */
export function applyQrPaletteSelection(
  model: SettingsModel,
  preset: { label: string; colors: string[] } | "custom",
) {
  applyQrPalettePatch(
    model,
    preset === "custom"
      ? { dotsColorMode: "palette", dotsPalettePreset: "custom" }
      : {
          dotsColorMode: "palette",
          dotsPalette: [...preset.colors],
          dotsPalettePreset: preset.label,
        },
  );
}
