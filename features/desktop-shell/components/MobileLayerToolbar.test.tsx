// @vitest-environment jsdom

import { act } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MobileLayerToolbar } from "@/features/desktop-shell/components/MobileLayerToolbar"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import {
  DEFAULT_DESKTOP_EXPORT_SETTINGS,
  DEFAULT_DESKTOP_LAYERS_SETTINGS,
  DEFAULT_DESKTOP_PATTERN_SETTINGS,
} from "@/features/desktop-shell/model/desktop-toolbar-defaults"
import type { DesktopToolbarController } from "@/features/desktop-shell/model/desktop-toolbar-types"
import {
  MobileDrawerNavigationProvider,
  useMobileDrawerNavigation,
} from "@/features/desktop-shell/inspector/mobile-drawer-navigation-context"
import { MobileInspectorDensityContext } from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import { createDraftingTextLayer } from "@/features/workspace/model/layers"
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root"

const NODE_ID = "test-node"

function NavigationProbe({
  onReady,
}: {
  onReady: (nav: ReturnType<typeof useMobileDrawerNavigation>) => void
}) {
  const nav = useMobileDrawerNavigation()
  onReady(nav)
  return null
}

function createController(
  overrides: Partial<DesktopToolbarController> = {},
): DesktopToolbarController {
  const layer = createDraftingTextLayer(NODE_ID, { text: "Hello" })
  return {
    activeTool: "content",
    contentType: "url",
    contentValues: {},
    contentValidation: { isValid: true, errors: [] },
    encodedContentValue: "",
    patternSettings: DEFAULT_DESKTOP_PATTERN_SETTINGS,
    logoSettings: {} as DesktopToolbarController["logoSettings"],
    cornersSettings: {} as DesktopToolbarController["cornersSettings"],
    shapeSettings: {} as DesktopToolbarController["shapeSettings"],
    motionSettings: {} as DesktopToolbarController["motionSettings"],
    encodingSettings: {} as DesktopToolbarController["encodingSettings"],
    accessibilitySettings: {} as DesktopToolbarController["accessibilitySettings"],
    imageSettings: {} as DesktopToolbarController["imageSettings"],
    backgroundSettings: {} as DesktopToolbarController["backgroundSettings"],
    effectsSettings: {} as DesktopToolbarController["effectsSettings"],
    layersSettings: DEFAULT_DESKTOP_LAYERS_SETTINGS,
    exportSettings: DEFAULT_DESKTOP_EXPORT_SETTINGS,
    layoutSettings: {} as DesktopToolbarController["layoutSettings"],
    sceneTemplateSettings: {} as DesktopToolbarController["sceneTemplateSettings"],
    textSettings: {} as DesktopToolbarController["textSettings"],
    selectedElementLayer: layer,
    selectedLayerIds: [layer.id],
    onActiveToolChange: vi.fn(),
    onContentReset: vi.fn(),
    onContentTypeChange: vi.fn(),
    onContentPasteApply: vi.fn(),
    onContentValueChange: vi.fn(),
    onPatternReset: vi.fn(),
    onPatternSettingsChange: vi.fn(),
    onLogoReset: vi.fn(),
    onLogoSettingsChange: vi.fn(),
    onCornersReset: vi.fn(),
    onCornersSettingsChange: vi.fn(),
    onShapeReset: vi.fn(),
    onShapeSettingsChange: vi.fn(),
    onMotionReset: vi.fn(),
    onMotionSettingsChange: vi.fn(),
    onEncodingReset: vi.fn(),
    onEncodingSettingsChange: vi.fn(),
    onAccessibilityReset: vi.fn(),
    onAccessibilitySettingsChange: vi.fn(),
    onImageReset: vi.fn(),
    onImageSettingsChange: vi.fn(),
    onBackgroundReset: vi.fn(),
    onBackgroundSettingsChange: vi.fn(),
    onEffectsReset: vi.fn(),
    onEffectsSettingsChange: vi.fn(),
    onLayersReset: vi.fn(),
    onLayersSettingsChange: vi.fn(),
    onExportReset: vi.fn(),
    onExportSettingsChange: vi.fn(),
    onExportDownload: vi.fn(),
    onTextReset: vi.fn(),
    onTextSettingsChange: vi.fn(),
    onElementLayerPatch: vi.fn(),
    canCopyLayers: true,
    onLayerCopy: vi.fn(),
    onLayerMenuAction: vi.fn(),
    canDeleteLayer: () => true,
    ...overrides,
  }
}

function createModel(controllerOverrides: Partial<DesktopToolbarController> = {}): DesktopInspectorModel {
  return {
    actualActiveTool: "content",
    actualDesktopTheme: "dark",
    onActiveToolChange: vi.fn(),
    onDesktopThemeChange: vi.fn(),
    controller: createController(controllerOverrides),
  } as DesktopInspectorModel
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
    })
  })

  it("renders layer action buttons when layers are selected", async () => {
    const surface = await renderWithAsyncJsdomRoot(
      <MobileInspectorDensityContext.Provider value={true}>
        <MobileLayerToolbar
          model={createModel()}
          onToolbarHeightChange={() => {}}
          theme="dark"
        />
      </MobileInspectorDensityContext.Provider>,
    )

    expect(surface.container.querySelector('[data-slot="mobile-layer-toolbar"]')).not.toBeNull()
    expect(
      surface.container.querySelector('button[aria-label="Copy selection"]'),
    ).not.toBeNull()
    expect(
      surface.container.querySelector('button[aria-label="Bring to front"]'),
    ).not.toBeNull()
  })

  it("opens setting detail when a drawer-backed tool is tapped", async () => {
    let currentView = "default"
    const setView = (view: string) => {
      currentView = view
    }

    let navigation: ReturnType<typeof useMobileDrawerNavigation> | null = null

    const surface = await renderWithAsyncJsdomRoot(
      <MobileInspectorDensityContext.Provider value={true}>
        <MobileDrawerNavigationProvider currentView={currentView} setView={setView}>
          <MobileLayerToolbar
            model={createModel()}
            onToolbarHeightChange={() => {}}
            theme="dark"
          />
          <NavigationProbe
            onReady={(nav) => {
              navigation = nav
            }}
          />
        </MobileDrawerNavigationProvider>
      </MobileInspectorDensityContext.Provider>,
    )

    const fontButton = surface.container.querySelector('button[aria-label="Text font"]')
    expect(fontButton).not.toBeNull()

    await act(async () => {
      fontButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(currentView).toBe("setting-detail")
    expect(navigation?.detailPayload?.title).toBe("Text font")

    await act(async () => {
      navigation?.closeDetail()
    })

    expect(currentView).toBe("default")
    expect(navigation?.detailPayload).toBeNull()
  })

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
    )

    expect(surface.container.querySelector('[data-slot="mobile-layer-toolbar"]')).toBeNull()
  })
})
