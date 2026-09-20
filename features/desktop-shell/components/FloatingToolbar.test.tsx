// @vitest-environment jsdom

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { act, type ComponentProps, useEffect, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("glimm/next", () => ({
  TransitionLink: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode
    href: string
  }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

import { FloatingToolbar } from "@/features/desktop-shell/components/FloatingToolbar"
import { DesktopSettingsToolbarShell } from "@/features/desktop-shell/components/DesktopSettingsToolbarShell"
import { DesktopCuelumeProvider } from "@/features/desktop-shell/hooks/use-desktop-cuelume"
import { getDesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import { DEFAULT_DESKTOP_LAYERS_SETTINGS } from "@/features/desktop-shell/model/desktop-toolbar-defaults"
import { DEFAULT_BACKGROUND_SHAPE_OPTIONS, QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS } from "@/features/qr-code/model/state"
import { QR_BACKGROUND_SHAPES } from "@/features/qr-code/styles/background-shapes"
import { DOT_STYLE_OPTIONS } from "@/features/qr-code/styles/style-options"
import {
  SETTINGS_FILL_LINEAR_PRESETS,
  SETTINGS_FILL_SOLID_PRESETS,
} from "@/features/desktop-shell/inspector/settings-fill-presets"
import { getCardGeneratedShaderDefinitions } from "@/features/workspace/rendering/paper-shader-definitions"
import type { DesktopToolbarToolId } from "@/features/desktop-shell/model/desktop-toolbar-types"
import {
  createDraftingShapeLayer,
  createDraftingTextLayer,
} from "@/features/workspace/model/layers"
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root"

const NODE_ID = "test-node"

beforeEach(() => {
  sessionStorage.clear()
  stubMatchMedia(false)
  Element.prototype.scrollTo = vi.fn()

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

describe("FloatingToolbar", () => {
  it("renders the new settings accordion in the inspector", async () => {
    const surface = await renderPrototype()
    const inspector = surface.container.querySelector('[data-slot="desktopnew-settings-inspector"]')
    const sectionHeaders = getAccordionHeaders(surface.container)

    expect(inspector).not.toBeNull()
    expect(sectionHeaders.map((header) => header.textContent?.trim())).toEqual([
      "Content",
      "Style",
      "Color",
      "Motion",
      "Shape",
      "Background",
    ])
    expect(surface.container.querySelector('[data-slot="desktop-inspector-accordion"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-prototype-canvas"]')).toBeNull()
  })

  it("opens a settings section from the accordion", async () => {
    const surface = await renderPrototype()
    const contentHeader = getRequiredAccordionHeader(surface.container, "Content")
    const qrHeader = getRequiredAccordionHeader(surface.container, "Style")

    expect(contentHeader.getAttribute("aria-expanded")).toBe("false")
    expect(qrHeader.getAttribute("aria-expanded")).toBe("false")

    await act(async () => {
      qrHeader.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(getRequiredAccordionHeader(surface.container, "Style").getAttribute("aria-expanded")).toBe(
      "true",
    )
  })

  it("shows the color separately switch in the Color accordion", async () => {
    const surface = await renderPrototype()
    const colorHeader = getRequiredAccordionHeader(surface.container, "Color")

    await act(async () => {
      colorHeader.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const inspector = surface.container.querySelector('[data-slot="desktopnew-settings-inspector"]')

    expect(inspector?.textContent).toContain("Color separately")
  })

  it("keeps the open accordion section when canvas activeTool changes", async () => {
    let setActiveTool: ((toolId: DesktopToolbarToolId) => void) | null = null

    function AccordionStickyProbe() {
      const [activeTool, setTool] = useState<DesktopToolbarToolId>("content")

      useEffect(() => {
        setActiveTool = setTool
      }, [])

      return (
        <DesktopCuelumeProvider>
          <FloatingToolbar
            controller={{
              activeTool,
              onActiveToolChange: setTool,
            }}
          />
        </DesktopCuelumeProvider>
      )
    }

    const surface = await renderWithAsyncJsdomRoot(<AccordionStickyProbe />)
    const qrHeader = getRequiredAccordionHeader(surface.container, "Style")

    await act(async () => {
      qrHeader.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(getRequiredAccordionHeader(surface.container, "Style").getAttribute("aria-expanded")).toBe(
      "true",
    )

    await act(async () => {
      setActiveTool?.("shape")
    })

    expect(getRequiredAccordionHeader(surface.container, "Style").getAttribute("aria-expanded")).toBe(
      "true",
    )
  })

  it("shows layer popover triggers when an appearance layer is selected", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Hello" })
    const surface = await renderPrototype({
      controller: {
        appearanceSnapshot: getDesktopAppearanceSnapshot(layer),
        layersSettings: {
          ...DEFAULT_DESKTOP_LAYERS_SETTINGS,
          selectedLayerId: layer.id,
        },
        onAppearancePatch: vi.fn(),
        onLayersSettingsChange: vi.fn(),
        selectedAppearanceLayer: layer,
        selectedTransformLayer: layer,
        onTransformLayerPatch: vi.fn(),
      },
    })

    expect(surface.container.querySelector('[data-slot="desktop-layers-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-properties-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-transform-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-style-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-border-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-shadows-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-effects-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-appearance-island"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktopnew-settings-inspector"]')).not.toBeNull()
  })

  it("renders the inspector without the removed icon rail", async () => {
    const surface = await renderPrototype({ controller: { activeTool: "content" } })
    const shell = surface.container.querySelector('[data-slot="desktop-left-toolbar-shell"]')
    const rail = surface.container.querySelector('[data-slot="desktop-floating-toolbar"]')
    const inspector = surface.container.querySelector('[data-slot="desktopnew-settings-inspector"]')

    expect(shell).not.toBeNull()
    expect(rail).toBeNull()
    expect(shell?.querySelector('[data-slot="desktopnew-settings-inspector"]')).toBe(inspector)
    expect(inspector?.className).not.toContain("fixed")
    expect(inspector?.className).not.toContain("rounded-[20px]")
    expect(inspector?.className).not.toContain("bg-black/55")
    sessionStorage.clear()
  })

  it("keeps settings panel headings transparent", () => {
    const source = readFileSync(
      resolve(process.cwd(), "features/desktop-shell/components/InspectorControls.tsx"),
      "utf8",
    )

    expect(source).not.toContain("bg-[var(--desktop-inspector-header-bg)]")
  })

  it("toggles the desktop prototype between dark and light mode", async () => {
    const surface = await renderPrototype()
    const prototype = surface.container.querySelector('[data-slot="desktop-floating-toolbar-root"]')
    const utilityToolbar = surface.container.querySelector('[data-slot="desktop-utility-toolbar"]')
    const dynamicIsland = surface.container.querySelector('[data-slot="desktop-dynamic-island"]')

    expect(prototype?.getAttribute("data-desktop-theme")).toBe("dark")
    expect(surface.container.querySelector('[data-slot="desktop-action-toolbar"]')).toBeNull()
    expect(dynamicIsland?.querySelector('button[aria-label="Undo"]')).not.toBeNull()
    expect(dynamicIsland?.querySelector('button[aria-label="Redo"]')).not.toBeNull()
    expect(utilityToolbar?.querySelector('[data-slot="desktop-theme-toggle"]')).toBeNull()
    expect(dynamicIsland?.querySelector('[data-slot="desktop-theme-toggle"]')).not.toBeNull()
    expect(dynamicIsland?.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).not.toBeNull()
  })

  it("places a squircle download button in the top-right utility toolbar", async () => {
    const surface = await renderPrototype()
    const utilityToolbar = surface.container.querySelector('[data-slot="desktop-utility-toolbar"]')

    expect(surface.container.querySelector('[data-slot="desktop-document-toolbar"]')).toBeNull()
    expect(utilityToolbar?.querySelector('[data-slot="desktop-download-trigger"]')).not.toBeNull()
    expect(utilityToolbar?.querySelector('[data-slot="desktop-save-trigger"]')).toBeNull()
    expect(utilityToolbar?.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).toBeNull()
    expect(utilityToolbar?.querySelector('[data-slot="desktop-theme-toggle"]')).toBeNull()
    const dynamicIsland = surface.container.querySelector('[data-slot="desktop-dynamic-island"]')
    expect(dynamicIsland?.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).not.toBeNull()
    expect(dynamicIsland?.querySelector('[data-slot="desktop-theme-toggle"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-compose-toolbar"]')).toBeNull()
  })

  it("shows the QRafty brand mark in Caveat at the top-left", async () => {
    const surface = await renderPrototype()
    const brandMark = surface.container.querySelector('[data-slot="desktop-brand-mark"]')

    expect(brandMark?.textContent).toBe("QRafty")
    expect(brandMark?.tagName).toBe("A")
    expect(brandMark?.getAttribute("href")).toBe("/")
    expect(brandMark?.className).toContain("font-caveat")
    expect(
      surface.container.querySelector(
        '[data-slot="desktopnew-settings-inspector"] [data-slot="desktop-brand-mark-anchor"]',
      ),
    ).not.toBeNull()
  })

  it("wires undo and redo through the top dynamic island history actions", async () => {
    const onUndo = vi.fn()
    const onRedo = vi.fn()
    const onExportDownload = vi.fn()
    const surface = await renderPrototype({
      controller: {
        canRedo: true,
        canUndo: true,
        onExportDownload,
        onRedo,
        onUndo,
      },
    })
    const dynamicIsland = getRequiredElement(surface.container, '[data-slot="desktop-dynamic-island"]')
    const utilityToolbar = surface.container.querySelector('[data-slot="desktop-utility-toolbar"]')

    expect(surface.container.querySelector('[data-slot="desktop-action-toolbar"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-dynamic-island-anchor"]')).not.toBeNull()
    expect(utilityToolbar?.className).toContain("min-h-11")
    expect(getRequiredButton(utilityToolbar as HTMLElement, "Download").textContent?.trim()).toBe(
      "Download",
    )
    expect(getRequiredButton(utilityToolbar as HTMLElement, "Download").className).toContain(
      "bg-[var(--desktop-glass-bg)]",
    )
    expect(utilityToolbar?.querySelector('[data-slot="desktop-save-trigger"]')).toBeNull()
    expect(utilityToolbar?.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).toBeNull()

    await act(async () => {
      getRequiredButton(dynamicIsland, "Undo").dispatchEvent(new MouseEvent("click", { bubbles: true }))
      getRequiredButton(dynamicIsland, "Redo").dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onRedo).toHaveBeenCalledTimes(1)
    expect(onExportDownload).not.toHaveBeenCalled()

    await act(async () => {
      getRequiredButton(utilityToolbar as HTMLElement, "Download").click()
    })

    await vi.waitFor(() => {
      expect(document.querySelector('[data-slot="desktop-export-download-confirm"]')).not.toBeNull()
    })

    await act(async () => {
      document
        .querySelector('[data-slot="desktop-export-download-confirm"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(onExportDownload).toHaveBeenCalledTimes(1)
  })

  it("keeps the settings toolbar expanded", async () => {
    const surface = await renderWithAsyncJsdomRoot(
      <DesktopSettingsToolbarShell
          showInspector
          inspector={<div data-slot="desktop-floating-inspector">Inspector</div>}
        />
    )
    const shell = getRequiredElement(surface.container, '[data-slot="desktop-left-toolbar-shell"]')

    expect(shell.querySelector('[data-slot="desktop-floating-inspector"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-sidebar-toggle"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-toolbar-brand"]')).toBeNull()
  })

  it("renders layers and properties triggers in the dynamic island when a layer is selected", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Selected" })
    const onAppearancePatch = vi.fn()
    const surface = await renderPrototype({
      controller: {
        activeTool: null,
        appearanceSnapshot: getDesktopAppearanceSnapshot(layer),
        layersSettings: {
          ...DEFAULT_DESKTOP_LAYERS_SETTINGS,
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
    })

    expect(surface.container.querySelector('[data-slot="desktop-layers-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-properties-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-transform-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-style-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-border-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-shadows-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-effects-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-toolbar"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-appearance-island"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-appearance-outline-trigger"]')).toBeNull()
  })

  it("shows the border trigger for shape layers but not text layers", async () => {
    const shapeLayer = createDraftingShapeLayer(NODE_ID, "rect")
    const surface = await renderPrototype({
      controller: {
        activeTool: null,
        appearanceSnapshot: getDesktopAppearanceSnapshot(shapeLayer),
        onAppearancePatch: vi.fn(),
        onElementLayerPatch: vi.fn(),
        selectedAppearanceLayer: shapeLayer,
        selectedElementLayer: shapeLayer,
        selectedTransformLayer: shapeLayer,
        onTransformLayerPatch: vi.fn(),
      },
    })

    expect(surface.container.querySelector('[data-slot="desktop-layer-border-trigger"]')).not.toBeNull()
  })

  it("shows the border trigger for a qr layer with a background shape", async () => {
    const qrLayer = { ...createDraftingTextLayer(NODE_ID), kind: "qr" as const }
    const surface = await renderPrototype({
      controller: {
        activeTool: null,
        appearanceSnapshot: getDesktopAppearanceSnapshot(qrLayer, {
          qrBackgroundShapeId: "leaf",
          qrBackgroundShapeOptions: DEFAULT_BACKGROUND_SHAPE_OPTIONS,
        }),
        onAppearancePatch: vi.fn(),
        selectedAppearanceLayer: qrLayer,
        selectedTransformLayer: qrLayer,
        onTransformLayerPatch: vi.fn(),
      },
    })

    expect(surface.container.querySelector('[data-slot="desktop-layer-border-trigger"]')).not.toBeNull()
  })

  it("does not render scan safety in the dynamic island", async () => {
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
    })

    expect(surface.container.querySelector('[data-slot="desktop-scan-safety-trigger"]')).toBeNull()
  })

  it("renders the mobile settings rail instead of the desktop inspector", async () => {
    stubMatchMedia(true)
    const surface = await renderPrototype()

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]')
    expect(railRoot).not.toBeNull()
    expect(railRoot?.className).toContain("desktopnew-root")
    expect(railRoot?.getAttribute("data-desktop-theme")).toBe("dark")
    expect(railRoot?.getAttribute("data-theme")).toBe("dark")
    expect(surface.container.querySelector('[data-slot="mobile-workspace-top-bar"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktopnew-settings-inspector"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-left-toolbar-shell"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-dynamic-island-anchor"]')).toBeNull()
    expect(
      surface.container.querySelector('[data-slot="desktop-floating-toolbar-root"]')?.getAttribute(
        "data-mobile-workspace",
      ),
    ).toBe("true")
  })

  it("lists every settings family as a circular icon button in the mobile rail", async () => {
    stubMatchMedia(true)
    await renderPrototype()

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]')
    const tabs = Array.from(
      railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
    )

    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      "Content",
      "Style",
      "Color",
      "Motion",
      "Shape",
      "Background",
      "Elements",
    ])

    for (const tab of tabs) {
      expect(tab.querySelector(".dn-mobile-settings-rail__circle")).not.toBeNull()
      expect(tab.querySelector(".dn-mobile-settings-rail__label")).not.toBeNull()
    }
  })

  it("keeps every rail button unselected so no item carries an active state", async () => {
    stubMatchMedia(true)
    await renderPrototype()

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]')
    const tabs = Array.from(
      railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
    )

    expect(tabs).toHaveLength(7)

    for (const tab of tabs) {
      expect(tab.hasAttribute("data-active")).toBe(false)
      expect(tab.getAttribute("aria-selected")).toBeNull()
    }
  })

  it("uses workspace chrome tokens for mobile undo/redo when the root theme disagrees", async () => {
    document.documentElement.classList.remove("dark")
    document.documentElement.classList.add("light")
    stubMatchMedia(true)

    const surface = await renderPrototype({ theme: "dark" })
    const undo = surface.container.querySelector('[data-slot="mobile-workspace-top-bar"] button[aria-label="Undo"]')

    expect(undo).not.toBeNull()
    expect(undo?.className).toContain("text-[var(--desktop-glass-fg)]")
    expect(undo?.className).not.toContain("text-foreground")
  })

  it("renders scroll fade cues inside the mobile settings rail", async () => {
    stubMatchMedia(true)
    await renderPrototype()

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]')
    const scrollFadeGradients = railRoot?.querySelectorAll(".scroll-edge-cue-gradient") ?? []

    expect(scrollFadeGradients.length).toBeGreaterThan(0)
  })

  it("swaps the mobile rail into a family's options and back", async () => {
    stubMatchMedia(true)
    await renderPrototype()

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]')
    const getLabels = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
      ).map((item) => item.textContent?.trim())

    const contentButton = Array.from(
      railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
    ).find((item) => item.textContent?.trim() === "Content")

    expect(contentButton).not.toBeUndefined()
    expect(getLabels()).toContain("Style")

    await act(async () => {
      contentButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const optionLabels = getLabels()
    expect(optionLabels).toContain("Link")
    expect(optionLabels).toContain("Text")
    expect(optionLabels).toContain("Phone")
    expect(optionLabels).not.toContain("Style")
    // The drilled-in row has no back item; corners carry close/next instead.
    expect(optionLabels).not.toContain("Content")

    const linkButton = Array.from(
      railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
    ).find((item) => item.textContent?.trim() === "Link")

    expect(linkButton?.querySelector(".dn-mobile-settings-rail__circle")).not.toBeNull()

    const actions = railRoot?.querySelector(".dn-mobile-settings-rail__actions")
    expect(actions).not.toBeNull()
    expect(actions?.children).toHaveLength(3)
    // History replaces the old inert family pill between the corners.
    expect(
      Array.from(
        actions?.querySelectorAll<HTMLButtonElement>('[data-slot="mobile-rail-history"] button') ??
          [],
      ).map((button) => button.getAttribute("aria-label")),
    ).toEqual(["Undo", "Redo"])
    expect(actions?.querySelector('button[aria-label="Close options"]')).not.toBeNull()

    await act(async () => {
      actions
        ?.querySelector<HTMLButtonElement>('button[aria-label="Close options"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(getLabels()).toContain("Style")
    expect(railRoot?.querySelector(".dn-mobile-settings-rail__actions")).toBeNull()
  })

  it("drills the mobile rail from a style part into its catalogue and back", async () => {
    stubMatchMedia(true)
    await renderPrototype()

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]')
    const getItems = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
      )
    const getLabels = () => getItems().map((item) => item.textContent?.trim())
    const getRailLabel = () => {
      const rows = railRoot?.querySelectorAll(".dn-mobile-settings-rail__row")
      return rows?.[rows.length - 1]?.getAttribute("aria-label")
    }
    const click = async (element: Element | null | undefined) => {
      await act(async () => {
        element?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      })
    }

    await click(getItems().find((item) => item.textContent?.trim() === "Style"))

    expect(getLabels()).toEqual(["Module", "Eye", "Frame", "Logo"])
    expect(getRailLabel()).toBe("QR options")

    await click(getItems().find((item) => item.textContent?.trim() === "Module"))

    // The part row fades out and the catalogue takes its place.
    expect(getItems()).toHaveLength(0)
    expect(getRailLabel()).toBe("Module options")

    const getStyleOptions = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>(
          '[data-slot="mobile-rail-style-option"]',
        ) ?? [],
      )

    expect(getStyleOptions()).toHaveLength(DOT_STYLE_OPTIONS.length)

    await click(getStyleOptions().find((option) => option.getAttribute("aria-label") === "Circle"))

    expect(
      getStyleOptions()
        .find((option) => option.getAttribute("aria-label") === "Circle")
        ?.getAttribute("aria-pressed"),
    ).toBe("true")

    // The corner cross steps back one level, not straight out of the family.
    await click(railRoot?.querySelector('button[aria-label="Close options"]'))

    expect(getLabels()).toEqual(["Module", "Eye", "Frame", "Logo"])
    expect(getRailLabel()).toBe("QR options")

    await click(railRoot?.querySelector('button[aria-label="Close options"]'))

    expect(getLabels()).toContain("Color")
    expect(railRoot?.querySelector(".dn-mobile-settings-rail__actions")).toBeNull()
  })

  it("serves quick-pick rows for the remaining families in the mobile rail", async () => {
    stubMatchMedia(true)
    await renderPrototype()

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]')
    const getItems = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
      )
    const getLabels = () => getItems().map((item) => item.textContent?.trim())
    const getTiles = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>(
          '[data-slot="mobile-rail-option"]',
        ) ?? [],
      )
    const getRailLabel = () => {
      const rows = railRoot?.querySelectorAll(".dn-mobile-settings-rail__row")
      return rows?.[rows.length - 1]?.getAttribute("aria-label")
    }
    const click = async (element: Element | null | undefined) => {
      await act(async () => {
        element?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      })
    }
    const closeRow = () =>
      click(railRoot?.querySelector('button[aria-label="Close options"]'))

    // Color: fill-mode pills under the row browse the option sets above them.
    await click(getItems().find((item) => item.textContent?.trim() === "Color"))

    const getModePills = () =>
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>(
          '[aria-label$="fill modes"] .dn-mobile-settings-rail__item--pill',
        ) ?? [],
      )
    const getModePillLabels = () =>
      getModePills().map((pill) => pill.textContent?.trim())

    expect(getRailLabel()).toBe("Color options")
    expect(
      railRoot?.querySelector('button[aria-label="Custom color"]'),
    ).not.toBeNull()
    expect(getTiles()).toHaveLength(SETTINGS_FILL_SOLID_PRESETS.length + 1)
    expect(getModePillLabels()).toEqual([
      "Solid",
      "Linear",
      "Radial",
      "Image",
      "Pattern",
    ])

    // Browsing another mode swaps the option set above the pills.
    await click(getModePills().find((pill) => pill.textContent?.trim() === "Linear"))

    expect(getTiles()).toHaveLength(SETTINGS_FILL_LINEAR_PRESETS.length + 1)
    expect(
      getModePills()
        .find((pill) => pill.textContent?.trim() === "Linear")
        ?.getAttribute("aria-pressed"),
    ).toBe("true")

    await closeRow()

    // Motion: Off plus every loader preset plus a drawer escape hatch.
    await click(getItems().find((item) => item.textContent?.trim() === "Motion"))

    expect(getRailLabel()).toBe("Motion options")
    expect(getLabels()).toEqual([
      "Off",
      ...QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS.map((option) => option.label),
      "More",
    ])

    await closeRow()

    // Shape: square + every background shape glyph, then a Fill drawer entry.
    await click(getItems().find((item) => item.textContent?.trim() === "Shape"))

    expect(getRailLabel()).toBe("Shape options")
    expect(getTiles()).toHaveLength(QR_BACKGROUND_SHAPES.length + 1)
    expect(getLabels()).toContain("Fill")

    await closeRow()

    // Background: same fill-mode pills — solid/linear/radial swatches, plus
    // wallpaper and shader option sets.
    await click(getItems().find((item) => item.textContent?.trim() === "Background"))

    expect(getRailLabel()).toBe("Background options")
    // The card defaults to a paper shader, so the shader set opens first.
    expect(getTiles()).toHaveLength(getCardGeneratedShaderDefinitions().length)
    expect(getModePillLabels()).toEqual([
      "Solid",
      "Linear",
      "Radial",
      "Image",
      "Shader",
    ])
    expect(
      getModePills()
        .find((pill) => pill.textContent?.trim() === "Shader")
        ?.getAttribute("aria-pressed"),
    ).toBe("true")

    await click(getModePills().find((pill) => pill.textContent?.trim() === "Solid"))

    expect(
      railRoot?.querySelector('button[aria-label="Custom background"]'),
    ).not.toBeNull()
    expect(getTiles()).toHaveLength(SETTINGS_FILL_SOLID_PRESETS.length + 1)

    await closeRow()

    // Elements: Add and Layers push insert/layers content as drawer details.
    await click(getItems().find((item) => item.textContent?.trim() === "Elements"))

    expect(getRailLabel()).toBe("Elements options")
    expect(getLabels()).toEqual(expect.arrayContaining(["Add", "Layers"]))

    await closeRow()

    expect(getRailLabel()).toBe("Settings sections")
  })

  it("opens the color picker inside the family drawer as a detail page", async () => {
    stubMatchMedia(true)
    await renderPrototype()

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]')
    const click = async (element: Element | null | undefined) => {
      await act(async () => {
        element?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      })
    }

    await click(
      Array.from(
        railRoot?.querySelectorAll<HTMLButtonElement>(".dn-mobile-settings-rail__item") ?? [],
      ).find((item) => item.textContent?.trim() === "Color"),
    )
    await click(railRoot?.querySelector('button[aria-label="Custom color"]'))

    const drawer = document.querySelector('[data-slot="mobile-family-drawer-root"]')
    expect(drawer).not.toBeNull()
    expect(
      Array.from(drawer?.querySelectorAll(".dn-mobile-drawer-nested-header__title") ?? [])
        .map((node) => node.textContent?.trim()),
    ).toContain("Color")
  })

  it("anchors the mobile settings rail above the safe area with a keyboard inset", async () => {
    stubMatchMedia(true)
    await renderPrototype()

    const railRoot = document.querySelector('[data-slot="mobile-settings-rail-root"]')

    expect(railRoot).not.toBeNull()
    expect(document.documentElement.style.getPropertyValue("--mobile-drawer-keyboard-inset")).toBe(
      "0px",
    )
  })
})

async function renderPrototype({
  controller,
  theme = "dark",
}: {
  controller?: Partial<NonNullable<ComponentProps<typeof FloatingToolbar>>["controller"]>
  theme?: "light" | "dark"
} = {}) {
  return renderWithAsyncJsdomRoot(
    <DesktopCuelumeProvider>
      <FloatingToolbar
        controller={controller as NonNullable<ComponentProps<typeof FloatingToolbar>>["controller"]}
        theme={theme}
      />
    </DesktopCuelumeProvider>,
  )
}

function getRequiredElement(container: HTMLElement, selector: string) {
  const element = container.querySelector<HTMLElement>(selector)

  if (!element) {
    throw new Error(`Missing element: ${selector}`)
  }

  return element
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
  ])

  return Array.from(
    container.querySelectorAll<HTMLButtonElement>(
      ".dn-settings-accordion button[aria-expanded][aria-controls]",
    ),
  ).filter((button) => sectionLabels.has(button.textContent?.trim() ?? ""))
}

function getRequiredAccordionHeader(container: HTMLElement, label: string) {
  const header = getAccordionHeaders(container).find(
    (button) => button.textContent?.trim() === label,
  )

  if (!header) {
    throw new Error(`Missing accordion header: ${label}`)
  }

  return header
}

function getRequiredButton(container: HTMLElement, label: string) {
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>("button")).find(
    (candidate) => candidate.getAttribute("aria-label") === label,
  )

  if (!button) {
    throw new Error(`Missing button: ${label}`)
  }

  return button
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
  })
}
