"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import {
  getSizeTemplate,
  type SizeTemplate,
} from "@/features/workspace/model/size-templates"
import { cn } from "@/lib/utils"

const DESKTOP_CANVAS_RATIO_PRESET_IDS = [
  "ratio-16-9",
  "ratio-3-2",
  "ratio-4-3",
  "ratio-1-1",
  "ratio-4-5",
  "ratio-9-16",
] as const

const RATIO_ROW = "flex min-w-max items-center gap-0.5 px-0.5"

export function DesktopCanvasRatioPresetRow({
  selectedPresetId,
  onSelectTemplate,
  className,
}: {
  selectedPresetId?: string
  onSelectTemplate: (template: SizeTemplate) => void
  className?: string
}) {
  const presets = DESKTOP_CANVAS_RATIO_PRESET_IDS.map((id) => getSizeTemplate(id)).filter(
    (template): template is SizeTemplate => template !== undefined,
  )

  return (
    <ScrollArea
      aria-label="Canvas aspect ratio"
      className={cn("max-w-[11.5rem] min-w-0 shrink overflow-hidden", className)}
      chevron={false}
      cueSize="tight"
      data-slot="desktop-canvas-ratio-preset-row"
      orientation="horizontal"
      scrollFade
      viewportClassName="min-w-0"
    >
      <div className={RATIO_ROW}>
        {presets.map((template) => {
          const isSelected = selectedPresetId === template.id

          return (
            <button
              key={template.id}
              aria-label={template.label}
              aria-pressed={isSelected}
              className={cn(
                "h-8 shrink-0 rounded-[7px] px-2.5 text-[10px] font-medium tracking-tight transition-colors duration-150",
                "hover:bg-[var(--desktop-glass-button-hover-bg)] hover:text-[var(--desktop-glass-button-hover-fg)]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-glass-button-focus-ring)]",
                isSelected &&
                  "bg-[var(--desktop-glass-button-hover-bg)] text-[var(--desktop-glass-button-hover-fg)] ring-1 ring-[var(--desktop-glass-border)]",
              )}
              title={template.label}
              type="button"
              onClick={() => onSelectTemplate(template)}
            >
              {template.ratioLabel ?? template.label}
            </button>
          )
        })}
      </div>
    </ScrollArea>
  )
}
