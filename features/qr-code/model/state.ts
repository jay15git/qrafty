import type { QrBackgroundShapeId } from "@/features/qr-code/styles/background-shapes";
import type { CustomCornerDotShape } from "@/features/qr-code/styles/custom-corner-dot-shapes";
import type {
  QrDataModulesStyle,
  QrDrawType,
  QrErrorCorrectionLevel,
  QrFinderPatternInnerStyle,
  QrFinderPatternOuterStyle,
  QrGradientType,
  QrMode,
  QrTypeNumber,
} from "@/features/qr-code/model/types";

export type StudioCornerDotStyle = QrFinderPatternInnerStyle | CustomCornerDotShape;

export type GradientStop = {
  offset: number;
  color: string;
};

export type StudioGradient = {
  enabled: boolean;
  type: QrGradientType;
  rotation: number;
  colorStops: [GradientStop, GradientStop];
};

export type StudioDataModulesStyle = QrDataModulesStyle;
export type DotsColorMode = "solid" | "gradient" | "palette";
export type QrLogoPositionMode = "center" | "custom";
export type QrLogoSizeMode = "ratio" | "pixels";
export type QrCrossOrigin = "anonymous" | "use-credentials" | "";
export type QrGradientLinkMode = "split" | "unified";
export type AssetSourceMode = "none" | "preset" | "url" | "upload";
export type QrDotMatrixSquareLoader =
  | "neon-drift"
  | "pulse-ladder"
  | "core-spiral"
  | "twin-orbit"
  | "flux-columns"
  | "block-drop"
  | "strobe-stack"
  | "glyph-pulse"
  | "crt-glide"
  | "echo-ring"
  | "origin-wave"
  | "core-rotor"
  | "prism-bloom"
  | "helix-glow"
  | "helix-core"
  | "infinity-run"
  | "mobius-run";
export type QrDotMatrixColorPreset =
  | "theme"
  | "mint"
  | "sunset"
  | "ocean"
  | "neon"
  | "aurora"
  | "fire"
  | "prism";
export type QrDotMatrixPattern = "cross" | "diamond" | "full" | "outline" | "rings" | "rose";
export type QrDotMatrixDotShape = "circle" | "diamond" | "hearts" | "square";

export type QrMotionPresetCategory = "dotMatrix" | "standard";

export type QrMotionStandardPreset =
  | "ApertureReveal"
  | "BubbleCascade"
  | "CenterBloom"
  | "ConfettiPop"
  | "ConstellationTrace"
  | "CornerSweep"
  | "DiamondGlint"
  | "FadeInCenterOut"
  | "FadeInTopDown"
  | "FinderPing"
  | "FireflyTwinkle"
  | "FlipClock"
  | "GravityCollapse"
  | "HoloFlicker"
  | "KaleidoPulse"
  | "LensFocus"
  | "MagneticRipple"
  | "MagneticSnap"
  | "MaterializeIn"
  | "OrbitReveal"
  | "ParallaxTiles"
  | "QuantumMaterialize"
  | "RadialRipple"
  | "RadialRippleIn"
  | "ReceiptPrint"
  | "ShockwaveJolt"
  | "SignalGlitch"
  | "SignalScan"
  | "SoftMaterialize"
  | "SpiralBloom"
  | "SubtlePulse"
  | "TideRise"
  | "WaveInterference";

export type QrMotionHoverEffect =
  | ""
  | "DotField"
  | "MagneticModules"
  | "RadialAura"
  | "RadiusRecolor";

export type QrMotionHoverColorMode = "both" | "modules" | "overlay";

export type QrMotionIntensity = "dramatic" | "premium" | "subtle";

export type QrDotMatrixAnimationOptions = {
  animated: boolean;
  autoAnimate: QrMotionStandardPreset | QrDotMatrixSquareLoader | "";
  autoAnimateInterval: number;
  colorPreset: QrDotMatrixColorPreset;
  customColor: string;
  customColorBase: string;
  customColorMid: string;
  customColorPeak: string;
  dotShape: QrDotMatrixDotShape;
  enabled: boolean;
  exportAnimatedSvg: boolean;
  hoverColorMode: QrMotionHoverColorMode;
  hoverEffect: QrMotionHoverEffect;
  loader: QrDotMatrixSquareLoader;
  matrixSize: number;
  motionIntensity: QrMotionIntensity;
  opacityBase: number;
  opacityMid: number;
  opacityPeak: number;
  overlayScale: number;
  pattern: QrDotMatrixPattern;
  preset: QrMotionStandardPreset | QrDotMatrixSquareLoader;
  presetCategory: QrMotionPresetCategory;
  respectReducedMotion: boolean;
  speed: number;
};

