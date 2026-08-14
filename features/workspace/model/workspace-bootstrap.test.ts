// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from "vitest"

import { createDefaultDraftingWorkspaceDocument } from "@/features/workspace/model/document"
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

  it("prefers the synchronous bootstrap snapshot over indexeddb", async () => {
    const seeded = createDefaultDraftingWorkspaceDocument()
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
