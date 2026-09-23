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

import { CanvasRatioPresetPopoverContent } from "@/features/shell/components/CanvasRatioPresetRow"
import {
  CanvasSizeIcon,
  ShadowIcon,
} from "@/features/shell/components/toolbar-icons"
import {
  LayerBorderPanel,
  LayerEffectsPanel,
  LayerShadowsPanel,
  LayerStylePanel,
  LayerTransformPanel,
} from "@/features/shell/components/LayerSettingsPanel"
import { ToolbarPopoverContent } from "@/features/shell/components/ToolbarPopover"
import type { ThemeMode } from "@/features/shell/components/FloatingToolbar"
import { InsertMenuPopoverContent } from "@/features/canvas/components/insert-menu/InsertMenuPopoverContent"
import type { AppearanceSnapshot } from "@/features/shell/model/appearance"
import { getLayerToolbarCapabilities } from "@/features/shell/model/layer-toolbar-capabilities"
import { TooltipNavbar, type TooltipItem } from "@/components/ui/tooltip-navbar"
import { LAYER_FILTER_EFFECT_KINDS } from "@/features/canvas/model/layer-effects"
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared"
import type { SizeTemplate } from "@/features/canvas/model/size-templates"
import type { CardSizeSettings } from "@/features/shell/model/card-size-settings"

const ICON_CLASS = "size-4 shrink-0"

type DynamicIslandProps = {
  appearance?: AppearanceSnapshot | null
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
  onSizeChange?: (patch: Partial<CardSizeSettings>) => void
  selectedElementLayer?: DraftingCanvasLayer | null
  selectedTransformLayer?: DraftingCanvasLayer | null
  sizePresetId?: string
  sizeSettings?: CardSizeSettings
  theme?: ThemeMode
}

function useIslandItems({
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
}: Omit<DynamicIslandProps, "theme"> & {
  theme: ThemeMode
}) {
  const propertyLayer = selectedTransformLayer ?? selectedElementLayer ?? appearanceLayer ?? null
  const propertyCapabilities = getLayerToolbarCapabilities(propertyLayer)
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
        <ToolbarPopoverContent dataSlot={`${slot}-popover`} theme={theme} title={label}>
          {panel}
        </ToolbarPopoverContent>
      ),
    })

    const nextItems: TooltipItem[] = []

    if (onSelectSizeTemplate) {
      nextItems.push({
        ariaLabel: "Canvas size",
        dataSlot: "canvas-size-trigger",
        group: "tools",
        icon: <CanvasSizeIcon className={ICON_CLASS} />,
        label: "Layout",
        variant: "icon-label",
        popover: (
          <CanvasRatioPresetPopoverContent
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
          "layer-transform",
          hugeIcon(ScreenRotationIcon),
          <LayerTransformPanel
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
          "layer-style",
          <PaletteIcon className={ICON_CLASS} />,
          <LayerStylePanel
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
          "layer-border",
          hugeIcon(BorderNone02Icon),
          <LayerBorderPanel
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
          "layer-shadows",
          <ShadowIcon className={ICON_CLASS} />,
          <LayerShadowsPanel
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
          "layer-effects",
          hugeIcon(MagicWand05Icon),
          <LayerEffectsPanel
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
        dataSlot: "insert-trigger",
        group: "tools",
        icon: hugeIcon(ResourcesAddIcon),
        label: "Add",
        variant: "icon-label",
        popover: (
          <InsertMenuPopoverContent
            canAddQrCode={canAddQrCode}
            isPopover
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

export function useToolbarItems(
  props: Omit<DynamicIslandProps, "theme"> & {
    theme?: ThemeMode
  },
) {
  const theme = props.theme ?? "dark"
  return useIslandItems({ ...props, theme })
}

export function DynamicIsland({
  items,
}: {
  items: TooltipItem[]
}) {
  return (
    <div data-slot="dynamic-island-content">
      <TooltipNavbar items={items} />
    </div>
  )
}

