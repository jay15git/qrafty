import { formatFill, parseFill, type Fill } from "@/components/ui/fill-picker-base/fill"
import { formatColor, parseColor } from "@/components/ui/fill-picker-base/color-picker"
import type { Gradient, GradientStop } from "@/components/ui/fill-picker-base/gradient"
import type {
  DesktopCornersSettings,
  DesktopLogoSettings,
  DesktopPatternSettings,
  DesktopShapeSettings,
} from "@/features/desktop-shell/components/FloatingToolbar"
import type { StudioGradient } from "@/features/qr-code/model/state"
import { degreesToRadians, radiansToDegrees } from "@/features/qr-code/styles/gradient-controls"
import { fillFromHex, fillPreviewHex } from "@/features/desktopnew/desktopnew-fill-picker"

const FALLBACK_OKLCH = { l: 0, c: 0, h: 0, alpha: 1 } as const

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
    return {
      kind: "gradient",
      gradient: {
        type: "radial",
        shape: "circle",
        center: { x: 0.5, y: 0.5 },
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
      angle: radiansToDegrees(gradient.rotation),
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
  if (settings.dotsColorMode === "gradient") {
    return studioGradientToFillCss(settings.dataModulesGradient)
  }

  return solidColorToFillCss(settings.dotsSolidColor)
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
      rotation: degreesToRadians(gradient.angle ?? 0),
      colorStops,
    }
  }

  return {
    enabled: true,
    type: "radial",
    rotation: fallback.rotation,
    colorStops,
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