export type QrDotMatrixAnimationPatch =
  Partial<Omit<QrDotMatrixAnimationOptions, "loader" | "preset">> & {
    loader?: QrDotMatrixSquareLoader | string;
    preset?: QrMotionStandardPreset | QrDotMatrixSquareLoader | string;
  };

export type StudioAsset = {
  presetColor?: string;
  presetId?: string;
  source: AssetSourceMode;
  value?: string;
};

export type BackgroundShapeOptions = {
  edgeBlur: number;
  paddingPx: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  strokeColor: string;
  strokeOpacity: number;
  strokeWidth: number;
  tiltX: number;
  tiltY: number;
};

export type QrStudioState = {
  data: string;
  type: QrDrawType;
  width: number;
  height: number;
  margin: number;
  rasterExportQualityPercent: number;
  logo: StudioAsset;
  backgroundImage: StudioAsset;
  backgroundShapeId: QrBackgroundShapeId;
  backgroundShapeOptions: BackgroundShapeOptions;
  qrOptions: {
    typeNumber: QrTypeNumber;
    mode: QrMode;
    errorCorrectionLevel: QrErrorCorrectionLevel;
    boostLevel: boolean;
  };
  imageOptions: {
    hideBackgroundDots: boolean;
    imageSize: number;
    margin: number;
    crossOrigin: QrCrossOrigin;
    opacity: number;
    sizeMode: QrLogoSizeMode;
    widthPx?: number;
    heightPx?: number;
    lockAspect: boolean;
    logoPositionMode: QrLogoPositionMode;
    x?: number;
    y?: number;
  };
  dataModulesSettings: {
    type: StudioDataModulesStyle;
    color: string;
    roundSize: boolean;
    moduleSize?: number;
    lineWidth?: number;
  };
  ariaLabel?: string;
  valueSegments?: string[];
  gradientLinkMode: QrGradientLinkMode;
  dotMatrixAnimation: QrDotMatrixAnimationOptions;
  dotsColorMode: DotsColorMode;
  dotsPalette: string[];
  finderPatternOuterSettings: {
    type: QrFinderPatternOuterStyle;
    color: string;
  };
  finderPatternInnerSettings: {
    type: StudioCornerDotStyle;
    color: string;
  };
  backgroundOptions: {
    color: string;
    round: number;
    transparent: boolean;
  };
  logoGradient: StudioGradient;
  dataModulesGradient: StudioGradient;
  finderPatternOuterGradient: StudioGradient;
  finderPatternInnerGradient: StudioGradient;
  backgroundGradient: StudioGradient;
};const QR_SIZE_MIN = 120;
const QR_SIZE_MAX = 1200;
const DEFAULT_QR_SIZE = 320;
const RASTER_EXPORT_QUALITY_MIN = 25;
const RASTER_EXPORT_QUALITY_MAX = 100;
const DEFAULT_RASTER_EXPORT_QUALITY = 100;
export const QR_DOT_MATRIX_ANIMATION_SPEED_MIN = 1;
export const QR_DOT_MATRIX_ANIMATION_SPEED_MAX = 10;
export const QR_DOT_MATRIX_MATRIX_SIZE_MIN = 5;
export const QR_DOT_MATRIX_MATRIX_SIZE_MAX = 25;
export const QR_DOT_MATRIX_MATRIX_SIZE_STEP = 5;
export const QR_DOT_MATRIX_OVERLAY_SCALE_MIN = 100;
export const QR_DOT_MATRIX_OVERLAY_SCALE_MAX = 140;
export const QR_DOT_MATRIX_OPACITY_MIN = 0;
export const QR_DOT_MATRIX_OPACITY_MAX = 1;
const BACKGROUND_SHAPE_PADDING_PX_MAX = 192;
const BACKGROUND_SHAPE_STROKE_WIDTH_MAX = 24;
const BACKGROUND_SHAPE_EDGE_BLUR_MAX = 32;
const BACKGROUND_SHAPE_OPACITY_MAX = 100;
const BACKGROUND_SHAPE_SHADOW_OFFSET_MIN = -64;
const BACKGROUND_SHAPE_SHADOW_OFFSET_MAX = 64;
export const BACKGROUND_SHAPE_TILT_MIN = -60;
export const BACKGROUND_SHAPE_TILT_MAX = 60;
export const QR_MODULE_SIZE_MIN = 0.75;
export const QR_MODULE_SIZE_MAX = 1;
export const QR_MODULE_LINE_WIDTH_MIN = 0.25;
export const QR_MODULE_LINE_WIDTH_MAX = 1;
export const QR_LOGO_OPACITY_MIN = 0;
export const QR_LOGO_OPACITY_MAX = 1;

