"use client";

import { forwardRef, useState, type ComponentProps, type ReactNode } from "react";
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
} from "lucide-react";

import { EmojiPicker, EmojiPickerContent, EmojiPickerSearch } from "@/components/ui/emoji-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Fill } from "@/components/ui/fill-picker/public-api";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import { SettingsThemeContext } from "@/features/shell/settings/theme-context";
import { useMobileDrawerNavigation } from "@/features/shell/settings/MobileDrawerNavigationContext";
import { useMobileSettingsDensity } from "@/features/shell/settings/MobileSettingsDensityContext";
import {
  SettingsFillPopover,
  SettingsPopoverChrome,
  SettingsSlider,
} from "@/features/shell/settings/settings-ui";
import { getLayerFontWeight, getNearestFontWeight } from "@/features/shell/model/font-weight";
import {
  DEFAULT_DRAFTING_IMAGE_LAYER,
  DEFAULT_DRAFTING_TEXT_LAYER,
  type CanvasLayer,
  type CanvasTextAlign,
} from "@/features/canvas/model/layers/shared";
import {
  getCanvasEmojiLayerSizePatch,
  isCanvasEmojiLayer,
  isCanvasIllustrationLayer,
} from "@/features/canvas/model/layer-floating-settings";
import { IllustrationFloatingColorControl } from "@/features/canvas/components/IllustrationColorControls";
import { resolveCanvasFont } from "@/features/canvas/model/fonts";
import {
  getShapeLayerFillCssValue,
  getTextLayerFillCssValue,
  patchShapeLayerFillFromPicker,
  patchTextLayerFillFromPicker,
} from "@/features/canvas/rendering/layer-fill";
import { cn } from "@/lib/utils";
import { CUELUME_TOGGLE } from "@/features/shell/audio/cuelume";

import "@/features/shell/settings/settings.css";

const COMPACT_POPOVER_CLASS =
  "ds-portal-surface ds-popover-content ds-popover-flat z-[var(--z-popover-raised)] max-h-[min(32rem,calc(100vh-2rem))] w-auto min-w-[12rem] max-w-[min(22rem,calc(100vw-2rem))] overflow-hidden ds-squircle-md";

const ICON_TOGGLE_CLASS =
  "grid size-9 place-items-center rounded-full text-[color-mix(in_srgb,var(--fg)_78%,transparent)] transition-colors duration-150 hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,var(--ring))] aria-pressed:bg-[var(--control)] aria-pressed:text-[var(--fg)]";

const DN_POPOVER_CLASS =
  "ds-portal-surface ds-popover-content z-[var(--z-popover-raised)] max-h-[min(32rem,calc(100vh-2rem))] w-[min(100vw-2rem,15.5rem)] overflow-hidden border-0 p-0 ds-squircle-md";

const DN_OPTION_TILE_CLASS =
  "ds-option-tile ds-control-surface ds-squircle-xs flex cursor-pointer items-center justify-center border-0";

