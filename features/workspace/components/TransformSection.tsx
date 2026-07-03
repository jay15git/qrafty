"use client"

import { RotateCcwIcon } from "lucide-react"

import {
  DraftingInspectorSection,
  DraftingInspectorValueGrid,
} from "@/features/workspace/components/InspectorPanel"
import {
  InspectorNumberInput,
  InspectorToggleButton,
  InspectorToggleCheckbox,
} from "@/features/workspace/components/inspector/InspectorFields"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { Button } from "@/components/ui/button"

export function TransformSection({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const lockAspect = layer.kind === "image" || layer.kind === "shape" || layer.kind === "shader" || layer.kind === "qr"

  return (
    <DraftingInspectorSection dataSlot="drafting-transform-section" title="Transform">
      <DraftingInspectorValueGrid>
        <InspectorNumberInput label="X" value={Math.round(layer.x)} onChange={(x) => onPatch({ x })} />
        <InspectorNumberInput label="Y" value={Math.round(layer.y)} onChange={(y) => onPatch({ y })} />
        <InspectorNumberInput
          label="W"
          min={1}
          value={Math.round(layer.width)}
          onChange={(width) =>
            onPatch({
              width,
              ...(lockAspect ? { height: width } : {}),
              ...(layer.kind === "qr" ? { height: width } : {}),
            })
          }
        />
        <InspectorNumberInput
          disabled={layer.kind === "qr" || lockAspect}
          label="H"
          min={1}
          value={Math.round(layer.height)}
          onChange={(height) => onPatch({ height })}
        />
      </DraftingInspectorValueGrid>

      <div className="flex items-center gap-2">
        <InspectorNumberInput
          label="Rotation"
          max={360}
          min={-360}
          value={Math.round(layer.rotation)}
          onChange={(rotation) => onPatch({ rotation })}
        />
        <Button
          aria-label="Reset rotation"
          className="mt-5 size-9 shrink-0 rounded-[6px]"
          type="button"
          variant="ghost"
          onClick={() => onPatch({ rotation: 0 })}
        >
          <RotateCcwIcon className="size-4" />
        </Button>
      </div>

      <InspectorNumberInput
        label="Opacity %"
        max={100}
        min={0}
        value={Math.round(layer.opacity * 100)}
        onChange={(opacity) => onPatch({ opacity: opacity / 100 })}
      />

      <div className="grid grid-cols-2 gap-2">
        <InspectorToggleCheckbox
          checked={layer.isVisible}
          label="Visible"
          onChange={(isVisible) => onPatch({ isVisible })}
        />
        <InspectorToggleCheckbox
          checked={layer.isLocked}
          label="Locked"
          onChange={(isLocked) => onPatch({ isLocked })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <InspectorToggleButton
          active={(layer.scaleX ?? 1) < 0}
          label="Flip H"
          onClick={() => onPatch({ scaleX: (layer.scaleX ?? 1) < 0 ? 1 : -1 })}
        />
        <InspectorToggleButton
          active={(layer.scaleY ?? 1) < 0}
          label="Flip V"
          onClick={() => onPatch({ scaleY: (layer.scaleY ?? 1) < 0 ? 1 : -1 })}
        />
      </div>
    </DraftingInspectorSection>
  )
}
