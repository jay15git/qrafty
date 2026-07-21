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
};

const QR_SIZE_MIN = 120;
const QR_SIZE_MAX = 1200;
const DEFAULT_QR_SIZE = 320;
const RASTER_EXPORT_QUALITY_MIN = 25;
const RASTER_EXPORT_QUALITY_MAX = 100;
const DEFAULT_RASTER_EXPORT_QUALITY = 100;
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
