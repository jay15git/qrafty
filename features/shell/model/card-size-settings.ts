import type { CanvasCardSizeMode } from "@/features/canvas/model/card-state";

export type CardSizeSettings = {
  cardHeight: number;
  cardWidth: number;
  lockAspectRatio: boolean;
  sizeMode: CanvasCardSizeMode;
  sizePresetId?: string;
};
