import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

import {
  getQrStyleOptionPreviewFileName,
  QR_STYLE_OPTION_PREVIEW_ENTRIES,
} from "@/features/qr-code/styles/qr-style-option-preview.registry"
import { renderBakedStylePreviewSvg } from "@/features/qr-code/styles/qr-style-option-preview.utils"

const OUT_DIR = path.join(process.cwd(), "public/qr-style-previews")
const SHOULD_WRITE = process.env.GENERATE_QR_STYLE_PREVIEWS === "1"

function writePreviewAssets() {
  fs.mkdirSync(OUT_DIR, { recursive: true })

  for (const entry of QR_STYLE_OPTION_PREVIEW_ENTRIES) {
    const fileName = getQrStyleOptionPreviewFileName(entry.previewKind, entry.value)
    const filePath = path.join(OUT_DIR, fileName)
    const nextMarkup = renderBakedStylePreviewSvg(entry.previewKind, entry.value)
    fs.writeFileSync(filePath, nextMarkup, "utf8")
  }
}

describe("qr style option previews", () => {
  it("matches baked svg assets", () => {
    if (SHOULD_WRITE) {
      writePreviewAssets()
    }

    for (const entry of QR_STYLE_OPTION_PREVIEW_ENTRIES) {
      const fileName = getQrStyleOptionPreviewFileName(entry.previewKind, entry.value)
      const filePath = path.join(OUT_DIR, fileName)
      const expected = renderBakedStylePreviewSvg(entry.previewKind, entry.value)

      expect(fs.existsSync(filePath), `missing preview asset: ${fileName}`).toBe(true)
      expect(fs.readFileSync(filePath, "utf8")).toBe(expected)
    }
  })
})
