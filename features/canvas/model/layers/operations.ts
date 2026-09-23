import {
  cloneDraftingCanvasLayer,
  createDraftingLayerInstanceId,
} from "@/features/canvas/model/layers/fallback";
import { patchDraftingCanvasLayer } from "@/features/canvas/model/layers/patch";
import {
  rectanglesIntersect,
  type DraftingCanvasLayer,
  type DraftingLayerAlignAction,
  type DraftingLayerDistributeAction,
  type DraftingLayerReorderAction,
} from "@/features/canvas/model/layers/shared";

export function reorderDraftingCanvasLayer(
  layers: DraftingCanvasLayer[],
  layerId: string,
  action: DraftingLayerReorderAction,
) {
  const ordered = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  const currentIndex = ordered.findIndex((layer) => layer.id === layerId);

  if (currentIndex === -1) {
    return layers.map(cloneDraftingCanvasLayer);
  }

  const [layer] = ordered.splice(currentIndex, 1);
  const nextIndex =
    action === "back"
      ? 0
      : action === "backward"
        ? Math.max(0, currentIndex - 1)
        : action === "forward"
          ? Math.min(ordered.length, currentIndex + 1)
          : ordered.length;

  ordered.splice(nextIndex, 0, layer!);
  return normalizeLayerZIndexes(ordered);
}

export function alignDraftingCanvasLayers(
  layers: DraftingCanvasLayer[],
  selectedLayerIds: string[],
  action: DraftingLayerAlignAction,
) {
  const selectedIdSet = new Set(selectedLayerIds);
  const selectedLayers = layers.filter((layer) => selectedIdSet.has(layer.id));
  const bounds = getLayerBounds(selectedLayers);

  if (!bounds) {
    return layers.map(cloneDraftingCanvasLayer);
  }

  return layers.map((layer) => {
    if (!selectedIdSet.has(layer.id)) {
      return cloneDraftingCanvasLayer(layer);
    }

    const patch =
      action === "left"
        ? { x: bounds.left }
        : action === "center-x"
          ? { x: bounds.centerX - layer.width / 2 }
          : action === "right"
            ? { x: bounds.right - layer.width }
            : action === "top"
              ? { y: bounds.top }
              : action === "center-y"
                ? { y: bounds.centerY - layer.height / 2 }
                : { y: bounds.bottom - layer.height };

    return patchDraftingCanvasLayer(layer, roundLayerPatch(patch));
  });
}

export function distributeDraftingCanvasLayers(
  layers: DraftingCanvasLayer[],
  selectedLayerIds: string[],
  action: DraftingLayerDistributeAction,
) {
  const selectedIdSet = new Set(selectedLayerIds);
  const selectedLayers = selectedLayerIds
    .map((id) => layers.find((layer) => layer.id === id))
    .filter((layer): layer is DraftingCanvasLayer => Boolean(layer));
  const bounds = getLayerBounds(selectedLayers);

  if (!bounds || selectedLayers.length < 3) {
    return layers.map(cloneDraftingCanvasLayer);
  }

  const step =
    action === "horizontal"
      ? (bounds.right - bounds.left) / (selectedLayers.length - 1)
      : (bounds.bottom - bounds.top) / (selectedLayers.length - 1);
  const patchById = new Map<string, Partial<DraftingCanvasLayer>>();

  selectedLayers.forEach((layer, index) => {
    patchById.set(
      layer.id,
      action === "horizontal"
        ? { x: bounds.left + step * index }
        : { y: bounds.top + step * index },
    );
  });

  return layers.map((layer) =>
    selectedIdSet.has(layer.id)
      ? patchDraftingCanvasLayer(layer, roundLayerPatch(patchById.get(layer.id) ?? {}))
      : cloneDraftingCanvasLayer(layer),
  );
}

export function cloneDraftingCanvasLayersForPaste({
  layers,
  nodeId,
  offset,
  startingZIndex,
}: {
  layers: DraftingCanvasLayer[];
  nodeId: string;
  offset: { x: number; y: number };
  startingZIndex: number;
}) {
  return layers.map((layer, index) =>
    remapDraftingCanvasLayerForPaste(layer, {
      nodeId,
      offset,
      zIndex: startingZIndex + index,
    }),
  );
}

export function getDraftingMarqueeSelection(
  layers: DraftingCanvasLayer[],
  marquee: Pick<DraftingCanvasLayer, "height" | "width" | "x" | "y">,
) {
  const marqueeBounds = {
    bottom: marquee.y + marquee.height,
    left: marquee.x,
    right: marquee.x + marquee.width,
    top: marquee.y,
  };

  return layers.flatMap((layer) => {
    if (!layer.isVisible) {
      return [];
    }

    if (
      !rectanglesIntersect(marqueeBounds, {
        bottom: layer.y + layer.height,
        left: layer.x,
        right: layer.x + layer.width,
        top: layer.y,
      })
    ) {
      return [];
    }

    return [layer.id];
  });
}

export function normalizeLayerZIndexes(layers: DraftingCanvasLayer[]) {
  return layers.map((layer, index) => patchDraftingCanvasLayer(layer, { zIndex: index }));
}

export function getLayerBounds(layers: DraftingCanvasLayer[]) {
  if (layers.length === 0) {
    return null;
  }

  const left = Math.min(...layers.map((layer) => layer.x));
  const top = Math.min(...layers.map((layer) => layer.y));
  const right = Math.max(...layers.map((layer) => layer.x + layer.width));
  const bottom = Math.max(...layers.map((layer) => layer.y + layer.height));

  return {
    bottom,
    centerX: left + (right - left) / 2,
    centerY: top + (bottom - top) / 2,
    left,
    right,
    top,
  };
}

function roundLayerPatch(patch: Partial<DraftingCanvasLayer>) {
  return Object.fromEntries(
    Object.entries(patch).map(([key, value]) => [
      key,
      typeof value === "number" ? Math.round(value * 100) / 100 : value,
    ]),
  ) as Partial<DraftingCanvasLayer>;
}

function remapDraftingCanvasLayerForPaste(
  layer: DraftingCanvasLayer,
  options: {
    nodeId: string;
    offset: { x: number; y: number };
    zIndex: number;
  },
): DraftingCanvasLayer {
  const nextId = createDraftingLayerInstanceId(options.nodeId, layer.kind);

  return patchDraftingCanvasLayer(
    {
      ...cloneDraftingCanvasLayer(layer),
      children: layer.children?.map((child, index) =>
        remapDraftingCanvasLayerForPaste(child, {
          nodeId: options.nodeId,
          offset: { x: 0, y: 0 },
          zIndex: index,
        }),
      ),
      id: nextId,
      nodeId: options.nodeId,
      x: layer.x + options.offset.x,
      y: layer.y + options.offset.y,
      zIndex: options.zIndex,
    },
    {},
  );
}
