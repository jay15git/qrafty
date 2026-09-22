// @vitest-environment jsdom

import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { createRoot } from "react-dom/client"
import { act, type ComponentProps } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createDefaultDraftingCardState } from "@/features/canvas/model/card-state"
import { Canvas } from "@/features/canvas/components/Canvas"
import { createDefaultQraftyState } from "@/features/qr/model/state"

vi.mock("@/features/qr/rendering/qr-svg", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/qr/rendering/qr-svg")>()

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
    expect(pane.className).toContain("bg-[var(--canvas-bg,#f0f1f2)]")
    expect(pane.querySelector('[data-slot="free-edit-artboard"]')).not.toBeNull()
    expect(workspace.container.querySelector('[data-slot="desktop-resize-toolbar"]')).toBeNull()
  })

  it("blocks preview wheel zoom when preview is locked", async () => {
    const workspace = renderWorkspace({
      paneCount: 1,
      previewLocked: true,
      toolbarVariant: "desktop-zoom",
    })
    const [pane] = getPaneSurfaces(workspace.container, 1)
    const viewport = pane.querySelector('[data-slot="template-edit-zone"]') as HTMLElement

    expect(pane.getAttribute("data-preview-locked")).toBe("true")
    expect(workspace.container.querySelector('[data-slot="desktop-resize-toolbar"]')).toBeNull()
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
  })

  it("zooms the active preview with the mouse wheel", async () => {
    const workspace = renderWorkspace({ paneCount: 1 })
    const [pane] = getPaneSurfaces(workspace.container, 1)
    const viewport = pane.firstElementChild as HTMLElement

    await act(async () => {
      pane.dispatchEvent(new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: -100,
      }))
      await flushPromises()
    })

    expect(viewport.style.transform).toMatch(/scale\(1\.1/)
  })

  it("zooms the active preview with a two finger pinch", async () => {
    const workspace = renderWorkspace({ paneCount: 1 })
    const [pane] = getPaneSurfaces(workspace.container, 1)
    const viewport = pane.firstElementChild as HTMLElement

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

    expect(viewport.style.transform).toContain("scale(1.5")
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

  it("does not zoom desktop compose content with wheel", async () => {
    const workspace = renderWorkspace({
      paneCount: 1,
      toolbarVariant: "desktop-zoom",
    })
    const [pane] = getPaneSurfaces(workspace.container, 1)
    const contentZoom = pane.querySelector(
      '[data-slot="desktop-compose-content-zoom"]',
    ) as HTMLElement

    await act(async () => {
      await flushPromises()
    })

    const transformBefore = contentZoom?.style.transform ?? ""

    await act(async () => {
      pane.dispatchEvent(new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        deltaY: -100,
      }))
      await flushPromises()
    })

    expect(contentZoom?.style.transform ?? "").toBe(transformBefore)
    expect(pane.className).toContain("touch-none")
  })

  it("pinch-zooms desktop compose content", async () => {
    const workspace = renderWorkspace({
      paneCount: 1,
      toolbarVariant: "desktop-zoom",
    })
    const [pane] = getPaneSurfaces(workspace.container, 1)
    const contentZoom = pane.querySelector(
      '[data-slot="desktop-compose-content-zoom"]',
    ) as HTMLElement

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

    expect(contentZoom?.style.transform).toContain("scale(1.5)")
  })

  it("pans empty canvas with a touch drag in desktop zoom mode", async () => {
    const workspace = renderWorkspace({
      paneCount: 1,
      toolbarVariant: "desktop-zoom",
    })
    const [pane] = getPaneSurfaces(workspace.container, 1)
    const contentZoom = pane.querySelector(
      '[data-slot="desktop-compose-content-zoom"]',
    ) as HTMLElement

    await act(async () => {
      await flushPromises()
    })

    await act(async () => {
      pane.dispatchEvent(createPointerEvent("pointerdown", 100, 120, "touch"))
      pane.dispatchEvent(createPointerEvent("pointermove", 140, 145, "touch"))
      pane.dispatchEvent(createPointerEvent("pointerup", 140, 145, "touch"))
      await flushPromises()
    })

    expect(contentZoom.style.transform).toBe("translate3d(40px, 25px, 0)")
  })

  it("pans only compose content in desktop zoom mode while the card stays fixed", async () => {
    const workspace = renderWorkspace({
      activeCanvasTool: "pan",
      paneCount: 1,
      toolbarVariant: "desktop-zoom",
    })
    const [pane] = getPaneSurfaces(workspace.container, 1)
    const artboard = pane.querySelector('[data-slot="free-edit-artboard"]') as HTMLElement
    const contentZoom = pane.querySelector('[data-slot="desktop-compose-content-zoom"]') as HTMLElement
    const panOverlay = pane.querySelector('[data-slot="drafting-pan-overlay"]')

    await act(async () => {
      await flushPromises()
    })

    await act(async () => {
      panOverlay?.dispatchEvent(createPointerEvent("pointerdown", 100, 120))
      panOverlay?.dispatchEvent(createPointerEvent("pointermove", 140, 145))
      panOverlay?.dispatchEvent(createPointerEvent("pointerup", 140, 145))
      await flushPromises()
    })

    expect(artboard.style.transform).toBe("")
    expect(contentZoom.style.transform).toBe("translate3d(40px, 25px, 0)")
  })

  it("clears selected layer when pressing empty canvas space", async () => {
    const onLayerSelect = vi.fn()
    const workspace = renderWorkspace({ activeCanvasTool: "select", onLayerSelect, paneCount: 1 })
    const [pane] = getPaneSurfaces(workspace.container, 1)

    await act(async () => {
      pane.dispatchEvent(createPointerEvent("pointerdown", 100, 120))
      await flushPromises()
    })

    expect(onLayerSelect).toHaveBeenCalledWith("pane-1", null)
  })

  it("does not pan when dragging a layer", async () => {
    const workspace = renderWorkspace({ activeCanvasTool: "select", paneCount: 1 })
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
    expect(workspace.container.querySelector('[data-slot="desktop-compose-toolbar-anchor"]')).toBeNull()

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

  it("reflects workspace surface appearance on the pane surface", async () => {
    const workspace = renderWorkspace({
      toolbarVariant: "desktop-zoom",
    })
    const pane = getPaneSurfaces(workspace.container, 1)[0]

    await act(async () => {
      await flushPromises()
    })

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
      resolve(process.cwd(), "features/canvas/components/Canvas.tsx"),
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
  onCanvasToolChange,
  onAddTextLayerAt,
  onLayerSelect,
  paneCount = 2,
  panes = createPanes(paneCount),
  selectedLayerId,
  selectedLayerIds,
  toolbarVariant,
  layerEditingEnabled,
  previewLocked,
}: {
  activeCanvasTool?: ComponentProps<typeof Canvas>["activeCanvasTool"]
  onCanvasToolChange?: ComponentProps<typeof Canvas>["onCanvasToolChange"]
  onAddTextLayerAt?: ComponentProps<typeof Canvas>["onAddTextLayerAt"]
  onLayerSelect?: (paneId: string, layerId: string | null) => void
  paneCount?: number
  panes?: ReturnType<typeof createPanes>
  selectedLayerId?: ComponentProps<typeof Canvas>["selectedLayerId"]
  selectedLayerIds?: ComponentProps<typeof Canvas>["selectedLayerIds"]
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
        onPaneQrClick={() => undefined}
        onPaneSelect={() => undefined}
        onLayerSelect={onLayerSelect}
        onCanvasToolChange={onCanvasToolChange}
        onAddTextLayerAt={onAddTextLayerAt}
        panes={nextPanes}
        selectedLayerId={selectedLayerId}
        selectedLayerIds={selectedLayerIds}
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
    ...createDefaultQraftyState(),
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

function createPointerEvent(
  type: string,
  clientX: number,
  clientY: number,
  pointerType: "mouse" | "touch" | "pen" = "mouse",
) {
  const PointerEventConstructor = window.PointerEvent ?? window.MouseEvent

  return new PointerEventConstructor(type, {
    bubbles: true,
    button: 0,
    cancelable: true,
    clientX,
    clientY,
    pointerId: 1,
    pointerType,
  } as PointerEventInit)
}

async function flushPromises() {
  await Promise.resolve()
}
