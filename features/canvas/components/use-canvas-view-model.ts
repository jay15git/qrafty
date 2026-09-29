"use client";

import { useRef } from "react";

import { useCanvasSurfaceReducer } from "@/features/canvas/components/canvas-reducer";
import { useCanvasScanSafety } from "@/features/canvas/components/use-canvas-scan-safety";
import { useActiveQr } from "@/features/canvas/components/use-active-qr";
import { useCanvasBoards } from "@/features/canvas/components/use-canvas-boards";
import { useCanvasActions } from "@/features/canvas/components/use-canvas-actions";
import { buildCanvasWorkspaceController } from "@/features/canvas/components/chrome-controller";
import { type CanvasBoardToolbarVariant } from "@/features/canvas/components/Canvas";
import type { SettingsToolId } from "@/features/shell/model/settings-model";

type CanvasSurfaceViewModelInput = {
  initialActiveTool?: SettingsToolId;
  boardToolbarVariant: CanvasBoardToolbarVariant;
};

export function useCanvasViewModel({
  initialActiveTool,
  boardToolbarVariant,
}: CanvasSurfaceViewModelInput) {
  const [state, dispatch, setters] = useCanvasSurfaceReducer(initialActiveTool);
  const canvasRef = useRef<HTMLElement | null>(null);
  const activeQr = useActiveQr({ dispatch, state });
  const boards = useCanvasBoards({
    boardToolbarVariant,
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
    desktopCanvasTool: state.desktopCanvasTool,
    desktopController,
    canvasRef,
    boards: boards.boards,
    selectedBackgroundShapeId: state.selectedBackgroundShapeId,
    selectedContentType: state.selectedContentType,
    selectedContentValue: activeQr.selectedContentValue,
    selectedLayerId: state.selectedLayerId,
    selectedLayerIds: state.selectedLayerIds,
    selectedLogoColorMode: state.selectedLogoColorMode,
    selectedLogoPresetId: state.selectedLogoPresetId,
    selectedLogoPresetValue: state.selectedLogoPresetValue,
    selectedLogoSourceMode: state.selectedLogoSourceMode,
    selectedQrErrorCorrectionLevel: state.selectedQrErrorCorrectionLevel,
    selectedQrMargin: state.selectedQrMargin,
    selectedQrRadius: state.selectedQrRadius,
    selectedQrSize: state.selectedQrSize,
    selectedQrTypeNumber: state.selectedQrTypeNumber,
    copySelectedCanvasLayers: actions.copySelectedCanvasLayers,
    handleAddTextLayerAt: actions.handleAddTextLayerAt,
    handleLayerAction: actions.handleLayerAction,
    handleLayerChange: actions.handleLayerChange,
    handleLayerSelect: actions.handleLayerSelect,
    handleLayerSelectionChange: actions.handleLayerSelectionChange,
    handleBoardSelection: actions.handleBoardSelection,
    pasteCanvasLayers: actions.pasteCanvasLayers,
    setDesktopCanvasTool: setters.setDesktopCanvasTool,
  };
}