const DEFAULT_GRADIENT: StudioGradient = {
  enabled: false,
  type: "linear",
  rotation: 0,
  colorStops: [
    { offset: 0, color: "#18181b" },
    { offset: 1, color: "#3f3f46" },
  ],
};

const DEFAULT_DOTS_PALETTE = [
  "#04879c",
  "#0c3c78",
  "#090030",
  "#f30a49",
];

export const QR_MOTION_STANDARD_PRESET_OPTIONS: Array<{
  label: string;
  value: QrMotionStandardPreset;
}> = [
  { label: "Fade In Top Down", value: "FadeInTopDown" },
  { label: "Fade In Center Out", value: "FadeInCenterOut" },
  { label: "Materialize In", value: "MaterializeIn" },
  { label: "Radial Ripple", value: "RadialRipple" },
  { label: "Radial Ripple In", value: "RadialRippleIn" },
  { label: "Subtle Pulse", value: "SubtlePulse" },
  { label: "Finder Ping", value: "FinderPing" },
  { label: "Soft Materialize", value: "SoftMaterialize" },
  { label: "Center Bloom", value: "CenterBloom" },
  { label: "Corner Sweep", value: "CornerSweep" },
  { label: "Orbit Reveal", value: "OrbitReveal" },
  { label: "Diamond Glint", value: "DiamondGlint" },
  { label: "Signal Scan", value: "SignalScan" },
  { label: "Confetti Pop", value: "ConfettiPop" },
  { label: "Spiral Bloom", value: "SpiralBloom" },
  { label: "Bubble Cascade", value: "BubbleCascade" },
  { label: "Kaleido Pulse", value: "KaleidoPulse" },
  { label: "Firefly Twinkle", value: "FireflyTwinkle" },
  { label: "Magnetic Ripple", value: "MagneticRipple" },
  { label: "Parallax Tiles", value: "ParallaxTiles" },
  { label: "Constellation Trace", value: "ConstellationTrace" },
  { label: "Aperture Reveal", value: "ApertureReveal" },
  { label: "Lens Focus", value: "LensFocus" },
  { label: "Receipt Print", value: "ReceiptPrint" },
  { label: "Flip Clock", value: "FlipClock" },
  { label: "Wave Interference", value: "WaveInterference" },
  { label: "Quantum Materialize", value: "QuantumMaterialize" },
  { label: "Magnetic Snap", value: "MagneticSnap" },
  { label: "Holo Flicker", value: "HoloFlicker" },
  { label: "Signal Glitch", value: "SignalGlitch" },
  { label: "Shockwave Jolt", value: "ShockwaveJolt" },
  { label: "Tide Rise", value: "TideRise" },
  { label: "Gravity Collapse", value: "GravityCollapse" },
];

export const QR_MOTION_HOVER_EFFECT_OPTIONS: Array<{
  label: string;
  value: QrMotionHoverEffect;
}> = [
  { label: "Off", value: "" },
  { label: "Radial Aura", value: "RadialAura" },
  { label: "Magnetic Modules", value: "MagneticModules" },
  { label: "Radius Recolor", value: "RadiusRecolor" },
  { label: "Dot Field", value: "DotField" },
];

export const QR_MOTION_HOVER_COLOR_MODE_OPTIONS: Array<{
  label: string;
  value: QrMotionHoverColorMode;
}> = [
  { label: "Dot aura", value: "overlay" },
  { label: "Dot recolor", value: "modules" },
  { label: "Both", value: "both" },
];

export const QR_MOTION_INTENSITY_OPTIONS: Array<{
  label: string;
  value: QrMotionIntensity;
}> = [
  { label: "Subtle", value: "subtle" },
  { label: "Premium", value: "premium" },
  { label: "Dramatic", value: "dramatic" },
];

export const QR_MOTION_AUTO_ANIMATE_INTERVAL_MIN = 1000;
export const QR_MOTION_AUTO_ANIMATE_INTERVAL_MAX = 15000;
export const QR_MOTION_AUTO_ANIMATE_INTERVAL_STEP = 500;

export const MOTION_COLOR_SWATCHES: Record<QrDotMatrixColorPreset, [string, string, string]> = {
  aurora: ["#67e8f9", "#a78bfa", "#f0abfc"],
  fire: ["#f97316", "#ef4444", "#facc15"],
  mint: ["#34d399", "#6ee7b7", "#d9f99d"],
  neon: ["#22d3ee", "#a855f7", "#f8fafc"],
  ocean: ["#38bdf8", "#2563eb", "#0f172a"],
  prism: ["#64748b", "#eab308", "#22c55e"],
  sunset: ["#f59e0b", "#f97316", "#fde047"],
  theme: ["#22d3ee", "#22d3ee", "#22d3ee"],
};

