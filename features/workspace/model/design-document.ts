import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { QrStudioState } from "@/features/qr-code/model/state"
import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"

/** Single-artboard design snapshot for canvas editing and export. */
export type DesignDocument = {
  width: number
  height: number
  qr: QrStudioState
  card: DraftingCardState
  layers: DraftingCanvasLayer[]
}

export function createDesignDocument({
  width,
  height,
  qr,
  card,
  layers,
}: DesignDocument): DesignDocument {
  return {
    width,
    height,
    qr: structuredClone(qr),
    card: structuredClone(card),
    layers: structuredClone(layers),
  }
}

export function designDocumentFromWorkspacePane({
  document,
  nodeId,
  width,
  height,
}: {
  document: DraftingWorkspaceDocumentV1
  nodeId: string
  width: number
  height: number
}): DesignDocument | null {
  const qr = document.qrStateByNodeId[nodeId]
  const card = document.cardStateByNodeId[nodeId]
  const layers = document.layerStateByNodeId[nodeId]

  if (!qr || !card || !layers) {
    return null
  }

  return createDesignDocument({ width, height, qr, card, layers })
}
