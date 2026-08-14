import type { DraftingCardShadowState } from "@/features/workspace/model/card-state"
import type {
  DraftingBorderSideKey,
  DraftingBorderStyle,
  DraftingOutlineState,
  DraftingPerSideBorderState,
  DraftingShadowLayerState,
} from "@/features/workspace/model/effects"
import type { DraftingFilterEffect } from "@/features/workspace/model/filters"

function toRgba(color: string, opacity: number) {
  const normalizedOpacity = Math.min(1, Math.max(0, Number.isFinite(opacity) ? opacity : 1))
  const hex = color.trim().replace(/^#/, "")

  if (/^[\da-f]{3}$/i.test(hex)) {
    const [r, g, b] = hex.split("").map((channel) => Number.parseInt(channel + channel, 16))
    return `rgba(${r}, ${g}, ${b}, ${normalizedOpacity})`
  }

  if (/^[\da-f]{6}$/i.test(hex)) {
    const r = Number.parseInt(hex.slice(0, 2), 16)
    const g = Number.parseInt(hex.slice(2, 4), 16)
    const b = Number.parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${normalizedOpacity})`
  }

  return color
}

export function getStrokeDasharray(style: DraftingBorderStyle | undefined) {
  switch (style) {
    case "dashed":
      return "8 4"
    case "dotted":
      return "2 2"
    case "solid":
    default:
      return undefined
  }
}

function getDraftingShadowLayerCss(shadow: DraftingShadowLayerState | DraftingCardShadowState) {
  if (
    shadow.visible === false ||
    shadow.opacity <= 0 ||
    (shadow.blur <= 0 && shadow.offsetX === 0 && shadow.offsetY === 0 && (shadow.spread ?? 0) === 0)
  ) {
    return null
  }

  const color = toRgba(shadow.color, shadow.opacity / 100)
  return `drop-shadow(${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${color})`
}

function getDraftingShadowBoxShadowCss(
  shadow: DraftingShadowLayerState | DraftingCardShadowState,
) {
  if (
    shadow.visible === false ||
    shadow.opacity <= 0 ||
    (shadow.blur <= 0 &&
      shadow.offsetX === 0 &&
      shadow.offsetY === 0 &&
      (shadow.spread ?? 0) === 0)
  ) {
    return null
  }

  const color = toRgba(shadow.color, shadow.opacity / 100)
  const inset = shadow.inset ? "inset " : ""
  return `${inset}${shadow.offsetX}px ${shadow.offsetY}px ${shadow.blur}px ${shadow.spread ?? 0}px ${color}`
}

export function getDraftingLayerBoxShadowStyle(
  shadows: Array<DraftingCardShadowState | DraftingShadowLayerState>,
) {
  const boxShadows = shadows
    .map((shadow) => getDraftingShadowBoxShadowCss(shadow))
    .filter((value): value is string => Boolean(value))

  return boxShadows.length > 0 ? boxShadows.join(", ") : undefined
}

export function getDraftingLayerDropShadowFilter(
  shadows: Array<DraftingCardShadowState | DraftingShadowLayerState>,
) {
  const dropShadows = shadows
    .map((shadow) => getDraftingShadowLayerCss(shadow))
    .filter((value): value is string => Boolean(value))

  return dropShadows.length > 0 ? dropShadows.join(" ") : undefined
}

export function buildCssFilterString(filters: DraftingFilterEffect[]) {
  const parts = filters
    .filter((filter) => filter.enabled)
    .map((filter) => {
      switch (filter.type) {
        case "blur":
          return filter.amount > 0 ? `blur(${filter.amount}px)` : null
        case "brightness":
          return filter.amount !== 100 ? `brightness(${filter.amount / 100})` : null
        case "contrast":
          return filter.amount !== 100 ? `contrast(${filter.amount / 100})` : null
        case "grayscale":
          return filter.amount > 0 ? `grayscale(${filter.amount / 100})` : null
        case "hue-rotate":
          return filter.amount !== 0 ? `hue-rotate(${filter.amount}deg)` : null
        case "invert":
          return filter.amount > 0 ? `invert(${filter.amount / 100})` : null
        case "saturation":
          return filter.amount !== 100 ? `saturate(${filter.amount / 100})` : null
        case "sepia":
          return filter.amount > 0 ? `sepia(${filter.amount / 100})` : null
        default:
          return null
      }
    })
    .filter((value): value is string => Boolean(value))

  return parts.length > 0 ? parts.join(" ") : undefined
}

export function mergeCssFilterStrings(...values: Array<string | undefined>) {
  const parts = values.filter((value): value is string => Boolean(value && value.trim()))
  return parts.length > 0 ? parts.join(" ") : undefined
}

export function getDraftingOutlineStyle(outline: DraftingOutlineState | undefined) {
  if (!outline || !outline.visible || outline.width <= 0 || outline.opacity <= 0) {
    return {}
  }

  return {
    outline: `${outline.width}px ${outline.style} ${toRgba(outline.color, outline.opacity / 100)}`,
    outlineOffset: `${outline.offset}px`,
  }
}

export function getDraftingPerSideBorderStyle(sides: DraftingPerSideBorderState) {
  const style: Record<string, string> = {}
  const sideKeys: DraftingBorderSideKey[] = ["top", "right", "bottom", "left"]

  for (const side of sideKeys) {
    const value = sides[side]

    if (value.width <= 0 || value.opacity <= 0) {
      style[`border${capitalize(side)}Width`] = "0"
      continue
    }

    const color = toRgba(value.color, value.opacity / 100)
    style[`border${capitalize(side)}Width`] = `${value.width}px`
    style[`border${capitalize(side)}Style`] = value.style
    style[`border${capitalize(side)}Color`] = color
  }

  return style
}

export function getDraftingUniformBorderStyle({
  color,
  opacity,
  style,
  width,
}: {
  color: string
  opacity: number
  style: DraftingBorderStyle
  width: number
}) {
  if (width <= 0 || opacity <= 0) {
    return undefined
  }

  return `${width}px ${style} ${toRgba(color, opacity / 100)}`
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
