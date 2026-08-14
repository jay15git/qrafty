import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"
import {
  cloneSceneComposition,
  createDefaultSceneComposition,
  normalizeSceneComposition,
  type SceneCompositionState,
} from "@/features/workspace/model/scene-templates"

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
