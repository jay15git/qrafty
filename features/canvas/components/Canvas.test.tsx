// @vitest-environment jsdom

import { createRoot } from "react-dom/client";
import { act, type ComponentProps } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultCanvasCardState } from "@/features/canvas/model/card-state";
import { Canvas } from "@/features/canvas/components/Canvas";
import type { CanvasBoardPane } from "@/features/canvas/components/CanvasBoard";
import { createDefaultQraftyState } from "@/features/qr/model/state";

vi.mock("@/features/qr/rendering/qr-svg", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/features/qr/rendering/qr-svg")>();

  return {
    ...actual,
    buildDashboardQrNodePayload: vi.fn(() =>
      Promise.resolve({
        markup: "<svg />",
        naturalHeight: 240,
        naturalWidth: 240,
      }),
    ),
  };
});

const cleanupCallbacks: Array<() => void> = [];

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
  HTMLElement.prototype.setPointerCapture = vi.fn();
  stubPortraitOrientation(false);
});

afterEach(() => {
  while (cleanupCallbacks.length > 0) {
    cleanupCallbacks.pop()?.();
  }
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("Canvas", () => {
  it("renders a single canvas board", async () => {
    const workspace = renderWorkspace({ boardCount: 1 });

    await act(async () => {
      await flushPromises();
    });

    expect(getBoardCanvases(workspace.container)).toHaveLength(1);
    expect(workspace.container.querySelector('[data-slot="canvas-board-layout"]')).toBeNull();
  });

  it("uses a fixed white workspace canvas in free edit mode", async () => {
    const workspace = renderWorkspace({
      layerEditingEnabled: true,
      boardCount: 1,
    });
    const [board] = getBoardCanvases(workspace.container, 1);

    await act(async () => {
      await flushPromises();
    });

    expect(board.getAttribute("data-canvas-appearance")).toBe("workspace");
    expect(board.className).toContain("bg-[var(--canvas-bg,#f0f1f2)]");
    expect(board.querySelector('[data-slot="free-edit-artboard"]')).not.toBeNull();
    expect(workspace.container.querySelector('[data-slot="resize-toolbar"]')).toBeNull();
  });

  it("zooms the active preview with the mouse wheel", async () => {
    const workspace = renderWorkspace({ boardCount: 1, layerEditingEnabled: false });
    const [board] = getBoardCanvases(workspace.container, 1);
    const viewport = board.firstElementChild as HTMLElement;

    await act(async () => {
      board.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          deltaY: -100,
        }),
      );
      await flushPromises();
    });

    expect(viewport.style.transform).toMatch(/scale\(1\.1/);
  });

  it("zooms the active preview with a two finger pinch", async () => {
    const workspace = renderWorkspace({ boardCount: 1, layerEditingEnabled: false });
    const [board] = getBoardCanvases(workspace.container, 1);
    const viewport = board.firstElementChild as HTMLElement;

    await act(async () => {
      board.dispatchEvent(
        createTouchEvent("touchstart", [
          { clientX: 0, clientY: 0 },
          { clientX: 100, clientY: 0 },
        ]),
      );
      board.dispatchEvent(
        createTouchEvent("touchmove", [
          { clientX: 0, clientY: 0 },
          { clientX: 150, clientY: 0 },
        ]),
      );
      await flushPromises();
    });

    expect(viewport.style.transform).toContain("scale(1.5");
  });

  it("does not pan empty canvas space with a mouse drag", async () => {
    const workspace = renderWorkspace({ boardCount: 1, layerEditingEnabled: false });
    const [board] = getBoardCanvases(workspace.container, 1);
    const viewport = board.firstElementChild as HTMLElement;

    await act(async () => {
      board.dispatchEvent(createPointerEvent("pointerdown", 100, 120));
      board.dispatchEvent(createPointerEvent("pointermove", 140, 145));
      board.dispatchEvent(createPointerEvent("pointerup", 140, 145));
      await flushPromises();
    });

    expect(viewport.style.transform).toBe("translate3d(0px, 0px, 0) scale(1)");
  });

  it("does not zoom desktop compose content with wheel", async () => {
    const workspace = renderWorkspace({
      boardCount: 1,
    });
    const [board] = getBoardCanvases(workspace.container, 1);
    const contentZoom = board.querySelector('[data-slot="canvas-content-zoom"]') as HTMLElement;

    await act(async () => {
      await flushPromises();
    });

    const transformBefore = contentZoom?.style.transform ?? "";

    await act(async () => {
      board.dispatchEvent(
        new WheelEvent("wheel", {
          bubbles: true,
          cancelable: true,
          deltaY: -100,
        }),
      );
      await flushPromises();
    });

    expect(contentZoom?.style.transform ?? "").toBe(transformBefore);
    expect(board.className).toContain("touch-none");
  });

  it("pinch-zooms desktop compose content", async () => {
    const workspace = renderWorkspace({
      boardCount: 1,
    });
    const [board] = getBoardCanvases(workspace.container, 1);
    const contentZoom = board.querySelector('[data-slot="canvas-content-zoom"]') as HTMLElement;

    await act(async () => {
      board.dispatchEvent(
        createTouchEvent("touchstart", [
          { clientX: 0, clientY: 0 },
          { clientX: 100, clientY: 0 },
        ]),
      );
      board.dispatchEvent(
        createTouchEvent("touchmove", [
          { clientX: 0, clientY: 0 },
          { clientX: 150, clientY: 0 },
        ]),
      );
      await flushPromises();
    });

    expect(contentZoom?.style.transform).toContain("scale(1.5)");
  });

  it("pans empty canvas with a touch drag in desktop zoom mode", async () => {
    const workspace = renderWorkspace({
      boardCount: 1,
    });
    const [board] = getBoardCanvases(workspace.container, 1);
    const contentZoom = board.querySelector('[data-slot="canvas-content-zoom"]') as HTMLElement;

    await act(async () => {
      await flushPromises();
    });

    await act(async () => {
      board.dispatchEvent(createPointerEvent("pointerdown", 100, 120, "touch"));
      board.dispatchEvent(createPointerEvent("pointermove", 140, 145, "touch"));
      board.dispatchEvent(createPointerEvent("pointerup", 140, 145, "touch"));
      await flushPromises();
    });

    expect(contentZoom.style.transform).toBe("translate3d(40px, 25px, 0)");
  });

  it("pans only compose content in desktop zoom mode while the card stays fixed", async () => {
    const workspace = renderWorkspace({
      boardCount: 1,
    });
    const [board] = getBoardCanvases(workspace.container, 1);
    const artboard = board.querySelector('[data-slot="free-edit-artboard"]') as HTMLElement;
    const contentZoom = board.querySelector('[data-slot="canvas-content-zoom"]') as HTMLElement;

    await act(async () => {
      await flushPromises();
    });

    await act(async () => {
      board.dispatchEvent(createPointerEvent("pointerdown", 100, 120, "touch"));
      board.dispatchEvent(createPointerEvent("pointermove", 140, 145, "touch"));
      board.dispatchEvent(createPointerEvent("pointerup", 140, 145, "touch"));
      await flushPromises();
    });

    expect(artboard.style.transform).toBe("");
    expect(contentZoom.style.transform).toBe("translate3d(40px, 25px, 0)");
  });

  it("clears selected layer when pressing empty canvas space", async () => {
    const onLayerSelect = vi.fn();
    const workspace = renderWorkspace({ onLayerSelect, boardCount: 1 });
    const [board] = getBoardCanvases(workspace.container, 1);

    await act(async () => {
      board.dispatchEvent(createPointerEvent("pointerdown", 100, 120));
      await flushPromises();
    });

    expect(onLayerSelect).toHaveBeenCalledWith(null);
  });

  it("does not pan when dragging a layer", async () => {
    const workspace = renderWorkspace({ boardCount: 1, layerEditingEnabled: false });
    const [board] = getBoardCanvases(workspace.container, 1);
    const viewport = board.firstElementChild as HTMLElement;
    const layer = getQrNodes(workspace.container)[0];

    await act(async () => {
      layer?.dispatchEvent(createPointerEvent("pointerdown", 100, 120));
      board.dispatchEvent(createPointerEvent("pointermove", 140, 145));
      board.dispatchEvent(createPointerEvent("pointerup", 140, 145));
      await flushPromises();
    });

    expect(viewport.style.transform).toBe("translate3d(0px, 0px, 0) scale(1)");
  });

  it("reflects workspace canvas appearance on the board canvas", async () => {
    const workspace = renderWorkspace();
    const board = getBoardCanvases(workspace.container, 1)[0];

    await act(async () => {
      await flushPromises();
    });

    expect(board?.getAttribute("data-canvas-appearance")).toBe("workspace");
    expect(board?.style.backgroundImage).toBe("none");
  });

  it("keeps the canvas grid toggle out of the non-desktop toolbar", () => {
    const workspace = renderWorkspace();

    expect(workspace.container.querySelector('button[aria-label="Hide canvas grid"]')).toBeNull();
    expect(workspace.container.querySelector('button[aria-label="Show canvas grid"]')).toBeNull();
  });
});

