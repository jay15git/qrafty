// @vitest-environment jsdom

import { readFileSync } from "node:fs"
import {
  act,
  cloneElement,
  createContext,
  isValidElement,
  type ComponentProps,
  type ReactElement,
  type ReactNode,
  useContext,
  useState,
} from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const buildDashboardQrNodePayloadSpy = vi.fn(() => new Promise(() => undefined))
const downloadDashboardQrBatchZipExportSpy = vi.fn(() => Promise.resolve())
const downloadDashboardQrNodeExportSpy = vi.fn(() => Promise.resolve())
const downloadDashboardRasterExportSpy = vi.fn(() => Promise.resolve())
const measureDashboardRasterExportSpy = vi.fn(() =>
  Promise.resolve({
    blobSizeBytes: 182000,
    extension: "png" as const,
    height: 1280,
    qualityPercent: 100,
    width: 1280,
  }),
)

vi.mock("@/features/qr-code/rendering/qr-svg", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/qr-code/rendering/qr-svg")>()

  return {
    ...actual,
    buildDashboardQrNodePayload: (...args: Parameters<typeof buildDashboardQrNodePayloadSpy>) =>
      buildDashboardQrNodePayloadSpy(...args),
  }
})

vi.mock("@/features/qr-code/export/batch-export", () => ({
  downloadDashboardQrBatchZipExport: (
    ...args: Parameters<typeof downloadDashboardQrBatchZipExportSpy>
  ) => downloadDashboardQrBatchZipExportSpy(...args),
  downloadDashboardQrNodeExport: (
    ...args: Parameters<typeof downloadDashboardQrNodeExportSpy>
  ) => downloadDashboardQrNodeExportSpy(...args),
}))

vi.mock("@/features/qr-code/export/raster-export", () => ({
  downloadDashboardRasterExport: (
    ...args: Parameters<typeof downloadDashboardRasterExportSpy>
  ) => downloadDashboardRasterExportSpy(...args),
  formatDashboardExportFileSize: (bytes: number) => `${bytes} B`,
  isRasterExportExtension: (extension: string) => extension !== "svg",
  measureDashboardRasterExport: (
    ...args: Parameters<typeof measureDashboardRasterExportSpy>
  ) => measureDashboardRasterExportSpy(...args),
}))

type PopoverContextValue = {
  open: boolean
  setOpen: (value: boolean) => void
}

const PopoverContext = createContext<PopoverContextValue | null>(null)

vi.mock("@/components/ui/popover", () => ({
  Popover: ({
    children,
    open,
    onOpenChange,
  }: {
    children: ReactNode
    open?: boolean
    onOpenChange?: (value: boolean) => void
  }) => {
    const [internalOpen, setInternalOpen] = useState(false)
    const actualOpen = open ?? internalOpen
    const setOpen = onOpenChange ?? setInternalOpen

    return (
      <PopoverContext.Provider value={{ open: actualOpen, setOpen }}>
        <div data-slot="popover">{children}</div>
      </PopoverContext.Provider>
    )
  },
  PopoverContent: ({ children, ...props }: { children: ReactNode }) => {
    const context = useContext(PopoverContext)

    if (!context?.open) {
      return null
    }

    return <div {...props}>{children}</div>
  },
  PopoverTrigger: ({ children }: { children: ReactNode }) => {
    const context = useContext(PopoverContext)

    if (!isValidElement(children)) {
      return children
    }

    const element = children as ReactElement<{ onClick?: (event: unknown) => void }>
    const originalOnClick = element.props.onClick

    return cloneElement(element, {
      onClick: (event: unknown) => {
        originalOnClick?.(event)
        context?.setOpen(!context.open)
      },
    })
  },
}))

vi.mock("@/components/vendor/unlumen-ui/slider", () => ({
  Slider: ({
    "aria-label": ariaLabel,
    formatValue,
    label,
    appearance,
    disabled,
    max,
    min,
    onChange,
    showValue = true,
    step,
    value,
    "data-slot": dataSlot,
  }: {
    "aria-label"?: string
    "data-slot"?: string
    appearance?: string
    formatValue?: (value: number) => string
    label?: string
    disabled?: boolean
    max?: number
    min?: number
    onChange?: (value: number | [number, number]) => void
    showValue?: boolean
    step?: number
    value?: number | number[]
  }) => (
    <div data-slot={dataSlot} data-appearance={appearance}>
      {label && showValue ? (
        <span>
          {label}
          {formatValue
            ? `: ${formatValue(Array.isArray(value) ? (value[0] ?? 0) : (value ?? 0))}`
            : null}
        </span>
      ) : null}
      <input
        aria-label={ariaLabel}
        disabled={disabled}
        max={max}
        min={min}
        step={step}
        type="range"
        value={Array.isArray(value) ? (value[0] ?? min ?? 0) : (value ?? min ?? 0)}
        onChange={(event) => {
          onChange?.(Number(event.currentTarget.value))
        }}
      />
    </div>
  ),
}))

