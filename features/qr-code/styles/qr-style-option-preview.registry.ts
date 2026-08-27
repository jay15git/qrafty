import type { StylePreviewKind } from "@/features/qr-code/components/StylePreview"
import {
  CORNER_DOT_STYLE_OPTIONS,
  CORNER_SQUARE_STYLE_OPTIONS,
  DOT_STYLE_OPTIONS,
} from "@/features/qr-code/styles/style-options"

export type QrStyleOptionPreviewEntry = {
  previewKind: StylePreviewKind
  value: string
}

export const QR_STYLE_OPTION_PREVIEW_ENTRIES: QrStyleOptionPreviewEntry[] = [
  ...DOT_STYLE_OPTIONS.map((option) => ({
    previewKind: "dots" as const,
    value: option.value,
  })),
  ...CORNER_DOT_STYLE_OPTIONS.map((option) => ({
    previewKind: "corner-dot" as const,
    value: option.value,
  })),
  ...CORNER_SQUARE_STYLE_OPTIONS.map((option) => ({
    previewKind: "corner-square" as const,
    value: option.value,
  })),
]

export function getQrStyleOptionPreviewFileName(
  previewKind: StylePreviewKind,
  value: string,
) {
  return `${previewKind}-${value}.svg`
}

export const QR_STYLE_OPTION_PREVIEW_PATH = "/qr-style-previews"

export function getQrStyleOptionPreviewUrl(
  previewKind: StylePreviewKind,
  value: string,
) {
  return `${QR_STYLE_OPTION_PREVIEW_PATH}/${encodeURIComponent(getQrStyleOptionPreviewFileName(previewKind, value))}`
}
