export const SPACE = {
  xs: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 64,
} as const

export type SpaceToken = keyof typeof SPACE

export const RADIUS = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 28,
  xl: 40,
  full: 512,
} as const

export type RadiusToken = keyof typeof RADIUS

export type TypeToken = "body" | "caption" | "display" | "numeral" | "title"

export type TypeStep = {
  fontSize: number
  fontWeight: number
  letterSpacing: number
  lineHeight: number
}

/** Sized for the 1080px-class canvases used by the ratio-1-1 and ratio-4-5 presets. */
export const TYPE: Record<TypeToken, TypeStep> = {
  caption: { fontSize: 18, fontWeight: 600, letterSpacing: 3.2, lineHeight: 1.2 },
  body: { fontSize: 24, fontWeight: 500, letterSpacing: 0, lineHeight: 1.35 },
  title: { fontSize: 40, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.15 },
  display: { fontSize: 72, fontWeight: 700, letterSpacing: -1.2, lineHeight: 1.05 },
  numeral: { fontSize: 108, fontWeight: 700, letterSpacing: -2, lineHeight: 1 },
}

export type Palette = {
  accent: string
  bg: string
  ink: string
  muted: string
  onAccent: string
  surface: string
}

export const PALETTES = {
  mint: {
    accent: "#1d6b45",
    bg: "#dff0e6",
    ink: "#12241a",
    muted: "#4b5f52",
    onAccent: "#ffffff",
    surface: "#ffffff",
  },
  sand: {
    accent: "#b4451f",
    bg: "#f7ece0",
    ink: "#2a1d12",
    muted: "#6b5545",
    onAccent: "#ffffff",
    surface: "#ffffff",
  },
  slate: {
    accent: "#1f2937",
    bg: "#eceef2",
    ink: "#16181d",
    muted: "#565b66",
    onAccent: "#ffffff",
    surface: "#ffffff",
  },
  ink: {
    accent: "#f4f4f5",
    bg: "#101114",
    ink: "#f4f4f5",
    muted: "#a1a1aa",
    onAccent: "#101114",
    surface: "#191b1f",
  },
  blush: {
    accent: "#9d2235",
    bg: "#fbe9ec",
    ink: "#2a1418",
    muted: "#6d4a50",
    onAccent: "#ffffff",
    surface: "#ffffff",
  },
  sage: {
    accent: "#3f5d3a",
    bg: "#e8ece4",
    ink: "#1b241a",
    muted: "#55604f",
    onAccent: "#ffffff",
    surface: "#ffffff",
  },
} as const satisfies Record<string, Palette>

export type PaletteId = keyof typeof PALETTES

export function getPalette(id: PaletteId): Palette {
  return PALETTES[id]
}

export type PaletteTone = "accent" | "ink" | "muted" | "onAccent"

export function toneColor(palette: Palette, tone: PaletteTone): string {
  return palette[tone]
}
