// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"

import { buildSocialCardTemplateDocument } from "@/features/studio-hub/model/social-card-templates"
import { STUDIO_SESSION_KEY } from "@/features/studio-hub/model/navigation"
import {
  readWorkspaceBootstrapSnapshot,
  resolveWorkspaceBootstrapDocument,
  writeWorkspaceBootstrapSnapshot,
} from "@/features/workspace/model/workspace-bootstrap"

describe("resolveWorkspaceBootstrapDocument", () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it("reloads social templates from the hub catalog when a template session is active", async () => {
    const seeded = buildSocialCardTemplateDocument("social-mint-cta")
    const nodeId = seeded.activeQrNodeId

    window.sessionStorage.setItem(
      STUDIO_SESSION_KEY,
      JSON.stringify({
        returnTab: "templates",
        source: "template",
        templateId: "social-mint-cta",
      }),
    )

    const result = await resolveWorkspaceBootstrapDocument()

    expect(result.consumedSession).toBe(true)
    expect(result.document.layerStateByNodeId[nodeId]?.length).toBe(
      seeded.layerStateByNodeId[nodeId]?.length,
    )
    expect(result.document.qrStateByNodeId[nodeId]?.width).toBe(seeded.qrStateByNodeId[nodeId]?.width)
    expect(result.document.cardStateByNodeId[nodeId]?.sizePresetId).toBe("ratio-4-5")
    expect(window.sessionStorage.getItem(STUDIO_SESSION_KEY)).toContain('"source":"blank"')
  })

  it("prefers the synchronous bootstrap snapshot over indexeddb", async () => {
    const seeded = buildSocialCardTemplateDocument("social-mint-cta")
    const nodeId = seeded.activeQrNodeId

    writeWorkspaceBootstrapSnapshot(seeded)

    const result = await resolveWorkspaceBootstrapDocument()

    expect(result.consumedSession).toBe(true)
    expect(result.document.layerStateByNodeId[nodeId]?.length).toBe(
      seeded.layerStateByNodeId[nodeId]?.length,
    )
    expect(readWorkspaceBootstrapSnapshot()).toBeNull()
  })
})
