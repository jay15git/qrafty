"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
import { Group, Layer, Rect, Stage, Transformer } from "react-konva"
import type Konva from "konva"

import {
  DEFAULT_DRAFTING_CARD_STATE,
  type DraftingCardState,
} from "@/features/workspace/model/card-state"
import {
  clampLayerGeometryToCanvas,
  isProtectedDraftingLayerId,
  type DraftingCanvasLayer,
} from "@/features/workspace/model/layers"
import { cornerRadiiToCss } from "@/features/workspace/model/corner-radius"
import type { QrStudioState } from "@/features/qr-code/model/state"
import type { DraftingQrStateByLayerId } from "@/features/workspace/model/document"
import { createDefaultSceneComposition, type SceneCompositionState } from "@/features/workspace/model/scene-templates"
import { resolveKonvaLayers } from "@/features/workspace/konva/KonvaLayerNode"
import { KonvaPaneVisualArtboard } from "@/features/workspace/konva/KonvaPaneVisualArtboard"
import {
  getKonvaLayerPlacement,
  placementToLayerPatch,
} from "@/features/workspace/konva/konva-layer-placement"
import { resetNodeScaleToSize } from "@/features/workspace/konva/use-konva-image"
import { LayerFloatingToolbar } from "@/features/workspace/components/PaneLayerChrome"
import {
  FLOATING_TOOLBAR_GAP_PX,
  FLOATING_TOOLBAR_HEIGHT_PX,
  type DraftingLayerMenuAction,
} from "@/features/workspace/components/pane-layer-chrome.constants"
import { getCombinedLayerBounds } from "@/features/workspace/components/pane-layer-geometry"
import { cn } from "@/lib/utils"

export type KonvaPaneWorkspaceProps = {
  artboardZoom?: boolean
  cardState?: DraftingCardState
  interactionScale?: number
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
  state: QrStudioState
}

