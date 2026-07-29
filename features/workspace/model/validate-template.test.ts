import { describe, expect, it } from "vitest"

import { createDefaultDraftingWorkspaceDocument } from "@/features/workspace/model/document"
import {
  createDraftingShapeLayer,
  createDraftingTextLayer,
  patchDraftingCanvasLayer,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import { validateTemplateDocument } from "@/features/workspace/model/validate-template"

function documentWithLayers(extra: DraftingCanvasLayer[]) {
  const document = createDefaultDraftingWorkspaceDocument()
  const nodeId = document.activeQrNodeId
  const existing = document.layerStateByNodeId[nodeId] ?? []

  return {
    ...document,
    layerStateByNodeId: { [nodeId]: [...existing, ...extra] },
  }
}

const NODE = "node-1"

function opaqueRect(
  id: string,
  options: {
    fill: string
    height: number
    width: number
    x: number
    y: number
    zIndex: number
  },
) {
  return patchDraftingCanvasLayer(
    createDraftingShapeLayer(NODE, "rect", {
      fill: options.fill,
      fillMode: "solid",
      height: options.height,
      id,
      opacity: 1,
      width: options.width,
      x: options.x,
      y: options.y,
      zIndex: options.zIndex,
    }),
    { cornerRadius: 0 },
  )
}

describe("validateTemplateDocument", () => {
  it("passes a default document", () => {
    const issues = validateTemplateDocument(createDefaultDraftingWorkspaceDocument())

    expect(issues.filter((issue) => issue.severity === "error")).toEqual([])
  })

  it("flags a shape with no fill and no stroke as rendering nothing", () => {
    const layer = createDraftingShapeLayer(NODE, "heart", {
      fillMode: "none",
      height: 52,
      id: "ghost-heart",
      strokeWidth: 0,
      width: 52,
      x: 0,
      y: 0,
      zIndex: 5,
    })

    const issues = validateTemplateDocument(documentWithLayers([layer]))

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "layer-renders-nothing", layerId: "ghost-heart" }),
    )
  })

  it("flags text hidden behind a later opaque shape", () => {
    const watermark = createDraftingTextLayer(NODE, {
      fill: "#9fd4bc",
      fontSize: 220,
      height: 240,
      id: "watermark",
      text: "Paris",
      width: 600,
      x: -300,
      y: -120,
      zIndex: 1,
    })
    const cover = opaqueRect("cover", {
      fill: "#ffffff",
      height: 400,
      width: 700,
      x: -350,
      y: -200,
      zIndex: 2,
    })

    const issues = validateTemplateDocument(documentWithLayers([watermark, cover]))

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "layer-occluded", layerId: "watermark" }),
    )
  })

  it("flags a layer positioned outside the canvas", () => {
    const layer = createDraftingShapeLayer(NODE, "rect", {
      fill: "#000000",
      fillMode: "solid",
      height: 40,
      id: "off-canvas",
      width: 40,
      x: 5_000,
      y: 5_000,
      zIndex: 4,
    })

    const issues = validateTemplateDocument(documentWithLayers([layer]))

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "bounds-overflow", layerId: "off-canvas" }),
    )
  })

  it("flags a raw layer whose legacy and modern fields disagree", () => {
    const base = createDraftingShapeLayer(NODE, "rect", {
      fill: "#000000",
      fillMode: "solid",
      height: 40,
      id: "desynced",
      width: 40,
      x: 0,
      y: 0,
      zIndex: 4,
    })
    const desynced: DraftingCanvasLayer = { ...base, cornerRadius: 24, shadows: [] }

    const issues = validateTemplateDocument(documentWithLayers([desynced]))

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "field-desync", layerId: "desynced" }),
    )
  })

  it("flags white body text on a mint surface", () => {
    const surface = opaqueRect("mint-surface", {
      fill: "#d4f2e4",
      height: 200,
      width: 600,
      x: -300,
      y: -100,
      zIndex: 2,
    })
    const label = createDraftingTextLayer(NODE, {
      fill: "#ffffff",
      fontSize: 28,
      height: 40,
      id: "cta-label",
      text: "Book a trip to paris",
      width: 400,
      x: -200,
      y: -20,
      zIndex: 3,
    })

    const issues = validateTemplateDocument(documentWithLayers([surface, label]))

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "contrast-too-low", layerId: "cta-label" }),
    )
  })

  it("accepts dark text on a mint surface", () => {
    const surface = opaqueRect("mint-surface", {
      fill: "#d4f2e4",
      height: 200,
      width: 600,
      x: -300,
      y: -100,
      zIndex: 2,
    })
    const label = createDraftingTextLayer(NODE, {
      fill: "#12241a",
      fontSize: 28,
      height: 40,
      id: "cta-label",
      text: "Book a trip to paris",
      width: 400,
      x: -200,
      y: -20,
      zIndex: 3,
    })

    const issues = validateTemplateDocument(documentWithLayers([surface, label]))

    expect(issues.filter((issue) => issue.code === "contrast-too-low")).toEqual([])
  })

  it("flags a layer sitting on top of the qr quiet zone", () => {
    const document = createDefaultDraftingWorkspaceDocument()
    const nodeId = document.activeQrNodeId
    const existing = document.layerStateByNodeId[nodeId] ?? []
    const qrLayer = existing.find((layer) => layer.kind === "qr")!
    const sticker = createDraftingShapeLayer(NODE, "ellipse", {
      fill: "#ffffff",
      fillMode: "solid",
      height: 80,
      id: "sticker",
      width: 80,
      x: qrLayer.x + 10,
      y: qrLayer.y + 10,
      zIndex: qrLayer.zIndex + 5,
    })

    const issues = validateTemplateDocument({
      ...document,
      layerStateByNodeId: { [nodeId]: [...existing, sticker] },
    })

    expect(issues).toContainEqual(
      expect.objectContaining({ code: "qr-quiet-zone-collision", layerId: "sticker" }),
    )
  })

  it("flags a qr that is a corner sticker rather than the subject", () => {
    const document = createDefaultDraftingWorkspaceDocument()
    const nodeId = document.activeQrNodeId
    const existing = document.layerStateByNodeId[nodeId] ?? []
    const shrunk = existing.map((layer) =>
      layer.kind === "qr" ? { ...layer, height: 148, width: 148 } : layer,
    )

    const issues = validateTemplateDocument({
      ...document,
      cardStateByNodeId: {
        [nodeId]: { ...document.cardStateByNodeId[nodeId]!, height: 1080, width: 1080 },
      },
      layerStateByNodeId: { [nodeId]: shrunk },
    })

    expect(issues).toContainEqual(expect.objectContaining({ code: "qr-too-small" }))
  })
})
