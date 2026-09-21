import type { QrBackgroundShapeId } from "@/features/qr-code/styles/background-shapes";
import {
  cloneDraftingCardPaperShaderState,
  createDefaultDraftingCardPaperShader,
  type DraftingCardPaperShaderState,
} from "@/features/workspace/model/card-state";
import { dotMatrixLoaderToPresetName as mapLoaderToPresetName } from "@qrafty/qr/dot-matrix";
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

export type QraftyCornerDotStyle = QrFinderPatternInnerStyle | CustomCornerDotShape;

export type GradientStop = {
  offset: number;
  color: string;
};

export type QraftyGradientCenter = {
  x: number;
  y: number;
};

export type QraftyGradient = {
  enabled: boolean;
  type: QrGradientType;
  rotation: number;
  colorStops: [GradientStop, GradientStop];
  /** Normalized radial center in 0..1. Defaults to the box center. */
  center?: QraftyGradientCenter;
};

export type QraftyDataModulesStyle = QrDataModulesStyle;
export type DotsColorMode = "solid" | "gradient" | "palette" | "image";
export type QrLogoPositionMode = "center" | "custom";
export type QrLogoSizeMode = "ratio" | "pixels";
export type QrCrossOrigin = "anonymous" | "use-credentials" | "";
export type QrGradientLinkMode = "split" | "unified";
export type AssetSourceMode = "none" | "preset" | "url" | "upload";
export type QrDotMatrixSquareLoader =
  | "neon-drift"
  | "flux-columns"
  | "radial-expand"
  | "diamond-expand"
  | "heart-expand"
  | "star-expand"
  | "chevron-sweep";
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

export type QrMotionPresetCategory = "dotMatrix" | "shader" | "standard";
export type QrMotionStandardPreset = string;
export type QrMotionHoverEffect = string;
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
  durationSeconds: number;
  frameRate: 30 | 60;
  videoFormat: "mp4" | "webm";
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
  paperShader: DraftingCardPaperShaderState;
  presetCategory: QrMotionPresetCategory;
  respectReducedMotion: boolean;
  speed: number;
};

export type QrDotMatrixAnimationPatch =
  Partial<Omit<QrDotMatrixAnimationOptions, "loader" | "preset">> & {
    loader?: QrDotMatrixSquareLoader | string;
    preset?: QrMotionStandardPreset | QrDotMatrixSquareLoader | string;
  };

export type QraftyAsset = {
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

export type QraftyState = {
  data: string;
  type: QrDrawType;
  width: number;
  height: number;
  margin: number;
  rasterExportQualityPercent: number;
  logo: QraftyAsset;
  moduleFillImage: QraftyAsset;
  backgroundImage: QraftyAsset;
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
    type: QraftyDataModulesStyle;
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
    type: QraftyCornerDotStyle;
    color: string;
  };
  backgroundOptions: {
    color: string;
    round: number;
    transparent: boolean;
  };
  logoGradient: QraftyGradient;
  dataModulesGradient: QraftyGradient;
  finderPatternOuterGradient: QraftyGradient;
  finderPatternInnerGradient: QraftyGradient;
  backgroundGradient: QraftyGradient;
};const QR_SIZE_MIN = 120;
const QR_SIZE_MAX = 1200;
const DEFAULT_QR_SIZE = 320;
const RASTER_EXPORT_QUALITY_MIN = 25;
const RASTER_EXPORT_QUALITY_MAX = 100;
const DEFAULT_RASTER_EXPORT_QUALITY = 100;
export const QR_DOT_MATRIX_ANIMATION_SPEED_MIN = 1;
export const QR_DOT_MATRIX_ANIMATION_SPEED_MAX = 10;
const QR_DOT_MATRIX_ANIMATION_SPEED_SLIDER_MIN = 0;
const QR_DOT_MATRIX_ANIMATION_SPEED_SLIDER_MAX = 100;
export const QR_DOT_MATRIX_MATRIX_SIZE_MIN = 5;
export const QR_DOT_MATRIX_MATRIX_SIZE_MAX = 25;
export const QR_DOT_MATRIX_MATRIX_SIZE_STEP = 5;
const QR_DOT_MATRIX_OVERLAY_SCALE_MIN = 100;
const QR_DOT_MATRIX_OVERLAY_SCALE_MAX = 140;
const QR_DOT_MATRIX_OPACITY_MIN = 0;
const QR_DOT_MATRIX_OPACITY_MAX = 1;
const BACKGROUND_SHAPE_PADDING_PX_MAX = 192;
const BACKGROUND_SHAPE_STROKE_WIDTH_MAX = 24;
const BACKGROUND_SHAPE_EDGE_BLUR_MAX = 32;
const BACKGROUND_SHAPE_OPACITY_MAX = 100;
const BACKGROUND_SHAPE_SHADOW_OFFSET_MIN = -64;
const BACKGROUND_SHAPE_SHADOW_OFFSET_MAX = 64;
const BACKGROUND_SHAPE_TILT_MIN = -60;
const BACKGROUND_SHAPE_TILT_MAX = 60;
const QR_MODULE_SIZE_MIN = 0.75;
const QR_MODULE_SIZE_MAX = 1;
const QR_MODULE_LINE_WIDTH_MIN = 0.25;
const QR_MODULE_LINE_WIDTH_MAX = 1;
const QR_LOGO_OPACITY_MIN = 0;
const QR_LOGO_OPACITY_MAX = 1;

