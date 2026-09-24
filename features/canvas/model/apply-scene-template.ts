import type { CanvasWorkspaceDocumentV1 } from "@/features/canvas/model/document";
import {
  cloneSceneComposition,
  createDefaultSceneComposition,
  normalizeSceneComposition,
  type SceneCompositionState,
} from "@/features/canvas/model/scene-templates";

export type SceneCompositionByNodeId = Record<string, SceneCompositionState>;

export function createDefaultSceneCompositionByNodeId(
  document: CanvasWorkspaceDocumentV1,
): SceneCompositionByNodeId {
  return Object.fromEntries(
    document.qrOrder.map((nodeId) => [nodeId, createDefaultSceneComposition()]),
  );
}

export function cloneSceneCompositionByNodeId(
  value: SceneCompositionByNodeId,
): SceneCompositionByNodeId {
  return Object.fromEntries(
    Object.entries(value).map(([nodeId, composition]) => [
      nodeId,
      cloneSceneComposition(composition),
    ]),
  );
}

export function applySceneCompositionPatch(
  sceneCompositionByNodeId: SceneCompositionByNodeId,
  nodeId: string,
  patch: Partial<SceneCompositionState>,
): SceneCompositionByNodeId {
  const current = sceneCompositionByNodeId[nodeId] ?? createDefaultSceneComposition();
  return {
    ...sceneCompositionByNodeId,
    [nodeId]: normalizeSceneComposition({
      ...current,
      ...patch,
      layout: patch.layout ? { ...current.layout, ...patch.layout } : current.layout,
      background: patch.background ?? current.background,
    }),
  };
}
