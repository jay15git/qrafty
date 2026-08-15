import { formatColor, parseColor } from "@/components/ui/fill-picker-base/color-picker"
import { parseFill, type Fill } from "@/components/ui/fill-picker-base/public-api"

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
