"use client"

import type { ReactNode } from "react"

import {
  DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SURFACE_CLASS,
  DesktopInspectorAnimatedOptionGrid,
  desktopInspectorOptionGridItemClass,
} from "@/features/desktop-shell/components/InspectorControls"
import { DesktopInspectorOptionGridScrollArea } from "@/features/desktop-shell/components/DesktopInspectorShell"
import {
  DRAFTING_ELEMENT_DECORATIVE_SHAPES,
  DRAFTING_SHAPE_PRIMITIVES,
} from "@/features/workspace/model/element-shapes"
import type { DraftingElementShapeId } from "@/features/workspace/model/layers"
import type { QrBackgroundShapeDefinition } from "@/features/qr-code/styles/background-shapes"
import { ElementShapePrimitivePreview } from "@/features/workspace/components/ElementShapePrimitivePreview"
import { cn } from "@/lib/utils"

function DesktopElementShapeOptionTile({
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

function DesktopElementShapeDecorativePreview({ shape }: { shape: QrBackgroundShapeDefinition }) {
  return (
    <svg
      className="size-[62%]"
      fill="none"
      viewBox={`0 0 ${shape.viewBox.width} ${shape.viewBox.height}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={shape.path} fill="currentColor" />
    </svg>
  )
}

export function DesktopElementShapeOptionGrid({
  onSelect,
  selectedShapeId,
}: {
  onSelect: (shapeId: DraftingElementShapeId) => void
  selectedShapeId: DraftingElementShapeId
}) {
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
          <DesktopElementShapeOptionTile
            key={shape.id}
            label={shape.label}
            selected={shape.id === selectedShapeId}
            onClick={() => onSelect(shape.id)}
          >
            <ElementShapePrimitivePreview className="size-[62%]" shapeId={shape.id} />
          </DesktopElementShapeOptionTile>
        ))}
        {DRAFTING_ELEMENT_DECORATIVE_SHAPES.map((shape) => (
          <DesktopElementShapeOptionTile
            key={shape.id}
            label={shape.label}
            selected={shape.id === selectedShapeId}
            onClick={() => onSelect(shape.id)}
          >
            <DesktopElementShapeDecorativePreview shape={shape} />
          </DesktopElementShapeOptionTile>
        ))}
      </DesktopInspectorAnimatedOptionGrid>
    </DesktopInspectorOptionGridScrollArea>
  )
}
