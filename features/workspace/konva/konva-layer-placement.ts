import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

export type KonvaLayerPlacement = {
  height: number
  offsetX: number
  offsetY: number
  rotation: number
  scaleX: number
  scaleY: number
  width: number
  x: number
  y: number
}

export function getKonvaLayerPlacement(
  layer: Pick<
    DraftingCanvasLayer,
    "height" | "rotation" | "scaleX" | "scaleY" | "width" | "x" | "y"
  >,
  artboardWidth: number,
  artboardHeight: number,
): KonvaLayerPlacement {
  const width = layer.width
  const height = layer.height

  return {
    width,
    height,
    x: artboardWidth / 2 + layer.x + width / 2,
    y: artboardHeight / 2 + layer.y + height / 2,
    offsetX: width / 2,
    offsetY: height / 2,
    rotation: layer.rotation ?? 0,
    scaleX: layer.scaleX ?? 1,
    scaleY: layer.scaleY ?? 1,
  }
}

export function placementToLayerPatch(
  placement: KonvaLayerPlacement,
  artboardWidth: number,
  artboardHeight: number,
): Pick<DraftingCanvasLayer, "height" | "rotation" | "scaleX" | "scaleY" | "width" | "x" | "y"> {
  const scaleX = placement.scaleX
  const scaleY = placement.scaleY
  const width = Math.max(1, placement.width * Math.abs(scaleX))
  const height = Math.max(1, placement.height * Math.abs(scaleY))

  return {
    x: placement.x - artboardWidth / 2 - width / 2,
    y: placement.y - artboardHeight / 2 - height / 2,
    width,
    height,
    rotation: placement.rotation,
    scaleX: scaleX < 0 ? -1 : 1,
    scaleY: scaleY < 0 ? -1 : 1,
  }
}
