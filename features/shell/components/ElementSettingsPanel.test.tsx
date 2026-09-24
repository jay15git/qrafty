// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ElementSettingsPanel,
  TransformPanel,
} from "@/features/shell/components/ElementSettingsPanel";
import { DEFAULT_LAYERS_SETTINGS } from "@/features/shell/model/toolbar-defaults";
import { WorkspaceChrome } from "@/features/shell/components/WorkspaceChrome";
import { CuelumeProvider } from "@/features/shell/hooks/use-cuelume";
import { createDefaultCanvasShadowLayer } from "@/features/canvas/model/effects";
import { createDefaultCanvasFilterEffect } from "@/features/canvas/model/filters";
import {
  createCanvasImageLayer,
  createCanvasShapeLayer,
  createCanvasTextLayer,
} from "@/features/canvas/model/layers/factories";
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root";
import { createToolbarController } from "@/test-utils/toolbar-controller";

const NODE_ID = "test-node";

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal(
    "ResizeObserver",
    class ResizeObserver {
      disconnect() {}
      observe() {}
      unobserve() {}
    },
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("ElementSettingsPanel", () => {
  it("renders desktop element settings slots for text layers", () => {
    const layer = createCanvasTextLayer(NODE_ID, { text: "Hello" });
    const markup = renderToStaticMarkup(<ElementSettingsPanel layer={layer} onPatch={vi.fn()} />);

    expect(markup).toContain('data-slot="element-panel"');
    expect(markup).not.toContain('data-slot="transform-section"');
    expect(markup).toContain('data-slot="layer-text-settings"');
    expect(markup).toContain('data-slot="effects-accordion"');
    expect(markup).not.toContain('data-slot="effects-section"');
    expect(markup).not.toContain('data-slot="canvas-element-panel"');
    expect(markup).not.toContain('data-slot="canvas-text-panel"');
    expect(markup).not.toContain("border-[var(--canvas-line)]");
  });

  it("renders desktop transform settings slots for text layers", () => {
    const layer = createCanvasTextLayer(NODE_ID, { text: "Hello" });
    const markup = renderToStaticMarkup(<TransformPanel layer={layer} onPatch={vi.fn()} />);

    expect(markup).toContain('data-slot="transform-panel"');
    expect(markup).toContain('data-slot="transform-section"');
  });

  it("renders desktop shape settings slots for shape layers", () => {
    const layer = createCanvasShapeLayer(NODE_ID);
    const markup = renderToStaticMarkup(<ElementSettingsPanel layer={layer} onPatch={vi.fn()} />);

    expect(markup).toContain('data-slot="layer-shape-settings"');
    expect(markup).toContain('data-slot="layer-shape-fill-mode"');
    expect(markup).toContain('data-slot="layer-shape-fill"');
    expect(markup).toContain('data-slot="effects-accordion"');
    expect(markup).toContain('data-slot="layer-shape-options"');
    expect(markup).not.toContain('data-slot="canvas-shape-panel"');
  });

  it("renders desktop image settings slots for image layers", () => {
    const layer = createCanvasImageLayer(NODE_ID);
    const markup = renderToStaticMarkup(<ElementSettingsPanel layer={layer} onPatch={vi.fn()} />);

    expect(markup).toContain('data-slot="layer-image-settings"');
    expect(markup).toContain('data-slot="effects-accordion"');
    expect(markup).not.toContain('data-slot="canvas-image-panel"');
  });

  it("renders Figma-style effect rows for existing shadows and filters", () => {
    const shadow = createDefaultCanvasShadowLayer({
      blur: 8,
      opacity: 40,
      visible: true,
    });
    const blur = createDefaultCanvasFilterEffect("blur", { amount: 10 });
    const layer = createCanvasShapeLayer(NODE_ID, "rect", {
      layerFilters: [blur],
      shadows: [shadow],
    });
    const markup = renderToStaticMarkup(<ElementSettingsPanel layer={layer} onPatch={vi.fn()} />);

    expect(markup).toContain('data-slot="effects-list"');
    expect(markup).toContain('data-effect-kind="drop-shadow"');
    expect(markup).toContain('data-effect-kind="layer-blur"');
  });
});

describe("WorkspaceChrome selected element routing", () => {
  it("renders layer popover triggers in the dynamic island when a canvas element is selected", async () => {
    const layer = createCanvasTextLayer(NODE_ID, { text: "Selected" });
    const surface = await renderWithAsyncJsdomRoot(
      <CuelumeProvider>
        <WorkspaceChrome
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
    );

    expect(surface.container.querySelector('[data-slot="layers-trigger"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-properties-trigger"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-transform-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-style-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-border-trigger"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-shadows-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-effects-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-toolbar"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="element-panel"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="desktop-settings-panel"]')).not.toBeNull();
  });

  it("keeps accordion settings visible when a canvas element is selected", async () => {
    const layer = createCanvasTextLayer(NODE_ID, { text: "Selected" });
    const surface = await renderWithAsyncJsdomRoot(
      <CuelumeProvider>
        <WorkspaceChrome
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
    );

    expect(surface.container.querySelector('[data-slot="desktop-settings-panel"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="element-panel"]')).toBeNull();
  });

  it("prioritizes the active toolbar tool accordion over a selected canvas element in the left panel", async () => {
    const layer = createCanvasTextLayer(NODE_ID, { text: "Selected" });
    const surface = await renderWithAsyncJsdomRoot(
      <CuelumeProvider>
        <WorkspaceChrome
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
    );

    expect(surface.container.querySelector('[data-slot="desktop-settings-panel"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="element-panel"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-properties-trigger"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-style-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-effects-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-shadows-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-transform-trigger"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-border-trigger"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-toolbar"]')).toBeNull();
  });
});
