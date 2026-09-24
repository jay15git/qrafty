/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createDefaultQraftyState } from "@/features/qr/model/state";
import { buildCanvasQraftyMarkup } from "@/features/qr/rendering/qrafty-markup";
import { clearCanvasQrMarkupCache } from "@/features/canvas/hooks/use-canvas-qr-markup";
import { previewSession } from "@/features/canvas/preview/preview-session";

vi.mock("@/features/qr/rendering/qrafty-markup", () => ({
  buildCanvasQraftyMarkup: vi.fn(() => "<svg data-testid='qr-markup'></svg>"),
}));

describe("useCanvasQrMarkup interaction deferral", () => {
  beforeEach(() => {
    clearCanvasQrMarkupCache();
    previewSession.endInteraction();
    vi.mocked(buildCanvasQraftyMarkup).mockClear();
  });

  afterEach(() => {
    previewSession.endInteraction();
  });

  it("defers uncached markup rebuilds while preview interaction is active", async () => {
    const { useCanvasQrMarkup } = await import("@/features/canvas/hooks/use-canvas-qr-markup");
    const React = await import("react");
    const { createRoot } = await import("react-dom/client");
    const { act } = await import("react");

    const container = document.createElement("div");
    const root = createRoot(container);

    const latestMarkupRef: { current: string | null } = { current: null };

    function TestHarness({ state }: { state: ReturnType<typeof createDefaultQraftyState> }) {
      const result = useCanvasQrMarkup(state);
      React.useEffect(() => {
        latestMarkupRef.current = result.markup;
      });
      return null;
    }

    const initialState = createDefaultQraftyState();

    await act(async () => {
      root.render(React.createElement(TestHarness, { state: initialState }));
    });

    expect(vi.mocked(buildCanvasQraftyMarkup)).toHaveBeenCalledTimes(1);
    expect(latestMarkupRef.current).toContain("qr-markup");

    previewSession.beginInteraction();

    const nextState = {
      ...initialState,
      backgroundOptions: {
        ...initialState.backgroundOptions,
        color: "#ff0000",
      },
    };

    await act(async () => {
      root.render(React.createElement(TestHarness, { state: nextState }));
    });

    expect(vi.mocked(buildCanvasQraftyMarkup)).toHaveBeenCalledTimes(1);

    await act(async () => {
      previewSession.endInteraction();
    });

    expect(vi.mocked(buildCanvasQraftyMarkup)).toHaveBeenCalledTimes(2);
    expect(latestMarkupRef.current).toContain("qr-markup");

    await act(async () => {
      root.unmount();
    });
  });
});
