// @vitest-environment jsdom

import { act, useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MobileLayerToolbar } from "@/features/shell/components/MobileLayerToolbar";
import { createDraftingShapeLayer } from "@/features/canvas/model/layers/factories";
import { getAppearanceSnapshot } from "@/features/shell/model/appearance";
import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import type { ToolbarController } from "@/features/shell/model/toolbar-types";
import {
  MobileDrawerNavigationProvider,
  useMobileDrawerNavigation,
} from "@/features/shell/inspector/MobileDrawerNavigationContext";
import { MobileInspectorDensityContext } from "@/features/shell/inspector/MobileInspectorDensityContext";
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root";
import { createToolbarController as createController } from "@/test-utils/toolbar-controller";

const NODE_ID = "test-node";

function NavigationProbe({
  onReady,
}: {
  onReady: (nav: ReturnType<typeof useMobileDrawerNavigation>) => void;
}) {
  const nav = useMobileDrawerNavigation();
  useEffect(() => {
    onReady(nav);
  });

  return null;
}

function createModel(controllerOverrides: Partial<ToolbarController> = {}): SettingsModel {
  return {
    actualActiveTool: "content",
    actualTheme: "dark",
    onActiveToolChange: vi.fn(),
    onThemeChange: vi.fn(),
    controller: createController(controllerOverrides, NODE_ID),
  } as unknown as SettingsModel;
}

describe("MobileLayerToolbar", () => {
  beforeEach(() => {
    class MockResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    Object.defineProperty(window, "ResizeObserver", {
      configurable: true,
      writable: true,
      value: MockResizeObserver,
    });
  });

  it("renders layer action buttons when layers are selected", async () => {
    const surface = await renderWithAsyncJsdomRoot(
      <MobileInspectorDensityContext.Provider value={true}>
        <MobileLayerToolbar model={createModel()} onToolbarHeightChange={() => {}} theme="dark" />
      </MobileInspectorDensityContext.Provider>,
    );

    expect(surface.container.querySelector('[data-slot="mobile-layer-toolbar"]')).not.toBeNull();
    expect(surface.container.querySelector('button[aria-label="Copy selection"]')).not.toBeNull();
    expect(surface.container.querySelector('button[aria-label="Bring to front"]')).not.toBeNull();
  });

  it("opens setting detail when a drawer-backed tool is tapped", async () => {
    let currentView = "default";
    const setView = (view: string) => {
      currentView = view;
    };

    const navigationRef: { current: ReturnType<typeof useMobileDrawerNavigation> } = {
      current: null,
    };
    const surface = await renderWithAsyncJsdomRoot(
      <MobileInspectorDensityContext.Provider value={true}>
        <MobileDrawerNavigationProvider currentView={currentView} setView={setView}>
          <MobileLayerToolbar model={createModel()} onToolbarHeightChange={() => {}} theme="dark" />
          <NavigationProbe
            onReady={(nav) => {
              navigationRef.current = nav;
            }}
          />
        </MobileDrawerNavigationProvider>
      </MobileInspectorDensityContext.Provider>,
    );

    const fontButton = surface.container.querySelector('button[aria-label="Text font"]');
    expect(fontButton).not.toBeNull();

    await act(async () => {
      fontButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(currentView).toBe("setting-detail");
    expect(navigationRef.current?.detailPayload?.title).toBe("Text font");

    await act(async () => {
      navigationRef.current?.closeDetail();
    });

    expect(currentView).toBe("default");
    expect(navigationRef.current?.detailPayload).toBeNull();
  });
  it("renders labeled panel buttons and opens their detail pages", async () => {
    const layer = createDraftingShapeLayer(NODE_ID, "rect");
    let currentView = "default";
    const setView = (view: string) => {
      currentView = view;
    };

    const navigationRef: { current: ReturnType<typeof useMobileDrawerNavigation> } = {
      current: null,
    };
    const surface = await renderWithAsyncJsdomRoot(
      <MobileInspectorDensityContext.Provider value={true}>
        <MobileDrawerNavigationProvider currentView={currentView} setView={setView}>
          <MobileLayerToolbar
            model={createModel({
              appearanceSnapshot: getAppearanceSnapshot(layer),
              insertNodeId: NODE_ID,
              onAppearancePatch: vi.fn(),
              onInsertLayer: vi.fn(),
              onSceneTemplateSizeTemplateSelect: vi.fn(),
              onTransformLayerPatch: vi.fn(),
              selectedElementLayer: layer,
              selectedLayerIds: [layer.id],
              selectedTransformLayer: layer,
            })}
            onToolbarHeightChange={() => {}}
            theme="dark"
          />
          <NavigationProbe
            onReady={(nav) => {
              navigationRef.current = nav;
            }}
          />
        </MobileDrawerNavigationProvider>
      </MobileInspectorDensityContext.Provider>,
    );

    const ariaLabels = Array.from(
      surface.container.querySelectorAll('[data-slot="mobile-layer-toolbar-button"]'),
    ).map((button) => button.getAttribute("aria-label"));
    const panelLabels = ariaLabels.filter((label) =>
      ["Add element", "Canvas size", "Transform", "Border", "Effects", "Shadows"].includes(
        label ?? "",
      ),
    );
    expect(panelLabels).toEqual([
      "Add element",
      "Canvas size",
      "Transform",
      "Border",
      "Effects",
      "Shadows",
    ]);

    const transformButton = surface.container.querySelector('button[aria-label="Transform"]');
    expect(transformButton?.textContent).toContain("Transform");

    await act(async () => {
      transformButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(currentView).toBe("setting-detail");
    expect(navigationRef.current?.detailPayload?.title).toBe("Transform");
  });

  it("does not render when nothing is selected", async () => {
    const surface = await renderWithAsyncJsdomRoot(
      <MobileInspectorDensityContext.Provider value={true}>
        <MobileLayerToolbar
          model={createModel({
            selectedElementLayer: null,
            selectedLayerIds: [],
            canCopyLayers: false,
          })}
          onToolbarHeightChange={() => {}}
          theme="dark"
        />
      </MobileInspectorDensityContext.Provider>,
    );

    expect(surface.container.querySelector('[data-slot="mobile-layer-toolbar"]')).toBeNull();
  });
});
