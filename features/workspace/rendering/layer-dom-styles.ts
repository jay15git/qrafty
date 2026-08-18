import type { CSSProperties } from "react"

import type { DraftingCardState } from "@/features/workspace/model/card-state"
import { cornerRadiiToCss, resolveCornerRadii, resolveLayerCornerRadii } from "@/features/workspace/model/corner-radius"
import { normalizeDraftingCardBorder } from "@/features/workspace/model/card-state"
import {
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
  type DraftingTextRun,
} from "@/features/workspace/model/layers"
import { getDraftingFontCssFamily } from "@/features/workspace/model/fonts"
import { getDraftingTextFontFamily } from "@/features/workspace/rendering/text-layout"
import {
  buildCssFilterString,
  getDraftingLayerBoxShadowStyle,
  getDraftingLayerDropShadowFilter,
  getDraftingOutlineStyle,
  getDraftingPerSideBorderStyle,
  getDraftingUniformBorderStyle,
  mergeCssFilterStrings,
  toRgba,
} from "@/features/workspace/rendering/layer-appearance"
import { clampBackgroundShapeTilt } from "@/features/qr-code/model/state"
import { cssFillToBackgroundStyle } from "@/features/workspace/model/css-fill-style"
import {
  getBackgroundShapeCssTiltTransform,
  getLayerPlacementTransform,
  getLayerTiltPerspectiveStyle,
} from "@/features/workspace/rendering/layer-transform"


function getDraftingCardBorder(cardState: DraftingCardState) {
  const border = normalizeDraftingCardBorder(cardState.border)
  const hasPerSideOverrides = border.sides.top.width !== border.width ||
    border.sides.right.width !== border.width ||
    border.sides.bottom.width !== border.width ||
    border.sides.left.width !== border.width

  if (hasPerSideOverrides) {
    return undefined
  }

  return getDraftingUniformBorderStyle({
    color: border.color,
    opacity: border.opacity,
    style: border.style,
    width: border.width,
  })
}

export function getDraftingCardBorderStyle(cardState: DraftingCardState): CSSProperties {
  const border = normalizeDraftingCardBorder(cardState.border)
  const uniformBorder = getDraftingCardBorder({ ...cardState, border })

  if (uniformBorder) {
    return { border: uniformBorder }
  }

  return getDraftingPerSideBorderStyle(border.sides)
}

export function getDraftingLayerEffectStyle(layer: DraftingCanvasLayer): CSSProperties {
  const shadows =
    layer.shadows && layer.shadows.length > 0
      ? layer.shadows
      : layer.shadow
        ? [layer.shadow]
        : []
  const usesBoxShadow = shadows.some(
    (shadow) => shadow.inset || (shadow.spread ?? 0) !== 0 || shadows.length > 1,
  )
  const filter = usesBoxShadow
    ? buildCssFilterString(layer.layerFilters ?? [])
    : mergeCssFilterStrings(
        buildCssFilterString(layer.layerFilters ?? []),
        getDraftingLayerDropShadowFilter(shadows),
      )
  const borderStyle = layer.borderSides ? getDraftingPerSideBorderStyle(layer.borderSides) : {}
  const boxShadow = usesBoxShadow ? getDraftingLayerBoxShadowStyle(shadows) : undefined

  return {
    ...borderStyle,
    ...getDraftingOutlineStyle(layer.outline),
    ...(boxShadow ? { boxShadow } : {}),
    ...(filter ? { filter } : {}),
  }
}

export function getLayerPlacementStyle(
  layer: DraftingCanvasLayer,
  nested = false,
): CSSProperties {
  const tiltPerspectiveStyle = nested ? {} : getLayerTiltPerspectiveStyle(layer)

  return {
    height: layer.height,
    left: nested ? 0 : "50%",
    opacity: layer.opacity,
    top: nested ? 0 : "50%",
    transform: nested ? undefined : getLayerPlacementTransform(layer),
    transformOrigin: "center center",
    transformStyle: tiltPerspectiveStyle.perspective ? "preserve-3d" : undefined,
    width: layer.width,
    zIndex: layer.zIndex,
    ...tiltPerspectiveStyle,
  }
}

export function getLayerControlShellStyle(
  layer: Pick<DraftingCanvasLayer, "rotation" | "tiltX" | "tiltY" | "x" | "y">,
  paddingPx = 0,
): CSSProperties {
  const rotation = Number.isFinite(layer.rotation) ? layer.rotation : 0
  const tiltPerspectiveStyle = getLayerTiltPerspectiveStyle(layer)
  const rotationPart = rotation !== 0 ? ` rotate(${rotation}deg)` : ""

  return {
    transform: `translate3d(${layer.x - paddingPx}px, ${layer.y - paddingPx}px, 0)${rotationPart}`,
    transformOrigin: "center center",
    transformStyle: tiltPerspectiveStyle.perspective ? "preserve-3d" : undefined,
    ...tiltPerspectiveStyle,
  }
}

function getExportLayerTransform(layer: DraftingCanvasLayer) {
  const rotation = Number.isFinite(layer.rotation) ? layer.rotation : 0
  const scaleX = layer.scaleX ?? 1
  const scaleY = layer.scaleY ?? 1
  const tiltX = clampBackgroundShapeTilt(layer.tiltX ?? 0)
  const tiltY = clampBackgroundShapeTilt(layer.tiltY ?? 0)
  const parts: string[] = []

  if (rotation !== 0) {
    parts.push(`rotate(${rotation}deg)`)
  }

  if (scaleX !== 1 || scaleY !== 1) {
    parts.push(`scale(${scaleX}, ${scaleY})`)
  }

  if (tiltX !== 0 || tiltY !== 0) {
    const tiltTransform = getBackgroundShapeCssTiltTransform({ tiltX, tiltY })
    if (tiltTransform) {
      parts.push(tiltTransform)
    }
  }

  return parts.length > 0 ? parts.join(" ") : undefined
}

