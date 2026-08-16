"use client"

import { memo } from "react"

import { PaneWorkspace, type PaneWorkspaceProps } from "@/features/workspace/components/PaneWorkspace"

export type { ResizeDirection } from "@/features/workspace/components/pane-layer-geometry"
export { resizeDraftingLayer } from "@/features/workspace/components/pane-layer-geometry"
export type { DraftingLayerMenuAction } from "@/features/workspace/components/pane-layer-chrome.constants"

type PaneProps = PaneWorkspaceProps

export const Pane = memo(function Pane(props: PaneProps) {
  return <PaneWorkspace {...props} />
},
(previousProps, nextProps) =>
  previousProps.cardState === nextProps.cardState &&
  previousProps.sceneComposition === nextProps.sceneComposition &&
  previousProps.state === nextProps.state &&
  previousProps.isSelected === nextProps.isSelected &&
  previousProps.interactionScale === nextProps.interactionScale &&
  previousProps.layers === nextProps.layers &&
  previousProps.qrStateByLayerId === nextProps.qrStateByLayerId &&
  previousProps.onLayerAction === nextProps.onLayerAction &&
  previousProps.selectedLayerId === nextProps.selectedLayerId &&
  previousProps.selectedLayerIds === nextProps.selectedLayerIds &&
  previousProps.snapEnabled === nextProps.snapEnabled,
)
