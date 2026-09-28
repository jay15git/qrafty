import type { CanvasWorkspaceDocumentV1 } from "@/features/canvas/model/document";
import {
  cloneSceneComposition,
  createDefaultSceneComposition,
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
