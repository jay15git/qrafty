import { describe, expect, it } from "vitest"

import { buildDocumentPreviewMarkup } from "@/features/qr-code/rendering/document-preview"
import { createDocumentFromHubIntent } from "@/features/studio-hub/model/bootstrap-document"
import {
  SOCIAL_CARD_TEMPLATE_BUILDERS,
  buildSocialCardTemplateDocument,
} from "@/features/studio-hub/model/social-card-templates"
import { getTemplateById } from "@/features/studio-hub/model/templates"
import {
  getDraftingCardInsetLayout,
  hasAuthoredLayerComposition,
  hasCustomDraftingQrPlacement,
} from "@/features/workspace/model/layers"

const SOCIAL_TEMPLATE_IDS = [
  "social-mint-cta",
  "social-studio-index",
  "social-editorial-link",
] as const

describe("social card templates", () => {
  it.each(SOCIAL_TEMPLATE_IDS)("registers %s in the hub catalog", (templateId) => {
    const template = getTemplateById(templateId)
    expect(template).toBeDefined()
    expect(template?.category).toBe("social")
    expect(template?.document.layerStateByNodeId[template.document.activeQrNodeId]?.length).toBeGreaterThan(4)
  })

  it.each(SOCIAL_TEMPLATE_IDS)("uses fixed canvas sizing", (templateId) => {
    const document = buildSocialCardTemplateDocument(templateId)
    const nodeId = document.activeQrNodeId
    const cardState = document.cardStateByNodeId[nodeId]

    expect(cardState?.sizeMode).toBe("fixed")
    expect(cardState?.sizePresetId).toBeTruthy()
    expect(cardState?.width).toBeGreaterThan(0)
    expect(cardState?.height).toBeGreaterThan(0)
  })

  it.each(SOCIAL_TEMPLATE_IDS)("keeps authored layers and QR payload when opened from hub", async (templateId) => {
    const seeded = buildSocialCardTemplateDocument(templateId)
    const nodeId = seeded.activeQrNodeId
    const layerCount = seeded.layerStateByNodeId[nodeId]?.length ?? 0

    const document = await createDocumentFromHubIntent({
      source: "template",
      templateId,
    })

    expect(document.qrStateByNodeId[nodeId]?.data).toBe(seeded.qrStateByNodeId[nodeId]?.data)
    expect(document.layerStateByNodeId[nodeId]?.length).toBe(layerCount)
    expect(document.layerStateByNodeId[nodeId]?.some((layer) => layer.kind === "text")).toBe(true)
    expect(document.layerStateByNodeId[nodeId]?.some((layer) => layer.kind === "shape")).toBe(true)
  })

  it("renders layered preview markup for each social template", async () => {
    for (const templateId of SOCIAL_TEMPLATE_IDS) {
      const document = SOCIAL_CARD_TEMPLATE_BUILDERS[templateId]()
      const markup = await buildDocumentPreviewMarkup(document)

      expect(markup).toContain("<svg")
      expect(markup).toContain('data-testid="finder-patterns-outer"')
    }
  })

  it("uses portrait sizing for mint and editorial templates", () => {
    for (const templateId of ["social-mint-cta", "social-editorial-link"] as const) {
      const document = buildSocialCardTemplateDocument(templateId)
      const cardState = document.cardStateByNodeId[document.activeQrNodeId]

      expect(cardState?.sizePresetId).toBe("ratio-4-5")
      expect(cardState?.height).toBeGreaterThan(cardState?.width ?? 0)
    }
  })

  it("builds mint cta from three rounded rects and a centered qr", () => {
    const document = buildSocialCardTemplateDocument("social-mint-cta")
    const nodeId = document.activeQrNodeId
    const layers = document.layerStateByNodeId[nodeId] ?? []
    const shapes = layers.filter((layer) => layer.kind === "shape")

    expect(layers.some((layer) => layer.kind === "image")).toBe(false)
    expect(shapes).toHaveLength(3)
    expect(layers.some((layer) => layer.kind === "qr")).toBe(true)
  })

  it("authors mint qr away from the default card inset", () => {
    const document = buildSocialCardTemplateDocument("social-mint-cta")
    const nodeId = document.activeQrNodeId
    const layers = document.layerStateByNodeId[nodeId] ?? []
    const qrState = document.qrStateByNodeId[nodeId]!
    const cardState = document.cardStateByNodeId[nodeId]!
    const qrLayer = layers.find((layer) => layer.kind === "qr")
    const inset = getDraftingCardInsetLayout(qrState, cardState).qr

    expect(qrLayer).toBeTruthy()
    expect(hasCustomDraftingQrPlacement(layers, nodeId, qrState, cardState)).toBe(true)
    expect(qrLayer?.y).not.toBe(inset.y)
    expect(qrLayer?.width).toBe(qrState.width)
  })

  it("flags social templates as authored compositions", () => {
    const document = buildSocialCardTemplateDocument("social-mint-cta")
    const layers = document.layerStateByNodeId[document.activeQrNodeId] ?? []

    expect(hasAuthoredLayerComposition(layers)).toBe(true)
  })
})
