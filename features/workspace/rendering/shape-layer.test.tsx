// @vitest-environment jsdom

import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it } from "vitest"

import { createDraftingShapeLayer, patchDraftingCanvasLayer } from "@/features/workspace/model/layers"
import { patchShapeLayerFillFromPicker } from "@/features/workspace/rendering/shape-fill"
import { DraftingShapeLayerContent } from "@/features/workspace/rendering/shape-layer"
import { formatFill } from "@/components/ui/fill-picker-base/public-api"

describe("DraftingShapeLayerContent", () => {
  it("renders decorative shapes from shapeId without a solid square backdrop", () => {
    const layer = createDraftingShapeLayer("preview", "flower")
    const markup = renderToStaticMarkup(<DraftingShapeLayerContent layer={layer} />)

    expect(layer.shapeId).toBe("flower")
    expect(markup).toContain('viewBox="0 0 320 280"')
    expect(markup).toContain('fill="#E8E8E8"')
    expect(markup).toContain('style="background-color:transparent"')
  })

  it("preserves shapeId through insert normalization", () => {
    const inserted = patchDraftingCanvasLayer(
      {
        ...createDraftingShapeLayer("preview", "hexagon"),
        id: "preview:shape:123",
        zIndex: 4,
      },
      {},
    )

    expect(inserted.shapeId).toBe("hexagon")
  })

  it("creates visible stroke primitives for line and arrow", () => {
    const line = createDraftingShapeLayer("preview", "line")
    const arrow = createDraftingShapeLayer("preview", "arrow")

    expect(line).toMatchObject({
      fillMode: "none",
      shapeId: "line",
      strokeWidth: 4,
    })
    expect(arrow).toMatchObject({
      fillMode: "none",
      shapeId: "arrow",
      strokeWidth: 4,
    })
  })

  it("renders svg gradient defs for gradient shape fills", () => {
    const layer = createDraftingShapeLayer("preview", "flower")
    const gradientCss = formatFill({
      kind: "gradient",
      gradient: {
        type: "linear",
        angle: 90,
        interp: "oklch",
        stops: [
          { color: { l: 0.2, c: 0.05, h: 260, alpha: 1 }, position: 0 },
          { color: { l: 0.85, c: 0.08, h: 40, alpha: 1 }, position: 1 },
        ],
      },
    })
    const gradientLayer = patchDraftingCanvasLayer(
      layer,
      patchShapeLayerFillFromPicker(
        layer,
        {
          kind: "gradient",
          gradient: {
            type: "linear",
            angle: 90,
            interp: "oklch",
            stops: [
              { color: { l: 0.2, c: 0.05, h: 260, alpha: 1 }, position: 0 },
              { color: { l: 0.85, c: 0.08, h: 40, alpha: 1 }, position: 1 },
            ],
          },
        },
        gradientCss,
      ),
    )
    const markup = renderToStaticMarkup(<DraftingShapeLayerContent layer={gradientLayer} />)

    expect(markup).toContain("linearGradient")
    expect(markup).toContain("-shape-fill-gradient)")
  })
})
