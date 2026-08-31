import { parse, wcagContrast } from "culori"

import type { QraftyState, QraftyGradient } from "@/features/qr-code/model/state"

function collectGradientColors(gradient: QraftyGradient): string[] {
  if (!gradient.enabled) {
    return []
  }

  return gradient.colorStops.map((stop) => stop.color)
}

function getWorstContrast(colors: string[], background: string): number | null {
  let worst: number | null = null
  const bg = parse(background)

  if (!bg) {
    return null
  }

  for (const color of colors) {
    const fg = parse(color)
    if (!fg) {
      continue
    }

    const ratio = wcagContrast(fg, bg)
    if (!Number.isFinite(ratio)) {
      continue
    }

    if (worst === null || ratio < worst) {
      worst = ratio
    }
  }

  return worst
}

export function getEffectiveBackgroundForScanSafety(
  state: QraftyState,
  cardFill: string,
): string {
  if (state.backgroundOptions.transparent) {
    return cardFill || "#ffffff"
  }

  if (state.backgroundGradient.enabled) {
    const colors = collectGradientColors(state.backgroundGradient)
    if (colors.length >= 2) {
      const worst = getWorstContrast(colors, colors[0])
      if (worst !== null && worst < 2) {
        return colors[1]
      }
    }
  }

  return state.backgroundOptions.color
}
