"use client"

import { useState } from "react"

import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DesktopUtilityToolbarButton } from "@/features/desktop-shell/components/DesktopUtilityToolbar"
import {
  DESKTOP_BOXED_TOOLBAR_BUTTON_CLASS,
  DESKTOP_BOXED_TOOLBAR_ICON_CLASS,
} from "@/features/desktop-shell/components/desktop-utility-toolbar.constants"
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

function DesktopCanvasSizeIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 12C2 7.75736 2 5.63604 3.17157 4.31802C4.34315 3 6.22876 3 10 3H14C17.7712 3 19.6569 3 20.8284 4.31802C22 5.63604 22 7.75736 22 12C22 16.2426 22 18.364 20.8284 19.682C19.6569 21 17.7712 21 14 21H10C6.22876 21 4.34315 21 3.17157 19.682C2 18.364 2 16.2426 2 12Z"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M2 9H10C12.8284 9 14.2426 9 15.1213 9.87868C16 10.7574 16 12.1716 16 15V21"
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path d="M10 21L10 9" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  )
}

export function DesktopCanvasRatioPresetPopoverContent({
  selectedPresetId,
  onSelectTemplate,
}: {
  selectedPresetId?: string
  onSelectTemplate: (template: SizeTemplate) => void
}) {
  const presets = DESKTOP_CANVAS_RATIO_PRESET_IDS.map((id) => getSizeTemplate(id)).filter(
    (template): template is SizeTemplate => template !== undefined,
  )

  return (
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
            <PopoverClose asChild key={template.id}>
              <button
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
            </PopoverClose>
          )
        })}
      </div>
    </PopoverContent>
  )
}

export function DesktopCanvasRatioPresetPopover({
  selectedPresetId,
  onSelectTemplate,
  className,
  suppressTooltip = false,
}: {
  selectedPresetId?: string
  onSelectTemplate: (template: SizeTemplate) => void
  className?: string
  suppressTooltip?: boolean
}) {
  const [open, setOpen] = useState(false)
  const selectedTemplate = selectedPresetId ? getSizeTemplate(selectedPresetId) : undefined
  const selectedLabel = selectedTemplate?.ratioLabel ?? selectedTemplate?.label
  const tooltipLabel = selectedLabel ? `Canvas size — ${selectedLabel}` : "Canvas size"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      {suppressTooltip ? (
        <PopoverTrigger asChild>
          <DesktopUtilityToolbarButton
            aria-label={tooltipLabel}
            className={cn(
              DESKTOP_BOXED_TOOLBAR_BUTTON_CLASS,
              "size-9 rounded-full hover:bg-white/10",
              open && "text-[var(--desktop-glass-button-hover-fg)]",
              className,
            )}
            data-slot="desktop-canvas-size-trigger"
          >
            <DesktopCanvasSizeIcon className={DESKTOP_BOXED_TOOLBAR_ICON_CLASS} />
          </DesktopUtilityToolbarButton>
        </PopoverTrigger>
      ) : (
        <DesktopTooltip content={tooltipLabel} side="bottom" sideOffset={10}>
          <PopoverTrigger asChild>
            <DesktopUtilityToolbarButton
              aria-label={tooltipLabel}
              className={cn(
                DESKTOP_BOXED_TOOLBAR_BUTTON_CLASS,
                open && "text-[var(--desktop-glass-button-hover-fg)]",
                className,
              )}
              data-slot="desktop-canvas-size-trigger"
            >
              <DesktopCanvasSizeIcon className={DESKTOP_BOXED_TOOLBAR_ICON_CLASS} />
            </DesktopUtilityToolbarButton>
          </PopoverTrigger>
        </DesktopTooltip>
      )}
      <DesktopCanvasRatioPresetPopoverContent
        onSelectTemplate={onSelectTemplate}
        selectedPresetId={selectedPresetId}
      />
    </Popover>
  )
}
