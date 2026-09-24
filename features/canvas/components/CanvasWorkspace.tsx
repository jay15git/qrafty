"use client";

import {
  DEFAULT_DRAFTING_CARD_STATE,
  type DraftingCardState,
} from "@/features/canvas/model/card-state";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import {
  CanvasLayerView,
  type CanvasLayerViewSharedProps,
} from "@/features/canvas/components/CanvasLayerViews";
import { type CanvasLayerMenuAction } from "@/features/canvas/components/canvas-layer-chrome.constants";
import type { ThemeMode } from "@/features/shell/components/WorkspaceChrome";
import type { QraftyState } from "@/features/qr/model/state";
import type { StaticQrValidationResult } from "@/features/qr/content/static-payload";
import type { DraftingQrStateByLayerId } from "@/features/canvas/model/document";
import {
  createDefaultSceneComposition,
  type SceneCompositionState,
} from "@/features/canvas/model/scene-templates";
import { CanvasWorkspaceInteractive } from "@/features/canvas/components/canvas-layer-a11y";
import { PreviewRuntimeProvider } from "@/features/canvas/preview/preview-context";
import {
  CanvasWorkspaceContent,
  type CanvasWorkspaceContentProps,
} from "@/features/canvas/components/canvas-workspace-chrome";
import { useCanvasWorkspaceInteractions } from "@/features/canvas/components/use-canvas-workspace-interactions";

export type CanvasWorkspaceProps = {
  activeQrLayerId?: string;
  cardState?: DraftingCardState;
  contentPan?: { x: number; y: number };
  contentOnlyZoom?: boolean;
  contentValidation?: StaticQrValidationResult;
  interactionScale?: number;
  viewFitScale?: number;
  isSelected: boolean;
  layers?: CanvasLayer[];
  onLayerAction?: (layerIds: string[], action: CanvasLayerMenuAction) => void;
  onLayerChange?: (layerId: string, patch: Partial<CanvasLayer>) => void;
  onLayerCopy?: (layerIds: string[]) => void;
  onLayerPaste?: (point: { x: number; y: number }) => void;
  onLayerSelect?: (layerId: string | null, options?: { additive?: boolean }) => void;
  onLayerSelectionChange?: (layerIds: string[], options?: { additive?: boolean }) => void;
  onSelect: () => void;
  onQrClick: () => void;
  qrStateByLayerId: DraftingQrStateByLayerId;
  sceneComposition?: SceneCompositionState;
  selectedLayerId?: string | null;
  selectedLayerIds?: string[];
  snapEnabled?: boolean;
  state: QraftyState;
  theme?: ThemeMode;
};

