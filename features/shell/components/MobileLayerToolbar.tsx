"use client"

import {
  ALargeSmallIcon,
  AlignCenterIcon,
  AlignLeftIcon,
  AlignRightIcon,
  ArrowDown,
  ArrowDownToLine,
  ArrowUp,
  ArrowUpToLine,
  Bold,
  Copy,
  Italic,
  Trash2,
  Type,
  Underline,
} from "lucide-react"
import { lazy, Suspense, useEffect, useRef, type ReactNode } from "react"
import {
  BorderNone02Icon,
  MagicWand05Icon,
  ResourcesAddIcon,
  ScreenRotationIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { ScrollArea } from "@/components/ui/scroll-area"
import type { DesktopThemeMode } from "@/features/shell/components/FloatingToolbar"
import {
  MOBILE_LAYER_TOOLBAR_GAP_PX,
} from "@/features/shell/components/mobile-layer-toolbar-sync"
import type { DesktopInspectorModel } from "@/features/shell/hooks/useDesktopToolbarInspectorModel"
import { DesktopnewThemeContext } from "@/features/shell/inspector/theme-context"
import {
  useMobileDrawerNavigation,
  useMobileLiveDetail,
} from "@/features/shell/inspector/mobile-drawer-navigation-context"
import {
  DesktopCanvasSizeIcon,
  DesktopShadowIcon,
} from "@/features/shell/components/desktop-toolbar-icons"
import { getDesktopLayerToolbarCapabilities } from "@/features/shell/model/layer-toolbar-capabilities"
import { LAYER_FILTER_EFFECT_KINDS } from "@/features/canvas/model/layer-effects"
import { TextFontPickerContent } from "@/features/shell/inspector/text-font-picker-content"
import {
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
} from "@/features/canvas/model/layers"
import {
  FillColorToolbarButton,
  LayerFloatingToolbarSettings,
  TextAlignmentSettings,
  TextSizeSettings,
} from "@/features/canvas/components/LayerFloatingToolbarSettings"
import {
  getTextLayerFillCssValue,
  patchTextLayerFillFromPicker,
} from "@/features/canvas/rendering/shape-fill.utils"
import {
  getDesktopLayerFontWeight,
  getNearestDesktopFontWeight,
} from "@/features/shell/model/font-weight"
import { resolveDraftingFont } from "@/features/canvas/model/fonts"
import { isDraftingEmojiLayer } from "@/features/canvas/model/layer-floating-settings"
import { cn } from "@/lib/utils"

// Heavy detail surfaces (insert menu, layer panels, size presets) load lazily so
// the toolbar does not pay their import cost before a detail page is pushed.
const LazyInsertMenuPanelStack = lazy(() =>
  import("@/features/canvas/components/insert-menu/InsertMenuPanelStack").then(
    (module) => ({ default: module.InsertMenuPanelStack }),
  ),
)
const LazyDesktopCanvasRatioPresetSections = lazy(() =>
  import("@/features/shell/components/DesktopCanvasRatioPresetRow").then(
    (module) => ({ default: module.DesktopCanvasRatioPresetSections }),
  ),
)
const LazyDesktopLayerTransformPanel = lazy(() =>
  import("@/features/shell/components/DesktopLayerSettingsPanel").then(
    (module) => ({ default: module.DesktopLayerTransformPanel }),
  ),
)
const LazyDesktopLayerBorderPanel = lazy(() =>
  import("@/features/shell/components/DesktopLayerSettingsPanel").then(
    (module) => ({ default: module.DesktopLayerBorderPanel }),
  ),
)
const LazyDesktopLayerEffectsPanel = lazy(() =>
  import("@/features/shell/components/DesktopLayerSettingsPanel").then(
    (module) => ({ default: module.DesktopLayerEffectsPanel }),
  ),
)
const LazyDesktopLayerShadowsPanel = lazy(() =>
  import("@/features/shell/components/DesktopLayerSettingsPanel").then(
    (module) => ({ default: module.DesktopLayerShadowsPanel }),
  ),
)

function MobileLayerToolbarButton({
  active = false,
  ariaLabel,
  children,
  disabled = false,
  label,
  onClick,
}: {
  active?: boolean
  ariaLabel: string
  children: ReactNode
  disabled?: boolean
  label?: string
  onClick?: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "dn-mobile-layer-toolbar-button flex h-[var(--settings-icon-hit)] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full text-[var(--fg)] transition-colors aria-[pressed=true]:bg-[var(--fg)] aria-[pressed=true]:text-[var(--bg)] disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fg)]/20",
        label ? "w-auto px-2.5" : "w-[var(--settings-icon-hit)]",
      )}
      data-slot="mobile-layer-toolbar-button"
      data-vaul-no-drag=""
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
      {label ? (
        <span className="whitespace-nowrap text-[11px] font-medium leading-none">
          {label}
        </span>
      ) : null}
    </button>
  )
}

