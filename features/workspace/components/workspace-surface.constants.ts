import type { MutableRefObject } from "react"

import type { QrFileExtension } from "@/features/qr-code/model/types"
import { createDefaultQrStudioState } from "@/features/qr-code/model/state"

export const DEFAULT_DRAFTING_STUDIO_STATE = createDefaultQrStudioState()

export const DEFAULT_DRAFTING_PANE_QR_SIZE = 240
export const DRAFTING_LAYER_PASTE_OFFSET = 24
export const IGNORE_DRAFTING_UPLOAD_ERROR: (message: string) => void = () => undefined
export const DEFAULT_DOWNLOAD_NAME = "new-qr-studio"
export const DRAFTING_DOWNLOAD_EXTENSIONS = ["svg", "png", "webp", "jpeg"] as const satisfies ReadonlyArray<
  QrFileExtension
>

export function replaceTrackedObjectUrl(
  trackedUrlRef: MutableRefObject<string | null>,
  file: Blob,
  onObjectUrlChange: (nextUrl: string) => void,
) {
  // eslint-disable-next-line react-doctor/no-create-object-url-without-revoke -- revoked via logoUploadObjectUrl effect cleanup
  const nextUrl = URL.createObjectURL(file)
  trackedUrlRef.current = nextUrl
  onObjectUrlChange(nextUrl)
  return nextUrl
}

export {
  DEFAULT_EXPORT_SCALE,
  EXPORT_SCALE_OPTIONS,
  type ExportScale,
} from "@/features/workspace/export/export-scale"

export type DraftingDownloadExtension = (typeof DRAFTING_DOWNLOAD_EXTENSIONS)[number]
