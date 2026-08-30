export const DEFAULT_PAPER_SHADER_MIN_COLOR_COUNT = 1
export const DEFAULT_PAPER_SHADER_MAX_COLOR_COUNT = 10

export function addPaperShaderColor(
  colors: string[],
  maxCount: number,
  newColor = "#ffffff",
): string[] | null {
  if (colors.length >= maxCount) {
    return null
  }

  return [...colors, newColor]
}

export function removePaperShaderColor(
  colors: string[],
  index: number,
  minCount = DEFAULT_PAPER_SHADER_MIN_COLOR_COUNT,
): string[] | null {
  if (colors.length <= minCount || index < 0 || index >= colors.length) {
    return null
  }

  return colors.filter((_, colorIndex) => colorIndex !== index)
}
