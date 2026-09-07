import {
  PICKER_QR_INPUT_TYPES,
  QR_INPUT_OPTIONS,
  type QrInputType,
} from "@/features/qr-code/content/input-options"

export type ContentBentoTile = {
  color: string
  id: QrInputType
  label: string
}

const TILE_COLORS = [
  "#34d399",
  "#fb7185",
  "#a78bfa",
  "#22d3ee",
  "#fbbf24",
  "#60a5fa",
  "#fb923c",
  "#f87171",
  "#818cf8",
  "#2dd4bf",
] as const

export const CONTENT_BENTO_TILES: ContentBentoTile[] = PICKER_QR_INPUT_TYPES.map(
  (type, index) => ({
    id: type,
    label: QR_INPUT_OPTIONS[type].label,
    color: TILE_COLORS[index % TILE_COLORS.length]!,
  }),
)
