"use client";

import { useEffect, useRef } from "react";

import "@/features/shell/components/workspace-toolbar.css";
import { DynamicIsland, useToolbarItems } from "@/features/shell/components/AppearanceIsland";
import { SettingsToolbarShell } from "@/features/shell/components/SettingsToolbarShell";
import { ExportDownloadPopover } from "@/features/shell/components/ExportDownloadPopover";
import { UtilityToolbar } from "@/features/shell/components/UtilityToolbar";
import { MobileSettingsRail } from "@/features/shell/components/MobileSettingsRail";
import { MobileWorkspaceTopBar } from "@/features/shell/components/MobileWorkspaceTopBar";
import { UTILITY_TOOLBAR_SHELL_CLASS } from "@/features/shell/components/utility-toolbar.constants";
import { FloatingInspector } from "@/features/shell/inspector/FloatingInspector";
import { useToolbarInspectorModel } from "@/features/shell/hooks/use-toolbar-inspector-model";
import { TOOLBAR_TOOLS } from "@/features/shell/model/toolbar-tools";
import type { ThemeMode, ToolbarController } from "@/features/shell/model/toolbar-types";
export type {
  ComposeSidebarPanel,
  BackgroundInspectorTab,
  CornersSettings,
  ExportTarget,
  LayerRow,
  LogoSettings,
  LogoSourceMode,
  PatternSettings,
  ShapeSettings,
  TextSettings,
  ThemeMode,
  ToolbarController,
  ToolbarToolId,
} from "@/features/shell/model/toolbar-types";

export type { InspectorModel } from "@/features/shell/hooks/use-toolbar-inspector-model";

import { WORKSPACE_MOBILE_QUERY, useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";

export function FloatingToolbar({
  controller,
  theme,
  onThemeChange,
}: {
  controller?: ToolbarController;
  theme?: ThemeMode;
  onThemeChange?: (theme: ThemeMode) => void;
} = {}) {
  const model = useToolbarInspectorModel({ controller, theme, onThemeChange });
  const { actualActiveTool, actualTheme } = model;
  const isMobileWorkspace = useMediaQuery(WORKSPACE_MOBILE_QUERY);
  const islandItems = useToolbarItems({
    appearance: controller?.appearanceSnapshot,
    appearanceLayer: controller?.selectedAppearanceLayer,
    canAddQrCode: controller?.canAddQrCode,
    insertNodeId: controller?.insertNodeId,
    onAddQrCode: controller?.onAddQrCode,
    onBrowseWallpapers: controller?.onOpenComposeSidebar
      ? () => controller.onOpenComposeSidebar?.("wallpapers")
      : undefined,
    onElementLayerPatch: controller?.onElementLayerPatch,
    onAppearancePatch: controller?.onAppearancePatch,
    onInsertLayer: controller?.onInsertLayer,
    onSelectSizeTemplate: controller?.onSceneTemplateSizeTemplateSelect,
    onSizeChange: controller?.onSceneTemplateSizeChange,
    onTransformLayerPatch: controller?.onTransformLayerPatch,
    selectedElementLayer: controller?.selectedElementLayer,
    selectedTransformLayer: controller?.selectedTransformLayer,
    sizePresetId: controller?.sceneTemplateSettings?.sizeSettings?.sizePresetId,
    sizeSettings: controller?.sceneTemplateSettings?.sizeSettings,
    theme: actualTheme,
  });
  const toolbarRootRef = useRef<HTMLElement | null>(null);

  // Measure island + utility toolbar widths into CSS vars so the island's
  // clamped left position can keep clear of both side panels.
  useEffect(() => {
    const root = toolbarRootRef.current;
    if (!root) {
      return;
    }

    const island = root.querySelector<HTMLElement>('[data-slot="dynamic-island"]');
    const utility = root.querySelector<HTMLElement>('[data-slot="utility-toolbar"]');
    if (!island || !utility) {
      return;
    }

    const syncWidths = () => {
      const shells = island.querySelectorAll<HTMLElement>('[data-slot="tooltip-navbar-shell"]');
      // The island wraps a small history pill + the labeled pill. Center the
      // labeled pill on the canvas: offset = half the leading pill + gap.
      const leadingWidth = shells.length > 1 ? shells[0].offsetWidth : 0;
      const gap =
        shells.length > 1 ? shells[1].offsetLeft - (shells[0].offsetLeft + leadingWidth) : 0;
      root.style.setProperty("--island-width", `${island.offsetWidth}px`);
      root.style.setProperty("--island-leading-width", `${leadingWidth + gap}px`);
      root.style.setProperty("--utility-toolbar-width", `${utility.offsetWidth}px`);
    };

    syncWidths();
    const observer = new ResizeObserver(syncWidths);
    observer.observe(island);
    observer.observe(utility);
    return () => observer.disconnect();
  }, [isMobileWorkspace]);

  return (
    <section
      ref={toolbarRootRef}
      aria-label="Workspace prototype"
      data-shell-theme={actualTheme}
      data-mobile-workspace={isMobileWorkspace ? "true" : "false"}
      data-slot="floating-toolbar-root"
      className="pointer-events-none absolute inset-0 z-[60] min-h-0 overflow-hidden"
    >
      {isMobileWorkspace ? (
        <>
          <MobileWorkspaceTopBar controller={controller} model={model} theme={actualTheme} />
          <MobileSettingsRail model={model} />
        </>
      ) : (
        <>
          <div data-slot="dynamic-island-anchor">
            <div
              className={cn(UTILITY_TOOLBAR_SHELL_CLASS, "pointer-events-auto")}
              data-slot="dynamic-island"
              data-toolbar-appearance="glass"
            >
              <DynamicIsland items={islandItems} />
            </div>
          </div>
          <div data-slot="utility-toolbar-anchor">
            <UtilityToolbar data-slot="utility-toolbar" className="pointer-events-auto gap-0 p-0">
              <ExportDownloadPopover model={model} theme={actualTheme} />
            </UtilityToolbar>
          </div>
          <SettingsToolbarShell
            showInspector
            inspector={<FloatingInspector activeTool={actualActiveTool} model={model} />}
          />
        </>
      )}
    </section>
  );
}
