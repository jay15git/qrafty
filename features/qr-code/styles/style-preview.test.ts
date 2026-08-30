import { describe, expect, it } from "vitest"

import {
  buildModuleStylePreviewMatrix,
  getModuleStylePreviewViewBox,
  MODULE_STYLE_PREVIEW_MATRIX_SIZE,
  MODULE_STYLE_PREVIEW_PATTERN,
  MODULE_STYLE_PREVIEW_PATTERN_ORIGIN,
  MODULE_STYLE_PREVIEW_VIEWBOX_PADDING,
} from "@/features/qr-code/styles/style-preview"

describe("qr style preview helper", () => {
  it("builds a stable art-directed module matrix for picker tiles", () => {
    const matrix = buildModuleStylePreviewMatrix()
    const { row, col } = MODULE_STYLE_PREVIEW_PATTERN_ORIGIN
    const padding = MODULE_STYLE_PREVIEW_VIEWBOX_PADDING

    expect(matrix).toHaveLength(MODULE_STYLE_PREVIEW_MATRIX_SIZE)
    expect(matrix[0]).toHaveLength(MODULE_STYLE_PREVIEW_MATRIX_SIZE)

    for (let patternRow = 0; patternRow < MODULE_STYLE_PREVIEW_PATTERN.length; patternRow++) {
      for (let patternCol = 0; patternCol < MODULE_STYLE_PREVIEW_PATTERN[patternRow].length; patternCol++) {
        expect(matrix[row + patternRow][col + patternCol]).toBe(
          MODULE_STYLE_PREVIEW_PATTERN[patternRow][patternCol],
        )
      }
    }

    const darkModules = MODULE_STYLE_PREVIEW_PATTERN.flat().filter(Boolean).length
    expect(darkModules).toBe(35)
    expect(darkModules / MODULE_STYLE_PREVIEW_PATTERN.flat().length).toBeCloseTo(0.71, 2)

    expect(getModuleStylePreviewViewBox()).toBe(
      `${col - padding} ${row - padding} ${MODULE_STYLE_PREVIEW_PATTERN.length + padding * 2} ${MODULE_STYLE_PREVIEW_PATTERN.length + padding * 2}`,
    )
  })
})
