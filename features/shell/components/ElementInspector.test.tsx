// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { ElementInspector, TransformInspector } from "@/features/shell/components/ElementInspector"
import { DEFAULT_LAYERS_SETTINGS } from "@/features/shell/model/toolbar-defaults"
import { FloatingToolbar } from "@/features/shell/components/FloatingToolbar"
import { CuelumeProvider } from "@/features/shell/hooks/use-cuelume"
import { createDefaultDraftingShadowLayer } from "@/features/canvas/model/effects"
import { createDefaultDraftingFilterEffect } from "@/features/canvas/model/filters"
import {
  createDraftingImageLayer,
  createDraftingShapeLayer,
  createDraftingTextLayer,
} from "@/features/canvas/model/layers/factories"
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root"
import { createToolbarController } from "@/test-utils/toolbar-controller"

const NODE_ID = "test-node"

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      disconnect() {}
      observe() {}
      unobserve() {}
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  document.body.innerHTML = ""
})

describe("ElementInspector", () => {
  it("renders desktop element inspector slots for text layers", () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Hello" })
    const markup = renderToStaticMarkup(
      <ElementInspector layer={layer} onPatch={vi.fn()} />,
    )

    expect(markup).toContain('data-slot="element-inspector"')
    expect(markup).not.toContain('data-slot="transform-section"')
    expect(markup).toContain('data-slot="layer-text-inspector"')
    expect(markup).toContain('data-slot="effects-accordion"')
    expect(markup).not.toContain('data-slot="effects-section"')
    expect(markup).not.toContain('data-slot="drafting-element-inspector"')
    expect(markup).not.toContain('data-slot="drafting-text-inspector"')
    expect(markup).not.toContain("border-[var(--canvas-line)]")
  })

  it("renders desktop transform inspector slots for text layers", () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Hello" })
    const markup = renderToStaticMarkup(
      <TransformInspector layer={layer} onPatch={vi.fn()} />,
    )

    expect(markup).toContain('data-slot="transform-inspector"')
    expect(markup).toContain('data-slot="transform-section"')
  })

  it("renders desktop shape inspector slots for shape layers", () => {
    const layer = createDraftingShapeLayer(NODE_ID)
    const markup = renderToStaticMarkup(
      <ElementInspector layer={layer} onPatch={vi.fn()} />,
    )

    expect(markup).toContain('data-slot="layer-shape-inspector"')
    expect(markup).toContain('data-slot="layer-shape-fill-mode"')
    expect(markup).toContain('data-slot="layer-shape-fill"')
    expect(markup).toContain('data-slot="effects-accordion"')
    expect(markup).toContain('data-slot="layer-shape-options"')
    expect(markup).not.toContain('data-slot="drafting-shape-inspector"')
  })

  it("renders desktop image inspector slots for image layers", () => {
    const layer = createDraftingImageLayer(NODE_ID)
    const markup = renderToStaticMarkup(
      <ElementInspector layer={layer} onPatch={vi.fn()} />,
    )

    expect(markup).toContain('data-slot="layer-image-inspector"')
    expect(markup).toContain('data-slot="effects-accordion"')
    expect(markup).not.toContain('data-slot="drafting-image-inspector"')
  })

  it("renders Figma-style effect rows for existing shadows and filters", () => {
    const shadow = createDefaultDraftingShadowLayer({
      blur: 8,
      opacity: 40,
      visible: true,
    })
    const blur = createDefaultDraftingFilterEffect("blur", { amount: 10 })
    const layer = createDraftingShapeLayer(NODE_ID, "rect", {
      layerFilters: [blur],
      shadows: [shadow],
    })
    const markup = renderToStaticMarkup(
      <ElementInspector layer={layer} onPatch={vi.fn()} />,
    )

    expect(markup).toContain('data-slot="effects-list"')
    expect(markup).toContain('data-effect-kind="drop-shadow"')
    expect(markup).toContain('data-effect-kind="layer-blur"')
  })
})

describe("FloatingToolbar selected element routing", () => {
  it("renders layer popover triggers in the dynamic island when a canvas element is selected", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Selected" })
    const surface = await renderWithAsyncJsdomRoot(
      <CuelumeProvider>
      <FloatingToolbar
        controller={createToolbarController(
          {
            activeTool: null,
            layersSettings: {
              ...DEFAULT_LAYERS_SETTINGS,
              selectedLayerId: layer.id,
            },
            onLayersSettingsChange: vi.fn(),
            selectedElementLayer: layer,
            selectedTransformLayer: layer,
            onElementLayerPatch: vi.fn(),
            onTransformLayerPatch: vi.fn(),
          },
          NODE_ID,
        )}
      />
      </CuelumeProvider>,
    )

    expect(surface.container.querySelector('[data-slot="layers-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-properties-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-transform-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-style-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-border-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-shadows-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-effects-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-toolbar"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="element-inspector"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="settings-inspector"]')).not.toBeNull()
  })

  it("keeps accordion settings visible when a canvas element is selected", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Selected" })
    const surface = await renderWithAsyncJsdomRoot(
      <CuelumeProvider>
      <FloatingToolbar
        controller={createToolbarController(
          {
            activeTool: null,
            selectedElementLayer: layer,
            onElementLayerPatch: vi.fn(),
          },
          NODE_ID,
        )}
      />
      </CuelumeProvider>,
    )

    expect(surface.container.querySelector('[data-slot="settings-inspector"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="element-inspector"]')).toBeNull()
  })

  it("prioritizes the active toolbar tool accordion over a selected canvas element in the left panel", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Selected" })
    const surface = await renderWithAsyncJsdomRoot(
      <CuelumeProvider>
      <FloatingToolbar
        controller={createToolbarController(
          {
            activeTool: "logo",
            selectedElementLayer: layer,
            onElementLayerPatch: vi.fn(),
          },
          NODE_ID,
        )}
      />
      </CuelumeProvider>,
    )

    expect(surface.container.querySelector('[data-slot="settings-inspector"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="element-inspector"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-properties-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-style-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-effects-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-shadows-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-transform-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-border-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="layer-toolbar"]')).toBeNull()
  })
})
