export type DraftingCornerRadiusKey = "topLeft" | "topRight" | "bottomRight" | "bottomLeft"

export type DraftingCornerRadiiState = {
  bottomLeft: number
  bottomRight: number
  linked: boolean
  topLeft: number
  topRight: number
}

export const DRAFTING_CORNER_RADIUS_KEYS: DraftingCornerRadiusKey[] = [
  "topLeft",
  "topRight",
  "bottomRight",
  "bottomLeft",
]

export const DRAFTING_CORNER_RADIUS_MAX = 512

const DEFAULT_DRAFTING_CORNER_RADII: DraftingCornerRadiiState = {
  bottomLeft: 0,
  bottomRight: 0,
  linked: true,
  topLeft: 0,
  topRight: 0,
}

function clampCornerRadiusValue(value: unknown, fallback: number) {
  const parsed = typeof value === "number" && Number.isFinite(value) ? value : fallback
  return Math.min(DRAFTING_CORNER_RADIUS_MAX, Math.max(0, Math.round(parsed)))
}

export function createUniformCornerRadii(
  radius: number,
  overrides: Partial<DraftingCornerRadiiState> = {},
): DraftingCornerRadiiState {
  const value = clampCornerRadiusValue(radius, 0)

  return {
    bottomLeft: value,
    bottomRight: value,
    linked: true,
    topLeft: value,
    topRight: value,
    ...overrides,
  }
}

export function normalizeCornerRadiiState(
  value: unknown,
  fallback: DraftingCornerRadiiState = DEFAULT_DRAFTING_CORNER_RADII,
  legacyCornerRadius?: number,
): DraftingCornerRadiiState {
  if (typeof value !== "object" || value === null) {
    if (legacyCornerRadius !== undefined) {
      return createUniformCornerRadii(legacyCornerRadius, { linked: fallback.linked })
    }

    return { ...fallback }
  }

  const record = value as Record<string, unknown>
  const base =
    legacyCornerRadius !== undefined
      ? createUniformCornerRadii(legacyCornerRadius)
      : { ...fallback }

  return {
    bottomLeft: clampCornerRadiusValue(record.bottomLeft, base.bottomLeft),
    bottomRight: clampCornerRadiusValue(record.bottomRight, base.bottomRight),
    linked: typeof record.linked === "boolean" ? record.linked : base.linked,
    topLeft: clampCornerRadiusValue(record.topLeft, base.topLeft),
    topRight: clampCornerRadiusValue(record.topRight, base.topRight),
  }
}

export function resolveCornerRadii(
  cornerRadii: DraftingCornerRadiiState | undefined,
  legacyCornerRadius: number | undefined,
  fallback = 0,
): DraftingCornerRadiiState {
  if (cornerRadii) {
    return normalizeCornerRadiiState(cornerRadii)
  }

  return createUniformCornerRadii(legacyCornerRadius ?? fallback)
}

export function cornerRadiiToLegacyRadius(radii: DraftingCornerRadiiState) {
  if (radii.linked) {
    return radii.topLeft
  }

  return Math.max(radii.topLeft, radii.topRight, radii.bottomRight, radii.bottomLeft)
}

function cornerRadiiAreUniform(radii: DraftingCornerRadiiState) {
  return (
    radii.topLeft === radii.topRight &&
    radii.topRight === radii.bottomRight &&
    radii.bottomRight === radii.bottomLeft
  )
}

export function cornerRadiiToCss(radii: DraftingCornerRadiiState) {
  return `${radii.topLeft}px ${radii.topRight}px ${radii.bottomRight}px ${radii.bottomLeft}px`
}

function cornerRadiiToStyle(radii: DraftingCornerRadiiState) {
  return { borderRadius: cornerRadiiToCss(radii) }
}

function clampCornerForRect(radius: number, width: number, height: number) {
  return Math.max(0, Math.min(radius, width / 2, height / 2))
}

