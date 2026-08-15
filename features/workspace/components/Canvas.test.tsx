// @vitest-environment jsdom

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createRoot } from "react-dom/client"
import { act, type ComponentProps } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createDefaultDraftingCardState } from "@/features/workspace/model/card-state"
import { Canvas } from "@/features/workspace/components/Canvas"
import { createDefaultQrStudioState } from "@/features/qr-code/model/state"

vi.mock("@/features/qr-code/rendering/qr-svg", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/qr-code/rendering/qr-svg")>()

  return {
    ...actual,
    buildDashboardQrNodePayload: vi.fn(() =>
      Promise.resolve({
        markup: "<svg />",
        naturalHeight: 240,
        naturalWidth: 240,
      }),
    ),
  }
})

const cleanupCallbacks: Array<() => void> = []

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
  HTMLElement.prototype.setPointerCapture = vi.fn()
  stubPortraitOrientation(false)
})

afterEach(() => {
  while (cleanupCallbacks.length > 0) {
    cleanupCallbacks.pop()?.()
  }
  vi.unstubAllGlobals()
  document.body.innerHTML = ""
})

describe("Canvas", () => {
  it("renders a single canvas surface", async () => {
    const workspace = renderWorkspace({ paneCount: 1 })

    await act(async () => {
      await flushPromises()
    })

    expect(getPaneSurfaces(workspace.container)).toHaveLength(1)
    expect(workspace.container.querySelector('[data-slot="drafting-pane-layout"]')).toBeNull()
  })

  it("renders one pane without resize handles", async () => {
    const workspace = renderWorkspace({ paneCount: 1 })

    await act(async () => {
      await flushPromises()
    })

    expect(getPaneSurfaces(workspace.container, 1)).toHaveLength(1)
    expect(getResizeHandles(workspace.container)).toHaveLength(0)
  })

  it("uses a fixed white workspace surface in free edit mode", async () => {
    const workspace = renderWorkspace({
      layerEditingEnabled: true,
      paneCount: 1,
      previewLocked: false,
      toolbarVariant: "desktop-zoom",
    })
    const [pane] = getPaneSurfaces(workspace.container, 1)

    await act(async () => {
      await flushPromises()
    })

    expect(pane.getAttribute("data-surface-appearance")).toBe("workspace")
    expect(pane.getAttribute("data-preview-locked")).toBe("false")
    expect(pane.className).toContain("bg-[var(--ws-workspace-bg,#ffffff)]")
    expect(pane.querySelector('[data-slot="free-edit-artboard"]')).not.toBeNull()
    expect(workspace.container.querySelector('[data-slot="desktop-resize-toolbar"]')).not.toBeNull()
  })

  it("blocks preview wheel zoom but keeps resize controls when preview is locked", async () => {
    const workspace = renderWorkspace({
      paneCount: 1,
      previewLocked: true,
      toolbarVariant: "desktop-zoom",
    })
    const [pane] = getPaneSurfaces(workspace.container, 1)
    const viewport = pane.querySelector('[data-slot="template-edit-zone"]') as HTMLElement

    expect(pane.getAttribute("data-preview-locked")).toBe("true")
    expect(workspace.container.querySelector('[data-slot="desktop-resize-toolbar"]')).not.toBeNull()
    expect(workspace.container.querySelector('button[aria-label="Pan canvas"]')).toBeNull()

    await act(async () => {
      await flushPromises()
    })

    const transformBefore = viewport.style.transform

    await act(async () => {
      pane.dispatchEvent(new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: -100,
      }))
      await flushPromises()
    })

    expect(viewport.style.transform).toBe(transformBefore)

    const zoomInButton = workspace.container.querySelector(
      'button[aria-label="Increase canvas size"]',
    ) as HTMLButtonElement | null

    expect(zoomInButton).not.toBeNull()

    await act(async () => {
      zoomInButton?.click()
      await flushPromises()
    })

    expect(viewport.style.transform).not.toBe(transformBefore)
  })

  it("zooms the active preview with the mouse wheel", async () => {
    const workspace = renderWorkspace({ paneCount: 1 })
    const [pane] = getPaneSurfaces(workspace.container, 1)

    await act(async () => {
      pane.dispatchEvent(new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: -100,
      }))
      await flushPromises()
    })

    expect(workspace.container.textContent).toContain("111%")
  })

  it("zooms the active preview with a two finger pinch", async () => {
    const workspace = renderWorkspace({ paneCount: 1 })
    const [pane] = getPaneSurfaces(workspace.container, 1)

    await act(async () => {
      pane.dispatchEvent(createTouchEvent("touchstart", [
        { clientX: 0, clientY: 0 },
        { clientX: 100, clientY: 0 },
      ]))
      pane.dispatchEvent(createTouchEvent("touchmove", [
        { clientX: 0, clientY: 0 },
        { clientX: 150, clientY: 0 },
      ]))
      await flushPromises()
    })

    expect(workspace.container.textContent).toContain("150%")
  })

  it("toggles layer snapping from the preview toolbar", async () => {
    const workspace = renderWorkspace({ paneCount: 1 })

    await act(async () => {
      await flushPromises()
    })

    const snapButton = workspace.container.querySelector(
      'button[aria-label="Disable snapping"]',
    ) as HTMLButtonElement | null

    expect(snapButton).not.toBeNull()
    expect(snapButton?.getAttribute("aria-pressed")).toBe("true")

    await act(async () => {
      snapButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      await flushPromises()
    })

    const disabledSnapButton = workspace.container.querySelector(
      'button[aria-label="Enable snapping"]',
    ) as HTMLButtonElement | null

    expect(disabledSnapButton).not.toBeNull()
    expect(disabledSnapButton?.getAttribute("aria-pressed")).toBe("false")
  })

  it("does not pan empty canvas space while the select tool is active", async () => {
    const workspace = renderWorkspace({ activeCanvasTool: "select", paneCount: 1 })
    const [pane] = getPaneSurfaces(workspace.container, 1)
    const viewport = pane.firstElementChild as HTMLElement

    await act(async () => {
      pane.dispatchEvent(createPointerEvent("pointerdown", 100, 120))
      pane.dispatchEvent(createPointerEvent("pointermove", 140, 145))
      pane.dispatchEvent(createPointerEvent("pointerup", 140, 145))
      await flushPromises()
    })

    expect(viewport.style.transform).toBe("translate3d(0px, 0px, 0) scale(1)")
  })

  it("pans the active preview by dragging empty canvas space with the pan tool", async () => {
    const workspace = renderWorkspace({ activeCanvasTool: "pan", paneCount: 1 })
    const [pane] = getPaneSurfaces(workspace.container, 1)
    const viewport = pane.firstElementChild as HTMLElement

    await act(async () => {
      pane.dispatchEvent(createPointerEvent("pointerdown", 100, 120))
      pane.dispatchEvent(createPointerEvent("pointermove", 140, 145))
      pane.dispatchEvent(createPointerEvent("pointerup", 140, 145))
      await flushPromises()
    })

    expect(viewport.style.transform).toBe("translate3d(40px, 25px, 0) scale(1)")
  })

  it("clears selected layer when pressing empty canvas space", async () => {
    const onLayerSelect = vi.fn()
    const workspace = renderWorkspace({ onLayerSelect, paneCount: 1 })
    const [pane] = getPaneSurfaces(workspace.container, 1)

    await act(async () => {
      pane.dispatchEvent(createPointerEvent("pointerdown", 100, 120))
      await flushPromises()
    })

    expect(onLayerSelect).toHaveBeenCalledWith("pane-1", null)
  })

  it("does not pan when dragging a layer", async () => {
    const workspace = renderWorkspace({ paneCount: 1 })
    const [pane] = getPaneSurfaces(workspace.container, 1)
    const viewport = pane.firstElementChild as HTMLElement
    const layer = getQrNodes(workspace.container)[0]

    await act(async () => {
      layer?.dispatchEvent(createPointerEvent("pointerdown", 100, 120))
      pane.dispatchEvent(createPointerEvent("pointermove", 140, 145))
      pane.dispatchEvent(createPointerEvent("pointerup", 140, 145))
      await flushPromises()
    })

    expect(viewport.style.transform).toBe("translate3d(0px, 0px, 0) scale(1)")
  })

  it("pans when dragging a layer with the pan tool active", async () => {
    const workspace = renderWorkspace({ activeCanvasTool: "pan", paneCount: 1 })
    const [pane] = getPaneSurfaces(workspace.container, 1)
    const viewport = pane.firstElementChild as HTMLElement
    const panOverlay = pane.querySelector('[data-slot="drafting-pan-overlay"]')

    await act(async () => {
      panOverlay?.dispatchEvent(createPointerEvent("pointerdown", 100, 120))
      panOverlay?.dispatchEvent(createPointerEvent("pointermove", 140, 145))
      panOverlay?.dispatchEvent(createPointerEvent("pointerup", 140, 145))
      await flushPromises()
    })

    expect(viewport.style.transform).toBe("translate3d(40px, 25px, 0) scale(1)")
  })

  it("shows a text cursor overlay above layer resize cursors while placing text", async () => {
    const onAddTextLayerAt = vi.fn()
    const onCanvasToolChange = vi.fn()
    const panes = createPanes(1)
    const workspace = renderWorkspace({
      activeCanvasTool: "text",
      onAddTextLayerAt,
      onCanvasToolChange,
      panes,
      selectedLayerId: "preview:qr",
      selectedLayerIds: ["preview:qr"],
      toolbarVariant: "desktop-zoom",
    })

    await act(async () => {
      await flushPromises()
    })

    const pane = getPaneSurfaces(workspace.container, 1)[0]
    const overlay = pane.querySelector('[data-slot="drafting-text-placement-overlay"]')

    expect(overlay).not.toBeNull()
    expect(overlay?.className).toContain("cursor-text")
    expect(overlay?.className).toContain("z-[40]")
    expect(
      pane.querySelector('[data-slot="drafting-layer-resize-handle"]')?.className,
    ).toContain("cursor-")
    expect(
      workspace.container.querySelector('[data-slot="desktop-compose-toolbar"]')?.parentElement
        ?.className,
    ).toContain("z-[60]")
    expect(
      workspace.container.querySelector('[data-slot="desktop-resize-toolbar"]')?.parentElement
        ?.className,
    ).toContain("z-[60]")

    await act(async () => {
      overlay?.dispatchEvent(new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 120,
      }))
      await flushPromises()
    })

    expect(onAddTextLayerAt).toHaveBeenCalledWith("pane-1", { x: 100, y: 120 })
    expect(onCanvasToolChange).toHaveBeenCalledWith(null)
  })

  it("renders disabled undo and redo controls when history is unavailable", () => {
    const workspace = renderWorkspace()
    const undoButton = workspace.container.querySelector(
      'button[aria-label="Undo"]',
    ) as HTMLButtonElement | null
    const redoButton = workspace.container.querySelector(
      'button[aria-label="Redo"]',
    ) as HTMLButtonElement | null

    expect(undoButton).not.toBeNull()
    expect(redoButton).not.toBeNull()
    expect(undoButton?.disabled).toBe(true)
    expect(redoButton?.disabled).toBe(true)
  })

  it("calls undo and redo toolbar handlers when history is available", () => {
    const onUndo = vi.fn()
    const onRedo = vi.fn()
    const workspace = renderWorkspace({
      history: {
        canRedo: true,
        canUndo: true,
        onRedo,
        onUndo,
      },
    })

    act(() => {
      workspace.container
        .querySelector('button[aria-label="Undo"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      workspace.container
        .querySelector('button[aria-label="Redo"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(onUndo).toHaveBeenCalledTimes(1)
    expect(onRedo).toHaveBeenCalledTimes(1)
  })

  it("omits undo and redo from the bottom toolbar in desktop zoom mode", () => {
    const workspace = renderWorkspace({
      canRedo: true,
      canUndo: true,
      onRedo: vi.fn(),
      onUndo: vi.fn(),
      toolbarVariant: "desktop-zoom",
    })
    const bottomToolbar = workspace.container.querySelector('[data-slot="desktop-compose-toolbar"]')

    expect(bottomToolbar?.querySelector('button[aria-label="Undo"]')).toBeNull()
    expect(bottomToolbar?.querySelector('button[aria-label="Redo"]')).toBeNull()
  })

  it("orders desktop bottom toolbar controls by interaction, view, and creation", () => {
    const workspace = renderWorkspace({
      onAddQrCode: vi.fn(),
      onAddTextLayerAt: vi.fn(),
      paneCount: 1,
      toolbarVariant: "desktop-zoom",
    })
    const bottomToolbar = workspace.container.querySelector('[data-slot="desktop-compose-toolbar"]')

    expect(bottomToolbar?.className).toContain("gap-0.5")
    expect(bottomToolbar?.className).toContain("flex-col")
    expect(bottomToolbar?.className).toContain("px-1")
    expect(
      Array.from(bottomToolbar?.children ?? []).filter((child) =>
        String((child as HTMLElement).className).includes("w-px"),
      ),
    ).toHaveLength(0)
    expect(
      Array.from(bottomToolbar?.querySelectorAll("button") ?? []).every((button) =>
        String(button.className).includes("size-9"),
      ),
    ).toBe(true)
    expect(Array.from(bottomToolbar?.querySelectorAll("button") ?? []).map((button) => button.getAttribute("aria-label"))).toEqual([
      "Select and move elements",
      "Pan canvas",
      "Disable snapping",
      "Hide canvas grid",
      "Add text on canvas",
      "Add content",
    ])
  })

  it("renders desktop select and pan tool buttons and wires mode changes", () => {
    const onCanvasToolChange = vi.fn()
    const workspace = renderWorkspace({
      activeCanvasTool: "pan",
      onCanvasToolChange,
      toolbarVariant: "desktop-zoom",
    })
    const selectButton = workspace.container.querySelector(
      'button[aria-label="Select and move elements"]',
    ) as HTMLButtonElement | null
    const panButton = workspace.container.querySelector(
      'button[aria-label="Pan canvas"]',
    ) as HTMLButtonElement | null

    expect(selectButton).not.toBeNull()
    expect(panButton).not.toBeNull()
    expect(
      workspace.container.querySelector('[data-slot="desktop-compose-toolbar"]')?.parentElement
        ?.className,
    ).toContain("z-[60]")
    expect(selectButton?.getAttribute("aria-pressed")).toBe("false")
    expect(panButton?.getAttribute("aria-pressed")).toBe("true")
    expect(
      workspace.container.querySelector('[data-slot="drafting-pan-overlay"]')?.className,
    ).toContain("z-[1]")

    act(() => {
      selectButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
      panButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(onCanvasToolChange).toHaveBeenNthCalledWith(1, "select")
    expect(onCanvasToolChange).toHaveBeenNthCalledWith(2, "pan")
  })

  it("toggles the desktop canvas dot grid from the main toolbar", () => {
    const onCanvasGridChange = vi.fn()
    const workspace = renderWorkspace({
      onCanvasGridChange,
      showCanvasGrid: true,
      toolbarVariant: "desktop-zoom",
    })
    const pane = getPaneSurfaces(workspace.container, 1)[0]
    const gridButton = workspace.container.querySelector(
      'button[aria-label="Hide canvas grid"]',
    ) as HTMLButtonElement | null

    expect(gridButton).not.toBeNull()
    expect(gridButton?.getAttribute("aria-pressed")).toBe("true")
    expect(pane?.getAttribute("data-grid-visible")).toBe("true")
    expect(pane?.getAttribute("data-surface-appearance")).toBe("workspace")
    expect(pane?.style.backgroundImage).toBe("none")

    act(() => {
      gridButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(onCanvasGridChange).toHaveBeenCalledWith(false)
  })

  it("hides the canvas dot grid when the desktop grid setting is off", () => {
    const workspace = renderWorkspace({
      showCanvasGrid: false,
      toolbarVariant: "desktop-zoom",
    })
    const pane = getPaneSurfaces(workspace.container, 1)[0]

    expect(workspace.container.querySelector('button[aria-label="Show canvas grid"]')).not.toBeNull()
    expect(pane?.getAttribute("data-grid-visible")).toBe("false")
    expect(pane?.getAttribute("data-surface-appearance")).toBe("workspace")
    expect(pane?.style.backgroundImage).toBe("none")
  })

  it("keeps the canvas grid toggle out of the non-desktop toolbar", () => {
    const workspace = renderWorkspace()

    expect(workspace.container.querySelector('button[aria-label="Hide canvas grid"]')).toBeNull()
    expect(workspace.container.querySelector('button[aria-label="Show canvas grid"]')).toBeNull()
  })

  it("keeps the desktop compose toolbar free of active scale motion", () => {
    const source = readFileSync(
      resolve(process.cwd(), "features/workspace/components/Canvas.tsx"),
      "utf8",
    )

    expect(source).not.toContain("active:scale-95")
  })

  it("hides selected layer chrome while the pan tool is active", async () => {
    const panes = createPanes(1)
    const unselectedWorkspace = renderWorkspace({ activeCanvasTool: "select", panes })

    await act(async () => {
      await flushPromises()
    })

    const selectedLayerId = getQrNodes(unselectedWorkspace.container)[0]?.getAttribute("data-layer-id")

    expect(selectedLayerId).toBeTruthy()

    const selectWorkspace = renderWorkspace({
      activeCanvasTool: "select",
      panes,
      selectedLayerId,
      selectedLayerIds: selectedLayerId ? [selectedLayerId] : [],
    })

    await act(async () => {
      await flushPromises()
    })

    expect(
      selectWorkspace.container.querySelector('[data-slot="drafting-layer-resize-frame"]'),
    ).not.toBeNull()
    expect(
      selectWorkspace.container.querySelector('[data-slot="drafting-layer-floating-toolbar"]'),
    ).not.toBeNull()

    const panWorkspace = renderWorkspace({
      activeCanvasTool: "pan",
      panes,
      selectedLayerId,
      selectedLayerIds: selectedLayerId ? [selectedLayerId] : [],
    })

    await act(async () => {
      await flushPromises()
    })

    expect(
      panWorkspace.container.querySelector('[data-slot="drafting-layer-resize-frame"]'),
    ).toBeNull()
    expect(
      panWorkspace.container.querySelector('[data-slot="drafting-layer-floating-toolbar"]'),
    ).toBeNull()
    expect(
      panWorkspace.container.querySelector('[data-slot="drafting-layer-size-value"]'),
    ).toBeNull()
    expect(panWorkspace.container.querySelector('[data-slot="drafting-pan-overlay"]')).not.toBeNull()
  })
})

function renderWorkspace({
  activeCanvasTool,
  history,
  qr,
  onCanvasToolChange,
  onCanvasGridChange,
  onAddTextLayerAt,
  onInsertLayer = vi.fn(),
  insertNodeId = "pane-1",
  onLayerSelect,
  onSwapPanes = vi.fn(),
  paneCount = 2,
  panes = createPanes(paneCount),
  selectedLayerId,
  selectedLayerIds,
  showCanvasGrid,
  toolbarVariant,
  layerEditingEnabled,
  previewLocked,
}: {
  activeCanvasTool?: ComponentProps<typeof Canvas>["activeCanvasTool"]
  history?: ComponentProps<typeof Canvas>["history"]
  qr?: ComponentProps<typeof Canvas>["qr"]
  onCanvasToolChange?: ComponentProps<typeof Canvas>["onCanvasToolChange"]
  onCanvasGridChange?: ComponentProps<typeof Canvas>["onCanvasGridChange"]
  onAddTextLayerAt?: ComponentProps<typeof Canvas>["onAddTextLayerAt"]
  onInsertLayer?: ComponentProps<typeof Canvas>["onInsertLayer"]
  insertNodeId?: ComponentProps<typeof Canvas>["insertNodeId"]
  onLayerSelect?: (paneId: string, layerId: string | null) => void
  onSwapPanes?: (sourcePaneId: string, targetPaneId: string) => void
  paneCount?: number
  panes?: ReturnType<typeof createPanes>
  selectedLayerId?: ComponentProps<typeof Canvas>["selectedLayerId"]
  selectedLayerIds?: ComponentProps<typeof Canvas>["selectedLayerIds"]
  showCanvasGrid?: ComponentProps<typeof Canvas>["showCanvasGrid"]
  toolbarVariant?: ComponentProps<typeof Canvas>["toolbarVariant"]
  layerEditingEnabled?: ComponentProps<typeof Canvas>["layerEditingEnabled"]
  previewLocked?: ComponentProps<typeof Canvas>["previewLocked"]
} = {}) {
  const container = document.createElement("div")
  const root = createRoot(container)

  function render(nextPanes = panes) {
    root.render(
      <Canvas
        activePaneId="pane-1"
        activeCanvasTool={activeCanvasTool}
        history={history}
        qr={qr}
        onPaneQrClick={() => undefined}
        onPaneSelect={() => undefined}
        onLayerSelect={onLayerSelect}
        onCanvasGridChange={onCanvasGridChange}
        onCanvasToolChange={onCanvasToolChange}
        onInsertLayer={onInsertLayer}
        insertNodeId={insertNodeId}
        onAddTextLayerAt={onAddTextLayerAt}
        panes={nextPanes}
        selectedLayerId={selectedLayerId}
        selectedLayerIds={selectedLayerIds}
        showCanvasGrid={showCanvasGrid}
        toolbarVariant={toolbarVariant}
        layerEditingEnabled={layerEditingEnabled}
        previewLocked={previewLocked}
      />,
    )
  }

  act(() => {
    render()
  })

  cleanupCallbacks.push(() => {
    act(() => {
      root.unmount()
    })
  })

  document.body.appendChild(container)

  return { container, render }
}

function createPanes(_paneCount = 1) {
  const state = {
    ...createDefaultQrStudioState(),
    data: "https://1.example",
  }

  return [
    {
      cardState: createDefaultDraftingCardState(),
      id: "pane-1",
      name: "QR Code",
      qrStateByLayerId: {
        "pane-1:qr": state,
      },
      state,
    },
  ]
}

function getPaneLayout(parent: ParentNode) {
  const layout = parent.querySelector('[data-slot="drafting-pane-layout"]') as HTMLElement | null

  expect(layout).not.toBeNull()

  return layout as HTMLElement
}

function getLayoutGroups(parent: ParentNode) {
  return Array.from(parent.querySelectorAll("[data-layout-group]")) as HTMLElement[]
}

function getNestedPanelGroups(parent: ParentNode) {
  const layout = getPaneLayout(parent)
  return Array.from(
    layout.querySelectorAll('[data-slot="resizable-panel-group"]'),
  ) as HTMLElement[]
}

function getResizeHandles(parent: ParentNode) {
  return Array.from(
    parent.querySelectorAll('[data-slot="drafting-resize-handle"]'),
  ) as HTMLElement[]
}

function getResizablePanels(parent: ParentNode) {
  return Array.from(parent.querySelectorAll("[data-panel]")) as HTMLElement[]
}

function getQrNodes(parent: ParentNode) {
  return Array.from(
    parent.querySelectorAll('[data-slot="desktop-compose-node"]'),
  ) as HTMLElement[]
}

function getPaneSurfaces(parent: ParentNode, expectedCount = 1) {
  const panes = Array.from(
    parent.querySelectorAll('[data-slot="desktop-compose-surface"]'),
  ) as HTMLElement[]

  expect(panes).toHaveLength(expectedCount)

  return panes
}

function stubPortraitOrientation(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      addEventListener: vi.fn(),
      matches,
      removeEventListener: vi.fn(),
    })),
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

function createTouchEvent(
  type: string,
  touches: Array<{ clientX: number; clientY: number }>,
) {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  })
  const touchList = {
    item: (index: number) => touches[index] ?? null,
    length: touches.length,
  }

  Object.defineProperty(event, "touches", {
    value: touchList,
  })

  return event
}

function createPointerEvent(type: string, clientX: number, clientY: number) {
  const PointerEventConstructor = window.PointerEvent ?? window.MouseEvent

  return new PointerEventConstructor(type, {
    bubbles: true,
    button: 0,
    cancelable: true,
    clientX,
    clientY,
    pointerId: 1,
    pointerType: "mouse",
  } as PointerEventInit)
}

async function flushPromises() {
  await Promise.resolve()
}
