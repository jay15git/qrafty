import type {
  DraftingCardShadowState,
  DraftingCardState,
} from "@/features/canvas/model/card-state";
import {
  normalizeDraftingCardShadow,
  type DraftingCardPaperShaderState,
} from "@/features/canvas/model/card-state";
import {
  createDefaultDraftingShadowLayer,
  DEFAULT_DRAFTING_OUTLINE,
  type DraftingBorderStyle,
  type DraftingOutlineState,
  type DraftingPerSideBorderState,
  type DraftingShadowLayerState,
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
  type DraftingFilterEffect,
} from "@/features/canvas/model/filters";
import { DEFAULT_DRAFTING_FONT_ID } from "@/features/canvas/model/fonts";
import type { QrBackgroundShapeId } from "@/features/qr/styles/background-shapes";
import { clampBackgroundShapeTilt, type QraftyGradient } from "@/features/qr/model/state";
import {
  cornerRadiiToLegacyRadius,
  normalizeCornerRadiiState,
  type DraftingCornerRadiiState,
} from "@/features/canvas/model/corner-radius";
import type { DraftingIllustrationColorStop } from "@/features/canvas/assets/illustration-recolor";

export type DraftingCanvasLayerKind =
  "card" | "group" | "image" | "qr" | "shader" | "shape" | "text";
export type DraftingImageSourceMode = "none" | "upload" | "url";
export type DraftingImageFit = "contain" | "cover";
export type DraftingShapeFillMode = "gradient" | "image" | "none" | "solid";
export type DraftingShapePrimitiveId = "arrow" | "ellipse" | "line" | "rect";
export type DraftingElementShapeId =
  DraftingShapePrimitiveId | Exclude<QrBackgroundShapeId, "none">;
export type DraftingTextAlign = "center" | "left" | "right";
export type DraftingTextFontStyle = "italic" | "normal";
export type DraftingTextFontWeight = "bold" | "normal" | number;
export type DraftingTextRun = {
  fill?: string;
  fontFamily?: string;
  fontId?: string;
  fontSize?: number;
  fontStyle?: DraftingTextFontStyle;
  fontWeight?: DraftingTextFontWeight;
  text: string;
  underline?: boolean;
};

export type DraftingCanvasLayer = {
  blur: number;
  borderSides?: DraftingPerSideBorderState;
  height: number;
  id: string;
  isVisible: boolean;
  kind: DraftingCanvasLayerKind;
  cornerRadius?: number;
  cornerRadii?: DraftingCornerRadiiState;
  fill?: string;
  fillGradient?: QraftyGradient;
  fillMode?: DraftingShapeFillMode;
  fontFamily?: string;
  fontId?: string;
  fontSize?: number;
  fontStyle?: DraftingTextFontStyle;
  fontWeight?: DraftingTextFontWeight;
  imageFit?: DraftingImageFit;
  imageSource?: DraftingImageSourceMode;
  imageValue?: string;
  illustrationColorStops?: DraftingIllustrationColorStop[];
  layerFilters: DraftingFilterEffect[];
  letterSpacing?: number;
  lineHeight?: number;
  name: string;
  nodeId: string;
  opacity: number;
  outline: DraftingOutlineState;
  paperShader?: DraftingCardPaperShaderState;
  rotation: number;
  scaleX?: number;
  scaleY?: number;
  shapeId?: DraftingElementShapeId;
  stroke?: string;
  strokeOpacity?: number;
  strokeStyle?: DraftingBorderStyle;
  strokeWidth?: number;
  tiltX: number;
  tiltY: number;
  shadow: DraftingCardShadowState;
  shadows: DraftingShadowLayerState[];
  text?: string;
  textAlign?: DraftingTextAlign;
  textRuns?: DraftingTextRun[];
  underline?: boolean;
  width: number;
  x: number;
  y: number;
  zIndex: number;
  children?: DraftingCanvasLayer[];
};

