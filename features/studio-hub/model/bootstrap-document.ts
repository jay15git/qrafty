import type { QrInputType } from "@/features/qr-code/content/input-options"
import { getDefaultStaticQrValues } from "@/features/qr-code/content/static-payload"
import {
  cloneDraftingCardState,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import {
  cloneDraftingWorkspaceDocument,
  createDefaultDraftingWorkspaceDocument,
  type DraftingWorkspaceDocumentV1,
} from "@/features/workspace/model/document"
import { createDefaultDraftingLayers } from "@/features/workspace/model/layers"
import {
  cloneDraftingQrState,
} from "@/features/workspace/model/document"
import {
  createDefaultQrStudioState,
  type QrStudioState,
} from "@/features/qr-code/model/state"
import { DASHBOARD_QR_NODE_ID } from "@/features/qr-code/rendering/compose-scene"
import {
  createEmptyLibraryIndex,
  readLibraryIndex,
} from "@/features/library/model/storage"
import type { StudioNavigationIntent } from "@/features/studio-hub/model/navigation"
import { getTemplateById } from "@/features/studio-hub/model/templates"
import { applySceneTemplate } from "@/features/workspace/model/apply-scene-template"
import { getSceneTemplate } from "@/features/workspace/model/scene-templates"

export type BootstrapDocumentOptions = StudioNavigationIntent

function applyInputTypeAndPrompt(
  document: DraftingWorkspaceDocumentV1,
  inputType: QrInputType,
  prompt?: string,
): DraftingWorkspaceDocumentV1 {
  const nodeId = document.activeQrNodeId
  const nextDocument = cloneDraftingWorkspaceDocument(document)
  const contentValues = {
    ...getDefaultStaticQrValues(inputType),
    ...(nextDocument.contentValuesByType[inputType] ?? {}),
  }

  if (prompt?.trim()) {
    if ("text" in contentValues) {
      contentValues.text = prompt.trim()
    } else if ("url" in contentValues) {
      contentValues.url = prompt.trim()
    } else if ("message" in contentValues) {
      contentValues.message = prompt.trim()
    }
  }

  const qrState = cloneDraftingQrState(nextDocument.qrStateByNodeId[nodeId]!)
  const encoded =
    prompt?.trim() ||
    (typeof contentValues.text === "string" ? contentValues.text : undefined) ||
    qrState.data

  qrState.data = encoded

  nextDocument.selectedContentType = inputType
  nextDocument.contentTypeByNodeId = {
    ...nextDocument.contentTypeByNodeId,
    [nodeId]: inputType,
  }
  nextDocument.contentValuesByType = {
    ...nextDocument.contentValuesByType,
    [inputType]: contentValues,
  }
  nextDocument.qrStateByNodeId = {
    ...nextDocument.qrStateByNodeId,
    [nodeId]: qrState,
  }

  const cardState = nextDocument.cardStateByNodeId[nodeId]!
  nextDocument.layerStateByNodeId = {
    ...nextDocument.layerStateByNodeId,
    [nodeId]: createDefaultDraftingLayers(nodeId, qrState, cardState),
  }

  return nextDocument
}

export function buildTemplateDocumentSeed(options: {
  inputType: QrInputType
  data: string
  contentValues?: Record<string, string>
  qr?: (base: QrStudioState) => QrStudioState
  card?: (base: DraftingCardState) => DraftingCardState
}): DraftingWorkspaceDocumentV1 {
  const base = createDefaultDraftingWorkspaceDocument()
  const nodeId = base.activeQrNodeId
  const qrState = options.qr
    ? options.qr(createDefaultQrStudioState())
    : createDefaultQrStudioState()
  qrState.data = options.data

  const cardState = options.card
    ? options.card(cloneDraftingCardState(base.cardStateByNodeId[nodeId]!))
    : cloneDraftingCardState(base.cardStateByNodeId[nodeId]!)

  const inputType = options.inputType
  const contentValues = {
    ...getDefaultStaticQrValues(inputType),
    ...options.contentValues,
  }

  if ("text" in contentValues) {
    contentValues.text = options.data
  }

  return {
    ...base,
    selectedContentType: inputType,
    contentTypeByNodeId: { [nodeId]: inputType },
    contentValuesByType: { [inputType]: contentValues },
    qrStateByNodeId: { [nodeId]: qrState },
    cardStateByNodeId: { [nodeId]: cardState },
    layerStateByNodeId: {
      [nodeId]: createDefaultDraftingLayers(nodeId, qrState, cardState),
    },
  }
}

export async function createDocumentFromHubIntent(
  intent: BootstrapDocumentOptions,
): Promise<DraftingWorkspaceDocumentV1> {
  if (intent.source === "template" && intent.templateId) {
    const template = getTemplateById(intent.templateId)
    if (template) {
      const hubToSceneTemplateMap: Record<string, string> = {
        "minimal-ink": "solid-ink",
        "ocean-gradient": "gradient-ocean",
        "neon-pulse": "gradient-neon",
        "business-card": "minimal-neutral",
        "instagram-glow": "gradient-pastel",
      }
      const sceneTemplateId = hubToSceneTemplateMap[intent.templateId]
      const sceneTemplate = sceneTemplateId ? getSceneTemplate(sceneTemplateId) : undefined
      if (sceneTemplate) {
        const seeded = cloneDraftingWorkspaceDocument(template.document)
        return applySceneTemplate(seeded, sceneTemplate.id, { preserveContent: true })
      }
      return cloneDraftingWorkspaceDocument(template.document)
    }
  }

  if (intent.source === "library" && intent.designId) {
    const index = (await readLibraryIndex()) ?? createEmptyLibraryIndex()
    const record = index.designs.find((design) => design.id === intent.designId)
    if (record?.document) {
      return cloneDraftingWorkspaceDocument(record.document)
    }

    if (record) {
      const fallback = createDefaultDraftingWorkspaceDocument()
      const primaryType = record.contentTags[0] ?? fallback.selectedContentType
      return applyInputTypeAndPrompt(fallback, primaryType, record.destinationPreview)
    }
  }

  const base = createDefaultDraftingWorkspaceDocument()
  const inputType = intent.inputType ?? base.selectedContentType

  if (intent.source === "prompt" || intent.inputType || intent.prompt) {
    return applyInputTypeAndPrompt(base, inputType, intent.prompt)
  }

  return base
}

export function resolveNodeId(document: DraftingWorkspaceDocumentV1): string {
  return document.activeQrNodeId || DASHBOARD_QR_NODE_ID
}
