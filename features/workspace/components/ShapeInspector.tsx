"use client"

import FileUpload from "@/components/vendor/kokonutui/file-upload"
import { Input } from "@/components/ui/input"
import { OptionCard } from "@/components/ui/option-card"
import {
  DEFAULT_DRAFTING_SHAPE_LAYER,
  type DraftingCanvasLayer,
  type DraftingShapeFillMode,
} from "@/features/workspace/model/layers"
import {
  DraftingInspectorSection,
} from "@/features/workspace/components/InspectorPanel"
import {
  InspectorNumberInput,
  InspectorToggleButton,
} from "@/features/workspace/components/inspector/InspectorFields"
import {
  DRAFTING_ELEMENT_DECORATIVE_SHAPES,
  DRAFTING_SHAPE_PRIMITIVES,
} from "@/features/workspace/model/element-shapes"

export function ShapeInspector({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const shapeId = layer.shapeId ?? DEFAULT_DRAFTING_SHAPE_LAYER.shapeId
  const fillMode = layer.fillMode ?? DEFAULT_DRAFTING_SHAPE_LAYER.fillMode

  return (
    <DraftingInspectorSection dataSlot="drafting-shape-inspector" title="Shape">
      <div
        aria-label="Shape options"
        className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(88px,1fr))] justify-items-center gap-x-2 gap-y-3"
        role="radiogroup"
      >
        {DRAFTING_SHAPE_PRIMITIVES.map((shape) => (
          <OptionCard
            appearance="drafting"
            checked={shape.id === shapeId}
            darkShadowTone="ink"
            key={shape.id}
            label={shape.label}
            labelClassName="ws-type-option-label"
            name="drafting-element-shape"
            onSelect={() => onPatch({ shapeId: shape.id })}
            size="compact"
            value={shape.id}
          >
            <span className="grid size-full place-items-center text-[10px] font-semibold text-[var(--ws-ink-muted)]">
              {shape.label}
            </span>
          </OptionCard>
        ))}
        {DRAFTING_ELEMENT_DECORATIVE_SHAPES.map((shape) => (
          <OptionCard
            appearance="drafting"
            checked={shape.id === shapeId}
            darkShadowTone="ink"
            key={shape.id}
            label={shape.label}
            labelClassName="ws-type-option-label"
            name="drafting-element-shape"
            onSelect={() => onPatch({ shapeId: shape.id })}
            size="compact"
            value={shape.id}
          >
            <span className="flex items-center justify-center [&_svg]:size-14">
              <svg
                aria-hidden="true"
                fill="none"
                viewBox={`0 0 ${shape.viewBox.width} ${shape.viewBox.height}`}
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d={shape.path} fill={layer.fill ?? DEFAULT_DRAFTING_SHAPE_LAYER.fill} />
              </svg>
            </span>
          </OptionCard>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {(["solid", "gradient", "image", "none"] as const).map((mode) => (
          <InspectorToggleButton
            active={fillMode === mode}
            key={mode}
            label={mode}
            onClick={() => onPatch({ fillMode: mode as DraftingShapeFillMode })}
          />
        ))}
      </div>

      {fillMode === "solid" || fillMode === "gradient" ? (
        <label className="min-w-0">
          <span className="ws-type-meta mb-1 block font-semibold text-[var(--ws-ink-muted)]">
            Fill color
          </span>
          <input
            aria-label="Shape fill color"
            className="h-9 w-full rounded-[6px] border border-[var(--ws-line)] bg-transparent p-1"
            type="color"
            value={layer.fill ?? DEFAULT_DRAFTING_SHAPE_LAYER.fill}
            onChange={(event) => onPatch({ fill: event.currentTarget.value })}
          />
        </label>
      ) : null}

      {fillMode === "image" ? (
        <div className="space-y-2">
          <Input
            aria-label="Shape fill image URL"
            className="ws-type-input h-10 min-w-0 border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] px-3 text-[var(--ws-ink)] shadow-none"
            placeholder="https://example.com/texture.png"
            value={layer.imageSource === "url" ? (layer.imageValue ?? "") : ""}
            onChange={(event) =>
              onPatch({
                imageSource: event.currentTarget.value ? "url" : "none",
                imageValue: event.currentTarget.value || undefined,
              })
            }
          />
          <FileUpload
            acceptedFileTypes={["image/*"]}
            className="mx-0 max-w-full"
            onUploadError={() => undefined}
            onUploadSuccess={(file) => {
              onPatch({
                imageSource: "upload",
                imageValue: URL.createObjectURL(file),
              })
            }}
            uploadDelay={0}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2">
        <label className="min-w-0">
          <span className="ws-type-meta mb-1 block font-semibold text-[var(--ws-ink-muted)]">
            Stroke
          </span>
          <input
            aria-label="Shape stroke color"
            className="h-9 w-full rounded-[6px] border border-[var(--ws-line)] bg-transparent p-1"
            type="color"
            value={layer.stroke ?? DEFAULT_DRAFTING_SHAPE_LAYER.stroke}
            onChange={(event) => onPatch({ stroke: event.currentTarget.value })}
          />
        </label>
        <InspectorNumberInput
          label="Stroke width"
          max={64}
          min={0}
          value={layer.strokeWidth ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeWidth}
          onChange={(strokeWidth) => onPatch({ strokeWidth })}
        />
        <InspectorNumberInput
          label="Stroke %"
          max={100}
          min={0}
          value={layer.strokeOpacity ?? DEFAULT_DRAFTING_SHAPE_LAYER.strokeOpacity}
          onChange={(strokeOpacity) => onPatch({ strokeOpacity })}
        />
      </div>
    </DraftingInspectorSection>
  )
}
