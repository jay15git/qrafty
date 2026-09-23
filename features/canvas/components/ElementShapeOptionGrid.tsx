"use client"

import type { ReactNode } from "react"

import {
  INSPECTOR_OPTION_TILE_BUTTON_CLASS,
  INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
  INSPECTOR_OPTION_TILE_SURFACE_CLASS,
} from "@/features/shell/components/inspector-tokens"
import { InspectorAnimatedOptionGrid } from "@/features/shell/inspector/InspectorOptionGrid"
import { inspectorOptionGridItemClass } from "@/features/shell/inspector/InspectorOptionGrid.classes"
import { InspectorOptionGridScrollArea } from "@/features/shell/inspector/InspectorOptionGrid"
import {
  DRAFTING_ELEMENT_DECORATIVE_SHAPES,
  DRAFTING_SHAPE_PRIMITIVES,
} from "@/features/canvas/model/element-shapes"
import {
  DEFAULT_DRAFTING_SHAPE_LAYER,
  type DraftingElementShapeId,
} from "@/features/canvas/model/layers/shared"
import type { QrBackgroundShapeDefinition } from "@/features/qr/styles/background-shapes"
import { ElementShapePrimitivePreview } from "@/features/canvas/components/ElementShapePrimitivePreview"
import { cn } from "@/lib/utils"

type ElementShapeOptionGridVariant = "inspector" | "insert-desktop" | "insert-drafting"

type ElementShapeOptionGridProps = {
  decorativeDataSlot?: string
  onSelect: (shapeId: DraftingElementShapeId) => void
  optionsDataSlot?: string
  selectedShapeId?: DraftingElementShapeId
  shapeFill?: string
  variant: ElementShapeOptionGridVariant
}

function ElementShapeDecorativePreview({
  fill,
  shape,
  sizeClassName = "size-8",
}: {
  fill: string
  shape: QrBackgroundShapeDefinition
  sizeClassName?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={sizeClassName}
      fill="none"
      viewBox={`${shape.viewBox.x ?? 0} ${shape.viewBox.y ?? 0} ${shape.viewBox.width} ${shape.viewBox.height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={shape.path} fill={fill} />
    </svg>
  )
}

function InspectorElementShapeOptionTile({
  children,
  label,
  onClick,
  selected,
}: {
  children: ReactNode
  label: string
  onClick: () => void
  selected: boolean
}) {
  return (
    <button
      aria-label={`Use ${label} shape`}
      aria-pressed={selected}
      data-animated-option-selection="true"
      data-option-interaction="scale"
      data-option-tile="true"
      className={cn(
        "group flex w-full min-w-0 items-center justify-center",
        inspectorOptionGridItemClass("loose"),
        INSPECTOR_OPTION_TILE_SURFACE_CLASS,
        INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--settings-option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span
        className={cn(
          "relative z-10 aspect-square w-full min-w-0 overflow-hidden rounded-[6px]",
          INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
        )}
      >
        <span
          aria-hidden="true"
          data-desktop-adaptive-option-preview="true"
          data-shape-option-preview="true"
          data-slot="style-preview-surface"
          className="grid size-full place-items-center overflow-hidden rounded-[6px] border-2 border-transparent bg-[#15161a] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
        >
          {children}
        </span>
      </span>
    </button>
  )
}

export function ElementShapeOptionGrid({
  decorativeDataSlot = "drafting-element-shape-decorative-grid",
  onSelect,
  optionsDataSlot,
  selectedShapeId = DEFAULT_DRAFTING_SHAPE_LAYER.shapeId,
  shapeFill = DEFAULT_DRAFTING_SHAPE_LAYER.fill ?? "#18181b",
  variant,
}: ElementShapeOptionGridProps) {
  if (variant === "inspector") {
    return (
      <InspectorOptionGridScrollArea
        ariaLabel="Shape options"
        columns={3}
        dataSlot="layer-shape-options-scroll-area"
        shelfDataSlot="layer-shape-options"
        variant="preset"
      >
        <InspectorAnimatedOptionGrid
          columns={3}
          data-slot="layer-shape-options"
          selectedKey={selectedShapeId}
        >
          {DRAFTING_SHAPE_PRIMITIVES.map((shape) => (
            <InspectorElementShapeOptionTile
              key={shape.id}
              label={shape.label}
              selected={shape.id === selectedShapeId}
              onClick={() => onSelect(shape.id)}
            >
              <ElementShapePrimitivePreview className="size-[62%]" shapeId={shape.id} />
            </InspectorElementShapeOptionTile>
          ))}
          {DRAFTING_ELEMENT_DECORATIVE_SHAPES.map((shape) => (
            <InspectorElementShapeOptionTile
              key={shape.id}
              label={shape.label}
              selected={shape.id === selectedShapeId}
              onClick={() => onSelect(shape.id)}
            >
              <ElementShapeDecorativePreview fill="currentColor" shape={shape} sizeClassName="size-[62%]" />
            </InspectorElementShapeOptionTile>
          ))}
        </InspectorAnimatedOptionGrid>
      </InspectorOptionGridScrollArea>
    )
  }

  const isInsertDesktop = variant === "insert-desktop"
  const decorativeFill = isInsertDesktop ? "currentColor" : shapeFill
  const buttonClassName = isInsertDesktop
    ? "dn-option-tile flex aspect-square w-full min-w-0 items-center justify-center text-[var(--fg)] dn-squircle-xs"
    : "flex aspect-square w-full min-w-0 items-center justify-center p-2 text-[var(--canvas-ink-muted)] transition hover:bg-[var(--settings-panel-bg-hover)] hover:text-[var(--canvas-ink)]"

  return (
    <div
      aria-label="Shape options"
      className={
        isInsertDesktop
          ? "dn-insert-menu-option-grid"
          : "grid max-h-72 grid-cols-3 gap-0 overflow-y-auto"
      }
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
          <ElementShapePrimitivePreview className="size-8 text-[var(--fg)]" shapeId={shape.id} />
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
          <ElementShapeDecorativePreview fill={decorativeFill} shape={shape} />
        </button>
      ))}
    </div>
  )
}
