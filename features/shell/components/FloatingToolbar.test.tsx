// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { act, type ComponentProps, useEffect, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("glimm/next", () => ({
  TransitionLink: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { FloatingToolbar } from "@/features/shell/components/FloatingToolbar";
import { SettingsToolbarShell } from "@/features/shell/components/SettingsToolbarShell";
import { CuelumeProvider } from "@/features/shell/hooks/use-cuelume";
import { getAppearanceSnapshot } from "@/features/shell/model/appearance";
import { DEFAULT_LAYERS_SETTINGS } from "@/features/shell/model/toolbar-defaults";
import {
  DEFAULT_BACKGROUND_SHAPE_OPTIONS,
  QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS,
} from "@/features/qr/model/state";
import { QR_BACKGROUND_SHAPES } from "@/features/qr/styles/background-shapes";
import { DOT_STYLE_OPTIONS } from "@/features/qr/styles/style-options";
import {
  SETTINGS_FILL_LINEAR_PRESETS,
  SETTINGS_FILL_SOLID_PRESETS,
} from "@/features/shell/inspector/settings-fill-presets";
import { getCardGeneratedShaderDefinitions } from "@/features/canvas/rendering/paper-shader-definitions";
import type { ToolbarToolId } from "@/features/shell/model/toolbar-types";
import {
  createDraftingShapeLayer,
  createDraftingTextLayer,
} from "@/features/canvas/model/layers/factories";
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root";

const NODE_ID = "test-node";