function MobileLayerToolbarSeparator() {
  return (
    <div
      aria-hidden
      className="mx-0.5 h-5 w-px shrink-0 bg-[color-mix(in_srgb,var(--line)_55%,transparent)]"
      data-slot="mobile-layer-toolbar-separator"
    />
  )
}

function MobileLayerToolbarDetailButton({
  ariaLabel,
  content,
  title,
  children,
}: {
  ariaLabel: string
  content: ReactNode
  title: string
  children: ReactNode
}) {
  const mobileNav = useMobileDrawerNavigation()

  return (
    <MobileLayerToolbarButton
      ariaLabel={ariaLabel}
      onClick={() => {
        mobileNav?.openDetail({
          title,
          content: (
            <div className="dn-portal-surface w-full min-w-0" data-mobile-inspector="">
              {content}
            </div>
          ),
        })
      }}
    >
      {children}
    </MobileLayerToolbarButton>
  )
}
/**
 * Icon + label button that pushes a drawer detail page whose content portals
 * live — the panel re-renders with the latest layer props instead of freezing
 * the ReactNode captured when the detail was opened.
 */
function MobileLayerPanelButton({
  ariaLabel,
  content,
  icon,
  label,
}: {
  ariaLabel: string
  content: ReactNode
  icon: ReactNode
  label: string
}) {
  const detail = useMobileLiveDetail({
    content: (
      <div className="dn-portal-surface w-full min-w-0" data-mobile-inspector="">
        <Suspense fallback={null}>{content}</Suspense>
      </div>
    ),
    enabled: true,
    title: label,
  })

  return (
    <>
      <MobileLayerToolbarButton
        ariaLabel={ariaLabel}
        label={label}
        onClick={detail.open}
      >
        {icon}
      </MobileLayerToolbarButton>
      {detail.portal}
    </>
  )
}

const PANEL_ICON_CLASS = "size-4 shrink-0"

/**
 * Mirrors the desktop dynamic island's property panels (Add, Layout, Transform,
 * Border, Effects, Shadows) as drawer detail pages. Same gating rules as
 * `useDesktopIslandItems`.
 */
