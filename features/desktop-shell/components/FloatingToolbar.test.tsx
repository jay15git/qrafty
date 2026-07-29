// @vitest-environment jsdom

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { act, type ComponentProps, useState } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  DESKTOP_TOOLBAR_TOOLS,
  FloatingToolbar,
  type DesktopInspectorModel,
} from "@/features/desktop-shell/components/FloatingToolbar"
import {
  DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY,
  DesktopSettingsToolbarShell,
} from "@/features/desktop-shell/components/DesktopSettingsToolbarShell"
import { getDesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import { createDraftingTextLayer, type DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { DRAFTING_CARD_PATTERNS } from "@/features/workspace/model/card-patterns"
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root"

const NODE_ID = "test-node"

beforeEach(() => {
  sessionStorage.setItem(DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY, "false")

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  })

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
  it("renders every drafting left rail tool as an accessible icon button", async () => {
    const surface = await renderPrototype()
    const buttons = getToolButtons(surface.container)

    expect(buttons).toHaveLength(DESKTOP_TOOLBAR_TOOLS.length)

    for (const tool of DESKTOP_TOOLBAR_TOOLS) {
      const button = surface.container.querySelector(
        `[data-tool-id="${tool.id}"]`,
      )

      expect(button).not.toBeNull()
      expect(button?.getAttribute("aria-label")).toBe(`Open ${tool.title}`)
    }

    expect(surface.container.querySelector('[data-slot="desktop-prototype-canvas"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-floating-inspector"]')).toBeNull()
  })

  it("updates the locally active tool when a toolbar button is clicked", async () => {
    const surface = await renderPrototype()
    const contentButton = getRequiredToolButton(surface.container, "content")
    const patternButton = getRequiredToolButton(surface.container, "pattern")

    expect(contentButton.getAttribute("aria-pressed")).toBe("false")
    expect(patternButton.getAttribute("aria-pressed")).toBe("false")

    await clickButton(patternButton)

    expect(contentButton.getAttribute("aria-pressed")).toBe("false")
    expect(patternButton.getAttribute("aria-pressed")).toBe("true")
  })

  it("renders the free edit toggle in the dynamic island", async () => {
    const onEditingModeChange = vi.fn()
    const surface = await renderPrototype({
      controller: {
        editingMode: "free",
        isFreeEditingEnabled: true,
        onEditingModeChange,
      },
    })

    const toggle = surface.container.querySelector('[data-slot="desktop-free-edit-toggle"]')
    const switchInput = surface.container.querySelector(
      '[data-slot="desktop-free-edit-toggle"] [data-slot="switch"]',
    )

    expect(toggle).not.toBeNull()
    expect(switchInput?.getAttribute("aria-checked")).toBe("true")

    await act(async () => {
      switchInput?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(onEditingModeChange).toHaveBeenCalledWith("template")
  })

  it("hides composition tools in template mode", async () => {
    const surface = await renderPrototype({
      controller: {
        activeTool: "layout",
        editingMode: "template",
        isFreeEditingEnabled: false,
      },
    })

    expect(surface.container.querySelector('[data-tool-id="text"]')).toBeNull()
    expect(surface.container.querySelector('[data-tool-id="image"]')).toBeNull()
    expect(surface.container.querySelector('[data-tool-id="layers"]')).toBeNull()
    expect(surface.container.querySelector('[data-tool-id="layout"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-tool-id="content"]')).not.toBeNull()
  })

  it("hides appearance controls in template mode even when a layer is selected", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Hello" })
    const surface = await renderPrototype({
      controller: {
        appearanceSnapshot: getDesktopAppearanceSnapshot(layer),
        editingMode: "template",
        isFreeEditingEnabled: false,
        onAppearancePatch: vi.fn(),
        selectedAppearanceLayer: layer,
      },
    })

    expect(surface.container.querySelector('[data-slot="desktop-appearance-island"]')).toBeNull()
  })

  it("renders the icon rail inside the inspector shell as one left toolbar", async () => {
    sessionStorage.setItem(DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY, "false")
    const surface = await renderPrototype({ controller: { activeTool: "content" } })
    const shell = surface.container.querySelector('[data-slot="desktop-left-toolbar-shell"]')
    const rail = surface.container.querySelector('[data-slot="desktop-floating-toolbar"]')
    const inspector = surface.container.querySelector('[data-slot="desktop-floating-inspector"]')
    const source = readFileSync(
      resolve(process.cwd(), "features/desktop-shell/components/FloatingToolbar.tsx"),
      "utf8",
    )

    expect(shell).not.toBeNull()
    expect(shell?.querySelector('[data-slot="desktop-floating-toolbar"]')).toBe(rail)
    expect(shell?.querySelector('[data-slot="desktop-floating-inspector"]')).toBe(inspector)
    expect(shell?.getAttribute("data-collapsed")).toBe("false")
    expect(rail?.className).not.toContain("fixed")
    expect(rail?.className).not.toContain("rounded-full")
    expect(rail?.className).not.toContain("bg-black/55")
    expect(rail?.className).not.toContain("pt-14")
    expect(rail?.querySelector('[data-slot="desktop-toolbar-brand"]')).not.toBeNull()
    expect(rail?.querySelector('[data-slot="desktop-toolbar-tools"]')).not.toBeNull()
    expect(inspector?.className).not.toContain("fixed")
    expect(inspector?.className).not.toContain("rounded-[20px]")
    expect(inspector?.className).not.toContain("bg-black/55")
    expect(source).toContain('[data-desktop-theme="light"] [data-slot="desktop-floating-toolbar"] {')
    expect(source).toContain('--desktop-toolbar-fg: rgba(15, 23, 42, 0.48)')
    expect(source).toContain('[data-slot="tabs-subtle-icon-rail-icon"]')
    sessionStorage.clear()
  })

  it("keeps settings panel headings transparent", () => {
    const source = readFileSync(
      resolve(process.cwd(), "features/desktop-shell/components/InspectorControls.tsx"),
      "utf8",
    )

    expect(source).toContain("DESKTOP_INSPECTOR_HEADER_CLASS")
    expect(source).not.toContain("bg-[var(--desktop-inspector-header-bg)]")
  })

  it("toggles the desktop prototype between dark and light mode", async () => {
    const surface = await renderPrototype()
    const prototype = surface.container.querySelector('[data-slot="desktop-floating-toolbar-root"]')
    const historyActions = surface.container.querySelector('[data-slot="desktop-history-actions"]')
    const utilityToolbar = surface.container.querySelector('[data-slot="desktop-utility-toolbar"]')

    expect(prototype?.getAttribute("data-desktop-theme")).toBe("light")
    expect(surface.container.querySelector('[data-slot="desktop-action-toolbar"]')).toBeNull()
    expect(historyActions).not.toBeNull()
    expect(historyActions?.querySelector('button[aria-label="Switch to light mode"]')).toBeNull()
    expect(utilityToolbar?.querySelector('[data-slot="desktop-theme-toggle"]')).toBeNull()
    const dynamicIsland = surface.container.querySelector('[data-slot="desktop-dynamic-island"]')
    expect(dynamicIsland?.querySelector('[data-slot="desktop-theme-toggle"]')).not.toBeNull()
    expect(dynamicIsland?.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).not.toBeNull()
    expect(Array.from(historyActions?.querySelectorAll("button") ?? []).map((button) => button.getAttribute("aria-label"))).toEqual([
      "Reset defaults",
      "Undo",
      "Redo",
    ])
  })

  it("places save and download in the top-right utility toolbar", async () => {
    const surface = await renderPrototype()
    const utilityToolbar = surface.container.querySelector('[data-slot="desktop-utility-toolbar"]')

    expect(surface.container.querySelector('[data-slot="desktop-document-toolbar"]')).toBeNull()
    expect(getRequiredButton(utilityToolbar as HTMLElement, "Save")).not.toBeNull()
    expect(getRequiredButton(utilityToolbar as HTMLElement, "Download")).not.toBeNull()
    expect(utilityToolbar?.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).toBeNull()
    expect(utilityToolbar?.querySelector('[data-slot="desktop-theme-toggle"]')).toBeNull()
    const dynamicIsland = surface.container.querySelector('[data-slot="desktop-dynamic-island"]')
    expect(dynamicIsland?.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).not.toBeNull()
    expect(dynamicIsland?.querySelector('[data-slot="desktop-theme-toggle"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="dashboard-compose-toolbar"]')).toBeNull()
  })

  it("wires undo and redo through the top dynamic island history actions", async () => {
    const onUndo = vi.fn()
    const onRedo = vi.fn()
    const onResetDefaults = vi.fn()
    const onExportDownload = vi.fn()
    const surface = await renderPrototype({
      controller: {
        canRedo: true,
        canUndo: true,
        onExportDownload,
        onRedo,
        onResetDefaults,
        onUndo,
      },
    })
    const historyActions = getRequiredElement(surface.container, '[data-slot="desktop-history-actions"]')
    const utilityToolbar = surface.container.querySelector('[data-slot="desktop-utility-toolbar"]')

    expect(surface.container.querySelector('[data-slot="desktop-action-toolbar"]')).toBeNull()
    const islandAnchor = surface.container.querySelector('[data-slot="desktop-dynamic-island-anchor"]')
    const motionSource = readFileSync(
      resolve(process.cwd(), "features/desktop-shell/components/desktop-settings-toolbar-motion.css"),
      "utf8",
    )
    expect(motionSource).toContain("--desktop-settings-toolbar-width")
    expect(motionSource).toContain("desktop-dynamic-island-anchor")
    expect(islandAnchor).not.toBeNull()
    expect(utilityToolbar?.className).toContain("min-h-12")
    expect(getRequiredButton(utilityToolbar as HTMLElement, "Save").className).toContain("size-9")
    expect(getRequiredButton(utilityToolbar as HTMLElement, "Download").className).toContain("size-9")
    expect(utilityToolbar?.querySelector('[data-slot="desktop-save-trigger"]')).not.toBeNull()
    expect(utilityToolbar?.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).toBeNull()
    expect(getRequiredButton(historyActions, "Reset defaults").className).toContain("size-9")
    expect(getRequiredButton(historyActions, "Undo").className).toContain("size-9")
    expect(getRequiredButton(historyActions, "Redo").className).toContain("size-9")

    await act(async () => {
      getRequiredButton(historyActions, "Reset defaults").dispatchEvent(new MouseEvent("click", { bubbles: true }))
      getRequiredButton(historyActions, "Undo").dispatchEvent(new MouseEvent("click", { bubbles: true }))
      getRequiredButton(historyActions, "Redo").dispatchEvent(new MouseEvent("click", { bubbles: true }))
      getRequiredButton(utilityToolbar as HTMLElement, "Download").dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(onResetDefaults).toHaveBeenCalledTimes(1)
    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onRedo).toHaveBeenCalledTimes(1)
    expect(onExportDownload).toHaveBeenCalledTimes(1)
  })

  it("collapses and expands the settings toolbar from the brand sidebar control", async () => {
    sessionStorage.setItem(DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY, "false")
    const surface = await renderWithAsyncJsdomRoot(
      <DesktopSettingsToolbarShell
          showInspector
          inspector={<div data-slot="desktop-floating-inspector">Inspector</div>}
          model={
            {
              actualActiveTool: "content",
              onActiveToolChange: vi.fn(),
              visibleToolbarTools: [],
            } as unknown as DesktopInspectorModel
          }
        />
    )
    const shell = getRequiredElement(surface.container, '[data-slot="desktop-left-toolbar-shell"]')
    const brandButton = getRequiredButton(shell, "Collapse settings panel")
    const inspector = shell.querySelector('[data-slot="desktop-floating-inspector"]')

    expect(shell.getAttribute("data-collapsed")).toBe("false")
    expect(brandButton.getAttribute("aria-expanded")).toBe("true")
    expect(inspector).not.toBeNull()

    await act(async () => {
      brandButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(shell.getAttribute("data-collapsed")).toBe("true")
    expect(sessionStorage.getItem(DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY)).toBe("true")

    const expandButton = getRequiredButton(surface.container, "Expand settings panel")
    expect(expandButton.getAttribute("data-slot")).toBe("desktop-sidebar-toggle")

    await act(async () => {
      expandButton.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(shell.getAttribute("data-collapsed")).toBe("false")
    expect(shell.querySelector('[data-slot="desktop-floating-inspector"]')).not.toBeNull()
    expect(sessionStorage.getItem(DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY)).toBe("false")
  })

  it("defaults to a collapsed settings toolbar with a floating sidebar toggle", async () => {
    sessionStorage.clear()
    const surface = await renderWithAsyncJsdomRoot(
      <DesktopSettingsToolbarShell
          showInspector
          inspector={<div data-slot="desktop-floating-inspector">Inspector</div>}
          model={
            {
              actualActiveTool: "content",
              onActiveToolChange: vi.fn(),
              visibleToolbarTools: [],
            } as unknown as DesktopInspectorModel
          }
        />
    )
    const shell = getRequiredElement(surface.container, '[data-slot="desktop-left-toolbar-shell"]')
    const expandButton = getRequiredButton(surface.container, "Expand settings panel")

    expect(shell.getAttribute("data-collapsed")).toBe("true")
    expect(expandButton.getAttribute("data-slot")).toBe("desktop-sidebar-toggle")
  })

  it("restores collapsed settings toolbar state from sessionStorage", async () => {
    sessionStorage.setItem(DESKTOP_SETTINGS_TOOLBAR_COLLAPSED_STORAGE_KEY, "true")
    const surface = await renderPrototype({ controller: { activeTool: "content" } })
    const shell = getRequiredElement(surface.container, '[data-slot="desktop-left-toolbar-shell"]')

    expect(shell.getAttribute("data-collapsed")).toBe("true")
    sessionStorage.clear()
  })

  it("keeps the desktop workspace chrome contract for tool states and light tooltips", () => {
    const source = readFileSync(
      resolve(process.cwd(), "features/desktop-shell/components/DesktopWorkspace.tsx"),
      "utf8",
    )

    expect(source).toContain('[data-slot="dashboard-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button')
    expect(source).toContain('[data-toolbar-appearance="desktop-glass"] button svg')
    expect(source).toContain('[data-toolbar-appearance="desktop-glass"] button:active svg')
    expect(source).toContain('button[data-toolbar-appearance="desktop-glass"]:active svg')
    expect(source).toContain('[data-slot="drafting-layer-context-menu"][data-toolbar-appearance="desktop-glass"] button:active svg')
    expect(source).toContain('[data-slot="drafting-layer-floating-toolbar"][data-toolbar-appearance="desktop-glass"] button:active svg')
    expect(source).toContain('body:has([data-slot="desktop-workspace"]) [data-slot="drafting-layer-context-menu"]')
    expect(source).toContain("z-index: 60")
    expect(source).toContain("--drafting-canvas-dot-rgb: 246 248 251")
    expect(source).toContain("--drafting-canvas-dot-opacity: 0.075")
    expect(source).toContain("--drafting-canvas-dot-rgb: 15 23 42")
    expect(source).toContain("--drafting-canvas-dot-opacity: 0.08")
    expect(source).toContain("background-color: transparent !important")
    expect(source).toContain('[data-slot="dashboard-compose-surface"][data-grid-visible="false"]')
    expect(source).toContain("background-image: none !important")
    expect(source).toContain('[data-slot="desktop-resize-toolbar"] button:hover')
    expect(source).toContain('[data-slot="desktop-dynamic-island"] button:hover')
    expect(source).toContain('body:has([data-slot="desktop-workspace"][data-desktop-theme="light"]) [data-slot="drafting-layer-floating-toolbar"] button:hover')
    expect(source).toContain("background: rgba(15, 23, 42, 0.08) !important")
    expect(source).toContain("background: rgb(255, 255, 255) !important")
    expect(source).toContain('body:has([data-slot="desktop-workspace"][data-desktop-theme="dark"]) [data-slot="drafting-layer-context-menu"]')
    expect(source).toContain("background: rgb(23, 23, 23) !important")
    expect(source).toContain("border-radius: 9999px !important")
    expect(source).toContain("transform: none !important")
    expect(source).toContain("translate: none !important")
    expect(source).toContain("scale: none !important")
    expect(source).toContain("rotate: none !important")
    expect(source).toContain("button::before")
    expect(source).toContain("transform: scale(1)")
    expect(source).toContain("transition: none")
    expect(source).toContain("transition:")
    expect(source).toContain('button[aria-pressed="true"]')
    expect(source).toContain('button[aria-pressed="true"]::before')
    expect(source).toContain('[data-slot="dashboard-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button:active')
    expect(source).toContain('[data-slot="dashboard-compose-toolbar"][data-toolbar-appearance="desktop-glass"] button:active svg')
    expect(source).toContain("transform: scale(0.84) !important")
    expect(source).toContain('button[aria-pressed="true"]::before')
    expect(source).toContain("background: rgba(255, 255, 255, 0.16)")
    expect(source).not.toContain("box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12)")
    expect(source).not.toContain("box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.08)")
    expect(source).toContain(".desktop-tooltip-content")
    expect(source).toContain("background: rgba(15, 15, 15, 0.94) !important")
    expect(source).toContain('[data-slot="elastic-slider"]')
    expect(source).toContain("--elastic-slider-bg: rgba(15, 23, 42, 0.035)")
  })

  it("renders every remaining drafting settings tool in the desktop inspector format", async () => {
    const surface = await renderPrototype()
    const expectedSlots = [
      ["logo", "desktop-logo-inspector"],
      ["motion", "desktop-motion-inspector"],
      ["pattern", "desktop-pattern-inspector"],
      ["layers", "desktop-layers-inspector"],
      ["export", "desktop-export-inspector"],
    ] as const

    for (const [toolId, slot] of expectedSlots) {
      await openTool(surface.container, toolId)

      const inspector = surface.container.querySelector(
        '[data-slot="desktop-floating-inspector"]',
      )

      expect(inspector?.querySelector(`[data-slot="${slot}"]`)).not.toBeNull()
      expect(inspector?.textContent).not.toContain("Reset ")
      expect(inspector?.textContent).not.toContain("Coming soon")
    }
  })

  it("keeps duplicated layer appearance settings out of floating inspectors", async () => {
    const surface = await renderPrototype()

    await openTool(surface.container, "layers")

    const layersInspector = surface.container.querySelector('[data-slot="desktop-layers-inspector"]')

    expect(layersInspector?.textContent).toContain("Layer Stack")
    expect(layersInspector?.querySelector('[data-slot="desktop-transform-section"]')).toBeNull()
    expect(layersInspector?.querySelector('input[aria-label="Layer name"]')).toBeNull()
    expect(layersInspector?.querySelector('input[aria-label="Layer opacity"]')).toBeNull()
    expect(layersInspector?.querySelector('input[aria-label="Layer blur"]')).toBeNull()
    expect(layersInspector?.querySelector('input[aria-label="Layer shadow color"]')).toBeNull()

    await openTool(surface.container, "shape")

    const shapeInspector = surface.container.querySelector('[data-slot="desktop-shape-inspector"]')

    expect(shapeInspector?.querySelector('input[aria-label="Shape shadow color"]')).toBeNull()
    expect(shapeInspector?.querySelector('input[aria-label="Shape border color"]')).toBeNull()
    expect(shapeInspector?.querySelector('input[aria-label="Shape stroke color"]')).toBeNull()
  })

  it("renders the drafting content tab inside the floating inspector", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "content")

    const inspector = surface.container.querySelector(
      '[data-slot="desktop-floating-inspector"]',
    )
    const shell = surface.container.querySelector('[data-slot="desktop-left-toolbar-shell"]')

    expect(inspector).not.toBeNull()
    expect(inspector?.getAttribute("aria-label")).toBe("Content settings")
    expect(shell?.className).toContain("z-[25]")
    expect(shell?.querySelector('[data-slot="desktop-floating-inspector"]')).toBe(inspector)
    expect(inspector?.querySelector('[data-slot="desktop-content-inspector"]')).not.toBeNull()
    const scrollArea = inspector?.querySelector('[data-slot="desktop-inspector-scroll-area"]')
    const scrollViewport = inspector?.querySelector('[data-slot="desktop-inspector-scroll"]')
    const scrollGroups = Array.from(scrollViewport?.children ?? [])
    expect(scrollArea?.querySelector('[data-slot="scroll-area-viewport"]')).not.toBeNull()
    expect(scrollArea?.querySelector('[aria-hidden="true"] svg')).not.toBeNull()
    expect(scrollGroups).toHaveLength(3)
    expect(scrollGroups[0]?.getAttribute("data-slot")).toBe("desktop-content-type-section")
    expect(scrollGroups[0]?.className).toContain("bg-[var(--desktop-inspector-section-bg)]")
    expect(scrollGroups[1]?.className).toContain("bg-[var(--desktop-inspector-section-bg)]")
    expect(scrollGroups[2]?.tagName).toBe("DETAILS")
    expect(scrollGroups[2]?.className).toContain("bg-[var(--desktop-inspector-section-bg)]")
    expect(inspector?.querySelector('[data-slot="desktop-content-type-collection"]')).not.toBeNull()
    expect(inspector?.querySelector('[data-slot="desktop-content-type-filters"]')).toBeNull()
    expect(inspector?.querySelector('[data-slot="desktop-content-type-filter-trigger"]')).not.toBeNull()
    const filterSearchRow = inspector?.querySelector('[data-slot="desktop-content-filter-search-row"]')
    expect(filterSearchRow?.className).toContain("gap-2")
    const filterTrigger = filterSearchRow?.querySelector('[data-slot="desktop-content-type-filter-trigger"]')
    expect(filterTrigger?.className).toContain("t-morph-plus")
    const searchInput = filterSearchRow?.querySelector('input[aria-label="Search QR types"]')
    expect(searchInput).not.toBeNull()
    expect(searchInput?.className).toContain("desktop-inspector-input-bg")
    expect(searchInput?.className).toContain("rounded-full")
    expect(inspector?.querySelector('[data-slot="desktop-content-fields"]')).not.toBeNull()
    expect(inspector?.textContent).toContain("Content")
    expect(inspector?.textContent).toContain("Popular")
    expect(inspector?.textContent).toContain("Encoded value")
    expect(inspector?.textContent).not.toContain("Reset Content")
  })

  it("updates the content inspector when a Pixelmator-style preset is clicked", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "content")

    const linkPreset = getRequiredButton(surface.container, "Use Link content")

    await clickButton(linkPreset)

    expect(linkPreset.getAttribute("aria-pressed")).toBe("true")
    expect(linkPreset.getAttribute("data-desktop-content-type-option")).toBe("true")
    expectAnimatedOptionSelection(linkPreset)
    expect(linkPreset.className).not.toContain("border-white/55")
    expect(linkPreset.className).not.toContain("desktop-inspector-selected-bg")
    expect(linkPreset.className).not.toContain("desktop-inspector-selected-fg")
    expect(linkPreset.className).not.toContain("ff3b68")

    const textPreset = getRequiredButton(surface.container, "Use Text content")
    expect(textPreset.getAttribute("aria-pressed")).toBe("false")
    expect(textPreset.className).not.toContain("bg-white/[0.055]")
    expect(surface.container.textContent).toContain("Link")
    expect(surface.container.textContent).not.toContain("Needs input")
    expect(surface.container.querySelector('input[placeholder="https://example.com"]')).not.toBeNull()
  })

  it("keeps the desktop inspector free of pink accent tokens", () => {
    const source = readFileSync(
      resolve(process.cwd(), "features/desktop-shell/components/FloatingToolbar.tsx"),
      "utf8",
    )

    expect(source).not.toContain("ff3b68")
    expect(source).not.toContain("ff4f78")
    expect(source).not.toContain("ff9ab1")
    expect(source).not.toContain('[class*="bg-[#ff3b68]"]')
    expect(source).toContain("DESKTOP_INSPECTOR_SELECTED_CLASS")
    expect(source).toContain("DESKTOP_INSPECTOR_HEADER_CLASS")
    expect(source).toContain("DESKTOP_INSPECTOR_FOOTER_CLASS")
    expect(source).toContain("DESKTOP_INSPECTOR_RESET_CLASS")
    expect(source).toContain("--desktop-inspector-section-bg: rgba(255, 255, 255, 0.055)")
    expect(source).not.toContain('className="border-t border-white/[0.09] bg-black/20 p-3"')
    expect(source).not.toContain('className="mt-3 rounded-[10px] border border-white/[0.08] bg-white/[0.045] p-3"')
    expect(source).not.toContain("[data-slot=\"desktop-floating-inspector\"] [class*=\"bg-white/\"]")
    expect(source).not.toContain(".scroll-fade-effect-y > div")
  })

  it("renders a Pixelmator-style pattern inspector without a duplicate pattern card", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "pattern")

    const inspector = surface.container.querySelector(
      '[data-slot="desktop-floating-inspector"]',
    )
    expect(inspector?.getAttribute("aria-label")).toBe("Pattern settings")
    expect(inspector?.querySelector('[data-slot="desktop-pattern-inspector"]')).not.toBeNull()
    expect(inspector?.querySelector('[data-slot="desktop-pattern-preset-shelf-scroll-area"]')).not.toBeNull()
    expect(inspector?.querySelector('[data-slot="desktop-pattern-preset-shelf"]')).not.toBeNull()
    expect(inspector?.querySelector('[data-slot="desktop-pattern-chooser"]')).toBeNull()
    expect(inspector?.textContent).toContain("Module Pattern")
    expect(inspector?.textContent).toContain("Module Color")
    expect(inspector?.textContent).toContain("Error correction")
    expect(inspector?.querySelector('[data-slot="desktop-pattern-error-correction"]')).not.toBeNull()
    expect(inspector?.textContent).toContain("Patterns")
    expect(inspector?.textContent).not.toContain("Reset Pattern")
    expect(surface.container.querySelector('input[placeholder="Search patterns"]')).toBeNull()
  })

  it("updates error correction from the pattern inspector", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "pattern")

    const highCorrection = getRequiredButton(surface.container, "Use H error correction")

    await clickButton(highCorrection)

    expect(highCorrection.getAttribute("aria-selected")).toBe("true")
    expect(surface.container.textContent).toContain("≈30% recovery")
  })

  it("keeps module color mode controls flat until selected", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "pattern")

    const colorMode = surface.container.querySelector('[data-slot="desktop-pattern-color-mode"]')
    const solidMode = colorMode?.querySelector<HTMLButtonElement>('button[aria-selected="true"]')
    const gradientMode = getRequiredButton(surface.container, "Use Gradient module color")
    const patternsMode = getRequiredButton(surface.container, "Use Patterns module color")

    expect(solidMode?.getAttribute("aria-selected")).toBe("true")
    expect(solidMode?.className).not.toContain("border-[var(--desktop-inspector-option-selected-border)]")
    expect(gradientMode.getAttribute("aria-selected")).toBe("false")
    expect(patternsMode.getAttribute("aria-selected")).toBe("false")
  })

  it("updates the pattern inspector when a visual pattern is selected", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "pattern")

    const dotsPattern = getRequiredButton(surface.container, "Use Circle pattern")

    await clickButton(dotsPattern)

    expect(dotsPattern.getAttribute("aria-pressed")).toBe("true")
    expect(surface.container.textContent).toContain("Module Color")
  })

  it("uses an outer black selected ring with selected fill for module pattern options in light mode", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "pattern")

    const dotsPattern = getRequiredButton(surface.container, "Use Circle pattern")

    await clickButton(dotsPattern)

    const selectedSurface = dotsPattern.querySelector<HTMLElement>('[data-desktop-adaptive-option-preview="true"]')
    expect(dotsPattern.getAttribute("aria-pressed")).toBe("true")
    expectAnimatedOptionSelection(dotsPattern)
    expect(selectedSurface?.className).toContain("border-2")
    expect(selectedSurface?.className).not.toContain("border-[var(--desktop-inspector-option-selected-border)]")
    expect(selectedSurface?.style.backgroundColor).toBe("transparent")
  })

  it("uses an outer white selected ring with selected fill for module pattern options in dark mode", async () => {
    const surface = await renderPrototype()
    const themeToggle = getRequiredButton(surface.container, "Switch to dark mode")

    await clickButton(themeToggle)
    await openTool(surface.container, "pattern")

    const dotsPattern = getRequiredButton(surface.container, "Use Circle pattern")

    await clickButton(dotsPattern)

    const selectedSurface = dotsPattern.querySelector<HTMLElement>('[data-desktop-adaptive-option-preview="true"]')
    expect(dotsPattern.getAttribute("aria-pressed")).toBe("true")
    expectAnimatedOptionSelection(dotsPattern)
    expect(selectedSurface?.className).toContain("border-2")
    expect(selectedSurface?.className).not.toContain("border-[var(--desktop-inspector-option-selected-border)]")
    expect(selectedSurface?.style.backgroundColor).toBe("transparent")
    expect(selectedSurface?.style.color).toBe("rgb(248, 250, 252)")
  })

  it("renders larger module pattern previews inside square options", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "pattern")

    const dotsPattern = getRequiredButton(surface.container, "Use Circle pattern")
    const previewGlyph = dotsPattern.querySelector<HTMLElement>(
      '[data-desktop-adaptive-option-preview="true"] > span',
    )
    expect(previewGlyph?.className).toContain("size-[78%]")
  })

  it("renders a Pixelmator-style corners inspector with separate frame and dot shelves", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "corners")

    const inspector = surface.container.querySelector(
      '[data-slot="desktop-floating-inspector"]',
    )

    expect(inspector?.getAttribute("aria-label")).toBe("Corners settings")
    expect(inspector?.querySelector('[data-slot="desktop-corners-inspector"]')).not.toBeNull()
    expect(inspector?.querySelector('[data-impeccable-variant="original"]')?.className).toContain(
      "flex-1",
    )
    expect(inspector?.querySelector('[data-impeccable-variant="original"]')?.className).toContain(
      "min-h-0",
    )
    expect(inspector?.querySelector('[data-slot="desktop-inspector-scroll"]')).not.toBeNull()
    expect(inspector?.querySelector('[data-slot="desktop-corner-frame-preset-shelf"]')).not.toBeNull()
    expect(inspector?.querySelector('[data-slot="desktop-corner-dot-preset-shelf"]')).not.toBeNull()
    expect(inspector?.textContent).toContain("Corner Frame")
    expect(inspector?.textContent).toContain("Corner Dot")
    expect(inspector?.textContent).toContain("Frame Color")
    expect(inspector?.textContent).toContain("Dot Color")
    expect(inspector?.querySelector('[data-slot="desktop-corner-frame-color"]')).not.toBeNull()
    expect(inspector?.querySelector('[data-slot="desktop-corner-dot-color"]')).not.toBeNull()
    expect(inspector?.textContent).not.toContain("Reset Corners")
    expect(inspector?.textContent).not.toContain("Coming soon")
  })

  it("updates only the corner frame shelf when a frame preset is selected", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "corners")

    const squareFrame = getRequiredButton(surface.container, "Use Square corner frame")
    const defaultCornerDot = getRequiredButton(surface.container, "Use Circle corner dot")

    await clickButton(squareFrame)

    expect(squareFrame.getAttribute("aria-pressed")).toBe("true")
    expect(defaultCornerDot.getAttribute("aria-pressed")).toBe("true")
  })

  it("updates only the corner dot shelf when a dot preset is selected", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "corners")

    const defaultCornerFrame = getRequiredButton(surface.container, "Use Large rounded corner frame")
    const squareDot = getRequiredButton(surface.container, "Use Square corner dot")

    await clickButton(squareDot)

    expect(defaultCornerFrame.getAttribute("aria-pressed")).toBe("true")
    expect(squareDot.getAttribute("aria-pressed")).toBe("true")
  })

  it("uses an outer black selected ring with selected fill for corner frame and dot options in light mode", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "corners")

    const squareFrame = getRequiredButton(surface.container, "Use Square corner frame")
    const squareDot = getRequiredButton(surface.container, "Use Square corner dot")

    await act(async () => {
      squareFrame.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      squareDot.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const frameSurface = squareFrame.querySelector<HTMLElement>('[data-desktop-adaptive-option-preview="true"]')
    const dotSurface = squareDot.querySelector<HTMLElement>('[data-desktop-adaptive-option-preview="true"]')
    expect(squareFrame.getAttribute("aria-pressed")).toBe("true")
    expect(squareDot.getAttribute("aria-pressed")).toBe("true")
    expectAnimatedOptionSelection(squareFrame)
    expectAnimatedOptionSelection(squareDot)
    expect(frameSurface?.className).toContain("border-2")
    expect(dotSurface?.className).toContain("border-2")
    expect(frameSurface?.className).not.toContain("border-[var(--desktop-inspector-option-selected-border)]")
    expect(dotSurface?.className).not.toContain("border-[var(--desktop-inspector-option-selected-border)]")
    expect(frameSurface?.style.backgroundColor).toBe("transparent")
    expect(dotSurface?.style.backgroundColor).toBe("transparent")
  })

  it("uses an outer white selected ring with selected fill for corner frame and dot options in dark mode", async () => {
    const surface = await renderPrototype()
    const themeToggle = getRequiredButton(surface.container, "Switch to dark mode")

    await clickButton(themeToggle)
    await openTool(surface.container, "corners")

    const squareFrame = getRequiredButton(surface.container, "Use Square corner frame")
    const squareDot = getRequiredButton(surface.container, "Use Square corner dot")

    await act(async () => {
      squareFrame.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      squareDot.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    const frameSurface = squareFrame.querySelector<HTMLElement>('[data-desktop-adaptive-option-preview="true"]')
    const dotSurface = squareDot.querySelector<HTMLElement>('[data-desktop-adaptive-option-preview="true"]')
    expect(squareFrame.getAttribute("aria-pressed")).toBe("true")
    expect(squareDot.getAttribute("aria-pressed")).toBe("true")
    expectAnimatedOptionSelection(squareFrame)
    expectAnimatedOptionSelection(squareDot)
    expect(frameSurface?.className).toContain("border-2")
    expect(dotSurface?.className).toContain("border-2")
    expect(frameSurface?.className).not.toContain("border-[var(--desktop-inspector-option-selected-border)]")
    expect(dotSurface?.className).not.toContain("border-[var(--desktop-inspector-option-selected-border)]")
    expect(frameSurface?.style.backgroundColor).toBe("transparent")
    expect(frameSurface?.style.color).toBe("rgb(248, 250, 252)")
    expect(dotSurface?.style.backgroundColor).toBe("transparent")
    expect(dotSurface?.style.color).toBe("rgb(248, 250, 252)")
    expect(
      squareDot
        .querySelector('[data-slot="style-preview-corner-dot"] [data-testid="finder-patterns-inner"]')
        ?.getAttribute("fill"),
    ).toBe("currentColor")
  })

  it("renders larger corner previews inside square options", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "corners")

    const squareFrame = getRequiredButton(surface.container, "Use Square corner frame")
    const squareDot = getRequiredButton(surface.container, "Use Square corner dot")
    const frameGlyph = squareFrame.querySelector<HTMLElement>(
      '[data-desktop-adaptive-option-preview="true"] > span',
    )
    const dotGlyph = squareDot.querySelector<HTMLElement>(
      '[data-desktop-adaptive-option-preview="true"] > span',
    )
    expect(frameGlyph?.className).toContain("size-[68%]")
    expect(dotGlyph?.className).toContain("size-[68%]")
  })

  it("keeps corner frame and dot option cards on compact three-column shelves", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "corners")

    const frameShelf = surface.container.querySelector<HTMLElement>(
      '[data-slot="desktop-corner-frame-preset-shelf"] .grid',
    )
    const dotShelf = surface.container.querySelector<HTMLElement>(
      '[data-slot="desktop-corner-dot-preset-shelf"] .grid',
    )
    expect(frameShelf?.className).toContain("grid-cols-3")
    expect(frameShelf?.className).not.toContain("grid-cols-2")
    expect(dotShelf?.className).toContain("grid-cols-3")
    expect(dotShelf?.className).not.toContain("grid-cols-2")
  })

  it("keeps corner frame and dot color controls independent", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "corners")

    const frameGradient = getRequiredButton(surface.container, "Use gradient corner frame color")
    const dotSolid = getRequiredButton(surface.container, "Use solid corner dot color")

    await clickButton(frameGradient)

    expect(frameGradient.getAttribute("aria-selected")).toBe("true")
    expect(dotSolid.getAttribute("aria-selected")).toBe("true")
    expect(surface.container.querySelector('input[aria-label="Frame start color"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="gradient-offset-range-slider"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="gradient-offset-track"]')).not.toBeNull()
    expect(surface.container.querySelector('input[aria-label="Dot solid color"]')).not.toBeNull()
  })

  it("renders color picker triggers as circular swatches with a dark mode border", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "pattern")

    const swatch = getRequiredButton(surface.container, "Solid color swatch")
    const hexInput = getRequiredInput(surface.container, "Solid color")

    expect(swatch.className).toContain("rounded-full")
    expect(swatch.className).toContain("size-7")
    expect(swatch.querySelector('[data-slot="desktop-color-swatch-fill"]')).not.toBeNull()
    expect(swatch.className).not.toContain("w-12")
    expect(swatch.className).not.toContain("rounded-[6px]")
    expect(swatch.getAttribute("data-slot")).toBe("desktop-color-picker")
    expect(swatch.closest("label")).toBeNull()
    expect(hexInput.className).toContain("w-20")
    expect(surface.container.querySelector('input[type="color"]')).toBeNull()

    await clickButton(swatch)

    expect(document.body.querySelector('[data-slot="color-picker"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="color-picker-area"]')).not.toBeNull()

    await clickButton(getRequiredButton(surface.container, "Use Patterns module color"))

    const patternSwatch = getRequiredButton(surface.container, "Pattern color 1")
    const patternPaletteRow = patternSwatch.closest(".justify-between")
    const patternPaletteLabel = Array.from(
      surface.container.querySelectorAll('[data-slot="desktop-module-color"] span'),
    ).find((element) => element.textContent === "Palette")
    const patternPaletteControls = patternSwatch.parentElement
    expect(patternSwatch.className).toContain("rounded-full")
    expect(patternSwatch.className).toContain("size-7")
    expect(patternSwatch.querySelector('[data-slot="desktop-color-swatch-fill"]')).not.toBeNull()
    expect(patternSwatch.className).not.toContain("border-white")
    expect(patternSwatch.getAttribute("data-slot")).toBe("desktop-color-picker")
    expect(patternPaletteLabel).not.toBeNull()
    expect(patternPaletteControls?.className).toContain("justify-end")
    expect(patternPaletteRow).not.toBeNull()

    await clickButton(patternSwatch)

    expect(document.body.querySelector('[data-slot="color-picker"]')).not.toBeNull()
    expect(document.body.querySelector('[data-slot="color-picker-area"]')).not.toBeNull()
  })

  it("updates desktop swatch color from the color picker input as hex", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "pattern")

    const swatch = getRequiredButton(surface.container, "Solid color swatch")
    await clickButton(swatch)

    const pickerInput = getRequiredInput(document.body, "Hex value")
    const solidInput = getRequiredInput(surface.container, "Solid color")

    await act(async () => {
      setInputValue(pickerInput, "ff5500")
      pickerInput.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }))
    })

    expect(solidInput.value).toMatch(/^#[0-9a-f]{6}$/i)
    expect(solidInput.value.toLowerCase()).toBe("#ff5500")
  })

  it("renders curated pattern palette presets and applies them", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "pattern")

    await clickButton(getRequiredButton(surface.container, "Use Patterns module color"))

    const presetGrid = surface.container.querySelector('[data-slot="desktop-pattern-palette-presets"]')
    const presetButtons = presetGrid?.querySelectorAll("button")
    const customPreset = getRequiredButton(surface.container, "Use custom pattern palette")
    const signalPreset = getRequiredButton(surface.container, "Use Signal pattern palette")
    const auroraPreset = getRequiredButton(surface.container, "Use Aurora pattern palette")

    expect(presetGrid).not.toBeNull()
    expect(presetButtons).toHaveLength(31)
    expect(customPreset.getAttribute("aria-pressed")).toBe("false")
    expect(signalPreset.getAttribute("aria-pressed")).toBe("true")
    expect(auroraPreset.getAttribute("aria-pressed")).toBe("false")
    expect(
      Array.from(surface.container.querySelectorAll("button")).some(
        (button) => button.getAttribute("aria-label") === "Pattern color 1",
      ),
    ).toBe(false)

    await clickButton(customPreset)

    expect(customPreset.getAttribute("aria-pressed")).toBe("true")
    expect(signalPreset.getAttribute("aria-pressed")).toBe("false")
    expect(getRequiredButton(surface.container, "Pattern color 1")).toBeTruthy()

    await clickButton(auroraPreset)

    expect(auroraPreset.getAttribute("aria-pressed")).toBe("true")
    expect(customPreset.getAttribute("aria-pressed")).toBe("false")
    expect(signalPreset.getAttribute("aria-pressed")).toBe("false")
    expect(
      Array.from(surface.container.querySelectorAll("button")).some(
        (button) => button.getAttribute("aria-label") === "Pattern color 1",
      ),
    ).toBe(false)
  })

  it("renders a Pixelmator-style shape inspector without placeholder copy", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "shape")

    const inspector = surface.container.querySelector(
      '[data-slot="desktop-floating-inspector"]',
    )

    expect(inspector?.getAttribute("aria-label")).toBe("Frame settings")
    expect(inspector?.querySelector('[data-slot="desktop-shape-inspector"]')).not.toBeNull()
    expect(inspector?.textContent).toContain("Shape")
    expect(inspector?.textContent).not.toContain("Coming soon")
  })

  it("renders card size templates in the layout inspector", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "layout")

    const sizeSection = surface.container.querySelector('[data-slot="desktop-card-size"]')
    const templateSection = surface.container.querySelector('[data-slot="desktop-size-template-section"]')
    expect(sizeSection).not.toBeNull()
    expect(templateSection).not.toBeNull()
    expect(sizeSection?.textContent).toContain("Size")
    expect(templateSection?.querySelector('[data-slot="desktop-size-filter-search-row"]')).not.toBeNull()
    expect(
      templateSection?.querySelector('input[placeholder="Search"]'),
    ).not.toBeNull()
    expect(
      surface.container.querySelector('button[aria-label="Use Business card size 1050 by 600"]'),
    ).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-size-template-collection"]')).not.toBeNull()
  })

  it("renders shape options, color controls, and preset shelf", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "shape")

    const inspector = surface.container.querySelector(
      '[data-slot="desktop-floating-inspector"]',
    )

    const shapePresetScrollArea = inspector?.querySelector(
      '[data-slot="desktop-shape-preset-shelf-scroll-area"]',
    )
    const shapePresetScrollViewport = inspector?.querySelector(
      '[data-slot="desktop-shape-preset-shelf"]',
    )

    expect(shapePresetScrollArea).not.toBeNull()
    expect(shapePresetScrollArea?.className).toContain("h-[16.5rem]")
    expect(shapePresetScrollArea?.querySelector('[data-slot="scroll-area-viewport"]')).not.toBeNull()
    expect(shapePresetScrollViewport).not.toBeNull()
    expect(shapePresetScrollArea?.querySelector('[data-slot="scroll-area-viewport"]')).not.toBeNull()
    expect(shapePresetScrollArea?.querySelector('[aria-hidden="true"] svg')).not.toBeNull()
    expect(inspector?.querySelector('[data-slot="desktop-inspector-scroll-area"]')).not.toBeNull()
    expect(
      inspector
        ?.querySelector('[data-slot="desktop-inspector-scroll"]')
        ?.children[0]
        ?.getAttribute("class"),
    ).toContain("bg-[var(--desktop-inspector-section-bg)]")
    expect(inspector?.querySelector('[data-slot="desktop-shape-color-mode"]')).not.toBeNull()
    expect(inspector?.textContent).toContain("Shape Options")
    expect(inspector?.textContent).toContain("Shape Color")
    expect(inspector?.textContent).not.toContain("Reset Shape")
  })

  it("does not render card size templates in the frame inspector", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "shape")

    expect(surface.container.querySelector('[data-slot="desktop-card-size"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-size-template-section"]')).toBeNull()
  })

  it("lists every drafting card pattern in the background patterns grid", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "background")

    const patternsTab = getRequiredButton(surface.container, "Background Patterns")
    await clickButton(patternsTab)

    const patternGrid = surface.container.querySelector('[data-slot="desktop-card-patterns"]')

    expect(patternGrid).not.toBeNull()
    expect(patternGrid?.querySelectorAll("button").length).toBe(DRAFTING_CARD_PATTERNS.length)
    expect(
      surface.container.querySelector('button[aria-label="Use Pattern 145 decoration pattern"]'),
    ).not.toBeNull()
  })

  it("does not render card fill patterns in the frame inspector", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "shape")

    expect(surface.container.querySelector('[data-slot="desktop-card-patterns"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-shape-patterns"]')).toBeNull()
  })

  it("does not cap shape fill patterns in the desktop inspector source", () => {
    const source = readFileSync(
      resolve(process.cwd(), "features/desktop-shell/components/FloatingToolbar.tsx"),
      "utf8",
    )

    expect(source).not.toContain("DRAFTING_CARD_PATTERNS.slice(0, 8)")
  })

  it("shows pattern color inputs for the selected card fill pattern", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "background")
    await clickButton(getRequiredButton(surface.container, "Background Patterns"))

    const pattern003 = getRequiredButton(surface.container, "Use Pattern 003 decoration pattern")
    await clickButton(pattern003)

    const colorRows = surface.container.querySelector('[data-slot="desktop-card-pattern-colors"]')
    expect(colorRows).not.toBeNull()
    expect(getRequiredInput(surface.container, "Color 1").value).toBe("#c02942")
    expect(getRequiredInput(surface.container, "Color 2").value).toBe("#53777a")
    expect(getRequiredInput(surface.container, "Color 3").value).toBe("#ecd078")
    expect(getRequiredInput(surface.container, "Color 4").value).toBe("#d95b43")

    const pattern005 = getRequiredButton(surface.container, "Use Pattern 005 decoration pattern")
    await clickButton(pattern005)

    expect(surface.container.querySelectorAll('[data-slot="desktop-card-pattern-colors"] input')).toHaveLength(2)
    expect(getRequiredInput(surface.container, "Color 1").value).toBe("#f7d2a1")
    expect(getRequiredInput(surface.container, "Color 2").value).toBe("#05057e")

    await act(async () => {
      setInputValue(getRequiredInput(surface.container, "Color 1"), "#112233")
    })

    expect(getRequiredInput(surface.container, "Color 1").value).toBe("#112233")
  })

  it("shows only base color when no card pattern is selected", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "background")
    await clickButton(getRequiredButton(surface.container, "Background Patterns"))

    expect(surface.container.querySelectorAll('[data-slot="desktop-card-pattern-colors"] input')).toHaveLength(1)
    expect(getRequiredInput(surface.container, "Color 1").value).toBe("#ffd80a")

    await clickButton(getRequiredButton(surface.container, "Use Pattern 003 decoration pattern"))
    expect(surface.container.querySelectorAll('[data-slot="desktop-card-pattern-colors"] input')).toHaveLength(4)
  })

  it("selects a shape preset without changing shape color mode", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "shape")

    const circleShape = getRequiredButton(surface.container, "Use Circle shape")
    const solidMode = getRequiredButton(surface.container, "Use solid shape color")

    await clickButton(circleShape)

    expect(circleShape.getAttribute("aria-pressed")).toBe("true")
    expect(circleShape.getAttribute("data-desktop-option-tile")).toBe("true")
    expectAnimatedOptionSelection(circleShape)
    expect(solidMode.getAttribute("aria-selected")).toBe("true")
    expect(solidMode.className).not.toContain("border-[var(--desktop-inspector-option-selected-border)]")
    expect(surface.container.querySelector('input[aria-label="Shape solid color"]')).not.toBeNull()
  })

  it("switches shape solid and gradient color controls", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "shape")

    const gradientMode = getRequiredButton(surface.container, "Use gradient shape color")

    await clickButton(gradientMode)

    expect(gradientMode.getAttribute("aria-selected")).toBe("true")
    expect(surface.container.querySelector('input[aria-label="Shape start color"]')).not.toBeNull()
    expect(surface.container.querySelector('input[aria-label="Shape end color"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="gradient-offset-range-slider"]')).not.toBeNull()
    expect(surface.container.querySelector('input[aria-label="Shape solid color"]')).toBeNull()
  })

  it("updates the shape solid color input", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "shape")

    const solidInput = getRequiredInput(surface.container, "Shape solid color")

    await act(async () => {
      setInputValue(solidInput, "#ff0000")
    })

    expect(getRequiredInput(surface.container, "Shape solid color").value).toBe("#ff0000")
  })

  it("updates the shape gradient color inputs", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "shape")

    await clickButton(getRequiredButton(surface.container, "Use gradient shape color"))

    await act(async () => {
      setInputValue(getRequiredInput(surface.container, "Shape start color"), "#00ff00")
      setInputValue(getRequiredInput(surface.container, "Shape end color"), "#0000ff")
    })

    expect(getRequiredInput(surface.container, "Shape start color").value).toBe("#00ff00")
    expect(getRequiredInput(surface.container, "Shape end color").value).toBe("#0000ff")
  })

  it("renders shape numeric controls as desktop elastic sliders", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "shape")

    const elasticLabels = [
      "Corner radius",
      "Padding",
      "Bottom space",
    ]

    for (const label of elasticLabels) {
      expect(getRequiredSlider(surface.container, label)).not.toBeNull()
      expect(surface.container.querySelector(`input[type="number"][aria-label="${label}"]`)).toBeNull()
    }

    expect(getRequiredSliderRow(surface.container, "Corner radius").textContent).toBe("Corner radius28")
    expect(getRequiredSliderRow(surface.container, "Padding").textContent).toBe("Padding0")
    expect(getRequiredSliderRow(surface.container, "Bottom space").textContent).toBe("Bottom space128")

    await act(async () => {
      getRequiredSlider(surface.container, "Corner radius").dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "End" }),
      )
    })

    expect(getRequiredSlider(surface.container, "Corner radius").getAttribute("aria-valuenow")).toBe("64")
  })

  it("renders transform controls below the layer stack in the layers inspector", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Selected" })
    const surface = await renderPrototype({
      controller: {
        activeTool: "layers",
        selectedTransformLayer: layer,
        onTransformLayerPatch: vi.fn(),
      },
    })

    const layersInspector = surface.container.querySelector('[data-slot="desktop-layers-inspector"]')
    const stackSection = layersInspector?.querySelector('[data-slot="desktop-layer-list"]')
    const transformSection = layersInspector?.querySelector('[data-slot="desktop-transform-section"]')

    expect(layersInspector).not.toBeNull()
    expect(stackSection).not.toBeNull()
    expect(transformSection).not.toBeNull()
    expect(surface.container.querySelector('[data-tool-id="transform"]')).toBeNull()
    expect(
      stackSection?.compareDocumentPosition(transformSection!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it("renders a compact Pixelmator-style motion inspector without placeholder copy", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "motion")

    const inspector = surface.container.querySelector(
      '[data-slot="desktop-floating-inspector"]',
    )

    expect(inspector?.getAttribute("aria-label")).toBe("Motion settings")
    expect(inspector?.querySelector('[data-slot="desktop-motion-inspector"]')).not.toBeNull()
    expect(inspector?.textContent).toContain("Motion")
    expect(inspector?.textContent).not.toContain("Coming soon")
  })

  it("renders compact motion sections and loader shelf", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "motion")

    const inspector = surface.container.querySelector(
      '[data-slot="desktop-floating-inspector"]',
    )
    const scrollArea = inspector?.querySelector(
      '[data-slot="desktop-inspector-scroll-area"]',
    )
    const scrollViewport = inspector?.querySelector(
      '[data-slot="desktop-inspector-scroll"]',
    )

    expect(inspector?.querySelector('[data-slot="desktop-motion-loader-shelf"]')).not.toBeNull()
    expect(scrollArea?.querySelector('[data-slot="scroll-area-viewport"]')).not.toBeNull()
    expect(scrollArea?.querySelector('[aria-hidden="true"] svg')).not.toBeNull()
    expect(inspector?.textContent).toContain("Motion")
    expect(inspector?.textContent).toContain("Loader")
    expect(inspector?.textContent).toContain("Loader Color")
    expect(inspector?.textContent).toContain("Output")
    expect(inspector?.textContent).not.toContain("Reset Motion")

    const motionToggle = getRequiredButton(surface.container, "Dot matrix motion")
    const defaultLoader = getRequiredButton(surface.container, "Use Neon Drift motion loader")

    expect(motionToggle.getAttribute("aria-pressed")).toBe("false")
    expect(motionToggle.className).not.toContain("desktop-inspector-control-bg")
    expect(defaultLoader.getAttribute("aria-pressed")).toBe("true")
    expectAnimatedOptionSelection(defaultLoader)
    expect(defaultLoader.className).not.toContain("ring-black")
  })

  it("toggles dot matrix motion without changing the default loader", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "motion")

    const motionToggle = getRequiredButton(surface.container, "Dot matrix motion")
    const defaultLoader = getRequiredButton(surface.container, "Use Neon Drift motion loader")

    expect(motionToggle.getAttribute("aria-pressed")).toBe("false")
    expect(defaultLoader.getAttribute("aria-pressed")).toBe("true")

    await clickButton(motionToggle)

    expect(motionToggle.getAttribute("aria-pressed")).toBe("true")
    expect(defaultLoader.getAttribute("aria-pressed")).toBe("true")
  })

  it("selects a standard motion preset", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "motion")

    const orbitReveal = getRequiredButton(surface.container, "Use Orbit Reveal motion loader")

    await clickButton(orbitReveal)

    expect(orbitReveal.getAttribute("aria-pressed")).toBe("true")
    expect(getRequiredButton(surface.container, "Use Fade In Top Down motion loader").getAttribute("aria-pressed")).toBe("false")
  })

  it("updates motion speed, matrix density, and overlay scale sliders", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "motion")

    await act(async () => {
      getRequiredSlider(surface.container, "Motion speed").dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "End" }),
      )
      getRequiredSlider(surface.container, "Motion matrix density").dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "End" }),
      )
      getRequiredSlider(surface.container, "Motion overlay scale").dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "End" }),
      )
    })

    expect(getRequiredSlider(surface.container, "Motion speed").getAttribute("aria-valuenow")).toBe("10")
    expect(getRequiredSlider(surface.container, "Motion matrix density").getAttribute("aria-valuenow")).toBe("25")
    expect(surface.container.textContent).toContain("25x25")
    expect(getRequiredSlider(surface.container, "Motion overlay scale").getAttribute("aria-valuenow")).toBe("140")
  })

  it("renders compact motion sliders with the desktop elastic slider component", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "motion")

    expect(surface.container.querySelectorAll('[data-slot="desktop-elastic-slider"]')).toHaveLength(3)
    expect(surface.container.querySelector('input[type="range"][aria-label^="Motion "]')).toBeNull()
    expect(getRequiredSlider(surface.container, "Motion speed")).not.toBeNull()
    expect(getRequiredSlider(surface.container, "Motion matrix density")).not.toBeNull()
    expect(getRequiredSlider(surface.container, "Motion overlay scale")).not.toBeNull()
    expect(getRequiredSliderRow(surface.container, "Motion speed").textContent).toBe("Speed3x")
    expect(getRequiredSliderRow(surface.container, "Motion matrix density").textContent).toBe("Matrix density5x5")
    expect(getRequiredSliderRow(surface.container, "Motion overlay scale").textContent).toBe("Overlay scale100%")
    expect(
      getRequiredSlider(surface.container, "Motion speed")
        .closest('[data-slot="elastic-slider"]')
        ?.className,
    ).toContain("[--elastic-slider-label:rgba(255,255,255,0.58)]")
    expect(surface.container.innerHTML).toContain('[data-slot="elastic-slider-label"]')
    expect(surface.container.innerHTML).toContain("color: rgba(255, 255, 255, 0.86) !important")
    expect(surface.container.innerHTML).toContain('data-desktop-theme="light"] [data-slot="desktop-floating-inspector"] [data-slot="elastic-slider-label"]')
    expect(getRequiredSliderRow(surface.container, "Motion speed").className).not.toContain("desktop-inspector-control-bg")
    expect(getRequiredSliderRow(surface.container, "Motion matrix density").className).not.toContain("desktop-inspector-control-bg")
    expect(getRequiredSliderRow(surface.container, "Motion overlay scale").className).not.toContain("desktop-inspector-control-bg")
  })

  it("hides custom motion color inputs for non-theme color presets", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "motion")

    await clickButton(getRequiredButton(surface.container, "Use Mint motion colors"))

    expect(getRequiredButton(surface.container, "Use Mint motion colors").getAttribute("aria-pressed")).toBe("true")
    expect(surface.container.querySelector('input[aria-label="Motion base color"]')).toBeNull()
    expect(surface.container.querySelector('input[aria-label="Motion mid color"]')).toBeNull()
    expect(surface.container.querySelector('input[aria-label="Motion peak color"]')).toBeNull()
  })

  it("shows and updates custom motion theme colors", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "motion")

    await act(async () => {
      getRequiredButton(surface.container, "Use Mint motion colors").dispatchEvent(new MouseEvent("click", { bubbles: true }))
      getRequiredButton(surface.container, "Use Theme motion colors").dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    await act(async () => {
      setInputValue(getRequiredInput(surface.container, "Motion base color"), "#111111")
      setInputValue(getRequiredInput(surface.container, "Motion mid color"), "#555555")
      setInputValue(getRequiredInput(surface.container, "Motion peak color"), "#eeeeee")
    })

    expect(getRequiredInput(surface.container, "Motion base color").value).toBe("#111111")
    expect(getRequiredInput(surface.container, "Motion mid color").value).toBe("#555555")
    expect(getRequiredInput(surface.container, "Motion peak color").value).toBe("#eeeeee")
  })

  it("updates motion preview and animated SVG export toggles independently", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "motion")

    const previewToggle = getRequiredButton(surface.container, "Animated preview")
    const exportToggle = getRequiredButton(surface.container, "Animated SVG export")

    expect(previewToggle.getAttribute("aria-pressed")).toBe("true")
    expect(exportToggle.getAttribute("aria-pressed")).toBe("false")

    await act(async () => {
      previewToggle.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      exportToggle.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(previewToggle.getAttribute("aria-pressed")).toBe("false")
    expect(exportToggle.getAttribute("aria-pressed")).toBe("true")
  })

  it("renders a compact Pixelmator-style text inspector without placeholder copy", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Hello" })
    const surface = await renderPrototype({
      controller: {
        activeTool: null,
        selectedElementLayer: layer,
        onElementLayerPatch: vi.fn(),
      },
    })

    const inspector = surface.container.querySelector(
      '[data-slot="desktop-floating-inspector"]',
    )

    expect(inspector?.getAttribute("aria-label")).toBe("text element settings")
    expect(inspector?.querySelector('[data-slot="desktop-element-inspector"]')).not.toBeNull()
    expect(inspector?.textContent).toContain("Text")
    expect(inspector?.textContent).not.toContain("Coming soon")
  })

  it("renders compact text sections", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Hello" })
    const surface = await renderPrototype({
      controller: {
        activeTool: null,
        selectedElementLayer: layer,
        onElementLayerPatch: vi.fn(),
      },
    })

    const inspector = surface.container.querySelector(
      '[data-slot="desktop-floating-inspector"]',
    )

    expect(inspector?.querySelector('[data-slot="desktop-layer-text-font-selector"]')).not.toBeNull()
    expect(inspector?.querySelector('[data-slot="desktop-layer-text-font-listbox"]')).toBeNull()
    expect(inspector?.querySelector('[data-slot="desktop-layer-text-alignment"]')).not.toBeNull()
    expect(inspector?.querySelector('select[aria-label="Text preset"]')).toBeNull()
    expect(inspector?.querySelector('select[aria-label="Text font"]')).toBeNull()
    expect(inspector?.textContent).toContain("Text")
    expect(inspector?.textContent).toContain("Typography")
    expect(inspector?.querySelector('[data-slot="desktop-layer-text-emphasis"]')).not.toBeNull()
    expect(inspector?.textContent).not.toContain("Preset")
    expect(inspector?.textContent).toContain("Color")
    expect(inspector?.textContent).toContain("Alignment")
    expect(inspector?.textContent).toContain("Spacing")
    expect(getRequiredSlider(surface.container, "Letter spacing")).not.toBeNull()
    expect(getRequiredSlider(surface.container, "Line height")).not.toBeNull()
    expect(getRequiredButton(surface.container, "Text font").className).not.toContain("desktop-inspector-control-bg")
    expect(getRequiredTextarea(surface.container, "Text layer content").className).toContain("desktop-inspector-field-bg")
    expect(getRequiredTextarea(surface.container, "Text layer content").className).not.toContain("border-white")
    expect(getRequiredButton(surface.container, "Bold").className).not.toContain("desktop-inspector-control-bg")
    expect(getRequiredButton(surface.container, "Align text left").getAttribute("aria-pressed")).toBe("true")
    expect(getRequiredButton(surface.container, "Align text left").className).toContain("desktop-inspector-option-selected-bg")
    expect(getRequiredButton(surface.container, "Align text left").className).not.toContain("border-[var(--desktop-inspector-option-selected-border)]")
    expect(inspector?.textContent).not.toContain("Reset Text")
    expect(inspector?.querySelector('[data-slot="desktop-effects-section"]')).toBeNull()
  })

  it("keeps desktop content picker defaults flat with ring and fill selection", async () => {
    const surface = await renderPrototype()
    await openTool(surface.container, "content")

    const filterTrigger = getRequiredButton(surface.container, "Filter QR types")
    const textOption = getRequiredButton(surface.container, "Use Text content")
    const selectedOption = surface.container.querySelector<HTMLButtonElement>(
      '[data-desktop-content-type-option="true"][aria-pressed="true"]',
    )

    expect(filterTrigger.className).not.toContain("bg-black/10")
    expect(textOption.className).not.toContain("bg-white/[0.055]")
    expect(textOption.className).not.toContain("desktop-inspector-control-bg")
    expect(textOption.className).toContain("border-transparent")
    expect(selectedOption?.className).not.toContain("desktop-inspector-selected-bg")
    expect(selectedOption?.className).not.toContain("bg-[var(--desktop-inspector-selected-bg)]")
    expect(selectedOption).not.toBeNull()
    expectAnimatedOptionSelection(selectedOption!)
    expect(filterTrigger.className).toContain("rounded-[7px]")

    const source = readFileSync(
      resolve(process.cwd(), "features/desktop-shell/components/FloatingToolbar.tsx"),
      "utf8",
    )
    expect(source).toContain('data-slot="desktop-content-type-filter-menu"')
    expect(source).toContain('{ id: "all", label: "All" }')
    expect(source).toContain("w-32")
    expect(source).toContain("bg-white")
    expect(source).toContain("bg-[#111116]")
    expect(source).toContain("[&_[data-slot=dropdown-menu-radio-item-indicator]]:hidden")
    expect(source).not.toContain("[&_[data-slot=dropdown-menu-radio-item-indicator]]:left-3")
    expect(source).not.toContain("data-[state=checked]:ring-2")
    expect(source).not.toContain("data-[state=checked]:focus:bg-transparent")
    expect(source).toContain("data-[state=checked]:focus:bg-slate-950/[0.08]")
    expect(source).toContain("data-[state=checked]:focus:bg-white/[0.1]")
    expect(source).not.toContain("[&_[data-slot=dropdown-menu-radio-item-indicator]]:text-current")
    expect(source).not.toContain("data-[state=checked]:focus:[&_[data-slot=dropdown-menu-radio-item-indicator]]")
    expect(source).not.toContain("[data-slot=dropdown-menu-radio-item-indicator]_svg")
    expect(source).toContain(':not([data-desktop-preview-option="true"]):not([data-desktop-content-type-option="true"]):not([data-desktop-option-tile="true"]):hover')
  })

  it("keeps logo size rows flat instead of stacking grey controls", async () => {
    const surface = await renderPrototype()

    await openTool(surface.container, "logo")

    const logoMargin = getRequiredInput(surface.container, "Logo margin")
    const logoMarginRow = logoMargin.closest("label")
    const hideDots = getRequiredButton(surface.container, "Hide background dots")

    expect(logoMarginRow?.className).not.toContain("desktop-inspector-control-bg")
    expect(hideDots.className).not.toContain("desktop-inspector-control-bg")
  })

  it("removes header preview tiles from desktop color selection sections", async () => {
    const surface = await renderPrototype()

    await openTool(surface.container, "pattern")

    const moduleColor = surface.container.querySelector('[data-slot="desktop-module-color"]')
    expect(moduleColor?.textContent).toContain("Module Color")
    expect(moduleColor?.querySelector('[data-slot="desktop-style-preview-surface"]')).toBeNull()

    await openTool(surface.container, "corners")

    const frameColor = surface.container.querySelector('[data-slot="desktop-corner-frame-color"]')
    const dotColor = surface.container.querySelector('[data-slot="desktop-corner-dot-color"]')
    expect(frameColor?.textContent).toContain("Frame Color")
    expect(dotColor?.textContent).toContain("Dot Color")
    expect(frameColor?.querySelector('[data-slot="desktop-style-preview-surface"]')).toBeNull()
    expect(dotColor?.querySelector('[data-slot="desktop-style-preview-surface"]')).toBeNull()

    await openTool(surface.container, "shape")

    const shapeColor = surface.container.querySelector('[data-slot="desktop-shape-color"]')
    expect(shapeColor?.textContent).toContain("Shape Color")
    expect(shapeColor?.querySelector('[data-slot="desktop-style-preview-surface"]')).toBeNull()

    await openTool(surface.container, "logo")

    const logoColor = surface.container.querySelector('[data-slot="desktop-logo-color"]')
    expect(logoColor?.textContent).toContain("Icon Color")
    expect(logoColor?.querySelector('[data-slot="desktop-style-preview-surface"]')).toBeNull()
  })

  it("updates text content locally", async () => {
    const surface = await renderSelectedTextInspector()

    const textArea = getRequiredTextarea(surface.container, "Text layer content")

    await act(async () => {
      setTextareaValue(textArea, "Launch label")
    })

    expect(getRequiredTextarea(surface.container, "Text layer content").value).toBe("Launch label")
  })

  it("selects a text font from a compact selector without changing the text content", async () => {
    const surface = await renderSelectedTextInspector()

    await act(async () => {
      setTextareaValue(getRequiredTextarea(surface.container, "Text layer content"), "Keep this copy")
    })

    const fontTrigger = getRequiredButton(surface.container, "Text font")

    await clickButton(fontTrigger)

    const fontListbox = surface.container.querySelector('[data-slot="desktop-layer-text-font-listbox"]')
    const generalSansOption = getRequiredButton(surface.container, "Use General Sans text font")

    expect(fontListbox?.getAttribute("role")).toBe("listbox")
    expect(generalSansOption.getAttribute("role")).toBe("option")

    await clickButton(generalSansOption)

    expect(getRequiredButton(surface.container, "Text font").textContent).toContain("General Sans")
    expect(surface.container.querySelector('[data-slot="desktop-layer-text-font-listbox"]')).toBeNull()
    expect(getRequiredTextarea(surface.container, "Text layer content").value).toBe("Keep this copy")
  })

  it("updates text size and weight controls", async () => {
    const surface = await renderSelectedTextInspector()

    await act(async () => {
      setInputValue(getRequiredInput(surface.container, "Text font size"), "64")
      getRequiredSlider(surface.container, "Weight").dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "End" }),
      )
    })

    expect(getRequiredInput(surface.container, "Text font size").value).toBe("64")
    expect(getRequiredSlider(surface.container, "Weight").getAttribute("aria-valuenow")).toBe("900")
  })

  it("toggles text emphasis controls independently", async () => {
    const surface = await renderSelectedTextInspector()

    const bold = getRequiredButton(surface.container, "Bold")
    const italic = getRequiredButton(surface.container, "Italic")
    const underline = getRequiredButton(surface.container, "Underline")

    expect(bold.getAttribute("aria-pressed")).toBe("false")
    expect(italic.getAttribute("aria-pressed")).toBe("false")
    expect(underline.getAttribute("aria-pressed")).toBe("false")

    await act(async () => {
      bold.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      underline.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(bold.getAttribute("aria-pressed")).toBe("true")
    expect(italic.getAttribute("aria-pressed")).toBe("false")
    expect(underline.getAttribute("aria-pressed")).toBe("true")
  })

  it("updates the text fill color input", async () => {
    const surface = await renderSelectedTextInspector()

    await act(async () => {
      setInputValue(getRequiredInput(surface.container, "Text fill"), "#ff0000")
    })

    expect(getRequiredInput(surface.container, "Text fill").value).toBe("#ff0000")
  })

  it("updates text alignment selection", async () => {
    const surface = await renderSelectedTextInspector()

    const left = getRequiredButton(surface.container, "Align text left")
    const center = getRequiredButton(surface.container, "Align text center")
    const right = getRequiredButton(surface.container, "Align text right")

    expect(left.getAttribute("aria-pressed")).toBe("true")

    await clickButton(center)

    expect(left.getAttribute("aria-pressed")).toBe("false")
    expect(center.getAttribute("aria-pressed")).toBe("true")
    expect(right.getAttribute("aria-pressed")).toBe("false")
  })

  it("renders appearance popovers in the dynamic island when a layer is selected", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Selected" })
    const onAppearancePatch = vi.fn()
    const surface = await renderPrototype({
      controller: {
        activeTool: null,
        appearanceSnapshot: getDesktopAppearanceSnapshot(layer),
        onAppearancePatch,
        selectedAppearanceLayer: layer,
        selectedElementLayer: layer,
      },
    })

    expect(surface.container.querySelector('[data-slot="desktop-appearance-island"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-appearance-shadow-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-appearance-filters-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-appearance-opacity-trigger"]')).not.toBeNull()
  })

  it("renders scan safety in the dynamic island", async () => {
    const surface = await renderPrototype({
      controller: {
        scanSafetyResult: {
          status: "invalid",
          summary: "Not scannable",
          expectedText: "https://example.com",
          decodedText: null,
        },
      },
    })

    expect(surface.container.querySelector('[data-slot="desktop-scan-safety-trigger"]')).not.toBeNull()
    expect(
      surface.container
        .querySelector('[data-slot="desktop-scan-safety-trigger"]')
        ?.getAttribute("aria-label"),
    ).toContain("Not scannable")
  })

  it("shows popular brand icons and search caption before a logo query is entered", async () => {
    const surface = await renderPrototype()

    await openTool(surface.container, "logo")

    expect(surface.container.textContent).not.toContain("Search 51,000+ icons…")
    expect(
      surface.container.querySelector('[aria-label="Use WhatsApp brand icon"]'),
    ).not.toBeNull()
    expect(
      surface.container.querySelector('[aria-label="Search logo icons"]'),
    ).not.toBeNull()
    expect(
      surface.container.querySelector('[aria-label="Filter logo icon libraries"]'),
    ).not.toBeNull()
  })

})

