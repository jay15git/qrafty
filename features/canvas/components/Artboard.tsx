"use client";

import { memo } from "react";

import {
  CanvasWorkspace,
  type CanvasWorkspaceProps,
} from "@/features/canvas/components/CanvasWorkspace";

export type { CanvasLayerMenuAction } from "@/features/canvas/components/canvas-layer-chrome.constants";

type ArtboardProps = CanvasWorkspaceProps;

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
  "theme",
] as const satisfies readonly (keyof ArtboardProps)[];

export const Artboard = memo(
  function Artboard(props: ArtboardProps) {
    return <CanvasWorkspace {...props} />;
  },
  (previousProps, nextProps) =>
    PANE_MEMO_COMPARE_KEYS.every((key) => previousProps[key] === nextProps[key]) &&
    previousProps.contentPan?.x === nextProps.contentPan?.x &&
    previousProps.contentPan?.y === nextProps.contentPan?.y,
);