function MobileLayerPanelTools({
  model,
  theme,
}: {
  model: DesktopInspectorModel
  theme: DesktopThemeMode
}) {
  const navigation = useMobileDrawerNavigation()
  const controller = model.controller

  const insertNodeId = controller?.insertNodeId
  const onInsertLayer = controller?.onInsertLayer
  const onSelectSizeTemplate = controller?.onSceneTemplateSizeTemplateSelect
  const selectedTransformLayer = controller?.selectedTransformLayer
  const onTransformLayerPatch = controller?.onTransformLayerPatch
  const appearance = controller?.appearanceSnapshot
  const onAppearancePatch = controller?.onAppearancePatch
  const selectedElementLayer = controller?.selectedElementLayer
  const onElementLayerPatch = controller?.onElementLayerPatch

  const propertyLayer = selectedTransformLayer ?? selectedElementLayer ?? null
  const propertyCapabilities = getDesktopLayerToolbarCapabilities(propertyLayer)
  const effectsLayer = selectedElementLayer ?? null
  const effectsPatch = onElementLayerPatch

  const canInsert = Boolean(insertNodeId && onInsertLayer)
  const hasLayout = Boolean(onSelectSizeTemplate)
  const hasTransform = Boolean(selectedTransformLayer && onTransformLayerPatch)
  const hasBorder = Boolean(appearance?.supportsBorder && onAppearancePatch)
  const hasEffects = Boolean(
    effectsLayer && effectsPatch && propertyCapabilities.maxEffects > 0,
  )
  // Shadows apply to every selected layer except the card (background). Element
  // layers patch via onElementLayerPatch; QR/group layers via onAppearancePatch.
  const shadowsLayer = selectedElementLayer ?? selectedTransformLayer ?? null
  const shadowsPatch = selectedElementLayer ? onElementLayerPatch : onAppearancePatch
  const hasShadows = Boolean(
    shadowsLayer && shadowsLayer.kind !== "card" && shadowsPatch,
  )

  if (
    !canInsert &&
    !hasLayout &&
    !hasTransform &&
    !hasBorder &&
    !hasEffects &&
    !hasShadows
  ) {
    return null
  }

  const hugeIcon = (icon: Parameters<typeof HugeiconsIcon>[0]["icon"]) => (
    <HugeiconsIcon
      className={PANEL_ICON_CLASS}
      color="currentColor"
      icon={icon}
      size={16}
      strokeWidth={2}
    />
  )

  return (
    <>
      <MobileLayerToolbarSeparator />
      {canInsert ? (
        <MobileLayerPanelButton
          ariaLabel="Add element"
          content={
            <LazyInsertMenuPanelStack
              canAddQrCode={controller?.canAddQrCode}
              isDesktopPopover
              nodeId={insertNodeId!}
              onAddQrCode={controller?.onAddQrCode}
              onBrowseWallpapers={
                controller?.onOpenComposeSidebar
                  ? () => controller.onOpenComposeSidebar?.("wallpapers")
                  : undefined
              }
              onClose={() => navigation?.closeDetail()}
              onInsertLayer={onInsertLayer!}
            />
          }
          icon={hugeIcon(ResourcesAddIcon)}
          label="Add"
        />
      ) : null}
      {hasLayout ? (
        <MobileLayerPanelButton
          ariaLabel="Canvas size"
          content={
            <LazyDesktopCanvasRatioPresetSections
              selectedPresetId={
                controller?.sceneTemplateSettings?.sizeSettings?.sizePresetId
              }
              onSelectTemplate={onSelectSizeTemplate!}
            />
          }
          icon={<DesktopCanvasSizeIcon className={PANEL_ICON_CLASS} />}
          label="Layout"
        />
      ) : null}
      {hasTransform ? (
        <MobileLayerPanelButton
          ariaLabel="Transform"
          content={
            <LazyDesktopLayerTransformPanel
              layer={selectedTransformLayer!}
              onPatch={onTransformLayerPatch!}
              theme={theme}
              variant="flat"
            />
          }
          icon={hugeIcon(ScreenRotationIcon)}
          label="Transform"
        />
      ) : null}
      {hasBorder ? (
        <MobileLayerPanelButton
          ariaLabel="Border"
          content={
            <LazyDesktopLayerBorderPanel
              appearance={appearance!}
              onPatch={onAppearancePatch!}
              theme={theme}
            />
          }
          icon={hugeIcon(BorderNone02Icon)}
          label="Border"
        />
      ) : null}
      {hasEffects ? (
        <MobileLayerPanelButton
          ariaLabel="Effects"
          content={
            <LazyDesktopLayerEffectsPanel
              effectKinds={LAYER_FILTER_EFFECT_KINDS}
              layer={effectsLayer!}
              layerOpacity={appearance?.opacity}
              onLayerOpacityChange={
                appearance && onAppearancePatch
                  ? (opacity) => onAppearancePatch({ opacity })
                  : undefined
              }
              onPatch={effectsPatch!}
              theme={theme}
              variant="flat"
            />
          }
          icon={hugeIcon(MagicWand05Icon)}
          label="Effects"
        />
      ) : null}
      {hasShadows ? (
        <MobileLayerPanelButton
          ariaLabel="Shadows"
          content={
            <LazyDesktopLayerShadowsPanel
              layer={shadowsLayer!}
              onPatch={shadowsPatch!}
              theme={theme}
            />
          }
          icon={<DesktopShadowIcon className={PANEL_ICON_CLASS} />}
          label="Shadows"
        />
      ) : null}
    </>
  )
}


