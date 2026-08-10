import { emitSvg, preprocessSvg } from "@new-qr/qr-internal/codegen"

import { buildSceneIr } from "@/features/qr-code/export/build-scene-ir"
import type { DashboardQrNodePayload } from "@/features/qr-code/rendering/compose-scene"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { sanitizeDraftingQrArtworkMarkup } from "@/features/workspace/rendering/qr-artwork"
import type { QrStudioState } from "@/features/qr-code/model/state"

export async function buildDraftingLayeredNodePayloadCore({
  cardState,
  layers,
  name,
  nodeId,
  qrPayload,
  sceneComposition,
  shaderSnapshots,
}: {
  cardState: DraftingCardState
  layers: DraftingCanvasLayer[]
  name: string
  nodeId: string
  qrPayload: DashboardQrNodePayload
  sceneComposition?: import("@/features/workspace/model/scene-templates").SceneCompositionState
  state: QrStudioState
  shaderSnapshots?: Record<string, string>
}) {
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