async function renderSelectedTextInspector(
  layer = createDraftingTextLayer(NODE_ID, { text: "Hello" }),
) {
  return renderWithAsyncJsdomRoot(<StatefulSelectedTextToolbar initialLayer={layer} />)
}

function StatefulSelectedTextToolbar({ initialLayer }: { initialLayer: DraftingCanvasLayer }) {
  const [layer, setLayer] = useState(initialLayer)

  return (
    <FloatingToolbar
      controller={
        {
          activeTool: null,
          appearanceSnapshot: {
            blur: layer.blur,
            opacity: layer.opacity,
            shadow: layer.shadow,
            supportsCornerRadius: false,
          },
          onAppearancePatch: (patch) => setLayer((current) => ({ ...current, ...patch })),
          onElementLayerPatch: (patch) => setLayer((current) => ({ ...current, ...patch })),
          selectedAppearanceLayer: layer,
          selectedElementLayer: layer,
        } as ComponentProps<typeof FloatingToolbar>["controller"]
      }
    />
  )
}

async function renderPrototype({
  controller,
}: {
  controller?: Partial<NonNullable<ComponentProps<typeof FloatingToolbar>>["controller"]>
} = {}) {
  return renderWithAsyncJsdomRoot(
    <FloatingToolbar controller={controller as NonNullable<ComponentProps<typeof FloatingToolbar>>["controller"]} />,
  )
}

