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

export const DRAFTING_RASTER_EXPORT_PRESETS = [
  {
    id: "quick-share",
    label: "Quick share",
    primaryUse: "chat, email, docs, previews",
    sizePx: 512,
  },
  {
    id: "web-social",
    label: "Web & social",
    primaryUse: "websites, social posts, menus",
    sizePx: 1024,
  },
  {
    id: "small-print",
    label: "Small print",
    primaryUse: "stickers, cards, table tents",
    sizePx: 1600,
  },
  {
    id: "flyer-poster",
    label: "Flyer / poster",
    primaryUse: "flyers, posters, nearby signage",
    sizePx: 2400,
  },
  {
    id: "large-format",
    label: "Large format",
    primaryUse: "banners, wall signs, storefronts",
    sizePx: 3200,
  },
  {
    id: "max-quality",
    label: "Max quality",
    primaryUse: "designer handoff, archive, safest PNG",
    sizePx: 4096,
  },
] as const

export type DraftingRasterExportPresetId = (typeof DRAFTING_RASTER_EXPORT_PRESETS)[number]["id"]
export type DraftingDownloadExtension = (typeof DRAFTING_DOWNLOAD_EXTENSIONS)[number]
export const DEFAULT_DRAFTING_RASTER_EXPORT_PRESET_ID: DraftingRasterExportPresetId = "web-social"
