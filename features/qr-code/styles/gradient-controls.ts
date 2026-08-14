import type { CSSProperties } from "react"

const FULL_ROTATION_DEGREES = 360

const GRADIENT_SLIDER_CHECKER_PATTERN =
  "conic-gradient(var(--checker-a, #808080) 0 25%, var(--checker-b, #c0c0c0) 0 50%, var(--checker-a, #808080) 0 75%, var(--checker-b, #c0c0c0) 0)"

function clamp255(value: number) {
  return Math.min(255, Math.max(0, value))
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value))
}

function expandShortHex(hex: string) {
  if (hex.length === 3 || hex.length === 4) {
    return hex.split("").map((channel) => channel + channel).join("")
  }

  return hex
}

function parseHexColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const match = input.trim().match(/^#?([0-9a-fA-F]{3,8})$/)
  if (!match) return null

  let hex = match[1]
  if (hex.length === 3 || hex.length === 4) hex = expandShortHex(hex)

  if (hex.length === 6) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: 1,
    }
  }

  if (hex.length === 8) {
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      a: parseInt(hex.slice(6, 8), 16) / 255,
    }
  }

  return null
}

function parseCssColor(input: string): { r: number; g: number; b: number; a: number } | null {
  const value = input.trim()
  if (!value) return null

  if (value.startsWith("#") || /^[0-9a-fA-F]{3,8}$/.test(value)) {
    return parseHexColor(value)
  }

  const rgbMatch = value.match(/^rgba?\(\s*([^)]+)\)$/i)
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/[\s,/]+/).filter(Boolean)
    if (parts.length < 3) return null

    const r = parseFloat(parts[0])
    const g = parseFloat(parts[1])
    const b = parseFloat(parts[2])
    let a = 1

    if (parts[3] !== undefined) {
      a = parts[3].endsWith("%") ? parseFloat(parts[3]) / 100 : parseFloat(parts[3])
    }

    if ([r, g, b, a].some(Number.isNaN)) return null

    return {
      r: clamp255(r),
      g: clamp255(g),
      b: clamp255(b),
      a: clamp01(a),
    }
  }

  return null
}

export function formatCssColor(input: string) {
  const parsed = parseCssColor(input)
  if (!parsed) return input

  return `rgba(${Math.round(parsed.r)}, ${Math.round(parsed.g)}, ${Math.round(parsed.b)}, ${parsed.a})`
}

export function buildGradientSliderTrackStyle(startColor: string, endColor: string): CSSProperties {
  return {
    backgroundImage: `linear-gradient(to right, ${formatCssColor(startColor)} 0%, ${formatCssColor(endColor)} 100%), ${GRADIENT_SLIDER_CHECKER_PATTERN}`,
    backgroundSize: "100% 100%, 8px 8px",
    borderWidth: 0,
  }
}

function cssColorNeedsCheckerboard(input: string) {
  const parsed = parseCssColor(input)
  return parsed != null && parsed.a < 1
}

export function degreesToRadians(value: number) {
  return (value * Math.PI) / 180
}

export function radiansToDegrees(value: number) {
  return (value * FULL_ROTATION_DEGREES) / (Math.PI * 2)
}

export function clampGradientOffset(value: number) {
  if (Number.isNaN(value)) {
    return 0
  }

  return Math.min(1, Math.max(0, value))
}

export function normalizeGradientOffsetRange(values: [number, number]): [number, number] {
  const [start, end] = values.map((value) => clampGradientOffset(value))

  return start <= end ? [start, end] : [end, start]
}