const LayerFloatingSettingsButton = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button"> & {
    active?: boolean;
    ariaLabel: string;
    className?: string;
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
        "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-current transition-colors duration-150 hover:text-[var(--fg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring,var(--ring))]",
        active && "bg-[var(--control)] text-[var(--fg)]",
        className,
      )}
      data-slot="canvas-layer-floating-toolbar-button"
      type={type}
      onPointerDown={(event) => event.stopPropagation()}
      {...CUELUME_TOGGLE}
      {...props}
    >
      {children}
    </button>
  );
});

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
  ariaLabel: string;
  children?: ReactNode;
  content: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  theme?: ThemeMode;
  title?: string;
  trigger: ReactNode;
}) {
  const mobileDensity = useMobileSettingsDensity();
  const mobileNav = useMobileDrawerNavigation();

  if (mobileDensity && mobileNav) {
    return (
      <LayerFloatingSettingsButton
        ariaLabel={ariaLabel}
        data-vaul-no-drag=""
        onClick={() => {
          mobileNav.openDetail({
            title: title ?? ariaLabel,
            content: (
              <div className="ds-portal-surface w-full min-w-0" data-mobile-settings="">
                {children ?? content}
              </div>
            ),
            onAfterClose: () => onOpenChange?.(false),
          });
          onOpenChange?.(true);
        }}
      >
        {trigger}
      </LayerFloatingSettingsButton>
    );
  }

  if (title) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <LayerFloatingSettingsButton ariaLabel={ariaLabel}>{trigger}</LayerFloatingSettingsButton>
        </PopoverTrigger>
        <PopoverContent
          align="center"
          className={cn(DN_POPOVER_CLASS, "ds-popover-flat", theme === "dark" && "dark")}
          data-slot="canvas-layer-floating-settings-popover"
          data-theme={theme}
          side="top"
          avoidCollisions
          collisionPadding={12}
          sideOffset={10}
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <SettingsThemeContext.Provider value={theme}>
            <SettingsPopoverChrome title={title} onClose={() => onOpenChange?.(false)}>
              {children ?? content}
            </SettingsPopoverChrome>
          </SettingsThemeContext.Provider>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <LayerFloatingSettingsButton ariaLabel={ariaLabel}>{trigger}</LayerFloatingSettingsButton>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        className={cn(COMPACT_POPOVER_CLASS, theme === "dark" && "dark")}
        data-slot="canvas-layer-floating-settings-popover"
        data-theme={theme}
        side="top"
        avoidCollisions
        collisionPadding={12}
        sideOffset={10}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <ScrollArea
          chevron={false}
          className="max-h-[min(32rem,calc(100vh-2rem))]"
          cueSize="tight"
          scrollFade
          viewportClassName="p-3"
        >
          {children ?? content}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export function FillColorToolbarButton({
  ariaLabel,
  onValueChange,
  solidOnly = true,
  theme,
  title,
  value,
}: {
  ariaLabel: string;
  onValueChange: (fill: Fill, css: string) => void;
  solidOnly?: boolean;
  theme: ThemeMode;
  title: string;
  value: string;
}) {
  return (
    <div
      className="flex size-9 shrink-0 items-center justify-center"
      data-slot="canvas-layer-floating-toolbar-color"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <SettingsThemeContext.Provider value={theme}>
        <SettingsFillPopover
          align="center"
          collisionPadding={12}
          hint={ariaLabel}
          side="top"
          solidOnly={solidOnly}
          title={title}
          value={value}
          triggerClassName="size-9 rounded-full [&>span]:size-7 [&>span]:rounded-full"
          variant="swatch"
          onValueChange={onValueChange}
        />
      </SettingsThemeContext.Provider>
    </div>
  );
}

const TEXT_ALIGN_OPTIONS = [
  { label: "Align left", value: "left", icon: AlignLeftIcon },
  { label: "Align center", value: "center", icon: AlignCenterIcon },
  { label: "Align right", value: "right", icon: AlignRightIcon },
] as const;

export function TextAlignmentSettings({
  layer,
  onPatch,
  onSelect,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
  onSelect?: () => void;
}) {
  const textAlign = layer.textAlign ?? DEFAULT_DRAFTING_TEXT_LAYER.textAlign;

  return (
    <div
      aria-label="Text alignment"
      className="grid grid-cols-3 gap-1"
      data-slot="canvas-layer-text-align-settings"
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
              textAlign: option.value as CanvasTextAlign,
              textRuns: undefined,
            });
            onSelect?.();
          }}
        >
          <option.icon aria-hidden className="size-4" strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}

export function TextSizeSettings({
  layer,
  onPatch,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
}) {
  const fontSize = layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize;
  const isEmojiLayer = isCanvasEmojiLayer(layer);

  function applySize(size: number) {
    onPatch(
      isEmojiLayer
        ? { ...getCanvasEmojiLayerSizePatch(layer, size), textRuns: undefined }
        : { fontSize: size, textRuns: undefined },
    );
  }

  return (
    <div className="grid w-full gap-2.5" data-slot="canvas-layer-text-size-settings">
      <SettingsSlider
        label="Size"
        max={300}
        min={6}
        value={fontSize}
        onChange={(size) => applySize(size)}
      />
    </div>
  );
}

function EmojiPickerSettingsContent({
  onPatch,
  onSelect,
}: {
  onPatch: (patch: Partial<CanvasLayer>) => void;
  onSelect?: () => void;
}) {
  return (
    <div className="w-full min-w-0">
      <EmojiPicker
        className="h-[min(16rem,40dvh)] min-w-0 w-full border-0 bg-transparent p-0 shadow-none [--frimousse-row-height:2rem]"
        columns={8}
        onEmojiSelect={({ emoji }) => {
          onPatch({ text: emoji, textRuns: undefined });
          onSelect?.();
        }}
      >
        <EmojiPickerSearch placeholder="Search emoji…" />
        <EmojiPickerContent className="[&_[data-slot=emoji-picker-category-header]]:hidden" />
      </EmojiPicker>
    </div>
  );
}

function EmojiPickerSettings({ onPatch }: { onPatch: (patch: Partial<CanvasLayer>) => void }) {
  const [open, setOpen] = useState(false);
  const mobileDensity = useMobileSettingsDensity();
  const mobileNav = useMobileDrawerNavigation();

  if (mobileDensity && mobileNav) {
    return (
      <LayerFloatingSettingsButton
        ariaLabel="Change emoji"
        data-vaul-no-drag=""
        onClick={() => {
          mobileNav.openDetail({
            title: "Change emoji",
            content: (
              <div className="ds-portal-surface w-full min-w-0" data-mobile-settings="">
                <EmojiPickerSettingsContent
                  onPatch={onPatch}
                  onSelect={() => mobileNav.closeDetail()}
                />
              </div>
            ),
            onAfterClose: () => setOpen(false),
          });
          setOpen(true);
        }}
      >
        <SmileIcon className="size-4" strokeWidth={2} />
      </LayerFloatingSettingsButton>
    );
  }

  return (
    <LayerFloatingSettingsPopover
      ariaLabel="Change emoji"
      content={
        <div className="w-[min(18rem,calc(100vw-2rem))]">
          <EmojiPicker
            className="h-[16rem] min-w-0 w-full border-0 bg-transparent p-0 text-[var(--fg)] shadow-none [--frimousse-row-height:2rem]"
            columns={8}
            onEmojiSelect={({ emoji }) => {
              onPatch({ text: emoji, textRuns: undefined });
              setOpen(false);
            }}
          >
            <EmojiPickerSearch
              className="border-0 border-b border-[var(--line)] bg-transparent px-0 [&_input]:bg-transparent [&_input]:text-[var(--fg)] [&_input]:placeholder:text-[var(--muted)]"
              placeholder="Search emoji…"
            />
            <EmojiPickerContent className="[&_[data-slot=emoji-picker-category-header]]:hidden [&_[data-slot=emoji-picker-emoji]]:hover:bg-[var(--control)]" />
          </EmojiPicker>
        </div>
      }
      open={open}
      onOpenChange={setOpen}
      trigger={<SmileIcon className="size-4" strokeWidth={2} />}
    />
  );
}