import { WorkspaceSurface } from "@/features/workspace/components/WorkspaceSurface"
import { FloatingToolbar } from "@/features/desktop-shell/components/FloatingToolbar"
import { clearDraftingQrMarkupCache } from "@/features/workspace/hooks/use-drafting-qr-markup"
import { DASHBOARD_QR_NODE_ID } from "@/features/qr-code/rendering/compose-scene"
import { createDefaultQrStudioState, type QrStudioState } from "@/features/qr-code/model/state"

const QR_PAYLOAD = {
  markup:
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320"><rect width="320" height="320" fill="#fff" /><path d="M20 20h40v40H20z" fill="#111" /></svg>',
  naturalHeight: 320,
  naturalWidth: 320,
}

const cleanupCallbacks: Array<() => void> = []

beforeEach(() => {
  clearDraftingQrMarkupCache()
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: createMemoryStorage(),
  })
  buildDashboardQrNodePayloadSpy.mockClear()
  buildDashboardQrNodePayloadSpy.mockImplementation(() => new Promise(() => undefined))
  downloadDashboardQrBatchZipExportSpy.mockClear()
  downloadDashboardQrNodeExportSpy.mockClear()
  downloadDashboardRasterExportSpy.mockClear()
  measureDashboardRasterExportSpy.mockClear()
  measureDashboardRasterExportSpy.mockImplementation(() =>
    Promise.resolve({
      blobSizeBytes: 182000,
      extension: "png",
      height: 1280,
      qualityPercent: 100,
      width: 1280,
    }),
  )
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
  for (const cleanup of cleanupCallbacks.splice(0)) {
    cleanup()
  }

  vi.useRealTimers()
  vi.unstubAllGlobals()
  document.body.innerHTML = ""
})

