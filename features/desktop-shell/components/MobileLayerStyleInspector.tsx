"use client"

import { useState } from "react"

import { DesktopEffectsAccordion } from "@/features/desktop-shell/components/DesktopEffectsAccordion"
import {
  DesktopLayerStyleInspector,
  type LayerStyleCategory,
} from "@/features/desktop-shell/components/DesktopElementInspector"
import { SegmentTabs } from "@/features/desktop-shell/inspector/settings-ui"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

type LayerStyleCategoryOption = {
  category: LayerStyleCategory
  id: string
  label: string
}

const EFFECTS_ID = "effects"

/** One category per screen keeps the drawer capped; the layer's own effects
 *  sliders get their own category rather than sitting under every other one. */
const CATEGORIES_BY_KIND: Partial<Record<DraftingCanvasLayer["kind"], LayerStyleCategoryOption[]>> = {
  text: [
    { category: "content", id: "content", label: "Content" },
    { category: "type", id: "type", label: "Type" },
    { category: "color", id: "color", label: "Color" },
    { category: "spacing", id: "spacing", label: "Spacing" },
  ],
  shape: [
    { category: "shape", id: "shape", label: "Shape" },
    { category: "fill", id: "fill", label: "Fill" },
  ],
  image: [{ category: "image", id: "image", label: "Image" }],
  shader: [
    { category: "shader", id: "shader", label: "Shader" },
    { category: "options", id: "options", label: "Options" },
  ],
}

export function MobileLayerStyleInspector({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const categories = CATEGORIES_BY_KIND[layer.kind] ?? []
  const [activeId, setActiveId] = useState(() => categories[0]?.id ?? EFFECTS_ID)
  const resolvedId = categories.some((option) => option.id === activeId)
    ? activeId
    : (categories[0]?.id ?? EFFECTS_ID)
  const activeCategory = categories.find((option) => option.id === resolvedId)

  return (
    <div className="dn-section-stack w-full min-w-0" data-slot="mobile-layer-style-inspector">
      <SegmentTabs
        items={[
          ...categories.map((option) => ({ id: option.id, label: option.label })),
          { id: EFFECTS_ID, label: "Effects" },
        ]}
        persistKey="mobile-layer-style-category"
        scrollable
        value={resolvedId}
        onChange={setActiveId}
      />

      {resolvedId === EFFECTS_ID ? (
        <DesktopEffectsAccordion layer={layer} onPatch={onPatch} />
      ) : (
        <DesktopLayerStyleInspector
          category={activeCategory?.category}
          layer={layer}
          onPatch={onPatch}
        />
      )}
    </div>
  )
}
