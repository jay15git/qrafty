"use client"

import { forwardRef, useState, type ComponentProps, type ReactNode } from "react"
import {
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ALargeSmallIcon,
  BoldIcon,
  ImageIcon,
  ItalicIcon,
  SmileIcon,
  UnderlineIcon,
} from "lucide-react"

import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerSearch,
} from "@/components/ui/emoji-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { Fill } from "@/components/ui/fill-picker-base/public-api"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import { fillPreviewHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { SettingsFillPopover, SettingsSlider } from "@/features/desktop-shell/inspector/settings-ui"
import {
  getDesktopLayerFontWeight,
  getNearestDesktopFontWeight,
} from "@/features/desktop-shell/model/font-weight"
import {
  DEFAULT_DRAFTING_IMAGE_LAYER,
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
  type DraftingTextAlign,
} from "@/features/workspace/model/layers"
import {
  COMPACT_TEXT_FONT_SIZES,
  getDraftingEmojiLayerSizePatch,
  isDraftingEmojiLayer,
  isDraftingIllustrationLayer,
} from "@/features/workspace/model/layer-floating-settings"
import { IllustrationFloatingColorControl } from "@/features/workspace/components/IllustrationColorControls"
import { resolveDraftingFont } from "@/features/workspace/model/fonts"
import {
  getShapeLayerFillCssValue,
  patchShapeLayerFillFromPicker,
} from "@/features/workspace/rendering/shape-fill"
import { cn } from "@/lib/utils"

import "@/features/desktop-shell/inspector/desktopnew.css"

const COMPACT_POPOVER_CLASS =
  "z-[20001] max-h-[min(32rem,calc(100vh-2rem))] w-auto min-w-[12rem] max-w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-white/[0.12] bg-[#171717] p-3 text-white shadow-[var(--desktop-glass-shadow)]"

const ICON_TOGGLE_CLASS =
  "grid size-9 place-items-center rounded-xl text-white/78 transition-[background-color,color] duration-150 hover:bg-white/[0.11] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 aria-pressed:bg-white/[0.16] aria-pressed:text-white"

const SIZE_OPTION_CLASS =
  "flex h-8 w-full min-w-[5.5rem] items-center justify-between rounded-lg px-2.5 text-[12px] font-semibold text-white/78 transition-[background-color,color] duration-150 hover:bg-white/[0.11] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 aria-pressed:bg-white/[0.16] aria-pressed:text-white"

const LayerFloatingSettingsButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button"> & {
    active?: boolean
    ariaLabel: string
    className?: string
  }
>(function LayerFloatingSettingsButton(
  { active = false, ariaLabel, children, className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-current transition-[background-color,color] duration-150 hover:bg-[var(--ws-layer-toolbar-button-hover-bg,rgba(255,255,255,0.11))] hover:text-[var(--ws-layer-toolbar-button-hover-text,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45",
        active && "bg-white/[0.16] text-white",
        className,
      )}
      data-slot="drafting-layer-floating-toolbar-button"
      type={type}
      onPointerDown={(event) => event.stopPropagation()}
      {...props}
    >
      {children}
    </button>
  )
})

function LayerFloatingSettingsPopover({
  ariaLabel,
  children,
  content,
  open,
  onOpenChange,
  trigger,
}: {
  ariaLabel: string
  children?: ReactNode
  content: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger: ReactNode
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <LayerFloatingSettingsButton ariaLabel={ariaLabel}>{trigger}</LayerFloatingSettingsButton>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        className={COMPACT_POPOVER_CLASS}
        data-slot="drafting-layer-floating-settings-popover"
        side="top"
        avoidCollisions
        collisionPadding={12}
        sideOffset={10}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        {children ?? content}
      </PopoverContent>
    </Popover>
  )
}

function FillColorToolbarButton({
  ariaLabel,
  onValueChange,
  solidOnly = true,
  theme,
  title,
  value,
}: {
  ariaLabel: string
  onValueChange: (fill: Fill, css: string) => void
  solidOnly?: boolean
  theme: DesktopThemeMode
  title: string
  value: string
}) {
  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center"
      data-slot="drafting-layer-floating-toolbar-color"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <DesktopnewThemeContext.Provider value={theme}>
        <SettingsFillPopover
          align="center"
          collisionPadding={12}
          hint={ariaLabel}
          side="top"
          solidOnly={solidOnly}
          title={title}
          value={value}
          triggerClassName="size-9 rounded-xl [&>span]:size-7 [&>span]:rounded-xl"
          variant="swatch"
          onValueChange={onValueChange}
        />
      </DesktopnewThemeContext.Provider>
    </div>
  )
}

