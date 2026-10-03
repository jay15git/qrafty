"use client";

import { useRef } from "react";

import { useCanvasSurfaceReducer } from "@/features/canvas/components/canvas-reducer";
import { useActiveQr } from "@/features/canvas/components/use-active-qr";
import { useCanvasBoards } from "@/features/canvas/components/use-canvas-boards";
import { useCanvasActions } from "@/features/canvas/components/use-canvas-actions";
import { buildCanvasWorkspaceController } from "@/features/canvas/components/chrome-controller";
import type { SettingsToolId } from "@/features/shell/model/settings-model";

type CanvasSurfaceViewModelInput = {
  initialActiveTool?: SettingsToolId;
};

export function useCanvasViewModel({ initialActiveTool }: CanvasSurfaceViewModelInput) {
  const [state, dispatch, setters] = useCanvasSurfaceReducer(initialActiveTool);
  const canvasRef = useRef<HTMLElement | null>(null);
  const activeQr = useActiveQr({ dispatch, state });
  const boards = useCanvasBoards({
    canvasQraftyState: activeQr.canvasQraftyState,
    selectedContentValidation: activeQr.selectedContentValidation,
    state,
  });
  const actions = useCanvasActions({
    activeQr,
    boards,
    canvasRef,
    setters,
    state,
  });
  const desktopController = buildCanvasWorkspaceController({
    actions,
    boards,
    activeQr,
    setters,
    state,
  });

  return {
    desktopController,
    canvasRef,
    boards: boards.boards,
    selectedContentValue: activeQr.selectedContentValue,
    selectedLayerId: state.selectedLayerId,
    selectedLayerIds: state.selectedLayerIds,
    copySelectedCanvasLayers: actions.copySelectedCanvasLayers,
    handleLayerAction: actions.handleLayerAction,
    handleLayerChange: actions.handleLayerChange,
    handleLayerSelect: actions.handleLayerSelect,
    handleLayerSelectionChange: actions.handleLayerSelectionChange,
    handleBoardSelection: actions.handleBoardSelection,
    pasteCanvasLayers: actions.pasteCanvasLayers,
  };
}
