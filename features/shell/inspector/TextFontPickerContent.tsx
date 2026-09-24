"use client";

import { useEffect, useMemo, useState } from "react";

import { cn } from "@/lib/utils";
import { useFontPreviewObserver } from "@/features/shell/inspector/use-font-preview-observer";
import {
  DRAFTING_FONT_CATEGORY_LABELS,
  getDraftingFontCssFamily,
  groupDraftingFonts,
  loadDraftingFont,
  loadDraftingFontPreview,
  resolveDraftingFont,
} from "@/features/canvas/model/fonts";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";

export function TextFontPickerContent({
  layer,
  onPatch,
  onSelect,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
  onSelect?: () => void;
}) {
  const selectedFont = resolveDraftingFont({
    fontFamily: layer.fontFamily,
    fontId: layer.fontId,
  });
  const [query, setQuery] = useState("");
  const fontGroups = useMemo(() => groupDraftingFonts(query), [query]);
  const bindFontPreview = useFontPreviewObserver();

  useEffect(() => {
    void loadDraftingFont(selectedFont.id);
  }, [selectedFont.id]);

  function patchTextLayer(patch: Partial<CanvasLayer>) {
    onPatch({ ...patch, textRuns: undefined });
  }

  return (
    <div
      className="flex max-h-[min(50dvh,20rem)] min-w-0 flex-col gap-1"
      data-slot="text-font-picker-content"
    >
      <input
        aria-label="Search fonts"
        autoComplete="off"
        className="h-[var(--control-height)] shrink-0 rounded-[var(--radius-sm)] border border-[var(--line)] bg-transparent px-[length:var(--row-px)] text-sm text-[var(--fg)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--fg)]"
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
            <p className="px-[length:var(--row-px)] pt-1 text-[length:var(--type-caption)] font-semibold uppercase tracking-[0.08em] text-[var(--muted)]">
              {DRAFTING_FONT_CATEGORY_LABELS[group.category]}
            </p>
            {group.fonts.map((font) => (
              <button
                key={font.id}
                ref={bindFontPreview(font.id)}
                aria-label={`Use ${font.label} text font`}
                aria-selected={selectedFont.id === font.id}
                className={cn(
                  "ds-mobile-font-option flex min-h-[var(--control-height)] min-w-0 items-center rounded-[var(--radius-sm)] px-[length:var(--row-px)] text-left font-semibold transition-colors",
                  selectedFont.id === font.id
                    ? "bg-[var(--control)] text-[var(--fg)]"
                    : "text-[var(--fg)] hover:bg-[var(--control)]",
                )}
                data-vaul-no-drag=""
                role="option"
                style={{ fontFamily: getDraftingFontCssFamily({ fontId: font.id }) }}
                type="button"
                onClick={() => {
                  void loadDraftingFont(font.id);
                  patchTextLayer({ fontFamily: font.family, fontId: font.id });
                  onSelect?.();
                }}
                onPointerEnter={() => loadDraftingFontPreview(font.id)}
              >
                <span className="min-w-0 flex-1 truncate">{font.label}</span>
              </button>
            ))}
          </div>
        ))}
        {fontGroups.length === 0 ? (
          <p className="px-[length:var(--row-px)] py-3 text-center text-xs text-[var(--muted)]">
            No matching fonts
          </p>
        ) : null}
      </div>
    </div>
  );
}
