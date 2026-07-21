import type { CodeExportTarget } from "@new-qr/qr-internal/codegen"
import { buildCodegenOutput } from "@new-qr/qr-internal/codegen"

import { buildSceneIr } from "@/features/qr-code/export/build-scene-ir"
import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"
import { createDefaultDraftingLayers } from "@/features/workspace/model/layers"
import {
  createDraftingQrArtworkState,
  sanitizeDraftingQrArtworkMarkup,
} from "@/features/workspace/rendering/qr-artwork"
import { buildDashboardQrNodePayload } from "@/features/qr-code/rendering/qr-svg"
import { captureCardShaderSnapshots } from "@/features/qr-code/export/shader-snapshot-capture"

export async function buildCodegenExportFromWorkspace({
  document,
  nodeId,
  target,
  shaderSnapshotRoot,
}: {
  document: DraftingWorkspaceDocumentV1
  nodeId?: string
  target: CodeExportTarget
  shaderSnapshotRoot?: ParentNode | null
}) {
  const activeNodeId = nodeId ?? document.activeQrNodeId
  const layers =
    document.layerStateByNodeId[activeNodeId] ??
    createDefaultDraftingLayers(
      activeNodeId,
      document.qrStateByNodeId[activeNodeId],
      document.cardStateByNodeId[activeNodeId],
    )
  const cardState = document.cardStateByNodeId[activeNodeId]
  const qrState = document.qrStateByNodeId[activeNodeId]

  if (!cardState || !qrState) {
    throw new Error("Scene node is unavailable.")
  }

  const qrPayload = await buildDashboardQrNodePayload(createDraftingQrArtworkState(qrState))
  const qrMarkup = sanitizeDraftingQrArtworkMarkup(qrPayload.markup)
  const shaderSnapshots = await captureCardShaderSnapshots(shaderSnapshotRoot ?? null, cardState)

  const ir = await buildSceneIr({
    cardState,
    layers: layers.filter((layer) => layer.isVisible).sort((a, b) => a.zIndex - b.zIndex),
    state: qrState,
    qrMarkup,
    componentName: "QrCard",
    shaderSnapshots,
  })

  return buildCodegenOutput(ir, target)
}