beforeEach(() => {
  sessionStorage.clear();
  stubMatchMedia(false);
  Element.prototype.scrollTo = vi.fn();

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

describe("FloatingToolbar", () => {
  it("renders the new settings accordion in the inspector", async () => {
    const surface = await renderPrototype();
    const inspector = surface.container.querySelector('[data-slot="settings-inspector"]');
    const sectionHeaders = getAccordionHeaders(surface.container);

    expect(inspector).not.toBeNull();
    expect(sectionHeaders.map((header) => header.textContent?.trim())).toEqual([
      "Content",
      "Style",
      "Color",
      "Motion",
      "Shape",
      "Background",
    ]);
    expect(surface.container.querySelector('[data-slot="inspector-accordion"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="prototype-canvas"]')).toBeNull();
  });

  it("opens a settings section from the accordion", async () => {
    const surface = await renderPrototype();
    const contentHeader = getRequiredAccordionHeader(surface.container, "Content");
    const qrHeader = getRequiredAccordionHeader(surface.container, "Style");

    expect(contentHeader.getAttribute("aria-expanded")).toBe("false");
    expect(qrHeader.getAttribute("aria-expanded")).toBe("false");

    await act(async () => {
      qrHeader.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(
      getRequiredAccordionHeader(surface.container, "Style").getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("shows the color separately switch in the Color accordion", async () => {
    const surface = await renderPrototype();
    const colorHeader = getRequiredAccordionHeader(surface.container, "Color");

    await act(async () => {
      colorHeader.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const inspector = surface.container.querySelector('[data-slot="settings-inspector"]');

    expect(inspector?.textContent).toContain("Color separately");
  });

  it("keeps the open accordion section when canvas activeTool changes", async () => {
    let setActiveTool: ((toolId: ToolbarToolId) => void) | null = null;

    function AccordionStickyProbe() {
      const [activeTool, setTool] = useState<ToolbarToolId>("content");
      const partialController: Partial<
        NonNullable<ComponentProps<typeof FloatingToolbar>>["controller"]
      > = { activeTool, onActiveToolChange: setTool };

      useEffect(() => {
        setActiveTool = setTool;
      }, []);

      return (
        <CuelumeProvider>
          <FloatingToolbar
            controller={
              partialController as NonNullable<ComponentProps<typeof FloatingToolbar>>["controller"]
            }
          />
        </CuelumeProvider>
      );
    }

    const surface = await renderWithAsyncJsdomRoot(<AccordionStickyProbe />);
    const qrHeader = getRequiredAccordionHeader(surface.container, "Style");

    await act(async () => {
      qrHeader.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(
      getRequiredAccordionHeader(surface.container, "Style").getAttribute("aria-expanded"),
    ).toBe("true");

    await act(async () => {
      setActiveTool?.("shape");
    });

    expect(
      getRequiredAccordionHeader(surface.container, "Style").getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("shows layer popover triggers when an appearance layer is selected", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Hello" });
    const surface = await renderPrototype({
      controller: {
        appearanceSnapshot: getAppearanceSnapshot(layer),
        layersSettings: {
          ...DEFAULT_LAYERS_SETTINGS,
          selectedLayerId: layer.id,
        },
        onAppearancePatch: vi.fn(),
        onLayersSettingsChange: vi.fn(),
        selectedAppearanceLayer: layer,
        selectedTransformLayer: layer,
        onTransformLayerPatch: vi.fn(),
      },
    });

    expect(surface.container.querySelector('[data-slot="layers-trigger"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-properties-trigger"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-transform-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-style-trigger"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-border-trigger"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-shadows-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-effects-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="appearance-island"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="settings-inspector"]')).not.toBeNull();
  });

  it("renders the inspector without the removed icon rail", async () => {
    const surface = await renderPrototype({ controller: { activeTool: "content" } });
    const shell = surface.container.querySelector('[data-slot="left-toolbar-shell"]');
    const rail = surface.container.querySelector('[data-slot="floating-toolbar"]');
    const inspector = surface.container.querySelector('[data-slot="settings-inspector"]');

    expect(shell).not.toBeNull();
    expect(rail).toBeNull();
    expect(shell?.querySelector('[data-slot="settings-inspector"]')).toBe(inspector);
    expect(inspector?.className).not.toContain("fixed");
    expect(inspector?.className).not.toContain("rounded-[20px]");
    expect(inspector?.className).not.toContain("bg-black/55");
    sessionStorage.clear();
  });

  it("keeps settings panel headings transparent", () => {
    const source = readFileSync(
      resolve(process.cwd(), "features/shell/components/InspectorControls.tsx"),
      "utf8",
    );

    expect(source).not.toContain("bg-[var(--header-bg)]");
  });

  it("toggles the desktop prototype between dark and light mode", async () => {
    const surface = await renderPrototype();
    const prototype = surface.container.querySelector('[data-slot="floating-toolbar-root"]');
    const inspector = surface.container.querySelector('[data-slot="settings-inspector"]');
    const dynamicIsland = surface.container.querySelector('[data-slot="dynamic-island"]');

    expect(prototype?.getAttribute("data-shell-theme")).toBe("dark");
    expect(surface.container.querySelector('[data-slot="action-toolbar"]')).toBeNull();
    expect(inspector?.querySelector('[data-slot="theme-toggle"]')).not.toBeNull();
    expect(inspector?.querySelector('[data-slot="keyboard-shortcuts-trigger"]')).not.toBeNull();
    expect(inspector?.querySelector('[data-slot="sounds-toggle"]')).not.toBeNull();
    expect(dynamicIsland?.querySelector('[data-slot="theme-toggle"]')).toBeNull();
    expect(dynamicIsland?.querySelector('[data-slot="keyboard-shortcuts-trigger"]')).toBeNull();
    expect(dynamicIsland?.querySelector('button[aria-label="Undo"]')).toBeNull();
    expect(dynamicIsland?.querySelector('button[aria-label="Redo"]')).toBeNull();
  });

  it("places a pill download button in the top-right utility toolbar", async () => {
    const surface = await renderPrototype();
    const utilityToolbar = surface.container.querySelector('[data-slot="utility-toolbar"]');

    expect(surface.container.querySelector('[data-slot="document-toolbar"]')).toBeNull();
    expect(utilityToolbar?.querySelector('[data-slot="download-trigger"]')).not.toBeNull();
    expect(utilityToolbar?.querySelector('[data-slot="save-trigger"]')).toBeNull();
    expect(utilityToolbar?.querySelector('[data-slot="keyboard-shortcuts-trigger"]')).toBeNull();
    expect(utilityToolbar?.querySelector('[data-slot="theme-toggle"]')).toBeNull();
    expect(utilityToolbar?.querySelector('[data-slot="sounds-toggle"]')).toBeNull();
    const dynamicIsland = surface.container.querySelector('[data-slot="dynamic-island"]');
    expect(dynamicIsland?.querySelector('[data-slot="keyboard-shortcuts-trigger"]')).toBeNull();
    expect(dynamicIsland?.querySelector('[data-slot="theme-toggle"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="desktop-compose-toolbar"]')).toBeNull();
  });
  it("shows the QRafty brand mark in Caveat at the top-left", async () => {
    const surface = await renderPrototype();
    const brandMark = surface.container.querySelector('[data-slot="brand-mark"]');

    expect(brandMark?.textContent).toBe("QRafty");
    expect(brandMark?.tagName).toBe("A");
    expect(brandMark?.getAttribute("href")).toBe("/");
    expect(brandMark?.className).toContain("font-caveat");
    expect(
      surface.container.querySelector(
        '[data-slot="settings-inspector"] [data-slot="brand-mark-anchor"]',
      ),
    ).not.toBeNull();
  });

  it("wires undo and redo through the settings panel header", async () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const onExportDownload = vi.fn();
    const surface = await renderPrototype({
      controller: {
        canRedo: true,
        canUndo: true,
        onExportDownload,
        onRedo,
        onUndo,
      },
    });
    const inspector = getRequiredElement(surface.container, '[data-slot="settings-inspector"]');
    const utilityToolbar = surface.container.querySelector('[data-slot="utility-toolbar"]');

    expect(surface.container.querySelector('[data-slot="action-toolbar"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="dynamic-island-anchor"]')).not.toBeNull();
    expect(utilityToolbar?.className).toContain("min-h-11");
    expect(getRequiredButton(utilityToolbar as HTMLElement, "Download").textContent?.trim()).toBe(
      "Download",
    );
    expect(getRequiredButton(utilityToolbar as HTMLElement, "Download").className).toContain(
      "rounded-full",
    );
    expect(utilityToolbar?.querySelector('[data-slot="save-trigger"]')).toBeNull();

    await act(async () => {
      getRequiredButton(inspector, "Undo").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
      getRequiredButton(inspector, "Redo").dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    expect(onUndo).toHaveBeenCalledTimes(1);
    expect(onRedo).toHaveBeenCalledTimes(1);
    expect(onExportDownload).not.toHaveBeenCalled();

    await act(async () => {
      getRequiredButton(utilityToolbar as HTMLElement, "Download").click();
    });

    await vi.waitFor(() => {
      expect(document.querySelector('[data-slot="export-download-confirm"]')).not.toBeNull();
    });

    await act(async () => {
      document
        .querySelector('[data-slot="export-download-confirm"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onExportDownload).toHaveBeenCalledTimes(1);
  });

  it("keeps the settings toolbar expanded", async () => {
    const surface = await renderWithAsyncJsdomRoot(
      <SettingsToolbarShell
        showInspector
        inspector={<div data-slot="floating-inspector">Inspector</div>}
      />,
    );
    const shell = getRequiredElement(surface.container, '[data-slot="left-toolbar-shell"]');

    expect(shell.querySelector('[data-slot="floating-inspector"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="sidebar-toggle"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="toolbar-brand"]')).toBeNull();
  });

  it("renders layers and properties triggers in the dynamic island when a layer is selected", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Selected" });
    const onAppearancePatch = vi.fn();
    const surface = await renderPrototype({
      controller: {
        activeTool: null,
        appearanceSnapshot: getAppearanceSnapshot(layer),
        layersSettings: {
          ...DEFAULT_LAYERS_SETTINGS,
          selectedLayerId: layer.id,
        },
        onAppearancePatch,
        onElementLayerPatch: vi.fn(),
        onLayersSettingsChange: vi.fn(),
        selectedAppearanceLayer: layer,
        selectedElementLayer: layer,
        selectedTransformLayer: layer,
        onTransformLayerPatch: vi.fn(),
      },
    });

    expect(surface.container.querySelector('[data-slot="layers-trigger"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-properties-trigger"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-transform-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-style-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-border-trigger"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-shadows-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-effects-trigger"]')).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="layer-toolbar"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="appearance-island"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="appearance-outline-trigger"]')).toBeNull();
  });

  it("shows the border trigger for shape layers but not text layers", async () => {
    const shapeLayer = createDraftingShapeLayer(NODE_ID, "rect");
    const surface = await renderPrototype({
      controller: {
        activeTool: null,
        appearanceSnapshot: getAppearanceSnapshot(shapeLayer),
        onAppearancePatch: vi.fn(),
        onElementLayerPatch: vi.fn(),
        selectedAppearanceLayer: shapeLayer,
        selectedElementLayer: shapeLayer,
        selectedTransformLayer: shapeLayer,
        onTransformLayerPatch: vi.fn(),
      },
    });

    expect(surface.container.querySelector('[data-slot="layer-border-trigger"]')).not.toBeNull();
  });

  it("shows the border trigger for a qr layer with a background shape", async () => {
    const qrLayer = { ...createDraftingTextLayer(NODE_ID), kind: "qr" as const };
    const surface = await renderPrototype({
      controller: {
        activeTool: null,
        appearanceSnapshot: getAppearanceSnapshot(qrLayer, {
          qrBackgroundShapeId: "leaf",
          qrBackgroundShapeOptions: DEFAULT_BACKGROUND_SHAPE_OPTIONS,
        }),
        onAppearancePatch: vi.fn(),
        selectedAppearanceLayer: qrLayer,
        selectedTransformLayer: qrLayer,
        onTransformLayerPatch: vi.fn(),
      },
    });

    expect(surface.container.querySelector('[data-slot="layer-border-trigger"]')).not.toBeNull();
  });

  it("shows the scan safety badge in the settings panel header", async () => {
    const surface = await renderPrototype({
      controller: {
        scanSafetyResult: {
          status: "invalid",
          summary: "Not scannable",
          expectedText: "https://example.com",
          decodedText: null,
          score: 0,
        },
      },
    });
    const inspector = getRequiredElement(surface.container, '[data-slot="settings-inspector"]');
    const badge = inspector.querySelector('[data-slot="scan-safety-badge"]');

    expect(surface.container.querySelector('[data-slot="scan-safety-trigger"]')).toBeNull();
    expect(badge).not.toBeNull();
    expect(badge?.getAttribute("data-status")).toBe("invalid");
    expect(badge?.textContent).toContain("Scan Unsafe");
  });

  it("renders the mobile settings rail instead of the desktop inspector", async () => {
    stubMatchMedia(true);
    const surface = await renderPrototype();

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]');
    expect(railRoot).not.toBeNull();
    expect(railRoot?.className).toContain("inspector-root");
    expect(railRoot?.getAttribute("data-shell-theme")).toBe("dark");
    expect(railRoot?.getAttribute("data-theme")).toBe("dark");
    expect(
      surface.container.querySelector('[data-slot="mobile-workspace-top-bar"]'),
    ).not.toBeNull();
    expect(surface.container.querySelector('[data-slot="settings-inspector"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="left-toolbar-shell"]')).toBeNull();
    expect(surface.container.querySelector('[data-slot="dynamic-island-anchor"]')).toBeNull();
    expect(
      surface.container
        .querySelector('[data-slot="floating-toolbar-root"]')
        ?.getAttribute("data-mobile-workspace"),
    ).toBe("true");
  });

  it("lists every settings family as a circular icon button in the mobile rail", async () => {
    stubMatchMedia(true);
    await renderPrototype();

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]');
    const tabs = Array.from(
      railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
    );

    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      "Content",
      "Style",
      "Color",
      "Motion",
      "Shape",
      "Background",
      "Layers",
    ]);

    for (const tab of tabs) {
      expect(tab.querySelector(".dn-mobile-settings-rail__circle")).not.toBeNull();
      expect(tab.querySelector(".dn-mobile-settings-rail__label")).not.toBeNull();
    }
  });

  it("keeps every rail button unselected so no item carries an active state", async () => {
    stubMatchMedia(true);
    await renderPrototype();

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]');
    const tabs = Array.from(
      railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
    );

    expect(tabs).toHaveLength(7);

    for (const tab of tabs) {
      expect(tab.hasAttribute("data-active")).toBe(false);
      expect(tab.getAttribute("aria-selected")).toBeNull();
    }
  });

  it("uses workspace chrome tokens for mobile undo/redo when the root theme disagrees", async () => {
    document.documentElement.classList.remove("dark");
    document.documentElement.classList.add("light");
    stubMatchMedia(true);

    const surface = await renderPrototype({ theme: "dark" });
    const undo = surface.container.querySelector(
      '[data-slot="mobile-workspace-top-bar"] button[aria-label="Undo"]',
    );

    expect(undo).not.toBeNull();
    expect(undo?.className).toContain("text-[var(--glass-fg)]");
    expect(undo?.className).not.toContain("text-foreground");
  });

  it("renders scroll fade cues inside the mobile settings rail", async () => {
    stubMatchMedia(true);
    await renderPrototype();

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]');
    const scrollFadeGradients = railRoot?.querySelectorAll(".scroll-edge-cue-gradient") ?? [];

    expect(scrollFadeGradients.length).toBeGreaterThan(0);
  });

  it("swaps the mobile rail into a family's options and back", async () => {
    stubMatchMedia(true);
    await renderPrototype();

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]');
    const getLabels = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
      ).map((item) => item.textContent?.trim());

    const contentButton = Array.from(
      railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
    ).find((item) => item.textContent?.trim() === "Content");

    expect(contentButton).not.toBeUndefined();
    expect(getLabels()).toContain("Style");

    await act(async () => {
      contentButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      // The rail's two-phase swap commits ~190ms after the tap.
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    const optionLabels = getLabels();
    expect(optionLabels).toContain("Link");
    expect(optionLabels).toContain("Text");
    expect(optionLabels).toContain("Phone");
    expect(optionLabels).not.toContain("Style");
    // The drilled-in row has no back item; corners carry discard/save instead.
    expect(optionLabels).not.toContain("Content");

    const linkButton = Array.from(
      railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
    ).find((item) => item.textContent?.trim() === "Link");

    expect(linkButton?.querySelector(".dn-mobile-settings-rail__circle")).not.toBeNull();

    const actions = railRoot?.querySelector(".dn-mobile-settings-rail__actions");
    expect(actions).not.toBeNull();
    expect(actions?.children).toHaveLength(3);
    // The open family's name sits between the corner buttons.
    expect(actions?.querySelector('[data-slot="mobile-rail-family-label"]')?.textContent).toBe(
      "Content",
    );
    expect(actions?.querySelector('button[aria-label="Discard changes"]')).not.toBeNull();

    await act(async () => {
      actions
        ?.querySelector<HTMLButtonElement>('button[aria-label="Discard changes"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 250));
    });

    expect(getLabels()).toContain("Style");
    expect(railRoot?.querySelector(".dn-mobile-settings-rail__actions")).toBeNull();
  });

  it("drills the mobile rail from a style part into its catalogue and back", async () => {
    stubMatchMedia(true);
    await renderPrototype();

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]');
    const getItems = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>(
          '.dn-mobile-settings-rail__item, .dn-mobile-settings-rail__row [role="tab"]',
        ) ?? [],
      );
    const getLabels = () => getItems().map((item) => item.textContent?.trim());
    const getRailLabel = () => {
      const rows = railRoot?.querySelectorAll(".dn-mobile-settings-rail__row");
      return rows?.[rows.length - 1]?.getAttribute("aria-label");
    };
    const click = async (element: Element | null | undefined) => {
      await act(async () => {
        element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
      // Two-phase option swap: the displayed set commits ~190ms after a
      // mode/part selection. Flush that timer.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
    };

    await click(getItems().find((item) => item.textContent?.trim() === "Style"));

    // The catalogue sits above the pinned part tabs — Module is selected by
    // default, so its style options show immediately.
    expect(getRailLabel()).toBe("QR options");

    const getPartTabs = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>('[aria-label="QR parts"] [role="tab"]') ?? [],
      );
    const getStyleOptions = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>('[data-slot="mobile-rail-style-option"]') ??
          [],
      );

    expect(getPartTabs().map((tab) => tab.textContent?.trim())).toEqual([
      "Module",
      "Eye",
      "Frame",
      "Logo",
    ]);
    expect(
      getPartTabs()
        .find((tab) => tab.textContent?.trim() === "Module")
        ?.getAttribute("aria-selected"),
    ).toBe("true");
    expect(getStyleOptions()).toHaveLength(DOT_STYLE_OPTIONS.length);

    await click(getStyleOptions().find((option) => option.getAttribute("aria-label") === "Circle"));

    expect(
      getStyleOptions()
        .find((option) => option.getAttribute("aria-label") === "Circle")
        ?.getAttribute("aria-pressed"),
    ).toBe("true");

    // The corner cross discards the family's edits and leaves it.
    await click(railRoot?.querySelector('button[aria-label="Discard changes"]'));

    expect(getLabels()).toContain("Color");
    expect(railRoot?.querySelector(".dn-mobile-settings-rail__actions")).toBeNull();
  });

  it("serves quick-pick rows for the remaining families in the mobile rail", async () => {
    stubMatchMedia(true);
    await renderPrototype();

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]');
    const getItems = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>(
          '.dn-mobile-settings-rail__item, .dn-mobile-settings-rail__row [role="tab"]',
        ) ?? [],
      );
    const getLabels = () => getItems().map((item) => item.textContent?.trim());
    const getTiles = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>('[data-slot="mobile-rail-option"]') ?? [],
      );
    const getRailLabel = () => {
      const rows = railRoot?.querySelectorAll(".dn-mobile-settings-rail__row");
      return rows?.[rows.length - 1]?.getAttribute("aria-label");
    };
    const click = async (element: Element | null | undefined) => {
      await act(async () => {
        element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
      // Two-phase option swap: the displayed set commits ~190ms after a
      // mode/part selection. Flush that timer.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
    };
    const closeRow = () => click(railRoot?.querySelector('button[aria-label="Discard changes"]'));

    // Color: fill-mode pills under the row browse the option sets above them.
    await click(getItems().find((item) => item.textContent?.trim() === "Color"));

    const getModePills = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>(
          '[aria-label$="fill modes"] .dn-mobile-settings-rail__item, [aria-label$="fill modes"] [role="tab"]',
        ) ?? [],
      );
    const getModePillLabels = () => getModePills().map((pill) => pill.textContent?.trim());

    expect(getRailLabel()).toBe("Color options");
    expect(railRoot?.querySelector('button[aria-label="Custom color"]')).not.toBeNull();
    expect(getTiles()).toHaveLength(SETTINGS_FILL_SOLID_PRESETS.length + 1);
    expect(getModePillLabels()).toEqual(["Solid", "Linear", "Radial", "Image", "Pattern"]);

    // Browsing another mode swaps the option set above the sliding tabs.
    await click(getModePills().find((pill) => pill.textContent?.trim() === "Linear"));

    expect(getTiles()).toHaveLength(SETTINGS_FILL_LINEAR_PRESETS.length + 1);
    expect(
      getModePills()
        .find((pill) => pill.textContent?.trim() === "Linear")
        ?.getAttribute("aria-selected"),
    ).toBe("true");

    await closeRow();

    // Motion: Off plus every loader preset plus a drawer escape hatch.
    await click(getItems().find((item) => item.textContent?.trim() === "Motion"));

    expect(getRailLabel()).toBe("Motion options");
    expect(getLabels()).toEqual([
      "Off",
      ...QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS.map((option) => option.label),
      "More",
    ]);

    await closeRow();

    // Shape: square + every background shape glyph, with the padding slider
    // and Shape|Fill view tabs pinned below.
    await click(getItems().find((item) => item.textContent?.trim() === "Shape"));

    expect(getRailLabel()).toBe("Shape options");
    expect(getTiles()).toHaveLength(QR_BACKGROUND_SHAPES.length + 1);
    const shapeControls = () => railRoot?.querySelector('[aria-label="Shape controls"]');
    expect(shapeControls()?.querySelector(".dn-settings-inline-slider")).not.toBeNull();
    const shapeViewTabs = () =>
      Array.from(shapeControls()?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? []);

    // Fill view: swatch presets above Solid/Linear/Radial sub-tabs.
    await click(shapeViewTabs().find((tab) => tab.textContent?.trim() === "Fill"));

    expect(railRoot?.querySelector('button[aria-label="Custom shape color"]')).not.toBeNull();
    expect(getTiles()).toHaveLength(SETTINGS_FILL_SOLID_PRESETS.length + 1);
    expect(
      shapeViewTabs()
        .find((tab) => tab.textContent?.trim() === "Solid")
        ?.getAttribute("aria-selected"),
    ).toBe("true");

    await click(shapeViewTabs().find((tab) => tab.textContent?.trim() === "Linear"));

    expect(getTiles()).toHaveLength(SETTINGS_FILL_LINEAR_PRESETS.length + 1);

    await closeRow();

    // Background: same fill-mode pills — solid/linear/radial swatches, plus
    // wallpaper and shader option sets.
    await click(getItems().find((item) => item.textContent?.trim() === "Background"));

    expect(getRailLabel()).toBe("Background options");
    // The card defaults to a paper shader, so the shader set opens first.
    expect(getTiles()).toHaveLength(getCardGeneratedShaderDefinitions().length);
    expect(getModePillLabels()).toEqual(["Solid", "Linear", "Radial", "Image", "Shader"]);
    expect(
      getModePills()
        .find((pill) => pill.textContent?.trim() === "Shader")
        ?.getAttribute("aria-selected"),
    ).toBe("true");

    await click(getModePills().find((pill) => pill.textContent?.trim() === "Solid"));

    expect(railRoot?.querySelector('button[aria-label="Custom background"]')).not.toBeNull();
    expect(getTiles()).toHaveLength(SETTINGS_FILL_SOLID_PRESETS.length + 1);

    await closeRow();

    // Layers: the family button opens the drawer straight onto the Layers
    // detail — no intermediate rail row.
    await click(getItems().find((item) => item.textContent?.trim() === "Layers"));

    expect(getRailLabel()).toBe("Settings sections");
    const drawer = document.querySelector('[data-slot="mobile-family-drawer-root"]');
    expect(drawer).not.toBeNull();
    expect(
      Array.from(drawer?.querySelectorAll(".dn-mobile-drawer-nested-header__title") ?? []).map(
        (node) => node.textContent?.trim(),
      ),
    ).toContain("Layers");
  });

  it("opens the color picker inside the family drawer as a detail page", async () => {
    stubMatchMedia(true);
    await renderPrototype();

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]');
    const click = async (element: Element | null | undefined) => {
      await act(async () => {
        element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        // The rail's two-phase swap commits ~190ms after the tap.
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
    };

    await click(
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
      ).find((item) => item.textContent?.trim() === "Color"),
    );
    await click(railRoot?.querySelector('button[aria-label="Custom color"]'));

    const drawer = document.querySelector('[data-slot="mobile-family-drawer-root"]');
    expect(drawer).not.toBeNull();
    expect(
      Array.from(drawer?.querySelectorAll(".dn-mobile-drawer-nested-header__title") ?? []).map(
        (node) => node.textContent?.trim(),
      ),
    ).toContain("Color");
  });

  it("discards family edits on the corner cross and keeps them on the tick", async () => {
    stubMatchMedia(true);
    await renderPrototype();

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]');
    const click = async (element: Element | null | undefined) => {
      await act(async () => {
        element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 250));
      });
    };
    const getItems = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>(
          '.dn-mobile-settings-rail__item, .dn-mobile-settings-rail__row [role="tab"]',
        ) ?? [],
      );
    const loaderPill = () =>
      getItems().find(
        (item) => item.textContent?.trim() === QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS[0].label,
      );
    const offPill = () => getItems().find((item) => item.textContent?.trim() === "Off");

    // Open Motion, switch on a loader, then discard.
    await click(getItems().find((item) => item.textContent?.trim() === "Motion"));
    await click(loaderPill());
    expect(loaderPill()?.getAttribute("aria-pressed")).toBe("true");

    await click(railRoot?.querySelector('button[aria-label="Discard changes"]'));

    // Reopen: the edit was rolled back — Off is pressed again.
    await click(getItems().find((item) => item.textContent?.trim() === "Motion"));
    expect(offPill()?.getAttribute("aria-pressed")).toBe("true");
    expect(loaderPill()?.getAttribute("aria-pressed")).toBe("false");

    // Edit again, this time save via the tick, then reopen: the loader sticks.
    await click(loaderPill());
    await click(railRoot?.querySelector('button[aria-label="Save changes"]'));
    await click(getItems().find((item) => item.textContent?.trim() === "Motion"));
    expect(loaderPill()?.getAttribute("aria-pressed")).toBe("true");
  });

  it("anchors the mobile settings rail above the safe area with a keyboard inset", async () => {
    stubMatchMedia(true);
    await renderPrototype();

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]');

    expect(railRoot).not.toBeNull();
    expect(document.documentElement.style.getPropertyValue("--mobile-drawer-keyboard-inset")).toBe(
      "0px",
    );
  });
});

async function renderPrototype({
  controller,
  theme = "dark",
}: {
  controller?: Partial<NonNullable<ComponentProps<typeof FloatingToolbar>>["controller"]>;
  theme?: "light" | "dark";
} = {}) {
  return renderWithAsyncJsdomRoot(
    <CuelumeProvider>
      <FloatingToolbar
        controller={controller as NonNullable<ComponentProps<typeof FloatingToolbar>>["controller"]}
        theme={theme}
      />
    </CuelumeProvider>,
  );
}

function getRequiredElement(container: HTMLElement, selector: string) {
  const element = container.querySelector<HTMLElement>(selector);

  if (!element) {
    throw new Error(`Missing element: ${selector}`);
  }

  return element;
}

function getAccordionHeaders(container: HTMLElement) {
  const sectionLabels = new Set([
    "Content",
    "Style",
    "Color",
    "Motion",
    "Shape",
    "Background",
    "Elements",
  ]);

  return Array.from(
    container.querySelectorAll<HTMLButtonElement>(
      ".dn-settings-accordion button[aria-expanded][aria-controls]",
    ),
  ).filter((button) => sectionLabels.has(button.textContent?.trim() ?? ""));
}

function getRequiredAccordionHeader(container: HTMLElement, label: string) {
  const header = getAccordionHeaders(container).find(
    (button) => button.textContent?.trim() === label,
  );

  if (!header) {
    throw new Error(`Missing accordion header: ${label}`);
  }

  return header;
}

function getRequiredButton(container: HTMLElement, label: string) {
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (candidate) => candidate.getAttribute("aria-label") === label,
  );

  if (!button) {
    throw new Error(`Missing button: ${label}`);
  }

  return button;
}

function stubMatchMedia(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}
