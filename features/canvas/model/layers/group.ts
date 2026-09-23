import {
  DEFAULT_DRAFTING_OUTLINE,
  legacyShadowToShadowLayer,
} from "@/features/canvas/model/effects";
import { cloneDraftingCanvasLayer } from "@/features/canvas/model/layers/fallback";
import { getLayerBounds, normalizeLayerZIndexes } from "@/features/canvas/model/layers/operations";
import { patchDraftingCanvasLayer } from "@/features/canvas/model/layers/patch";
import {
  DEFAULT_DRAFTING_LAYER_SHADOW,
  type DraftingCanvasLayer,
} from "@/features/canvas/model/layers/shared";

export function groupDraftingCanvasLayers(
  layers: DraftingCanvasLayer[],
  selectedLayerIds: string[],
  options: { groupId: string; name: string },
) {
  const selectedIdSet = new Set(selectedLayerIds);
  const selectedLayers = layers.filter((layer) => selectedIdSet.has(layer.id));
  const bounds = getLayerBounds(selectedLayers);

  if (!bounds || selectedLayers.length < 2) {
    return layers.map(cloneDraftingCanvasLayer);
  }

  const lowestZIndex = Math.min(...selectedLayers.map((layer) => layer.zIndex));
  const groupLayer = patchDraftingCanvasLayer(
    {
      blur: 0,
      children: selectedLayers
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((layer, index) =>
          patchDraftingCanvasLayer(cloneDraftingCanvasLayer(layer), {
            x: layer.x - bounds.left,
            y: layer.y - bounds.top,
            zIndex: index,
          }),
        ),
      height: bounds.bottom - bounds.top,
      id: options.groupId,
      isVisible: true,
      kind: "group",
      layerFilters: [],
      name: options.name,
      nodeId: selectedLayers[0]?.nodeId ?? layers[0]?.nodeId ?? "preview",
      opacity: 1,
      outline: { ...DEFAULT_DRAFTING_OUTLINE },
      rotation: 0,
      tiltX: 0,
      tiltY: 0,
      shadow: { ...DEFAULT_DRAFTING_LAYER_SHADOW },
      shadows: [legacyShadowToShadowLayer(DEFAULT_DRAFTING_LAYER_SHADOW)],
      width: bounds.right - bounds.left,
      x: bounds.left,
      y: bounds.top,
      zIndex: lowestZIndex,
    },
    {},
  );

  return normalizeLayerZIndexes(
    [
      ...layers.flatMap((layer) =>
        selectedIdSet.has(layer.id) ? [] : [cloneDraftingCanvasLayer(layer)],
      ),
      groupLayer,
    ].sort((a, b) => a.zIndex - b.zIndex),
  );
}

export function ungroupDraftingCanvasLayer(layers: DraftingCanvasLayer[], groupLayerId: string) {
  const groupLayer = layers.find((layer) => layer.id === groupLayerId && layer.kind === "group");

  if (!groupLayer?.children?.length) {
    return layers.map(cloneDraftingCanvasLayer);
  }

  const restoredChildren = groupLayer.children.map((child) =>
    patchDraftingCanvasLayer(cloneDraftingCanvasLayer(child), {
      nodeId: groupLayer.nodeId,
      x: groupLayer.x + child.x,
      y: groupLayer.y + child.y,
      zIndex: groupLayer.zIndex + child.zIndex,
    }),
  );

  return normalizeLayerZIndexes(
    [
      ...layers.flatMap((layer) =>
        layer.id === groupLayerId ? [] : [cloneDraftingCanvasLayer(layer)],
      ),
      ...restoredChildren,
    ].sort((a, b) => a.zIndex - b.zIndex),
  );
}
