import { emitSvg, preprocessSvg } from "@new-qr/qr-internal/codegen"

import { buildSceneIr } from "@/features/qr-code/export/build-scene-ir"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import {
  createDraftingQrArtworkState,
  sanitizeDraftingQrArtworkMarkup,
} from "@/features/workspace/rendering/qr-artwork"
import { buildDashboardQrNodePayload } from "@/features/qr-code/rendering/qr-svg"
import type { QrStudioState } from "@/features/qr-code/model/state"

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
  const qrArtworkMarkup = sanitizeDraftingQrArtworkMarkup(qrPayload.markup)
  const visibleLayers = layers.filter((layer) => layer.isVisible).sort((a, b) => a.zIndex - b.zIndex)

  const ir = await buildSceneIr({
    cardState,
    layers: visibleLayers,
    sceneComposition,
    state,
    qrMarkup: qrArtworkMarkup,
    componentName: name.replace(/[^a-zA-Z0-9]/g, "") || "QrCard",
    shaderSnapshots,
  })

  const rawSvg = emitSvg(ir)
  const originalSvgMarkup = preprocessSvg(rawSvg, { idPrefix: nodeId })
  return {
    id: nodeId,
    name,
    naturalHeight: ir.bounds.height,
    naturalWidth: ir.bounds.width,
    originalSvgMarkup,
  }
}

export async function downloadDraftingSvgExport({
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
