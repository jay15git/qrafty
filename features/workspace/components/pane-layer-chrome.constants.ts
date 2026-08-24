import type {
  DraftingLayerAlignAction,
  DraftingLayerDistributeAction,
  DraftingLayerReorderAction,
} from "@/features/workspace/model/layers"

export type DraftingLayerMenuAction =
  | DraftingLayerAlignAction
  | DraftingLayerDistributeAction
  | DraftingLayerReorderAction
  | "delete"
  | "group"
  | "reset-rotation"
  | "ungroup"

export const RESIZE_CONTROL_PADDING_PX = 12
export const ROTATE_HANDLE_OFFSET_PX = 34
export const ROTATE_LABEL_GAP_PX = 8
export const FLOATING_TOOLBAR_GAP_PX = 16
export const FLOATING_TOOLBAR_HEIGHT_PX = 48
export const FLOATING_TOOLBAR_EDGE_GUTTER_PX = 12
export const RESIZE_SNAP_THRESHOLD_PX = 3
export const CONTEXT_MENU_POINTER_OFFSET_PX = 8

export const RESIZE_CORNER_HANDLE_SIZE_PX = 12
export const RESIZE_EDGE_HIT_SIZE_PX = 6
export const ROTATE_HANDLE_RADIUS_PX = RESIZE_CORNER_HANDLE_SIZE_PX / 2