describe("WorkspaceSurface", () => {
  it("deletes removable selected layers from the floating canvas toolbar", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    act(() => {
      activateElement(
        getRequiredElement(surface.container, 'button[aria-label="Add text on canvas"]'),
      )
    })

    act(() => {
      activateElement(
        getRequiredElement(surface.container, '[data-slot="desktop-compose-surface"]'),
      )
    })

    await act(async () => {
      await flushPromises()
    })

    expect(surface.container.querySelector('[data-slot="drafting-text-layer"]')).not.toBeNull()
    expect(
      surface.container.querySelector('[data-slot="drafting-text-layer"]')?.getAttribute("data-selected"),
    ).toBe("true")

    act(() => {
      activateElement(
        getRequiredElement(surface.container, 'button[aria-label="Delete selection"]'),
      )
    })

    await act(async () => {
      await flushPromises()
    })

    expect(surface.container.querySelector('[data-slot="drafting-text-layer"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-compose-node"]')).not.toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-layer-floating-toolbar"]')).toBeNull()
  })

  it("wires the desktop overlay content inspector into the active drafting QR state", () => {
    const surface = renderSurface()
    const root = getRequiredElement(surface.container, '[data-slot="drafting-surface"]')

    const payload = getRequiredElement(
      surface.container,
      '#dn-content-url',
    ) as HTMLInputElement

    act(() => {
      changeInputValue(payload, "https://example.com/desktop-live")
    })

    expect(root.getAttribute("data-qr-content-value")).toBe("https://example.com/desktop-live")
  })

  it("renders compose controls in the dynamic island on desktop", async () => {
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()
    const dynamicIsland = getRequiredElement(surface.container, '[data-slot="desktop-dynamic-island"]')
    const composeToolbar = getRequiredElement(
      dynamicIsland,
      '[data-slot="desktop-compose-toolbar"]',
    )

    expect(composeToolbar.getAttribute("data-toolbar-appearance")).toBe("desktop-glass")
    expect(surface.container.querySelector('button[aria-label="Zoom out preview"]')).toBeNull()
    expect(surface.container.querySelector('button[aria-label="Zoom in preview"]')).toBeNull()
    expect(surface.container.querySelector('button[aria-label="Reset view"]')).toBeNull()
    expect(composeToolbar.querySelector('button[aria-label="Undo"]')).toBeNull()
    expect(composeToolbar.querySelector('button[aria-label="Redo"]')).toBeNull()
    expect(composeToolbar.querySelector('button[aria-label="Select and move elements"]')).not.toBeNull()
    expect(composeToolbar.querySelector('button[aria-label="Pan canvas"]')).toBeNull()
    expect(composeToolbar.querySelector('button[aria-label="Add text on canvas"]')).not.toBeNull()
    expect(Array.from(composeToolbar.querySelectorAll("button")).map((button) => button.getAttribute("aria-label"))).toEqual([
      "Select and move elements",
      "Disable snapping",
      "Hide canvas grid",
      "Add text on canvas",
      "Add content",
    ])
    const utilityToolbar = getRequiredElement(surface.container, '[data-slot="desktop-utility-toolbar"]')
    expect(surface.container.querySelector('[data-slot="desktop-document-toolbar"]')).toBeNull()
    expect(Array.from(utilityToolbar.querySelectorAll("button")).map((button) => button.getAttribute("aria-label"))).toEqual([
      "Save",
      "Download",
    ])
    expect(utilityToolbar.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).toBeNull()
    expect(utilityToolbar.querySelector('[data-slot="desktop-theme-toggle"]')).toBeNull()
    expect(composeToolbar.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).toBeNull()
    expect(composeToolbar.querySelector('[data-slot="desktop-theme-toggle"]')).toBeNull()
    expect(dynamicIsland.querySelector('[data-slot="desktop-keyboard-shortcuts-trigger"]')).not.toBeNull()
    expect(getRequiredElement(dynamicIsland, '[data-slot="desktop-theme-toggle"]').getAttribute("aria-label")).toBe("Switch to light mode")
    expect(surface.container.querySelector('[data-slot="desktop-action-toolbar"]')).toBeNull()
    const historyActions = getRequiredElement(surface.container, '[data-slot="desktop-history-actions"]')
    expect(historyActions.querySelector('button[aria-label="Switch to light mode"]')).toBeNull()
    expect(Array.from(historyActions.querySelectorAll("button")).map((button) => button.getAttribute("aria-label"))).toEqual([
      "Undo",
      "Redo",
      "Canvas size — 4:3",
    ])
    expect(surface.container.querySelector('[data-slot="desktop-compose-toolbar-anchor"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-resize-toolbar"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-zoom-popover"]')).toBeNull()
  })

  it("opens keyboard shortcuts from the dynamic island toolbar", () => {
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })
    const dynamicIsland = getRequiredElement(surface.container, '[data-slot="desktop-dynamic-island"]')
    const shortcutsTrigger = getRequiredElement(
      dynamicIsland,
      '[data-slot="desktop-keyboard-shortcuts-trigger"]',
    )

    expect(document.body.querySelector('[data-slot="desktop-keyboard-shortcuts-popover"]')).toBeNull()

    act(() => {
      activateElement(shortcutsTrigger)
    })

    expect(document.body.querySelector('[data-slot="desktop-keyboard-shortcuts-popover"]')).not.toBeNull()
  })

  it("does not expose the dashboard edit mode toggle or edit rail on drafting", async () => {
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    expect(surface.container.querySelector('button[aria-label="Toggle edit mode"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="desktop-compose-edit-mode"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="dashboard-edit-rail"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-edit-nav-scroll-area"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-edit-panel-scroll"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="dashboard-edit-page"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-header"]')).toBeNull()
    expect(surface.container.querySelector('[data-slot="drafting-nav"]')).toBeNull()
    expect(surface.container.querySelector('[data-drafting-tool-button="true"]')).toBeNull()
  })

  it("does not render a document guide overlay in the default compose surface", () => {
    const surface = renderSurface()

    expect(
      surface.container.querySelector('[data-slot="desktop-compose-document-guides"]'),
    ).toBeNull()
  })

  it("adds a fresh qr layer from the bottom toolbar and selects it", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-surface"]')).toHaveLength(1)
    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-node"]')).toHaveLength(1)

    await addQrCode(surface.container)

    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-surface"]')).toHaveLength(1)
    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-node"]')).toHaveLength(2)
    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-compose-edit-mode",
      ),
    ).toBe("false")
    expect(surface.container.querySelector('[data-slot="dashboard-edit-rail"]')).toBeNull()
    expect(buildDashboardQrNodePayloadSpy).toHaveBeenCalled()
  })

  it("keeps independent qr layer content on one canvas", async () => {
    buildDashboardQrNodePayloadSpy.mockImplementation((state?: QrStudioState) =>
      Promise.resolve({
        markup: `<svg data-value="${state?.data ?? ""}" />`,
        naturalHeight: 320,
        naturalWidth: 320,
      }),
    )
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    await act(async () => {
      changeInputValue(
        getRequiredElement(surface.container, '#dn-content-url') as HTMLInputElement,
        "https://example.com/first",
      )
      await flushPromises()
      await flushPromises()
    })

    await addQrCode(surface.container)

    await act(async () => {
      changeInputValue(
        getRequiredElement(surface.container, '#dn-content-url') as HTMLInputElement,
        "https://example.com/second",
      )
      await flushPromises()
      await flushPromises()
    })

    const qrNodes = Array.from(
      surface.container.querySelectorAll('[data-slot="desktop-compose-node"]'),
    ) as HTMLElement[]

    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-surface"]')).toHaveLength(1)
    expect(qrNodes).toHaveLength(2)
    expect(qrNodes.map((node) => node.getAttribute("data-node-id"))).toEqual(
      expect.arrayContaining([
        "https://example.com/first",
        "https://example.com/second",
      ]),
    )
  })

  it("keeps the qr renderer foreground-only on first render and after reset", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    await act(async () => {
      await flushPromises()
      await flushPromises()
    })

    const initialCall = buildDashboardQrNodePayloadSpy.mock.calls as unknown as Array<
      [QrStudioState]
    >
    const initialState = initialCall[0]?.[0]

    expect(initialState?.backgroundOptions.transparent).toBe(true)
    expect(initialState?.backgroundShapeId).toBe("none")
    expect(initialState?.backgroundGradient.enabled).toBe(false)
    expect(initialState?.width).toBe(240)
    expect(initialState?.height).toBe(240)
  })

  it("renders a faint dotted texture behind the neutral pane workspace", async () => {
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()
    const composeSurface = getRequiredElement(
      surface.container,
      '[data-slot="desktop-compose-surface"]',
    )

    expect(composeSurface.getAttribute("data-surface-appearance")).toBe("workspace")
    expect(surface.container.querySelector('[data-slot="drafting-surface"]')).not.toBeNull()
  })

  it("undoes and redoes QR content edits from the bottom toolbar", async () => {
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    vi.useFakeTimers()

    const contentInput = getRequiredElement(
      surface.container,
      '#dn-content-url',
    ) as HTMLInputElement

    await advanceDraftingTimers()

    act(() => {
      changeInputValue(contentInput, "https://example.com/history")
    })
    await advanceDraftingTimers()

    const undoButton = getRequiredElement(
      surface.container,
      '[data-slot="desktop-history-actions"] button[aria-label="Undo"]',
    ) as HTMLButtonElement
    const redoButton = getRequiredElement(
      surface.container,
      '[data-slot="desktop-history-actions"] button[aria-label="Redo"]',
    ) as HTMLButtonElement

    expect(undoButton.disabled).toBe(false)
    expect(redoButton.disabled).toBe(true)

    act(() => {
      activateElement(undoButton)
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://new-qr-studio.local/launch")
    expect(redoButton.disabled).toBe(false)

    act(() => {
      activateElement(redoButton)
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://example.com/history")
  })

  it("uses keyboard shortcuts for undo and redo without intercepting text input undo", async () => {
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    vi.useFakeTimers()

    const contentInput = getRequiredElement(
      surface.container,
      '#dn-content-url',
    ) as HTMLInputElement

    await advanceDraftingTimers()

    act(() => {
      changeInputValue(contentInput, "https://example.com/keyboard")
    })
    await advanceDraftingTimers()

    act(() => {
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          ctrlKey: true,
          key: "z",
        }),
      )
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://new-qr-studio.local/launch")

    act(() => {
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          ctrlKey: true,
          key: "Z",
          shiftKey: true,
        }),
      )
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://example.com/keyboard")

    const preventedInputUndo = !contentInput.dispatchEvent(
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        key: "z",
      }),
    )

    expect(preventedInputUndo).toBe(false)
  })

  it("uses keyboard shortcuts from body focus for layer nudging, ordering, and duplicating QR codes", async () => {
    vi.useFakeTimers()
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    vi.useFakeTimers()

    await advanceDraftingTimers()

    const qrLayer = getRequiredElement(
      surface.container,
      '[data-slot="desktop-compose-node"]',
    ) as HTMLElement

    expect(qrLayer.style.transform).toContain("translate3d(-120px")

    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          key: "ArrowRight",
          shiftKey: true,
        }),
      )
    })

    expect(qrLayer.style.transform).toContain("translate3d(-110px")

    act(() => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          ctrlKey: true,
          key: "d",
        }),
      )
    })
    await advanceDraftingTimers()

    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-surface"]')).toHaveLength(1)
    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-node"]')).toHaveLength(2)
  })

  it("copies and pastes selected layers with keyboard shortcuts", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    let clipboardText = ""
    const writeText = vi.fn(async (value: string) => {
      clipboardText = value
    })
    const readText = vi.fn(async () => clipboardText)
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { readText, writeText },
    })
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    vi.useFakeTimers()

    await advanceDraftingTimers()

    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-node"]')).toHaveLength(1)

    await act(async () => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          ctrlKey: true,
          key: "c",
        }),
      )
      await flushPromises()
      await flushPromises()
    })

    expect(writeText).toHaveBeenCalledOnce()
    expect(JSON.parse(clipboardText)).toMatchObject({
      sourceNodeId: "dashboard-qr-node",
      type: "new-qr/drafting-layers",
      version: 1,
    })
    expect(JSON.parse(clipboardText).layers).toHaveLength(1)

    await act(async () => {
      document.body.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          ctrlKey: true,
          key: "v",
        }),
      )
      await flushPromises()
    })
    await advanceDraftingTimers()

    expect(readText).toHaveBeenCalledOnce()
    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-node"]')).toHaveLength(2)
  })

  it("uses keyboard shortcuts to select all, clear selection, order layers, delete cards, and keep the canonical QR", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    let clipboardText = ""
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        readText: vi.fn(async () => clipboardText),
        writeText: vi.fn(async (value: string) => {
          clipboardText = value
        }),
      },
    })
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    vi.useFakeTimers()

    await advanceDraftingTimers()

    await act(async () => {
      dispatchBodyShortcut("c", { ctrlKey: true })
      await flushPromises()
      dispatchBodyShortcut("v", { ctrlKey: true })
      await flushPromises()
    })
    await advanceDraftingTimers()

    const pastedQrLayer = Array.from(
      surface.container.querySelectorAll<HTMLElement>('[data-slot="desktop-compose-node"]'),
    ).find((node) => node.dataset.layerId?.includes(":qr:"))

    expect(pastedQrLayer).toBeDefined()
    expect(pastedQrLayer?.dataset.selected).toBe("true")

    act(() => {
      dispatchBodyShortcut("]", { ctrlKey: true, shiftKey: true })
    })

    expect(Number(pastedQrLayer?.style.zIndex)).toBeGreaterThan(1)

    act(() => {
      dispatchBodyShortcut("[", { ctrlKey: true, shiftKey: true })
    })

    expect(Number(pastedQrLayer?.style.zIndex)).toBe(0)

    act(() => {
      dispatchBodyShortcut("a", { ctrlKey: true })
    })

    expect(
      Array.from(surface.container.querySelectorAll<HTMLElement>("[data-layer-id]"))
        .filter((layer) => layer.dataset.selected === "true")
        .map((layer) => layer.dataset.layerId)
        .filter(Boolean),
    ).toEqual(
      expect.arrayContaining([
        "dashboard-qr-node:qr",
        pastedQrLayer?.dataset.layerId,
      ]),
    )

    act(() => {
      dispatchBodyShortcut("Escape")
    })

    expect(
      Array.from(surface.container.querySelectorAll<HTMLElement>("[data-layer-id]")).some(
        (layer) => layer.dataset.selected === "true",
      ),
    ).toBe(false)

    act(() => {
      pastedQrLayer?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      dispatchBodyShortcut("Delete")
    })

    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-node"]')).toHaveLength(1)

    act(() => {
      getRequiredElement(
        surface.container,
        '[data-slot="desktop-compose-node"][data-layer-id="dashboard-qr-node:qr"]',
      ).dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      dispatchBodyShortcut("Backspace")
    })

    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-node"]')).toHaveLength(1)
  })

  it("uses keyboard shortcuts to group, ungroup, and hide selected layers", async () => {
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    vi.useFakeTimers()

    await advanceDraftingTimers()

    act(() => {
      activateElement(
        getRequiredElement(surface.container, 'button[aria-label="Add text on canvas"]'),
      )
    })
    act(() => {
      activateElement(
        getRequiredElement(surface.container, '[data-slot="desktop-compose-surface"]'),
      )
    })
    await advanceDraftingTimers()

    act(() => {
      dispatchBodyShortcut("a", { ctrlKey: true })
    })

    act(() => {
      dispatchBodyShortcut("g", { ctrlKey: true })
    })

    let groupLayer = getRequiredElement(
      surface.container,
      '[data-slot="drafting-layer-group"]',
    )

    act(() => {
      groupLayer.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      dispatchBodyShortcut("g", { ctrlKey: true, shiftKey: true })
    })

    expect(surface.container.querySelector('[data-slot="drafting-layer-group"]')).toBeNull()

    act(() => {
      dispatchBodyShortcut("a", { ctrlKey: true })
    })

    act(() => {
      dispatchBodyShortcut("g", { ctrlKey: true })
    })

    groupLayer = getRequiredElement(surface.container, '[data-slot="drafting-layer-group"]')

    act(() => {
      groupLayer.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    act(() => {
      dispatchBodyShortcut("h", { ctrlKey: true, shiftKey: true })
    })

    expect(surface.container.querySelector('[data-slot="drafting-layer-group"]')).toBeNull()

    act(() => {
      dispatchBodyShortcut("h", { ctrlKey: true, shiftKey: true })
    })

    expect(surface.container.querySelector('[data-slot="drafting-layer-group"]')).not.toBeNull()
  })

  it("keeps editing fields native for select-all, delete, clipboard, and layer shortcuts", async () => {
    vi.useFakeTimers()
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    const contentInput = getRequiredElement(
      surface.container,
      '#dn-content-url',
    ) as HTMLInputElement

    await advanceDraftingTimers()

    act(() => {
      changeInputValue(contentInput, "https://example.com/native-shortcuts")
      contentInput.focus()
    })

    const shortcutEvents = [
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ctrlKey: true, key: "a" }),
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Delete" }),
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ctrlKey: true, key: "c" }),
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ctrlKey: true, key: "v" }),
      new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        shiftKey: true,
        key: "]",
      }),
    ]

    for (const event of shortcutEvents) {
      expect(contentInput.dispatchEvent(event)).toBe(true)
    }

    expect(contentInput.value).toBe("https://example.com/native-shortcuts")
    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-node"]')).toHaveLength(1)
  })

  it("uses native clipboard events for copy and paste when keyboard shortcuts become clipboard events", async () => {
    vi.useFakeTimers()
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    let copiedText = ""
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    vi.useFakeTimers()

    await advanceDraftingTimers()

    const copyEvent = new Event("copy", { bubbles: true, cancelable: true })
    Object.defineProperty(copyEvent, "clipboardData", {
      value: {
        setData: (_type: string, value: string) => {
          copiedText = value
        },
      },
    })

    act(() => {
      document.body.dispatchEvent(copyEvent)
    })

    expect(copiedText).toContain('"type":"new-qr/drafting-layers"')

    const pasteEvent = new Event("paste", { bubbles: true, cancelable: true })
    Object.defineProperty(pasteEvent, "clipboardData", {
      value: {
        getData: () => copiedText,
      },
    })

    act(() => {
      document.body.dispatchEvent(pasteEvent)
    })
    await advanceDraftingTimers()

    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-node"]')).toHaveLength(2)
  })

  it("focuses the drafting surface after selecting a canvas layer", async () => {
    vi.useFakeTimers()
    buildDashboardQrNodePayloadSpy.mockResolvedValue(QR_PAYLOAD)
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    vi.useFakeTimers()

    await advanceDraftingTimers()

    const draftingSurface = getRequiredElement(
      surface.container,
      '[data-slot="drafting-surface"]',
    )
    const qrLayer = getRequiredElement(
      surface.container,
      '[data-slot="desktop-compose-node"]',
    )

    act(() => {
      qrLayer.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(document.activeElement).toBe(draftingSurface)
  })

  it("keeps add QR and reset changes undoable", async () => {
    const surface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    vi.useFakeTimers()

    await advanceDraftingTimers()

    await addQrCode(surface.container)
    await advanceDraftingTimers()

    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-surface"]')).toHaveLength(1)
    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-node"]')).toHaveLength(2)

    act(() => {
      activateElement(getRequiredElement(surface.container, '[data-slot="desktop-history-actions"] button[aria-label="Undo"]'))
    })

    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-surface"]')).toHaveLength(1)
    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-node"]')).toHaveLength(1)

    act(() => {
      activateElement(getRequiredElement(surface.container, '[data-slot="desktop-history-actions"] button[aria-label="Redo"]'))
    })

    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-surface"]')).toHaveLength(1)
    expect(surface.container.querySelectorAll('[data-slot="desktop-compose-node"]')).toHaveLength(2)

    act(() => {
      changeInputValue(
        getRequiredElement(surface.container, '#dn-content-url') as HTMLInputElement,
        "https://example.com/before-reset",
      )
    })
    await advanceDraftingTimers()

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://example.com/before-reset")

    act(() => {
      activateElement(getRequiredElement(surface.container, '[data-slot="desktop-history-actions"] button[aria-label="Undo"]'))
    })

    expect(
      getRequiredElement(surface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://new-qr-studio.local/launch")
  })

  it("restores the autosaved drafting workspace after remount", async () => {
    const firstSurface = renderSurface({ paneToolbarVariant: "desktop-zoom" })

    await waitForDraftingSurface()

    vi.useFakeTimers()
    await advanceDraftingTimers()

    act(() => {
      changeInputValue(
        getRequiredElement(firstSurface.container, '#dn-content-url') as HTMLInputElement,
        "https://example.com/autosaved",
      )
    })
    await advanceDraftingTimers()

    firstSurface.unmount()
    const secondSurface = renderSurface({ paneToolbarVariant: "desktop-zoom" })
    await waitForDraftingSurface()
    await advanceDraftingTimers()

    expect(
      getRequiredElement(secondSurface.container, '[data-slot="drafting-surface"]').getAttribute(
        "data-qr-content-value",
      ),
    ).toBe("https://example.com/autosaved")
  })
})

function DesktopOverlayTestHarness(props: ComponentProps<typeof WorkspaceSurface>) {
  const [desktopTheme, setDesktopTheme] = useState<"dark" | "light">(
    props?.desktopTheme ?? "dark",
  )

  return (
    <WorkspaceSurface
      {...props}
      desktopTheme={desktopTheme}
      onDesktopThemeChange={setDesktopTheme}
      renderOverlay={(controller) => (
        <FloatingToolbar
          controller={controller}
          onThemeChange={setDesktopTheme}
          theme={desktopTheme}
        />
      )}
    />
  )
}

function renderSurface(props: ComponentProps<typeof WorkspaceSurface> = {}) {
  const container = document.createElement("div")
  const root = createRoot(container)

  act(() => {
    root.render(
      <DesktopOverlayTestHarness {...props} />,
    )
  })

  const cleanup = () => {
    act(() => {
      root.unmount()
    })
  }

  cleanupCallbacks.push(cleanup)
  document.body.appendChild(container)

  return {
    container,
    unmount: () => {
      const index = cleanupCallbacks.indexOf(cleanup)
      if (index >= 0) {
        cleanupCallbacks.splice(index, 1)
      }
      cleanup()
    },
  }
}

function getRequiredElement(parent: ParentNode, selector: string) {
  const element = parent.querySelector(selector)

  expect(element).not.toBeNull()

  return element as HTMLElement
}

function getRadioInputByAriaLabel(parent: ParentNode, label: string) {
  const element = Array.from(parent.querySelectorAll('input[type="radio"]')).find(
    (input) => input.getAttribute("aria-label") === label,
  )

  expect(element).not.toBeNull()

  return element as HTMLInputElement
}

function activateElement(element: HTMLElement) {
  const PointerEventConstructor = window.PointerEvent ?? window.MouseEvent

  element.dispatchEvent(
    new PointerEventConstructor("pointerdown", {
      bubbles: true,
      button: 0,
      ctrlKey: false,
    }),
  )
  element.dispatchEvent(
    new PointerEventConstructor("pointerup", {
      bubbles: true,
      button: 0,
      ctrlKey: false,
    }),
  )
  element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, button: 0 }))
  element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, button: 0 }))
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }))
}

