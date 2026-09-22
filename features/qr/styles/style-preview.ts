/** Art-directed 7×7 on/off patch for module style picker tiles. */
export const MODULE_STYLE_PREVIEW_PATTERN = [
  [true, true, true, false, true, true, false],
  [false, true, true, true, false, true, true],
  [true, false, true, true, true, false, true],
  [true, true, false, true, true, true, false],
  [false, true, true, false, true, false, true],
  [true, true, true, true, false, true, true],
  [true, false, true, true, true, true, false],
] as const

/** Full matrix size — large enough to clear QR finder masks in DataModules. */
export const MODULE_STYLE_PREVIEW_MATRIX_SIZE = 21

export const MODULE_STYLE_PREVIEW_PATTERN_ORIGIN = {
  row: 7,
  col: 7,
} as const

/** Extra viewBox margin in module units around the pattern. */
export const MODULE_STYLE_PREVIEW_VIEWBOX_PADDING = 0.35

export type ModuleStylePreviewMatrix = boolean[][]

export function buildModuleStylePreviewMatrix(): ModuleStylePreviewMatrix {
  const size = MODULE_STYLE_PREVIEW_MATRIX_SIZE
  const matrix: ModuleStylePreviewMatrix = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  )

  const { row: originRow, col: originCol } = MODULE_STYLE_PREVIEW_PATTERN_ORIGIN

  for (let row = 0; row < MODULE_STYLE_PREVIEW_PATTERN.length; row++) {
    for (let col = 0; col < MODULE_STYLE_PREVIEW_PATTERN[row].length; col++) {
      matrix[originRow + row][originCol + col] = MODULE_STYLE_PREVIEW_PATTERN[row][col]
    }
  }

  return matrix
}

export function getModuleStylePreviewViewBox(
  padding: number = MODULE_STYLE_PREVIEW_VIEWBOX_PADDING,
) {
  const { row, col } = MODULE_STYLE_PREVIEW_PATTERN_ORIGIN
  const patternSize = MODULE_STYLE_PREVIEW_PATTERN.length
  const x = col - padding
  const y = row - padding
  const size = patternSize + padding * 2

  return `${x} ${y} ${size} ${size}`
}
