import qrcode from "qrcode-generator"

/**
 * Payload tuned for a dense, mixed data-module patch in the style picker.
 * Crop coords are chosen to avoid finder/alignment cells while keeping ~50% fill.
 */
export const STYLE_PREVIEW_SAMPLE_DATA = "https://github.com/qrafty/studio"

export const STYLE_PREVIEW_ERROR_CORRECTION_LEVEL = "Q"
const STYLE_PREVIEW_MODE = "Byte"

/** Visible module window inside the encoded QR (0-based matrix coordinates). */
export const MODULE_STYLE_PREVIEW_CROP = {
  row: 7,
  col: 3,
  size: 11,
} as const

/** Extra viewBox margin in module units around the crop for breathing room in tiles. */
export const MODULE_STYLE_PREVIEW_VIEWBOX_PADDING = 0.75

export function getStylePreviewQrModuleCount() {
  const qr = qrcode(0, STYLE_PREVIEW_ERROR_CORRECTION_LEVEL)
  qr.addData(STYLE_PREVIEW_SAMPLE_DATA, STYLE_PREVIEW_MODE)
  qr.make()
  return qr.getModuleCount()
}

export function getModuleStylePreviewViewBox(
  crop: typeof MODULE_STYLE_PREVIEW_CROP = MODULE_STYLE_PREVIEW_CROP,
  padding: number = MODULE_STYLE_PREVIEW_VIEWBOX_PADDING,
) {
  const x = crop.col - padding
  const y = crop.row - padding
  const size = crop.size + padding * 2

  return `${x} ${y} ${size} ${size}`
}