const DEFAULT_GRADIENT: QraftyGradient = {
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

export const MOTION_COLOR_SWATCHES: Record<QrDotMatrixColorPreset, [string, string]> = {
  aurora: ["#67e8f9", "#f0abfc"],
  fire: ["#f97316", "#facc15"],
  mint: ["#34d399", "#d9f99d"],
  neon: ["#22d3ee", "#f8fafc"],
  ocean: ["#38bdf8", "#0f172a"],
  prism: ["#64748b", "#22c55e"],
  sunset: ["#f59e0b", "#fde047"],
  theme: ["#22d3ee", "#22d3ee"],
};

export const QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS: Array<{
  label: string;
  value: QrDotMatrixSquareLoader;
}> = [
  { label: "Neon Drift", value: "neon-drift" },
  { label: "Flux Columns", value: "flux-columns" },
  { label: "Radial", value: "radial-expand" },
  { label: "Diamond", value: "diamond-expand" },
  { label: "Heart", value: "heart-expand" },
  { label: "Star", value: "star-expand" },
  { label: "Chevron Sweep", value: "chevron-sweep" },
];

const DEPRECATED_DOT_MATRIX_LOADERS: Record<string, QrDotMatrixSquareLoader> = {
  "cross-bloom": "radial-expand",
  "echo-ring": "radial-expand",
  "fan-rotate": "neon-drift",
  "origin-wave": "radial-expand",
  "scan": "neon-drift",
  "tunnel": "neon-drift",
  "wave": "neon-drift",
};

const QR_DOT_MATRIX_SQUARE_LOADER_VALUES = new Set<string>(
  QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS.map((option) => option.value),
);

function coerceMotionPresetCategory(value: unknown): QrMotionPresetCategory {
  if (value === "shader" || value === "standard") {
    return value;
  }

  return "dotMatrix";
}

export const DEFAULT_DOT_MATRIX_ANIMATION: QrDotMatrixAnimationOptions = {
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
  durationSeconds: 5,
  frameRate: 30,
  videoFormat: "webm",
  hoverColorMode: "both",
  hoverEffect: "",
  loader: "neon-drift",
  matrixSize: QR_DOT_MATRIX_MATRIX_SIZE_MIN,
  motionIntensity: "premium",
  opacityBase: 1,
  opacityMid: 0.65,
  opacityPeak: 1,
  overlayScale: 100,
  pattern: "full",
  paperShader: createDefaultDraftingCardPaperShader("mesh-gradient"),
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

export function createDefaultQraftyState(): QraftyState {
  return {
    data: "https://qrafty.local/launch",
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
    moduleFillImage: {
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

function clampModuleSize(value: number) {
  return coerceNumber(value, QR_MODULE_SIZE_MIN, QR_MODULE_SIZE_MAX, 1);
}

function clampModuleLineWidth(value: number) {
  return coerceNumber(value, QR_MODULE_LINE_WIDTH_MIN, QR_MODULE_LINE_WIDTH_MAX, 1);
}

function clampLogoOpacity(value: number) {
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

function clampDotMatrixAnimationSpeedSliderPercent(value: number) {
  return coerceNumber(
    value,
    QR_DOT_MATRIX_ANIMATION_SPEED_SLIDER_MIN,
    QR_DOT_MATRIX_ANIMATION_SPEED_SLIDER_MAX,
    dotMatrixAnimationSpeedToSliderPercent(DEFAULT_DOT_MATRIX_ANIMATION.speed),
  );
}

/** Maps internal motion speed (1–10) to a perceptually even 0–100 slider value. */
export function dotMatrixAnimationSpeedToSliderPercent(speed: number) {
  const clampedSpeed = clampDotMatrixAnimationSpeed(speed);
  const normalized =
    (Math.log(clampedSpeed) - Math.log(QR_DOT_MATRIX_ANIMATION_SPEED_MIN)) /
    (Math.log(QR_DOT_MATRIX_ANIMATION_SPEED_MAX) -
      Math.log(QR_DOT_MATRIX_ANIMATION_SPEED_MIN));

  return Math.round(
    normalized *
      (QR_DOT_MATRIX_ANIMATION_SPEED_SLIDER_MAX -
        QR_DOT_MATRIX_ANIMATION_SPEED_SLIDER_MIN) +
      QR_DOT_MATRIX_ANIMATION_SPEED_SLIDER_MIN,
  );
}

/** Maps a 0–100 slider value back to internal motion speed (1–10). */
export function sliderPercentToDotMatrixAnimationSpeed(percent: number) {
  const clampedPercent = clampDotMatrixAnimationSpeedSliderPercent(percent);
  const normalized =
    (clampedPercent - QR_DOT_MATRIX_ANIMATION_SPEED_SLIDER_MIN) /
    (QR_DOT_MATRIX_ANIMATION_SPEED_SLIDER_MAX -
      QR_DOT_MATRIX_ANIMATION_SPEED_SLIDER_MIN);
  const speed =
    QR_DOT_MATRIX_ANIMATION_SPEED_MIN *
    (QR_DOT_MATRIX_ANIMATION_SPEED_MAX / QR_DOT_MATRIX_ANIMATION_SPEED_MIN) **
      normalized;

  return clampDotMatrixAnimationSpeed(speed);
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
  if (value && DEPRECATED_DOT_MATRIX_LOADERS[value]) {
    return DEPRECATED_DOT_MATRIX_LOADERS[value];
  }

  return value && QR_DOT_MATRIX_SQUARE_LOADER_VALUES.has(value)
    ? (value as QrDotMatrixSquareLoader)
    : DEFAULT_DOT_MATRIX_ANIMATION.loader;
}

function coerceMotionPreset(
  value: string | undefined,
  loader: QrDotMatrixSquareLoader,
): QrDotMatrixAnimationOptions["preset"] {
  if (value && QR_DOT_MATRIX_SQUARE_LOADER_VALUES.has(value)) {
    return value as QrDotMatrixSquareLoader;
  }

  return loader;
}

export function resolveDotMatrixMotionPreset(animation: QrDotMatrixAnimationOptions) {
  const loader =
    typeof animation.preset === "string" && QR_DOT_MATRIX_SQUARE_LOADER_VALUES.has(animation.preset)
      ? (animation.preset as QrDotMatrixSquareLoader)
      : animation.loader;

  return mapLoaderToPresetName(loader);
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

const REMOVED_DOT_MATRIX_OPTION_KEYS = ["bloom", "halo", "hoverAnimated", "muted"] as const;

const DOT_MATRIX_ANIMATION_COMPARE_FIELDS = [
  "enabled",
  "exportAnimatedSvg",
  "animated",
  "colorPreset",
  "customColor",
  "customColorBase",
  "customColorMid",
  "customColorPeak",
  "dotShape",
  "loader",
  "matrixSize",
  "opacityBase",
  "opacityMid",
  "opacityPeak",
  "overlayScale",
  "pattern",
  "preset",
  "presetCategory",
  "respectReducedMotion",
  "speed",
] as const satisfies readonly (keyof QrDotMatrixAnimationOptions)[];

function resolveDotMatrixAnimation(
  current: QrDotMatrixAnimationOptions,
  patch: QrDotMatrixAnimationPatch,
): QrDotMatrixAnimationOptions {
  const nextCustomColor = coerceDotMatrixAnimationColor(
    patch.customColor ?? current.customColor,
    DEFAULT_DOT_MATRIX_ANIMATION.customColor,
  );
  const nextLoader = coerceDotMatrixSquareLoader(
    patch.loader ?? current.loader,
  );
  const take = <K extends keyof QrDotMatrixAnimationOptions>(key: K) =>
    patch[key] ?? current[key];
  const opacityField = (key: "opacityBase" | "opacityMid" | "opacityPeak") =>
    clampDotMatrixAnimationOpacity(take(key), DEFAULT_DOT_MATRIX_ANIMATION[key]);

  return {
    animated: take("animated"),
    autoAnimate: "",
    autoAnimateInterval: 5000,
    colorPreset: take("colorPreset"),
    customColor: nextCustomColor,
    customColorBase: coerceDotMatrixAnimationColor(
      patch.customColorBase ?? current.customColorBase,
      nextCustomColor,
    ),
    customColorPeak: coerceDotMatrixAnimationColor(
      patch.customColorPeak ?? current.customColorPeak,
      nextCustomColor,
    ),
    customColorMid: coerceDotMatrixAnimationColor(
      patch.customColorMid ?? patch.customColorPeak ?? current.customColorMid,
      coerceDotMatrixAnimationColor(
        patch.customColorPeak ?? current.customColorPeak,
        nextCustomColor,
      ),
    ),
    dotShape: take("dotShape"),
    enabled: take("enabled"),
    exportAnimatedSvg: take("exportAnimatedSvg"),
    durationSeconds: take("durationSeconds") ?? DEFAULT_DOT_MATRIX_ANIMATION.durationSeconds,
    frameRate: take("frameRate") ?? DEFAULT_DOT_MATRIX_ANIMATION.frameRate,
    videoFormat: take("videoFormat") ?? DEFAULT_DOT_MATRIX_ANIMATION.videoFormat,
    hoverColorMode: "both",
    hoverEffect: "",
    loader: nextLoader,
    matrixSize: clampDotMatrixAnimationMatrixSize(take("matrixSize")),
    motionIntensity: "premium",
    opacityBase: opacityField("opacityBase"),
    opacityMid: opacityField("opacityMid"),
    opacityPeak: opacityField("opacityPeak"),
    overlayScale: clampDotMatrixAnimationOverlayScale(take("overlayScale")),
    pattern: take("pattern"),
    preset: coerceMotionPreset(take("preset"), nextLoader),
    paperShader: cloneDraftingCardPaperShaderState(
      take("paperShader") ?? DEFAULT_DOT_MATRIX_ANIMATION.paperShader,
    ),
    presetCategory: coerceMotionPresetCategory(take("presetCategory")),
    respectReducedMotion: take("respectReducedMotion"),
    speed: clampDotMatrixAnimationSpeed(take("speed")),
  };
}

function dotMatrixAnimationNeedsUpdate(
  current: QrDotMatrixAnimationOptions,
  next: QrDotMatrixAnimationOptions,
): boolean {
  if (
    REMOVED_DOT_MATRIX_OPTION_KEYS.some((key) =>
      Object.prototype.hasOwnProperty.call(current, key),
    )
  ) {
    return true;
  }

  if (!Object.prototype.hasOwnProperty.call(current, "matrixSize")) {
    return true;
  }

  if (
    JSON.stringify(current.paperShader) !== JSON.stringify(next.paperShader)
  ) {
    return true;
  }

  return DOT_MATRIX_ANIMATION_COMPARE_FIELDS.some(
    (field) => current[field] !== next[field],
  );
}

export function setDotMatrixAnimationOptions(
  state: QraftyState,
  patch: QrDotMatrixAnimationPatch,
): QraftyState {
  const nextAnimation = resolveDotMatrixAnimation(
    state.dotMatrixAnimation,
    patch,
  );

  if (!dotMatrixAnimationNeedsUpdate(state.dotMatrixAnimation, nextAnimation)) {
    return state;
  }

  return {
    ...state,
    dotMatrixAnimation: nextAnimation,
  };
}

export function getAssetValue(asset?: QraftyAsset) {
  const trimmed = asset?.value?.trim();

  return trimmed ? trimmed : undefined;
}

export function hasBackgroundImage(state: QraftyState) {
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
