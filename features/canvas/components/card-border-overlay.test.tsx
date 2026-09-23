import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import { createDefaultQraftyState } from "@/features/qr/model/state"
import { createDefaultDraftingCardState } from "@/features/canvas/model/card-state"
import { createDefaultDraftingLayers } from "@/features/canvas/model/layers/card-qr"
import { PaneDocumentCardLayer } from "@/features/canvas/components/PaneLayerViews"

describe("card border overlay", () => {
  it("renders an inner border overlay when the card has a border", () => {
    const qrState = createDefaultQraftyState()
    const cardState = {
      ...createDefaultDraftingCardState(),
      border: {
        color: "#ff0000",
        opacity: 100,
        sides: {
          bottom: { color: "#ff0000", opacity: 100, style: "solid" as const, width: 8 },
          left: { color: "#ff0000", opacity: 100, style: "solid" as const, width: 8 },
          right: { color: "#ff0000", opacity: 100, style: "solid" as const, width: 8 },
          top: { color: "#ff0000", opacity: 100, style: "solid" as const, width: 8 },
        },
        style: "solid" as const,
        width: 8,
      },
    }
    const [cardLayer] = createDefaultDraftingLayers("node-1", qrState, cardState)

    const html = renderToStaticMarkup(
      <PaneDocumentCardLayer
        cardState={cardState}
        isImageFilterMode={false}
        isImageMode={false}
        isPaperShaderMode={false}
        isLayerSelected={false}
        layer={cardLayer!}
      />,
    )

    expect(html).toContain('data-slot="desktop-compose-card-border"')
    expect(html).toContain("border:8px solid")
  })
})
