"use client"

import { useEffect, useMemo, useState } from "react"

import { cn } from "@/lib/utils"
import { useFontPreviewObserver } from "@/features/desktop-shell/inspector/use-font-preview-observer"
import {
  DRAFTING_FONT_CATEGORY_LABELS,
  getDraftingFontCssFamily,
  groupDraftingFonts,
  loadDraftingFont,
  loadDraftingFontPreview,
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
  const [query, setQuery] = useState("")
  const fontGroups = useMemo(() => groupDraftingFonts(query), [query])
  const bindFontPreview = useFontPreviewObserver()

  useEffect(() => {
    void loadDraftingFont(selectedFont.id)
  }, [selectedFont.id])

  function patchTextLayer(patch: Partial<DraftingCanvasLayer>) {
    onPatch({ ...patch, textRuns: undefined })
  }

  return (
    <div
      className="flex max-h-[min(50dvh,20rem)] min-w-0 flex-col gap-1"
      data-slot="text-font-picker-content"
    >
      <input
        aria-label="Search fonts"
        autoComplete="off"
        className="h-[var(--dn-control-height)] shrink-0 rounded-[var(--dn-radius-sm)] border border-[var(--dn-line)] bg-transparent px-[length:var(--dn-row-px)] text-sm text-[var(--dn-fg)] outline-none placeholder:text-[var(--dn-muted)] focus:border-[var(--dn-fg)]"
        placeholder="Search fonts…"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.currentTarget.value)}
      />
      <div
        aria-label="Text font options"
        className="flex min-h-0 flex-col gap-1 overflow-y-auto pr-0.5"
        role="listbox"
      >
        {fontGroups.map((group) => (
          <div className="flex flex-col gap-1" key={group.category}>
            <p className="px-[length:var(--dn-row-px)] pt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--dn-muted)]">
              {DRAFTING_FONT_CATEGORY_LABELS[group.category]}
            </p>
            {group.fonts.map((font) => (
              <button
                key={font.id}
                ref={bindFontPreview(font.id)}
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
                onPointerEnter={() => loadDraftingFontPreview(font.id)}
              >
                <span className="min-w-0 flex-1 truncate">{font.label}</span>
              </button>
            ))}
          </div>
        ))}
        {fontGroups.length === 0 ? (
          <p className="px-[length:var(--dn-row-px)] py-3 text-center text-xs text-[var(--dn-muted)]">
            No matching fonts
          </p>
        ) : null}
      </div>
    </div>
  )
}
