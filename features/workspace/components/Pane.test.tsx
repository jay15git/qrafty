// @vitest-environment jsdom

import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const buildDashboardQrNodePayloadSpy = vi.fn()

vi.mock("@/features/qr-code/components/DotMatrixAnimatedQr", () => ({
  DotMatrixAnimatedQr: ({
    canvasSvgMarkup,
  }: {
    canvasSvgMarkup?: string | null
  }) => (
    <div
      data-canvas-markup={canvasSvgMarkup ?? ""}
      data-testid="dot-matrix-animated-qr"
    />
  ),
}))

vi.mock("@/features/qr-code/rendering/qr-svg", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/qr-code/rendering/qr-svg")>()

  return {
    ...actual,
    buildDashboardQrNodePayload: (
      ...args: Parameters<typeof buildDashboardQrNodePayloadSpy>
    ) => buildDashboardQrNodePayloadSpy(...args),
  }
})

import { Pane } from "@/features/workspace/components/Pane"
import {
  createDefaultDraftingCardPaperShader,
  createDefaultDraftingCardState,
} from "@/features/workspace/model/card-state"
import {
  createDefaultDraftingLayers,
  createDraftingTextLayer,
  getDraftingCardLayerId,
  getDraftingQrLayerId,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import {
  createDefaultQrStudioState,
  setDotMatrixAnimationOptions,
  setSquareQrSize,
  type QrStudioState,
} from "@/features/qr-code/model/state"
import { renderDashboardQrSvgMarkup } from "@/features/qr-code/rendering/qr-svg"
import { createDraftingQrArtworkState } from "@/features/workspace/rendering/qr-artwork"
import { createDefaultSceneComposition } from "@/features/workspace/model/scene-templates"
import type { DraftingQrStateByLayerId } from "@/features/workspace/model/document"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import { clearDraftingQrMarkupCache } from "@/features/workspace/hooks/use-drafting-qr-markup"

const cleanupCallbacks: Array<() => void> = []

function createAutoSizedCardState(overrides: Partial<DraftingCardState> = {}): DraftingCardState {
  return {
    ...createDefaultDraftingCardState(),
    sizeMode: "auto",
    ...overrides,
  }
}

const TEST_CANVAS_CARD_STATE: DraftingCardState = {
  ...createDefaultDraftingCardState(),
  height: 300,
  sizeMode: "fixed",
  width: 300,
}

beforeEach(() => {
  clearDraftingQrMarkupCache()
  buildDashboardQrNodePayloadSpy.mockReset()
  buildDashboardQrNodePayloadSpy.mockImplementation(async (state) => ({
    markup: `<svg data-width="${state.width}" data-height="${state.height}" />`,
    naturalHeight: state.height,
    naturalWidth: state.width,
  }))
  HTMLElement.prototype.setPointerCapture = vi.fn()
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    callback(0)
    return 1
  })
  vi.stubGlobal("cancelAnimationFrame", () => undefined)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()

  for (const cleanup of cleanupCallbacks.splice(0)) {
    cleanup()
  }

  document.body.innerHTML = ""
})