export function CanvasWorkspace({
  activeQrLayerId,
  cardState = DEFAULT_DRAFTING_CARD_STATE,
  contentPan,
  contentOnlyZoom = false,
  contentValidation,
  interactionScale = 1,
  viewFitScale = 1,
  snapEnabled = true,
  state,
  isSelected,
  layers,
  onLayerAction,
  onLayerChange,
  onLayerCopy,
  onLayerSelect,
  onLayerSelectionChange,
  onSelect,
  onQrClick,
  qrStateByLayerId,
  sceneComposition = createDefaultSceneComposition(),
  selectedLayerId,
  selectedLayerIds,
  theme = "dark",
}: CanvasWorkspaceProps) {
  const {
    activeSelectedLayerIdSet,
    activeSelectedLayerIds,
    artboardScale,
    canvasRef,
    cardImageStyle,
    cardLayers,
    cardStyle,
    chromeSnapGuides,
    chromeSpace,
    combinedLayerBounds,
    contentLayers,
    contentTransformStyle,
    contextMenu,
    contextMenuLayers,
    editingTextDraft,
    editingTextLayerId,
    hasError,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isLayerInteracting,
    isPaperShaderMode,
    marquee,
    multiSelectionPreview,
    preferLowPowerShaders,
    previewCameraStyle,
    previewStageBorderRadius,
    previewStageSize,
    qrOverlayScale,
    ratioMorph,
    rotatingLayerId,
    rotationPreviewDegrees,
    selectedVisibleLayers,
    selectedVisibleLayerIds,
    snapGuideClipBounds,
    suppressCanvasClickRef,
    registerTextEditor,
    toolbarRef,
    toolbarWidth,
    canvasHeight,
    canvasWidth,
    visibleLayers,
    activateLayerSelection,
    commitEditingTextDraft,
    closeContextMenu,
    endLayerInteraction,
    endMarqueeSelection,
    handleTextEditorInput,
    openCanvasContextMenu,
    openFloatingLayerContextMenu,
    openLayerContextMenu,
    runLayerAction,
    runSelectedLayerAction,
    runSelectedLayerCopy,
    selectLayerFromClick,
    startLayerInteraction,
    startMarqueeSelection,
    startMultiLayerInteraction,
    startTextEditing,
    updateLayerInteraction,
    updateMarqueeSelection,
  } = useCanvasWorkspaceInteractions({
    activeQrLayerId,
    cardState,
    contentPan,
    contentOnlyZoom,
    contentValidation,
    interactionScale,
    viewFitScale,
    snapEnabled,
    state,
    isSelected,
    layers,
    onLayerAction,
    onLayerChange,
    onLayerCopy,
    onLayerSelect,
    onLayerSelectionChange,
    onSelect,
    onQrClick,
    qrStateByLayerId,
    sceneComposition,
    selectedLayerId,
    selectedLayerIds,
    theme,
  });

  const layerViewSharedProps: CanvasLayerViewSharedProps = {
    activeQrLayerId,
    activeSelectedLayerIdSet,
    cardImageStyle,
    cardState,
    cardStyle,
    contentValidation,
    imageFilterShader,
    isImageFilterMode,
    isImageMode,
    isPaperShaderMode,
    qrOverlayScale,
    qrStateByLayerId,
    state,
  };

  function renderLayerView(layer: CanvasLayer) {
    return (
      <CanvasLayerView
        key={layer.id}
        {...layerViewSharedProps}
        editingTextDraft={editingTextDraft}
        editingTextLayerId={editingTextLayerId}
        layer={layer}
        onCommitEditingTextDraft={commitEditingTextDraft}
        onEndLayerInteraction={endLayerInteraction}
        onHandleTextEditorInput={handleTextEditorInput}
        onOpenLayerContextMenu={openLayerContextMenu}
        onActivateLayerSelection={activateLayerSelection}
        onSelectLayerFromClick={selectLayerFromClick}
        onStartLayerInteraction={startLayerInteraction}
        onStartTextEditing={startTextEditing}
        onUpdateLayerInteraction={updateLayerInteraction}
        onRegisterTextEditor={registerTextEditor}
      />
    );
  }

  const canvasContentProps: CanvasWorkspaceContentProps = {
    activeSelectedLayerIdSet,
    activeSelectedLayerIds,
    canvasHeight,
    canvasWidth,
    cardLayers,
    cardState,
    chromeSnapGuides,
    chromeSpace,
    combinedLayerBounds,
    contentLayers,
    contentOnlyZoom,
    contentTransformStyle,
    contextMenu,
    contextMenuLayers,
    editingTextLayerId,
    isImageFilterMode,
    isImageMode,
    isLayerInteracting,
    isPaperShaderMode,
    marquee,
    multiSelectionPreview,
    onCloseContextMenu: closeContextMenu,
    onLayerAction,
    onLayerChange,
    onLayerCopy,
    onEndLayerInteraction: endLayerInteraction,
    onOpenFloatingLayerContextMenu: openFloatingLayerContextMenu,
    onOpenLayerContextMenu: openLayerContextMenu,
    onRunLayerAction: runLayerAction,
    onRunSelectedLayerAction: runSelectedLayerAction,
    onRunSelectedLayerCopy: runSelectedLayerCopy,
    onStartLayerInteraction: startLayerInteraction,
    onStartMultiLayerInteraction: startMultiLayerInteraction,
    onUpdateLayerInteraction: updateLayerInteraction,
    previewCameraStyle,
    previewStageBorderRadius,
    previewStageSize,
    renderLayerView,
    rotatingLayerId,
    rotationPreviewDegrees,
    sceneLayout: sceneComposition.layout,
    selectedVisibleLayers,
    selectedVisibleLayerIds,
    snapGuideClipBounds,
    theme,
    toolbarRef,
    toolbarWidth,
    visibleLayers,
  };

  return (
    <PreviewRuntimeProvider
      artboardScale={artboardScale}
      preferLowPowerShaders={preferLowPowerShaders}
    >
      <CanvasWorkspaceInteractive
        data-slot="qr-board"
        data-selected={isSelected ? "true" : "false"}
        className="relative flex h-full w-full flex-col items-center justify-center overflow-visible"
        label="QR board"
        onActivate={onSelect}
        onClick={(e) => {
          // Only select if clicking the board background, not the QR itself
          if (e.target === e.currentTarget) {
            onSelect();
          }
        }}
      >
        <CanvasWorkspaceInteractive
          ref={canvasRef}
          data-slot="canvas"
          data-compose-mode="compose"
          data-ratio-morph={ratioMorph.active ? "true" : "false"}
          className="relative h-full w-full overflow-visible"
          label="Compose canvas"
          onActivate={() => {
            onLayerSelect?.(null);
            onSelect();
          }}
          onClick={(event) => {
            if (suppressCanvasClickRef.current) {
              event.preventDefault();
              event.stopPropagation();
              suppressCanvasClickRef.current = false;
              return;
            }

            onLayerSelect?.(null);
            onSelect();
          }}
          onContextMenu={openCanvasContextMenu}
          onPointerCancel={endMarqueeSelection}
          onPointerDown={startMarqueeSelection}
          onPointerMove={updateMarqueeSelection}
          onPointerUp={endMarqueeSelection}
        >
          {hasError ? (
            <div className="grid h-full place-items-center text-sm font-medium text-[var(--canvas-ink-muted)]">
              Could not generate QR
            </div>
          ) : (
            <CanvasWorkspaceContent {...canvasContentProps} />
          )}
        </CanvasWorkspaceInteractive>
      </CanvasWorkspaceInteractive>
    </PreviewRuntimeProvider>
  );
}
