import { formatFill, parseFill, type Fill, type Gradient, type GradientStop } from "@/components/ui/fill-picker-base/public-api"
import { formatColor, parseColor } from "@/components/ui/fill-picker-base/color-picker"
import type {
  DesktopCornersSettings,
  DesktopLogoSettings,
  DesktopPatternSettings,
  DesktopShapeSettings,
} from "@/features/desktop-shell/components/FloatingToolbar"
import type { QraftyGradient } from "@/features/qr-code/model/state"
import {
  clampQraftyGradientCenter,
  getQraftyGradientCenter,
} from "@/features/qr-code/styles/qrafty-gradient-geometry"
import { degreesToRadians, radiansToDegrees } from "@/features/qr-code/styles/gradient-controls"
import { fillFromHex, fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"

const FALLBACK_OKLCH = { l: 0, c: 0, h: 0, alpha: 1 } as const

/** CSS `linear-gradient` angles are 90° ahead of studio SVG rotation. */
const CSS_STUDIO_ROTATION_OFFSET_DEG = 90

function normalizeDegrees(value: number) {
  const mod = value % 360
  return mod < 0 ? mod + 360 : mod
}

function cssAngleToQraftyRotation(angleDeg: number) {
  return degreesToRadians(normalizeDegrees(angleDeg - CSS_STUDIO_ROTATION_OFFSET_DEG))
}

function qraftyRotationToCssAngle(rotationRad: number) {
  return normalizeDegrees(radiansToDegrees(rotationRad) + CSS_STUDIO_ROTATION_OFFSET_DEG)
}

function parseStopColor(color: string) {
  return parseColor(color) ?? FALLBACK_OKLCH
}

function qraftyStopsToFillStops(gradient: QraftyGradient): GradientStop[] {
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

function qraftyGradientToFill(gradient: QraftyGradient): Fill {
  const stops = qraftyStopsToFillStops(gradient)

  if (gradient.type === "radial") {
    const center = getQraftyGradientCenter(gradient)
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
      angle: qraftyRotationToCssAngle(gradient.rotation),
      interp: "oklch",
      stops,
    },
  }
}

export function solidColorToFillCss(color: string): string {
  return formatFill(fillFromHex(color))
}

export function qraftyGradientToFillCss(gradient: QraftyGradient): string {
  if (!gradient.enabled) {
    return solidColorToFillCss(gradient.colorStops[0]?.color ?? "#171717")
  }

  return formatFill(qraftyGradientToFill(gradient))
}

export function readPatternModuleFillCss(settings: DesktopPatternSettings): string {
  if (settings.dotsColorMode === "image") {
    return settings.moduleFillImageUrl || "transparent"
  }

  if (settings.dotsColorMode === "gradient") {
    return qraftyGradientToFillCss(settings.dataModulesGradient)
  }

  return solidColorToFillCss(settings.dotsSolidColor)
}

export function isPatternModuleImageFill(settings: DesktopPatternSettings): boolean {
  return settings.dotsColorMode === "image" && Boolean(settings.moduleFillImageUrl)
}

export function readCornerFillCss(
  mode: "solid" | "gradient",
  solidColor: string,
  gradient: QraftyGradient,
): string {
  if (mode === "gradient") {
    return qraftyGradientToFillCss(gradient)
  }

  return solidColorToFillCss(solidColor)
}

export function readShapeFillCss(settings: DesktopShapeSettings): string {
  if (settings.shapeColorMode === "gradient") {
    return qraftyGradientToFillCss(settings.shapeGradient)
  }

  return solidColorToFillCss(settings.shapeSolidColor)
}

export function readLogoFillCss(settings: DesktopLogoSettings): string {
  if (settings.colorMode === "gradient") {
    return qraftyGradientToFillCss(settings.gradient)
  }

  return solidColorToFillCss(settings.solidColor)
}

function fillGradientToQrafty(
  gradient: Gradient,
  fallback: QraftyGradient,
): QraftyGradient {
  const stops = [...gradient.stops].sort((a, b) => a.position - b.position)
  const first = stops[0]
  const second = stops[stops.length - 1] ?? first

  if (!first || !second) {
    return fallback
  }

  const colorStops: QraftyGradient["colorStops"] = [
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
      rotation: cssAngleToQraftyRotation(gradient.angle ?? 0),
      colorStops,
    }
  }

  if (gradient.type === "conic") {
    return {
      enabled: true,
      type: "radial",
      rotation: fallback.rotation,
      colorStops,
      center: clampQraftyGradientCenter(gradient.center),
    }
  }

  const center =
    gradient.type === "radial"
      ? clampQraftyGradientCenter(gradient.center)
      : clampQraftyGradientCenter(fallback.center ?? getQraftyGradientCenter(fallback))

  return {
    enabled: true,
    type: "radial",
    rotation: fallback.rotation,
    colorStops,
    center,
  }
}

export function fillCssToQraftyGradient(
  css: string,
  fallback: QraftyGradient,
): QraftyGradient {
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

  return fillGradientToQrafty(parsed.gradient, fallback)
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
      dataModulesGradient: fillGradientToQrafty(fill.gradient, settings.dataModulesGradient),
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
    const nextGradient = fillGradientToQrafty(fill.gradient, gradient)
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
      shapeGradient: fillGradientToQrafty(fill.gradient, settings.shapeGradient),
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
      gradient: fillGradientToQrafty(fill.gradient, settings.gradient),
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