function getRequiredElement(container: HTMLElement, selector: string) {
  const element = container.querySelector<HTMLElement>(selector)

  if (!element) {
    throw new Error(`Missing element: ${selector}`)
  }

  return element
}

function getOptionSelectionIndicator(button: HTMLElement | null) {
  return button
    ?.closest<HTMLElement>('[class*="grid-cols"]')
    ?.querySelector<HTMLElement>('[data-slot="desktop-inspector-option-selection-indicator"]') ?? null
}

function expectAnimatedOptionSelection(button: HTMLElement) {
  expect(button.getAttribute("data-desktop-animated-option-selection")).toBe("true")
  const indicator = getOptionSelectionIndicator(button)
  expect(indicator).not.toBeNull()
  expect(indicator?.className).toContain("bg-[var(--desktop-inspector-option-selected-bg)]")
  expect(indicator?.className).toContain("border-[var(--desktop-inspector-option-selected-border)]")
  expect(button.className).not.toContain("border-[var(--desktop-inspector-option-selected-border)]")
}

function getToolButtons(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLButtonElement>(
      '[data-desktop-tool-button="true"]',
    ),
  )
}

function getRequiredToolButton(container: HTMLElement, toolId: string) {
  const button = container.querySelector<HTMLButtonElement>(
    `[data-tool-id="${toolId}"]`,
  )

  if (!button) {
    throw new Error(`Missing desktop toolbar button: ${toolId}`)
  }

  return button
}

