import type { CSSProperties } from "react";

import type { CanvasCardState } from "@/features/canvas/model/card-state";

export function cardBackgroundStyle(
  _cardState: CanvasCardState,
  _isImageFilterMode: boolean,
  _isImageMode: boolean,
  _isPaperShaderMode: boolean,
): CSSProperties {
  return { backgroundColor: "transparent" };
}
