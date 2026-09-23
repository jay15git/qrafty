"use client"

import { useMemo, type ReactNode } from "react"
import { PaletteIcon } from "lucide-react"
import {
  BorderNone02Icon,
  MagicWand05Icon,
  ResourcesAddIcon,
  ScreenRotationIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { DesktopCanvasRatioPresetPopoverContent } from "@/features/shell/components/DesktopCanvasRatioPresetRow"
import {
  DesktopCanvasSizeIcon,
  DesktopShadowIcon,
} from "@/features/shell/components/desktop-toolbar-icons"
import {
  DesktopLayerBorderPanel,
  DesktopLayerEffectsPanel,
  DesktopLayerShadowsPanel,
  DesktopLayerStylePanel,
  DesktopLayerTransformPanel,
} from "@/features/shell/components/DesktopLayerSettingsPanel"
import { DesktopToolbarPopoverContent } from "@/features/shell/components/DesktopToolbarPopover"
import type { DesktopThemeMode } from "@/features/shell/components/FloatingToolbar"
import { InsertMenuPopoverContent } from "@/features/canvas/components/insert-menu/InsertMenuPopoverContent"
import type { DesktopAppearanceSnapshot } from "@/features/shell/model/appearance"
import { getDesktopLayerToolbarCapabilities } from "@/features/shell/model/layer-toolbar-capabilities"
import { TooltipNavbar, type TooltipItem } from "@/components/ui/tooltip-navbar"
import { LAYER_FILTER_EFFECT_KINDS } from "@/features/canvas/model/layer-effects"
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared"
import type { SizeTemplate } from "@/features/canvas/model/size-templates"
import type { DesktopCardSizeSettings } from "@/features/shell/model/card-size-settings"

const ICON_CLASS = "size-4 shrink-0"

type DesktopDynamicIslandChromeProps = {
  appearance?: DesktopAppearanceSnapshot | null
  appearanceLayer?: DraftingCanvasLayer | null
  canAddQrCode?: boolean

  insertNodeId?: string

  onAddQrCode?: () => void
  onAppearancePatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onBrowseWallpapers?: () => void
  onElementLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onInsertLayer?: (layer: DraftingCanvasLayer) => void

  onTransformLayerPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onSelectSizeTemplate?: (template: SizeTemplate) => void
  onSizeChange?: (patch: Partial<DesktopCardSizeSettings>) => void
  selectedElementLayer?: DraftingCanvasLayer | null
  selectedTransformLayer?: DraftingCanvasLayer | null
  sizePresetId?: string
  sizeSettings?: DesktopCardSizeSettings
  theme?: DesktopThemeMode
}

function useDesktopIslandItems({
  appearance,
  appearanceLayer,
  canAddQrCode,

  insertNodeId,

  onAddQrCode,
  onAppearancePatch,
  onBrowseWallpapers,
  onElementLayerPatch,
  onInsertLayer,

  onTransformLayerPatch,
  onSelectSizeTemplate,
  onSizeChange,
  selectedElementLayer,
  selectedTransformLayer,
  sizePresetId,
  sizeSettings,
  theme,
}: Omit<DesktopDynamicIslandChromeProps, "theme"> & {
  theme: DesktopThemeMode
}) {
  const propertyLayer = selectedTransformLayer ?? selectedElementLayer ?? appearanceLayer ?? null
  const propertyCapabilities = getDesktopLayerToolbarCapabilities(propertyLayer)
  const effectsLayer = selectedElementLayer ?? appearanceLayer ?? null
  const effectsPatch = selectedElementLayer ? onElementLayerPatch : onAppearancePatch
  const hasTransform = Boolean(selectedTransformLayer && onTransformLayerPatch)
  const hasStyle = Boolean(selectedElementLayer && onElementLayerPatch)
  // Shadows apply to every selected layer except the card (background). Element
  // layers patch via onElementLayerPatch; QR/group layers via onAppearancePatch.
  const shadowsLayer = selectedElementLayer ?? selectedTransformLayer ?? null
  const shadowsPatch = selectedElementLayer ? onElementLayerPatch : onAppearancePatch
  const hasShadows = Boolean(
    shadowsLayer && shadowsLayer.kind !== "card" && shadowsPatch,
  )
  const hasBorder = Boolean(appearance?.supportsBorder && onAppearancePatch)
  const hasEffects = Boolean(
    effectsLayer && effectsPatch && propertyCapabilities.maxEffects > 0,
  )
  const canInsert = Boolean(insertNodeId && onInsertLayer)

  const items = useMemo(() => {
    const hugeIcon = (icon: Parameters<typeof HugeiconsIcon>[0]["icon"]) => (
      <HugeiconsIcon
        className={ICON_CLASS}
        color="currentColor"
        icon={icon}
        size={16}
        strokeWidth={2}
      />
    )
    const panelItem = (
      label: string,
      slot: string,
      icon: ReactNode,
      panel: ReactNode,
      labeled = false,
    ): TooltipItem => ({
      ariaLabel: label,
      dataSlot: `${slot}-trigger`,
      group: "tools",
      icon,
      label,
      variant: labeled ? "icon-label" : undefined,
      popover: (
        <DesktopToolbarPopoverContent dataSlot={`${slot}-popover`} theme={theme} title={label}>
          {panel}
        </DesktopToolbarPopoverContent>
      ),
    })

    const nextItems: TooltipItem[] = []

    if (onSelectSizeTemplate) {
      nextItems.push({
        ariaLabel: "Canvas size",
        dataSlot: "desktop-canvas-size-trigger",
        group: "tools",
        icon: <DesktopCanvasSizeIcon className={ICON_CLASS} />,
        label: "Layout",
        variant: "icon-label",
        popover: (
          <DesktopCanvasRatioPresetPopoverContent
            onSelectTemplate={onSelectSizeTemplate}
            onSizeChange={onSizeChange}
            selectedPresetId={sizePresetId}
            sizeSettings={sizeSettings}
            theme={theme}
          />
        ),
      })
    }

    if (hasTransform) {
      nextItems.push(
        panelItem(
          "Transform",
          "desktop-layer-transform",
          hugeIcon(ScreenRotationIcon),
          <DesktopLayerTransformPanel
            layer={selectedTransformLayer!}
            onPatch={onTransformLayerPatch!}
            theme={theme}
            variant="flat"
          />,
          true,
        ),
      )
    }

    if (hasStyle) {
      nextItems.push(
        panelItem(
          "Style",
          "desktop-layer-style",
          <PaletteIcon className={ICON_CLASS} />,
          <DesktopLayerStylePanel
            layer={selectedElementLayer!}
            onPatch={onElementLayerPatch!}
            theme={theme}
          />,
        ),
      )
    }

    if (hasBorder) {
      nextItems.push(
        panelItem(
          "Border",
          "desktop-layer-border",
          hugeIcon(BorderNone02Icon),
          <DesktopLayerBorderPanel
            appearance={appearance!}
            onPatch={onAppearancePatch!}
            theme={theme}
          />,
          true,
        ),
      )
    }

    if (hasShadows) {
      nextItems.push(
        panelItem(
          "Shadows",
          "desktop-layer-shadows",
          <DesktopShadowIcon className={ICON_CLASS} />,
          <DesktopLayerShadowsPanel
            layer={shadowsLayer!}
            onPatch={shadowsPatch!}
            theme={theme}
          />,
          true,
        ),
      )
    }

    if (hasEffects) {
      nextItems.push(
        panelItem(
          "Effects",
          "desktop-layer-effects",
          hugeIcon(MagicWand05Icon),
          <DesktopLayerEffectsPanel
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
          />,
          true,
        ),
      )
    }

    if (canInsert) {
      nextItems.push({
        ariaLabel: "Add element",
        dataSlot: "desktop-insert-trigger",
        group: "tools",
        icon: hugeIcon(ResourcesAddIcon),
        label: "Add",
        variant: "icon-label",
        popover: (
          <InsertMenuPopoverContent
            canAddQrCode={canAddQrCode}
            isDesktopPopover
            nodeId={insertNodeId!}
            onAddQrCode={onAddQrCode}
            onBrowseWallpapers={onBrowseWallpapers}
            onInsertLayer={onInsertLayer!}
            theme={theme}
          />
        ),
      })
    }

    return nextItems
  }, [
    appearance,
    canAddQrCode,

    canInsert,
    effectsLayer,
    effectsPatch,
    hasBorder,
    hasEffects,

    hasShadows,
    hasStyle,
    hasTransform,
    insertNodeId,
    onAddQrCode,
    onAppearancePatch,
    onBrowseWallpapers,
    onElementLayerPatch,
    onInsertLayer,
    onSelectSizeTemplate,
    onSizeChange,
    onTransformLayerPatch,
    selectedElementLayer,
    selectedTransformLayer,
    shadowsLayer,
    shadowsPatch,
    sizePresetId,
    sizeSettings,
    theme,
  ])

  return items
}

export function useDesktopToolbarItems(
  props: Omit<DesktopDynamicIslandChromeProps, "theme"> & {
    theme?: DesktopThemeMode
  },
) {
  const theme = props.theme ?? "dark"
  return useDesktopIslandItems({ ...props, theme })
}

export function DesktopDynamicIslandChrome({
  items,
}: {
  items: TooltipItem[]
}) {
  return (
    <div data-slot="desktop-dynamic-island-content">
      <TooltipNavbar items={items} />
    </div>
  )
}

