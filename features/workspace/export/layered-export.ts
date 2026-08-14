import { buildDashboardQrNodePayload } from "@/features/qr-code/rendering/qr-svg-render"
import type { QrStudioState } from "@/features/qr-code/model/state"
import { createDraftingQrArtworkState } from "@/features/workspace/rendering/qr-artwork"
import { buildDraftingLayeredNodePayloadCore } from "@/features/workspace/export/layered-export-core"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

export async function buildDraftingLayeredNodePayload({
  cardState,
  layers,
  name,
  nodeId,
  sceneComposition,
  state,
  shaderSnapshots,
}: {
  cardState: DraftingCardState
  layers: DraftingCanvasLayer[]
  name: string
  nodeId: string
  sceneComposition?: import("@/features/workspace/model/scene-templates").SceneCompositionState
  state: QrStudioState
  shaderSnapshots?: Record<string, string>
}) {
  const qrPayload = await buildDashboardQrNodePayload(createDraftingQrArtworkState(state))

  return buildDraftingLayeredNodePayloadCore({
    cardState,
    layers,
    name,
    nodeId,
    qrPayload,
    sceneComposition,
    state,
    shaderSnapshots,
  })
}

async function downloadDraftingSvgExport({
  name,
  state,
}: {
  name: string
  state: QrStudioState
}) {
  const payload = await buildDashboardQrNodePayload(state)
  const blob = new Blob([payload.markup], { type: "image/svg+xml;charset=utf-8" })

  downloadBlob(blob, `${name}.svg`)
}

function downloadBlob(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.download = fileName
  anchor.href = objectUrl
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}
