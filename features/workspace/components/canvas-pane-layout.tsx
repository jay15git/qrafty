"use client"

import { useCallback, useRef, useState } from "react"

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  DraftingPaneSurface,
  type DraftingPane,
  type DraftingPaneCanvasTool,
  type DraftingPaneToolbarVariant,
} from "@/features/workspace/components/DraftingPaneSurface"
import { type DraftingLayerMenuAction } from "@/features/workspace/components/Pane"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { QrLayout } from "@/features/workspace/model/layout-engine"
import { cn } from "@/lib/utils"

type DraftingPanelLayouts = Record<string, Record<string, number>>
type DraftingPanePanOffsets = Record<string, { x: number; y: number }>

function groupPanes<T>(panes: T[], groups: number[]) {
  let start = 0

  return groups.map((groupSize) => {
    const group = panes.slice(start, start + groupSize)
    start += groupSize
    return group
  })
}

function DraftingResizeHandle() {
  return (
    <ResizableHandle
      data-slot="drafting-resize-handle"
      className={cn(
        "z-10 bg-[var(--ws-line)] transition-colors duration-150 hover:bg-[var(--ws-line-hover)] active:bg-[var(--ws-line-strong)]",
        "focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-0",
        "after:w-5 after:bg-transparent aria-[orientation=horizontal]:after:h-5 aria-[orientation=horizontal]:after:bg-transparent",
        "before:absolute before:left-1/2 before:top-1/2 before:z-10 before:h-7 before:w-px before:-translate-x-1/2 before:-translate-y-1/2 before:bg-[var(--ws-ink-muted)] before:opacity-45 before:content-['']",
        "aria-[orientation=horizontal]:before:h-px aria-[orientation=horizontal]:before:w-7",
      )}
    />
  )
}

type CanvasPaneLayoutProps = {
  activeCanvasTool?: DraftingPaneCanvasTool | null
  activePaneId: string
  canSwapPanes: boolean
  draggingPaneId: string | null
  fitCanvasToViewport?: boolean
  layerEditingEnabled?: boolean
  layout: QrLayout
  layoutKey: string
  nestedOrientation: "horizontal" | "vertical"
  onAddTextLayerAt?: (paneId: string, point: { x: number; y: number }) => void
  onCanvasToolChange?: (tool: DraftingPaneCanvasTool | null) => void
  onLayerAction?: (
    paneId: string,
    layerIds: string[],
    action: DraftingLayerMenuAction,
  ) => void
  onLayerChange?: (
    paneId: string,
    layerId: string,
    patch: Partial<DraftingCanvasLayer>,
  ) => void
  onLayerCopy?: (paneId: string, layerIds: string[]) => void
  onLayerPaste?: (paneId: string, point: { x: number; y: number }) => void
  onLayerSelect?: (
    paneId: string,
    layerId: string | null,
    options?: { additive?: boolean },
  ) => void
  onLayerSelectionChange?: (
    paneId: string,
    layerIds: string[],
    options?: { additive?: boolean },
  ) => void
  onPaneDragEnd: () => void
  onPaneDragLeave: (paneId: string, event: React.DragEvent<HTMLDivElement>) => void
  onPaneDragOver: (paneId: string, event: React.DragEvent<HTMLDivElement>) => void
  onPaneDragStart: (paneId: string, event: React.DragEvent<HTMLDivElement>) => void
  onPaneDrop: (paneId: string, event: React.DragEvent<HTMLDivElement>) => void
  onPanePan: (paneId: string, nextPan: { x: number; y: number }) => void
  onPaneQrClick: (paneId: string) => void
  onPaneSelect: (paneId: string) => void
  onPaneZoom: (paneId: string, nextZoom: number) => void
  onPanelLayoutChange: (groupId: string) => (nextLayout: Record<string, number>) => void
  panOffsets: DraftingPanePanOffsets
  panelLayouts: DraftingPanelLayouts
  previewLocked?: boolean
  rootPanelGroupId: string
  selectedLayerId?: string | null
  selectedLayerIds?: string[]
  showCanvasGrid?: boolean
  snapEnabled: boolean
  snapTargetPaneId: string | null
  toolbarVariant?: DraftingPaneToolbarVariant
  topLevelOrientation: "horizontal" | "vertical"
  visiblePanes: DraftingPane[]
  zoomLevels: Record<string, number>
}

