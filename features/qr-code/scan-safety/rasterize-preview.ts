import { buildDraftingQraftyPreviewMarkup } from "@/features/qr-code/rendering/drafting-qr-preview"
import { rasterizeSvgMarkupToCanvas } from "@/features/qr-code/rendering/svg-raster"
import type { QraftyState } from "@/features/qr-code/model/state"

export const DECODE_PREVIEW_SIZE = 512

export async function rasterizeQraftyPreview(
  state: QraftyState,
  size = DECODE_PREVIEW_SIZE,
  backgroundColor = "#ffffff",
): Promise<HTMLCanvasElement> {
  const markup = buildDraftingQraftyPreviewMarkup(state, size, size)

  return rasterizeSvgMarkupToCanvas(markup, size, size, { backgroundColor })
}
