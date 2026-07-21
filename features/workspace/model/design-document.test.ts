import { describe, expect, it } from "vitest"

import { createDefaultDraftingCardState } from "@/features/workspace/model/card-state"
import { createDefaultDraftingLayers } from "@/features/workspace/model/layers"
import { createDefaultDraftingWorkspaceDocument } from "@/features/workspace/model/document"
import { designDocumentFromWorkspacePane } from "@/features/workspace/model/design-document"
import { createDefaultQrStudioState } from "@/features/qr-code/model/state"
import { DASHBOARD_QR_NODE_ID } from "@/features/qr-code/rendering/compose-scene"

describe("design-document", () => {
  it("builds a design document from the active workspace pane", () => {
    const qr = createDefaultQrStudioState()
    const card = createDefaultDraftingCardState()
    const document = createDefaultDraftingWorkspaceDocument({
      qrStateByNodeId: {
        [DASHBOARD_QR_NODE_ID]: qr,
      },
      cardStateByNodeId: {
        [DASHBOARD_QR_NODE_ID]: card,
      },
      layerStateByNodeId: {
        [DASHBOARD_QR_NODE_ID]: createDefaultDraftingLayers(DASHBOARD_QR_NODE_ID, qr, card),
      },
    })

    const designDocument = designDocumentFromWorkspacePane({
      document,
      nodeId: DASHBOARD_QR_NODE_ID,
      width: 480,
      height: 640,
    })

    expect(designDocument).not.toBeNull()
    expect(designDocument?.width).toBe(480)
    expect(designDocument?.height).toBe(640)
    expect(designDocument?.layers.length).toBeGreaterThan(0)
  })
})
