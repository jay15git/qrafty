import { formatColor, parseColor } from "@/components/ui/fill-picker-base/color-picker"
import { formatFill, parseFill, type Fill } from "@/components/ui/fill-picker-base/public-api"

export function fillFromHex(hex: string): Fill {
  const color = parseColor(hex)
  return {
    kind: "color",
    color: color ?? { l: 0, c: 0, h: 0, alpha: 1 },
  }
}

export function fillPreviewHex(fillCss: string): string {
  const parsed = parseFill(fillCss)
  if (!parsed) {
    const color = parseColor(fillCss)
    return color ? formatColor(color, "hex") : "#171717"
  }

  if (parsed.kind === "color") {
    return formatColor(parsed.color, "hex")
  }

  const stops = [...parsed.gradient.stops].sort((a, b) => a.position - b.position)
  const first = stops[0]?.color
  return first ? formatColor(first, "hex") : "#171717"
}

export function isGradientFill(fillCss: string): boolean {
  return parseFill(fillCss)?.kind === "gradient"
}

/** Clamp picker output to what QR module/eye/frame/logo can store and render. */
export function normalizeFillForQrTarget(fill: Fill): Fill {
  if (fill.kind !== "gradient") {
    return fill
  }

  const gradient = fill.gradient

  if (gradient.type === "conic") {
    return {
      kind: "gradient",
      gradient: {
        type: "radial",
        shape: "circle",
        center: gradient.center,
        size: "farthest-corner",
        interp: gradient.interp,
        stops: gradient.stops,
      },
    }
  }

  if (gradient.type === "radial") {
    if (gradient.shape === "circle" && !gradient.radii && gradient.radiusPx == null) {
      return fill
    }

    return {
      kind: "gradient",
      gradient: {
        ...gradient,
        shape: "circle",
        radii: undefined,
        radiusPx: undefined,
      },
    }
  }

  return fill
}

export function normalizeQrTargetFillCss(fillCss: string): string {
  const parsed = parseFill(fillCss)
  if (!parsed) {
    return fillCss
  }

  return formatFill(normalizeFillForQrTarget(parsed))
}
