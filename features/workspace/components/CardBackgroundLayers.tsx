"use client"

import type { CSSProperties } from "react"

import { CardBackgroundImageLayer } from "@/features/workspace/components/CardBackgroundImageLayer"
import { DraftingCardPaperShaderLayer } from "@/features/workspace/components/CardPaperShaderLayer"
import type {
  DraftingCardPaperShaderState,
  DraftingCardState,
} from "@/features/workspace/model/card-state"
import { cssFillToBackgroundStyle } from "@/features/workspace/model/css-fill-style"
import { cn } from "@/lib/utils"

type CardBackgroundLayersProps = {
  animateTransitions: boolean
  cardState: DraftingCardState
  imageFilterShader: DraftingCardPaperShaderState
  isImageFilterMode: boolean
  isImageMode: boolean
  isPaperShaderMode: boolean
  layoutHeight: number
  layoutWidth: number
  shaderDisplayHeight: number
  shaderDisplayWidth: number
}

export function CardBackgroundLayers({
  animateTransitions,
  cardState,
  imageFilterShader,
  isImageFilterMode,
  isImageMode,
  isPaperShaderMode,
  layoutHeight,
  layoutWidth,
  shaderDisplayHeight,
  shaderDisplayWidth,
}: CardBackgroundLayersProps) {
  const usesLayeredBackground = isPaperShaderMode || isImageFilterMode || isImageMode
  const showFillUnderlay =
    usesLayeredBackground &&
    !(isImageMode && cardState.cardImage.value) &&
    !isPaperShaderMode &&
    !isImageFilterMode
  const fillStyle = cssFillToBackgroundStyle(cardState.fill)

  return (
    <>
      {showFillUnderlay ? (
        <div
          aria-hidden="true"
          data-slot="desktop-compose-card-fill-underlay"
          className={cn(
            "pointer-events-none absolute inset-0 z-0",
            animateTransitions && "transition-[background-color,background-image] duration-150",
          )}
          style={{
            ...fillStyle,
            borderRadius: "inherit",
          }}
        />
      ) : null}
      {isImageMode && cardState.cardImage.value ? (
        <CardBackgroundImageLayer
          fit={cardState.cardImage.fit}
          imageUrl={cardState.cardImage.value}
          opacity={cardState.cardImage.opacity / 100}
        />
      ) : null}
      {isPaperShaderMode ? (
        <DraftingCardPaperShaderLayer
          displayHeight={shaderDisplayHeight}
          displayWidth={shaderDisplayWidth}
          layoutHeight={layoutHeight}
          layoutWidth={layoutWidth}
          paperShader={cardState.paperShader}
        />
      ) : null}
      {isImageFilterMode ? (
        <DraftingCardPaperShaderLayer
          displayHeight={shaderDisplayHeight}
          displayWidth={shaderDisplayWidth}
          layoutHeight={layoutHeight}
          layoutWidth={layoutWidth}
          paperShader={imageFilterShader}
        />
      ) : null}
    </>
  )
}

export function cardBackgroundSurfaceStyle(
  cardState: DraftingCardState,
  isImageFilterMode: boolean,
  isImageMode: boolean,
  isPaperShaderMode: boolean,
): CSSProperties {
  const usesLayeredBackground = isPaperShaderMode || isImageFilterMode || isImageMode

  return {
    ...(usesLayeredBackground
      ? { backgroundColor: "transparent" }
      : cssFillToBackgroundStyle(cardState.fill)),
  }
}