export function getExportLayerPlacementStyle(
  layer: DraftingCanvasLayer,
): Record<string, string | number> {
  const transform = getExportLayerTransform(layer)
  const style: Record<string, string | number> = {
    boxSizing: "border-box",
    height: layer.height,
    left: layer.x,
    opacity: layer.opacity,
    position: "absolute",
    top: layer.y,
    width: layer.width,
    zIndex: layer.zIndex,
  }

  if (transform) {
    style.transform = transform
    style.transformOrigin = "center center"
  }

  return style
}

export function getExportLayerEffectStyle(layer: DraftingCanvasLayer): Record<string, string> {
  const effectStyle = getDraftingLayerEffectStyle(layer)
  const style: Record<string, string> = {}

  for (const [key, value] of Object.entries(effectStyle)) {
    if (typeof value === "string" && value) {
      style[key] = value
    }
  }

  return style
}

export function getTextLayerStyle(layer: DraftingCanvasLayer): CSSProperties {
  return {
    color: layer.fill ?? "#171717",
    fontFamily: getDraftingTextFontFamily(layer),
    fontSize: layer.fontSize ?? 32,
    fontStyle: layer.fontStyle ?? "normal",
    fontWeight: layer.fontWeight ?? "normal",
    letterSpacing: layer.letterSpacing ?? 0,
    lineHeight: layer.lineHeight ?? 1.22,
    textAlign: layer.textAlign ?? "left",
    textDecorationLine: layer.underline ? "underline" : "none",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  }
}

export function getTextRunStyle(
  layer: DraftingCanvasLayer,
  run: DraftingTextRun,
): Record<string, string | number> {
  return {
    color: run.fill ?? layer.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill,
    fontFamily: getDraftingFontCssFamily({
      fontFamily: run.fontFamily ?? layer.fontFamily,
      fontId: run.fontId ?? layer.fontId,
    }),
    fontSize: run.fontSize ?? layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize,
    fontStyle: run.fontStyle ?? layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle,
    fontWeight: run.fontWeight ?? layer.fontWeight ?? DEFAULT_DRAFTING_TEXT_LAYER.fontWeight,
    textDecorationLine: (run.underline ?? layer.underline) ? "underline" : "none",
  }
}

export function serializeCssProperties(
  properties: Record<string, string | number | undefined>,
): Record<string, string | number> {
  const result: Record<string, string | number> = {}

  for (const [key, value] of Object.entries(properties)) {
    if (value !== undefined && value !== "") {
      result[key] = value
    }
  }

  return result
}

export function cssPropertiesToInlineStyle(
  properties: Record<string, string | number>,
): string {
  return Object.entries(properties)
    .map(([key, value]) => {
      const cssKey = key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
      const unit = typeof value === "number" && !["opacity", "zIndex", "fontWeight"].includes(key)
        ? "px"
        : ""

      return `${cssKey}:${value}${unit}`
    })
    .join(";")
}

function cssPropertiesToReactStyle(
  properties: Record<string, string | number>,
): string {
  return Object.entries(properties)
    .map(([key, value]) => {
      const serialized =
        typeof value === "string" && value.includes('"')
          ? `{\`${value.replaceAll("`", "\\`")}\`}`
          : JSON.stringify(value)

      return `${key}: ${serialized}`
    })
    .join(", ")
}

export function getDraftingCardDomStyle(
  cardState: DraftingCardState,
  layer: DraftingCanvasLayer,
  options?: {
    includeShaderModes?: boolean
  },
): Record<string, string | number> {
  const isImageMode = cardState.styleMode === "image"
  const isPaperShaderMode = cardState.styleMode === "paper-shader"
  const isImageFilterMode = cardState.styleMode === "image-filter"
  const cardImageStyle =
    isImageMode && cardState.cardImage.value
      ? {
          backgroundImage: `url("${cardState.cardImage.value}")`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: cardState.cardImage.fit,
        }
      : undefined
  const border = normalizeDraftingCardBorder(cardState.border)
  const borderStyle = getDraftingCardBorder(cardState)
    ? { border: getDraftingCardBorder(cardState) }
    : getDraftingPerSideBorderStyle(border.sides)

  return serializeCssProperties({
    ...cssFillToBackgroundStyle(cardState.fill),
    ...cardImageStyle,
    ...borderStyle,
    borderRadius: cornerRadiiToCss(resolveCornerRadii(cardState.cornerRadii, cardState.cornerRadius)),
  })
}

export function getDraftingImageDomStyle(layer: DraftingCanvasLayer): Record<string, string | number> {
  const imageValue = layer.imageValue ?? ""
  const borderRadius = cornerRadiiToCss(resolveLayerCornerRadii(layer, 0))
  const fit = layer.imageFit ?? "cover"

  if (!imageValue) {
    return {
      backgroundColor: "#f4f4f5",
      border: "1px dashed #d4d4d8",
      borderRadius,
    }
  }

  return {
    backgroundImage: `url("${imageValue}")`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: fit,
    borderRadius,
  }
}

export function getDraftingShapeDomStyle(layer: DraftingCanvasLayer): Record<string, string | number> {
  if (layer.fillMode === "none") {
    return { backgroundColor: "transparent" }
  }

  if (layer.fillMode === "image" && layer.imageValue) {
    return {
      backgroundColor: "transparent",
      backgroundImage: `url("${layer.imageValue}")`,
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      backgroundSize: layer.imageFit ?? "cover",
    }
  }

  return {
    backgroundColor: "transparent",
  }
}