export function useCanvasPaneDrag({
  canSwapPanes,
  onSwapPanes,
}: {
  canSwapPanes: boolean
  onSwapPanes?: (sourcePaneId: string, targetPaneId: string) => void
}) {
  const [draggingPaneId, setDraggingPaneId] = useState<string | null>(null)
  const [snapTargetPaneId, setSnapTargetPaneId] = useState<string | null>(null)
  const draggingPaneIdRef = useRef<string | null>(null)

  const handlePaneDragStart = useCallback(
    (paneId: string, event: React.DragEvent<HTMLDivElement>) => {
      if (!canSwapPanes) {
        event.preventDefault()
        return
      }

      event.dataTransfer.effectAllowed = "move"
      event.dataTransfer.setData("text/plain", paneId)
      draggingPaneIdRef.current = paneId
      setDraggingPaneId(paneId)
      setSnapTargetPaneId(null)
    },
    [canSwapPanes],
  )

  const handlePaneDragOver = useCallback(
    (paneId: string, event: React.DragEvent<HTMLDivElement>) => {
      const sourcePaneId =
        draggingPaneIdRef.current || draggingPaneId || event.dataTransfer.getData("text/plain")

      if (!sourcePaneId || sourcePaneId === paneId) {
        return
      }

      event.preventDefault()
      event.dataTransfer.dropEffect = "move"
      setSnapTargetPaneId(paneId)
    },
    [draggingPaneId],
  )

  const handlePaneDragLeave = useCallback(
    (paneId: string, event: React.DragEvent<HTMLDivElement>) => {
      if (
        snapTargetPaneId === paneId &&
        event.relatedTarget instanceof Node &&
        event.currentTarget.contains(event.relatedTarget)
      ) {
        return
      }

      setSnapTargetPaneId((current) => (current === paneId ? null : current))
    },
    [snapTargetPaneId],
  )

  const handlePaneDrop = useCallback(
    (targetPaneId: string, event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()

      const sourcePaneId =
        draggingPaneIdRef.current || draggingPaneId || event.dataTransfer.getData("text/plain")

      draggingPaneIdRef.current = null
      setDraggingPaneId(null)
      setSnapTargetPaneId(null)

      if (!sourcePaneId || sourcePaneId === targetPaneId) {
        return
      }

      onSwapPanes?.(sourcePaneId, targetPaneId)
    },
    [draggingPaneId, onSwapPanes],
  )

  const handlePaneDragEnd = useCallback(() => {
    draggingPaneIdRef.current = null
    setDraggingPaneId(null)
    setSnapTargetPaneId(null)
  }, [])

  return {
    draggingPaneId,
    snapTargetPaneId,
    handlePaneDragEnd,
    handlePaneDragLeave,
    handlePaneDragOver,
    handlePaneDragStart,
    handlePaneDrop,
  }
}

