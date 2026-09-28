"use client";

import { useMemo, type ReactNode } from "react";
import { PaletteIcon } from "lucide-react";
import {
  BorderNone02Icon,
  MagicWand05Icon,
  ResourcesAddIcon,
  ScreenRotationIcon,
} from "@hugeicons/core-free-icons";

import { CanvasRatioPresetPopoverContent } from "@/features/shell/components/CanvasRatioPresetRow";
import {
  CanvasSizeIcon,
  hugePanelIcon,
  ShadowIcon,
} from "@/features/shell/components/toolbar-icons";
import {
  LayerBorderPanel,
  LayerEffectsPanel,
  LayerShadowsPanel,
  LayerStylePanel,
  LayerTransformPanel,
} from "@/features/shell/components/LayerSettingsPanel";
import { ToolbarPopoverContent } from "@/features/shell/components/ToolbarPopover";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import { InsertMenuPopoverContent } from "@/features/canvas/components/insert-menu/InsertMenuPopoverContent";
import type { AppearanceSnapshot } from "@/features/shell/model/appearance";
import { resolveLayerPanelTools } from "@/features/shell/model/layer-panel-tools";
import { IslandCard, type IslandItem } from "@/features/shell/components/IslandCard";
import { LAYER_FILTER_EFFECT_KINDS } from "@/features/canvas/model/layer-effects";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import type { SizeTemplate } from "@/features/canvas/model/size-templates";
import type { CardSizeSettings } from "@/features/shell/model/card-size-settings";

const ICON_CLASS = "size-4 shrink-0";

type DynamicIslandProps = {
  appearance?: AppearanceSnapshot | null;
  appearanceLayer?: CanvasLayer | null;
  canAddQrCode?: boolean;

  insertNodeId?: string;

  onAddQrCode?: () => void;
  onAppearancePatch?: (patch: Partial<CanvasLayer>) => void;
  onBrowseWallpapers?: () => void;
  onElementLayerPatch?: (patch: Partial<CanvasLayer>) => void;
  onInsertLayer?: (layer: CanvasLayer) => void;

  onTransformLayerPatch?: (patch: Partial<CanvasLayer>) => void;
  onSelectSizeTemplate?: (template: SizeTemplate) => void;
  onSizeChange?: (patch: Partial<CardSizeSettings>) => void;
  selectedElementLayer?: CanvasLayer | null;
  selectedTransformLayer?: CanvasLayer | null;
  sizePresetId?: string;
  sizeSettings?: CardSizeSettings;
  theme?: ThemeMode;
};

type IslandItemInput = Omit<DynamicIslandProps, "theme"> & {
  theme: ThemeMode;
};

type IslandFlags = ReturnType<typeof resolveLayerPanelTools>;

function islandPanelItem(
  theme: ThemeMode,
  label: string,
  slot: string,
  icon: ReactNode,
  panel: ReactNode,
  labeled = false,
): IslandItem {
  return {
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
  };
}

function buildCanvasSizeItem(props: IslandItemInput): IslandItem | null {
  const { onSelectSizeTemplate, onSizeChange, sizePresetId, sizeSettings, theme } = props;
  if (!onSelectSizeTemplate) {
    return null;
  }

  return {
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
  };
}

function buildTransformItem(props: IslandItemInput, flags: IslandFlags): IslandItem | null {
  const { onTransformLayerPatch, selectedTransformLayer, theme } = props;
  if (!flags.hasTransform) {
    return null;
  }

  return islandPanelItem(
    theme,
    "Transform",
    "layer-transform",
    hugePanelIcon(ScreenRotationIcon),
    <LayerTransformPanel
      layer={selectedTransformLayer!}
      onPatch={onTransformLayerPatch!}
      theme={theme}
      variant="flat"
    />,
    true,
  );
}

function buildStyleItem(props: IslandItemInput, flags: IslandFlags): IslandItem | null {
  const { onElementLayerPatch, selectedElementLayer, theme } = props;
  if (!flags.hasStyle) {
    return null;
  }

  return islandPanelItem(
    theme,
    "Style",
    "layer-style",
    <PaletteIcon className={ICON_CLASS} />,
    <LayerStylePanel layer={selectedElementLayer!} onPatch={onElementLayerPatch!} theme={theme} />,
  );
}

function buildBorderItem(props: IslandItemInput, flags: IslandFlags): IslandItem | null {
  const { appearance, onAppearancePatch, theme } = props;
  if (!flags.hasBorder) {
    return null;
  }

  return islandPanelItem(
    theme,
    "Border",
    "layer-border",
    hugePanelIcon(BorderNone02Icon),
    <LayerBorderPanel appearance={appearance!} onPatch={onAppearancePatch!} theme={theme} />,
    true,
  );
}

function buildShadowsItem(props: IslandItemInput, flags: IslandFlags): IslandItem | null {
  const { theme } = props;
  if (!flags.hasShadows) {
    return null;
  }

  return islandPanelItem(
    theme,
    "Shadows",
    "layer-shadows",
    <ShadowIcon className={ICON_CLASS} />,
    <LayerShadowsPanel layer={flags.shadowsLayer!} onPatch={flags.shadowsPatch!} theme={theme} />,
    true,
  );
}

function buildEffectsItem(props: IslandItemInput, flags: IslandFlags): IslandItem | null {
  const { appearance, onAppearancePatch, theme } = props;
  if (!flags.hasEffects) {
    return null;
  }

  return islandPanelItem(
    theme,
    "Effects",
    "layer-effects",
    hugePanelIcon(MagicWand05Icon),
    <LayerEffectsPanel
      effectKinds={LAYER_FILTER_EFFECT_KINDS}
      layer={flags.effectsLayer!}
      layerOpacity={appearance?.opacity}
      onLayerOpacityChange={
        appearance && onAppearancePatch ? (opacity) => onAppearancePatch({ opacity }) : undefined
      }
      onPatch={flags.effectsPatch!}
      theme={theme}
      variant="flat"
    />,
    true,
  );
}

function buildInsertItem(props: IslandItemInput, flags: IslandFlags): IslandItem | null {
  const { canAddQrCode, insertNodeId, onAddQrCode, onBrowseWallpapers, onInsertLayer, theme } =
    props;
  if (!flags.canInsert) {
    return null;
  }

  return {
    ariaLabel: "Add element",
    dataSlot: "insert-trigger",
    group: "tools",
    icon: hugePanelIcon(ResourcesAddIcon),
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
  };
}

function buildIslandItems(props: IslandItemInput): IslandItem[] {
  const flags = resolveLayerPanelTools(props);
  const nextItems: IslandItem[] = [];

  for (const item of [
    buildCanvasSizeItem(props),
    buildInsertItem(props, flags),
    buildTransformItem(props, flags),
    buildStyleItem(props, flags),
    buildBorderItem(props, flags),
    buildShadowsItem(props, flags),
    buildEffectsItem(props, flags),
  ]) {
    if (item) {
      nextItems.push(item);
    }
  }

  return nextItems;
}

function useIslandItems(props: IslandItemInput) {
  const {
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
  } = props;

  return useMemo(
    () =>
      buildIslandItems({
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
      }),
    [
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
    ],
  );
}

export function useToolbarItems(
  props: Omit<DynamicIslandProps, "theme"> & {
    theme?: ThemeMode;
  },
) {
  const theme = props.theme ?? "dark";
  return useIslandItems({ ...props, theme });
}

export function DynamicIsland({ items }: { items: IslandItem[] }) {
  return (
    <div data-slot="dynamic-island-content">
      <IslandCard items={items} />
    </div>
  );
}
