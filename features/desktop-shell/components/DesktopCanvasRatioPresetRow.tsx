"use client"

import { useState } from "react"

import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DesktopUtilityToolbarButton } from "@/features/desktop-shell/components/DesktopUtilityToolbar"
import {
  DESKTOP_BOXED_TOOLBAR_BUTTON_CLASS,
  DESKTOP_BOXED_TOOLBAR_ICON_CLASS,
} from "@/features/desktop-shell/components/desktop-utility-toolbar.constants"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import { findBrandIconById } from "@/features/qr-code/assets/brand-icons"
import {
  getSizeTemplate,
  getSizeTemplateSections,
  type SizeTemplate,
} from "@/features/workspace/model/size-templates"
import { cn } from "@/lib/utils"

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
  const sections = getSizeTemplateSections()

  return (
    <PopoverContent
      align="start"
      data-slot="desktop-canvas-ratio-preset-popover"
      side="bottom"
      sideOffset={12}
      className="z-[20000] max-h-[min(72vh,500px)] w-[min(280px,calc(100vw-24px))] overflow-y-auto rounded-[12px] border border-[var(--desktop-appearance-popover-border)] bg-[var(--desktop-appearance-popover-bg)] p-2 text-[var(--desktop-inspector-fg-secondary)] shadow-[var(--desktop-appearance-popover-shadow)]"
    >
      <div className="space-y-3" data-slot="desktop-canvas-size-sections">
        {sections.map((section) => (
          <section key={section.group} aria-labelledby={`canvas-size-${section.group}`}>
            <h3
              id={`canvas-size-${section.group}`}
              className="mb-1.5 px-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--desktop-inspector-fg-muted)]"
            >
              {section.label}
            </h3>
            <div
              aria-label={`${section.label} canvas sizes`}
              className="grid grid-cols-2 gap-1.5"
              data-slot="desktop-canvas-size-section"
              role="group"
            >
              {section.templates.map((template) => {
                const isSelected = selectedPresetId === template.id
                const BrandIcon = template.brandIconId
                  ? findBrandIconById(template.brandIconId)?.icon
                  : undefined

                return (
                  <PopoverClose asChild key={template.id}>
                    <button
                      aria-label={`${section.label} ${template.label}, ${template.width} by ${template.height} pixels`}
                      aria-pressed={isSelected}
                      className={cn(
                        "relative flex h-[64px] min-w-0 items-center gap-2 rounded-[8px] border border-transparent p-2 text-left transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]",
                        isSelected
                          ? "bg-[var(--desktop-inspector-option-selected-bg,var(--desktop-inspector-control-hover-bg))]"
                          : "hover:bg-[var(--desktop-inspector-control-hover-bg)] hover:text-inherit",
                        "active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
                      )}
                      title={`${template.label} · ${template.ratioLabel}`}
                      type="button"
                      onClick={() => onSelectTemplate(template)}
                    >
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center"
                      >
                        {BrandIcon ? (
                          <BrandIcon className="size-6 text-current" />
                        ) : (
                          <span
                            className="block rounded-[3px] border border-current"
                            style={{
                              aspectRatio: `${template.width} / ${template.height}`,
                              height: template.width >= template.height ? 24 : undefined,
                              width: template.width < template.height ? 15 : 24,
                            }}
                          />
                        )}
                      </span>
                      <span className="min-w-0 leading-tight">
                        <span className="block truncate text-[12px] font-medium">{template.label}</span>
                        <span className="block truncate text-[11px] text-[var(--desktop-inspector-fg-muted)]">
                          {template.ratioLabel}
                        </span>
                      </span>
                    </button>
                  </PopoverClose>
                )
              })}
            </div>
          </section>
        ))}
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
