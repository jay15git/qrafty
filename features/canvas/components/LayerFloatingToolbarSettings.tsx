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
import type { Fill } from "@/components/ui/fill-picker/public-api"
import type { DesktopThemeMode } from "@/features/shell/components/FloatingToolbar"
import { DesktopnewThemeContext } from "@/features/shell/inspector/theme-context"
import { useMobileDrawerNavigation } from "@/features/shell/inspector/mobile-drawer-navigation-context"
import { useMobileInspectorDensity } from "@/features/shell/inspector/mobile-inspector-density-context"
import {
  SettingsFillPopover,
  SettingsPopoverChrome,
  SettingsSlider,
} from "@/features/shell/inspector/settings-ui"
import {
  getDesktopLayerFontWeight,
  getNearestDesktopFontWeight,
} from "@/features/shell/model/font-weight"
import {
  DEFAULT_DRAFTING_IMAGE_LAYER,
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
  type DraftingTextAlign,
} from "@/features/canvas/model/layers"
import {
  COMPACT_TEXT_FONT_SIZES,
  getDraftingEmojiLayerSizePatch,
  isDraftingEmojiLayer,
  isDraftingIllustrationLayer,
} from "@/features/canvas/model/layer-floating-settings"
import { IllustrationFloatingColorControl } from "@/features/canvas/components/IllustrationColorControls"
import { resolveDraftingFont } from "@/features/canvas/model/fonts"
import {
  getShapeLayerFillCssValue,
  getTextLayerFillCssValue,
  patchShapeLayerFillFromPicker,
  patchTextLayerFillFromPicker,
} from "@/features/canvas/rendering/shape-fill.utils"
import { cn } from "@/lib/utils"
import { CUELUME_TOGGLE } from "@/features/shell/audio/desktop-cuelume"

import "@/features/shell/inspector/inspector.css"

const COMPACT_POPOVER_CLASS =
  "z-[20001] max-h-[min(32rem,calc(100vh-2rem))] w-auto min-w-[12rem] max-w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-white/[0.12] bg-[#171717] p-3 text-white shadow-[var(--glass-shadow)]"

const ICON_TOGGLE_CLASS =
  "grid size-9 place-items-center rounded-xl text-white/78 transition-[background-color,color] duration-150 hover:bg-white/[0.11] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45 aria-pressed:bg-white/[0.16] aria-pressed:text-white"

const DN_POPOVER_CLASS =
  "dn-portal-surface desktopnew-popover-content z-[20001] max-h-[min(32rem,calc(100vh-2rem))] w-[min(100vw-2rem,15.5rem)] overflow-hidden border-0 p-0 dn-squircle-md"

const DN_OPTION_TILE_CLASS =
  "dn-option-tile dn-control-surface dn-squircle-xs flex cursor-pointer items-center justify-center border-0"

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
        "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-current transition-[background-color,color] duration-150 hover:bg-[var(--layer-toolbar-button-hover-bg,rgba(255,255,255,0.11))] hover:text-[var(--layer-toolbar-button-hover-text,white)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45",
        active && "bg-white/[0.16] text-white",
        className,
      )}
      data-slot="drafting-layer-floating-toolbar-button"
      type={type}
      onPointerDown={(event) => event.stopPropagation()}
      {...CUELUME_TOGGLE}
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
  theme = "dark",
  title,
  trigger,
}: {
  ariaLabel: string
  children?: ReactNode
  content: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  theme?: DesktopThemeMode
  title?: string
  trigger: ReactNode
}) {
  const mobileDensity = useMobileInspectorDensity()
  const mobileNav = useMobileDrawerNavigation()

  if (mobileDensity && mobileNav) {
    return (
      <LayerFloatingSettingsButton
        ariaLabel={ariaLabel}
        data-vaul-no-drag=""
        onClick={() => {
          mobileNav.openDetail({
            title: title ?? ariaLabel,
            content: (
              <div className="dn-portal-surface w-full min-w-0" data-mobile-inspector="">
                {children ?? content}
              </div>
            ),
            onAfterClose: () => onOpenChange?.(false),
          })
          onOpenChange?.(true)
        }}
      >
        {trigger}
      </LayerFloatingSettingsButton>
    )
  }

  if (title) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <LayerFloatingSettingsButton ariaLabel={ariaLabel}>{trigger}</LayerFloatingSettingsButton>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className={cn(DN_POPOVER_CLASS, theme === "dark" && "dark")}
          data-slot="drafting-layer-floating-settings-popover"
          data-theme={theme}
          side="top"
          avoidCollisions
          collisionPadding={12}
          sideOffset={10}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <DesktopnewThemeContext.Provider value={theme}>
            <SettingsPopoverChrome
              title={title}
              onClose={() => onOpenChange?.(false)}
            >
              {children ?? content}
            </SettingsPopoverChrome>
          </DesktopnewThemeContext.Provider>
        </PopoverContent>
      </Popover>
    )
  }

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