export function buildRoundedRectPath(
  width: number,
  height: number,
  radii: Pick<DraftingCornerRadiiState, DraftingCornerRadiusKey>,
  originX = 0,
  originY = 0,
) {
  const w = Math.max(0, width)
  const h = Math.max(0, height)

  if (w === 0 || h === 0) {
    return `M ${originX} ${originY} Z`
  }

  const tl = clampCornerForRect(radii.topLeft, w, h)
  const tr = clampCornerForRect(radii.topRight, w, h)
  const br = clampCornerForRect(radii.bottomRight, w, h)
  const bl = clampCornerForRect(radii.bottomLeft, w, h)
  const x = originX
  const y = originY
  const right = x + w
  const bottom = y + h

  return [
    `M ${x + tl} ${y}`,
    `H ${right - tr}`,
    tr > 0 ? `A ${tr} ${tr} 0 0 1 ${right} ${y + tr}` : `L ${right} ${y}`,
    `V ${bottom - br}`,
    br > 0 ? `A ${br} ${br} 0 0 1 ${right - br} ${bottom}` : `L ${right} ${bottom}`,
    `H ${x + bl}`,
    bl > 0 ? `A ${bl} ${bl} 0 0 1 ${x} ${bottom - bl}` : `L ${x} ${bottom}`,
    `V ${y + tl}`,
    tl > 0 ? `A ${tl} ${tl} 0 0 1 ${x + tl} ${y}` : `L ${x} ${y}`,
    "Z",
  ].join(" ")
}

export function patchCornerRadii(
  current: DraftingCornerRadiiState | undefined,
  legacyCornerRadius: number | undefined,
  corner: DraftingCornerRadiusKey,
  value: number,
): DraftingCornerRadiiState {
  const base = resolveCornerRadii(current, legacyCornerRadius)
  const nextValue = clampCornerRadiusValue(value, base[corner])

  if (base.linked) {
    return createUniformCornerRadii(nextValue, { linked: true })
  }

  return {
    ...base,
    [corner]: nextValue,
    linked: false,
  }
}

export function setCornerRadiiLinked(
  current: DraftingCornerRadiiState | undefined,
  legacyCornerRadius: number | undefined,
  linked: boolean,
): DraftingCornerRadiiState {
  const base = resolveCornerRadii(current, legacyCornerRadius)

  if (!linked) {
    return { ...base, linked: false }
  }

  const uniform = cornerRadiiToLegacyRadius(base)
  return createUniformCornerRadii(uniform, { linked: true })
}

export function syncCornerRadiusFields(
  cornerRadius: number | undefined,
  cornerRadii: DraftingCornerRadiiState | undefined,
): {
  cornerRadius: number
  cornerRadii: DraftingCornerRadiiState
} {
  const resolved = resolveCornerRadii(cornerRadii, cornerRadius)
  return {
    cornerRadius: cornerRadiiToLegacyRadius(resolved),
    cornerRadii: resolved,
  }
}

export function resolveLayerCornerRadii(
  layer: {
    cornerRadius?: number
    cornerRadii?: DraftingCornerRadiiState
  },
  fallback = 0,
) {
  return resolveCornerRadii(layer.cornerRadii, layer.cornerRadius, fallback)
}

export function layerSupportsCornerRadius(layer: {
  cornerRadius?: number
  kind: string
  shapeId?: string
}) {
  if (layer.kind === "card" || layer.kind === "image" || layer.kind === "shader") {
    return true
  }

  if (layer.kind === "shape") {
    return (layer.shapeId ?? "rounded-square") === "rect"
  }

  return false
}

export function scaleCornerRadiiToBounds(
  radii: DraftingCornerRadiiState,
  fromWidth: number,
  fromHeight: number,
  toWidth: number,
  toHeight: number,
): DraftingCornerRadiiState {
  const scale = Math.min(toWidth / Math.max(fromWidth, 1), toHeight / Math.max(fromHeight, 1))

  return {
    ...radii,
    bottomLeft: radii.bottomLeft * scale,
    bottomRight: radii.bottomRight * scale,
    topLeft: radii.topLeft * scale,
    topRight: radii.topRight * scale,
  }
}

export function buildCornerRadiusLayerPatch(
  layer: {
    cornerRadius?: number
    cornerRadii?: DraftingCornerRadiiState
  },
  patch: {
    cornerRadius?: number
    cornerRadii?: DraftingCornerRadiiState
  },
): {
  cornerRadius?: number
  cornerRadii?: DraftingCornerRadiiState
} {
  if (patch.cornerRadii !== undefined) {
    const synced = syncCornerRadiusFields(patch.cornerRadius ?? layer.cornerRadius, patch.cornerRadii)
    return synced
  }

  if (patch.cornerRadius !== undefined) {
    return syncCornerRadiusFields(patch.cornerRadius, createUniformCornerRadii(patch.cornerRadius))
  }

  return {}
}
