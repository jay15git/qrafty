export type CanvasBorderStyle = "solid";

export type CanvasBorderSideKey = "top" | "right" | "bottom" | "left";

export type CanvasBorderSideValue = {
  color: string;
  opacity: number;
  style: CanvasBorderStyle;
  width: number;
};

export type CanvasPerSideBorderState = Record<CanvasBorderSideKey, CanvasBorderSideValue>;

export type CanvasOutlineState = {
  color: string;
  offset: number;
  opacity: number;
  style: CanvasBorderStyle;
  visible: boolean;
  width: number;
};

export type CanvasShadowKind = "box" | "drop";

export type CanvasShadowLayerState = {
  blur: number;
  color: string;
  id: string;
  inset: boolean;
  kind: CanvasShadowKind;
  offsetX: number;
  offsetY: number;
  opacity: number;
  spread: number;
  visible: boolean;
};

const DEFAULT_DRAFTING_BORDER_SIDE: CanvasBorderSideValue = {
  color: "#111827",
  opacity: 100,
  style: "solid",
  width: 0,
};

export const DEFAULT_DRAFTING_OUTLINE: CanvasOutlineState = {
  color: "#111827",
  offset: 0,
  opacity: 100,
  style: "solid",
  visible: false,
  width: 0,
};

const DEFAULT_DRAFTING_SHADOW_LAYER: Omit<CanvasShadowLayerState, "id"> = {
  blur: 0,
  color: "#111827",
  inset: false,
  kind: "drop",
  offsetX: 0,
  offsetY: 0,
  opacity: 0,
  spread: 0,
  visible: true,
};

function createCanvasShadowLayerId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `shadow-${Math.random().toString(36).slice(2)}`;
}

export function createDefaultCanvasShadowLayer(
  overrides: Partial<CanvasShadowLayerState> = {},
): CanvasShadowLayerState {
  return {
    ...DEFAULT_DRAFTING_SHADOW_LAYER,
    id: createCanvasShadowLayerId(),
    ...overrides,
  };
}

export function createUniformPerSideBorder(
  value: Partial<CanvasBorderSideValue> = {},
): CanvasPerSideBorderState {
  const side: CanvasBorderSideValue = {
    ...DEFAULT_DRAFTING_BORDER_SIDE,
    ...value,
  };

  return {
    bottom: { ...side },
    left: { ...side },
    right: { ...side },
    top: { ...side },
  };
}

export function normalizeBorderStyle(
  value: unknown,
  fallback: CanvasBorderStyle,
): CanvasBorderStyle {
  return value === "solid" ? value : fallback;
}

function normalizeShadowKind(_value: unknown, _fallback: CanvasShadowKind): CanvasShadowKind {
  return "drop";
}

export function normalizeOutlineState(
  value: unknown,
  fallback: CanvasOutlineState = DEFAULT_DRAFTING_OUTLINE,
): CanvasOutlineState {
  if (typeof value !== "object" || value === null) {
    return { ...fallback };
  }

  const record = value as Record<string, unknown>;

  return {
    color: typeof record.color === "string" ? record.color : fallback.color,
    offset: clampNumber(record.offset, fallback.offset, -128, 128),
    opacity: clampNumber(record.opacity, fallback.opacity, 0, 100),
    style: normalizeBorderStyle(record.style, fallback.style),
    visible: typeof record.visible === "boolean" ? record.visible : fallback.visible,
    width: clampNumber(record.width, fallback.width, 0, 64),
  };
}

function normalizeBorderSideValue(
  value: unknown,
  fallback: CanvasBorderSideValue,
): CanvasBorderSideValue {
  if (typeof value !== "object" || value === null) {
    return { ...fallback };
  }

  const record = value as Record<string, unknown>;

  return {
    color: typeof record.color === "string" ? record.color : fallback.color,
    opacity: clampNumber(record.opacity, fallback.opacity, 0, 100),
    style: normalizeBorderStyle(record.style, fallback.style),
    width: clampNumber(record.width, fallback.width, 0, 64),
  };
}

export function normalizePerSideBorderState(
  value: unknown,
  uniform: Partial<CanvasBorderSideValue> = {},
): CanvasPerSideBorderState {
  const base = createUniformPerSideBorder(uniform);

  if (typeof value !== "object" || value === null) {
    return base;
  }

  const record = value as Record<string, unknown>;

  return {
    bottom: normalizeBorderSideValue(record.bottom, base.bottom),
    left: normalizeBorderSideValue(record.left, base.left),
    right: normalizeBorderSideValue(record.right, base.right),
    top: normalizeBorderSideValue(record.top, base.top),
  };
}

export function normalizeShadowLayerState(
  value: unknown,
  fallback: CanvasShadowLayerState,
): CanvasShadowLayerState {
  if (typeof value !== "object" || value === null) {
    return { ...fallback };
  }

  const record = value as Record<string, unknown>;

  return {
    blur: clampNumber(record.blur, fallback.blur, 0, 128),
    color: typeof record.color === "string" ? record.color : fallback.color,
    id: typeof record.id === "string" ? record.id : fallback.id,
    inset: typeof record.inset === "boolean" ? record.inset : fallback.inset,
    kind: normalizeShadowKind(record.kind, fallback.kind),
    offsetX: clampNumber(record.offsetX, fallback.offsetX, -256, 256),
    offsetY: clampNumber(record.offsetY, fallback.offsetY, -256, 256),
    opacity: clampNumber(record.opacity, fallback.opacity, 0, 100),
    spread: clampNumber(record.spread, fallback.spread, -128, 128),
    visible: typeof record.visible === "boolean" ? record.visible : fallback.visible,
  };
}

export function shadowLayerToLegacyShadow(shadow: CanvasShadowLayerState) {
  return {
    blur: shadow.blur,
    color: shadow.color,
    inset: shadow.inset,
    kind: shadow.kind,
    offsetX: shadow.offsetX,
    offsetY: shadow.offsetY,
    opacity: shadow.opacity,
    spread: shadow.spread,
    visible: shadow.visible,
  };
}

export function hasLegacyBackgroundShapeShadow(options: {
  edgeBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
}) {
  return (
    options.shadowOpacity > 0 &&
    (options.edgeBlur > 0 || options.shadowOffsetX !== 0 || options.shadowOffsetY !== 0)
  );
}

export function shadowFromBackgroundShapeOptions(options: {
  edgeBlur: number;
  shadowColor: string;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
}) {
  const visible = hasLegacyBackgroundShapeShadow(options);

  return {
    blur: options.edgeBlur,
    color: options.shadowColor,
    inset: false,
    kind: "drop" as const,
    offsetX: options.shadowOffsetX,
    offsetY: options.shadowOffsetY,
    opacity: options.shadowOpacity,
    spread: 0,
    visible,
  };
}

export function legacyShadowToShadowLayer(
  shadow: {
    blur: number;
    color: string;
    inset?: boolean;
    kind?: CanvasShadowKind;
    offsetX: number;
    offsetY: number;
    opacity: number;
    spread?: number;
    visible?: boolean;
  },
  id?: string,
): CanvasShadowLayerState {
  return {
    blur: shadow.blur,
    color: shadow.color,
    id: id ?? createCanvasShadowLayerId(),
    inset: shadow.inset ?? false,
    kind: "drop",
    offsetX: shadow.offsetX,
    offsetY: shadow.offsetY,
    opacity: shadow.opacity,
    spread: shadow.spread ?? 0,
    visible: shadow.visible ?? shadow.opacity > 0,
  };
}

function clampNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return Math.min(max, Math.max(min, parsed));
}
