import { describe, expect, it } from "vitest"

import { formatFill } from "@/components/ui/fill-picker-base/public-api"
import { fillFromHex } from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import {
  createDraftingShapeLayer,
  patchDraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import {
  getShapeLayerFillCssValue,
  patchShapeLayerFillFromPicker,
} from "@/features/workspace/rendering/shape-fill"

describe("shape-fill", () => {
  it("stores shape gradients on fillGradient instead of fill css", () => {
    const layer = createDraftingShapeLayer("preview", "flower")
    const gradientCss = formatFill({
      kind: "gradient",
      gradient: {
        type: "linear",
        angle: 135,
        interp: "oklch",
        stops: [
          {
            color: { l: 0.2, c: 0.05, h: 260, alpha: 1 },
            position: 0,
          },
          {
            color: { l: 0.85, c: 0.08, h: 40, alpha: 1 },
            position: 1,
          },
        ],
      },
    })

    const patch = patchShapeLayerFillFromPicker(layer, { kind: "gradient", gradient: {
      type: "linear",
      angle: 135,
      interp: "oklch",
      stops: [
        { color: { l: 0.2, c: 0.05, h: 260, alpha: 1 }, position: 0 },
        { color: { l: 0.85, c: 0.08, h: 40, alpha: 1 }, position: 1 },
      ],
    } }, gradientCss)
    const nextLayer = patchDraftingCanvasLayer(layer, patch)

    expect(nextLayer.fillMode).toBe("gradient")
    expect(nextLayer.fillGradient?.enabled).toBe(true)
    expect(nextLayer.fill).toMatch(/^#[0-9a-f]{6}$/i)
    expect(getShapeLayerFillCssValue(nextLayer)).toContain("gradient")
  })

  it("keeps solid fills as hex", () => {
    const layer = createDraftingShapeLayer("preview", "rect")
    const solidCss = formatFill(fillFromHex("#ff3366"))
    const patch = patchShapeLayerFillFromPicker(
      layer,
      { kind: "color", color: { l: 0.6, c: 0.2, h: 10, alpha: 1 } },
      solidCss,
    )
    const nextLayer = patchDraftingCanvasLayer(layer, patch)

    expect(nextLayer.fillMode).toBe("solid")
    expect(nextLayer.fill).toBe("#FF3366")
  })
})
