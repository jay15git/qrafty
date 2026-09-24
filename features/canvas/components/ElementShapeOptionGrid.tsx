"use client";

import type { ReactNode } from "react";

import {
  SETTINGS_OPTION_TILE_BUTTON_CLASS,
  SETTINGS_OPTION_TILE_SCALE_PREVIEW_CLASS,
  SETTINGS_OPTION_TILE_SURFACE_CLASS,
} from "@/features/shell/components/settings-tokens";
import { SettingsAnimatedOptionGrid } from "@/features/shell/settings/SettingsOptionGrid";
import { settingsOptionGridItemClass } from "@/features/shell/settings/SettingsOptionGrid.classes";
import { SettingsOptionGridScrollArea } from "@/features/shell/settings/SettingsOptionGrid";
import {
  DRAFTING_ELEMENT_DECORATIVE_SHAPES,
  DRAFTING_SHAPE_PRIMITIVES,
} from "@/features/canvas/model/element-shapes";
import {
  DEFAULT_DRAFTING_SHAPE_LAYER,
  type CanvasElementShapeId,
} from "@/features/canvas/model/layers/shared";
import type { QrBackgroundShapeDefinition } from "@/features/qr/styles/background-shapes";
import { ElementShapePrimitivePreview } from "@/features/canvas/components/ElementShapePrimitivePreview";
import { cn } from "@/lib/utils";

type ElementShapeOptionGridVariant = "settings" | "insert-desktop" | "insert-canvas";

type ElementShapeOptionGridProps = {
  decorativeDataSlot?: string;
  onSelect: (shapeId: CanvasElementShapeId) => void;
  optionsDataSlot?: string;
  selectedShapeId?: CanvasElementShapeId;
  shapeFill?: string;
  variant: ElementShapeOptionGridVariant;
};

function ElementShapeDecorativePreview({
  fill,
  shape,
  sizeClassName = "size-8",
}: {
  fill: string;
  shape: QrBackgroundShapeDefinition;
  sizeClassName?: string;
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
  );
}

function SettingsElementShapeOptionTile({
  children,
  label,
  onClick,
  selected,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  selected: boolean;
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
        settingsOptionGridItemClass("loose"),
        SETTINGS_OPTION_TILE_SURFACE_CLASS,
        SETTINGS_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span
        className={cn(
          "relative z-10 aspect-square w-full min-w-0 overflow-hidden rounded-md",
          SETTINGS_OPTION_TILE_SCALE_PREVIEW_CLASS,
        )}
      >
        <span
          aria-hidden="true"
          data-desktop-adaptive-option-preview="true"
          data-shape-option-preview="true"
          data-slot="style-preview-surface"
          className="grid size-full place-items-center overflow-hidden rounded-md border-2 border-transparent bg-[var(--style-preview-tile-bg)] shadow-[var(--style-preview-inset)]"
        >
          {children}
        </span>
      </span>
    </button>
  );
}

export function ElementShapeOptionGrid({
  decorativeDataSlot = "canvas-element-shape-decorative-grid",
  onSelect,
  optionsDataSlot,
  selectedShapeId = DEFAULT_DRAFTING_SHAPE_LAYER.shapeId,
  shapeFill = DEFAULT_DRAFTING_SHAPE_LAYER.fill ?? "#18181b",
  variant,
}: ElementShapeOptionGridProps) {
  if (variant === "settings") {
    return (
      <SettingsOptionGridScrollArea
        ariaLabel="Shape options"
        columns={3}
        dataSlot="layer-shape-options-scroll-area"
        shelfDataSlot="layer-shape-options"
        variant="preset"
      >
        <SettingsAnimatedOptionGrid
          columns={3}
          data-slot="layer-shape-options"
          selectedKey={selectedShapeId}
        >
          {DRAFTING_SHAPE_PRIMITIVES.map((shape) => (
            <SettingsElementShapeOptionTile
              key={shape.id}
              label={shape.label}
              selected={shape.id === selectedShapeId}
              onClick={() => onSelect(shape.id)}
            >
              <ElementShapePrimitivePreview className="size-[62%]" shapeId={shape.id} />
            </SettingsElementShapeOptionTile>
          ))}
          {DRAFTING_ELEMENT_DECORATIVE_SHAPES.map((shape) => (
            <SettingsElementShapeOptionTile
              key={shape.id}
              label={shape.label}
              selected={shape.id === selectedShapeId}
              onClick={() => onSelect(shape.id)}
            >
              <ElementShapeDecorativePreview
                fill="currentColor"
                shape={shape}
                sizeClassName="size-[62%]"
              />
            </SettingsElementShapeOptionTile>
          ))}
        </SettingsAnimatedOptionGrid>
      </SettingsOptionGridScrollArea>
    );
  }

  const isInsertDesktop = variant === "insert-desktop";
  const decorativeFill = isInsertDesktop ? "currentColor" : shapeFill;
  const buttonClassName = isInsertDesktop
    ? "ds-option-tile flex aspect-square w-full min-w-0 items-center justify-center text-[var(--fg)] ds-squircle-xs"
    : "flex aspect-square w-full min-w-0 items-center justify-center p-2 text-[var(--canvas-ink-muted)] transition hover:bg-[var(--panel-bg-hover)] hover:text-[var(--canvas-ink)]";

  return (
    <div
      aria-label="Shape options"
      className={
        isInsertDesktop
          ? "ds-insert-menu-option-grid"
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
  );
}
