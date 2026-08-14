"use client"

import type { ReactNode } from "react"

import {
  DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
  DesktopInspectorAnimatedOptionGrid,
  desktopInspectorOptionGridItemClass,
} from "@/features/desktop-shell/components/InspectorControls"
import { DesktopInspectorOptionGridScrollArea } from "@/features/desktop-shell/inspector/inspector-option-grid"
import {
  DRAFTING_ELEMENT_DECORATIVE_SHAPES,
  DRAFTING_SHAPE_PRIMITIVES,
} from "@/features/workspace/model/element-shapes"
import {
  DEFAULT_DRAFTING_SHAPE_LAYER,
  type DraftingElementShapeId,
} from "@/features/workspace/model/layers"
import type { QrBackgroundShapeDefinition } from "@/features/qr-code/styles/background-shapes"
import { ElementShapePrimitivePreview } from "@/features/workspace/components/ElementShapePrimitivePreview"
import { cn } from "@/lib/utils"

export type ElementShapeOptionGridVariant = "inspector" | "insert-desktop" | "insert-drafting"

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
      viewBox={`0 0 ${shape.viewBox.width} ${shape.viewBox.height}`}
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
      data-desktop-animated-option-selection="true"
      data-desktop-option-interaction="scale"
      data-desktop-option-tile="true"
      className={cn(
        "group flex w-full min-w-0 items-center justify-center",
        desktopInspectorOptionGridItemClass("loose"),
        DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--desktop-inspector-option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span
        className={cn(
          "relative z-10 aspect-square w-full min-w-0 overflow-hidden rounded-[6px]",
          DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
        )}
      >
        <span
          aria-hidden="true"
          data-desktop-adaptive-option-preview="true"
          data-desktop-shape-option-preview="true"
          data-slot="desktop-style-preview-surface"
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
      <DesktopInspectorOptionGridScrollArea
        ariaLabel="Shape options"
        columns={3}
        dataSlot="desktop-layer-shape-options-scroll-area"
        shelfDataSlot="desktop-layer-shape-options"
        variant="preset"
      >
        <DesktopInspectorAnimatedOptionGrid
          columns={3}
          data-slot="desktop-layer-shape-options"
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
        </DesktopInspectorAnimatedOptionGrid>
      </DesktopInspectorOptionGridScrollArea>
    )
  }

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
          <ElementShapeDecorativePreview fill={decorativeFill} shape={shape} />
        </button>
      ))}
    </div>
  )
}
