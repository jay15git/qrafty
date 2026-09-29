"use client";

import {
  ALargeSmallIcon,
  AlignLeftIcon,
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
} from "lucide-react";
import { lazy, Suspense, useEffect, useRef, type ReactNode } from "react";
import {
  BorderNone02Icon,
  MagicWand05Icon,
  ResourcesAddIcon,
  ScreenRotationIcon,
} from "@hugeicons/core-free-icons";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import { MOBILE_LAYER_TOOLBAR_GAP_PX } from "@/features/shell/components/mobile-layer-toolbar-sync";
import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import { SettingsThemeContext } from "@/features/shell/settings/theme-context";
import {
  useMobileDrawerNavigation,
  useMobileLiveDetail,
} from "@/features/shell/settings/MobileDrawerNavigationContext";
import {
  CanvasSizeIcon,
  hugePanelIcon,
  ShadowIcon,
} from "@/features/shell/components/toolbar-icons";
import {
  resolveLayerPanelTools,
  type LayerPanelTools,
} from "@/features/shell/model/layer-panel-tools";
import {
  getTextLayerFormatState,
  toggleTextBoldPatch,
  toggleTextItalicPatch,
  toggleTextUnderlinePatch,
} from "@/features/shell/model/layer-text-format";
import { LAYER_FILTER_EFFECT_KINDS } from "@/features/canvas/model/layer-effects";
import { TextFontPickerContent } from "@/features/shell/settings/TextFontPickerContent";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import {
  FillColorToolbarButton,
  FloatingLayerToolbarSettings,
  TEXT_ALIGN_OPTIONS,
  TextAlignmentSettings,
  TextSizeSettings,
} from "@/features/canvas/components/FloatingLayerToolbarSettings";
import {
  getTextLayerFillCssValue,
  patchTextLayerFillFromPicker,
} from "@/features/canvas/rendering/layer-fill";
import { isCanvasEmojiLayer } from "@/features/canvas/model/layer-floating-settings";
import { cn } from "@/lib/utils";

// Heavy detail surfaces (insert menu, layer panels, size presets) load lazily so
// the toolbar does not pay their import cost before a detail page is pushed.
const LazyInsertMenuPanelStack = lazy(() =>
  import("@/features/canvas/components/insert-menu/InsertMenuPanelStack").then((module) => ({
    default: module.InsertMenuPanelStack,
  })),
);
const LazyCanvasRatioPresetSections = lazy(() =>
  import("@/features/shell/components/CanvasRatioPresetRow").then((module) => ({
    default: module.CanvasRatioPresetSections,
  })),
);
const LazyLayerTransformPanel = lazy(() =>
  import("@/features/shell/components/LayerSettingsPanel").then((module) => ({
    default: module.LayerTransformPanel,
  })),
);
const LazyLayerBorderPanel = lazy(() =>
  import("@/features/shell/components/LayerSettingsPanel").then((module) => ({
    default: module.LayerBorderPanel,
  })),
);
const LazyLayerEffectsPanel = lazy(() =>
  import("@/features/shell/components/LayerSettingsPanel").then((module) => ({
    default: module.LayerEffectsPanel,
  })),
);
const LazyLayerShadowsPanel = lazy(() =>
  import("@/features/shell/components/LayerSettingsPanel").then((module) => ({
    default: module.LayerShadowsPanel,
  })),
);

function MobileLayerToolbarButton({
  active = false,
  ariaLabel,
  children,
  disabled = false,
  label,
  onClick,
}: {
  active?: boolean;
  ariaLabel: string;
  children: ReactNode;
  disabled?: boolean;
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={active}
      className={cn(
        "ds-mobile-layer-toolbar-button flex h-[var(--icon-hit)] shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full text-[var(--fg)] transition-colors aria-[pressed=true]:bg-[var(--fg)] aria-[pressed=true]:text-[var(--bg)] disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--fg)]/20",
        label ? "w-auto px-2.5" : "w-[var(--icon-hit)]",
      )}
      data-slot="mobile-layer-toolbar-button"
      data-vaul-no-drag=""
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
      {label ? (
        <span className="whitespace-nowrap text-[11px] font-medium leading-none">{label}</span>
      ) : null}
    </button>
  );
}

function MobileLayerToolbarSeparator() {
  return (
    <div
      aria-hidden
      className="mx-0.5 h-5 w-px shrink-0 bg-[color-mix(in_srgb,var(--line)_55%,transparent)]"
      data-slot="mobile-layer-toolbar-separator"
    />
  );
}

