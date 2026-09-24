"use client";

import { Fragment } from "react";

import { PopoverClose, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { findBrandIconById } from "@/features/qr/assets/brand-icons";
import { getSizeTemplateSections, type SizeTemplate } from "@/features/canvas/model/size-templates";
import {
  InspectorNumberField,
  InspectorValueGrid,
} from "@/features/shell/components/InspectorShell";
import { SettingsPopoverCloseButton } from "@/features/shell/inspector/settings-ui";
import type { CardSizeSettings } from "@/features/shell/model/card-size-settings";
import { cn } from "@/lib/utils";

export function CanvasRatioPresetSections({
  asChild = false,
  selectedPresetId,
  onSelectTemplate,
}: {
  /** Wrap each template button in `PopoverClose` — only valid inside a Radix
   *  popover. Leave off when rendering in a drawer/detail surface. */
  asChild?: boolean;
  selectedPresetId?: string;
  onSelectTemplate: (template: SizeTemplate) => void;
}) {
  const sections = getSizeTemplateSections();

  return (
    <div className="space-y-3" data-slot="canvas-size-sections">
      {sections.map((section) => (
        <section key={section.group} aria-labelledby={`canvas-size-${section.group}`}>
          <h3
            id={`canvas-size-${section.group}`}
            className="ds-type-label mb-1.5 px-1 font-medium uppercase tracking-[0.05em] text-[var(--muted)]"
          >
            {section.label}
          </h3>
          <div
            aria-label={`${section.label} canvas sizes`}
            className="grid grid-cols-2 gap-1.5"
            data-slot="canvas-size-section"
            role="group"
          >
            {section.templates.map((template) => {
              const isSelected = selectedPresetId === template.id;
              const BrandIcon = template.brandIconId
                ? findBrandIconById(template.brandIconId)?.icon
                : undefined;

              const button = (
                <button
                  aria-label={`${section.label} ${template.label}, ${template.width} by ${template.height} pixels`}
                  aria-pressed={isSelected}
                  className={cn(
                    "relative flex h-[64px] min-w-0 items-center gap-2 rounded-[length:var(--radius-xs)] border border-transparent p-2 text-left transition-[background-color,border-color,box-shadow] duration-200 ease-out",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus,var(--focus-ring))]",
                    isSelected
                      ? "bg-[var(--option-selected-bg,var(--control-hover))]"
                      : "hover:bg-[var(--control-hover)] hover:text-inherit",
                    "motion-reduce:transition-none",
                  )}
                  title={`${template.label} · ${template.ratioLabel}`}
                  type="button"
                  onClick={() => onSelectTemplate(template)}
                >
                  <span aria-hidden className="flex size-9 shrink-0 items-center justify-center">
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
                    <span className="ds-type-value block truncate font-medium">
                      {template.label}
                    </span>
                    <span className="ds-type-meta block truncate text-[var(--muted)]">
                      {template.ratioLabel}
                    </span>
                  </span>
                </button>
              );

              return asChild ? (
                <PopoverClose asChild key={template.id}>
                  {button}
                </PopoverClose>
              ) : (
                <Fragment key={template.id}>{button}</Fragment>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function CanvasCustomSizeFields({
  onSizeChange,
  sizeSettings,
}: {
  onSizeChange: (patch: Partial<CardSizeSettings>) => void;
  sizeSettings: CardSizeSettings;
}) {
  const applySize = (patch: { cardWidth?: number; cardHeight?: number }) => {
    onSizeChange({
      ...patch,
      sizeMode: "fixed",
      // Empty string clears the preset — `undefined` is ignored by the merge.
      sizePresetId: "",
    });
  };

  return (
    <section aria-labelledby="canvas-size-custom" data-slot="canvas-size-custom">
      <h3
        id="canvas-size-custom"
        className="ds-type-label mb-1.5 px-1 font-medium uppercase tracking-[0.05em] text-[var(--muted)]"
      >
        Custom
      </h3>
      <InspectorValueGrid>
        <InspectorNumberField
          fill
          label="Width"
          min={1}
          value={sizeSettings.cardWidth}
          onChange={(cardWidth) => applySize({ cardWidth })}
        />
        <InspectorNumberField
          fill
          label="Height"
          min={1}
          value={sizeSettings.cardHeight}
          onChange={(cardHeight) => applySize({ cardHeight })}
        />
      </InspectorValueGrid>
    </section>
  );
}

export function CanvasRatioPresetPopoverContent({
  selectedPresetId,
  onSelectTemplate,
  onSizeChange,
  sizeSettings,
  theme = "dark",
}: {
  selectedPresetId?: string;
  onSelectTemplate: (template: SizeTemplate) => void;
  onSizeChange?: (patch: Partial<CardSizeSettings>) => void;
  sizeSettings?: CardSizeSettings;
  theme?: "light" | "dark";
}) {
  return (
    <PopoverContent
      align="start"
      collisionPadding={12}
      data-slot="canvas-ratio-preset-popover"
      data-theme={theme}
      side="bottom"
      sideOffset={12}
      className={cn(
        "ds-portal-surface ds-popover-content ds-popover-flat z-[var(--z-popover)] grid max-h-[var(--popover-max-h)] w-[var(--popover-width)] grid-rows-[auto_minmax(0,1fr)] overflow-hidden p-0 ds-squircle-md",
        theme === "dark" && "dark",
      )}
    >
      <div className="ds-settings-popover-header">
        <p className="ds-settings-popover-title">Layout</p>
        <PopoverClose asChild>
          <SettingsPopoverCloseButton title="Layout" />
        </PopoverClose>
      </div>
      <ScrollArea
        chevron
        className="min-h-0"
        cueSize="comfortable"
        data-slot="inspector-scroll-area"
        scrollFade
        viewportClassName="px-3 py-3"
      >
        <div className="space-y-3" data-slot="inspector-scroll">
          {sizeSettings && onSizeChange ? (
            <CanvasCustomSizeFields sizeSettings={sizeSettings} onSizeChange={onSizeChange} />
          ) : null}
          <CanvasRatioPresetSections
            asChild
            selectedPresetId={selectedPresetId}
            onSelectTemplate={onSelectTemplate}
          />
        </div>
      </ScrollArea>
    </PopoverContent>
  );
}