function renderWorkspace({
  onLayerSelect,
  boardCount = 2,
  boards = createBoards(boardCount),
  selectedLayerId,
  selectedLayerIds,
  layerEditingEnabled,
}: {
  onLayerSelect?: (layerId: string | null) => void;
  boardCount?: number;
  boards?: CanvasBoardPane[];
  selectedLayerId?: ComponentProps<typeof Canvas>["selectedLayerId"];
  selectedLayerIds?: ComponentProps<typeof Canvas>["selectedLayerIds"];
  layerEditingEnabled?: ComponentProps<typeof Canvas>["layerEditingEnabled"];
} = {}) {
  const container = document.createElement("div");
  const root = createRoot(container);

  function render(nextBoards = boards) {
    root.render(
      <Canvas
        activeBoardId="board-1"
        onBoardSelect={() => undefined}
        onLayerSelect={onLayerSelect}
        boards={nextBoards}
        selectedLayerId={selectedLayerId}
        selectedLayerIds={selectedLayerIds}
        layerEditingEnabled={layerEditingEnabled}
      />,
    );
  }

  act(() => {
    render();
  });

  cleanupCallbacks.push(() => {
    act(() => {
      root.unmount();
    });
  });

  document.body.appendChild(container);

  return { container, render };
}

function createBoards(_paneCount = 1) {
  const state = {
    ...createDefaultQraftyState(),
    data: "https://1.example",
  };

  return [
    {
      cardState: createDefaultCanvasCardState(),
      id: "board-1",
      name: "QR Code",
      qrStateByLayerId: {
        "board-1:qr": state,
      },
      state,
    },
  ];
}

