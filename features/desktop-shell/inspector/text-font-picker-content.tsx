"use client"

import { useEffect } from "react"

import { cn } from "@/lib/utils"
import {
  DRAFTING_FONT_REGISTRY,
  getDraftingFontCssFamily,
  loadDraftingFont,
  resolveDraftingFont,
} from "@/features/workspace/model/fonts"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

export function TextFontPickerContent({
  layer,
  onPatch,
  onSelect,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  onSelect?: () => void
}) {
  const selectedFont = resolveDraftingFont({
    fontFamily: layer.fontFamily,
    fontId: layer.fontId,
  })

  useEffect(() => {
    void loadDraftingFont(selectedFont.id)
  }, [selectedFont.id])

  function patchTextLayer(patch: Partial<DraftingCanvasLayer>) {
    onPatch({ ...patch, textRuns: undefined })
  }

  return (
    <div
      aria-label="Text font options"
      className="flex max-h-[min(50dvh,20rem)] flex-col gap-1 overflow-y-auto pr-0.5"
      data-slot="text-font-picker-content"
      role="listbox"
    >
      {DRAFTING_FONT_REGISTRY.map((font) => (
        <button
          key={font.id}
          aria-label={`Use ${font.label} text font`}
          aria-selected={selectedFont.id === font.id}
          className={cn(
            "dn-mobile-font-option flex min-h-[var(--dn-control-height)] min-w-0 items-center rounded-[var(--dn-radius-sm)] px-[length:var(--dn-row-px)] text-left font-semibold transition-colors",
            selectedFont.id === font.id
              ? "bg-[var(--dn-control)] text-[var(--dn-fg)]"
              : "text-[var(--dn-fg)] hover:bg-[var(--dn-control)]",
          )}
          data-vaul-no-drag=""
          role="option"
          style={{ fontFamily: getDraftingFontCssFamily({ fontId: font.id }) }}
          type="button"
          onClick={() => {
            void loadDraftingFont(font.id)
            patchTextLayer({ fontFamily: font.family, fontId: font.id })
            onSelect?.()
          }}
        >
          <span className="min-w-0 flex-1 truncate">{font.label}</span>
        </button>
      ))}
    </div>
  )
}
