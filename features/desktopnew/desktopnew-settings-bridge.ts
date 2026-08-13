import { formatFill, parseFill } from "@/components/ui/fill-picker-base/fill"
import { formatColor } from "@/components/ui/fill-picker-base/color-picker"
import type {
  DesktopCornersSettings,
  DesktopLogoSettings,
  DesktopPatternSettings,
  DesktopShapeSettings,
} from "@/features/desktop-shell/components/FloatingToolbar"
import type { StudioGradient } from "@/features/qr-code/model/state"
import { fillFromHex, fillPreviewHex } from "@/features/desktopnew/desktopnew-fill-picker"

export function solidColorToFillCss(color: string): string {
  return formatFill(fillFromHex(color))
}

export function studioGradientToFillCss(gradient: StudioGradient): string {
  if (!gradient.enabled) {
    return solidColorToFillCss(gradient.colorStops[0]?.color ?? "#171717")
  }

  const [start, end] = gradient.colorStops
  if (gradient.type === "radial") {
    return `radial-gradient(circle, ${start.color} ${start.offset * 100}%, ${end.color} ${end.offset * 100}%)`
  }

  return `linear-gradient(${gradient.rotation}deg, ${start.color} ${start.offset * 100}%, ${end.color} ${end.offset * 100}%)`
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

  const gradient = parsed.gradient
  const stops = [...gradient.stops].sort((a, b) => a.position - b.position)
  const first = stops[0]
  const second = stops[stops.length - 1] ?? first

  if (!first || !second) {
    return fallback
  }

  if (gradient.type === "linear") {
    return {
      enabled: true,
      type: "linear",
      rotation: gradient.angle ?? fallback.rotation,
      colorStops: [
        { offset: first.position, color: formatColor(first.color, "hex") },
        { offset: second.position, color: formatColor(second.color, "hex") },
      ],
    }
  }

  return {
    enabled: true,
    type: "radial",
    rotation: fallback.rotation,
    colorStops: [
      { offset: first.position, color: formatColor(first.color, "hex") },
      { offset: second.position, color: formatColor(second.color, "hex") },
    ],
  }
}

export function applyPatternModuleFill(
  css: string,
  settings: DesktopPatternSettings,
): Partial<DesktopPatternSettings> {
  const parsed = parseFill(css)

  if (parsed?.kind === "gradient") {
    return {
      dotsColorMode: "gradient",
      dataModulesGradient: fillCssToStudioGradient(css, settings.dataModulesGradient),
    }
  }

  return {
    dotsColorMode: "solid",
    dotsSolidColor: fillPreviewHex(css),
  }
}

export function applyCornerFill(
  css: string,
  part: "eye" | "frame",
  settings: DesktopCornersSettings,
): Partial<DesktopCornersSettings> {
  const parsed = parseFill(css)
  const gradient =
    part === "eye" ? settings.cornerDotGradient : settings.cornerSquareGradient

  if (parsed?.kind === "gradient") {
    const nextGradient = fillCssToStudioGradient(css, gradient)
    return part === "eye"
      ? { cornerDotColorMode: "gradient", cornerDotGradient: nextGradient }
      : { cornerSquareColorMode: "gradient", cornerSquareGradient: nextGradient }
  }

  const hex = fillPreviewHex(css)
  return part === "eye"
    ? { cornerDotColorMode: "solid", cornerDotSolidColor: hex }
    : { cornerSquareColorMode: "solid", cornerSquareSolidColor: hex }
}

export function applyShapeFill(
  css: string,
  settings: DesktopShapeSettings,
): Partial<DesktopShapeSettings> {
  const parsed = parseFill(css)

  if (parsed?.kind === "gradient") {
    return {
      shapeColorMode: "gradient",
      shapeGradient: fillCssToStudioGradient(css, settings.shapeGradient),
    }
  }

  return {
    shapeColorMode: "solid",
    shapeSolidColor: fillPreviewHex(css),
  }
}

export function applyLogoFill(
  css: string,
  settings: DesktopLogoSettings,
): Partial<DesktopLogoSettings> {
  const parsed = parseFill(css)

  if (parsed?.kind === "gradient") {
    return {
      colorMode: "gradient",
      gradient: fillCssToStudioGradient(css, settings.gradient),
    }
  }

  return {
    colorMode: "solid",
    solidColor: fillPreviewHex(css),
  }
}