function getQrNodes(parent: ParentNode) {
  return Array.from(parent.querySelectorAll('[data-slot="canvas-node"]')) as HTMLElement[];
}

function getBoardCanvases(parent: ParentNode, expectedCount = 1) {
  const boards = Array.from(
    parent.querySelectorAll('[data-slot="canvas-surface"]'),
  ) as HTMLElement[];

  expect(boards).toHaveLength(expectedCount);

  return boards;
}

function stubPortraitOrientation(matches: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn(() => ({
      addEventListener: vi.fn(),
      matches,
      removeEventListener: vi.fn(),
    })),
  });
}

function createTouchEvent(type: string, touches: Array<{ clientX: number; clientY: number }>) {
  const event = new Event(type, {
    bubbles: true,
    cancelable: true,
  });
  const touchList = {
    item: (index: number) => touches[index] ?? null,
    length: touches.length,
  };

  Object.defineProperty(event, "touches", {
    value: touchList,
  });

  return event;
}

function createPointerEvent(
  type: string,
  clientX: number,
  clientY: number,
  pointerType: "mouse" | "touch" | "pen" = "mouse",
) {
  const PointerEventConstructor = window.PointerEvent ?? window.MouseEvent;

  return new PointerEventConstructor(type, {
    bubbles: true,
    button: 0,
    cancelable: true,
    clientX,
    clientY,
    pointerId: 1,
    pointerType,
  } as PointerEventInit);
}

async function flushPromises() {
  await Promise.resolve();
}