export const QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS: Array<{
  label: string;
  value: QrDotMatrixSquareLoader;
}> = [
  { label: "Neon Drift", value: "neon-drift" },
  { label: "Pulse Ladder", value: "pulse-ladder" },
  { label: "Core Spiral", value: "core-spiral" },
  { label: "Twin Orbit", value: "twin-orbit" },
  { label: "Flux Columns", value: "flux-columns" },
  { label: "Block Drop", value: "block-drop" },
  { label: "Strobe Stack", value: "strobe-stack" },
  { label: "Glyph Pulse", value: "glyph-pulse" },
  { label: "CRT Glide", value: "crt-glide" },
  { label: "Echo Ring", value: "echo-ring" },
  { label: "Origin Wave", value: "origin-wave" },
  { label: "Core Rotor", value: "core-rotor" },
  { label: "Prism Bloom", value: "prism-bloom" },
  { label: "Helix Glow", value: "helix-glow" },
  { label: "Helix Core", value: "helix-core" },
  { label: "Infinity Run", value: "infinity-run" },
  { label: "Mobius Run", value: "mobius-run" },
];

export const QR_MOTION_DOT_MATRIX_PRESET_OPTIONS: Array<{
  label: string;
  value: QrDotMatrixSquareLoader;
}> = QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS;

const QR_DOT_MATRIX_SQUARE_LOADER_VALUES = new Set<string>(
  QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS.map((option) => option.value),
);

const QR_MOTION_STANDARD_PRESET_VALUES = new Set<string>(
  QR_MOTION_STANDARD_PRESET_OPTIONS.map((option) => option.value),
);

const QR_MOTION_HOVER_EFFECT_VALUES = new Set<string>(
  QR_MOTION_HOVER_EFFECT_OPTIONS.map((option) => option.value),
);

const QR_MOTION_HOVER_COLOR_MODE_VALUES = new Set<string>(
  QR_MOTION_HOVER_COLOR_MODE_OPTIONS.map((option) => option.value),
);

const QR_MOTION_INTENSITY_VALUES = new Set<string>(
  QR_MOTION_INTENSITY_OPTIONS.map((option) => option.value),
);

export const QR_DOT_MATRIX_COLOR_PRESET_OPTIONS: Array<{
  label: string;
  value: QrDotMatrixColorPreset;
}> = [
  { label: "Theme", value: "theme" },
  { label: "Mint", value: "mint" },
  { label: "Sunset", value: "sunset" },
  { label: "Ocean", value: "ocean" },
  { label: "Neon", value: "neon" },
  { label: "Aurora", value: "aurora" },
  { label: "Fire", value: "fire" },
  { label: "Prism", value: "prism" },
];

export const QR_DOT_MATRIX_PATTERN_OPTIONS: Array<{
  label: string;
  value: QrDotMatrixPattern;
}> = [
  { label: "Full", value: "full" },
  { label: "Diamond", value: "diamond" },
  { label: "Outline", value: "outline" },
  { label: "Rose", value: "rose" },
  { label: "Cross", value: "cross" },
  { label: "Rings", value: "rings" },
];export const DEFAULT_DOT_MATRIX_ANIMATION: QrDotMatrixAnimationOptions = {
  animated: true,
  autoAnimate: "",
  autoAnimateInterval: 5000,
  colorPreset: "theme",
  customColor: "#22d3ee",
  customColorBase: "#22d3ee",
  customColorMid: "#22d3ee",
  customColorPeak: "#22d3ee",
  dotShape: "circle",
  enabled: false,
  exportAnimatedSvg: false,
  hoverColorMode: "both",
  hoverEffect: "",
  loader: "neon-drift",
  matrixSize: QR_DOT_MATRIX_MATRIX_SIZE_MIN,
  motionIntensity: "premium",
  opacityBase: 0.16,
  opacityMid: 0.32,
  opacityPeak: 1,
  overlayScale: 100,
  pattern: "full",
  preset: "neon-drift",
  presetCategory: "dotMatrix",
  respectReducedMotion: true,
  speed: 3,
};

export const DEFAULT_BACKGROUND_SHAPE_OPTIONS: BackgroundShapeOptions = {
  edgeBlur: 0,
  paddingPx: 0,
  shadowColor: "#111827",
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowOpacity: 72,
  strokeColor: "#f8fafc",
  strokeOpacity: 100,
  strokeWidth: 0,
  tiltX: 0,
  tiltY: 0,
};

