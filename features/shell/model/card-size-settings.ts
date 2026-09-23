import type { DraftingCardSizeMode } from "@/features/canvas/model/card-state"

export type CardSizeSettings = {
  cardHeight: number
  cardWidth: number
  lockAspectRatio: boolean
  sizeMode: DraftingCardSizeMode
  sizePresetId?: string
}
