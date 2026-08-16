// @vitest-environment jsdom

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { act, type ComponentProps } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { FloatingToolbar } from "@/features/desktop-shell/components/FloatingToolbar"
import { DesktopSettingsToolbarShell } from "@/features/desktop-shell/components/DesktopSettingsToolbarShell"
import { getDesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import { createDraftingTextLayer } from "@/features/workspace/model/layers"
import { renderWithAsyncJsdomRoot } from "@/test-utils/jsdom-react-root"

const NODE_ID = "test-node"

beforeEach(() => {
  sessionStorage.clear()

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
      "Effects",
      "Export",
    ])
    expect(surface.container.querySelector('[data-slot="desktop-inspector-accordion"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-prototype-canvas"]')).toBeNull()
  })

  it("opens a settings section from the accordion", async () => {
    const surface = await renderPrototype()
    const contentHeader = getRequiredAccordionHeader(surface.container, "Content")
    const qrHeader = getRequiredAccordionHeader(surface.container, "QR")

    expect(contentHeader.getAttribute("aria-expanded")).toBe("true")
    expect(qrHeader.getAttribute("aria-expanded")).toBe("false")

    await act(async () => {
      qrHeader.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(getRequiredAccordionHeader(surface.container, "QR").getAttribute("aria-expanded")).toBe(
      "true",
    )
  })

  it("shows appearance controls when a layer is selected", async () => {
    const layer = createDraftingTextLayer(NODE_ID, { text: "Hello" })
    const surface = await renderPrototype({
      controller: {
        appearanceSnapshot: getDesktopAppearanceSnapshot(layer),
        onAppearancePatch: vi.fn(),
        selectedAppearanceLayer: layer,
      },
    })

    expect(surface.container.querySelector('[data-slot="desktop-appearance-island"]')).not.toBeNull()
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
    const historyActions = surface.container.querySelector('[data-slot="desktop-history-actions"]')
    const utilityToolbar = surface.container.querySelector('[data-slot="desktop-utility-toolbar"]')

    expect(prototype?.getAttribute("data-desktop-theme")).toBe("dark")
    expect(surface.container.querySelector('[data-slot="desktop-action-toolbar"]')).toBeNull()
    expect(historyActions).not.toBeNull()
    expect(historyActions?.querySelector('button[aria-label="Switch to dark mode"]')).toBeNull()
    expect(utilityToolbar?.querySelector('[data-slot="desktop-theme-toggle"]')).toBeNull()
    const dynamicIsland = surface.container.querySelector('[data-slot="desktop-dynamic-island"]')
    expect(dynamicIsland?.querySelector('[data-slot="desktop-theme-toggle"]')).not.toBeNull()
    expect(dynamicIsland?.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).not.toBeNull()
    expect(Array.from(historyActions?.querySelectorAll("button") ?? []).map((button) => button.getAttribute("aria-label"))).toEqual([
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
    expect(surface.container.querySelector('[data-slot="desktop-compose-toolbar"]')).toBeNull()
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
    const historyActions = getRequiredElement(surface.container, '[data-slot="desktop-history-actions"]')
    const utilityToolbar = surface.container.querySelector('[data-slot="desktop-utility-toolbar"]')

    expect(surface.container.querySelector('[data-slot="desktop-action-toolbar"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-dynamic-island-anchor"]')).not.toBeNull()
    expect(utilityToolbar?.className).toContain("min-h-11")
    expect(getRequiredButton(utilityToolbar as HTMLElement, "Save").className).toContain("size-9")
    expect(getRequiredButton(utilityToolbar as HTMLElement, "Download").className).toContain("size-9")
    expect(utilityToolbar?.querySelector('[data-slot="desktop-save-trigger"]')).not.toBeNull()
    expect(utilityToolbar?.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).toBeNull()
    expect(getRequiredButton(historyActions, "Undo").className).toContain("size-9")
    expect(getRequiredButton(historyActions, "Redo").className).toContain("size-9")

    await act(async () => {
      getRequiredButton(historyActions, "Undo").dispatchEvent(new MouseEvent("click", { bubbles: true }))
      getRequiredButton(historyActions, "Redo").dispatchEvent(new MouseEvent("click", { bubbles: true }))
      getRequiredButton(utilityToolbar as HTMLElement, "Download").dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onRedo).toHaveBeenCalledTimes(1)
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
    expect(surface.container.querySelector('[data-slot="desktop-appearance-outline-trigger"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-appearance-radius-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-appearance-shadow-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-appearance-filters-trigger"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-appearance-opacity-trigger"]')).toBeNull()
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
    "Effects",
    "Export",
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