describe("Pane", () => {
  it("reuses cached markup for an equal state and rebuilds when state changes", async () => {
    const firstState = createDefaultQrStudioState()
    const secondState = structuredClone(firstState)
    const thirdState = setSquareQrSize(firstState, firstState.width + 40)

    const { container, reactRoot } = renderPane(firstState)

    await waitForQrPaneRender()

    expect(buildDashboardQrNodePayloadSpy).toHaveBeenCalledTimes(1)
    expect(container.querySelector('[data-slot="desktop-compose-node"]')).not.toBeNull()

    await act(async () => {
      reactRoot.render(
        <Pane
          state={secondState}
          cardState={createDefaultDraftingCardState()}
          qrStateByLayerId={createDefaultPaneQrStateByLayerId(secondState)}
          isSelected={false}
          onQrClick={() => undefined}
          onSelect={() => undefined}
        />,
      )
      await flushPromises()
      await flushPromises()
    })

    expect(buildDashboardQrNodePayloadSpy).toHaveBeenCalledTimes(1)

    await act(async () => {
      reactRoot.render(
        <Pane
          state={thirdState}
          cardState={createDefaultDraftingCardState()}
          qrStateByLayerId={createDefaultPaneQrStateByLayerId(thirdState)}
          isSelected={false}
          onQrClick={() => undefined}
          onSelect={() => undefined}
        />,
      )
      await flushPromises()
      await flushPromises()
    })

    expect(buildDashboardQrNodePayloadSpy).toHaveBeenCalledTimes(2)
  })

  it("renders card canvas background from card state only", async () => {
    const state = setSquareQrSize(createDefaultQrStudioState(), 240)
    const cardState = createDefaultDraftingCardState()
    const nodeId = "preview"
    const layers = createDefaultDraftingLayers(nodeId, state, cardState)
    const { container } = renderPane(state, false, cardState, {
      layers,
      sceneComposition: createDefaultSceneComposition(),
    })

    await waitForQrPaneRender()

    const card = container.querySelector('[data-slot="desktop-compose-card"]')
    const sceneBackground = card?.querySelector('[data-slot="scene-background-layer"]')
    const artboard = container.querySelector('[data-slot="desktop-compose-artboard"]')

    expect(card).not.toBeNull()
    expect(sceneBackground).toBeNull()
    expect(artboard?.querySelector(':scope > [data-slot="scene-background-layer"]')).toBeNull()
  })

  it("lets the qr canvas fill the preview pane", async () => {
    const state = setSquareQrSize(createDefaultQrStudioState(), 240)
    const { container } = renderPane(state)

    await waitForQrPaneRender()

    const canvas = container.querySelector('[data-slot="desktop-compose-canvas"]')
    const card = container.querySelector('[data-slot="desktop-compose-card"]')
    const node = container.querySelector('[data-slot="desktop-compose-node"]')
    const pane = container.querySelector('[data-slot="qr-pane"]')

    expect(pane).not.toBeNull()
    expect(pane?.className).toContain("overflow-visible")
    expect(pane?.className).not.toContain("overflow-hidden")
    expect(canvas).not.toBeNull()
    expect(canvas?.className).toContain("h-full")
    expect(canvas?.className).toContain("w-full")
    expect(canvas?.className).toContain("overflow-visible")
    expect(canvas?.className).not.toContain("p-4")
    expect(canvas?.className).not.toContain("sm:p-6")
    expect(canvas?.className).not.toContain("lg:p-8")
    expect(card).not.toBeNull()
    expect(node).not.toBeNull()
    const nodeClasses = node?.className.split(/\s+/) ?? []
    expect(nodeClasses).toContain("absolute")
    expect(nodeClasses).toContain("max-h-none")
    expect(nodeClasses).toContain("max-w-none")
    expect(nodeClasses).not.toContain("h-full")
    expect(nodeClasses).not.toContain("w-full")
    expect((node as HTMLElement).style.width).toBe("240px")
    expect((node as HTMLElement).style.height).toBe("240px")
  })

  it("sizes the preview from rendered qr bounds using padding and stroke only", async () => {
    const state = setSquareQrSize(createDefaultQrStudioState(), 240)
    state.backgroundShapeOptions = {
      edgeBlur: 10,
      paddingPx: 20,
      shadowColor: "#020617",
      shadowOffsetX: -14,
      shadowOffsetY: 18,
      shadowOpacity: 0,
      strokeColor: "#0f172a",
      strokeOpacity: 55,
      strokeWidth: 8,
      tiltX: 0,
      tiltY: 0,
    }
    const cardState = createAutoSizedCardState({
      bottomSpace: 96,
      padding: 20,
    })
    const { container } = renderPane(state, false, cardState)

    await waitForQrPaneRender()

    const card = container.querySelector('[data-slot="desktop-compose-card"]') as HTMLElement
    const node = container.querySelector('[data-slot="desktop-compose-node"]') as HTMLElement

    expect(node).not.toBeNull()
    expect(node.style.width).toBe("288px")
    expect(node.style.height).toBe("288px")
    expect(card).not.toBeNull()
    expect(card.style.width).toBe("328px")
    expect(card.style.height).toBe("424px")
  })

  it("renders the editable card layer behind the qr artwork", async () => {
    const state = setSquareQrSize(createDefaultQrStudioState(), 240)
    const cardState = createAutoSizedCardState({
      bottomSpace: 96,
      border: {
        color: "#111827",
        opacity: 40,
        width: 6,
      },
      cornerRadius: 24,
      fill: "#ffcc00",
      styleMode: "solid",
      padding: 20,
      shadow: {
        blur: 30,
        color: "#000000",
        offsetX: 6,
        offsetY: 8,
        opacity: 35,
      },
    })
    const { container } = renderPane(state, false, cardState)

    await waitForQrPaneRender()

    const card = container.querySelector('[data-slot="desktop-compose-card"]') as HTMLElement
    const node = container.querySelector('[data-slot="desktop-compose-node"]') as HTMLElement

    expect(card).not.toBeNull()
    expect(card.getAttribute("data-card-enabled")).toBe("true")
    expect(card.getAttribute("data-card-border-width")).toBe("6")
    expect(card.getAttribute("data-card-shadow-blur")).toBe("30")
    expect(card.getAttribute("data-card-shadow-offset-x")).toBe("6")
    expect(card.getAttribute("data-card-shadow-offset-y")).toBe("8")
    expect(card.style.backgroundColor).toBe("rgb(255, 204, 0)")
    expect(card.style.border).toContain("6px solid rgba(17, 24, 39, 0.4)")
    expect(card.style.borderRadius).toBe("28px 28px 28px 28px")
    expect(card.style.width).toBe("280px")
    expect(card.style.height).toBe("376px")
    expect(card.style.filter).toContain("drop-shadow(6px 8px 30px rgba(0, 0, 0, 0.35))")
    expect(node).not.toBeNull()
    expect(node.parentElement).toBe(card.parentElement)
    expect(node.style.width).toBe("240px")
    expect(node.style.height).toBe("240px")
  })

  it("renders selected qr backing shapes as a qr-layer background without changing the card", async () => {
    buildDashboardQrNodePayloadSpy.mockImplementationOnce(async () => ({
      markup:
        '<svg width="240" height="240" viewBox="0 0 240 240"><defs><filter data-qr-layer="background-shape-blur-filter" id="background-shape-blur-filter"/></defs><path data-qr-layer="background-shape-blur" d="M0 0h240v240H0z"/><path data-qr-layer="background-shape" d="M0 0h240v240H0z"/><rect width="240" height="240" clip-path="url(\'#clip-path-background-color-0\')" fill="#fff"/><path data-qr-layer="dot" d="M20 20h40v40H20z" fill="#111"/></svg>',
      naturalHeight: 240,
      naturalWidth: 240,
    }))
    const state = setSquareQrSize(createDefaultQrStudioState(), 240)
    state.backgroundShapeId = "flower"
    state.backgroundShapeOptions = {
      edgeBlur: 20,
      paddingPx: 24,
      shadowColor: "#22c55e",
      shadowOffsetX: 16,
      shadowOffsetY: -12,
      shadowOpacity: 80,
      strokeColor: "#0f172a",
      strokeOpacity: 40,
      strokeWidth: 8,
      tiltX: 0,
      tiltY: 0,
    }
    const cardState = {
      ...createDefaultDraftingCardState(),
      fill: "#ffffff",
      shadow: {
        blur: 30,
        color: "#000000",
        offsetX: 6,
        offsetY: 8,
        opacity: 35,
      },
    }
    const { container } = renderPane(state, false, cardState)

    await waitForQrPaneRender()

    const card = container.querySelector('[data-slot="desktop-compose-card"]') as HTMLElement
    const cardShape = card.querySelector('[data-slot="drafting-card-shape"]')
    const qrBackground = container.querySelector('[data-slot="drafting-qr-background"]')
    const qrComponent = container.querySelector('[data-slot="drafting-qr-component"]') as HTMLElement

    expect(card.getAttribute("data-card-shape")).toBeNull()
    expect(cardShape).toBeNull()
    expect(card.style.filter).toContain("drop-shadow(6px 8px 30px rgba(0, 0, 0, 0.35))")
    expect(qrBackground).not.toBeNull()
    expect(qrBackground?.getAttribute("data-background-shape")).toBe("flower")
    expect(qrBackground?.querySelector("svg")).not.toBeNull()
    expect(qrBackground?.querySelector("path")).not.toBeNull()
    expect(qrComponent).not.toBeNull()
    expect(qrComponent?.querySelector("svg")).not.toBeNull()
    expect(container.querySelector('[data-slot="new-qr-code"]')).toBeNull()
    expect(buildDashboardQrNodePayloadSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundGradient: expect.objectContaining({ enabled: false }),
        backgroundImage: {
          source: "none",
          value: undefined,
          presetId: undefined,
          presetColor: undefined,
        },
        backgroundOptions: expect.objectContaining({ transparent: true }),
        backgroundShapeId: "none",
      }),
    )
  })

  it("marks the card layer with the selected paper shader", async () => {
    const state = setSquareQrSize(createDefaultQrStudioState(), 240)
    const cardState = {
      ...createDefaultDraftingCardState(),
      paperShader: createDefaultDraftingCardPaperShader("warp"),
      styleMode: "paper-shader" as const,
    }
    const { container } = renderPane(state, false, cardState)

    await waitForQrPaneRender()

    const card = container.querySelector('[data-slot="desktop-compose-card"]') as HTMLElement

    expect(card).not.toBeNull()
    expect(card.getAttribute("data-card-style-mode")).toBe("paper-shader")
    expect(card.getAttribute("data-card-paper-shader")).toBe("warp")
  })

  it("renders qr artwork without the card wrapper when the card is disabled", async () => {
    const state = setSquareQrSize(createDefaultQrStudioState(), 240)
    const cardState = createAutoSizedCardState({
      enabled: false,
      styleMode: "solid",
    })
    const { container } = renderPane(state, false, cardState)

    await waitForQrPaneRender()

    const card = container.querySelector('[data-slot="desktop-compose-card"]')
    const node = container.querySelector('[data-slot="desktop-compose-node"]')

    expect(card).not.toBeNull()
    expect(node).not.toBeNull()
  })

  it("keeps the qr canvas unshadowed when selected", async () => {
    const state = setSquareQrSize(createDefaultQrStudioState(), 240)
    const { container } = renderPane(state, true)

    await waitForQrPaneRender()

    const pane = container.querySelector('[data-slot="qr-pane"]')
    const canvas = container.querySelector('[data-slot="desktop-compose-canvas"]')
    const node = container.querySelector('[data-slot="desktop-compose-node"]')

    expect(pane).not.toBeNull()
    expect(pane?.className).not.toContain("ring-2")
    expect(canvas?.className).not.toContain("shadow-[0_24px_48px_rgba(15,23,42,0.18)]")
    expect(node?.className).not.toContain("shadow-[0_10px_24px_-12px_rgba(15,23,42,0.26)]")
    expect((node as HTMLElement | null)?.style.width).toBe("240px")
    expect((node as HTMLElement | null)?.style.height).toBe("240px")
  })

  it("sizes the preview wrapper from the qr state", async () => {
    const state = setSquareQrSize(createDefaultQrStudioState(), 320)
    const { container } = renderPane(state)

    await waitForQrPaneRender()

    const node = container.querySelector('[data-slot="desktop-compose-node"]')

    expect(node).not.toBeNull()
    expect((node as HTMLElement).style.width).toBe("320px")
    expect((node as HTMLElement).style.height).toBe("320px")
  })

  it("shows corner resize handles and grabbable edge zones for the selected layer", async () => {
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      onLayerChange: () => undefined,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const cornerDirections = Array.from(
      container.querySelectorAll('[data-slot="drafting-layer-resize-handle"]'),
    ).map((handle) => handle.getAttribute("data-resize-direction"))
    const edgeDirections = Array.from(
      container.querySelectorAll('[data-slot="drafting-layer-resize-edge"]'),
    ).map((handle) => handle.getAttribute("data-resize-direction"))
    const resizeHandle = container.querySelector('[data-slot="drafting-layer-resize-handle"]')

    expect(cornerDirections).toEqual(["ne", "se", "sw", "nw"])
    expect(edgeDirections).toEqual(["n", "e", "s", "w"])
    expect(resizeHandle?.className).toContain("rounded-full")
    expect(resizeHandle?.className).toContain("border-[#a8b0bb]")
    expect(resizeHandle?.className).toContain("bg-white")
  })

  it("keeps resize control padding equal around selected qr layers", async () => {
    const state = setSquareQrSize(createDefaultQrStudioState(), 240)
    const cardState = createAutoSizedCardState({
      bottomSpace: 96,
      padding: 20,
    })
    const { container } = renderPane(state, true, cardState, {
      onLayerChange: () => undefined,
      selectedLayerId: getDraftingQrLayerId("preview"),
    })

    await waitForQrPaneRender()

    const card = container.querySelector('[data-slot="desktop-compose-card"]') as HTMLElement
    const frame = container.querySelector('[data-slot="drafting-layer-resize-frame"]') as HTMLElement

    expect(card).not.toBeNull()
    expect(card.className).toContain("overflow-hidden")
    expect(card.className).toContain("pointer-events-none")
    expect(card.className).not.toContain("outline")
    expect(frame).not.toBeNull()
    expect(frame.className).toContain("border")
    expect(frame.style.width).toBe("264px")
    expect(frame.style.height).toBe("264px")
    expect(frame.style.transform).toBe("translate3d(-132px, -180px, 0)")
    expect(frame.style.zIndex).toBe("10000")
  })

  it("snaps moving layers to nearby layer center guides", async () => {
    const onLayerChange = vi.fn()
    const layers: DraftingCanvasLayer[] = [
      createLayer({ height: 300, id: "preview:card", kind: "card", width: 300, x: -150, y: -150, zIndex: 0 }),
      createLayer({ height: 100, id: "preview:qr", kind: "qr", width: 100, x: -100, y: -80, zIndex: 1 }),
    ]
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers,
      onLayerChange,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const qrLayer = container.querySelector('[data-layer-id="preview:qr"]') as HTMLElement

    act(() => {
      qrLayer.dispatchEvent(createPointerEvent("pointerdown", 0, 0))
      qrLayer.dispatchEvent(createPointerEvent("pointermove", 45, 0))
    })

    expect(onLayerChange).toHaveBeenLastCalledWith("preview:qr", {
      x: -50,
      y: -80,
    })
    expect(container.querySelector('[data-slot="drafting-layer-snap-guide"][data-axis="vertical"]')).not.toBeNull()
  })

  it("keeps moving layers freeform outside the snap threshold", async () => {
    const onLayerChange = vi.fn()
    const layers: DraftingCanvasLayer[] = [
      createLayer({ height: 300, id: "preview:card", kind: "card", width: 300, x: -150, y: -150, zIndex: 0 }),
      createLayer({ height: 100, id: "preview:qr", kind: "qr", width: 100, x: -100, y: -80, zIndex: 1 }),
    ]
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers,
      onLayerChange,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const qrLayer = container.querySelector('[data-layer-id="preview:qr"]') as HTMLElement

    act(() => {
      qrLayer.dispatchEvent(createPointerEvent("pointerdown", 0, 0))
      qrLayer.dispatchEvent(createPointerEvent("pointermove", 30, 0))
    })

    expect(onLayerChange).toHaveBeenLastCalledWith("preview:qr", {
      x: -70,
      y: -80,
    })
    expect(container.querySelector('[data-slot="drafting-layer-snap-guide"]')).toBeNull()
  })

  it("does not flash snap guides while clicking a layer", async () => {
    const onLayerChange = vi.fn()
    const layers: DraftingCanvasLayer[] = [
      createLayer({ height: 300, id: "preview:card", kind: "card", width: 300, x: -150, y: -150, zIndex: 0 }),
      createLayer({ height: 100, id: "preview:qr", kind: "qr", width: 100, x: -50, y: -50, zIndex: 1 }),
    ]
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers,
      onLayerChange,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const qrLayer = container.querySelector('[data-layer-id="preview:qr"]') as HTMLElement

    act(() => {
      qrLayer.dispatchEvent(createPointerEvent("pointerdown", 0, 0))
      qrLayer.dispatchEvent(createPointerEvent("pointermove", 1, 1))
    })

    expect(onLayerChange).not.toHaveBeenCalled()
    expect(container.querySelector('[data-slot="drafting-layer-snap-guide"]')).toBeNull()
  })

  it("snaps resize handles to nearby layer edges", async () => {
    const onLayerChange = vi.fn()
    const layers: DraftingCanvasLayer[] = [
      createLayer({ height: 240, id: "preview:card", kind: "card", width: 240, x: -120, y: -120, zIndex: 0 }),
      createLayer({ height: 100, id: "preview:qr", kind: "qr", width: 100, x: 0, y: 0, zIndex: 1 }),
    ]
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers,
      onLayerChange,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const handle = container.querySelector(
      '[data-slot="drafting-layer-resize-edge"][data-resize-direction="e"]',
    ) as HTMLButtonElement

    act(() => {
      handle.dispatchEvent(createPointerEvent("pointerdown", 100, 100))
      handle.dispatchEvent(createPointerEvent("pointermove", 117, 100))
    })

    expect(onLayerChange).toHaveBeenLastCalledWith("preview:qr", {
      height: 120,
      width: 120,
      x: 0,
      y: -10,
    })
    expect(container.querySelector('[data-slot="drafting-layer-snap-guide"][data-axis="vertical"]')).not.toBeNull()
  })

  it("keeps resize handles freeform unless very close to layer edges", async () => {
    const onLayerChange = vi.fn()
    const layers: DraftingCanvasLayer[] = [
      createLayer({ height: 240, id: "preview:card", kind: "card", width: 240, x: -120, y: -120, zIndex: 0 }),
      createLayer({ height: 100, id: "preview:qr", kind: "qr", width: 100, x: 0, y: 0, zIndex: 1 }),
    ]
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers,
      onLayerChange,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const handle = container.querySelector(
      '[data-slot="drafting-layer-resize-edge"][data-resize-direction="e"]',
    ) as HTMLButtonElement

    act(() => {
      handle.dispatchEvent(createPointerEvent("pointerdown", 100, 100))
      handle.dispatchEvent(createPointerEvent("pointermove", 116, 100))
    })

    expect(onLayerChange).toHaveBeenLastCalledWith("preview:qr", {
      height: 116,
      width: 116,
      x: 0,
      y: -8,
    })
    expect(container.querySelector('[data-slot="drafting-layer-snap-guide"]')).toBeNull()
  })

  it("keeps QR side-handle resize centered on the perpendicular axis", async () => {
    const onLayerChange = vi.fn()
    const layers: DraftingCanvasLayer[] = [
      createLayer({ height: 300, id: "preview:card", kind: "card", width: 300, x: -150, y: -150, zIndex: 0 }),
      createLayer({ height: 250, id: "preview:qr", kind: "qr", width: 250, x: -125, y: -125, zIndex: 1 }),
    ]
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers,
      onLayerChange,
      selectedLayerId: "preview:qr",
      snapEnabled: false,
    })

    await waitForQrPaneRender()

    const handle = container.querySelector(
      '[data-slot="drafting-layer-resize-edge"][data-resize-direction="e"]',
    ) as HTMLButtonElement

    act(() => {
      handle.dispatchEvent(createPointerEvent("pointerdown", 250, 0))
      handle.dispatchEvent(createPointerEvent("pointermove", 270, 0))
    })

    expect(onLayerChange).toHaveBeenLastCalledWith("preview:qr", {
      height: 270,
      width: 270,
      x: -125,
      y: -135,
    })
  })

  it("renders selected layer controls above higher z-index layer content", async () => {
    const state = createDefaultQrStudioState()
    const cardState = createDefaultDraftingCardState()
    const layers = createDefaultDraftingLayers("preview", state, cardState).map((layer) =>
      layer.id === "preview:qr"
        ? { ...layer, zIndex: 1 }
        : { ...layer, zIndex: 50 },
    )
    const { container } = renderPane(state, true, cardState, {
      layers,
      onLayerChange: () => undefined,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const selectedLayer = container.querySelector('[data-layer-id="preview:qr"]') as HTMLElement
    const upperLayer = container.querySelector('[data-layer-id="preview:card"]') as HTMLElement
    const frame = container.querySelector('[data-slot="drafting-layer-resize-frame"]') as HTMLElement

    expect(selectedLayer.style.zIndex).toBe("1")
    expect(upperLayer.style.zIndex).toBe("50")
    expect(frame.style.zIndex).toBe("10000")
    expect(frame.compareDocumentPosition(upperLayer) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy()
  })

  it("shows a rotation handle above the selected layer controls", async () => {
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      onLayerChange: () => undefined,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const rotateHandle = container.querySelector('[data-slot="drafting-layer-rotate-handle"]')

    expect(rotateHandle).not.toBeNull()
    expect(rotateHandle?.querySelector("svg")).toBeNull()
    expect(rotateHandle?.className).toContain("rounded-full")
    expect(rotateHandle?.className).toContain("border-[#a8b0bb]")
    expect(rotateHandle?.className).toContain("bg-white")
    expect(rotateHandle?.className).toContain("size-3")
    expect((rotateHandle as HTMLElement | null)?.style.transform).toBe(
      "translate(-50%, calc(-34px - 50%))",
    )
    expect(container.querySelector('[data-slot="drafting-layer-rotation-value"]')).toBeNull()
    expect(container.innerHTML).toContain('aria-label="Rotate QR code"')
  })

  it("renders and edits Avnac-style text layers inline", async () => {
    const onLayerChange = vi.fn()
    const onLayerSelect = vi.fn()
    const textLayer = createDraftingTextLayer("preview", {
      fill: "#123456",
      fontFamily: "Manrope",
      fontSize: 38,
      id: "preview:text",
      text: "Scan here",
      textAlign: "center",
      width: 260,
      zIndex: 2,
    })
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers: [...createDefaultDraftingLayers("preview", createDefaultQrStudioState(), createDefaultDraftingCardState()), textLayer],
      onLayerChange,
      onLayerSelect,
      selectedLayerId: "preview:text",
    })

    await waitForQrPaneRender()

    const text = getRequiredElement(container, '[data-slot="drafting-text-layer"]') as HTMLElement
    const content = getRequiredElement(text, '[data-slot="drafting-text-content"]') as HTMLElement

    expect(text.getAttribute("data-selected")).toBe("true")
    expect(content.textContent).toBe("Scan here")
    expect(content.style.color).toBe("rgb(18, 52, 86)")
    expect(content.style.fontFamily).toBe('"Manrope", system-ui, Arial, sans-serif')
    expect(content.style.fontSize).toBe("38px")
    expect(content.style.textAlign).toBe("center")

    act(() => {
      text.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }))
    })

    const editor = getRequiredElement(text, '[data-slot="drafting-text-editor"]') as HTMLTextAreaElement

    expect(onLayerSelect).toHaveBeenCalledWith("preview:text")
    expect(editor.tagName).toBe("TEXTAREA")
    expect(editor.value).toBe("Scan here")

    act(() => {
      editor.value = "Table 12"
      editor.dispatchEvent(new Event("input", { bubbles: true }))
    })

    expect(onLayerChange).not.toHaveBeenCalled()

    act(() => {
      editor.dispatchEvent(new FocusEvent("focusout", { bubbles: true }))
    })

    expect(onLayerChange).toHaveBeenCalledWith("preview:text", {
      text: "Table 12",
      textRuns: undefined,
    })
  })

  it("keeps the text editor active after double click without a floating format toolbar", async () => {
    let textLayer = createDraftingTextLayer("preview", {
      id: "preview:text",
      text: "Scan here",
      zIndex: 2,
    })
    const onLayerChange = vi.fn((layerId: string, patch: Partial<DraftingCanvasLayer>) => {
      if (layerId === textLayer.id) {
        textLayer = { ...textLayer, ...patch }
      }
    })
    const defaultLayers = createDefaultDraftingLayers(
      "preview",
      createDefaultQrStudioState(),
      createDefaultDraftingCardState(),
    )
    const { container, reactRoot } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers: [...defaultLayers, textLayer],
      onLayerChange,
      selectedLayerId: "preview:text",
    })

    await act(async () => {
      await flushPromises()
    })

    const text = getRequiredElement(container, '[data-slot="drafting-text-layer"]') as HTMLElement

    act(() => {
      text.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }))
    })

    const editor = getRequiredElement(text, '[data-slot="drafting-text-editor"]') as HTMLTextAreaElement

    expect(text.className).toContain("cursor-text")
    expect(text.className).not.toContain("cursor-all-scroll")
    expect(editor.className).toContain("cursor-text")
    expect(editor.value).toBe("Scan here")
    expect(container.querySelector('[data-slot="desktop-text-format-toolbar"]')).toBeNull()

    act(() => {
      reactRoot.render(
        <Pane
          cardState={createDefaultDraftingCardState()}
          isSelected
          layers={[...defaultLayers, textLayer]}
          qrStateByLayerId={createTestQrStateByLayerId(createDefaultQrStudioState(), [
            ...defaultLayers,
            textLayer,
          ])}
          selectedLayerId="preview:text"
          state={createDefaultQrStudioState()}
          onLayerChange={onLayerChange}
          onQrClick={() => undefined}
          onSelect={() => undefined}
        />,
      )
    })

    const activeEditor = getRequiredElement(container, '[data-slot="drafting-text-editor"]') as HTMLTextAreaElement

    expect(activeEditor.value).toBe("Scan here")
  })

  it("renders legacy text runs for display", async () => {
    let textLayer = createDraftingTextLayer("preview", {
      id: "preview:text",
      text: "Scan here",
      textRuns: [
        { fontWeight: 700, text: "Scan" },
        { fontStyle: "italic", text: " here" },
      ],
      zIndex: 2,
    })
    const onLayerChange = vi.fn((layerId: string, patch: Partial<DraftingCanvasLayer>) => {
      if (layerId === textLayer.id) {
        textLayer = { ...textLayer, ...patch }
      }
    })
    const defaultLayers = createDefaultDraftingLayers(
      "preview",
      createDefaultQrStudioState(),
      createDefaultDraftingCardState(),
    )
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers: [...defaultLayers, textLayer],
      onLayerChange,
      selectedLayerId: "preview:text",
    })

    await act(async () => {
      await flushPromises()
    })

    const text = getRequiredElement(container, '[data-slot="drafting-text-layer"]') as HTMLElement
    const runs = Array.from(text.querySelectorAll('[data-slot="drafting-text-run"]')) as HTMLElement[]

    expect(runs.map((run) => run.textContent)).toEqual(["Scan", " here"])
    expect(runs[0].style.fontWeight).toBe("700")
    expect(runs[1].style.fontStyle).toBe("italic")
    expect(container.querySelector('[data-slot="desktop-text-format-toolbar"]')).toBeNull()
  })

  it("shows floating layer actions for a selected unlocked text layer", async () => {
    const onLayerAction = vi.fn()
    const onLayerCopy = vi.fn()
    const onLayerChange = vi.fn()
    const textLayer = createDraftingTextLayer("preview", {
      id: "preview:text",
      text: "Scan here",
      zIndex: 2,
    })
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers: [...createDefaultDraftingLayers("preview", createDefaultQrStudioState(), createDefaultDraftingCardState()), textLayer],
      onLayerAction,
      onLayerCopy,
      onLayerChange,
      selectedLayerId: "preview:text",
    })

    await act(async () => {
      await flushPromises()
    })

    const toolbar = getRequiredElement(container, '[data-slot="drafting-layer-floating-toolbar"]')

    expect(toolbar).not.toBeNull()
    expect(toolbar.getAttribute("role")).toBe("toolbar")
    expect((toolbar as HTMLElement).style.transform).toContain("translate3d")
    expect(getRequiredElement(toolbar, 'button[aria-label="Text color"]')).toBeTruthy()
    expect(getRequiredElement(toolbar, 'button[aria-label="Text formatting"]')).toBeTruthy()
    expect(getRequiredElement(toolbar, 'button[aria-label="Text size"]')).toBeTruthy()

    act(() => {
      clickElement(getRequiredElement(toolbar, 'button[aria-label="Text formatting"]'))
    })

    expect(
      document.querySelector('[data-slot="drafting-layer-text-typography-settings"]'),
    ).toBeTruthy()

    act(() => {
      clickElement(getRequiredElement(toolbar, 'button[aria-label="Text size"]'))
    })

    expect(document.querySelector('[data-slot="drafting-layer-text-size-settings"]')).toBeTruthy()
    expect(document.querySelector('[data-slot="drafting-layer-text-size-settings"] button[aria-label="32px"]')).toBeTruthy()

    act(() => {
      clickElement(getRequiredElement(toolbar, 'button[aria-label="Copy selection"]'))
    })

    expect(onLayerCopy).toHaveBeenCalledWith(["preview:text"])

    act(() => {
      clickElement(getRequiredElement(toolbar, 'button[aria-label="Lock selection"]'))
    })

    expect(onLayerAction).toHaveBeenCalledWith(["preview:text"], "lock")

    act(() => {
      clickElement(getRequiredElement(toolbar, 'button[aria-label="Delete selection"]'))
    })

    expect(onLayerAction).toHaveBeenCalledWith(["preview:text"], "delete")
  })

  it("shows unlock action for locked selected layers without resize handles", async () => {
    const onLayerAction = vi.fn()
    const lockedTextLayer = createDraftingTextLayer("preview", {
      id: "preview:text",
      isLocked: true,
      zIndex: 2,
    })
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers: [...createDefaultDraftingLayers("preview", createDefaultQrStudioState(), createDefaultDraftingCardState()), lockedTextLayer],
      onLayerAction,
      selectedLayerId: "preview:text",
    })

    await act(async () => {
      await flushPromises()
    })

    const toolbar = getRequiredElement(container, '[data-slot="drafting-layer-floating-toolbar"]')

    expect(container.querySelector('[data-slot="drafting-layer-resize-frame"]')).toBeNull()

    act(() => {
      clickElement(getRequiredElement(toolbar, 'button[aria-label="Unlock selection"]'))
    })

    expect(onLayerAction).toHaveBeenCalledWith(["preview:text"], "unlock")
  })

  it("opens the existing context menu from the floating more button", async () => {
    const onLayerAction = vi.fn()
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      onLayerAction,
      selectedLayerId: "preview:qr",
    })

    await act(async () => {
      await flushPromises()
    })

    const moreButton = getRequiredElement(
      container,
      '[data-slot="drafting-layer-floating-toolbar"] button[aria-label="More layer actions"]',
    )
    setElementRect(moreButton, { height: 28, left: 120, top: 80, width: 28 })

    act(() => {
      clickElement(moreButton)
    })

    const menu = document.body.querySelector('[data-slot="drafting-layer-context-menu"]') as HTMLElement

    expect(menu).not.toBeNull()
    expect(menu.className).toContain("bg-[var(--ws-dropdown-menu-surface-open)]")
    expect(menu.className).not.toContain("backdrop-blur")
    expect(menu.style.left).toBe("120px")
    expect(menu.style.top).toBe("116px")

    for (const label of ["Paste", "Copy", "Lock", "Delete", "Align left", "Align center", "Align middle", "Align right"]) {
      expect(menu.querySelector(`button[aria-label="${label}"]`)).toBeNull()
    }

    act(() => {
      clickElement(getRequiredElement(document.body, 'button[aria-label="Bring to front"]'))
    })

    expect(onLayerAction).toHaveBeenCalledWith(["preview:qr"], "front")
  })

  it("uses all selected layer ids for multi-selection floating actions", async () => {
    const onLayerAction = vi.fn()
    const onLayerCopy = vi.fn()
    const selectedLayerIds = [getDraftingQrLayerId("preview"), "preview:text"]
    const layers = createDefaultDraftingLayers(
      "preview",
      createDefaultQrStudioState(),
      createDefaultDraftingCardState(),
    ).concat(
      createDraftingTextLayer("preview", {
        height: 40,
        id: "preview:text",
        width: 120,
        x: 0,
        y: 120,
        zIndex: 2,
      }),
    )
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers,
      onLayerAction,
      onLayerCopy,
      selectedLayerIds,
    })

    await act(async () => {
      await flushPromises()
    })

    const toolbar = getRequiredElement(container, '[data-slot="drafting-layer-floating-toolbar"]')

    act(() => {
      clickElement(getRequiredElement(toolbar, 'button[aria-label="Copy selection"]'))
    })

    expect(onLayerCopy).toHaveBeenCalledWith(selectedLayerIds)

    act(() => {
      clickElement(getRequiredElement(toolbar, 'button[aria-label="Lock selection"]'))
    })

    expect(onLayerAction).toHaveBeenCalledWith(selectedLayerIds, "lock")
  })

  it("opens a selected layer context menu and emits layer actions", async () => {
    const onLayerAction = vi.fn()
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      onLayerAction,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const frame = container.querySelector('[data-slot="drafting-layer-resize-frame"]') as HTMLElement

    act(() => {
      frame.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 140,
        }),
      )
    })

    const menu = document.body.querySelector('[data-slot="drafting-layer-context-menu"]') as HTMLElement

    expect(menu).not.toBeNull()
    expect(menu.className).toContain("bg-[var(--ws-dropdown-menu-surface-open)]")
    expect(menu.className).not.toContain("backdrop-blur")
    expect(menu.style.left).toBe("120px")
    expect(menu.style.top).toBe("148px")
    expect(menu.textContent).not.toContain("QR code")
    expect(menu.textContent).not.toContain("Card")

    for (const label of ["Paste", "Copy", "Lock", "Delete", "Align left", "Align center", "Align middle", "Align right"]) {
      expect(menu.querySelector(`button[aria-label="${label}"]`)).toBeNull()
    }

    act(() => {
      frame.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 140,
        }),
      )
    })

    await act(async () => {
      await flushPromises()
    })

    act(() => {
      clickElement(getRequiredElement(document.body, 'button[aria-label="Bring to front"]'))
    })

    expect(onLayerAction).toHaveBeenCalledWith(["preview:qr"], "front")
  })

  it("closes the layer context menu after clicking outside it", async () => {
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const frame = container.querySelector('[data-slot="drafting-layer-resize-frame"]') as HTMLElement

    act(() => {
      frame.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: 120,
          clientY: 140,
        }),
      )
    })

    expect(document.body.querySelector('[data-slot="drafting-layer-context-menu"]')).not.toBeNull()

    act(() => {
      document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true, button: 0 }))
    })

    expect(document.body.querySelector('[data-slot="drafting-layer-context-menu"]')).toBeNull()
  })

  it("opens an empty canvas context menu without paste actions", async () => {
    const onLayerPaste = vi.fn()
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      onLayerPaste,
      selectedLayerId: null,
    })

    await waitForQrPaneRender()

    const canvas = getRequiredElement(container, '[data-slot="desktop-compose-canvas"]')
    setElementRect(canvas, { height: 400, left: 0, top: 0, width: 400 })

    act(() => {
      canvas.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: 220,
          clientY: 240,
        }),
      )
    })

    const menu = document.body.querySelector('[data-slot="drafting-layer-context-menu"]') as HTMLElement

    expect(menu).not.toBeNull()
    expect(menu.querySelector('button[aria-label="Paste"]')).toBeNull()
    expect(onLayerPaste).not.toHaveBeenCalled()
  })

  it("marquee selects visible unlocked layers intersecting the drag box", async () => {
    const onLayerSelectionChange = vi.fn()
    const onLayerSelect = vi.fn()
    const layers: DraftingCanvasLayer[] = [
      createLayer({
        height: 80,
        id: "preview:card",
        kind: "card",
        width: 80,
        x: -100,
        y: -100,
        zIndex: 0,
      }),
      createLayer({
        height: 80,
        id: "preview:qr",
        isLocked: true,
        kind: "qr",
        width: 80,
        x: 40,
        y: 40,
        zIndex: 1,
      }),
    ]
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers,
      onLayerSelect,
      onLayerSelectionChange,
      selectedLayerId: null,
    })

    await waitForQrPaneRender()

    const canvas = getRequiredElement(container, '[data-slot="desktop-compose-canvas"]')
    setElementRect(canvas, { height: 400, left: 0, top: 0, width: 400 })

    act(() => {
      canvas.dispatchEvent(createPointerEvent("pointerdown", 90, 90))
      canvas.dispatchEvent(createPointerEvent("pointermove", 190, 190))
      canvas.dispatchEvent(createPointerEvent("pointerup", 190, 190))
      canvas.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }))
    })

    expect(onLayerSelectionChange).toHaveBeenCalledWith(["preview:card"], { additive: false })
    expect(onLayerSelect).not.toHaveBeenCalledWith(null)
  })

  it("updates layer rotation when dragging the rotation handle", async () => {
    const onLayerChange = vi.fn()
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      onLayerChange,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const frame = container.querySelector('[data-slot="drafting-layer-resize-frame"]') as HTMLElement
    const rotateHandle = container.querySelector(
      '[data-slot="drafting-layer-rotate-handle"]',
    ) as HTMLButtonElement

    expect(frame).not.toBeNull()
    expect(rotateHandle).not.toBeNull()

    frame.getBoundingClientRect = () => ({
      bottom: 352,
      height: 264,
      left: 88,
      right: 352,
      top: 88,
      width: 264,
      x: 88,
      y: 88,
      toJSON: () => ({}),
    })

    act(() => {
      rotateHandle.dispatchEvent(createPointerEvent("pointerdown", 220, 100))
    })

    const rotationValue = container.querySelector(
      '[data-slot="drafting-layer-rotation-value"]',
    ) as HTMLElement

    expect(rotationValue).not.toBeNull()
    expect(rotationValue.style.transform).toBe(
      "translate(-50%, calc(-34px - 6px - 8px - 100%))",
    )
    expect(rotationValue.textContent).toBe("0°")

    act(() => {
      rotateHandle.dispatchEvent(createPointerEvent("pointermove", 340, 220))
    })

    expect(onLayerChange).toHaveBeenLastCalledWith("preview:qr", { rotation: 90 })
    expect(rotationValue.textContent).toBe("90°")
  })

  it("soft-snaps rotation near cardinal angles", async () => {
    const onLayerChange = vi.fn()
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      onLayerChange,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const frame = container.querySelector('[data-slot="drafting-layer-resize-frame"]') as HTMLElement
    const rotateHandle = container.querySelector(
      '[data-slot="drafting-layer-rotate-handle"]',
    ) as HTMLButtonElement

    frame.getBoundingClientRect = () => ({
      bottom: 352,
      height: 264,
      left: 88,
      right: 352,
      top: 88,
      width: 264,
      x: 88,
      y: 88,
      toJSON: () => ({}),
    })

    act(() => {
      rotateHandle.dispatchEvent(createPointerEvent("pointerdown", 220, 100))
      rotateHandle.dispatchEvent(createPointerEvent("pointermove", 339, 226))
    })

    expect(onLayerChange).toHaveBeenLastCalledWith("preview:qr", { rotation: 90 })
  })

  it("keeps rotation freeform outside the soft snap threshold", async () => {
    const onLayerChange = vi.fn()
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      onLayerChange,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const frame = container.querySelector('[data-slot="drafting-layer-resize-frame"]') as HTMLElement
    const rotateHandle = container.querySelector(
      '[data-slot="drafting-layer-rotate-handle"]',
    ) as HTMLButtonElement

    frame.getBoundingClientRect = () => ({
      bottom: 352,
      height: 264,
      left: 88,
      right: 352,
      top: 88,
      width: 264,
      x: 88,
      y: 88,
      toJSON: () => ({}),
    })

    act(() => {
      rotateHandle.dispatchEvent(createPointerEvent("pointerdown", 220, 100))
      rotateHandle.dispatchEvent(createPointerEvent("pointermove", 340, 231))
    })

    expect(onLayerChange.mock.calls.at(-1)?.[0]).toBe("preview:qr")
    expect(onLayerChange.mock.calls.at(-1)?.[1].rotation).toBeGreaterThan(94)
    expect(onLayerChange.mock.calls.at(-1)?.[1].rotation).toBeLessThan(96)
  })

  it("keeps the rotation value visible for two seconds after rotation ends", async () => {
    const onLayerChange = vi.fn()
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      onLayerChange,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    vi.useFakeTimers()

    const frame = container.querySelector('[data-slot="drafting-layer-resize-frame"]') as HTMLElement
    const rotateHandle = container.querySelector(
      '[data-slot="drafting-layer-rotate-handle"]',
    ) as HTMLButtonElement

    frame.getBoundingClientRect = () => ({
      bottom: 352,
      height: 264,
      left: 88,
      right: 352,
      top: 88,
      width: 264,
      x: 88,
      y: 88,
      toJSON: () => ({}),
    })

    act(() => {
      rotateHandle.dispatchEvent(createPointerEvent("pointerdown", 220, 100))
      rotateHandle.dispatchEvent(createPointerEvent("pointermove", 340, 220))
      rotateHandle.dispatchEvent(createPointerEvent("pointerup", 340, 220))
    })

    expect(container.querySelector('[data-slot="drafting-layer-rotation-value"]')?.textContent).toBe(
      "90°",
    )

    act(() => {
      vi.advanceTimersByTime(1999)
    })

    expect(container.querySelector('[data-slot="drafting-layer-rotation-value"]')?.textContent).toBe(
      "90°",
    )

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(container.querySelector('[data-slot="drafting-layer-rotation-value"]')).toBeNull()
  })

  it("wraps the rotation value label from 359 degrees back to zero", async () => {
    const state = createDefaultQrStudioState()
    const cardState = createDefaultDraftingCardState()
    const layers = createDefaultDraftingLayers("preview", state, cardState).map((layer) =>
      layer.id === "preview:qr" ? { ...layer, rotation: 359.6 } : layer,
    )
    const { container } = renderPane(state, true, cardState, {
      layers,
      onLayerChange: () => undefined,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const frame = container.querySelector('[data-slot="drafting-layer-resize-frame"]') as HTMLElement
    const rotateHandle = container.querySelector(
      '[data-slot="drafting-layer-rotate-handle"]',
    ) as HTMLButtonElement

    frame.getBoundingClientRect = () => ({
      bottom: 352,
      height: 264,
      left: 88,
      right: 352,
      top: 88,
      width: 264,
      x: 88,
      y: 88,
      toJSON: () => ({}),
    })

    act(() => {
      rotateHandle.dispatchEvent(createPointerEvent("pointerdown", 220, 100))
    })

    expect(container.querySelector('[data-slot="drafting-layer-rotation-value"]')?.textContent).toBe(
      "0°",
    )
  })

  it("clears layer selection when clicking empty preview canvas space", async () => {
    const onLayerSelect = vi.fn()
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      onLayerChange: () => undefined,
      onLayerSelect,
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const canvas = container.querySelector('[data-slot="desktop-compose-canvas"]')

    expect(canvas).not.toBeNull()

    act(() => {
      canvas?.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    })

    expect(onLayerSelect).toHaveBeenCalledWith(null)
  })

  it("applies qr layer shadow to foreground qr shapes instead of the background rect", async () => {
    buildDashboardQrNodePayloadSpy.mockImplementationOnce(async () => ({
      markup:
        '<svg width="240" height="240" viewBox="0 0 240 240"><defs><clipPath id="clip-path-background-color-0"><rect x="0" y="0" width="240" height="240"/></clipPath><clipPath id="clip-path-dot-color-0"><path d="M0 0h10v10z"/></clipPath></defs><rect x="0" y="0" width="240" height="240" clip-path="url(\'#clip-path-background-color-0\')" fill="#f8fafc"/><rect x="20" y="20" width="200" height="200" clip-path="url(\'#clip-path-dot-color-0\')" fill="#111827"/></svg>',
      naturalHeight: 240,
      naturalWidth: 240,
    }))
    const qrLayer = {
      blur: 0,
      height: 240,
      id: "preview:qr",
      isLocked: false,
      isVisible: true,
      kind: "qr",
      name: "QR code",
      nodeId: "preview",
      opacity: 1,
      rotation: 0,
      tiltX: 0,
      tiltY: 0,
      shadow: {
        blur: 18,
        color: "#020617",
        offsetX: 6,
        offsetY: 8,
        opacity: 60,
      },
      width: 240,
      x: -120,
      y: -120,
      zIndex: 1,
    } satisfies DraftingCanvasLayer
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers: [qrLayer],
      selectedLayerId: "preview:qr",
    })

    await waitForQrPaneRender()

    const qrComponent = container.querySelector('[data-slot="drafting-qr-component"]') as HTMLElement

    expect(qrComponent).not.toBeNull()
    expect(qrComponent?.querySelector("svg")).not.toBeNull()
    expect(container.querySelector('[data-slot="new-qr-code"]')).toBeNull()
  })

  it("keeps the qr canvas unshadowed when not selected", async () => {
    const { container } = renderPane(createDefaultQrStudioState(), false)

    await waitForQrPaneRender()

    const node = container.querySelector('[data-slot="desktop-compose-node"]')

    expect(node).not.toBeNull()
    expect(node?.className).not.toContain("shadow-[0_10px_24px_-12px_rgba(15,23,42,0.26)]")
  })

  it("does not select the card canvas when clicked", async () => {
    const onLayerSelect = vi.fn()
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      onLayerSelect,
    })

    await waitForQrPaneRender()

    const card = container.querySelector('[data-slot="desktop-compose-card"]') as HTMLElement

    act(() => {
      card.dispatchEvent(new MouseEvent("click", { bubbles: true, metaKey: true }))
    })

    expect(onLayerSelect).not.toHaveBeenCalledWith("preview:card")
  })

  it("renders padded resize and rotate controls around multiple selected layers", async () => {
    const selectedLayerIds = [getDraftingQrLayerId("preview")]
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      selectedLayerIds,
    })

    await waitForQrPaneRender()

    expect(container.querySelectorAll('[data-layer-id][data-selected="true"]')).toHaveLength(1)
    expect(container.querySelector('[data-slot="drafting-layer-resize-frame"]')).not.toBeNull()
    expect(container.querySelector('[data-slot="drafting-layer-multi-select-frame"]')).toBeNull()
  })

  it("resizes every selected layer from the combined resize handles", async () => {
    const onLayerChange = vi.fn()
    const layers: DraftingCanvasLayer[] = [
      createLayer({ height: 300, id: "preview:card", kind: "card", width: 300, x: -150, y: -150, zIndex: 0 }),
      createLayer({ height: 100, id: "preview:qr", kind: "qr", width: 100, x: 50, y: -50, zIndex: 1 }),
      createLayer({ height: 40, id: "preview:text", kind: "text", width: 120, x: -60, y: 20, zIndex: 2 }),
    ]
    const { container } = renderPane(createDefaultQrStudioState(), true, TEST_CANVAS_CARD_STATE, {
      layers,
      onLayerChange,
      selectedLayerIds: ["preview:qr", "preview:text"],
    })

    await waitForQrPaneRender()

    const handle = container.querySelector(
      '[data-slot="drafting-layer-resize-edge"][data-resize-direction="e"]',
    ) as HTMLButtonElement

    act(() => {
      handle.dispatchEvent(createPointerEvent("pointerdown", 100, 100))
      handle.dispatchEvent(createPointerEvent("pointermove", 150, 100))
    })

    expect(onLayerChange).toHaveBeenCalledWith(
      "preview:qr",
      expect.objectContaining({
        height: 100,
        y: -50,
      }),
    )
    expect(onLayerChange).toHaveBeenCalledWith(
      "preview:text",
      expect.objectContaining({
        height: 40,
        y: 20,
      }),
    )
  })

  it("rotates every selected layer around the combined selector center", async () => {
    const onLayerChange = vi.fn()
    const layers: DraftingCanvasLayer[] = [
      createLayer({ height: 300, id: "preview:card", kind: "card", width: 300, x: -150, y: -150, zIndex: 0 }),
      createLayer({ height: 100, id: "preview:qr", kind: "qr", width: 100, x: 50, y: -50, zIndex: 1 }),
      createLayer({ height: 40, id: "preview:text", kind: "text", width: 120, x: -60, y: 20, zIndex: 2 }),
    ]
    const { container } = renderPane(createDefaultQrStudioState(), true, TEST_CANVAS_CARD_STATE, {
      layers,
      onLayerChange,
      selectedLayerIds: ["preview:qr", "preview:text"],
    })

    await waitForQrPaneRender()

    const frame = container.querySelector(
      '[data-slot="drafting-layer-multi-select-frame"]',
    ) as HTMLElement
    const rotateHandle = container.querySelector(
      '[data-slot="drafting-layer-rotate-handle"]',
    ) as HTMLButtonElement

    frame.getBoundingClientRect = () => ({
      bottom: 162,
      height: 124,
      left: 88,
      right: 362,
      top: 38,
      width: 274,
      x: 88,
      y: 38,
      toJSON: () => ({}),
    })

    act(() => {
      rotateHandle.dispatchEvent(createPointerEvent("pointerdown", 225, 50))
      rotateHandle.dispatchEvent(createPointerEvent("pointermove", 337, 100))
    })

    expect(onLayerChange).toHaveBeenCalledWith("preview:qr", {
      rotation: 90,
      x: 0,
      y: 10,
    })
    expect(onLayerChange).toHaveBeenCalledWith("preview:text", {
      rotation: 90,
      x: -50,
      y: -60,
    })
  })

  it("rotates the combined selector while a multi-layer rotation is active", async () => {
    const onLayerChange = vi.fn()
    const layers: DraftingCanvasLayer[] = [
      createLayer({ height: 100, id: "preview:card", kind: "card", width: 100, x: -100, y: -50, zIndex: 0 }),
      createLayer({ height: 100, id: "preview:qr", kind: "qr", width: 100, x: 50, y: -50, zIndex: 1 }),
    ]
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers,
      onLayerChange,
      selectedLayerIds: ["preview:card", "preview:qr"],
    })

    await waitForQrPaneRender()

    const frame = container.querySelector(
      '[data-slot="drafting-layer-multi-select-frame"]',
    ) as HTMLElement
    const rotateHandle = container.querySelector(
      '[data-slot="drafting-layer-rotate-handle"]',
    ) as HTMLButtonElement

    frame.getBoundingClientRect = () => ({
      bottom: 162,
      height: 124,
      left: 88,
      right: 362,
      top: 38,
      width: 274,
      x: 88,
      y: 38,
      toJSON: () => ({}),
    })

    act(() => {
      rotateHandle.dispatchEvent(createPointerEvent("pointerdown", 225, 50))
      rotateHandle.dispatchEvent(createPointerEvent("pointermove", 337, 100))
    })

    expect(frame.style.transform).toBe("translate3d(-112px, -62px, 0) rotate(90deg)")
    expect(container.querySelector('[data-slot="drafting-layer-rotation-value"]')?.textContent).toBe(
      "90°",
    )
  })

  it("keeps the combined selector size fixed during multi-layer rotation", async () => {
    const onLayerChange = vi.fn()
    const layers: DraftingCanvasLayer[] = [
      createLayer({ height: 100, id: "preview:card", kind: "card", width: 100, x: -100, y: -50, zIndex: 0 }),
      createLayer({ height: 100, id: "preview:qr", kind: "qr", width: 100, x: 50, y: -50, zIndex: 1 }),
    ]
    const { container, reactRoot } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers,
      onLayerChange,
      selectedLayerIds: ["preview:card", "preview:qr"],
    })

    await waitForQrPaneRender()

    const frame = container.querySelector(
      '[data-slot="drafting-layer-multi-select-frame"]',
    ) as HTMLElement
    const rotateHandle = container.querySelector(
      '[data-slot="drafting-layer-rotate-handle"]',
    ) as HTMLButtonElement

    frame.getBoundingClientRect = () => ({
      bottom: 162,
      height: 124,
      left: 88,
      right: 362,
      top: 38,
      width: 274,
      x: 88,
      y: 38,
      toJSON: () => ({}),
    })

    act(() => {
      rotateHandle.dispatchEvent(createPointerEvent("pointerdown", 225, 50))
      rotateHandle.dispatchEvent(createPointerEvent("pointermove", 337, 100))
    })

    act(() => {
      reactRoot.render(
        <Pane
          cardState={createDefaultDraftingCardState()}
          layers={[
            createLayer({ height: 100, id: "preview:card", kind: "card", rotation: 90, width: 100, x: -25, y: -125, zIndex: 0 }),
            createLayer({ height: 100, id: "preview:qr", kind: "qr", rotation: 90, width: 100, x: -25, y: 25, zIndex: 1 }),
          ]}
          qrStateByLayerId={createTestQrStateByLayerId(createDefaultQrStudioState(), [
            createLayer({ height: 100, id: "preview:card", kind: "card", rotation: 90, width: 100, x: -25, y: -125, zIndex: 0 }),
            createLayer({ height: 100, id: "preview:qr", kind: "qr", rotation: 90, width: 100, x: -25, y: 25, zIndex: 1 }),
          ])}
          state={createDefaultQrStudioState()}
          isSelected={true}
          onLayerChange={onLayerChange}
          onQrClick={() => undefined}
          onSelect={() => undefined}
          selectedLayerIds={["preview:card", "preview:qr"]}
        />,
      )
    })

    const activeFrame = container.querySelector(
      '[data-slot="drafting-layer-multi-select-frame"]',
    ) as HTMLElement

    expect(activeFrame.style.width).toBe("274px")
    expect(activeFrame.style.height).toBe("124px")
    expect(activeFrame.style.transform).toBe("translate3d(-112px, -62px, 0) rotate(90deg)")
  })

  it("matches the combined selector to already rotated selected layers", async () => {
    const layers: DraftingCanvasLayer[] = [
      createLayer({ height: 100, id: "preview:card", kind: "card", rotation: 90, width: 100, x: -25, y: -125, zIndex: 0 }),
      createLayer({ height: 100, id: "preview:qr", kind: "qr", rotation: 90, width: 100, x: -25, y: 25, zIndex: 1 }),
    ]
    const { container } = renderPane(createDefaultQrStudioState(), true, createDefaultDraftingCardState(), {
      layers,
      selectedLayerIds: ["preview:card", "preview:qr"],
    })

    await waitForQrPaneRender()

    const activeFrame = container.querySelector(
      '[data-slot="drafting-layer-multi-select-frame"]',
    ) as HTMLElement

    expect(activeFrame.style.width).toBe("274px")
    expect(activeFrame.style.height).toBe("124px")
    expect(activeFrame.style.transform).toBe("translate3d(-112px, -62px, 0) rotate(90deg)")
  })

  it("moves every selected layer without collapsing the combined selector", async () => {
    const onLayerChange = vi.fn()
    const onLayerSelect = vi.fn()
    const layers: DraftingCanvasLayer[] = [
      createLayer({ height: 300, id: "preview:card", kind: "card", width: 300, x: -150, y: -150, zIndex: 0 }),
      createLayer({ height: 100, id: "preview:qr", kind: "qr", width: 100, x: 50, y: -50, zIndex: 1 }),
      createLayer({ height: 40, id: "preview:text", kind: "text", width: 120, x: -60, y: 20, zIndex: 2 }),
    ]
    const { container } = renderPane(createDefaultQrStudioState(), true, TEST_CANVAS_CARD_STATE, {
      layers,
      onLayerChange,
      onLayerSelect,
      selectedLayerIds: ["preview:qr", "preview:text"],
    })

    await waitForQrPaneRender()

    const qrLayer = container.querySelector('[data-layer-id="preview:qr"]') as HTMLElement

    act(() => {
      qrLayer.dispatchEvent(createPointerEvent("pointerdown", 0, 0))
      qrLayer.dispatchEvent(createPointerEvent("pointermove", 20, 30))
      qrLayer.dispatchEvent(createPointerEvent("pointerup", 20, 30))
      qrLayer.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }))
    })

    expect(onLayerSelect).not.toHaveBeenCalledWith("preview:qr")
    expect(onLayerChange).toHaveBeenCalledWith("preview:qr", {
      x: 50,
      y: -20,
    })
    expect(onLayerChange).toHaveBeenCalledWith("preview:text", {
      x: -40,
      y: 50,
    })
    expect(container.querySelector('[data-slot="drafting-layer-multi-select-frame"]')).not.toBeNull()
  })

  it("keeps building canvas markup and mounts dot matrix preview when motion is enabled", async () => {
    const baseState = setSquareQrSize(createDefaultQrStudioState(), 240)
    const canvasMarkup = renderDashboardQrSvgMarkup(createDraftingQrArtworkState(baseState))

    buildDashboardQrNodePayloadSpy.mockResolvedValue({
      markup: canvasMarkup,
      naturalHeight: baseState.height,
      naturalWidth: baseState.width,
    })

    const motionState = setDotMatrixAnimationOptions(baseState, {
      enabled: true,
      animated: true,
    })

    const { container, reactRoot } = renderPane(motionState)

    await waitForQrPaneRender()

    expect(buildDashboardQrNodePayloadSpy).toHaveBeenCalledTimes(1)

    const animatedPreview = container.querySelector('[data-testid="dot-matrix-animated-qr"]')

    expect(animatedPreview).not.toBeNull()
    expect(animatedPreview?.getAttribute("data-canvas-markup")).toContain("<svg")

    await act(async () => {
      reactRoot.render(
        <Pane
          state={setDotMatrixAnimationOptions(motionState, { loader: "corner-pop" })}
          cardState={createDefaultDraftingCardState()}
          qrStateByLayerId={createDefaultPaneQrStateByLayerId(
            setDotMatrixAnimationOptions(motionState, { loader: "corner-pop" }),
          )}
          isSelected={false}
          onQrClick={() => undefined}
          onSelect={() => undefined}
        />,
      )
      await flushPromises()
      await flushPromises()
    })

    expect(buildDashboardQrNodePayloadSpy).toHaveBeenCalledTimes(2)
  })
})

