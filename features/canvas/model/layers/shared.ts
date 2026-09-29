import {
  normalizeCanvasCardShadow,
  type CanvasCardShadowState,
} from "@/features/canvas/model/card-state";
import {
  createDefaultCanvasShadowLayer,
  DEFAULT_OUTLINE,
  type CanvasBorderStyle,
  type CanvasOutlineState,
  type CanvasPerSideBorderState,
  type CanvasShadowLayerState,
  legacyShadowToShadowLayer,
  normalizeOutlineState,
  normalizePerSideBorderState,
  normalizeShadowLayerState,
  shadowLayerToLegacyShadow,
} from "@/features/canvas/model/effects";
import {
  getBlurAmountFromFilters,
  normalizeFilterEffects,
  syncBlurFilter,
  syncLegacyBlurFromFilters,
  type CanvasFilterEffect,
} from "@/features/canvas/model/filters";
import { DEFAULT_FONT_ID } from "@/features/canvas/model/fonts";
import type { QrBackgroundShapeId } from "@/features/qr/styles/background-shapes";
import { clampBackgroundShapeTilt } from "@/features/qr/model/state";
import {
  imagePaint,
  nonePaint,
  paintFromQraftyGradient,
  solidPaint,
  type Paint,
} from "@/features/canvas/model/paint";
import type { QraftyGradient } from "@/features/qr/model/state";
import {
  cornerRadiiToLegacyRadius,
  normalizeCornerRadiiState,
  type CanvasCornerRadiiState,
} from "@/features/canvas/model/corner-radius";
import type { CanvasIllustrationColorStop } from "@/features/canvas/assets/illustration-recolor";

/** The workspace has exactly one board; every canvas layer hangs off it. */
export type CanvasLayerKind = "card" | "group" | "image" | "qr" | "shape" | "text";
export type CanvasImageSourceMode = "none" | "upload" | "url";
export type CanvasImageFit = "contain" | "cover";
export type CanvasShapePrimitiveId = "arrow" | "ellipse" | "line" | "rect";
export type CanvasElementShapeId = CanvasShapePrimitiveId | Exclude<QrBackgroundShapeId, "none">;
export type CanvasTextAlign = "center" | "left" | "right";
export type CanvasTextFontStyle = "italic" | "normal";
export type CanvasTextFontWeight = "bold" | "normal" | number;
export type CanvasTextRun = {
  fill?: string;
  fontFamily?: string;
  fontId?: string;
  fontSize?: number;
  fontStyle?: CanvasTextFontStyle;
  fontWeight?: CanvasTextFontWeight;
  text: string;
  underline?: boolean;
};

export type CanvasLayer = {
  blur: number;
  borderSides?: CanvasPerSideBorderState;
  height: number;
  id: string;
  isVisible: boolean;
  kind: CanvasLayerKind;
  cornerRadius?: number;
  cornerRadii?: CanvasCornerRadiiState;
  fill?: Paint;
  fontFamily?: string;
  fontId?: string;
  fontSize?: number;
  fontStyle?: CanvasTextFontStyle;
  fontWeight?: CanvasTextFontWeight;
  imageFit?: CanvasImageFit;
  imageSource?: CanvasImageSourceMode;
  imageValue?: string;
  illustrationColorStops?: CanvasIllustrationColorStop[];
  layerFilters: CanvasFilterEffect[];
  letterSpacing?: number;
  lineHeight?: number;
  name: string;
  nodeId: string;
  opacity: number;
  outline: CanvasOutlineState;
  rotation: number;
  scaleX?: number;
  scaleY?: number;
  shapeId?: CanvasElementShapeId;
  stroke?: string;
  strokeOpacity?: number;
  strokeStyle?: CanvasBorderStyle;
  strokeWidth?: number;
  tiltX: number;
  tiltY: number;
  shadow: CanvasCardShadowState;
  shadows: CanvasShadowLayerState[];
  text?: string;
  textAlign?: CanvasTextAlign;
  textRuns?: CanvasTextRun[];
  underline?: boolean;
  width: number;
  x: number;
  y: number;
  zIndex: number;
  children?: CanvasLayer[];
};

export type CanvasLayerReorderAction = "back" | "backward" | "forward" | "front";
export type CanvasLayerAlignAction = "bottom" | "center-x" | "center-y" | "left" | "right" | "top";
export type CanvasLayerDistributeAction = "horizontal" | "vertical";

const DRAFTING_CARD_LAYER_SUFFIX = ":card";
const DRAFTING_QR_LAYER_SUFFIX = ":qr";

export const DEFAULT_LAYER_SHADOW: CanvasCardShadowState = {
  blur: 0,
  color: "#111827",
  inset: false,
  kind: "drop",
  offsetX: 0,
  offsetY: 0,
  opacity: 0,
  spread: 0,
  visible: false,
};
export const DEFAULT_TEXT_COLOR = "#171717";

export const DEFAULT_TEXT_LAYER = {
  fill: solidPaint(DEFAULT_TEXT_COLOR),
  fontFamily: "Satoshi",
  fontId: DEFAULT_FONT_ID,
  fontSize: 32,
  fontStyle: "normal",
  fontWeight: "normal",
  letterSpacing: 0,
  lineHeight: 1.22,
  text: "Add text",
  textAlign: "left",
  underline: false,
} as const;

