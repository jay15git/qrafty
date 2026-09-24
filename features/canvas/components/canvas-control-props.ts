import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import type { CanvasLayerMenuAction } from "@/features/canvas/components/canvas-layer-chrome.constants";

export type CanvasBoardInteractionState = {
  canSwap: boolean;
  isSelected: boolean;
  isSnapTarget: boolean;
};

/** Layer-interaction callbacks shared by Canvas, CanvasBoard, and
 * the drafting board viewport props. */
export type CanvasLayerInteractionProps = {
  onLayerChange?: (boardId: string, layerId: string, patch: Partial<CanvasLayer>) => void;
  onLayerAction?: (boardId: string, layerIds: string[], action: CanvasLayerMenuAction) => void;
  onLayerCopy?: (boardId: string, layerIds: string[]) => void;
  onLayerPaste?: (boardId: string, point: { x: number; y: number }) => void;
  onLayerSelect?: (
    boardId: string,
    layerId: string | null,
    options?: { additive?: boolean },
  ) => void;
  onLayerSelectionChange?: (
    boardId: string,
    layerIds: string[],
    options?: { additive?: boolean },
  ) => void;
};
