"use client";

import { useMemo } from "react";

import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared";
import { usePreviewRuntime } from "@/features/canvas/preview/preview-context";
import { getPreviewLayerEffectStyle } from "@/features/canvas/preview/preview-layer-effects";

export function useDraftingLayerEffectStyle(layer: DraftingCanvasLayer) {
  const { artboardScale } = usePreviewRuntime();

  return useMemo(
    () =>
      getPreviewLayerEffectStyle(layer, {
        previewScale: artboardScale,
      }),
    [artboardScale, layer],
  );
}

/** On-screen px for WebGL pixel budget — not CSS layout (camera-scaled document layers). */
export function usePreviewShaderDisplaySize(documentWidth: number, documentHeight: number) {
  const { artboardScale } = usePreviewRuntime();

  return useMemo(
    () => ({
      displayHeight: Math.max(1, Math.round(documentHeight * artboardScale)),
      displayWidth: Math.max(1, Math.round(documentWidth * artboardScale)),
    }),
    [artboardScale, documentHeight, documentWidth],
  );
}