function dispatchBodyShortcut(
  key: string,
  options: Omit<KeyboardEventInit, "bubbles" | "cancelable" | "key"> = {},
) {
  document.body.dispatchEvent(
    new KeyboardEvent("keydown", {
      bubbles: true,
      cancelable: true,
      key,
      ...options,
    }),
  )
}

function changeInputValue(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const prototype =
    element instanceof window.HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype
  const valueSetter = Object.getOwnPropertyDescriptor(
    prototype,
    "value",
  )?.set

  valueSetter?.call(element, value)
  element.dispatchEvent(new Event("input", { bubbles: true }))
  element.dispatchEvent(new Event("change", { bubbles: true }))
}

function setInputFiles(element: HTMLInputElement, files: File[]) {
  Object.defineProperty(element, "files", {
    configurable: true,
    value: files,
  })
}

function createDataTransfer() {
  const values = new Map<string, string>()

  return {
    dropEffect: "none",
    effectAllowed: "all",
    getData: vi.fn((type: string) => values.get(type) ?? ""),
    setData: vi.fn((type: string, value: string) => {
      values.set(type, value)
    }),
  }
}

function createDragEvent(type: string, dataTransfer: ReturnType<typeof createDataTransfer>) {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  }) as Event & { dataTransfer: ReturnType<typeof createDataTransfer> }

  Object.defineProperty(event, "dataTransfer", {
    value: dataTransfer,
  })

  return event
}

