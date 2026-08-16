"use client"

import { useState } from "react"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M21 9.75C20.59 9.75 20.25 9.41 20.25 9V3.75H15C14.59 3.75 14.25 3.41 14.25 3C14.25 2.59 14.59 2.25 15 2.25H21C21.41 2.25 21.75 2.59 21.75 3V9C21.75 9.41 21.41 9.75 21 9.75Z" />
      <path d="M9 21.75H3C2.59 21.75 2.25 21.41 2.25 21V15C2.25 14.59 2.59 14.25 3 14.25C3.41 14.25 3.75 14.59 3.75 15V20.25H9C9.41 20.25 9.75 20.59 9.75 21C9.75 21.41 9.41 21.75 9 21.75Z" />
      <path d="M13.4999 11.2495C13.3099 11.2495 13.1199 11.1795 12.9699 11.0295C12.6799 10.7395 12.6799 10.2595 12.9699 9.96945L20.4699 2.46945C20.7599 2.17945 21.2399 2.17945 21.5299 2.46945C21.8199 2.75945 21.8199 3.23945 21.5299 3.52945L14.0299 11.0295C13.8799 11.1795 13.6899 11.2495 13.4999 11.2495Z" />
      <path d="M2.99994 21.7495C2.80994 21.7495 2.61994 21.6795 2.46994 21.5295C2.17994 21.2395 2.17994 20.7595 2.46994 20.4695L9.96994 12.9695C10.2599 12.6795 10.7399 12.6795 11.0299 12.9695C11.3199 13.2595 11.3199 13.7395 11.0299 14.0295L3.52994 21.5295C3.37994 21.6795 3.18994 21.7495 2.99994 21.7495Z" />
    </svg>
  )
}

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
