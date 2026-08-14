import type { DraftingCardPaperShaderState } from "@/features/workspace/model/card-state"

const MIN_PAPER_SHADER_LAYOUT_PX = 8

export function hasValidPaperShaderLayout(
  layoutWidth?: number,
  layoutHeight?: number,
): boolean {
  return (
    typeof layoutWidth === "number" &&
    typeof layoutHeight === "number" &&
    Number.isFinite(layoutWidth) &&
    Number.isFinite(layoutHeight) &&
    layoutWidth >= MIN_PAPER_SHADER_LAYOUT_PX &&
    layoutHeight >= MIN_PAPER_SHADER_LAYOUT_PX
  )
}

function hasLiveCanvasPaperShaderMount(): boolean {
  if (typeof document === "undefined") {
    return false
  }

  return Boolean(
    document.querySelector('[data-slot="desktop-compose-card-paper-shader"] canvas'),
  )
}

export function readPaperShaderFallbackColor(paperShader: DraftingCardPaperShaderState): string {
  const colors = paperShader.params.colors
  if (Array.isArray(colors)) {
    const first = colors.find((value) => typeof value === "string")
    if (typeof first === "string") {
      return first
    }
  }

  const colorBack = paperShader.params.colorBack
  if (typeof colorBack === "string") {
    return colorBack
  }

  return "#0f172a"
}