function openCardOnlyMode(parent: ParentNode) {
  act(() => {
    activateElement(getRequiredElement(parent, 'button[aria-label="Open Shape"]'))
  })

  const shapeSwitch = getRequiredElement(parent, "#drafting-card-enabled")
  if (shapeSwitch.getAttribute("aria-checked") !== "true") {
    act(() => {
      activateElement(shapeSwitch)
    })
  }
}

function getSelectedPreviewCard(parent: ParentNode) {
  const selectedNode =
    parent.querySelector('[data-slot="desktop-compose-node"][data-selected="true"]') ??
    parent.querySelector('[data-slot="desktop-compose-card"][data-selected="true"]') ??
    getRequiredElement(parent, '[data-slot="desktop-compose-node"]')
  const card =
    selectedNode.closest('[data-slot="desktop-compose-card"]') ??
    selectedNode
      .closest('[data-slot="desktop-compose-canvas"]')
      ?.querySelector('[data-slot="desktop-compose-card"]')

  expect(card).not.toBeNull()

  return card as HTMLElement
}

function getAccordionTriggerByText(parent: ParentNode, text: string) {
  const trigger = Array.from(
    parent.querySelectorAll('[data-slot="drafting-color-trigger"]'),
  ).find((element) => element.textContent?.includes(text))

  expect(trigger).not.toBeNull()

  return trigger as HTMLElement
}

