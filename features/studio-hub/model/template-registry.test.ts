import { describe, expect, it } from "vitest"

import {
  TEMPLATE_REGISTRY,
  getTemplateRegistryEntry,
} from "@/features/studio-hub/model/template-registry"

describe("template registry", () => {
  it("includes every social template", () => {
    const ids = TEMPLATE_REGISTRY.map((entry) => entry.id)

    expect(ids).toContain("social-mint-cta")
    expect(ids).toContain("social-studio-index")
    expect(ids).toContain("social-editorial-link")
    expect(ids).not.toContain("social-course-drop")
  })

  it("has no duplicate ids", () => {
    const ids = TEMPLATE_REGISTRY.map((entry) => entry.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it("builds a usable document for every entry", () => {
    for (const entry of TEMPLATE_REGISTRY) {
      const document = entry.buildDocument()
      const nodeId = document.activeQrNodeId

      expect(document.cardStateByNodeId[nodeId], entry.id).toBeDefined()
      expect(document.qrStateByNodeId[nodeId], entry.id).toBeDefined()
      expect(document.layerStateByNodeId[nodeId]?.length, entry.id).toBeGreaterThan(0)
    }
  })

  it("looks entries up by id", () => {
    expect(getTemplateRegistryEntry("social-mint-cta")?.source).toBe("social")
    expect(getTemplateRegistryEntry("does-not-exist")).toBeUndefined()
  })
})
