"use client"

import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  BoldIcon,
  ImageIcon,
  ItalicIcon,
  MoreHorizontalIcon,
  UnderlineIcon,
} from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"

import FileUpload from "@/components/vendor/kokonutui/file-upload"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DesktopElementInspector } from "@/features/desktop-shell/components/DesktopElementInspector"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import {
  DesktopInspectorScrubbableNumberInput,
  DesktopInspectorSegmentedControl,
  DesktopInspectorTextInput,
} from "@/features/desktop-shell/components/InspectorControls"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import { DesktopUtilityToolbarButton } from "@/features/desktop-shell/components/DesktopUtilityToolbar"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { SettingsFillPopover } from "@/features/desktop-shell/inspector/settings-ui"
import {
  getDesktopFontWeightSliderStep,
  getDesktopLayerFontWeight,
  getNearestDesktopFontWeight,
} from "@/features/desktop-shell/model/font-weight"
import { createDefaultDraftingCardPaperShader } from "@/features/workspace/model/card-state"
import {
  DEFAULT_DRAFTING_IMAGE_LAYER,
  DEFAULT_DRAFTING_SHAPE_LAYER,
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
  type DraftingShapeFillMode,
  type DraftingTextAlign,
} from "@/features/workspace/model/layers"
import {
  loadDraftingFont,
  resolveDraftingFont,
} from "@/features/workspace/model/fonts"
import {
  getAllPaperShaderDefinitions,
} from "@/features/workspace/rendering/paper-shaders"
import { cn } from "@/lib/utils"

import "@/features/desktop-shell/inspector/desktopnew.css"

const DESKTOP_TEXT_ALIGN_OPTIONS: Array<{ label: string; value: DraftingTextAlign }> = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
]

