"use client";

import { useRef } from "react";

import { useCanvasSurfaceReducer } from "@/features/canvas/components/canvas-reducer";
import { useCanvasScanSafety } from "@/features/canvas/components/use-canvas-scan-safety";
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
  const scanSafetyResult = useCanvasScanSafety({
    activeCanvasLayers: boards.activeCanvasLayers,
    activeQrLayerId: state.activeQrLayerId,
    canvasQraftyState: activeQr.canvasQraftyState,
    qrCanvasLayers: boards.qrCanvasLayers,
    qrStateByLayerId: state.qrStateByLayerId,
    resolveTargetDimensions: actions.resolveWorkspaceExportTargetDimensions,
    selectedCardState: state.selectedCardState,
    selectedContentIsValid: activeQr.selectedContentValidation.isValid,
    selectedDownloadExtension: state.selectedDownloadExtension,
    selectedDownloadTarget: state.selectedDownloadTarget,
  });
  const desktopController = buildCanvasWorkspaceController({
    actions,
    boards,
    activeQr,
    scanSafetyResult,
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
