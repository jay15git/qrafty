"use client"

import { useState } from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DesktopUtilityToolbarButton } from "@/features/desktop-shell/components/DesktopUtilityToolbar"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
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

export function DesktopCanvasRatioPresetPopover({
  selectedPresetId,
  onSelectTemplate,
  className,
}: {
  selectedPresetId?: string
  onSelectTemplate: (template: SizeTemplate) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const presets = DESKTOP_CANVAS_RATIO_PRESET_IDS.map((id) => getSizeTemplate(id)).filter(
    (template): template is SizeTemplate => template !== undefined,
  )
  const selectedTemplate = selectedPresetId ? getSizeTemplate(selectedPresetId) : undefined
  const selectedLabel = selectedTemplate?.ratioLabel ?? selectedTemplate?.label
  const tooltipLabel = selectedLabel ? `Canvas size — ${selectedLabel}` : "Canvas size"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <DesktopTooltip content={tooltipLabel} side="bottom" sideOffset={10}>
        <PopoverTrigger asChild>
          <DesktopUtilityToolbarButton
            aria-label={tooltipLabel}
            className={cn(
              "h-8 w-auto px-2.5 text-[10px] font-medium tracking-tight",
              open && "text-[var(--desktop-glass-button-hover-fg)]",
              className,
            )}
            data-slot="desktop-canvas-size-trigger"
          >
            Size
          </DesktopUtilityToolbarButton>
        </PopoverTrigger>
      </DesktopTooltip>
      <PopoverContent
        align="start"
        data-slot="desktop-canvas-ratio-preset-popover"
        side="bottom"
        sideOffset={12}
        className="z-[20000] w-auto rounded-[12px] border border-[var(--desktop-glass-border)] bg-[var(--desktop-glass-bg)] p-1 text-[var(--desktop-glass-fg)] shadow-[var(--desktop-glass-shadow)] backdrop-blur-xl"
      >
        <div
          aria-label="Canvas aspect ratio"
          className="grid grid-cols-3 gap-0.5"
          data-slot="desktop-canvas-ratio-preset-row"
          role="group"
        >
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
                onClick={() => {
                  onSelectTemplate(template)
                  setOpen(false)
                }}
              >
                {template.ratioLabel ?? template.label}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