function MobileLayerToolbarDetailButton({
  ariaLabel,
  content,
  title,
  children,
}: {
  ariaLabel: string;
  content: ReactNode;
  title: string;
  children: ReactNode;
}) {
  const mobileNav = useMobileDrawerNavigation();

  return (
    <MobileLayerToolbarButton
      ariaLabel={ariaLabel}
      onClick={() => {
        mobileNav?.openDetail({
          title,
          content: (
            <div className="ds-portal-surface w-full min-w-0" data-mobile-settings="">
              {content}
            </div>
          ),
        });
      }}
    >
      {children}
    </MobileLayerToolbarButton>
  );
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
  ariaLabel: string;
  content: ReactNode;
  icon: ReactNode;
  label: string;
}) {
  const detail = useMobileLiveDetail({
    content: (
      <div className="ds-portal-surface w-full min-w-0" data-mobile-settings="">
        <Suspense fallback={null}>{content}</Suspense>
      </div>
    ),
    enabled: true,
    title: label,
  });

  return (
    <>
      <MobileLayerToolbarButton ariaLabel={ariaLabel} label={label} onClick={detail.open}>
        {icon}
      </MobileLayerToolbarButton>
      {detail.portal}
    </>
  );
}

const PANEL_ICON_CLASS = "size-4 shrink-0";

type MobilePanelController = SettingsModel["controller"];

function resolveMobilePanelTools(controller: MobilePanelController): LayerPanelTools {
  return resolveLayerPanelTools({
    appearance: controller?.appearanceSnapshot,
    appearanceLayer: controller?.selectedAppearanceLayer,
    insertNodeId: controller?.insertNodeId,
    onAppearancePatch: controller?.onAppearancePatch,
    onElementLayerPatch: controller?.onElementLayerPatch,
    onInsertLayer: controller?.onInsertLayer,
    onSelectSizeTemplate: controller?.onCanvasSizeTemplateSelect,
    onTransformLayerPatch: controller?.onTransformLayerPatch,
    selectedElementLayer: controller?.selectedElementLayer,
    selectedTransformLayer: controller?.selectedTransformLayer,
  });
}

function MobileLayerInsertTool({
  controller,
  tools,
}: {
  controller: MobilePanelController;
  tools: LayerPanelTools;
}) {
  const navigation = useMobileDrawerNavigation();
  const insertNodeId = controller?.insertNodeId;
  const onInsertLayer = controller?.onInsertLayer;
  if (!tools.canInsert || !insertNodeId || !onInsertLayer) {
    return null;
  }

  return (
    <MobileLayerPanelButton
      ariaLabel="Add element"
      content={
        <LazyInsertMenuPanelStack
          canAddQrCode={controller?.canAddQrCode}
          isPopover
          nodeId={insertNodeId}
          onAddQrCode={controller?.onAddQrCode}
          onBrowseWallpapers={
            controller?.onOpenComposeSidebar
              ? () => controller.onOpenComposeSidebar?.("wallpapers")
              : undefined
          }
          onClose={() => navigation?.closeDetail()}
          onInsertLayer={onInsertLayer}
        />
      }
      icon={hugePanelIcon(ResourcesAddIcon)}
      label="Add"
    />
  );
}

function MobileLayerLayoutTool({
  controller,
  tools,
}: {
  controller: MobilePanelController;
  tools: LayerPanelTools;
}) {
  const onSelectSizeTemplate = controller?.onCanvasSizeTemplateSelect;
  if (!tools.hasLayout || !onSelectSizeTemplate) {
    return null;
  }

  return (
    <MobileLayerPanelButton
      ariaLabel="Canvas size"
      content={
        <LazyCanvasRatioPresetSections
          selectedPresetId={controller?.canvasSizeSettings?.sizeSettings?.sizePresetId}
          onSelectTemplate={onSelectSizeTemplate}
        />
      }
      icon={<CanvasSizeIcon className={PANEL_ICON_CLASS} />}
      label="Layout"
    />
  );
}

function MobileLayerTransformTool({
  controller,
  theme,
  tools,
}: {
  controller: MobilePanelController;
  theme: ThemeMode;
  tools: LayerPanelTools;
}) {
  const selectedTransformLayer = controller?.selectedTransformLayer;
  const onTransformLayerPatch = controller?.onTransformLayerPatch;
  if (!tools.hasTransform || !selectedTransformLayer || !onTransformLayerPatch) {
    return null;
  }

  return (
    <MobileLayerPanelButton
      ariaLabel="Transform"
      content={
        <LazyLayerTransformPanel
          layer={selectedTransformLayer}
          onPatch={onTransformLayerPatch}
          theme={theme}
          variant="flat"
        />
      }
      icon={hugePanelIcon(ScreenRotationIcon)}
      label="Transform"
    />
  );
}

