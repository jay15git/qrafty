export type DraftingFilterType =
  | "blur"
  | "brightness"
  | "contrast"
  | "grayscale"
  | "hue-rotate"
  | "invert"
  | "saturation"
  | "sepia"

export type DraftingFilterEffect = {
  amount: number
  enabled: boolean
  id: string
  type: DraftingFilterType
}

export const DRAFTING_LAYER_FILTER_TYPES: DraftingFilterType[] = [
  "blur",
  "brightness",
  "contrast",
  "grayscale",
  "hue-rotate",
  "invert",
  "saturation",
  "sepia",
]

const DRAFTING_FILTER_DEFAULTS: Record<DraftingFilterType, number> = {
  blur: 0,
  brightness: 100,
  contrast: 100,
  grayscale: 0,
  "hue-rotate": 0,
  invert: 0,
  saturation: 100,
  sepia: 0,
}

export const DRAFTING_FILTER_VISIBLE_DEFAULTS: Record<DraftingFilterType, number> = {
  blur: 12,
  brightness: 120,
  contrast: 120,
  grayscale: 50,
  "hue-rotate": 45,
  invert: 100,
  saturation: 150,
  sepia: 50,
}

const DRAFTING_FILTER_LABELS: Record<DraftingFilterType, string> = {
  blur: "Blur",
  brightness: "Brightness",
  contrast: "Contrast",
  grayscale: "Grayscale",
  "hue-rotate": "Hue rotate",
  invert: "Invert",
  saturation: "Saturation",
  sepia: "Sepia",
}

export function getDraftingFilterLabel(type: DraftingFilterType) {
  return DRAFTING_FILTER_LABELS[type]
}

export const DRAFTING_FILTER_RANGES: Record<
  DraftingFilterType,
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
}

function createDraftingFilterId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `filter-${Math.random().toString(36).slice(2)}`
}

export function createDefaultDraftingFilterEffect(
  type: DraftingFilterType,
  overrides: Partial<DraftingFilterEffect> = {},
): DraftingFilterEffect {
  return {
    amount: DRAFTING_FILTER_DEFAULTS[type],
    enabled: true,
    id: createDraftingFilterId(),
    type,
    ...overrides,
  }
}

function normalizeFilterType(value: unknown): DraftingFilterType | null {
  return typeof value === "string" &&
    (DRAFTING_LAYER_FILTER_TYPES as string[]).includes(value)
    ? (value as DraftingFilterType)
    : null
}

function normalizeFilterEffect(
  value: unknown,
  fallback?: DraftingFilterEffect,
): DraftingFilterEffect | null {
  if (typeof value !== "object" || value === null) {
    return fallback ? { ...fallback } : null
  }

  const record = value as Record<string, unknown>
  const type = normalizeFilterType(record.type) ?? fallback?.type

  if (!type) {
    return fallback ? { ...fallback } : null
  }

  const range = DRAFTING_FILTER_RANGES[type]

  return {
    amount:
      typeof record.amount === "number" && Number.isFinite(record.amount)
        ? Math.min(range.max, Math.max(range.min, record.amount))
        : (fallback?.amount ?? range.defaultValue),
    enabled: typeof record.enabled === "boolean" ? record.enabled : (fallback?.enabled ?? true),
    id: typeof record.id === "string" ? record.id : (fallback?.id ?? createDraftingFilterId()),
    type,
  }
}

export function normalizeFilterEffects(
  value: unknown,
  fallback: DraftingFilterEffect[] = [],
): DraftingFilterEffect[] {
  if (!Array.isArray(value)) {
    return fallback.map((effect) => ({ ...effect }))
  }

  return value
    .map((entry, index) => normalizeFilterEffect(entry, fallback[index]))
    .filter((effect): effect is DraftingFilterEffect => Boolean(effect))
}

export function getBlurAmountFromFilters(filters: DraftingFilterEffect[]) {
  return filters.find((filter) => filter.type === "blur" && filter.enabled)?.amount ?? 0
}

export function syncBlurFilter(
  filters: DraftingFilterEffect[],
  blur: number,
): DraftingFilterEffect[] {
  const next = filters.filter((filter) => filter.type !== "blur")

  if (blur > 0) {
    next.unshift(
      createDefaultDraftingFilterEffect("blur", {
        amount: blur,
        id: filters.find((filter) => filter.type === "blur")?.id,
      }),
    )
  }

  return next
}

export function syncLegacyBlurFromFilters(filters: DraftingFilterEffect[]) {
  return getBlurAmountFromFilters(filters)
}

export function isDraftingFilterActive(filters: DraftingFilterEffect[], type: DraftingFilterType) {
  return filters.some((filter) => filter.type === type && filter.enabled)
}

export function toggleDraftingFilter(
  filters: DraftingFilterEffect[],
  type: DraftingFilterType,
): DraftingFilterEffect[] {
  const existing = filters.find((filter) => filter.type === type)

  if (existing) {
    return filters.filter((filter) => filter.type !== type)
  }

  return [
    ...filters,
    createDefaultDraftingFilterEffect(type, {
      amount: DRAFTING_FILTER_VISIBLE_DEFAULTS[type],
    }),
  ]
}
