"use client"

import {
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import {
  type DraftingSliderVariant,
} from "@/features/workspace/components/StylePanel"
import { TextInspector } from "@/features/workspace/components/TextInspector"

export function DraftingTextLayerTab({
  layer,
  onLayerPatch,
  sliderVariant,
}: {
  layer: DraftingCanvasLayer | null
  onLayerPatch: (patch: Partial<DraftingCanvasLayer>) => void
  sliderVariant: DraftingSliderVariant
}) {
  if (!layer) {
    return (
      <p className="ws-type-body rounded-[8px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg)] px-4 py-3 text-[var(--ws-ink-muted)] shadow-[var(--ws-shadow-rest)]">
        Select a text layer or use Insert to add one.
      </p>
    )
  }

  return <TextInspector layer={layer} onPatch={onLayerPatch} sliderVariant={sliderVariant} />
}
