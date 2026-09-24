export type CanvasFilterType =
  | "blur"
  | "brightness"
  | "contrast"
  | "grayscale"
  | "hue-rotate"
  | "invert"
  | "saturation"
  | "sepia";

export type CanvasFilterEffect = {
  amount: number;
  enabled: boolean;
  id: string;
  type: CanvasFilterType;
};

const DRAFTING_LAYER_FILTER_TYPES: CanvasFilterType[] = [
  "blur",
  "brightness",
  "contrast",
  "grayscale",
  "hue-rotate",
  "invert",
  "saturation",
  "sepia",
];

const DRAFTING_FILTER_DEFAULTS: Record<CanvasFilterType, number> = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  "hue-rotate": 0,
  invert: 0,
  saturation: 100,
  sepia: 0,
};

export const DRAFTING_FILTER_VISIBLE_DEFAULTS: Record<CanvasFilterType, number> = {
  blur: 12,
  brightness: 120,
  contrast: 120,
  grayscale: 50,
  "hue-rotate": 45,
  invert: 100,
  saturation: 150,
  sepia: 50,
};

export const DRAFTING_FILTER_RANGES: Record<
  CanvasFilterType,
  { defaultValue: number; max: number; min: number; unit?: string }
> = {
  blur: { defaultValue: 0, max: 96, min: 0, unit: "px" },
  brightness: { defaultValue: 100, max: 200, min: 0, unit: "%" },
  contrast: { defaultValue: 100, max: 200, min: 0, unit: "%" },
  grayscale: { defaultValue: 0, max: 100, min: 0, unit: "%" },
  "hue-rotate": { defaultValue: 0, max: 360, min: 0, unit: "deg" },
  invert: { defaultValue: 0, max: 100, min: 0, unit: "%" },
  saturation: { defaultValue: 100, max: 200, min: 0, unit: "%" },
  sepia: { defaultValue: 0, max: 100, min: 0, unit: "%" },
};

function createCanvasFilterId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `filter-${Math.random().toString(36).slice(2)}`;
}

export function createDefaultCanvasFilterEffect(
  type: CanvasFilterType,
  overrides: Partial<CanvasFilterEffect> = {},
): CanvasFilterEffect {
  return {
    amount: DRAFTING_FILTER_DEFAULTS[type],
    enabled: true,
    id: createCanvasFilterId(),
    type,
    ...overrides,
  };
}

function normalizeFilterType(value: unknown): CanvasFilterType | null {
  return typeof value === "string" && (DRAFTING_LAYER_FILTER_TYPES as string[]).includes(value)
    ? (value as CanvasFilterType)
    : null;
}

function normalizeFilterEffect(
  value: unknown,
  fallback?: CanvasFilterEffect,
): CanvasFilterEffect | null {
  if (typeof value !== "object" || value === null) {
    return fallback ? { ...fallback } : null;
  }

  const record = value as Record<string, unknown>;
  const type = normalizeFilterType(record.type) ?? fallback?.type;

  if (!type) {
    return fallback ? { ...fallback } : null;
  }

  const range = DRAFTING_FILTER_RANGES[type];

  return {
    amount:
      typeof record.amount === "number" && Number.isFinite(record.amount)
        ? Math.min(range.max, Math.max(range.min, record.amount))
        : (fallback?.amount ?? range.defaultValue),
    enabled: typeof record.enabled === "boolean" ? record.enabled : (fallback?.enabled ?? true),
    id: typeof record.id === "string" ? record.id : (fallback?.id ?? createCanvasFilterId()),
    type,
  };
}

export function normalizeFilterEffects(
  value: unknown,
  fallback: CanvasFilterEffect[] = [],
): CanvasFilterEffect[] {
  if (!Array.isArray(value)) {
    return fallback.map((effect) => ({ ...effect }));
  }

  return value
    .map((entry, index) => normalizeFilterEffect(entry, fallback[index]))
    .filter((effect): effect is CanvasFilterEffect => Boolean(effect));
}

export function getBlurAmountFromFilters(filters: CanvasFilterEffect[]) {
  return filters.find((filter) => filter.type === "blur" && filter.enabled)?.amount ?? 0;
}

export function syncBlurFilter(filters: CanvasFilterEffect[], blur: number): CanvasFilterEffect[] {
  const next = filters.filter((filter) => filter.type !== "blur");

  if (blur > 0) {
    next.unshift(
      createDefaultCanvasFilterEffect("blur", {
        amount: blur,
        id: filters.find((filter) => filter.type === "blur")?.id,
      }),
    );
  }

  return next;
}

export function syncLegacyBlurFromFilters(filters: CanvasFilterEffect[]) {
  return getBlurAmountFromFilters(filters);
}