function MobileLayerBorderTool({
  controller,
  theme,
  tools,
}: {
  controller: MobilePanelController;
  theme: ThemeMode;
  tools: LayerPanelTools;
}) {
  const appearance = controller?.appearanceSnapshot;
  const onAppearancePatch = controller?.onAppearancePatch;
  if (!tools.hasBorder || !appearance || !onAppearancePatch) {
    return null;
  }

  return (
    <MobileLayerPanelButton
      ariaLabel="Border"
      content={
        <LazyLayerBorderPanel appearance={appearance} onPatch={onAppearancePatch} theme={theme} />
      }
      icon={hugePanelIcon(BorderNone02Icon)}
      label="Border"
    />
  );
}

function MobileLayerEffectsTool({
  controller,
  theme,
  tools,
}: {
  controller: MobilePanelController;
  theme: ThemeMode;
  tools: LayerPanelTools;
}) {
  const appearance = controller?.appearanceSnapshot;
  const onAppearancePatch = controller?.onAppearancePatch;
  const { effectsLayer, effectsPatch } = tools;
  if (!tools.hasEffects || !effectsLayer || !effectsPatch) {
    return null;
  }

  return (
    <MobileLayerPanelButton
      ariaLabel="Effects"
      content={
        <LazyLayerEffectsPanel
          effectKinds={LAYER_FILTER_EFFECT_KINDS}
          layer={effectsLayer}
          layerOpacity={appearance?.opacity}
          onLayerOpacityChange={
            appearance && onAppearancePatch
              ? (opacity) => onAppearancePatch({ opacity })
              : undefined
          }
          onPatch={effectsPatch}
          theme={theme}
          variant="flat"
        />
      }
      icon={hugePanelIcon(MagicWand05Icon)}
      label="Effects"
    />
  );
}

function MobileLayerShadowsTool({ theme, tools }: { theme: ThemeMode; tools: LayerPanelTools }) {
  const { shadowsLayer, shadowsPatch } = tools;
  if (!tools.hasShadows || !shadowsLayer || !shadowsPatch) {
    return null;
  }

  return (
    <MobileLayerPanelButton
      ariaLabel="Shadows"
      content={<LazyLayerShadowsPanel layer={shadowsLayer} onPatch={shadowsPatch} theme={theme} />}
      icon={<ShadowIcon className={PANEL_ICON_CLASS} />}
      label="Shadows"
    />
  );
}

/**
 * Mirrors the desktop dynamic island's property panels (Add, Layout, Transform,
 * Border, Effects, Shadows) as drawer detail pages. Same gating rules as
 * `useIslandItems` via `resolveLayerPanelTools`.
 */
function hasMobilePanelTools(tools: LayerPanelTools): boolean {
  return (
    tools.canInsert ||
    tools.hasLayout ||
    tools.hasTransform ||
    tools.hasBorder ||
    tools.hasEffects ||
    tools.hasShadows
  );
}

function MobileLayerPanelTools({
  model,
  separator,
  theme,
  tools,
}: {
  model: SettingsModel;
  separator: boolean;
  theme: ThemeMode;
  tools: LayerPanelTools;
}) {
  const controller = model.controller;

  if (!hasMobilePanelTools(tools)) {
    return null;
  }

  return (
    <>
      {separator ? <MobileLayerToolbarSeparator /> : null}
      <MobileLayerInsertTool controller={controller} tools={tools} />
      <MobileLayerLayoutTool controller={controller} tools={tools} />
      <MobileLayerTransformTool controller={controller} theme={theme} tools={tools} />
      <MobileLayerBorderTool controller={controller} theme={theme} tools={tools} />
      <MobileLayerEffectsTool controller={controller} theme={theme} tools={tools} />
      <MobileLayerShadowsTool theme={theme} tools={tools} />
    </>
  );
}

function MobileLayerTextTools({
  layer,
  onPatch,
  theme,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
  theme: ThemeMode;
}) {
  const mobileNav = useMobileDrawerNavigation();

  if (isCanvasEmojiLayer(layer)) {
    return (
      <div className="flex shrink-0 items-center gap-0.5" data-slot="mobile-layer-toolbar-settings">
        <FloatingLayerToolbarSettings layer={layer} onPatch={onPatch} theme={theme} />
      </div>
    );
  }

  const { fontStyle, fontWeight, textAlign } = getTextLayerFormatState(layer);
  const AlignIcon =
    TEXT_ALIGN_OPTIONS.find((option) => option.value === textAlign)?.icon ?? AlignLeftIcon;

  function patchText(patch: Partial<CanvasLayer>) {
    onPatch({ ...patch, textRuns: undefined });
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5" data-slot="mobile-layer-toolbar-settings">
      <FillColorToolbarButton
        ariaLabel="Text color"
        solidOnly={false}
        theme={theme}
        title="Text color"
        value={getTextLayerFillCssValue(layer)}
        onValueChange={(fill) => patchText(patchTextLayerFillFromPicker(layer, fill))}
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
        onClick={() => onPatch(toggleTextBoldPatch(layer))}
      >
        <Bold className="size-4" strokeWidth={2} />
      </MobileLayerToolbarButton>
      <MobileLayerToolbarButton
        active={fontStyle === "italic"}
        ariaLabel="Italic"
        onClick={() => onPatch(toggleTextItalicPatch(layer))}
      >
        <Italic className="size-4" strokeWidth={2} />
      </MobileLayerToolbarButton>
      <MobileLayerToolbarButton
        active={Boolean(layer.underline)}
        ariaLabel="Underline"
        onClick={() => onPatch(toggleTextUnderlinePatch(layer))}
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
        content={<TextSizeSettings layer={layer} onPatch={onPatch} />}
        title="Size"
      >
        <ALargeSmallIcon className="size-4" strokeWidth={2} />
      </MobileLayerToolbarDetailButton>
    </div>
  );
}

