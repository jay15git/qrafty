import { describe, expect, it } from "vitest"

import {
  buildAppearancePatch,
  getAppearanceSnapshot,
} from "@/features/shell/model/appearance"
import { DEFAULT_BACKGROUND_SHAPE_OPTIONS } from "@/features/qr/model/state"
import { DEFAULT_DRAFTING_CARD_STATE } from "@/features/canvas/model/card-state"
import {
  createDraftingShapeLayer,
  createDraftingTextLayer,
} from "@/features/canvas/model/layers/factories"

const NODE_ID = "node-1"

describe("desktop appearance model", () => {
  it("maps card corner radius into a shared appearance snapshot", () => {
    const layer = createDraftingShapeLayer(NODE_ID)
    const snapshot = getAppearanceSnapshot(
      { ...layer, kind: "card" },
      {
        cardCornerRadius: DEFAULT_DRAFTING_CARD_STATE.cornerRadius,
      },
    )

    expect(snapshot.cornerRadius).toBe(DEFAULT_DRAFTING_CARD_STATE.cornerRadius)
    expect(snapshot.supportsCornerRadius).toBe(true)
    expect(snapshot.border.width).toBe(DEFAULT_DRAFTING_CARD_STATE.border.width)
  })

  it("reads qr layer shadow from the layer model", () => {
    const layer = {
      ...createDraftingTextLayer(NODE_ID),
      kind: "qr" as const,
      shadow: {
        blur: 18,
        color: "#000000",
        inset: false,
        kind: "drop" as const,
        offsetX: 4,
        offsetY: 6,
        opacity: 40,
        spread: 0,
        visible: true,
      },
    }
    const snapshot = getAppearanceSnapshot(layer, {
      qrBackgroundShapeOptions: DEFAULT_BACKGROUND_SHAPE_OPTIONS,
    })

    expect(snapshot.shadow.blur).toBe(18)
    expect(snapshot.shadow.offsetX).toBe(4)
  })

  it("maps qr frame options into a shared appearance snapshot", () => {
    const layer = createDraftingTextLayer(NODE_ID)
    const snapshot = getAppearanceSnapshot(
      { ...layer, kind: "qr" },
      { qrBackgroundShapeOptions: DEFAULT_BACKGROUND_SHAPE_OPTIONS },
    )

    expect(snapshot.shadow.color).toBe(layer.shadow.color)
    expect(snapshot.border.width).toBe(0)
  })

  it("builds qr and card appearance patches into their domain stores", () => {
    const qrLayer = { ...createDraftingTextLayer(NODE_ID), kind: "qr" as const }
    const qrPatch = buildAppearancePatch(
      qrLayer,
      {
        shadow: {
          blur: 12,
          color: "#000000",
          inset: false,
          kind: "drop",
          offsetX: 4,
          offsetY: 6,
          opacity: 40,
          spread: 0,
          visible: true,
        },
      },
      { qrBackgroundShapeOptions: DEFAULT_BACKGROUND_SHAPE_OPTIONS },
    )

    expect(qrPatch.qrBackgroundShapeOptions).toBeUndefined()
    expect(qrPatch.layerPatch.shadow?.blur).toBe(12)

    const cardLayer = { ...createDraftingShapeLayer(NODE_ID), kind: "card" as const }
    const cardPatch = buildAppearancePatch(cardLayer, { cornerRadius: 24 })

    expect(cardPatch.cardCornerRadius).toBe(24)

    const cardShadowPatch = buildAppearancePatch(
      cardLayer,
      { shadow: {
          blur: 22,
          color: "#000000",
          inset: false,
          kind: "drop",
          offsetX: 4,
          offsetY: 6,
          opacity: 35,
          spread: 0,
          visible: true,
        } },
    )

    expect(cardShadowPatch.cardShadow?.blur).toBe(22)
    expect(cardShadowPatch.layerPatch.shadow?.blur).toBe(22)
  })

  it("routes border patches to card border state", () => {
    const cardLayer = { ...createDraftingShapeLayer(NODE_ID), kind: "card" as const }
    const patch = buildAppearancePatch(cardLayer, {
      border: { color: "#ff0000", opacity: 80, style: "solid", width: 6 },
    })

    expect(patch.cardBorder?.width).toBe(6)
    expect(patch.cardBorder?.color).toBe("#ff0000")
    expect(patch.cardBorder?.sides.top.width).toBe(6)
    expect(patch.layerPatch.borderSides?.top.width).toBe(0)
  })

  it("routes border patches to stroke fields for shape layers", () => {
    const shapeLayer = createDraftingShapeLayer(NODE_ID)
    const patch = buildAppearancePatch(shapeLayer, {
      border: { color: "#00ff00", opacity: 50, style: "solid", width: 4 },
    })

    expect(patch.layerPatch.stroke).toBe("#00ff00")
    expect(patch.layerPatch.strokeWidth).toBe(4)
    expect(patch.layerPatch.strokeOpacity).toBe(50)
    expect(patch.layerPatch.strokeStyle).toBe("solid")
    expect(patch.layerPatch.borderSides?.top.width).toBe(0)
  })

  it("routes border patches to uniform borderSides for other layers", () => {
    const textLayer = createDraftingTextLayer(NODE_ID)
    const patch = buildAppearancePatch(textLayer, {
      border: { color: "#0000ff", opacity: 100, style: "solid", width: 2 },
    })

    expect(patch.layerPatch.borderSides?.top).toEqual({
      color: "#0000ff",
      opacity: 100,
      style: "solid",
      width: 2,
    })
    expect(patch.layerPatch.borderSides?.left.width).toBe(2)
  })

  it("routes border patches to borderSides for qr layers", () => {
    const qrLayer = { ...createDraftingTextLayer(NODE_ID), kind: "qr" as const }
    const patch = buildAppearancePatch(qrLayer, {
      border: { color: "#111111", opacity: 90, style: "solid", width: 3 },
    })

    expect(patch.layerPatch.borderSides?.top.width).toBe(3)
    expect(patch.layerPatch.borderSides?.top.style).toBe("solid")
    expect(patch.layerPatch.strokeWidth).toBeUndefined()
  })

  it("routes border patches to background shape stroke for qr layers with a shape", () => {
    const qrLayer = { ...createDraftingTextLayer(NODE_ID), kind: "qr" as const }
    const patch = buildAppearancePatch(
      qrLayer,
      { border: { color: "#222222", opacity: 75, style: "solid", width: 8 } },
      {
        qrBackgroundShapeId: "leaf",
        qrBackgroundShapeOptions: DEFAULT_BACKGROUND_SHAPE_OPTIONS,
      },
    )

    expect(patch.qrBackgroundShapeOptions?.strokeColor).toBe("#222222")
    expect(patch.qrBackgroundShapeOptions?.strokeOpacity).toBe(75)
    expect(patch.qrBackgroundShapeOptions?.strokeWidth).toBe(8)
    expect(patch.layerPatch.borderSides?.top.width).toBe(0)
  })

  it("reads qr background shape stroke into the border snapshot", () => {
    const qrLayer = { ...createDraftingTextLayer(NODE_ID), kind: "qr" as const }
    const snapshot = getAppearanceSnapshot(qrLayer, {
      qrBackgroundShapeId: "leaf",
      qrBackgroundShapeOptions: {
        ...DEFAULT_BACKGROUND_SHAPE_OPTIONS,
        strokeColor: "#abcdef",
        strokeOpacity: 60,
        strokeWidth: 5,
      },
    })

    expect(snapshot.border).toEqual({
      color: "#abcdef",
      opacity: 60,
      style: "solid",
      width: 5,
    })
    expect(snapshot.supportsBorder).toBe(true)
  })

  it("flags border support only for card, shape, and qr backdrop targets", () => {
    const qrLayer = { ...createDraftingTextLayer(NODE_ID), kind: "qr" as const }
    const textLayer = createDraftingTextLayer(NODE_ID)

    expect(
      getAppearanceSnapshot(qrLayer, {
        qrBackgroundShapeId: "leaf",
        qrBackgroundShapeOptions: DEFAULT_BACKGROUND_SHAPE_OPTIONS,
      }).supportsBorder,
    ).toBe(true)
    expect(getAppearanceSnapshot(qrLayer).supportsBorder).toBe(false)
    expect(
      getAppearanceSnapshot(qrLayer, {
        qrBackgroundShapeId: "none",
        qrBackgroundShapeOptions: DEFAULT_BACKGROUND_SHAPE_OPTIONS,
        qrBackgroundSurfaceVisible: true,
      }).supportsBorder,
    ).toBe(true)
    expect(getAppearanceSnapshot(textLayer).supportsBorder).toBe(false)
    expect(
      getAppearanceSnapshot(createDraftingShapeLayer(NODE_ID)).supportsBorder,
    ).toBe(true)
  })

  it("reads shape stroke fields into the border snapshot", () => {
    const shapeLayer = {
      ...createDraftingShapeLayer(NODE_ID),
      stroke: "#123456",
      strokeOpacity: 70,
      strokeStyle: "solid" as const,
      strokeWidth: 3,
    }
    const snapshot = getAppearanceSnapshot(shapeLayer)

    expect(snapshot.border).toEqual({
      color: "#123456",
      opacity: 70,
      style: "solid",
      width: 3,
    })
  })
})