function getButtonByExactText(parent: ParentNode, text: string) {
  const button = Array.from(parent.querySelectorAll("button")).find(
    (element) => element.textContent?.trim() === text,
  )

  expect(button).not.toBeNull()

  return button as HTMLButtonElement
}

async function flushPromises() {
  await Promise.resolve()
}

async function waitForDraftingSurface() {
  await act(async () => {
    for (let attempt = 0; attempt < 40; attempt += 1) {
      await flushPromises()
      const loading = document.querySelector('[data-slot="drafting-workspace-loading"]')
      const canvas = document.querySelector('[data-slot="desktop-compose-surface"]')
      if (!loading && canvas) {
        return
      }
    }
  })
}

async function addQrCode(parent: ParentNode) {
  await act(async () => {
    activateElement(getRequiredElement(parent, 'button[aria-label="Add content"]'))
    await flushPromises()
  })
  await act(async () => {
    activateElement(getRequiredElement(parent, '[data-slot="drafting-insert-menu-add-qr"]'))
    await flushPromises()
    await flushPromises()
  })
}

async function advanceDraftingTimers() {
  await act(async () => {
    await flushPromises()
    vi.advanceTimersByTime(300)
    await flushPromises()
    await flushPromises()
  })
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()

  return {
    get length() {
      return values.size
    },
    clear: vi.fn(() => values.clear()),
    getItem: vi.fn((key: string) => values.get(key) ?? null),
    key: vi.fn((index: number) => Array.from(values.keys())[index] ?? null),
    removeItem: vi.fn((key: string) => {
      values.delete(key)
    }),
    setItem: vi.fn((key: string, value: string) => {
      values.set(key, value)
    }),
  }
}
