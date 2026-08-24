import { formatFill, parseFill, type Fill, type Gradient, type GradientStop } from "@/components/ui/fill-picker-base/public-api"
import { formatColor, parseColor } from "@/components/ui/fill-picker-base/color-picker"
import type {
  DesktopCornersSettings,
  DesktopLogoSettings,
  DesktopPatternSettings,
  DesktopShapeSettings,
} from "@/features/desktop-shell/components/FloatingToolbar"
import type { StudioGradient } from "@/features/qr-code/model/state"
import {
  clampStudioGradientCenter,
  getStudioGradientCenter,
} from "@/features/qr-code/styles/studio-gradient-geometry"
import { degreesToRadians, radiansToDegrees } from "@/features/qr-code/styles/gradient-controls"
import { fillFromHex, fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"

const FALLBACK_OKLCH = { l: 0, c: 0, h: 0, alpha: 1 } as const

/** CSS `linear-gradient` angles are 90° ahead of studio SVG rotation. */
const CSS_STUDIO_ROTATION_OFFSET_DEG = 90

function normalizeDegrees(value: number) {
  const mod = value % 360
  return mod < 0 ? mod + 360 : mod
}

function cssAngleToStudioRotation(angleDeg: number) {
  return degreesToRadians(normalizeDegrees(angleDeg - CSS_STUDIO_ROTATION_OFFSET_DEG))
}

function studioRotationToCssAngle(rotationRad: number) {
  return normalizeDegrees(radiansToDegrees(rotationRad) + CSS_STUDIO_ROTATION_OFFSET_DEG)
}

function parseStopColor(color: string) {
  return parseColor(color) ?? FALLBACK_OKLCH
}

function studioStopsToFillStops(gradient: StudioGradient): GradientStop[] {
  const start = gradient.colorStops[0]
  const end = gradient.colorStops[1] ?? start

  return [
    {
      id: "studio-start",
      color: parseStopColor(start.color),
      position: start.offset,
    },
    {
      id: "studio-end",
      color: parseStopColor(end.color),
      position: end.offset,
    },
  ]
}

function studioGradientToFill(gradient: StudioGradient): Fill {
  const stops = studioStopsToFillStops(gradient)

  if (gradient.type === "radial") {
    const center = getStudioGradientCenter(gradient)
    return {
      kind: "gradient",
      gradient: {
        type: "radial",
        shape: "circle",
        center,
        size: "farthest-corner",
        interp: "oklch",
        stops,
      },
    }
  }

  return {
    kind: "gradient",
    gradient: {
      type: "linear",
      angle: studioRotationToCssAngle(gradient.rotation),
      interp: "oklch",
      stops,
    },
  }
}

export function solidColorToFillCss(color: string): string {
  return formatFill(fillFromHex(color))
}

export function studioGradientToFillCss(gradient: StudioGradient): string {
  if (!gradient.enabled) {
    return solidColorToFillCss(gradient.colorStops[0]?.color ?? "#171717")
  }

  return formatFill(studioGradientToFill(gradient))
}

export function readPatternModuleFillCss(settings: DesktopPatternSettings): string {
  if (settings.dotsColorMode === "image") {
    return settings.moduleFillImageUrl || "transparent"
  }

  if (settings.dotsColorMode === "gradient") {
    return studioGradientToFillCss(settings.dataModulesGradient)
  }

  return solidColorToFillCss(settings.dotsSolidColor)
}

export function isPatternModuleImageFill(settings: DesktopPatternSettings): boolean {
  return settings.dotsColorMode === "image" && Boolean(settings.moduleFillImageUrl)
}

export function readCornerFillCss(
  mode: "solid" | "gradient",
  solidColor: string,
  gradient: StudioGradient,
): string {
  if (mode === "gradient") {
    return studioGradientToFillCss(gradient)
  }

  return solidColorToFillCss(solidColor)
}

export function readShapeFillCss(settings: DesktopShapeSettings): string {
  if (settings.shapeColorMode === "gradient") {
    return studioGradientToFillCss(settings.shapeGradient)
  }

  return solidColorToFillCss(settings.shapeSolidColor)
}

export function readLogoFillCss(settings: DesktopLogoSettings): string {
  if (settings.colorMode === "gradient") {
    return studioGradientToFillCss(settings.gradient)
  }

  return solidColorToFillCss(settings.solidColor)
}

function fillGradientToStudio(
  gradient: Gradient,
  fallback: StudioGradient,
): StudioGradient {
  const stops = [...gradient.stops].sort((a, b) => a.position - b.position)
  const first = stops[0]
  const second = stops[stops.length - 1] ?? first

  if (!first || !second) {
    return fallback
  }

  const colorStops: StudioGradient["colorStops"] = [
    {
      offset: Math.min(1, Math.max(0, first.position)),
      color: formatColor(first.color, "hex"),
    },
    {
      offset: Math.min(1, Math.max(0, second.position)),
      color: formatColor(second.color, "hex"),
    },
  ]

  if (gradient.type === "linear") {
    return {
      enabled: true,
      type: "linear",
      rotation: cssAngleToStudioRotation(gradient.angle ?? 0),
      colorStops,
    }
  }

  if (gradient.type === "conic") {
    return {
      enabled: true,
      type: "radial",
      rotation: fallback.rotation,
      colorStops,
      center: clampStudioGradientCenter(gradient.center),
    }
  }

  const center =
    gradient.type === "radial"
      ? clampStudioGradientCenter(gradient.center)
      : clampStudioGradientCenter(fallback.center ?? getStudioGradientCenter(fallback))

  return {
    enabled: true,
    type: "radial",
    rotation: fallback.rotation,
    colorStops,
    center,
  }
}

export function fillCssToStudioGradient(
  css: string,
  fallback: StudioGradient,
): StudioGradient {
  const parsed = parseFill(css)

  if (!parsed || parsed.kind === "color") {
    const hex = fillPreviewHex(css)
    return {
      ...fallback,
      enabled: false,
      colorStops: [
        { ...fallback.colorStops[0], color: hex },
        { ...fallback.colorStops[1], color: hex },
      ],
    }
  }

  return fillGradientToStudio(parsed.gradient, fallback)
}

function solidHexFromFill(fill: Fill): string {
  if (fill.kind === "color") {
    return formatColor(fill.color, "hex")
  }

  const stops = [...fill.gradient.stops].sort((a, b) => a.position - b.position)
  const first = stops[0]?.color
  return first ? formatColor(first, "hex") : "#171717"
}

export function applyPatternModuleFill(
  fill: Fill,
  settings: DesktopPatternSettings,
): Partial<DesktopPatternSettings> {
  if (fill.kind === "gradient") {
    return {
      dotsColorMode: "gradient",
      dataModulesGradient: fillGradientToStudio(fill.gradient, settings.dataModulesGradient),
    }
  }

  return {
    dotsColorMode: "solid",
    dotsSolidColor: solidHexFromFill(fill),
  }
}

export function applyPatternModuleImageUrl(
  imageUrl: string,
  sourceMode: DesktopPatternSettings["moduleFillImageSourceMode"],
): Partial<DesktopPatternSettings> {
  return {
    dotsColorMode: "image",
    moduleFillImageUrl: imageUrl,
    moduleFillImageSourceMode: sourceMode,
  }
}

export function applyCornerFill(
  fill: Fill,
  part: "eye" | "frame",
  settings: DesktopCornersSettings,
): Partial<DesktopCornersSettings> {
  const gradient =
    part === "eye" ? settings.cornerDotGradient : settings.cornerSquareGradient

  if (fill.kind === "gradient") {
    const nextGradient = fillGradientToStudio(fill.gradient, gradient)
    return part === "eye"
      ? { cornerDotColorMode: "gradient", cornerDotGradient: nextGradient }
      : { cornerSquareColorMode: "gradient", cornerSquareGradient: nextGradient }
  }

  const hex = solidHexFromFill(fill)
  return part === "eye"
    ? { cornerDotColorMode: "solid", cornerDotSolidColor: hex }
    : { cornerSquareColorMode: "solid", cornerSquareSolidColor: hex }
}

export function applyShapeFill(
  fill: Fill,
  settings: DesktopShapeSettings,
): Partial<DesktopShapeSettings> {
  if (fill.kind === "gradient") {
    return {
      shapeColorMode: "gradient",
      shapeGradient: fillGradientToStudio(fill.gradient, settings.shapeGradient),
    }
  }

  return {
    shapeColorMode: "solid",
    shapeSolidColor: solidHexFromFill(fill),
  }
}

export function applyLogoFill(
  fill: Fill,
  settings: DesktopLogoSettings,
): Partial<DesktopLogoSettings> {
  if (fill.kind === "gradient") {
    return {
      colorMode: "gradient",
      gradient: fillGradientToStudio(fill.gradient, settings.gradient),
    }
  }

  return {
    colorMode: "solid",
    solidColor: solidHexFromFill(fill),
  }
}

export function applyCardFill(fill: Fill): { cardFill: string } {
  if (fill.kind === "gradient") {
    return { cardFill: formatFill(fill) }
  }

  return { cardFill: solidHexFromFill(fill) }
}
