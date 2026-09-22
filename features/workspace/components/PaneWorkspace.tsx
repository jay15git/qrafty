"use client"

import {
  DEFAULT_DRAFTING_CARD_STATE,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import {
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import {
  PaneLayerView,
  type PaneLayerViewSharedProps,
} from "@/features/workspace/components/PaneLayerViews"
import {
  type DraftingLayerMenuAction,
} from "@/features/workspace/components/pane-layer-chrome.constants"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import type { QraftyState } from "@/features/qr-code/model/state"
import type { StaticQrValidationResult } from "@/features/qr-code/content/static-payload"
import type { DraftingQrStateByLayerId } from "@/features/workspace/model/document"
import { createDefaultSceneComposition, type SceneCompositionState } from "@/features/workspace/model/scene-templates"
import { PaneSurfaceInteractive } from "@/features/workspace/components/pane-layer-a11y"
import { PreviewRuntimeProvider } from "@/features/workspace/preview/preview-context"
import {
  PaneCanvasContent,
  type PaneCanvasContentProps,
} from "@/features/workspace/components/pane-workspace-chrome"
import { usePaneWorkspaceInteractions } from "@/features/workspace/components/use-pane-workspace-interactions"

export type PaneWorkspaceProps = {
  activeQrLayerId?: string
  cardState?: DraftingCardState
  contentPan?: { x: number; y: number }
  contentOnlyZoom?: boolean
  contentValidation?: StaticQrValidationResult
  interactionScale?: number
  viewFitScale?: number
  isSelected: boolean
  layers?: DraftingCanvasLayer[]
  onLayerAction?: (layerIds: string[], action: DraftingLayerMenuAction) => void
  onLayerChange?: (layerId: string, patch: Partial<DraftingCanvasLayer>) => void
  onLayerCopy?: (layerIds: string[]) => void
  onLayerPaste?: (point: { x: number; y: number }) => void
  onLayerSelect?: (layerId: string | null, options?: { additive?: boolean }) => void
  onLayerSelectionChange?: (layerIds: string[], options?: { additive?: boolean }) => void
  onSelect: () => void
  onQrClick: () => void
  qrStateByLayerId: DraftingQrStateByLayerId
  sceneComposition?: SceneCompositionState
  selectedLayerId?: string | null
  selectedLayerIds?: string[]
  snapEnabled?: boolean
  state: QraftyState
  theme?: DesktopThemeMode
}

export function PaneWorkspace({
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
}: PaneWorkspaceProps) {
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
    textEditorRefs,
    toolbarRef,
    toolbarWidth,
    canvasHeight,
    canvasWidth,
    visibleLayers,
    activateLayerSelection,
    commitEditingTextDraft,
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
  } = usePaneWorkspaceInteractions({
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
  })

  const layerViewSharedProps: PaneLayerViewSharedProps = {
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
  }

  function renderLayerView(layer: DraftingCanvasLayer) {
    return (
      <PaneLayerView
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
        textEditorRefs={textEditorRefs}
      />
    )
  }

  const canvasContentProps: PaneCanvasContentProps = {
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
  }

  return (
    <PreviewRuntimeProvider
      artboardScale={artboardScale}
      preferLowPowerShaders={preferLowPowerShaders}
    >
    <PaneSurfaceInteractive
      data-slot="qr-pane"
      data-selected={isSelected ? "true" : "false"}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-visible"
      label="QR pane"
      onActivate={onSelect}
      onClick={(e) => {
        // Only select if clicking the pane background, not the QR itself
        if (e.target === e.currentTarget) {
          onSelect()
        }
      }}
    >
      <PaneSurfaceInteractive
        ref={canvasRef}
        data-slot="desktop-compose-canvas"
        data-compose-mode="compose"
        data-ratio-morph={ratioMorph.active ? "true" : "false"}
        className="relative h-full w-full overflow-visible"
        label="Compose canvas"
        onActivate={() => {
          onLayerSelect?.(null)
          onSelect()
        }}
        onClick={(event) => {
          if (suppressCanvasClickRef.current) {
            event.preventDefault()
            event.stopPropagation()
            suppressCanvasClickRef.current = false
            return
          }

          onLayerSelect?.(null)
          onSelect()
        }}
        onContextMenu={openCanvasContextMenu}
        onPointerCancel={endMarqueeSelection}
        onPointerDown={startMarqueeSelection}
        onPointerMove={updateMarqueeSelection}
        onPointerUp={endMarqueeSelection}
      >
        {hasError ? (
          <div className="grid h-full place-items-center text-sm font-medium text-[var(--ws-ink-muted)]">
            Could not generate QR
          </div>
        ) : (
          <PaneCanvasContent {...canvasContentProps} />
        )}
      </PaneSurfaceInteractive>
    </PaneSurfaceInteractive>
    </PreviewRuntimeProvider>
  )
}
