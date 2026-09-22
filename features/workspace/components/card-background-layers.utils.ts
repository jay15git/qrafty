import type { CSSProperties } from "react"

import type { DraftingCardState } from "@/features/workspace/model/card-state"

export function cardBackgroundSurfaceStyle(
  _cardState: DraftingCardState,
  _isImageFilterMode: boolean,
  _isImageMode: boolean,
  _isPaperShaderMode: boolean,
): CSSProperties {
  return { backgroundColor: "transparent" }
}