export type DraftingLayerStateByNodeId = Record<string, DraftingCanvasLayer[]>;
export type DraftingLayerReorderAction = "back" | "backward" | "forward" | "front";
export type DraftingLayerAlignAction =
  "bottom" | "center-x" | "center-y" | "left" | "right" | "top";
export type DraftingLayerDistributeAction = "horizontal" | "vertical";

const DRAFTING_CARD_LAYER_SUFFIX = ":card";
const DRAFTING_QR_LAYER_SUFFIX = ":qr";

export const DEFAULT_DRAFTING_LAYER_SHADOW: DraftingCardShadowState = {
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
export const DEFAULT_DRAFTING_TEXT_LAYER = {
  fill: "#171717",
  fontFamily: "Satoshi",
  fontId: DEFAULT_DRAFTING_FONT_ID,
  fontSize: 32,
  fontStyle: "normal",
  fontWeight: "normal",
  letterSpacing: 0,
  lineHeight: 1.22,
  text: "Add text",
  textAlign: "left",
  underline: false,
} as const;

export const DEFAULT_DRAFTING_IMAGE_LAYER = {
  cornerRadius: 0,
  imageFit: "cover",
  imageSource: "none",
  imageValue: "",
} as const satisfies Partial<DraftingCanvasLayer>;

export const DEFAULT_DRAFTING_SHAPE_LAYER = {
  cornerRadius: 16,
  fill: "#E8E8E8",
  fillMode: "solid",
  shapeId: "rounded-square",
  stroke: "#171717",
  strokeOpacity: 100,
  strokeStyle: "solid",
  strokeWidth: 0,
} as const satisfies Partial<DraftingCanvasLayer>;

export const DEFAULT_DRAFTING_SHADER_LAYER = {
  cornerRadius: 0,
} as const satisfies Partial<DraftingCanvasLayer>;

export function getDraftingCardLayerId(nodeId: string) {
  return `${nodeId}${DRAFTING_CARD_LAYER_SUFFIX}`;
}

export function getDraftingQrLayerId(nodeId: string) {
  return `${nodeId}${DRAFTING_QR_LAYER_SUFFIX}`;
}

export function createAdditionalDraftingQrLayerId(nodeId: string) {
  return `${nodeId}${DRAFTING_QR_LAYER_SUFFIX}:${crypto.randomUUID()}`;
}

export function isDraftingCardLayerId(layerId: string | null | undefined) {
  return Boolean(layerId?.endsWith(DRAFTING_CARD_LAYER_SUFFIX));
}

export function isDraftingQrLayerId(layerId: string | null | undefined) {
  if (!layerId) {
    return false;
  }

  return /:qr(?::|$)/.test(layerId);
}

function isQrCanvasLayer(
  layer: Pick<DraftingCanvasLayer, "kind">,
): layer is DraftingCanvasLayer & { kind: "qr" } {
  return layer.kind === "qr";
}

export function getQrCanvasLayers(layers: DraftingCanvasLayer[]) {
  return layers.filter(isQrCanvasLayer);
}

function canDeleteQrLayer(layerId: string, layers: DraftingCanvasLayer[]) {
  if (!isDraftingQrLayerId(layerId)) {
    return false;
  }

  return getQrCanvasLayers(layers).length > 1;
}

export function isLayerDeletable(layerId: string, layers: DraftingCanvasLayer[]) {
  if (isDraftingCardLayerId(layerId)) {
    return false;
  }

  if (isDraftingQrLayerId(layerId)) {
    return canDeleteQrLayer(layerId, layers);
  }

  return true;
}

export function isProtectedDraftingLayerId(
  layerId: string | null | undefined,
  layers?: DraftingCanvasLayer[],
) {
  if (isDraftingCardLayerId(layerId)) {
    return true;
  }

  if (layerId && isDraftingQrLayerId(layerId) && layers) {
    return !canDeleteQrLayer(layerId, layers);
  }

  return false;
}

export type NormalizeDraftingLayerContext = {
  fallback: DraftingCanvasLayer;
  fallbackLayers: DraftingCanvasLayer[];
  height: number;
  kind: DraftingCanvasLayerKind;
  nodeId: string;
  value: Record<string, unknown>;
  width: number;
};

export function normalizeSharedDraftingCanvasLayerFields({
  fallback,
  height,
  nodeId,
  value,
  width,
}: NormalizeDraftingLayerContext): Omit<DraftingCanvasLayer, "kind"> {
  const legacyBlur = clamp(readFiniteNumber(value.blur, fallback.blur), 0, 96);
  const layerFilters = normalizeDraftingLayerFilters(
    value.layerFilters,
    fallback.layerFilters ?? [],
    legacyBlur,
  );
  const shadow = normalizeDraftingLayerShadow(value.shadow, fallback.shadow);
  const shadows = normalizeDraftingLayerShadows(
    value.shadows,
    shadow,
    fallback.shadows ?? [legacyShadowToShadowLayer(shadow)],
  );

  return {
    blur: syncLegacyBlurFromFilters(layerFilters),
    borderSides: normalizeDraftingLayerBorderSides(value.borderSides, fallback.borderSides),
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
    outline: normalizeOutlineState(value.outline, fallback.outline ?? DEFAULT_DRAFTING_OUTLINE),
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
  fallback: DraftingCanvasLayer,
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

export function normalizeDraftingLayerShadow(
  value: unknown,
  fallback: DraftingCardShadowState,
): DraftingCardShadowState {
  if (!isRecord(value)) {
    return normalizeDraftingCardShadow(fallback);
  }

  return normalizeDraftingCardShadow({
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

function normalizeDraftingLayerShadows(
  value: unknown,
  primaryShadow: DraftingCardShadowState,
  fallback: DraftingShadowLayerState[],
): DraftingShadowLayerState[] {
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

function normalizeDraftingLayerFilters(
  value: unknown,
  fallback: DraftingFilterEffect[],
  legacyBlur: number,
): DraftingFilterEffect[] {
  const normalized = normalizeFilterEffects(value, fallback);

  if (Array.isArray(value)) {
    return syncBlurFilter(normalized, getBlurAmountFromFilters(normalized));
  }

  if (normalized.length > 0) {
    return normalized;
  }

  return legacyBlur > 0 ? syncBlurFilter([], legacyBlur) : [];
}

export function normalizeDraftingLayerBorderSides(
  value: unknown,
  fallback: DraftingPerSideBorderState | undefined,
): DraftingPerSideBorderState | undefined {
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
  fallback: DraftingImageSourceMode | undefined,
): DraftingImageSourceMode {
  if (value === "none" || value === "upload" || value === "url") {
    return value;
  }

  return fallback ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageSource;
}

export function normalizeShapeFillGradient(
  value: unknown,
  fallback: QraftyGradient | undefined,
): QraftyGradient | undefined {
  if (!isRecord(value)) {
    return fallback;
  }

  const colorStops = Array.isArray(value.colorStops) ? value.colorStops : null;
  if (!colorStops || colorStops.length < 2) {
    return fallback;
  }

  const firstStop = colorStops[0];
  const secondStop = colorStops[1];

  if (!isRecord(firstStop) || !isRecord(secondStop)) {
    return fallback;
  }

  return {
    colorStops: [
      {
        color: typeof firstStop.color === "string" ? firstStop.color : "#111111",
        offset: clamp(readFiniteNumber(firstStop.offset, 0), 0, 1),
      },
      {
        color: typeof secondStop.color === "string" ? secondStop.color : "#ffffff",
        offset: clamp(readFiniteNumber(secondStop.offset, 1), 0, 1),
      },
    ],
    center:
      isRecord(value.center) &&
      typeof value.center.x === "number" &&
      typeof value.center.y === "number"
        ? {
            x: clamp(value.center.x, 0, 1),
            y: clamp(value.center.y, 0, 1),
          }
        : fallback?.center,
    enabled: typeof value.enabled === "boolean" ? value.enabled : true,
    rotation: readFiniteNumber(value.rotation, 0),
    type: value.type === "radial" ? "radial" : "linear",
  };
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
