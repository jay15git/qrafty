import { describe, expect, it } from "vitest"

import { getDesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import {
  getDesktopLayerToolbarCapabilities,
  getLayerPropertyTabLabel,
} from "@/features/desktop-shell/model/layer-toolbar-capabilities"
import {
  createDraftingShapeLayer,
  createDraftingTextLayer,
} from "@/features/workspace/model/layers"

describe("layer-toolbar-capabilities", () => {
  it("returns transform + design tabs for element layers", () => {
    const layer = createDraftingTextLayer("node", { text: "Hello" })

    expect(getDesktopLayerToolbarCapabilities(layer)).toEqual({
      maxEffects: 2,
      propertyTabs: ["transform", "design"],
      showStyleInDesign: true,
    })
    expect(getLayerPropertyTabLabel("design", layer)).toBe("Design")
  })

  it("limits card layers to one effect", () => {
    const layer = createDraftingTextLayer("node", { text: "Card", kind: "card" as "text" })

    expect(getDesktopLayerToolbarCapabilities({ ...layer, kind: "card" }).maxEffects).toBe(1)
    expect(getLayerPropertyTabLabel("design", { ...layer, kind: "card" })).toBe("Appearance")
  })

  it("labels qr design tab as effects", () => {
    const layer = createDraftingShapeLayer("node", "rect")
    expect(getLayerPropertyTabLabel("design", { ...layer, kind: "qr" })).toBe("Effects")
  })

  it("uses appearance support when layer kind is unknown", () => {
    const layer = createDraftingTextLayer("node", { text: "Hello" })
    const appearance = getDesktopAppearanceSnapshot(layer)

    expect(
      getDesktopLayerToolbarCapabilities({ ...layer, kind: "group" }, appearance).propertyTabs,
    ).toEqual(["transform"])
  })
})