export function CanvasPaneLayout({
  activeCanvasTool,
  activePaneId,
  canSwapPanes,
  draggingPaneId,
  fitCanvasToViewport = false,
  layerEditingEnabled = true,
  layout,
  layoutKey,
  nestedOrientation,
  onAddTextLayerAt,
  onCanvasToolChange,
  onLayerAction,
  onLayerChange,
  onLayerCopy,
  onLayerPaste,
  onLayerSelect,
  onLayerSelectionChange,
  onPaneDragEnd,
  onPaneDragLeave,
  onPaneDragOver,
  onPaneDragStart,
  onPaneDrop,
  onPanePan,
  onPaneQrClick,
  onPaneSelect,
  onPaneZoom,
  onPanelLayoutChange,
  panOffsets,
  panelLayouts,
  previewLocked = false,
  rootPanelGroupId,
  selectedLayerId,
  selectedLayerIds,
  showCanvasGrid = true,
  snapEnabled,
  snapTargetPaneId,
  toolbarVariant,
  topLevelOrientation,
  visiblePanes,
  zoomLevels,
}: CanvasPaneLayoutProps) {
  return (
    <ResizablePanelGroup
      className="h-full w-full"
      data-layout-direction={layout.direction}
      data-resize-orientation={topLevelOrientation}
      data-slot="drafting-pane-layout"
      defaultLayout={panelLayouts[rootPanelGroupId]}
      id={rootPanelGroupId}
      onLayoutChange={onPanelLayoutChange(rootPanelGroupId)}
      orientation={topLevelOrientation}
    >
      {groupPanes(visiblePanes, layout.groups).flatMap((group, groupIndex) => {
        const groupPanelId = `group-${groupIndex}`
        const nestedPanelGroupId = `drafting-pane-layout-${layoutKey}-group-${groupIndex}`
        const groupPanel = (
          <ResizablePanel
            data-layout-group={groupIndex}
            data-layout-group-size={group.length}
            defaultSize={100 / layout.groups.length}
            id={groupPanelId}
            key={groupPanelId}
            minSize={12}
          >
            <ResizablePanelGroup
              className="h-full w-full"
              data-resize-orientation={nestedOrientation}
              defaultLayout={panelLayouts[nestedPanelGroupId]}
              id={nestedPanelGroupId}
              onLayoutChange={onPanelLayoutChange(nestedPanelGroupId)}
              orientation={nestedOrientation}
            >
              {group.flatMap((pane, paneIndex) => {
                const isSelected = pane.id === activePaneId
                const panePan = panOffsets[pane.id] ?? { x: 0, y: 0 }
                const paneZoom = zoomLevels[pane.id] ?? 1
                const panePanelId = `pane-${groupIndex}-${paneIndex}`

                const panePanel = (
                  <ResizablePanel
                    className="min-h-0 min-w-0"
                    defaultSize={100 / group.length}
                    id={panePanelId}
                    key={panePanelId}
                    minSize={10}
                  >
                    <DraftingPaneSurface
                      interaction={{
                        canSwap: canSwapPanes,
                        isSelected,
                        isSnapTarget: snapTargetPaneId === pane.id,
                      }}
                      draggingPaneId={draggingPaneId}
                      onPaneDragEnd={onPaneDragEnd}
                      onPaneDragLeave={onPaneDragLeave}
                      onPaneDragOver={onPaneDragOver}
                      onPaneDragStart={onPaneDragStart}
                      onPaneDrop={onPaneDrop}
                      onPanePan={onPanePan}
                      onPaneZoom={onPaneZoom}
                      onLayerChange={onLayerChange}
                      onLayerAction={onLayerAction}
                      onLayerCopy={onLayerCopy}
                      onLayerPaste={onLayerPaste}
                      onLayerSelect={onLayerSelect}
                      onLayerSelectionChange={onLayerSelectionChange}
                      activeCanvasTool={isSelected ? activeCanvasTool : null}
                      layerEditingEnabled={layerEditingEnabled}
                      onAddTextLayerAt={onAddTextLayerAt}
                      onCanvasToolChange={onCanvasToolChange}
                      onPaneQrClick={onPaneQrClick}
                      onPaneSelect={onPaneSelect}
                      pane={pane}
                      panePan={panePan}
                      paneZoom={paneZoom}
                      previewLocked={previewLocked}
                      fitCanvasToViewport={fitCanvasToViewport}
                      selectedLayerId={selectedLayerId}
                      selectedLayerIds={selectedLayerIds}
                      showCanvasGrid={showCanvasGrid}
                      snapEnabled={snapEnabled}
                      toolbarVariant={toolbarVariant}
                    />
                  </ResizablePanel>
                )

                return paneIndex < group.length - 1
                  ? [
                      panePanel,
                      <DraftingResizeHandle
                        key={`pane-${groupIndex}-${paneIndex}-handle`}
                      />,
                    ]
                  : [panePanel]
              })}
            </ResizablePanelGroup>
          </ResizablePanel>
        )

        return groupIndex < layout.groups.length - 1
          ? [
              groupPanel,
              <DraftingResizeHandle key={`group-${groupIndex}-handle`} />,
            ]
          : [groupPanel]
      })}
    </ResizablePanelGroup>
  )
}
