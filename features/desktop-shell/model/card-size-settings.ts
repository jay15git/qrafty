import type { DraftingCardSizeMode } from "@/features/workspace/model/card-state"

export type DesktopCardSizeSettings = {
  cardHeight: number
  cardWidth: number
  lockAspectRatio: boolean
  sizeMode: DraftingCardSizeMode
  sizePresetId?: string
}
