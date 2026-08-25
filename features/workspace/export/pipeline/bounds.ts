import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

export type ArtboardBounds = {
  height: number
  minX: number
  minY: number
  width: number
}

export function getArtboardExportBounds(cardLayer: DraftingCanvasLayer): ArtboardBounds {
  return {
    height: Math.max(1, Math.round(cardLayer.height)),
    minX: cardLayer.x,
    minY: cardLayer.y,
    width: Math.max(1, Math.round(cardLayer.width)),
  }
}

export type LetterboxFit = {
  height: number
  offsetX: number
  offsetY: number
  scale: number
  width: number
}

export function computeLetterboxFit(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
): LetterboxFit {
  const scale = Math.min(targetWidth / sourceWidth, targetHeight / sourceHeight)
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))
  const offsetX = Math.round((targetWidth - width) / 2)
  const offsetY = Math.round((targetHeight - height) / 2)

  return { height, offsetX, offsetY, scale, width }
}

export function makeEvenDimension(value: number) {
  const rounded = Math.max(2, Math.round(value))
  return rounded % 2 === 0 ? rounded : rounded + 1
}

export function resolveRasterTargetDimensions(
  artboardWidth: number,
  artboardHeight: number,
  longEdgePx: number,
) {
  const maxEdge = Math.max(artboardWidth, artboardHeight)
  const scale = longEdgePx / Math.max(1, maxEdge)

  return {
    height: Math.max(1, Math.round(artboardHeight * scale)),
    width: Math.max(1, Math.round(artboardWidth * scale)),
  }
}

export function resolveVideoOutputDimensions(
  artboardWidth: number,
  artboardHeight: number,
  longEdge: 1080 | 2160,
) {
  const maxEdge = Math.max(artboardWidth, artboardHeight)
  const scale = longEdge / maxEdge
  return {
    height: makeEvenDimension(artboardHeight * scale),
    width: makeEvenDimension(artboardWidth * scale),
  }
}