export function KonvaPaneWorkspace({
  artboardZoom = true,
  cardState = DEFAULT_DRAFTING_CARD_STATE,
  interactionScale = 1,
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
  state,
}: KonvaPaneWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const transformerRef = useRef<Konva.Transformer | null>(null)
  const [stageSize, setStageSize] = useState({ width: 1, height: 1 })
  const [editingTextLayerId, setEditingTextLayerId] = useState<string | null>(null)
  const [editingTextDraft, setEditingTextDraft] = useState("")
  const [textEditorRect, setTextEditorRect] = useState<{
    height: number
    left: number
    top: number
    width: number
  } | null>(null)

  const resolvedLayers = useMemo(
    () => resolveKonvaLayers(layers, cardState, state),
    [cardState, layers, state],
  )

  const visibleLayers = useMemo(
    () => resolvedLayers.filter((layer) => layer.isVisible).sort((a, b) => a.zIndex - b.zIndex),
    [resolvedLayers],
  )

  const activeSelectedLayerIds = selectedLayerIds ?? (selectedLayerId ? [selectedLayerId] : [])
  const selectedVisibleLayers = visibleLayers.filter((layer) =>
    activeSelectedLayerIds.includes(layer.id),
  )
  const combinedLayerBounds = getCombinedLayerBounds(selectedVisibleLayers)

  const runSelectedLayerAction = useCallback(
    (action: DraftingLayerMenuAction) => {
      if (selectedVisibleLayers.length === 0 || !onLayerAction) {
        return
      }

      onLayerAction(
        selectedVisibleLayers.map((layer) => layer.id),
        action,
      )
    },
    [onLayerAction, selectedVisibleLayers],
  )

  const runSelectedLayerCopy = useCallback(() => {
    if (selectedVisibleLayers.length === 0 || !onLayerCopy) {
      return
    }

    onLayerCopy(selectedVisibleLayers.map((layer) => layer.id))
  }, [onLayerCopy, selectedVisibleLayers])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      setStageSize({
        width: Math.max(1, Math.round(rect.width)),
        height: Math.max(1, Math.round(rect.height)),
      })
    }

    updateSize()

    const observer = new ResizeObserver(updateSize)
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  const attachTransformer = useCallback(() => {
    const transformer = transformerRef.current
    const stage = stageRef.current
    if (!transformer || !stage) {
      return
    }

    const selectedNodes = activeSelectedLayerIds
      .map((layerId) => stage.findOne(`#${layerId}`))
      .filter((node): node is Konva.Node => Boolean(node))
      .filter((node) => {
        const layerId = node.id()
        return layerId && !isProtectedDraftingLayerId(layerId)
      })

    transformer.nodes(selectedNodes)
    transformer.getLayer()?.batchDraw()
  }, [activeSelectedLayerIds])

  useEffect(() => {
    attachTransformer()
  }, [attachTransformer, visibleLayers, interactionScale, stageSize, activeSelectedLayerIds])

  const handleLayerSelect = useCallback(
    (layerId: string, additive: boolean) => {
      const layer = resolvedLayers.find((entry) => entry.id === layerId)
      if (!layer) {
        return
      }

      if (layer.kind === "qr") {
        onQrClick()
      }

      if (additive && onLayerSelectionChange) {
        const nextIds = activeSelectedLayerIds.includes(layerId)
          ? activeSelectedLayerIds.filter((id) => id !== layerId)
          : [...activeSelectedLayerIds, layerId]
        onLayerSelectionChange(nextIds, { additive: true })
        return
      }

      onLayerSelect?.(layerId)
      onSelect()
    },
    [
      activeSelectedLayerIds,
      onLayerSelect,
      onLayerSelectionChange,
      onQrClick,
      onSelect,
      resolvedLayers,
    ],
  )

  const constrainPatch = useCallback(
    (layer: DraftingCanvasLayer, patch: Partial<DraftingCanvasLayer>) => {
      if (layer.kind === "card") {
        return patch
      }

      const constrained = clampLayerGeometryToCanvas({ ...layer, ...patch }, cardState)
      const result = { ...patch }

      for (const key of ["height", "width", "x", "y"] as const) {
        if (key in patch) {
          result[key] = constrained[key]
        }
      }

      return result
    },
    [cardState],
  )

  const handleTransformEnd = useCallback(
    (layer: DraftingCanvasLayer) => (event: Konva.KonvaEventObject<Event>) => {
      if (!onLayerChange || layer.isLocked || isProtectedDraftingLayerId(layer.id)) {
        return
      }

      const node = event.target
      const { width, height } = resetNodeScaleToSize(node)
      const patch = placementToLayerPatch(
        {
          ...getKonvaLayerPlacement(layer, cardState.width, cardState.height),
          x: node.x(),
          y: node.y(),
          width,
          height,
          rotation: node.rotation(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
        },
        cardState.width,
        cardState.height,
      )

      onLayerChange(layer.id, constrainPatch(layer, patch))
    },
    [cardState.height, cardState.width, constrainPatch, onLayerChange],
  )

  const handleDragEnd = useCallback(
    (layer: DraftingCanvasLayer) => (event: Konva.KonvaEventObject<DragEvent>) => {
      if (!onLayerChange || layer.isLocked || isProtectedDraftingLayerId(layer.id)) {
        return
      }

      const node = event.target
      const patch = placementToLayerPatch(
        {
          ...getKonvaLayerPlacement(layer, cardState.width, cardState.height),
          x: node.x(),
          y: node.y(),
          width: layer.width,
          height: layer.height,
          rotation: node.rotation(),
          scaleX: node.scaleX(),
          scaleY: node.scaleY(),
        },
        cardState.width,
        cardState.height,
      )

      onLayerChange(layer.id, constrainPatch(layer, patch))
    },
    [cardState.height, cardState.width, constrainPatch, onLayerChange],
  )

  const openTextEditor = useCallback(
    (layer: DraftingCanvasLayer) => {
      const stage = stageRef.current
      const container = containerRef.current
      if (!stage || !container) {
        return
      }

      const node = stage.findOne(`#${layer.id}`)
      if (!node) {
        return
      }

      const rect = node.getClientRect()
      const containerRect = container.getBoundingClientRect()

      setEditingTextLayerId(layer.id)
      setEditingTextDraft(layer.text ?? "")
      setTextEditorRect({
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: Math.max(rect.height, (layer.fontSize ?? 32) * (layer.lineHeight ?? 1.22)),
      })

      onLayerSelect?.(layer.id)
      void containerRect
    },
    [onLayerSelect],
  )

  const commitTextEditor = useCallback(() => {
    if (!editingTextLayerId || !onLayerChange) {
      setEditingTextLayerId(null)
      setTextEditorRect(null)
      return
    }

    onLayerChange(editingTextLayerId, { text: editingTextDraft })
    setEditingTextLayerId(null)
    setTextEditorRect(null)
  }, [editingTextDraft, editingTextLayerId, onLayerChange])

  const artboardScale = interactionScale
  const artboardX = stageSize.width / 2
  const artboardY = stageSize.height / 2
  const floatingToolbarStyle =
    combinedLayerBounds && selectedVisibleLayers.length > 0
      ? {
          left: "50%",
          position: "absolute" as const,
          top: "50%",
          transform: `translate3d(${combinedLayerBounds.x + combinedLayerBounds.width / 2}px, ${combinedLayerBounds.y - FLOATING_TOOLBAR_GAP_PX - FLOATING_TOOLBAR_HEIGHT_PX}px, 0) translate(-50%, -100%) scale(${artboardScale})`,
          transformOrigin: "center center",
          zIndex: 30,
        }
      : undefined

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full touch-none overflow-hidden")}
      data-slot="desktop-compose-canvas"
      data-compose-mode="compose"
      data-renderer="konva"
      onPointerDown={() => onSelect()}
    >
      <KonvaPaneVisualArtboard
        activeSelectedLayerIds={activeSelectedLayerIds}
        cardState={cardState}
        interactionScale={artboardScale}
        layers={visibleLayers}
        onLayerSelect={(layerId, additive) => handleLayerSelect(layerId, additive)}
        qrStateByLayerId={qrStateByLayerId}
        state={state}
      />
      <div
        className="pointer-events-none absolute left-1/2 top-1/2"
        data-slot="desktop-compose-artboard"
        style={{
          borderRadius: cornerRadiiToCss(cardState.cornerRadii),
          height: cardState.height * artboardScale,
          transform: "translate(-50%, -50%)",
          width: cardState.width * artboardScale,
        }}
      />
      <Stage
        ref={stageRef}
        className="absolute inset-0 z-10"
        height={stageSize.height}
        onMouseDown={(event) => {
          if (event.target === event.target.getStage()) {
            onLayerSelect?.(null)
            onSelect()
          }
        }}
        width={stageSize.width}
      >
        <Layer>
          <Group
            clipHeight={cardState.height}
            clipWidth={cardState.width}
            clipX={0}
            clipY={0}
            offsetX={cardState.width / 2}
            offsetY={cardState.height / 2}
            scaleX={artboardScale}
            scaleY={artboardScale}
            x={artboardX}
            y={artboardY}
          >
            <Rect fill="transparent" height={cardState.height} listening={false} width={cardState.width} x={0} y={0} />
            {visibleLayers.map((layer) => {
              const placement = getKonvaLayerPlacement(layer, cardState.width, cardState.height)
              const isLayerSelected = activeSelectedLayerIds.includes(layer.id)
              const canTransform =
                !layer.isLocked &&
                !isProtectedDraftingLayerId(layer.id) &&
                Boolean(onLayerChange)

              return (
                <Group
                  key={layer.id}
                  draggable={canTransform}
                  height={layer.height}
                  id={layer.id}
                  name={layer.id}
                  offsetX={placement.offsetX}
                  offsetY={placement.offsetY}
                  onClick={(event) => {
                    event.cancelBubble = true
                    handleLayerSelect(
                      layer.id,
                      event.evt.shiftKey || event.evt.metaKey || event.evt.ctrlKey,
                    )
                  }}
                  onDblClick={() => {
                    if (layer.kind === "text") {
                      openTextEditor(layer)
                    }
                  }}
                  onDblTap={() => {
                    if (layer.kind === "text") {
                      openTextEditor(layer)
                    }
                  }}
                  onDragEnd={canTransform ? handleDragEnd(layer) : undefined}
                  onTap={(event) => {
                    event.cancelBubble = true
                    handleLayerSelect(
                      layer.id,
                      event.evt.shiftKey || event.evt.metaKey || event.evt.ctrlKey,
                    )
                  }}
                  onTransformEnd={canTransform ? handleTransformEnd(layer) : undefined}
                  opacity={layer.opacity}
                  rotation={placement.rotation}
                  scaleX={placement.scaleX}
                  scaleY={placement.scaleY}
                  width={layer.width}
                  x={placement.x}
                  y={placement.y}
                >
                  <Rect
                    fill="rgba(0,0,0,0.001)"
                    height={layer.height}
                    listening={false}
                    width={layer.width}
                    x={0}
                    y={0}
                  />
                  {isLayerSelected && canTransform ? (
                    <Rect
                      dash={[4, 4]}
                      height={layer.height}
                      listening={false}
                      stroke="#94a3b8"
                      strokeWidth={1}
                      width={layer.width}
                      x={0}
                      y={0}
                    />
                  ) : null}
                </Group>
              )
            })}
            <Transformer
              ref={transformerRef}
              boundBoxFunc={(oldBox, newBox) => {
                if (Math.abs(newBox.width) < 8 || Math.abs(newBox.height) < 8) {
                  return oldBox
                }
                return newBox
              }}
              flipEnabled={false}
              rotateEnabled
              enabledAnchors={[
                "top-left",
                "top-center",
                "top-right",
                "middle-left",
                "middle-right",
                "bottom-left",
                "bottom-center",
                "bottom-right",
              ]}
            />
          </Group>
        </Layer>
      </Stage>
      {editingTextLayerId && textEditorRect ? (
        <textarea
          autoFocus
          className="absolute z-20 resize-none border border-[var(--ws-resize-frame)] bg-white/95 p-1 text-[var(--ws-ink)] outline-none"
          onBlur={commitTextEditor}
          onChange={(event: FormEvent<HTMLTextAreaElement>) => {
            setEditingTextDraft(event.currentTarget.value)
          }}
          onKeyDown={(event: KeyboardEvent<HTMLTextAreaElement>) => {
            if (event.key === "Escape") {
              setEditingTextLayerId(null)
              setTextEditorRect(null)
              return
            }

            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              commitTextEditor()
            }
          }}
          style={{
            height: textEditorRect.height,
            left: textEditorRect.left,
            top: textEditorRect.top,
            width: textEditorRect.width,
          }}
          value={editingTextDraft}
        />
      ) : null}
      {floatingToolbarStyle ? (
        <LayerFloatingToolbar
          layers={selectedVisibleLayers}
          onAction={onLayerAction ? runSelectedLayerAction : undefined}
          onCopy={onLayerCopy ? runSelectedLayerCopy : undefined}
          onMore={() => undefined}
          style={floatingToolbarStyle}
        />
      ) : null}
    </div>
  )
}
