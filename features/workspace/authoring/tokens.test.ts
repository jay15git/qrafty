import { wcagContrast } from "culori"
import { describe, expect, it } from "vitest"

import {
  PALETTES,
  RADIUS,
  SPACE,
  TYPE,
  getPalette,
  toneColor,
  type PaletteId,
} from "@/features/workspace/authoring/tokens"

const PALETTE_IDS = Object.keys(PALETTES) as PaletteId[]

describe("authoring tokens", () => {
  it("exposes an ascending spacing scale", () => {
    expect(Object.values(SPACE)).toEqual([...Object.values(SPACE)].sort((a, b) => a - b))
    expect(SPACE.xs).toBe(8)
    expect(SPACE.xl).toBe(64)
  })

  it("exposes a radius scale with a pill value", () => {
    expect(RADIUS.none).toBe(0)
    expect(RADIUS.full).toBe(512)
  })

  it("pairs every type step with a weight and line height", () => {
    for (const [name, step] of Object.entries(TYPE)) {
      expect(step.fontSize, name).toBeGreaterThan(0)
      expect(step.fontWeight, name).toBeGreaterThanOrEqual(400)
      expect(step.lineHeight, name).toBeGreaterThan(0.9)
    }
  })

  it("keeps ink readable on surface and bg in every palette", () => {
    for (const id of PALETTE_IDS) {
      const palette = getPalette(id)

      expect(wcagContrast(palette.ink, palette.surface), `${id} ink/surface`).toBeGreaterThanOrEqual(7)
      expect(wcagContrast(palette.ink, palette.bg), `${id} ink/bg`).toBeGreaterThanOrEqual(7)
    }
  })

  it("keeps onAccent readable on accent in every palette", () => {
    for (const id of PALETTE_IDS) {
      const palette = getPalette(id)

      expect(wcagContrast(palette.onAccent, palette.accent), `${id} onAccent/accent`).toBeGreaterThanOrEqual(
        4.5,
      )
    }
  })

  it("keeps muted readable on surface in every palette", () => {
    for (const id of PALETTE_IDS) {
      const palette = getPalette(id)

      expect(wcagContrast(palette.muted, palette.surface), `${id} muted/surface`).toBeGreaterThanOrEqual(
        4.5,
      )
    }
  })

  it("resolves tones to palette colours", () => {
    const palette = getPalette("mint")

    expect(toneColor(palette, "ink")).toBe(palette.ink)
    expect(toneColor(palette, "onAccent")).toBe(palette.onAccent)
  })
})
