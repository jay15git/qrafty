import { describe, expect, it } from "vitest"

import { defineTemplate } from "@/features/workspace/authoring/define-template"
import { validateTemplateDocument } from "@/features/workspace/model/validate-template"

const buildTicket = defineTemplate({
  archetype: "ticket",
  data: "https://example.com/trip",
  palette: "mint",
  ratio: "ratio-4-5",
  slots: {
    action: "Reserve",
    caption: "Scan to book",
    meta: "5D 6N",
    title: "Trip to Paris",
  },
})

describe("defineTemplate — ticket", () => {
  it("produces a validator-clean document", () => {
    const issues = validateTemplateDocument(buildTicket())

    expect(issues.map((issue) => `${issue.severity} ${issue.code}: ${issue.message}`)).toEqual([])
  })

  it("makes the qr the subject", () => {
    const document = buildTicket()
    const nodeId = document.activeQrNodeId
    const cardState = document.cardStateByNodeId[nodeId]!
    const qrLayer = document.layerStateByNodeId[nodeId]!.find((layer) => layer.kind === "qr")!
    const shorterSide = Math.min(cardState.width, cardState.height)

    expect(qrLayer.width / shorterSide).toBeGreaterThanOrEqual(0.4)
  })

  it("renders every provided slot as text", () => {
    const document = buildTicket()
    const nodeId = document.activeQrNodeId
    const texts = document.layerStateByNodeId[nodeId]!
      .filter((layer) => layer.kind === "text")
      .map((layer) => layer.text)

    expect(texts).toContain("Trip to Paris")
    expect(texts).toContain("SCAN TO BOOK")
    expect(texts).toContain("5D 6N")
    expect(texts).toContain("Reserve")
  })

  it("omits layers for absent slots", () => {
    const minimal = defineTemplate({
      archetype: "ticket",
      data: "https://example.com",
      palette: "slate",
      ratio: "ratio-4-5",
      slots: { title: "Only a title" },
    })()
    const nodeId = minimal.activeQrNodeId
    const texts = minimal.layerStateByNodeId[nodeId]!.filter((layer) => layer.kind === "text")

    expect(texts).toHaveLength(1)
    expect(validateTemplateDocument(minimal)).toEqual([])
  })

  it("is deterministic across builds", () => {
    const first = buildTicket()
    const second = buildTicket()
    const geometry = (document: typeof first) =>
      document.layerStateByNodeId[document.activeQrNodeId]!.map(
        (layer) => `${layer.kind}:${layer.x},${layer.y},${layer.width},${layer.height},${layer.zIndex}`,
      )

    expect(geometry(first)).toEqual(geometry(second))
  })
})

describe("defineTemplate — label", () => {
  const buildLabel = defineTemplate({
    archetype: "label",
    data: "https://example.com/amsterdam",
    palette: "sand",
    ratio: "ratio-4-5",
    slots: { caption: "Scan to open", meta: "★ 4.61", title: "Trip to Amsterdam" },
  })

  it("produces a validator-clean document", () => {
    expect(validateTemplateDocument(buildLabel())).toEqual([])
  })

  it("keeps the qr as the subject", () => {
    const document = buildLabel()
    const nodeId = document.activeQrNodeId
    const cardState = document.cardStateByNodeId[nodeId]!
    const qrLayer = document.layerStateByNodeId[nodeId]!.find((layer) => layer.kind === "qr")!

    expect(qrLayer.width / Math.min(cardState.width, cardState.height)).toBeGreaterThanOrEqual(0.4)
  })

  it("draws a hairline rule between the qr and the text block", () => {
    const document = buildLabel()
    const nodeId = document.activeQrNodeId
    const layers = document.layerStateByNodeId[nodeId]!
    const qrLayer = layers.find((layer) => layer.kind === "qr")!
    const hairline = layers.find((layer) => layer.name === "Hairline")!

    expect(hairline.height).toBeLessThanOrEqual(4)
    expect(hairline.y).toBeGreaterThan(qrLayer.y + qrLayer.height)
  })

  it("rejects an action slot it cannot render", () => {
    expect(() =>
      defineTemplate({
        archetype: "label",
        data: "https://example.com",
        palette: "sand",
        ratio: "ratio-4-5",
        slots: { action: "Book now", title: "Nope" },
      })(),
    ).toThrow(/label archetype does not support the action slot/i)
  })
})

describe("defineTemplate — seal", () => {
  const buildSeal = defineTemplate({
    archetype: "seal",
    data: "https://example.com/members",
    palette: "blush",
    ratio: "ratio-1-1",
    slots: { caption: "Members" },
  })

  it("produces a validator-clean document", () => {
    expect(validateTemplateDocument(buildSeal())).toEqual([])
  })

  it("uses exactly one catalogue silhouette", () => {
    const document = buildSeal()
    const nodeId = document.activeQrNodeId
    const shapes = document.layerStateByNodeId[nodeId]!.filter((layer) => layer.kind === "shape")

    expect(shapes).toHaveLength(1)
    expect(shapes[0]?.shapeId).toBe("scallop-seal")
  })

  it("inks the qr in the on-accent colour", () => {
    const document = buildSeal()
    const nodeId = document.activeQrNodeId

    expect(document.qrStateByNodeId[nodeId]?.dataModulesSettings.color).toBe("#ffffff")
  })
})
