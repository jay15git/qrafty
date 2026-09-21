import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { DraftingLayerMenuAction } from "@/features/workspace/components/pane-layer-chrome.constants"

export type DraftingPaneInteractionState = {
  canSwap: boolean
  isSelected: boolean
  isSnapTarget: boolean
}

/** Layer-interaction callbacks shared by Canvas, DraftingPaneSurface, and
 * the drafting pane viewport props. */
export type DraftingLayerInteractionProps = {
  onLayerChange?: (
    paneId: string,
    layerId: string,
    patch: Partial<DraftingCanvasLayer>,
  ) => void
  onLayerAction?: (
    paneId: string,
    layerIds: string[],
    action: DraftingLayerMenuAction,
  ) => void
  onLayerCopy?: (paneId: string, layerIds: string[]) => void
  onLayerPaste?: (paneId: string, point: { x: number; y: number }) => void
  onLayerSelect?: (
    paneId: string,
    layerId: string | null,
    options?: { additive?: boolean },
  ) => void
  onLayerSelectionChange?: (
    paneId: string,
    layerIds: string[],
    options?: { additive?: boolean },
  ) => void
}
