import { describe, expect, it } from "vitest"

import {
  getModuleStylePreviewViewBox,
  getStylePreviewQrModuleCount,
  MODULE_STYLE_PREVIEW_CROP,
  MODULE_STYLE_PREVIEW_VIEWBOX_PADDING,
  STYLE_PREVIEW_SAMPLE_DATA,
} from "@/features/qr-code/styles/style-preview"

describe("qr style preview helper", () => {
  it("builds a stable curated crop from the sample payload", () => {
    const moduleCount = getStylePreviewQrModuleCount()
    const { row, col, size } = MODULE_STYLE_PREVIEW_CROP
    const padding = MODULE_STYLE_PREVIEW_VIEWBOX_PADDING

    expect(STYLE_PREVIEW_SAMPLE_DATA).toBe("https://github.com/qrafty/studio")
    expect(moduleCount).toBe(29)
    expect(getModuleStylePreviewViewBox()).toBe(
      `${col - padding} ${row - padding} ${size + padding * 2} ${size + padding * 2}`,
    )
  })
})