export const DEFAULT_IMAGE_LAYER = {
  cornerRadius: 0,
  imageFit: "cover",
  imageSource: "none",
  imageValue: "",
} as const satisfies Partial<CanvasLayer>;

export const DEFAULT_SHAPE_LAYER = {
  cornerRadius: 16,
  fill: solidPaint("#E8E8E8"),
  shapeId: "rounded-square",
  stroke: "#171717",
  strokeOpacity: 100,
  strokeStyle: "solid",
  strokeWidth: 0,
} as const satisfies Partial<CanvasLayer>;

export function getCanvasCardLayerId(nodeId: string) {
  return `${nodeId}${DRAFTING_CARD_LAYER_SUFFIX}`;
}

export function getCanvasQrLayerId(nodeId: string) {
  return `${nodeId}${DRAFTING_QR_LAYER_SUFFIX}`;
}

export function createAdditionalCanvasQrLayerId(nodeId: string) {
  return `${nodeId}${DRAFTING_QR_LAYER_SUFFIX}:${crypto.randomUUID()}`;
}

export function isCanvasCardLayerId(layerId: string | null | undefined) {
  return Boolean(layerId?.endsWith(DRAFTING_CARD_LAYER_SUFFIX));
}

export function isCanvasQrLayerId(layerId: string | null | undefined) {
  if (!layerId) {
    return false;
  }

  return /:qr(?::|$)/.test(layerId);
}

function isQrCanvasLayer(layer: Pick<CanvasLayer, "kind">): layer is CanvasLayer & { kind: "qr" } {
  return layer.kind === "qr";
}

export function getQrCanvasLayers(layers: CanvasLayer[]) {
  return layers.filter(isQrCanvasLayer);
}

function canDeleteQrLayer(layerId: string, layers: CanvasLayer[]) {
  if (!isCanvasQrLayerId(layerId)) {
    return false;
  }

  return getQrCanvasLayers(layers).length > 1;
}

export function isLayerDeletable(layerId: string, layers: CanvasLayer[]) {
  if (isCanvasCardLayerId(layerId)) {
    return false;
  }

  if (isCanvasQrLayerId(layerId)) {
    return canDeleteQrLayer(layerId, layers);
  }

  return true;
}

export function isProtectedCanvasLayerId(
  layerId: string | null | undefined,
  layers?: CanvasLayer[],
) {
  if (isCanvasCardLayerId(layerId)) {
    return true;
  }

  if (layerId && isCanvasQrLayerId(layerId) && layers) {
    return !canDeleteQrLayer(layerId, layers);
  }

  return false;
}

export type NormalizeCanvasLayerContext = {
  fallback: CanvasLayer;
  fallbackLayers: CanvasLayer[];
  height: number;
  kind: CanvasLayerKind;
  nodeId: string;
  value: Record<string, unknown>;
  width: number;
};

export function normalizeSharedCanvasLayerFields({
  fallback,
  height,
  nodeId,
  value,
  width,
}: NormalizeCanvasLayerContext): Omit<CanvasLayer, "kind"> {
  const legacyBlur = clamp(readFiniteNumber(value.blur, fallback.blur), 0, 96);
  const layerFilters = normalizeCanvasLayerFilters(
    value.layerFilters,
    fallback.layerFilters ?? [],
    legacyBlur,
  );
  const shadow = normalizeCanvasLayerShadow(value.shadow, fallback.shadow);
  const shadows = normalizeCanvasLayerShadows(
    value.shadows,
    shadow,
    fallback.shadows ?? [legacyShadowToShadowLayer(shadow)],
  );

  return {
    blur: syncLegacyBlurFromFilters(layerFilters),
    borderSides: normalizeCanvasLayerBorderSides(value.borderSides, fallback.borderSides),
    children: undefined,
    height: Math.max(1, height),
    id: typeof value.id === "string" ? value.id : fallback.id,
    isVisible: typeof value.isVisible === "boolean" ? value.isVisible : fallback.isVisible,
    fill: undefined,
    fontFamily: undefined,
    fontId: undefined,
    fontSize: undefined,
    fontStyle: undefined,
    fontWeight: undefined,
    layerFilters,
    letterSpacing: undefined,
    lineHeight: undefined,
    name: typeof value.name === "string" && value.name.trim() ? value.name : fallback.name,
    nodeId,
    opacity: clamp(readFiniteNumber(value.opacity, fallback.opacity), 0, 1),
    outline: normalizeOutlineState(value.outline, fallback.outline ?? DEFAULT_OUTLINE),
    rotation: readFiniteNumber(value.rotation, fallback.rotation),
    scaleX: normalizeFlipScale(value.scaleX, fallback.scaleX ?? 1),
    scaleY: normalizeFlipScale(value.scaleY, fallback.scaleY ?? 1),
    shadow,
    shadows,
    text: undefined,
    textAlign: undefined,
    textRuns: undefined,
    tiltX: clampBackgroundShapeTilt(readFiniteNumber(value.tiltX, fallback.tiltX)),
    tiltY: clampBackgroundShapeTilt(readFiniteNumber(value.tiltY, fallback.tiltY)),
    underline: undefined,
    width: Math.max(1, width),
    x: readFiniteNumber(value.x, fallback.x),
    y: readFiniteNumber(value.y, fallback.y),
    zIndex: readFiniteNumber(value.zIndex, fallback.zIndex),
  };
}

