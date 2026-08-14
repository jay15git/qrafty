"use client"

import {
  DRAFTING_ELEMENT_DECORATIVE_SHAPES,
  DRAFTING_SHAPE_PRIMITIVES,
} from "@/features/workspace/model/element-shapes"
import {
  DEFAULT_DRAFTING_SHAPE_LAYER,
  type DraftingElementShapeId,
} from "@/features/workspace/model/layers"
import { ElementShapePrimitivePreview } from "@/features/workspace/components/ElementShapePrimitivePreview"
import { cn } from "@/lib/utils"

type DraftingElementShapeOptionGridVariant = "insert-desktop" | "insert-drafting"

type DraftingElementShapeOptionGridProps = {
  decorativeDataSlot?: string
  onSelect: (shapeId: DraftingElementShapeId) => void
  optionsDataSlot?: string
  selectedShapeId?: DraftingElementShapeId
  shapeFill?: string
  variant: DraftingElementShapeOptionGridVariant
}

export function DraftingElementShapeOptionGrid({
  decorativeDataSlot = "drafting-element-shape-decorative-grid",
  onSelect,
  optionsDataSlot,
  selectedShapeId,
  shapeFill = DEFAULT_DRAFTING_SHAPE_LAYER.fill ?? "#18181b",
  variant,
}: DraftingElementShapeOptionGridProps) {
  const isInsertDesktop = variant === "insert-desktop"
  const decorativeFill = isInsertDesktop ? "#E8E8E8" : shapeFill

  const buttonClassName = cn(
    "flex aspect-square w-full min-w-0 items-center justify-center p-2 transition",
    isInsertDesktop
      ? "text-white/78 hover:bg-white/[0.11] hover:text-white"
      : "text-[var(--ws-ink-muted)] hover:bg-[var(--ws-panel-bg-hover)] hover:text-[var(--ws-ink)]",
  )

  return (
    <div
      aria-label="Shape options"
      className={cn(
        "grid max-h-72 grid-cols-3 gap-0 overflow-y-auto",
        isInsertDesktop ? "rounded-[10px] border border-white/[0.12] bg-white/[0.04]" : undefined,
      )}
      data-slot={optionsDataSlot ?? decorativeDataSlot}
      role="group"
    >
      {DRAFTING_SHAPE_PRIMITIVES.map((shape) => (
        <button
          aria-label={`Use ${shape.label} shape`}
          aria-pressed={selectedShapeId === shape.id}
          className={buttonClassName}
          key={shape.id}
          type="button"
          onClick={() => onSelect(shape.id)}
        >
          <ElementShapePrimitivePreview className="size-8" shapeId={shape.id} />
        </button>
      ))}
      {DRAFTING_ELEMENT_DECORATIVE_SHAPES.map((shape) => (
        <button
          aria-label={`Use ${shape.label} shape`}
          className={buttonClassName}
          key={shape.id}
          type="button"
          onClick={() => onSelect(shape.id)}
        >
          <svg
            aria-hidden="true"
            className="size-8"
            fill="none"
            viewBox={`0 0 ${shape.viewBox.width} ${shape.viewBox.height}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d={shape.path} fill={decorativeFill} />
          </svg>
        </button>
      ))}
    </div>
  )
}
