// @vitest-environment jsdom

import { type ComponentProps } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { DesktopElementInspector, DesktopTransformInspector } from "@/features/desktop-shell/components/DesktopElementInspector"
import { DEFAULT_DESKTOP_LAYERS_SETTINGS } from "@/features/desktop-shell/model/desktop-toolbar-defaults"
import { FloatingToolbar } from "@/features/desktop-shell/components/FloatingToolbar"
import { createDefaultDraftingShadowLayer } from "@/features/workspace/model/effects"
import { createDefaultDraftingFilterEffect } from "@/features/workspace/model/filters"
import {
  createDraftingImageLayer,
  createDraftingShapeLayer,
  createDraftingTextLayer,
} from "@/features/workspace/model/layers"
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root"

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

describe("DesktopElementInspector", () => {
  it("renders desktop element inspector slots for text layers", () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Hello" })
    const markup = renderToStaticMarkup(
      <DesktopElementInspector layer={layer} onPatch={vi.fn()} />,
    )

    expect(markup).toContain('data-slot="desktop-element-inspector"')
    expect(markup).not.toContain('data-slot="desktop-transform-section"')
    expect(markup).toContain('data-slot="desktop-layer-text-inspector"')
    expect(markup).toContain('data-slot="desktop-effects-accordion"')
    expect(markup).not.toContain('data-slot="desktop-effects-section"')
    expect(markup).not.toContain('data-slot="drafting-element-inspector"')
    expect(markup).not.toContain('data-slot="drafting-text-inspector"')
    expect(markup).not.toContain("border-[var(--ws-line)]")
  })

  it("renders desktop transform inspector slots for text layers", () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Hello" })
    const markup = renderToStaticMarkup(
      <DesktopTransformInspector layer={layer} onPatch={vi.fn()} />,
    )

    expect(markup).toContain('data-slot="desktop-transform-inspector"')
    expect(markup).toContain('data-slot="desktop-transform-section"')
  })

  it("renders desktop shape inspector slots for shape layers", () => {
    const layer = createDraftingShapeLayer(NODE_ID)
    const markup = renderToStaticMarkup(
      <DesktopElementInspector layer={layer} onPatch={vi.fn()} />,
    )

    expect(markup).toContain('data-slot="desktop-layer-shape-inspector"')
    expect(markup).toContain('data-slot="desktop-layer-shape-fill-mode"')
    expect(markup).toContain('data-slot="desktop-layer-shape-fill"')
    expect(markup).toContain('data-slot="desktop-effects-accordion"')
    expect(markup).toContain('data-slot="desktop-layer-shape-options"')
    expect(markup).not.toContain('data-slot="drafting-shape-inspector"')
  })

  it("renders desktop image inspector slots for image layers", () => {
    const layer = createDraftingImageLayer(NODE_ID)
    const markup = renderToStaticMarkup(
      <DesktopElementInspector layer={layer} onPatch={vi.fn()} />,
    )

    expect(markup).toContain('data-slot="desktop-layer-image-inspector"')
    expect(markup).toContain('data-slot="desktop-effects-accordion"')
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
      <DesktopElementInspector layer={layer} onPatch={vi.fn()} />,
    )

    expect(markup).toContain('data-slot="desktop-effects-list"')
    expect(markup).toContain('data-effect-kind="drop-shadow"')
    expect(markup).toContain('data-effect-kind="layer-blur"')
    expect(markup).toContain("Add effect")
  })
})

describe("FloatingToolbar selected element routing", () => {
  it("renders layer popover triggers in the dynamic island when a canvas element is selected", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Selected" })
    const surface = await renderWithAsyncJsdomRoot(
      <FloatingToolbar
        controller={
          {
            activeTool: null,
            layersSettings: {
              ...DEFAULT_DESKTOP_LAYERS_SETTINGS,
              selectedLayerId: layer.id,
            },
            onLayersSettingsChange: vi.fn(),
            selectedElementLayer: layer,
            selectedTransformLayer: layer,
            onElementLayerPatch: vi.fn(),
            onTransformLayerPatch: vi.fn(),
          } as ComponentProps<typeof FloatingToolbar>["controller"]
        }
      />,
    )

    expect(surface.container.querySelector('[data-slot="desktop-layers-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-properties-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-style-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-toolbar"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-element-inspector"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktopnew-settings-inspector"]')).not.toBeNull()
  })

  it("keeps accordion settings visible when a canvas element is selected", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Selected" })
    const surface = await renderWithAsyncJsdomRoot(
      <FloatingToolbar
        controller={
          {
            activeTool: null,
            selectedElementLayer: layer,
            onElementLayerPatch: vi.fn(),
          } as ComponentProps<typeof FloatingToolbar>["controller"]
        }
      />,
    )

    expect(surface.container.querySelector('[data-slot="desktopnew-settings-inspector"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-element-inspector"]')).toBeNull()
  })

  it("prioritizes the active toolbar tool accordion over a selected canvas element in the left panel", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Selected" })
    const surface = await renderWithAsyncJsdomRoot(
      <FloatingToolbar
        controller={
          {
            activeTool: "logo",
            selectedElementLayer: layer,
            onElementLayerPatch: vi.fn(),
          } as ComponentProps<typeof FloatingToolbar>["controller"]
        }
      />,
    )

    expect(surface.container.querySelector('[data-slot="desktopnew-settings-inspector"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-element-inspector"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-properties-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-style-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-effects-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-toolbar"]')).toBeNull()
  })
})
