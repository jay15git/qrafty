import {
  cloneDraftingQrState,
  type DraftingWorkspaceDocumentV1,
} from "@/features/workspace/model/document"
import {
  cloneDraftingCardState,
  normalizeDraftingCardState,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import { getCanvasSizeFromTemplate, getSizeTemplate } from "@/features/workspace/model/size-templates"
import {
  cloneSceneComposition,
  createDefaultSceneComposition,
  getSceneTemplate,
  normalizeSceneComposition,
  type SceneCompositionState,
  type SceneTemplate,
} from "@/features/workspace/model/scene-templates"
import { createDefaultDraftingLayers } from "@/features/workspace/model/layers"
import { DEFAULT_BACKGROUND_SHAPE_OPTIONS } from "@/features/qr-code/model/state"

export type ApplySceneTemplateOptions = {
  nodeId?: string
  preserveContent?: boolean
}

export type SceneCompositionByNodeId = Record<string, SceneCompositionState>

export function createDefaultSceneCompositionByNodeId(
  document: DraftingWorkspaceDocumentV1,
): SceneCompositionByNodeId {
  return Object.fromEntries(
    document.qrOrder.map((nodeId) => [nodeId, createDefaultSceneComposition()]),
  )
}

export function cloneSceneCompositionByNodeId(
  value: SceneCompositionByNodeId,
): SceneCompositionByNodeId {
  return Object.fromEntries(
    Object.entries(value).map(([nodeId, composition]) => [
      nodeId,
      cloneSceneComposition(composition),
    ]),
  )
}

function mergeCardStateFromTemplate(
  current: DraftingCardState,
  template: SceneTemplate,
): DraftingCardState {
  const dims = getSizeTemplateDims(template)
  const canvasSize = getCanvasSizeFromTemplate(dims)

  return normalizeDraftingCardState({
    ...current,
    ...template.cardState,
    width: canvasSize.width,
    height: canvasSize.height,
    sizeMode: "fixed",
    sizePresetId: template.sizePresetId,
    lockAspectRatio: true,
  })
}

function getSizeTemplateDims(template: SceneTemplate) {
  const sizeTemplate = getSizeTemplate(template.sizePresetId)
  return {
    width: sizeTemplate?.width ?? 1080,
    height: sizeTemplate?.height ?? 1080,
  }
}

export function buildSceneCompositionFromTemplate(template: SceneTemplate): SceneCompositionState {
  return normalizeSceneComposition({
    templateId: template.id,
    background: template.sceneBackground,
    layout: template.layout,
    exportPresetId: template.exportPresetId,
  })
}

export function applySceneTemplate(
  document: DraftingWorkspaceDocumentV1,
  templateId: string,
  options: ApplySceneTemplateOptions = {},
): DraftingWorkspaceDocumentV1 {
  const template = getSceneTemplate(templateId)
  if (!template) {
    return document
  }

  const nodeId = options.nodeId ?? document.activeQrNodeId
  const preserveContent = options.preserveContent !== false
  const nextDocument = {
    ...document,
    cardStateByNodeId: { ...document.cardStateByNodeId },
    qrStateByNodeId: { ...document.qrStateByNodeId },
    layerStateByNodeId: { ...document.layerStateByNodeId },
    sceneCompositionByNodeId: cloneSceneCompositionByNodeId(
      document.sceneCompositionByNodeId ?? createDefaultSceneCompositionByNodeId(document),
    ),
  }

  const currentCard =
    nextDocument.cardStateByNodeId[nodeId] ??
    cloneDraftingCardState(Object.values(document.cardStateByNodeId)[0]!)
  const currentQr = nextDocument.qrStateByNodeId[nodeId]

  const nextCard = mergeCardStateFromTemplate(currentCard, template)
  nextDocument.cardStateByNodeId[nodeId] = nextCard

  if (currentQr) {
    const nextQr = preserveContent ? cloneDraftingQrState(currentQr) : { ...currentQr }
    if (template.qrFrame) {
      nextQr.backgroundShapeOptions = {
        ...DEFAULT_BACKGROUND_SHAPE_OPTIONS,
        ...currentQr.backgroundShapeOptions,
        ...template.qrFrame,
      }
    }
    nextDocument.qrStateByNodeId[nodeId] = nextQr
    nextDocument.layerStateByNodeId[nodeId] = createDefaultDraftingLayers(nodeId, nextQr, nextCard)
  }

  nextDocument.sceneCompositionByNodeId[nodeId] = buildSceneCompositionFromTemplate(template)

  return nextDocument
}

export function applySceneCompositionPatch(
  sceneCompositionByNodeId: SceneCompositionByNodeId,
  nodeId: string,
  patch: Partial<SceneCompositionState>,
): SceneCompositionByNodeId {
  const current = sceneCompositionByNodeId[nodeId] ?? createDefaultSceneComposition()
  return {
    ...sceneCompositionByNodeId,
    [nodeId]: normalizeSceneComposition({
      ...current,
      ...patch,
      layout: patch.layout ? { ...current.layout, ...patch.layout } : current.layout,
      background: patch.background ?? current.background,
    }),
  }
}

export function extractSceneTemplateFromDocument(
  document: DraftingWorkspaceDocumentV1,
  nodeId?: string,
): Partial<SceneTemplate> | null {
  const resolvedNodeId = nodeId ?? document.activeQrNodeId
  const cardState = document.cardStateByNodeId[resolvedNodeId]
  const composition = document.sceneCompositionByNodeId?.[resolvedNodeId]
  if (!cardState || !composition) return null

  const qrState = document.qrStateByNodeId[resolvedNodeId]

  return {
    id: composition.templateId ?? "custom",
    title: "Custom",
    category: "minimal",
    sizePresetId: cardState.sizePresetId ?? "ratio-1-1",
    sceneBackground: composition.background,
    cardState: {
      fill: cardState.fill,
      cornerRadius: cardState.cornerRadius,
      shadow: cardState.shadow,
      border: cardState.border,
      styleMode: cardState.styleMode,
      patternId: cardState.patternId,
      patternColors: cardState.patternColors,
    },
    layout: composition.layout,
    exportPresetId: composition.exportPresetId,
    qrFrame: qrState?.backgroundShapeOptions,
    thumbnailUrl: "",
  }
}