function renderPane(
  state = createDefaultQrStudioState(),
  isSelected = false,
  cardState = createDefaultDraftingCardState(),
  props: {
    layers?: DraftingCanvasLayer[]
    onLayerChange?: (layerId: string, patch: Partial<DraftingCanvasLayer>) => void
    onLayerAction?: (layerIds: string[], action: string) => void
    onLayerCopy?: (layerIds: string[]) => void
    onLayerPaste?: (point: { x: number; y: number }) => void
    onLayerSelect?: (layerId: string | null, options?: { additive?: boolean }) => void
    onLayerSelectionChange?: (layerIds: string[], options?: { additive?: boolean }) => void
    qrStateByLayerId?: DraftingQrStateByLayerId
    selectedLayerId?: string | null
    selectedLayerIds?: string[]
    snapEnabled?: boolean
    sceneComposition?: import("@/features/workspace/model/scene-templates").SceneCompositionState
  } = {},
) {
  const container = document.createElement("div")
  const reactRoot = createRoot(container)
  const layers = props.layers ?? createDefaultDraftingLayers("preview", state, cardState)
  const qrStateByLayerId = props.qrStateByLayerId ?? createTestQrStateByLayerId(state, layers)

  act(() => {
    reactRoot.render(
      <Pane
        cardState={cardState}
        layers={layers}
        qrStateByLayerId={qrStateByLayerId}
        state={state}
        isSelected={isSelected}
        onLayerChange={props.onLayerChange}
        onLayerAction={props.onLayerAction}
        onLayerCopy={props.onLayerCopy}
        onLayerPaste={props.onLayerPaste}
        onLayerSelect={props.onLayerSelect}
        onLayerSelectionChange={props.onLayerSelectionChange}
        onQrClick={() => undefined}
        onSelect={() => undefined}
        sceneComposition={props.sceneComposition}
        selectedLayerId={props.selectedLayerId}
        selectedLayerIds={props.selectedLayerIds}
        snapEnabled={props.snapEnabled}
      />,
    )
  })

  cleanupCallbacks.push(() => {
    act(() => {
      reactRoot.unmount()
    })
  })

  document.body.appendChild(container)

  return { container, reactRoot }
}

