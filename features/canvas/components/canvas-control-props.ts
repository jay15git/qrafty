import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import type { CanvasLayerMenuAction } from "@/features/canvas/components/canvas-layer-chrome.constants";

export type CanvasBoardInteractionState = {
  canSwap: boolean;
  isSelected: boolean;
  isSnapTarget: boolean;
};

/** Layer-interaction callbacks shared by Canvas, CanvasBoard, and
 * the canvas board viewport props. */
export type CanvasLayerInteractionProps = {
  onLayerChange?: (layerId: string, patch: Partial<CanvasLayer>) => void;
  onLayerAction?: (layerIds: string[], action: CanvasLayerMenuAction) => void;
  onLayerCopy?: (layerIds: string[]) => void;
  onLayerPaste?: (point: { x: number; y: number }) => void;
  onLayerSelect?: (
    layerId: string | null,
    options?: { additive?: boolean; preserveActiveTool?: boolean },
  ) => void;
  onLayerSelectionChange?: (layerIds: string[], options?: { additive?: boolean }) => void;
};
