import type { CanvasLayer } from "@/features/canvas/model/layers/shared";

export type ArtboardBounds = {
  height: number;
  minX: number;
  minY: number;
  width: number;
};

export type OutputDimensions = {
  height: number;
  width: number;
};

export function getArtboardExportBounds(cardLayer: CanvasLayer): ArtboardBounds {
  return {
    height: Math.max(1, Math.round(cardLayer.height)),
    minX: cardLayer.x,
    minY: cardLayer.y,
    width: Math.max(1, Math.round(cardLayer.width)),
  };
}

export function makeEvenDimension(value: number) {
  const rounded = Math.max(2, Math.round(value));
  return rounded % 2 === 0 ? rounded : rounded + 1;
}

export function resolveVideoOutputDimensions(
  artboardWidth: number,
  artboardHeight: number,
  longEdge: number,
): OutputDimensions {
  const maxEdge = Math.max(artboardWidth, artboardHeight);
  const scale = longEdge / maxEdge;
  return {
    height: makeEvenDimension(artboardHeight * scale),
    width: makeEvenDimension(artboardWidth * scale),
  };
}
