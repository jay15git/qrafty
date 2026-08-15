export type CanvasHistoryControls = {
  canRedo: boolean
  canUndo: boolean
  onRedo?: () => void
  onUndo?: () => void
}

export type CanvasQrControls = {
  canAdd: boolean
  onAdd?: () => void
}

export type DraftingPaneInteractionState = {
  canSwap: boolean
  isSelected: boolean
  isSnapTarget: boolean
}