function createDefaultPaneQrStateByLayerId(state: QrStudioState) {
  return createTestQrStateByLayerId(
    state,
    createDefaultDraftingLayers("preview", state, createDefaultDraftingCardState()),
  )
}

function createTestQrStateByLayerId(
  state: QrStudioState,
  layers: DraftingCanvasLayer[],
): DraftingQrStateByLayerId {
  const qrStateByLayerId: DraftingQrStateByLayerId = {}

  for (const layer of layers) {
    if (layer.kind === "qr") {
      qrStateByLayerId[layer.id] = structuredClone(state)
    }
  }

  return qrStateByLayerId
}

function flushPromises() {
  return Promise.resolve()
}

async function waitForQrPaneRender() {
  await act(async () => {
    await flushPromises()
    await flushPromises()
  })
}

function getRequiredElement(parent: ParentNode, selector: string) {
  const element = parent.querySelector(selector)

  expect(element).not.toBeNull()

  return element as HTMLElement
}

function clickElement(element: Element) {
  element.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 }))
}

function createPointerEvent(type: string, clientX: number, clientY: number) {
  const PointerEventConstructor = window.PointerEvent ?? window.MouseEvent

  return new PointerEventConstructor(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY,
    pointerId: 1,
  } as PointerEventInit)
}

function setElementRect(
  element: Element,
  rect: { height: number; left: number; top: number; width: number },
) {
  const fullRect = {
    ...rect,
    bottom: rect.top + rect.height,
    right: rect.left + rect.width,
    x: rect.left,
    y: rect.top,
    toJSON: () => ({}),
  } as DOMRect

  vi.spyOn(element, "getBoundingClientRect").mockReturnValue(fullRect)
}

function createLayer(
  overrides: Partial<DraftingCanvasLayer> & Pick<DraftingCanvasLayer, "id" | "kind">,
): DraftingCanvasLayer {
  const { id, kind, ...rest } = overrides

  return {
    blur: 0,
    height: 100,
    id,
    isLocked: false,
    isVisible: true,
    kind,
    name: kind === "card" ? "Card" : "QR code",
    nodeId: "preview",
    opacity: 1,
    rotation: 0,
    tiltX: 0,
    tiltY: 0,
    shadow: {
      blur: 0,
      color: "#111827",
      offsetX: 0,
      offsetY: 0,
      opacity: 0,
    },
    width: 100,
    x: 0,
    y: 0,
    zIndex: 0,
    ...rest,
  }
}