export function FillColorToolbarButton({
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

const TEXT_ALIGN_OPTIONS = [
  { label: "Align left", value: "left", icon: AlignLeftIcon },
  { label: "Align center", value: "center", icon: AlignCenterIcon },
  { label: "Align right", value: "right", icon: AlignRightIcon },
] as const

export function TextAlignmentSettings({
  layer,
  onPatch,
  onSelect,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  onSelect?: () => void
}) {
  const textAlign = layer.textAlign ?? DEFAULT_DRAFTING_TEXT_LAYER.textAlign

  return (
    <div
      aria-label="Text alignment"
      className="grid grid-cols-3 gap-1"
      data-slot="drafting-layer-text-align-settings"
      role="group"
    >
      {TEXT_ALIGN_OPTIONS.map((option) => (
        <button
          aria-label={option.label}
          aria-pressed={textAlign === option.value}
          className={DN_OPTION_TILE_CLASS}
          key={option.value}
          type="button"
          {...CUELUME_TOGGLE}
          onClick={() => {
            onPatch({
              textAlign: option.value as DraftingTextAlign,
              textRuns: undefined,
            })
            onSelect?.()
          }}
        >
          <option.icon aria-hidden className="size-4" strokeWidth={2} />
        </button>
      ))}
    </div>
  )
}

export function TextSizeSettings({
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

  function applySize(size: number, close = false) {
    onPatch(
      isEmojiLayer
        ? { ...getDraftingEmojiLayerSizePatch(layer, size), textRuns: undefined }
        : { fontSize: size, textRuns: undefined },
    )
    if (close) {
      onSelect?.()
    }
  }

  return (
    <div
      className="grid w-full gap-2.5"
      data-slot="drafting-layer-text-size-settings"
    >
      <SettingsSlider
        label="Size"
        max={300}
        min={6}
        value={fontSize}
        onChange={(size) => applySize(size)}
      />
      <div
        aria-label="Preset text sizes"
        className="grid grid-cols-4 gap-1"
        role="group"
      >
        {COMPACT_TEXT_FONT_SIZES.map((size) => (
          <button
            aria-label={`${size}px`}
            aria-pressed={fontSize === size}
            className={cn(DN_OPTION_TILE_CLASS, "dn-type-chip")}
            key={size}
            type="button"
            {...CUELUME_TOGGLE}
            onClick={() => applySize(size, true)}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}

function EmojiPickerSettingsContent({
  onPatch,
  onSelect,
}: {
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  onSelect?: () => void
}) {
  return (
    <div className="w-full min-w-0">
      <EmojiPicker
        className="h-[min(16rem,40dvh)] min-w-0 w-full border-0 bg-transparent p-0 shadow-none [--frimousse-row-height:2rem]"
        columns={8}
        onEmojiSelect={({ emoji }) => {
          onPatch({ text: emoji, textRuns: undefined })
          onSelect?.()
        }}
      >
        <EmojiPickerSearch placeholder="Search emoji…" />
        <EmojiPickerContent className="[&_[data-slot=emoji-picker-category-header]]:hidden" />
      </EmojiPicker>
    </div>
  )
}

function EmojiPickerSettings({
  onPatch,
}: {
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  const [open, setOpen] = useState(false)
  const mobileDensity = useMobileInspectorDensity()
  const mobileNav = useMobileDrawerNavigation()

  if (mobileDensity && mobileNav) {
    return (
      <LayerFloatingSettingsButton
        ariaLabel="Change emoji"
        data-vaul-no-drag=""
        onClick={() => {
          mobileNav.openDetail({
            title: "Change emoji",
            content: (
              <div className="dn-portal-surface w-full min-w-0" data-mobile-inspector="">
                <EmojiPickerSettingsContent
                  onPatch={onPatch}
                  onSelect={() => mobileNav.closeDetail()}
                />
              </div>
            ),
            onAfterClose: () => setOpen(false),
          })
          setOpen(true)
        }}
      >
        <SmileIcon className="size-4" strokeWidth={2} />
      </LayerFloatingSettingsButton>
    )
  }

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
  const [alignOpen, setAlignOpen] = useState(false)
  const [sizeOpen, setSizeOpen] = useState(false)

  if (isDraftingEmojiLayer(layer)) {
    return (
      <>
        <EmojiPickerSettings onPatch={onPatch} />
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
          theme={theme}
          title="Size"
          trigger={<ALargeSmallIcon className="size-4" strokeWidth={2} />}
        />
      </>
    )
  }

  const selectedFont = resolveDraftingFont({
    fontFamily: layer.fontFamily,
    fontId: layer.fontId,
  })
  const supportedWeights = selectedFont.weights
  const fontWeight = getDesktopLayerFontWeight(layer.fontWeight, supportedWeights)
  const fontStyle = layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle
  const textAlign = layer.textAlign ?? DEFAULT_DRAFTING_TEXT_LAYER.textAlign
  const AlignIcon = TEXT_ALIGN_OPTIONS.find(
    (option) => option.value === textAlign,
  )?.icon ?? AlignLeftIcon

  function patchText(patch: Partial<DraftingCanvasLayer>) {
    onPatch({ ...patch, textRuns: undefined })
  }

  return (
    <>
      <FillColorToolbarButton
        ariaLabel="Text color"
        solidOnly={false}
        theme={theme}
        title="Text color"
        value={getTextLayerFillCssValue(layer)}
        onValueChange={(fill, css) =>
          patchText(patchTextLayerFillFromPicker(layer, fill, css))
        }
      />
      <LayerFloatingSettingsButton
        active={fontWeight >= 700}
        ariaLabel="Bold"
        onClick={() =>
          patchText({
            fontWeight:
              fontWeight >= 700
                ? getNearestDesktopFontWeight(400, supportedWeights)
                : getNearestDesktopFontWeight(700, supportedWeights),
          })
        }
      >
        <BoldIcon className="size-4" strokeWidth={2} />
      </LayerFloatingSettingsButton>
      <LayerFloatingSettingsButton
        active={fontStyle === "italic"}
        ariaLabel="Italic"
        onClick={() =>
          patchText({ fontStyle: fontStyle === "italic" ? "normal" : "italic" })
        }
      >
        <ItalicIcon className="size-4" strokeWidth={2} />
      </LayerFloatingSettingsButton>
      <LayerFloatingSettingsButton
        active={Boolean(layer.underline)}
        ariaLabel="Underline"
        onClick={() => patchText({ underline: !layer.underline })}
      >
        <UnderlineIcon className="size-4" strokeWidth={2} />
      </LayerFloatingSettingsButton>
      <LayerFloatingSettingsPopover
        ariaLabel="Text alignment"
        content={
          <TextAlignmentSettings
            layer={layer}
            onPatch={onPatch}
            onSelect={() => setAlignOpen(false)}
          />
        }
        open={alignOpen}
        onOpenChange={setAlignOpen}
        theme={theme}
        title="Alignment"
        trigger={<AlignIcon className="size-4" strokeWidth={2} />}
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
        theme={theme}
        title="Size"
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
