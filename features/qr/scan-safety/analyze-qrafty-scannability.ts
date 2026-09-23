import decodeQR from "qr/decode.js"

import type { QraftyState } from "@/features/qr/model/state"
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared"
import { getQraftyQrModuleGrid } from "@/features/qr/scan-safety/qr-grid"
import {
  rasterizeQraftyScanPreview,
  type ScanSafetyScene,
} from "@/features/qr/scan-safety/rasterize-preview"

/**
 * Offline analysis budget. Unlike camera capture this is a one-shot check, so
 * the decoder gets a wider retry effort and wall-time window than the
 * per-frame defaults.
 */
const SCAN_DECODE_EFFORT = 6
const SCAN_DECODE_TIME_LIMIT_MS = 150

/**
 * Renders the final static export pixels and decodes them with the qr package.
 * Returns the decoded payload, or null when the artwork does not scan.
 */
export async function analyzeQraftyScannability(
  state: QraftyState,
  {
    layer,
    scene,
  }: {
    layer: DraftingCanvasLayer
    scene: ScanSafetyScene
  },
): Promise<string | null> {
  if (!getQraftyQrModuleGrid(state)) {
    throw new Error("The QR payload could not be encoded for analysis.")
  }

  const imageData = await rasterizeQraftyScanPreview(state, layer, scene)

  try {
    return decodeQR(imageData, {
      effort: SCAN_DECODE_EFFORT,
      timeLimit: SCAN_DECODE_TIME_LIMIT_MS,
    })
  } catch {
    return null
  }
}
