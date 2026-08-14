import type { DraftingShapePrimitiveId } from "@/features/workspace/model/layers"
import {
  QR_BACKGROUND_SHAPES,
  type QrBackgroundShapeDefinition,
} from "@/features/qr-code/styles/background-shapes"

export type { DraftingShapePrimitiveId }

export const DRAFTING_SHAPE_PRIMITIVES: Array<{
  id: DraftingShapePrimitiveId
  label: string
}> = [
  { id: "line", label: "Line" },
  { id: "arrow", label: "Arrow" },
  { id: "rect", label: "Rectangle" },
  { id: "ellipse", label: "Ellipse" },
]

export const DRAFTING_ELEMENT_DECORATIVE_SHAPES: QrBackgroundShapeDefinition[] =
  QR_BACKGROUND_SHAPES
