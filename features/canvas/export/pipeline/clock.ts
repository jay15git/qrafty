import type { DraftingCardPaperShaderState } from "@/features/canvas/model/card-state";
import type { QraftyState } from "@/features/qr/model/state";

export type ExportClockMode = "photo" | "video";

export function frameIndexToTimeMs(frameIndex: number, frameRate: number) {
  return (frameIndex * 1000) / frameRate;
}

export function resolveShaderExportFrameMs(
  shader: Pick<DraftingCardPaperShaderState, "frame" | "paused" | "speed">,
  mode: ExportClockMode,
  videoTimeMs: number,
) {
  if (mode === "video") {
    return videoTimeMs;
  }

  if (shader.paused || shader.speed === 0) {
    return shader.frame;
  }

  return performance.now() * shader.speed;
}

export function resolveQrExportTimeMs(
  state: QraftyState,
  mode: ExportClockMode,
  videoTimeMs: number,
) {
  const animation = state.dotMatrixAnimation;

  if (!animation.enabled || !animation.animated) {
    return 0;
  }

  if (mode === "video") {
    return videoTimeMs;
  }

  return performance.now();
}

export function isShaderTimeVarying(
  shader: Pick<DraftingCardPaperShaderState, "paused" | "speed">,
) {
  return !shader.paused && shader.speed !== 0;
}

export function isQrTimeVarying(state: QraftyState) {
  return state.dotMatrixAnimation.enabled && state.dotMatrixAnimation.animated;
}

export function sceneHasVideoExportContent(
  cardState: import("@/features/canvas/model/card-state").DraftingCardState,
  layers: import("@/features/canvas/model/layers/shared").DraftingCanvasLayer[],
  state: QraftyState,
) {
  if (isQrTimeVarying(state)) {
    return true;
  }

  if (cardState.styleMode === "paper-shader" && isShaderTimeVarying(cardState.paperShader)) {
    return true;
  }

  if (cardState.styleMode === "image-filter" && isShaderTimeVarying(cardState.imageFilter)) {
    return true;
  }

  return layers.some(
    (layer) =>
      layer.kind === "shader" &&
      layer.isVisible &&
      layer.paperShader &&
      isShaderTimeVarying(layer.paperShader),
  );
}
