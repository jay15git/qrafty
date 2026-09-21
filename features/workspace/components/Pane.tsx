"use client"

import { memo } from "react"

import { PaneWorkspace, type PaneWorkspaceProps } from "@/features/workspace/components/PaneWorkspace"

export type { DraftingLayerMenuAction } from "@/features/workspace/components/pane-layer-chrome.constants"

type PaneProps = PaneWorkspaceProps

const PANE_MEMO_COMPARE_KEYS = [
  "cardState",
  "sceneComposition",
  "isSelected",
  "viewFitScale",
  "contentOnlyZoom",
  "interactionScale",
  "layers",
  "qrStateByLayerId",
  "contentValidation",
  "activeQrLayerId",
  "onLayerAction",
  "selectedLayerId",
  "selectedLayerIds",
  "snapEnabled",
] as const satisfies readonly (keyof PaneProps)[]

export const Pane = memo(function Pane(props: PaneProps) {
  return <PaneWorkspace {...props} />
},
(previousProps, nextProps) =>
  PANE_MEMO_COMPARE_KEYS.every((key) => previousProps[key] === nextProps[key]) &&
  previousProps.contentPan?.x === nextProps.contentPan?.x &&
  previousProps.contentPan?.y === nextProps.contentPan?.y,
)