function MobileLayerTextTools({
  layer,
  onPatch,
  theme,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  const mobileNav = useMobileDrawerNavigation()

  if (isDraftingEmojiLayer(layer)) {
    return (
      <div className="flex shrink-0 items-center gap-0.5" data-slot="mobile-layer-toolbar-settings">
        <LayerFloatingToolbarSettings layer={layer} onPatch={onPatch} theme={theme} />
      </div>
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
  const AlignIcon =
    textAlign === "center"
      ? AlignCenterIcon
      : textAlign === "right"
        ? AlignRightIcon
        : AlignLeftIcon

  function patchText(patch: Partial<DraftingCanvasLayer>) {
    onPatch({ ...patch, textRuns: undefined })
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5" data-slot="mobile-layer-toolbar-settings">
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
      <MobileLayerToolbarDetailButton
        ariaLabel="Text font"
        content={
          <TextFontPickerContent
            layer={layer}
            onPatch={onPatch}
            onSelect={() => mobileNav?.closeDetail()}
          />
        }
        title="Text font"
      >
        <Type className="size-4" strokeWidth={2} />
      </MobileLayerToolbarDetailButton>
      <MobileLayerToolbarButton
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
        <Bold className="size-4" strokeWidth={2} />
      </MobileLayerToolbarButton>
      <MobileLayerToolbarButton
        active={fontStyle === "italic"}
        ariaLabel="Italic"
        onClick={() =>
          patchText({ fontStyle: fontStyle === "italic" ? "normal" : "italic" })
        }
      >
        <Italic className="size-4" strokeWidth={2} />
      </MobileLayerToolbarButton>
      <MobileLayerToolbarButton
        active={Boolean(layer.underline)}
        ariaLabel="Underline"
        onClick={() => patchText({ underline: !layer.underline })}
      >
        <Underline className="size-4" strokeWidth={2} />
      </MobileLayerToolbarButton>
      <MobileLayerToolbarDetailButton
        ariaLabel="Text alignment"
        content={
          <TextAlignmentSettings
            layer={layer}
            onPatch={onPatch}
            onSelect={() => mobileNav?.closeDetail()}
          />
        }
        title="Alignment"
      >
        <AlignIcon className="size-4" strokeWidth={2} />
      </MobileLayerToolbarDetailButton>
      <MobileLayerToolbarDetailButton
        ariaLabel="Text size"
        content={
          <TextSizeSettings
            layer={layer}
            onPatch={onPatch}
          />
        }
        title="Size"
      >
        <ALargeSmallIcon className="size-4" strokeWidth={2} />
      </MobileLayerToolbarDetailButton>
    </div>
  )
}

function MobileLayerSpecificTools({
  layer,
  onPatch,
  theme,
}: {
  layer: DraftingCanvasLayer
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  if (layer.kind === "text") {
    return <MobileLayerTextTools layer={layer} onPatch={onPatch} theme={theme} />
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5" data-slot="mobile-layer-toolbar-settings">
      <LayerFloatingToolbarSettings layer={layer} onPatch={onPatch} theme={theme} />
    </div>
  )
}

export function MobileLayerToolbar({
  model,
  onToolbarHeightChange,
  theme,
}: {
  model: DesktopInspectorModel
  onToolbarHeightChange: (height: number) => void
  theme: DesktopThemeMode
}) {
  const controller = model.controller
  const selectedLayerIds = controller?.selectedLayerIds ?? []
  const selectedElementLayer = controller?.selectedElementLayer
  const onElementLayerPatch = controller?.onElementLayerPatch
  const toolbarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = toolbarRef.current
    if (!node || selectedLayerIds.length === 0) {
      onToolbarHeightChange(0)
      return
    }

    const updateHeight = () => {
      onToolbarHeightChange(Math.round(node.getBoundingClientRect().height))
    }

    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(node)

    return () => {
      observer.disconnect()
      onToolbarHeightChange(0)
    }
  }, [onToolbarHeightChange, selectedLayerIds.length])

  if (selectedLayerIds.length === 0) {
    return null
  }

  const canCopy = Boolean(controller?.canCopyLayers && controller?.onLayerCopy)
  const canDelete = selectedLayerIds.some(
    (layerId) => controller?.canDeleteLayer?.(layerId) ?? false,
  )
  const canReorder = Boolean(controller?.onLayerMenuAction)

  const showLayerTools =
    selectedLayerIds.length === 1 &&
    selectedElementLayer &&
    onElementLayerPatch &&
    (selectedElementLayer.kind === "text" ||
      selectedElementLayer.kind === "shape" ||
      selectedElementLayer.kind === "image" ||
      selectedElementLayer.kind === "shader")

  return (
    <DesktopnewThemeContext.Provider value={theme}>
      <div
        ref={toolbarRef}
        className={cn(
          "desktopnew-root pointer-events-auto fixed z-[35]",
          "left-[max(1rem,env(safe-area-inset-left,0px))]",
          "w-[calc(100%-max(1rem,env(safe-area-inset-left,0px))-max(1rem,env(safe-area-inset-right,0px)))]",
        )}
        data-desktop-theme={theme}
        data-mobile-inspector=""
        data-slot="mobile-layer-toolbar"
        data-theme={theme}
        style={{
          bottom: `calc(var(--mobile-drawer-height, 0px) + ${MOBILE_LAYER_TOOLBAR_GAP_PX}px)`,
        }}
      >
        <ScrollArea
          className="dn-mobile-layer-toolbar-scroll h-fit w-full min-w-0 max-w-full overflow-hidden rounded-full bg-[var(--bg)]"
          chevron={false}
          cueSize="tight"
          orientation="horizontal"
          persistKey="mobile-layer-toolbar"
          scrollFade
          showScrollbar={false}
          viewportClassName="min-w-0 w-full max-w-full"
        >
          <div
            className="flex min-w-max items-center gap-0.5 px-2 py-1"
            data-slot="mobile-layer-toolbar-row"
            role="toolbar"
            aria-label="Layer actions"
          >
            {showLayerTools ? (
              <>
                <MobileLayerSpecificTools
                  layer={selectedElementLayer!}
                  onPatch={onElementLayerPatch!}
                  theme={theme}
                />
                <MobileLayerToolbarSeparator />
              </>
            ) : null}
            <MobileLayerToolbarButton
              ariaLabel="Copy selection"
              disabled={!canCopy}
              onClick={() => controller?.onLayerCopy?.()}
            >
              <Copy className="size-4" strokeWidth={2} />
            </MobileLayerToolbarButton>
            <MobileLayerToolbarButton
              ariaLabel="Delete selection"
              disabled={!canDelete || !controller?.onLayerMenuAction}
              onClick={() => controller?.onLayerMenuAction?.("delete")}
            >
              <Trash2 className="size-4" strokeWidth={2} />
            </MobileLayerToolbarButton>
            <MobileLayerToolbarSeparator />
            <MobileLayerToolbarButton
              ariaLabel="Bring to front"
              disabled={!canReorder}
              onClick={() => controller?.onLayerMenuAction?.("front")}
            >
              <ArrowUpToLine className="size-4" strokeWidth={2} />
            </MobileLayerToolbarButton>
            <MobileLayerToolbarButton
              ariaLabel="Bring forward"
              disabled={!canReorder}
              onClick={() => controller?.onLayerMenuAction?.("forward")}
            >
              <ArrowUp className="size-4" strokeWidth={2} />
            </MobileLayerToolbarButton>
            <MobileLayerToolbarButton
              ariaLabel="Send backward"
              disabled={!canReorder}
              onClick={() => controller?.onLayerMenuAction?.("backward")}
            >
              <ArrowDown className="size-4" strokeWidth={2} />
            </MobileLayerToolbarButton>
            <MobileLayerToolbarButton
              ariaLabel="Send to back"
              disabled={!canReorder}
              onClick={() => controller?.onLayerMenuAction?.("back")}
            >
              <ArrowDownToLine className="size-4" strokeWidth={2} />
            </MobileLayerToolbarButton>
            <MobileLayerPanelTools model={model} theme={theme} />
          </div>
        </ScrollArea>
      </div>
    </DesktopnewThemeContext.Provider>
  )
}
