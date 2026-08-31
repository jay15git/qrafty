import decodeQR from "qr/decode.js"

import type { QrStudioState } from "@/features/qr-code/model/state"
import {
  DECODE_PREVIEW_SIZE,
  rasterizeStudioPreview,
} from "@/features/qr-code/scan-safety/rasterize-preview"

export async function decodeStudioPreview(
  state: QrStudioState,
  backgroundColor = "#ffffff",
): Promise<string | null> {
  if (typeof window === "undefined") {
    return null
  }

  const canvas = await rasterizeStudioPreview(state, DECODE_PREVIEW_SIZE, backgroundColor)
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Could not create canvas context for scannability check.")
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

  try {
    return decodeQR(
      {
        width: canvas.width,
        height: canvas.height,
        data: imageData.data,
      },
      { cropToSquare: true },
    )
  } catch {
    return null
  }
}
