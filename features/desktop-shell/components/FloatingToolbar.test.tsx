// @vitest-environment jsdom

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { act, type ComponentProps } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { FloatingToolbar } from "@/features/desktop-shell/components/FloatingToolbar"
import { DesktopSettingsToolbarShell } from "@/features/desktop-shell/components/DesktopSettingsToolbarShell"
import { getDesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import { DEFAULT_DESKTOP_LAYERS_SETTINGS } from "@/features/desktop-shell/model/desktop-toolbar-defaults"
import { createDraftingTextLayer } from "@/features/workspace/model/layers"
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root"

const NODE_ID = "test-node"

beforeEach(() => {
  sessionStorage.clear()
  stubMatchMedia(false)

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
      "QR",
      "Motion",
      "Shape",
      "Background",
      "Elements",
    ])
    expect(surface.container.querySelector('[data-slot="desktop-inspector-accordion"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-prototype-canvas"]')).toBeNull()
  })

  it("opens a settings section from the accordion", async () => {
    const surface = await renderPrototype()
    const contentHeader = getRequiredAccordionHeader(surface.container, "Content")
    const qrHeader = getRequiredAccordionHeader(surface.container, "QR")

    expect(contentHeader.getAttribute("aria-expanded")).toBe("false")
    expect(qrHeader.getAttribute("aria-expanded")).toBe("false")

    await act(async () => {
      qrHeader.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(getRequiredAccordionHeader(surface.container, "QR").getAttribute("aria-expanded")).toBe(
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

    expect(surface.container.querySelector('[data-slot="desktop-layers-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-properties-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-style-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-effects-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-appearance-trigger"]')).toBeNull()
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

    expect(surface.container.querySelector('[data-slot="desktop-layers-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-properties-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-style-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-effects-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-appearance-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-transform-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-layer-toolbar"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-appearance-island"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-appearance-outline-trigger"]')).toBeNull()
  })

  it("does not render scan safety in the dynamic island", async () => {
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

    expect(surface.container.querySelector('[data-slot="desktop-scan-safety-trigger"]')).toBeNull()
  })

  it("renders the mobile family drawer instead of the left settings rail", async () => {
    stubMatchMedia(true)
    const surface = await renderPrototype()

    expect(document.querySelector('[data-slot="mobile-family-drawer"]')).not.toBeNull()
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

  it("opens the QR section from the mobile family drawer menu", async () => {
    stubMatchMedia(true)
    await renderPrototype()

    const drawer = document.querySelector('[data-slot="mobile-family-drawer"]')
    const qrButton = Array.from(drawer?.querySelectorAll<HTMLButtonElement>("button") ?? []).find(
      (button) => button.textContent?.trim() === "QR",
    )

    expect(qrButton).not.toBeNull()

    await act(async () => {
      qrButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(drawer?.querySelector("h2")?.textContent?.trim()).toBe("QR")
  })
})

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

function getAccordionHeaders(container: HTMLElement) {
  const sectionLabels = new Set([
    "Content",
    "QR",
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