function DesktopLayerToolbarPopover({
  label,
  children,
  trigger,
}: {
  label: string
  children: ReactNode
  trigger: ReactNode
}) {
  return (
    <Popover>
      <DesktopTooltip content={label} side="bottom" sideOffset={10}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      </DesktopTooltip>
      <PopoverContent
        align="center"
        data-slot="desktop-layer-toolbar-popover"
        sideOffset={12}
        className="z-[20000] flex h-[min(28rem,calc(100dvh-8rem))] max-h-[min(28rem,calc(100dvh-8rem))] w-[min(18rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[16px] border border-[var(--desktop-appearance-popover-border)] bg-[var(--desktop-appearance-popover-bg)] p-0 text-[var(--desktop-inspector-fg-secondary)] shadow-[var(--desktop-appearance-popover-shadow)] backdrop-blur-xl"
      >
        <ScrollArea
          chevron
          cueSize="comfortable"
          className="h-full min-h-0 flex-1"
          data-slot="desktop-inspector-scroll-area"
          scrollFade
          viewportClassName="px-3 py-3"
        >
          <div data-slot="desktop-inspector-scroll">{children}</div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function DesktopLayerToolbarToggle({
  active,
  children,
  label,
  onClick,
}: {
  active: boolean
  children: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <DesktopTooltip content={label} side="bottom" sideOffset={10}>
      <DesktopUtilityToolbarButton
        aria-label={label}
        aria-pressed={active}
        className={cn(active && "text-[var(--desktop-glass-button-hover-fg)]")}
        onClick={onClick}
      >
        {children}
      </DesktopUtilityToolbarButton>
    </DesktopTooltip>
  )
}

function DesktopLayerTextToolbarControls({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const selectedFont = resolveDraftingFont({
    fontFamily: layer.fontFamily,
    fontId: layer.fontId,
  })
  const supportedWeights = selectedFont.weights
  const fontWeight = getDesktopLayerFontWeight(layer.fontWeight, supportedWeights)

  useEffect(() => {
    void loadDraftingFont(selectedFont.id)
  }, [selectedFont.id])

  function patchTextLayer(patch: Partial<DraftingCanvasLayer>) {
    onPatch({ ...patch, textRuns: undefined })
  }

  return (
    <>
      <DesktopInspectorScrubbableNumberInput
        aria-label="Text font size"
        className="h-8 w-12 rounded-[6px] px-1 text-center text-[12px] font-semibold tabular-nums"
        max={300}
        min={6}
        value={layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize}
        onValueChange={(fontSize) => patchTextLayer({ fontSize })}
      />
      <DesktopLayerToolbarToggle
        active={fontWeight >= 700}
        label="Bold"
        onClick={() =>
          patchTextLayer({
            fontWeight:
              fontWeight >= 700
                ? getNearestDesktopFontWeight(400, supportedWeights)
                : getNearestDesktopFontWeight(700, supportedWeights),
          })
        }
      >
        <BoldIcon className="size-3.5" />
      </DesktopLayerToolbarToggle>
      <DesktopLayerToolbarToggle
        active={(layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle) === "italic"}
        label="Italic"
        onClick={() =>
          patchTextLayer({
            fontStyle:
              (layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle) === "italic"
                ? "normal"
                : "italic",
          })
        }
      >
        <ItalicIcon className="size-3.5" />
      </DesktopLayerToolbarToggle>
      <DesktopLayerToolbarToggle
        active={Boolean(layer.underline)}
        label="Underline"
        onClick={() => patchTextLayer({ underline: !layer.underline })}
      >
        <UnderlineIcon className="size-3.5" />
      </DesktopLayerToolbarToggle>
      {DESKTOP_TEXT_ALIGN_OPTIONS.map((option) => (
        <DesktopLayerToolbarToggle
          key={option.value}
          active={(layer.textAlign ?? DEFAULT_DRAFTING_TEXT_LAYER.textAlign) === option.value}
          label={`Align text ${option.value}`}
          onClick={() => patchTextLayer({ textAlign: option.value })}
        >
          <DesktopTextAlignIcon value={option.value} />
        </DesktopLayerToolbarToggle>
      ))}
      <SettingsFillPopover
        hint="Text fill"
        side="bottom"
        solidOnly
        title="Text fill"
        variant="swatch"
        value={layer.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill}
        onValueChange={(_fill, css) => patchTextLayer({ fill: fillPreviewHex(css) })}
      />
    </>
  )
}

function DesktopLayerImageToolbarControls({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  return (
    <>
      <DesktopLayerToolbarToggle
        active={(layer.imageFit ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageFit) === "cover"}
        label="Cover fit"
        onClick={() => onPatch({ imageFit: "cover" })}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide">Cover</span>
      </DesktopLayerToolbarToggle>
      <DesktopLayerToolbarToggle
        active={(layer.imageFit ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageFit) === "contain"}
        label="Contain fit"
        onClick={() => onPatch({ imageFit: "contain" })}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wide">Fit</span>
      </DesktopLayerToolbarToggle>
      <DesktopLayerToolbarPopover
        label="Replace image"
        trigger={
          <DesktopUtilityToolbarButton aria-label="Replace image">
            <ImageIcon className="size-3.5" />
          </DesktopUtilityToolbarButton>
        }
      >
        <div className="grid gap-2">
          <DesktopInspectorTextInput
            aria-label="Image URL"
            placeholder="https://example.com/photo.png"
            value={layer.imageSource === "url" ? (layer.imageValue ?? "") : ""}
            onChange={(event) =>
              onPatch({
                imageSource: event.currentTarget.value ? "url" : "none",
                imageValue: event.currentTarget.value || undefined,
              })
            }
          />
          <FileUpload
            acceptedFileTypes={["image/*"]}
            className="mx-0 max-w-full"
            onUploadError={() => undefined}
            onUploadSuccess={(file) => {
              onPatch({
                imageSource: "upload",
                imageValue: URL.createObjectURL(file),
              })
            }}
            uploadDelay={0}
          />
        </div>
      </DesktopLayerToolbarPopover>
    </>
  )
}

function DesktopLayerShapeToolbarControls({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const fillMode = layer.fillMode ?? DEFAULT_DRAFTING_SHAPE_LAYER.fillMode

  return (
    <>
      <SettingsFillPopover
        hint="Shape fill"
        side="bottom"
        solidOnly={fillMode === "solid"}
        title="Fill color"
        variant="swatch"
        value={layer.fill ?? DEFAULT_DRAFTING_SHAPE_LAYER.fill}
        onValueChange={(_fill, css) =>
          onPatch({
            fill: fillMode === "solid" ? fillPreviewHex(css) : css,
          })
        }
      />
      <DesktopLayerToolbarPopover
        label="Fill mode"
        trigger={
          <DesktopUtilityToolbarButton aria-label="Fill mode">
            <span className="text-[10px] font-semibold capitalize">{fillMode}</span>
          </DesktopUtilityToolbarButton>
        }
      >
        <DesktopInspectorSegmentedControl
          columns={4}
          itemClassName="h-8 px-1 text-[10px] capitalize"
          items={(["solid", "gradient", "image", "none"] as const).map((mode) => ({
            label: mode,
            value: mode,
          }))}
          value={fillMode}
          onValueChange={(mode) => onPatch({ fillMode: mode as DraftingShapeFillMode })}
        />
      </DesktopLayerToolbarPopover>
    </>
  )
}

function DesktopLayerShaderToolbarControls({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const paperShader = layer.paperShader ?? createDefaultDraftingCardPaperShader()
  const shaderDefinitions = getAllPaperShaderDefinitions()
  const selectedShader =
    shaderDefinitions.find((definition) => definition.id === paperShader.shaderId) ??
    shaderDefinitions[0]

  return (
    <DropdownMenu>
      <DesktopTooltip content="Shader preset" side="bottom" sideOffset={10}>
        <DropdownMenuTrigger asChild>
          <DesktopUtilityToolbarButton aria-label="Shader preset">
            <span className="max-w-[7rem] truncate text-[11px] font-semibold">
              {selectedShader?.label ?? "Shader"}
            </span>
          </DesktopUtilityToolbarButton>
        </DropdownMenuTrigger>
      </DesktopTooltip>
      <DropdownMenuContent
        align="center"
        className="z-[20000] min-w-[10rem] rounded-[12px] border border-[var(--desktop-appearance-popover-border)] bg-[var(--desktop-appearance-popover-bg)] p-1 text-[var(--desktop-inspector-fg-secondary)] shadow-[var(--desktop-appearance-popover-shadow)] backdrop-blur-xl"
        sideOffset={12}
      >
        {shaderDefinitions.map((definition) => (
          <DropdownMenuItem
            key={definition.id}
            className={cn(
              "cursor-pointer rounded-[8px] text-[12px] font-semibold",
              definition.id === paperShader.shaderId && "bg-[var(--desktop-glass-button-hover-bg)]",
            )}
            onClick={() =>
              onPatch({ paperShader: createDefaultDraftingCardPaperShader(definition.id) })
            }
          >
            {definition.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DesktopLayerMoreSettingsPopover({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  return (
    <DesktopLayerToolbarPopover
      label="More layer settings"
      trigger={
        <DesktopUtilityToolbarButton aria-label="More layer settings">
          <MoreHorizontalIcon className="size-3.5" />
        </DesktopUtilityToolbarButton>
      }
    >
      <DesktopElementInspector layer={layer} onPatch={onPatch} />
    </DesktopLayerToolbarPopover>
  )
}

function DesktopTextAlignIcon({ value }: { value: DraftingTextAlign }) {
  if (value === "center") {
    return <AlignCenterIcon className="size-3.5" />
  }

  if (value === "right") {
    return <AlignRightIcon className="size-3.5" />
  }

  return <AlignLeftIcon className="size-3.5" />
}

export function DesktopLayerToolbar({
  layer,
  onPatch,
  theme,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  return (
    <DesktopnewThemeContext.Provider value={theme}>
      <div
        className="flex min-w-0 items-center gap-0.5 px-1"
        data-layer-kind={layer.kind}
        data-slot="desktop-layer-toolbar"
      >
        {layer.kind === "text" ? (
          <DesktopLayerTextToolbarControls layer={layer} onPatch={onPatch} />
        ) : null}
        {layer.kind === "image" ? (
          <DesktopLayerImageToolbarControls layer={layer} onPatch={onPatch} />
        ) : null}
        {layer.kind === "shape" ? (
          <DesktopLayerShapeToolbarControls layer={layer} onPatch={onPatch} />
        ) : null}
        {layer.kind === "shader" ? (
          <DesktopLayerShaderToolbarControls layer={layer} onPatch={onPatch} />
        ) : null}
        <DesktopLayerMoreSettingsPopover layer={layer} onPatch={onPatch} />
      </div>
    </DesktopnewThemeContext.Provider>
  )
}