export function normalizeLayerCornerRadiusFields(
  value: Record<string, unknown>,
  fallback: CanvasLayer,
  defaultRadius: number,
) {
  const legacyCornerRadius = clamp(
    readFiniteNumber(value.cornerRadius, fallback.cornerRadius ?? defaultRadius),
    0,
    512,
  );
  const cornerRadii = normalizeCornerRadiiState(
    value.cornerRadii,
    fallback.cornerRadii,
    legacyCornerRadius,
  );

  return {
    cornerRadius: cornerRadiiToLegacyRadius(cornerRadii),
    cornerRadii,
  };
}

export function normalizeCanvasLayerShadow(
  value: unknown,
  fallback: CanvasCardShadowState,
): CanvasCardShadowState {
  if (!isRecord(value)) {
    return normalizeCanvasCardShadow(fallback);
  }

  return normalizeCanvasCardShadow({
    ...fallback,
    blur: readFiniteNumber(value.blur, fallback.blur),
    color: typeof value.color === "string" ? value.color : fallback.color,
    inset: typeof value.inset === "boolean" ? value.inset : fallback.inset,
    kind: "drop",
    offsetX: readFiniteNumber(value.offsetX, fallback.offsetX),
    offsetY: readFiniteNumber(value.offsetY, fallback.offsetY),
    opacity: readFiniteNumber(value.opacity, fallback.opacity),
    spread: readFiniteNumber(value.spread, fallback.spread),
    visible: typeof value.visible === "boolean" ? value.visible : fallback.visible,
  });
}

function normalizeCanvasLayerShadows(
  value: unknown,
  primaryShadow: CanvasCardShadowState,
  fallback: CanvasShadowLayerState[],
): CanvasShadowLayerState[] {
  if (!Array.isArray(value) || value.length === 0) {
    if (fallback.length > 0) {
      return fallback.map((shadow) => ({ ...shadow }));
    }

    return [legacyShadowToShadowLayer(primaryShadow)];
  }

  return value.flatMap((entry, index) => {
    const shadow = normalizeShadowLayerState(
      entry,
      fallback[index] ?? legacyShadowToShadowLayer(primaryShadow),
    );

    return shadow.visible !== false || shadow.opacity > 0 ? [shadow] : [];
  });
}

function normalizeCanvasLayerFilters(
  value: unknown,
  fallback: CanvasFilterEffect[],
  legacyBlur: number,
): CanvasFilterEffect[] {
  const normalized = normalizeFilterEffects(value, fallback);

  if (Array.isArray(value)) {
    return syncBlurFilter(normalized, getBlurAmountFromFilters(normalized));
  }

  if (normalized.length > 0) {
    return normalized;
  }

  return legacyBlur > 0 ? syncBlurFilter([], legacyBlur) : [];
}

export function normalizeCanvasLayerBorderSides(
  value: unknown,
  fallback: CanvasPerSideBorderState | undefined,
): CanvasPerSideBorderState | undefined {
  if (value === undefined && fallback === undefined) {
    return undefined;
  }

  return normalizePerSideBorderState(value, fallback?.top);
}

export function rectanglesIntersect(
  a: { bottom: number; left: number; right: number; top: number },
  b: { bottom: number; left: number; right: number; top: number },
) {
  return a.left <= b.right && a.right >= b.left && a.top <= b.bottom && a.bottom >= b.top;
}

export function readFiniteNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function normalizeHexColor(value: unknown, fallback: string) {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function normalizeFlipScale(value: unknown, fallback: number) {
  const raw = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return raw < 0 ? -1 : 1;
}

export function normalizeImageSourceMode(
  value: unknown,
  fallback: CanvasImageSourceMode | undefined,
): CanvasImageSourceMode {
  if (value === "none" || value === "upload" || value === "url") {
    return value;
  }

  return fallback ?? DEFAULT_IMAGE_LAYER.imageSource;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Fold the legacy `fillMode`/`fillGradient`/`imageValue` triple (pre-Paint
 * serialized documents) into a Paint. Returns undefined for "solid"/unknown
 * modes so callers fall back to the plain `fill` field.
 */
export function legacyLayerFillPaint(value: Record<string, unknown>): Paint | undefined {
  if (value.fillMode === "gradient" && isRecord(value.fillGradient)) {
    return paintFromQraftyGradient(value.fillGradient as QraftyGradient);
  }
  if (value.fillMode === "image" && typeof value.imageValue === "string" && value.imageValue) {
    return imagePaint(value.imageValue);
  }
  if (value.fillMode === "none") {
    return nonePaint(
      typeof value.fill === "string" ? { kind: "solid", solid: value.fill } : undefined,
    );
  }
  return undefined;
}
