"use client";

import { useMemo, useRef } from "react";

import { useCanvasSurfaceReducer } from "@/features/canvas/components/canvas-reducer";
import { useCanvasScanSafety } from "@/features/canvas/components/use-canvas-scan-safety";
import { useCanvasPersistence } from "@/features/canvas/components/use-canvas-persistence";
import { useCanvasBoards } from "@/features/canvas/components/use-canvas-boards";
import { useCanvasActions } from "@/features/canvas/components/use-canvas-actions";
import { buildCanvasWorkspaceController } from "@/features/canvas/components/chrome-controller";
import { type CanvasBoardToolbarVariant } from "@/features/canvas/components/Canvas";
import type { ToolbarToolId } from "@/features/shell/model/toolbar-types";
import { createQrControls } from "@/features/canvas/canvas/qr-controls";

type CanvasSurfaceViewModelInput = {
  initialActiveTool?: ToolbarToolId;
  boardToolbarVariant: CanvasBoardToolbarVariant;
};

export function useCanvasViewModel({
  initialActiveTool,
  boardToolbarVariant,
}: CanvasSurfaceViewModelInput) {
  const [state, , setters] = useCanvasSurfaceReducer(initialActiveTool);
  const canvasRef = useRef<HTMLElement | null>(null);
  const qrControls = useMemo(() => createQrControls(setters), [setters]);
  const persistence = useCanvasPersistence({ qrControls, setters, state });
  const boards = useCanvasBoards({
    boardToolbarVariant,
    canvasQraftyState: persistence.canvasQraftyState,
    selectedContentValidation: persistence.selectedContentValidation,
    state,
  });
  const actions = useCanvasActions({
    boards,
    canvasRef,
    persistence,
    qrControls,
    setters,
    state,
  });
  const scanSafetyResult = useCanvasScanSafety({
    activeCanvasLayers: boards.activeCanvasLayers,
    activeQrLayerId: state.activeQrLayerId,
    activeQrNodeId: state.activeQrNodeId,
    canvasQraftyState: persistence.canvasQraftyState,
    qrCanvasLayers: boards.qrCanvasLayers,
    qrStateByLayerId: state.qrStateByLayerId,
    resolveTargetDimensions: actions.resolveWorkspaceExportTargetDimensions,
    selectedCardState: state.selectedCardState,
    selectedContentIsValid: persistence.selectedContentValidation.isValid,
    selectedDownloadExtension: state.selectedDownloadExtension,
    selectedDownloadTarget: state.selectedDownloadTarget,
  });
  const desktopController = buildCanvasWorkspaceController({
    actions,
    boardToolbarVariant,
    boards,
    persistence,
    qrControls,
    scanSafetyResult,
    setters,
    state,
  });

  return {
    activeQrNodeId: state.activeQrNodeId,
    desktopCanvasTool: state.desktopCanvasTool,
    desktopController,
    canvasRef,
    isCanvasWorkspaceReady: state.isCanvasWorkspaceReady,
    boards: boards.boards,
    selectedBackgroundShapeId: state.selectedBackgroundShapeId,
    selectedContentType: state.selectedContentType,
    selectedContentValue: persistence.selectedContentValue,
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
    handleBoardQrClick: actions.handleBoardQrClick,
    handleBoardSelection: actions.handleBoardSelection,
    pasteCanvasLayers: actions.pasteCanvasLayers,
    setDesktopCanvasTool: setters.setDesktopCanvasTool,
  };
}