function TextTypographySettings({
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
  const fontStyle = layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle
  const textAlign = layer.textAlign ?? DEFAULT_DRAFTING_TEXT_LAYER.textAlign

  function patchText(patch: Partial<DraftingCanvasLayer>) {
    onPatch({ ...patch, textRuns: undefined })
  }

  return (
    <div className="grid gap-2" data-slot="drafting-layer-text-typography-settings">
      <div className="grid grid-cols-3 gap-1">
        <LayerFloatingSettingsButton
          active={fontWeight >= 700}
          ariaLabel="Bold"
          className={ICON_TOGGLE_CLASS}
          onClick={() =>
            patchText({
              fontWeight:
                fontWeight >= 700
                  ? getNearestDesktopFontWeight(400, supportedWeights)
                  : getNearestDesktopFontWeight(700, supportedWeights),
            })
          }
        >
          <BoldIcon className="size-3.5" />
        </LayerFloatingSettingsButton>
        <LayerFloatingSettingsButton
          active={fontStyle === "italic"}
          ariaLabel="Italic"
          className={ICON_TOGGLE_CLASS}
          onClick={() =>
            patchText({
              fontStyle: fontStyle === "italic" ? "normal" : "italic",
            })
          }
        >
          <ItalicIcon className="size-3.5" />
        </LayerFloatingSettingsButton>
        <LayerFloatingSettingsButton
          active={Boolean(layer.underline)}
          ariaLabel="Underline"
          className={ICON_TOGGLE_CLASS}
          onClick={() => patchText({ underline: !layer.underline })}
        >
          <UnderlineIcon className="size-3.5" />
        </LayerFloatingSettingsButton>
      </div>
      <div className="grid grid-cols-3 gap-1">
        {(
          [
            { label: "Align left", value: "left", icon: AlignLeftIcon },
            { label: "Align center", value: "center", icon: AlignCenterIcon },
            { label: "Align right", value: "right", icon: AlignRightIcon },
          ] as const
        ).map((option) => (
          <LayerFloatingSettingsButton
            active={textAlign === option.value}
            ariaLabel={option.label}
            className={ICON_TOGGLE_CLASS}
            key={option.value}
            onClick={() => patchText({ textAlign: option.value as DraftingTextAlign })}
          >
            <option.icon className="size-3.5" />
          </LayerFloatingSettingsButton>
        ))}
      </div>
    </div>
  )
}

function TextSizeSettings({
  layer,
  onPatch,
  onSelect,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  onSelect?: () => void
}) {
  const fontSize = layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize
  const isEmojiLayer = isDraftingEmojiLayer(layer)

  return (
    <div
      className="flex max-h-52 flex-col gap-0.5 overflow-y-auto pr-0.5"
      data-slot="drafting-layer-text-size-settings"
      role="listbox"
      aria-label="Text size options"
    >
      {COMPACT_TEXT_FONT_SIZES.map((size) => (
        <button
          aria-label={`${size}px`}
          aria-pressed={fontSize === size}
          aria-selected={fontSize === size}
          className={SIZE_OPTION_CLASS}
          key={size}
          role="option"
          type="button"
          onClick={() => {
            onPatch(
              isEmojiLayer
                ? {
                    ...getDraftingEmojiLayerSizePatch(layer, size),
                    textRuns: undefined,
                  }
                : { fontSize: size, textRuns: undefined },
            )
            onSelect?.()
          }}
        >
          <span>{size}</span>
          <span className="text-[10px] font-medium text-white/45">px</span>
        </button>
      ))}
    </div>
  )
}

function EmojiPickerSettings({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <LayerFloatingSettingsPopover
      ariaLabel="Change emoji"
      content={
        <div className="w-[min(18rem,calc(100vw-2rem))]">
          <EmojiPicker
            className="h-[16rem] min-w-0 w-full border-0 bg-transparent p-0 text-white shadow-none [--frimousse-row-height:2rem]"
            columns={8}
            onEmojiSelect={({ emoji }) => {
              onPatch({ text: emoji, textRuns: undefined })
              setOpen(false)
            }}
          >
            <EmojiPickerSearch
              className="border-0 border-b border-white/[0.12] bg-transparent px-0 [&_input]:bg-transparent [&_input]:text-white [&_input]:placeholder:text-white/45"
              placeholder="Search emoji…"
            />
            <EmojiPickerContent className="[&_[data-slot=emoji-picker-category-header]]:hidden [&_[data-slot=emoji-picker-emoji]]:hover:bg-white/[0.11]" />
          </EmojiPicker>
        </div>
      }
      open={open}
      onOpenChange={setOpen}
      trigger={<SmileIcon className="size-4" strokeWidth={2} />}
    />
  )
}

function ImageFitSettings({
  layer,
  onPatch,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const imageFit = layer.imageFit ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageFit
  const opacityPercent = Math.round(layer.opacity * 100)

  return (
    <div className="grid min-w-[11rem] gap-2.5" data-slot="drafting-layer-image-settings">
      <div className="grid grid-cols-2 gap-1">
        {(["cover", "contain"] as const).map((fit) => (
          <LayerFloatingSettingsButton
            active={imageFit === fit}
            ariaLabel={`Image fit ${fit}`}
            className={cn(ICON_TOGGLE_CLASS, "w-full text-[11px] font-semibold capitalize")}
            key={fit}
            onClick={() => onPatch({ imageFit: fit })}
          >
            {fit}
          </LayerFloatingSettingsButton>
        ))}
      </div>
      <SettingsSlider
        label="Opacity"
        max={100}
        min={0}
        value={opacityPercent}
        onChange={(next) => onPatch({ opacity: next / 100 })}
      />
    </div>
  )
}

function TextLayerFloatingSettings({
  layer,
  onPatch,
  theme,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  const [formatOpen, setFormatOpen] = useState(false)
  const [sizeOpen, setSizeOpen] = useState(false)

  if (isDraftingEmojiLayer(layer)) {
    return (
      <>
        <EmojiPickerSettings layer={layer} onPatch={onPatch} />
        <LayerFloatingSettingsPopover
          ariaLabel="Emoji size"
          content={
            <TextSizeSettings
              layer={layer}
              onPatch={onPatch}
              onSelect={() => setSizeOpen(false)}
            />
          }
          open={sizeOpen}
          onOpenChange={setSizeOpen}
          trigger={<ALargeSmallIcon className="size-4" strokeWidth={2} />}
        />
      </>
    )
  }

  return (
    <>
      <FillColorToolbarButton
        ariaLabel="Text color"
        theme={theme}
        title="Text color"
        value={layer.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill}
        onValueChange={(_fill, css) => onPatch({ fill: fillPreviewHex(css), textRuns: undefined })}
      />
      <LayerFloatingSettingsPopover
        ariaLabel="Text formatting"
        content={<TextTypographySettings layer={layer} onPatch={onPatch} />}
        open={formatOpen}
        onOpenChange={setFormatOpen}
        trigger={
          <span aria-hidden className="text-[15px] font-semibold leading-none">
            A
          </span>
        }
      />
      <LayerFloatingSettingsPopover
        ariaLabel="Text size"
        content={
          <TextSizeSettings
            layer={layer}
            onPatch={onPatch}
            onSelect={() => setSizeOpen(false)}
          />
        }
        open={sizeOpen}
        onOpenChange={setSizeOpen}
        trigger={<ALargeSmallIcon className="size-4" strokeWidth={2} />}
      />
    </>
  )
}

export function LayerFloatingToolbarSettings({
  layer,
  onPatch,
  theme = "dark",
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme?: DesktopThemeMode
}) {
  if (layer.kind === "text") {
    return <TextLayerFloatingSettings layer={layer} onPatch={onPatch} theme={theme} />
  }

  if (layer.kind === "shape") {
    return (
      <FillColorToolbarButton
        ariaLabel="Shape color"
        solidOnly={false}
        theme={theme}
        title="Shape fill"
        value={getShapeLayerFillCssValue(layer)}
        onValueChange={(fill, css) => onPatch(patchShapeLayerFillFromPicker(layer, fill, css))}
      />
    )
  }

  if (layer.kind === "image" && !isDraftingIllustrationLayer(layer)) {
    return (
      <LayerFloatingSettingsPopover
        ariaLabel="Image settings"
        content={<ImageFitSettings layer={layer} onPatch={onPatch} />}
        trigger={<ImageIcon className="size-4" strokeWidth={2} />}
      />
    )
  }

  if (isDraftingIllustrationLayer(layer)) {
    return (
      <IllustrationFloatingColorControl layer={layer} onPatch={onPatch} theme={theme} />
    )
  }

  return null
}