async function clickButton(button: HTMLButtonElement) {
  await act(async () => {
    button.dispatchEvent(new MouseEvent("click", { bubbles: true }))
  })
}

async function openTool(container: HTMLElement, toolId: string) {
  await clickButton(getRequiredToolButton(container, toolId))
}

function getRequiredSlider(container: HTMLElement, label: string) {
  const slider = container.querySelector<HTMLElement>(`[role="slider"][aria-label="${label}"]`)

  if (!slider) {
    throw new Error(`Missing slider: ${label}`)
  }

  return slider
}

function getRequiredSliderRow(container: HTMLElement, label: string) {
  const slider = getRequiredSlider(container, label)
  const row = slider.closest('[data-slot="desktop-elastic-slider-row"]')

  if (!row) {
    throw new Error(`Missing slider row: ${label}`)
  }

  return row
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

function getRequiredInput(container: HTMLElement, label: string) {
  const input = container.querySelector<HTMLInputElement>(`input[aria-label="${label}"]`)

  if (!input) {
    throw new Error(`Missing input: ${label}`)
  }

  return input
}

function getRequiredTextarea(container: HTMLElement, label: string) {
  const textarea = container.querySelector<HTMLTextAreaElement>(`textarea[aria-label="${label}"]`)

  if (!textarea) {
    throw new Error(`Missing textarea: ${label}`)
  }

  return textarea
}

function setInputValue(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
  setter?.call(input, value)
  input.dispatchEvent(new Event("input", { bubbles: true }))
}

function setTextareaValue(textarea: HTMLTextAreaElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set
  setter?.call(textarea, value)
  textarea.dispatchEvent(new Event("input", { bubbles: true }))
}