export function createDefaultQrStudioState(): QrStudioState {
  return {
    data: "https://new-qr-studio.local/launch",
    type: "svg",
    width: DEFAULT_QR_SIZE,
    height: DEFAULT_QR_SIZE,
    margin: 12,
    rasterExportQualityPercent: DEFAULT_RASTER_EXPORT_QUALITY,
    logo: {
      presetColor: undefined,
      presetId: undefined,
      source: "none",
      value: undefined,
    },
    backgroundImage: {
      presetColor: undefined,
      presetId: undefined,
      source: "none",
      value: undefined,
    },
    backgroundShapeId: "none",
    backgroundShapeOptions: { ...DEFAULT_BACKGROUND_SHAPE_OPTIONS },
    qrOptions: {
      typeNumber: 0,
      mode: "Byte",
      errorCorrectionLevel: "Q",
      boostLevel: true,
    },
    imageOptions: {
      hideBackgroundDots: true,
      imageSize: 0.1,
      margin: 12,
      crossOrigin: "anonymous",
      opacity: 1,
      sizeMode: "ratio",
      lockAspect: true,
      logoPositionMode: "center",
    },
    dataModulesSettings: {
      type: "rounded",
      color: "#111827",
      roundSize: true,
    },
    gradientLinkMode: "split",
    dotMatrixAnimation: { ...DEFAULT_DOT_MATRIX_ANIMATION },
    dotsColorMode: "solid",
    dotsPalette: [...DEFAULT_DOTS_PALETTE],
    finderPatternOuterSettings: {
      type: "rounded-lg",
      color: "#111827",
    },
    finderPatternInnerSettings: {
      type: "circle",
      color: "#111827",
    },
    backgroundOptions: {
      color: "#f8fafc",
      round: 0,
      transparent: false,
    },
    logoGradient: structuredClone(DEFAULT_GRADIENT),
    dataModulesGradient: structuredClone(DEFAULT_GRADIENT),
    finderPatternOuterGradient: structuredClone(DEFAULT_GRADIENT),
    finderPatternInnerGradient: structuredClone(DEFAULT_GRADIENT),
    backgroundGradient: {
      ...structuredClone(DEFAULT_GRADIENT),
      colorStops: [
        { offset: 0, color: "#f8fafc" },
        { offset: 1, color: "#dbeafe" },
      ],
    },
  };
}

