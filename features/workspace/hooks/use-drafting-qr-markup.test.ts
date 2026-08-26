/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createDefaultQrStudioState } from "@/features/qr-code/model/state"
import { buildDraftingQrStudioMarkup } from "@/features/qr-code/rendering/qr-studio-markup"
import { clearDraftingQrMarkupCache } from "@/features/workspace/hooks/use-drafting-qr-markup"
import { previewSession } from "@/features/workspace/preview/preview-session"

vi.mock("@/features/qr-code/rendering/qr-studio-markup", () => ({
  buildDraftingQrStudioMarkup: vi.fn(() => "<svg data-testid='qr-markup'></svg>"),
}))

describe("useDraftingQrMarkup interaction deferral", () => {
  beforeEach(() => {
    clearDraftingQrMarkupCache()
    previewSession.endInteraction()
    vi.mocked(buildDraftingQrStudioMarkup).mockClear()
  })

  afterEach(() => {
    previewSession.endInteraction()
  })

  it("defers uncached markup rebuilds while preview interaction is active", async () => {
    const { useDraftingQrMarkup } = await import("@/features/workspace/hooks/use-drafting-qr-markup")
    const React = await import("react")
    const { createRoot } = await import("react-dom/client")
    const { act } = await import("react")

    const container = document.createElement("div")
    const root = createRoot(container)

    let latestMarkup: string | null = null

    function TestHarness({ state }: { state: ReturnType<typeof createDefaultQrStudioState> }) {
      const result = useDraftingQrMarkup(state)
      latestMarkup = result.markup
      return null
    }

    const initialState = createDefaultQrStudioState()

    await act(async () => {
      root.render(React.createElement(TestHarness, { state: initialState }))
    })

    expect(vi.mocked(buildDraftingQrStudioMarkup)).toHaveBeenCalledTimes(1)
    expect(latestMarkup).toContain("qr-markup")

    previewSession.beginInteraction()

    const nextState = {
      ...initialState,
      backgroundOptions: {
        ...initialState.backgroundOptions,
        color: "#ff0000",
      },
    }

    await act(async () => {
      root.render(React.createElement(TestHarness, { state: nextState }))
    })

    expect(vi.mocked(buildDraftingQrStudioMarkup)).toHaveBeenCalledTimes(1)

    await act(async () => {
      previewSession.endInteraction()
    })

    expect(vi.mocked(buildDraftingQrStudioMarkup)).toHaveBeenCalledTimes(2)
    expect(latestMarkup).toContain("qr-markup")

    await act(async () => {
      root.unmount()
    })
  })
})