function ImageFitSettings({
  layer,
  onPatch,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
}) {
  const imageFit = layer.imageFit ?? DEFAULT_DRAFTING_IMAGE_LAYER.imageFit;
  const opacityPercent = Math.round(layer.opacity * 100);

  return (
    <div className="grid min-w-[11rem] gap-2.5" data-slot="canvas-layer-image-settings">
      <div className="grid grid-cols-2 gap-1">
        {(["cover", "contain"] as const).map((fit) => (
          <LayerFloatingSettingsButton
            active={imageFit === fit}
            ariaLabel={`Image fit ${fit}`}
            className={cn(
              ICON_TOGGLE_CLASS,
              "w-full text-[length:var(--type-meta)] font-semibold capitalize",
            )}
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
  );
}

function TextLayerFloatingSettings({
  layer,
  onPatch,
  theme,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
  theme: ThemeMode;
}) {
  const [alignOpen, setAlignOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);

  if (isCanvasEmojiLayer(layer)) {
    return (
      <>
        <EmojiPickerSettings onPatch={onPatch} />
        <LayerFloatingSettingsPopover
          ariaLabel="Emoji size"
          content={<TextSizeSettings layer={layer} onPatch={onPatch} />}
          open={sizeOpen}
          onOpenChange={setSizeOpen}
          theme={theme}
          title="Size"
          trigger={<ALargeSmallIcon className="size-4" strokeWidth={2} />}
        />
      </>
    );
  }

  const selectedFont = resolveCanvasFont({
    fontFamily: layer.fontFamily,
    fontId: layer.fontId,
  });
  const supportedWeights = selectedFont.weights;
  const fontWeight = getLayerFontWeight(layer.fontWeight, supportedWeights);
  const fontStyle = layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle;
  const textAlign = layer.textAlign ?? DEFAULT_DRAFTING_TEXT_LAYER.textAlign;
  const AlignIcon =
    TEXT_ALIGN_OPTIONS.find((option) => option.value === textAlign)?.icon ?? AlignLeftIcon;

  function patchText(patch: Partial<CanvasLayer>) {
    onPatch({ ...patch, textRuns: undefined });
  }

  return (
    <>
      <FillColorToolbarButton
        ariaLabel="Text color"
        solidOnly={false}
        theme={theme}
        title="Text color"
        value={getTextLayerFillCssValue(layer)}
        onValueChange={(fill, css) => patchText(patchTextLayerFillFromPicker(layer, fill, css))}
      />
      <LayerFloatingSettingsButton
        active={fontWeight >= 700}
        ariaLabel="Bold"
        onClick={() =>
          patchText({
            fontWeight:
              fontWeight >= 700
                ? getNearestFontWeight(400, supportedWeights)
                : getNearestFontWeight(700, supportedWeights),
          })
        }
      >
        <BoldIcon className="size-4" strokeWidth={2} />
      </LayerFloatingSettingsButton>
      <LayerFloatingSettingsButton
        active={fontStyle === "italic"}
        ariaLabel="Italic"
        onClick={() => patchText({ fontStyle: fontStyle === "italic" ? "normal" : "italic" })}
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
        content={<TextSizeSettings layer={layer} onPatch={onPatch} />}
        open={sizeOpen}
        onOpenChange={setSizeOpen}
        theme={theme}
        title="Size"
        trigger={<ALargeSmallIcon className="size-4" strokeWidth={2} />}
      />
    </>
  );
}

export function FloatingLayerToolbarSettings({
  layer,
  onPatch,
  theme = "dark",
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
  theme?: ThemeMode;
}) {
  if (layer.kind === "text") {
    return <TextLayerFloatingSettings layer={layer} onPatch={onPatch} theme={theme} />;
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
    );
  }

  if (layer.kind === "image" && !isCanvasIllustrationLayer(layer)) {
    return (
      <LayerFloatingSettingsPopover
        ariaLabel="Image settings"
        content={<ImageFitSettings layer={layer} onPatch={onPatch} />}
        trigger={<ImageIcon className="size-4" strokeWidth={2} />}
      />
    );
  }

  if (isCanvasIllustrationLayer(layer)) {
    return <IllustrationFloatingColorControl layer={layer} onPatch={onPatch} theme={theme} />;
  }

  return null;
}
