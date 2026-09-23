import type { CSSProperties } from "react";

import type { DraftingCardState } from "@/features/canvas/model/card-state";

export function cardBackgroundStyle(
  _cardState: DraftingCardState,
  _isImageFilterMode: boolean,
  _isImageMode: boolean,
  _isPaperShaderMode: boolean,
): CSSProperties {
  return { backgroundColor: "transparent" };
}
