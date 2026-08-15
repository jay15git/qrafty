import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { QR_BACKGROUND_SHAPES } from "@/features/qr-code/styles/background-shapes"

export function getShapeSvgPath(shapeId: NonNullable<DraftingCanvasLayer["shapeId"]>) {
  if (shapeId === "rect") {
    return '<rect x="8" y="8" width="84" height="84" rx="8" ry="8" />'
  }

  if (shapeId === "ellipse") {
    return '<ellipse cx="50" cy="50" rx="42" ry="42" />'
  }

  if (shapeId === "line") {
    return '<line x1="8" y1="50" x2="92" y2="50" stroke-linecap="round" />'
  }

  if (shapeId === "arrow") {
    return '<path d="M10 50 H62 M62 50 L44 34 M62 50 L44 66" fill="none" stroke-linecap="round" stroke-linejoin="round" />'
  }

  const definition = QR_BACKGROUND_SHAPES.find((shape) => shape.id === shapeId)
  return definition ? `<path d="${definition.path}" />` : ""
}
