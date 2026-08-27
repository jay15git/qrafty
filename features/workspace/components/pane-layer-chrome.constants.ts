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

export const RESIZE_CONTROL_PADDING_PX = 4
export const ROTATE_HANDLE_OFFSET_PX = 28
export const ROTATE_LABEL_GAP_PX = 8
export const FLOATING_TOOLBAR_GAP_PX = 8
export const FLOATING_TOOLBAR_HEIGHT_PX = 48
export const FLOATING_TOOLBAR_MIN_WIDTH_PX = 192
export const FLOATING_TOOLBAR_EDGE_GUTTER_PX = 8
export const RESIZE_SNAP_THRESHOLD_PX = 3
export const CONTEXT_MENU_POINTER_OFFSET_PX = 8

export const RESIZE_CORNER_HANDLE_SIZE_PX = 8
export const RESIZE_CORNER_HIT_SIZE_PX = 16
export const RESIZE_EDGE_HIT_SIZE_PX = 8
export const ROTATE_HANDLE_RADIUS_PX = RESIZE_CORNER_HANDLE_SIZE_PX / 2
export const ROTATE_HANDLE_STEM_PX = ROTATE_HANDLE_OFFSET_PX + ROTATE_HANDLE_RADIUS_PX