function MobileLayerSpecificTools({
  layer,
  onPatch,
  theme,
}: {
  layer: CanvasLayer;
  onPatch: (patch: Partial<CanvasLayer>) => void;
  theme: ThemeMode;
}) {
  if (layer.kind === "text") {
    return <MobileLayerTextTools layer={layer} onPatch={onPatch} theme={theme} />;
  }

  return (
    <div className="flex shrink-0 items-center gap-0.5" data-slot="mobile-layer-toolbar-settings">
      <FloatingLayerToolbarSettings layer={layer} onPatch={onPatch} theme={theme} />
    </div>
  );
}

export function MobileLayerToolbar({
  model,
  onToolbarHeightChange,
  theme,
}: {
  model: SettingsModel;
  onToolbarHeightChange: (height: number) => void;
  theme: ThemeMode;
}) {
  const controller = model.controller;
  const selectedLayerIds = controller?.selectedLayerIds ?? [];
  const selectedElementLayer = controller?.selectedElementLayer;
  const onElementLayerPatch = controller?.onElementLayerPatch;
  const toolbarRef = useRef<HTMLDivElement>(null);
  const panelTools = resolveMobilePanelTools(controller);
  const hasPanelTools = hasMobilePanelTools(panelTools);
  const hasSelection = selectedLayerIds.length > 0;

  useEffect(() => {
    const node = toolbarRef.current;
    if (!node || (!hasSelection && !hasPanelTools)) {
      onToolbarHeightChange(0);
      return;
    }

    const updateHeight = () => {
      onToolbarHeightChange(Math.round(node.getBoundingClientRect().height));
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    observer.observe(node);

    return () => {
      observer.disconnect();
      onToolbarHeightChange(0);
    };
  }, [onToolbarHeightChange, hasSelection, hasPanelTools]);

  // The toolbar is always-on: with nothing selected it still carries the
  // background tools (Add / Layout / card Border & Effects) that the desktop
  // island shows for the card layer.
  if (!hasSelection && !hasPanelTools) {
    return null;
  }

  const canCopy = Boolean(controller?.canCopyLayers && controller?.onLayerCopy);
  const canDelete = selectedLayerIds.some(
    (layerId) => controller?.canDeleteLayer?.(layerId) ?? false,
  );
  const canReorder = Boolean(controller?.onLayerMenuAction);

  const showLayerTools =
    selectedLayerIds.length === 1 &&
    selectedElementLayer &&
    onElementLayerPatch &&
    (selectedElementLayer.kind === "text" ||
      selectedElementLayer.kind === "shape" ||
      selectedElementLayer.kind === "image" ||
      selectedElementLayer.kind === "shader");

  return (
    <SettingsThemeContext.Provider value={theme}>
      <div
        ref={toolbarRef}
        className={cn(
          "ds-root pointer-events-auto fixed z-[var(--z-mobile-rail)]",
          "left-[max(1rem,env(safe-area-inset-left,0px))]",
          "w-[calc(100%-max(1rem,env(safe-area-inset-left,0px))-max(1rem,env(safe-area-inset-right,0px)))]",
        )}
        data-shell-theme={theme}
        data-mobile-settings=""
        data-slot="mobile-layer-toolbar"
        data-theme={theme}
        style={{
          bottom: `calc(var(--mobile-drawer-height, 0px) + ${MOBILE_LAYER_TOOLBAR_GAP_PX}px)`,
        }}
      >
        <ScrollArea
          className="ds-mobile-layer-toolbar-scroll h-fit w-full min-w-0 max-w-full overflow-hidden rounded-full bg-[var(--bg)]"
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
            {hasSelection ? (
              <>
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
              </>
            ) : null}
            <MobileLayerPanelTools
              model={model}
              separator={hasSelection}
              theme={theme}
              tools={panelTools}
            />
          </div>
        </ScrollArea>
      </div>
    </SettingsThemeContext.Provider>
  );
}
