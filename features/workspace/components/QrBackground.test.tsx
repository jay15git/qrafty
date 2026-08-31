// @vitest-environment jsdom

import { act } from "react"
import { createRoot } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"

import { createDefaultQraftyState, setSquareQrSize } from "@/features/qr-code/model/state"
import { DraftingQrBackground } from "@/features/workspace/components/QrBackground"
import { createDefaultDraftingCardState } from "@/features/workspace/model/card-state"
import { createDefaultDraftingLayers } from "@/features/workspace/model/layers"

const cleanupCallbacks: Array<() => void> = []

afterEach(() => {
  for (const cleanup of cleanupCallbacks.splice(0)) {
    cleanup()
  }

  document.body.innerHTML = ""
})

describe("DraftingQrBackground", () => {
  it("renders the background card shape as a direct inline svg in preview", () => {
    const state = setSquareQrSize(createDefaultQraftyState(), 240)
    state.backgroundShapeId = "flower"
    const [layer] = createDefaultDraftingLayers(
      "preview",
      state,
      createDefaultDraftingCardState(),
    ).filter((entry) => entry.kind === "qr")
    const { container } = renderBackground(layer, state)

    const background = container.querySelector('[data-slot="drafting-qr-background"]')

    expect(background?.firstElementChild?.tagName.toLowerCase()).toBe("svg")
    expect(background?.querySelector(":scope > div")).toBeNull()
    expect(background?.querySelector("path")).not.toBeNull()
  })
})

function renderBackground(
  layer: Parameters<typeof DraftingQrBackground>[0]["layer"],
  state: Parameters<typeof DraftingQrBackground>[0]["state"],
) {
  const container = document.createElement("div")
  const root = createRoot(container)

  act(() => {
    root.render(<DraftingQrBackground layer={layer} state={state} />)
  })

  cleanupCallbacks.push(() => {
    act(() => {
      root.unmount()
    })
  })

  document.body.appendChild(container)

  return { container }
}