function coerceNumber(
  value: number,
  min: number,
  max: number,
  fallback: number,
) {
  if (Number.isNaN(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

export function clampQrSize(value: number) {
  return coerceNumber(value, QR_SIZE_MIN, QR_SIZE_MAX, DEFAULT_QR_SIZE);
}

export function clampModuleSize(value: number) {
  return coerceNumber(value, QR_MODULE_SIZE_MIN, QR_MODULE_SIZE_MAX, 1);
}

export function clampModuleLineWidth(value: number) {
  return coerceNumber(value, QR_MODULE_LINE_WIDTH_MIN, QR_MODULE_LINE_WIDTH_MAX, 1);
}

export function clampLogoOpacity(value: number) {
  return coerceNumber(value, QR_LOGO_OPACITY_MIN, QR_LOGO_OPACITY_MAX, 1);
}

export function clampRasterExportQualityPercent(value: number) {
  return coerceNumber(
    value,
    RASTER_EXPORT_QUALITY_MIN,
    RASTER_EXPORT_QUALITY_MAX,
    DEFAULT_RASTER_EXPORT_QUALITY,
  );
}

export function clampDotMatrixAnimationSpeed(value: number) {
  return coerceNumber(
    value,
    QR_DOT_MATRIX_ANIMATION_SPEED_MIN,
    QR_DOT_MATRIX_ANIMATION_SPEED_MAX,
    DEFAULT_DOT_MATRIX_ANIMATION.speed,
  );
}

function clampDotMatrixAnimationMatrixSize(value: number) {
  if (!Number.isFinite(value)) {
    return DEFAULT_DOT_MATRIX_ANIMATION.matrixSize;
  }

  const clamped = coerceNumber(
    value,
    QR_DOT_MATRIX_MATRIX_SIZE_MIN,
    QR_DOT_MATRIX_MATRIX_SIZE_MAX,
    DEFAULT_DOT_MATRIX_ANIMATION.matrixSize,
  );

  return Math.round(clamped / QR_DOT_MATRIX_MATRIX_SIZE_STEP) * QR_DOT_MATRIX_MATRIX_SIZE_STEP;
}

export function clampDotMatrixAnimationOverlayScale(value: number) {
  return coerceNumber(
    value,
    QR_DOT_MATRIX_OVERLAY_SCALE_MIN,
    QR_DOT_MATRIX_OVERLAY_SCALE_MAX,
    DEFAULT_DOT_MATRIX_ANIMATION.overlayScale,
  );
}

export function clampDotMatrixAnimationOpacity(value: number, fallback: number) {
  return coerceNumber(
    value,
    QR_DOT_MATRIX_OPACITY_MIN,
    QR_DOT_MATRIX_OPACITY_MAX,
    fallback,
  );
}

function coerceDotMatrixSquareLoader(value: string | undefined) {
  return value && QR_DOT_MATRIX_SQUARE_LOADER_VALUES.has(value)
    ? (value as QrDotMatrixSquareLoader)
    : DEFAULT_DOT_MATRIX_ANIMATION.loader;
}

export function dotMatrixLoaderToBitjsonPreset(loader: QrDotMatrixSquareLoader) {
  return loader
    .split("-")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join("") as QrMotionStandardPreset;
}

function coerceMotionPreset(
  value: string | undefined,
  loader: QrDotMatrixSquareLoader,
): QrDotMatrixAnimationOptions["preset"] {
  if (value && QR_DOT_MATRIX_SQUARE_LOADER_VALUES.has(value)) {
    return value as QrDotMatrixSquareLoader;
  }

  if (value && QR_MOTION_STANDARD_PRESET_VALUES.has(value)) {
    return value as QrMotionStandardPreset;
  }

  return loader;
}

function coerceMotionAutoAnimate(value: string | undefined) {
  if (!value) {
    return "" as const;
  }

  if (QR_DOT_MATRIX_SQUARE_LOADER_VALUES.has(value)) {
    return value as QrDotMatrixSquareLoader;
  }

  if (QR_MOTION_STANDARD_PRESET_VALUES.has(value)) {
    return value as QrMotionStandardPreset;
  }

  return "" as const;
}

function coerceMotionHoverEffect(value: string | undefined) {
  return value && QR_MOTION_HOVER_EFFECT_VALUES.has(value)
    ? (value as QrMotionHoverEffect)
    : DEFAULT_DOT_MATRIX_ANIMATION.hoverEffect;
}

function coerceMotionHoverColorMode(value: string | undefined) {
  return value && QR_MOTION_HOVER_COLOR_MODE_VALUES.has(value)
    ? (value as QrMotionHoverColorMode)
    : DEFAULT_DOT_MATRIX_ANIMATION.hoverColorMode;
}

function coerceMotionIntensity(value: string | undefined) {
  return value && QR_MOTION_INTENSITY_VALUES.has(value)
    ? (value as QrMotionIntensity)
    : DEFAULT_DOT_MATRIX_ANIMATION.motionIntensity;
}

function coerceMotionAutoAnimateInterval(value: number | undefined) {
  return coerceNumber(
    value ?? DEFAULT_DOT_MATRIX_ANIMATION.autoAnimateInterval,
    QR_MOTION_AUTO_ANIMATE_INTERVAL_MIN,
    QR_MOTION_AUTO_ANIMATE_INTERVAL_MAX,
    DEFAULT_DOT_MATRIX_ANIMATION.autoAnimateInterval,
  );
}

export function resolveBitjsonMotionPreset(animation: QrDotMatrixAnimationOptions) {
  if (animation.presetCategory === "dotMatrix") {
    const loader =
      typeof animation.preset === "string" && QR_DOT_MATRIX_SQUARE_LOADER_VALUES.has(animation.preset)
        ? (animation.preset as QrDotMatrixSquareLoader)
        : animation.loader;

    return dotMatrixLoaderToBitjsonPreset(loader);
  }

  if (
    typeof animation.preset === "string" &&
    QR_MOTION_STANDARD_PRESET_VALUES.has(animation.preset)
  ) {
    return animation.preset;
  }

  return "SpiralBloom";
}

export function resolveBitjsonAutoAnimatePreset(animation: QrDotMatrixAnimationOptions) {
  if (!animation.autoAnimate) {
    return "";
  }

  if (QR_DOT_MATRIX_SQUARE_LOADER_VALUES.has(animation.autoAnimate)) {
    return dotMatrixLoaderToBitjsonPreset(animation.autoAnimate as QrDotMatrixSquareLoader);
  }

  return animation.autoAnimate;
}

function coerceDotMatrixAnimationColor(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function clampBackgroundShapePaddingPx(value: number) {
  return coerceNumber(
    value,
    0,
    BACKGROUND_SHAPE_PADDING_PX_MAX,
    DEFAULT_BACKGROUND_SHAPE_OPTIONS.paddingPx,
  );
}

export function clampBackgroundShapeStrokeWidth(value: number) {
  return coerceNumber(
    value,
    0,
    BACKGROUND_SHAPE_STROKE_WIDTH_MAX,
    DEFAULT_BACKGROUND_SHAPE_OPTIONS.strokeWidth,
  );
}

export function clampBackgroundShapeOpacity(value: number) {
  return coerceNumber(
    value,
    0,
    BACKGROUND_SHAPE_OPACITY_MAX,
    DEFAULT_BACKGROUND_SHAPE_OPTIONS.strokeOpacity,
  );
}

export function clampBackgroundShapeOffset(value: number) {
  return coerceNumber(
    value,
    BACKGROUND_SHAPE_SHADOW_OFFSET_MIN,
    BACKGROUND_SHAPE_SHADOW_OFFSET_MAX,
    DEFAULT_BACKGROUND_SHAPE_OPTIONS.shadowOffsetX,
  );
}

export function clampBackgroundShapeEdgeBlur(value: number) {
  return coerceNumber(
    value,
    0,
    BACKGROUND_SHAPE_EDGE_BLUR_MAX,
    DEFAULT_BACKGROUND_SHAPE_OPTIONS.edgeBlur,
  );
}

export function clampBackgroundShapeTilt(value: number) {
  return coerceNumber(
    value,
    BACKGROUND_SHAPE_TILT_MIN,
    BACKGROUND_SHAPE_TILT_MAX,
    0,
  );
}

export function clampQrBackgroundRound(value: number) {
  return coerceNumber(value, 0, 1, 0);
}

export function setSquareQrSize(state: QrStudioState, size: number): QrStudioState {
  const nextSize = clampQrSize(size);

  if (state.width === nextSize && state.height === nextSize) {
    return state;
  }

  return {
    ...state,
    width: nextSize,
    height: nextSize,
  };
}

export function setRasterExportQualityPercent(
  state: QrStudioState,
  qualityPercent: number,
): QrStudioState {
  const nextQualityPercent = clampRasterExportQualityPercent(qualityPercent);

  if (state.rasterExportQualityPercent === nextQualityPercent) {
    return state;
  }

  return {
    ...state,
    rasterExportQualityPercent: nextQualityPercent,
  };
}

export function setDotMatrixAnimationOptions(
  state: QrStudioState,
  patch: QrDotMatrixAnimationPatch,
): QrStudioState {
  const hasRemovedAnimationOptions =
    Object.prototype.hasOwnProperty.call(state.dotMatrixAnimation, "bloom") ||
    Object.prototype.hasOwnProperty.call(state.dotMatrixAnimation, "halo") ||
    Object.prototype.hasOwnProperty.call(state.dotMatrixAnimation, "hoverAnimated") ||
    Object.prototype.hasOwnProperty.call(state.dotMatrixAnimation, "muted");
  const hasMissingMatrixSize =
    !Object.prototype.hasOwnProperty.call(state.dotMatrixAnimation, "matrixSize");
  const nextCustomColor = coerceDotMatrixAnimationColor(
    patch.customColor ?? state.dotMatrixAnimation.customColor,
    DEFAULT_DOT_MATRIX_ANIMATION.customColor,
  );
  const nextLoader = coerceDotMatrixSquareLoader(
    patch.loader ?? state.dotMatrixAnimation.loader,
  );
  const nextAnimation: QrDotMatrixAnimationOptions = {
    animated: patch.animated ?? state.dotMatrixAnimation.animated,
    autoAnimate: coerceMotionAutoAnimate(
      patch.autoAnimate ?? state.dotMatrixAnimation.autoAnimate,
    ),
    autoAnimateInterval: coerceMotionAutoAnimateInterval(
      patch.autoAnimateInterval ?? state.dotMatrixAnimation.autoAnimateInterval,
    ),
    colorPreset: patch.colorPreset ?? state.dotMatrixAnimation.colorPreset,
    customColor: nextCustomColor,
    customColorBase: coerceDotMatrixAnimationColor(
      patch.customColorBase ?? state.dotMatrixAnimation.customColorBase,
      nextCustomColor,
    ),
    customColorMid: coerceDotMatrixAnimationColor(
      patch.customColorMid ?? state.dotMatrixAnimation.customColorMid,
      nextCustomColor,
    ),
    customColorPeak: coerceDotMatrixAnimationColor(
      patch.customColorPeak ?? state.dotMatrixAnimation.customColorPeak,
      nextCustomColor,
    ),
    dotShape: patch.dotShape ?? state.dotMatrixAnimation.dotShape,
    enabled: patch.enabled ?? state.dotMatrixAnimation.enabled,
    exportAnimatedSvg:
      patch.exportAnimatedSvg ?? state.dotMatrixAnimation.exportAnimatedSvg,
    hoverColorMode: coerceMotionHoverColorMode(
      patch.hoverColorMode ?? state.dotMatrixAnimation.hoverColorMode,
    ),
    hoverEffect: coerceMotionHoverEffect(
      patch.hoverEffect ?? state.dotMatrixAnimation.hoverEffect,
    ),
    loader: nextLoader,
    matrixSize: clampDotMatrixAnimationMatrixSize(
      patch.matrixSize ?? state.dotMatrixAnimation.matrixSize,
    ),
    motionIntensity: coerceMotionIntensity(
      patch.motionIntensity ?? state.dotMatrixAnimation.motionIntensity,
    ),
    opacityBase: clampDotMatrixAnimationOpacity(
      patch.opacityBase ?? state.dotMatrixAnimation.opacityBase,
      DEFAULT_DOT_MATRIX_ANIMATION.opacityBase,
    ),
    opacityMid: clampDotMatrixAnimationOpacity(
      patch.opacityMid ?? state.dotMatrixAnimation.opacityMid,
      DEFAULT_DOT_MATRIX_ANIMATION.opacityMid,
    ),
    opacityPeak: clampDotMatrixAnimationOpacity(
      patch.opacityPeak ?? state.dotMatrixAnimation.opacityPeak,
      DEFAULT_DOT_MATRIX_ANIMATION.opacityPeak,
    ),
    overlayScale: clampDotMatrixAnimationOverlayScale(
      patch.overlayScale ?? state.dotMatrixAnimation.overlayScale,
    ),
    pattern: patch.pattern ?? state.dotMatrixAnimation.pattern,
    preset: coerceMotionPreset(
      patch.preset ?? state.dotMatrixAnimation.preset,
      nextLoader,
    ),
    presetCategory:
      patch.presetCategory ?? state.dotMatrixAnimation.presetCategory ?? "dotMatrix",
    respectReducedMotion:
      patch.respectReducedMotion ?? state.dotMatrixAnimation.respectReducedMotion,
    speed: clampDotMatrixAnimationSpeed(
      patch.speed ?? state.dotMatrixAnimation.speed,
    ),
  };

  if (
    state.dotMatrixAnimation.enabled === nextAnimation.enabled &&
    state.dotMatrixAnimation.exportAnimatedSvg === nextAnimation.exportAnimatedSvg &&
    state.dotMatrixAnimation.animated === nextAnimation.animated &&
    state.dotMatrixAnimation.autoAnimate === nextAnimation.autoAnimate &&
    state.dotMatrixAnimation.autoAnimateInterval === nextAnimation.autoAnimateInterval &&
    state.dotMatrixAnimation.colorPreset === nextAnimation.colorPreset &&
    state.dotMatrixAnimation.customColor === nextAnimation.customColor &&
    state.dotMatrixAnimation.customColorBase === nextAnimation.customColorBase &&
    state.dotMatrixAnimation.customColorMid === nextAnimation.customColorMid &&
    state.dotMatrixAnimation.customColorPeak === nextAnimation.customColorPeak &&
    state.dotMatrixAnimation.dotShape === nextAnimation.dotShape &&
    state.dotMatrixAnimation.hoverColorMode === nextAnimation.hoverColorMode &&
    state.dotMatrixAnimation.hoverEffect === nextAnimation.hoverEffect &&
    state.dotMatrixAnimation.loader === nextAnimation.loader &&
    state.dotMatrixAnimation.matrixSize === nextAnimation.matrixSize &&
    state.dotMatrixAnimation.motionIntensity === nextAnimation.motionIntensity &&
    state.dotMatrixAnimation.opacityBase === nextAnimation.opacityBase &&
    state.dotMatrixAnimation.opacityMid === nextAnimation.opacityMid &&
    state.dotMatrixAnimation.opacityPeak === nextAnimation.opacityPeak &&
    state.dotMatrixAnimation.overlayScale === nextAnimation.overlayScale &&
    state.dotMatrixAnimation.pattern === nextAnimation.pattern &&
    state.dotMatrixAnimation.preset === nextAnimation.preset &&
    state.dotMatrixAnimation.presetCategory === nextAnimation.presetCategory &&
    state.dotMatrixAnimation.respectReducedMotion === nextAnimation.respectReducedMotion &&
    state.dotMatrixAnimation.speed === nextAnimation.speed &&
    !hasRemovedAnimationOptions &&
    !hasMissingMatrixSize
  ) {
    return state;
  }

  return {
    ...state,
    dotMatrixAnimation: nextAnimation,
  };
}

export function getAssetValue(asset?: StudioAsset) {
  const trimmed = asset?.value?.trim();

  return trimmed ? trimmed : undefined;
}

export function hasBackgroundImage(state: QrStudioState) {
  return Boolean(getAssetValue(state.backgroundImage));
}

export function hasActiveBackgroundShapeOptions(
  options: Partial<BackgroundShapeOptions> | undefined,
) {
  return Boolean(
    options &&
      ((options.paddingPx ?? DEFAULT_BACKGROUND_SHAPE_OPTIONS.paddingPx) >
        DEFAULT_BACKGROUND_SHAPE_OPTIONS.paddingPx ||
        (options.strokeWidth ?? DEFAULT_BACKGROUND_SHAPE_OPTIONS.strokeWidth) > 0),
  );
}
