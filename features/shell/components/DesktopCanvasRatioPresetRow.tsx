"use client"

import { PopoverClose, PopoverContent } from "@/components/ui/popover"
import { findBrandIconById } from "@/features/qr/assets/brand-icons"
import {
  getSizeTemplateSections,
  type SizeTemplate,
} from "@/features/canvas/model/size-templates"
import { cn } from "@/lib/utils"

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
      className="z-[20000] max-h-[min(72vh,500px)] w-[min(280px,calc(100vw-24px))] overflow-y-auto rounded-[12px] border border-[var(--appearance-popover-border)] bg-[var(--appearance-popover-bg)] p-2 text-[var(--settings-fg-secondary)] shadow-[var(--appearance-popover-shadow)]"
    >
      <div className="space-y-3" data-slot="desktop-canvas-size-sections">
        {sections.map((section) => (
          <section key={section.group} aria-labelledby={`canvas-size-${section.group}`}>
            <h3
              id={`canvas-size-${section.group}`}
              className="mb-1.5 px-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--settings-fg-muted)]"
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
                        "relative flex h-[64px] min-w-0 items-center gap-2 rounded-[8px] border border-transparent p-2 text-left transition-[background-color,border-color,box-shadow] duration-200 ease-out",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--settings-focus)]",
                        isSelected
                          ? "bg-[var(--settings-option-selected-bg,var(--settings-control-hover-bg))]"
                          : "hover:bg-[var(--settings-control-hover-bg)] hover:text-inherit",
                        "motion-reduce:transition-none",
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
                        <span className="block truncate text-[11px] text-[var(--settings-fg-muted)]">
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
