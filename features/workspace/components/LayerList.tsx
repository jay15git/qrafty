"use client"

import { useMemo, type ReactNode } from "react"
import { ArrowDownIcon, ArrowUpIcon, Trash2Icon, Layers3Icon } from "lucide-react"

import {
  DASHBOARD_QR_NODE_ID,
  isDashboardQrNodeId,
} from "@/features/qr-code/rendering/compose-scene"
import {
  DraftingInspectorControlRow,
  DraftingInspectorIconButton,
  DraftingInspectorSection,
  DraftingInspectorValueGrid,
} from "@/features/workspace/components/InspectorPanel"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { DraftingLayerMenuAction } from "@/features/workspace/components/Pane"
import {
  DraggableList,
  DraggableListHandle,
  DraggableListItem,
} from "@/components/ui/draggable-list"
import { cn } from "@/lib/utils"

type DraftingLayerPane = {
  blur?: number
  children?: DraftingLayerPane[]
  height?: number
  id: string
  isLocked?: boolean
  isVisible?: boolean
  kind?: DraftingCanvasLayer["kind"]
  name: string
  opacity?: number
  shadow?: DraftingCanvasLayer["shadow"]
  width?: number
  x?: number
  y?: number
}

type LayerListProps = {
  onLayerAction?: (layerIds: string[], action: DraftingLayerMenuAction) => void
  onLayerPatch?: (layerId: string, patch: Partial<DraftingCanvasLayer>) => void
  onReorder: (orderedIds: string[]) => void
  onRemoveNode?: (nodeId: string) => void
  onSelectedNodeChange: (nodeId: string | null) => void
  panes: DraftingLayerPane[]
  selectedNodeId: string | null
}

const DEFAULT_LAYER_SHADOW_COLOR = ["#", "1", "1", "1", "8", "2", "7"].join("")

export function LayerList({
  onLayerPatch,
  onLayerAction,
  onReorder,
  onRemoveNode,
  onSelectedNodeChange,
  panes,
  selectedNodeId,
}: LayerListProps) {
  const layerNodes = useMemo(() => [...panes], [panes])
  const isSingleLayer = layerNodes.length <= 1
  const qrNodeCount = layerNodes.filter(
    (p) => p.kind !== "card" && isDashboardQrNodeId(p.id),
  ).length
  const selectedLayer = findLayerPane(layerNodes, selectedNodeId)

  return (
    <section data-slot="drafting-layers-tab" className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="min-w-0">
          <p className="ws-type-section-title font-semibold text-[var(--ws-ink)]">
            Layers
          </p>
          <p className="ws-type-body mt-1 text-[var(--ws-ink-muted)]">
            Reorder and manage the current QR stack.
          </p>
        </div>
        <span className="ws-type-data shrink-0 text-[var(--ws-ink-muted)]">
          {layerNodes.length} total
        </span>
      </div>

      {layerNodes.length === 0 ? (
        <div
          data-slot="drafting-layers-empty-state"
          className="ws-type-body rounded-[8px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg)] px-4 py-3 text-[var(--ws-ink-muted)] shadow-[var(--ws-shadow-rest)]"
        >
          The layer stack will appear here once there is content.
        </div>
      ) : (
        <DraggableList
          className="min-w-0 gap-2"
          items={layerNodes}
          onReorder={(nextNodes) =>
            onReorder(nextNodes.map((node) => node.id))
          }
        >
          {layerNodes.map((node, index) => {
            const isSelected = node.id === selectedNodeId
            const isQrPaneRow = node.kind === undefined
            const isRemovable =
              isQrPaneRow && (!isDashboardQrNodeId(node.id) || qrNodeCount > 1)
            const displayName = getLayerDisplayName(node)

            return (
              <DraggableListItem
                key={node.id}
                disabled={isSingleLayer}
                className={cn("min-w-0 rounded-[8px]", isSelected && "z-10")}
                value={node}
              >
                <div
                  data-slot="drafting-layer-row"
                  data-node-id={node.id}
                  data-selected={isSelected ? "true" : "false"}
                  className={cn(
                    "min-w-0 overflow-hidden rounded-[8px] border px-3 py-3 shadow-[var(--ws-shadow-rest)] transition-[border-color,box-shadow,transform,background-color] duration-150 ease-out",
                    "border-[var(--ws-line)] bg-[var(--ws-panel-bg)] hover:-translate-y-px hover:border-[var(--ws-line-hover)] hover:bg-[var(--ws-panel-bg-hover)] hover:shadow-[var(--ws-shadow-hover)]",
                    isSelected &&
                      "border-[var(--ws-ink)] bg-[var(--ws-panel-bg-active)] shadow-[var(--ws-shadow-rest)]",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="shrink-0">
                      <DraggableListHandle
                        className="rounded-[6px] border-transparent bg-[var(--ws-control-bg)] text-[var(--ws-ink-subtle)] hover:bg-[var(--ws-panel-bg-hover)] hover:text-[var(--ws-ink)]"
                        label={`Reorder ${displayName}`}
                      />
                    </div>

                    <button
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onSelectedNodeChange(node.id)}
                      type="button"
                    >
                        <p className="ws-type-control-label truncate font-semibold text-[var(--ws-ink)]">
                        {displayName}
                      </p>
                      <p className="ws-type-meta mt-1 truncate text-[var(--ws-ink-muted)]">
                        {getLayerRowMeta(node, index, layerNodes.length, isSelected)}
                      </p>
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      {isRemovable && onRemoveNode ? (
                          <IconActionButton
                          ariaLabel={`Delete ${displayName}`}
                          className="border-[var(--ws-line-strong)] text-[var(--ws-ink)] hover:bg-[var(--ws-control-bg-active)] hover:text-[var(--ws-ink)]"
                          onClick={() => {
                            const fallbackNodeId =
                              panes.find(
                                (currentNode) =>
                                  currentNode.id !== node.id &&
                                  isDashboardQrNodeId(currentNode.id),
                              )?.id ?? DASHBOARD_QR_NODE_ID

                            onRemoveNode(node.id)
                            if (selectedNodeId === node.id) {
                              onSelectedNodeChange(fallbackNodeId)
                            }
                          }}
                        >
                          <Trash2Icon className="size-3.5" />
                        </IconActionButton>
                      ) : null}
                      {node.kind ? (
                        <>
                          <IconActionButton
                            ariaLabel={`Send ${displayName} backward`}
                            onClick={() => onLayerAction?.([node.id], "backward")}
                          >
                            <ArrowDownIcon className="size-3.5" />
                          </IconActionButton>
                          <IconActionButton
                            ariaLabel={`Bring ${displayName} forward`}
                            onClick={() => onLayerAction?.([node.id], "forward")}
                          >
                            <ArrowUpIcon className="size-3.5" />
                          </IconActionButton>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {node.children?.length ? (
                    <div className="mt-2 space-y-1 border-l border-[var(--ws-line)] pl-3">
                      {node.children.map((child) => (
                        <button
                          key={child.id}
                          className={cn(
                            "block w-full rounded-[6px] px-2 py-1.5 text-left",
                            child.id === selectedNodeId
                              ? "bg-[var(--ws-control-bg-active)] text-[var(--ws-ink)]"
                              : "text-[var(--ws-ink-muted)] hover:bg-[var(--ws-control-bg)] hover:text-[var(--ws-ink)]",
                          )}
                          type="button"
                          onClick={() => onSelectedNodeChange(child.id)}
                        >
                          <span className="ws-type-meta block truncate font-semibold">
                            {getLayerDisplayName(child)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </DraggableListItem>
            )
          })}
        </DraggableList>
      )}

      {selectedLayer && onLayerPatch ? (
        <LayerInspector layer={selectedLayer} onLayerPatch={onLayerPatch} />
      ) : null}
    </section>
  )
}

function findLayerPane(layers: DraftingLayerPane[], layerId: string | null): DraftingLayerPane | undefined {
  if (!layerId) {
    return undefined
  }

  for (const layer of layers) {
    if (layer.id === layerId) {
      return layer
    }

    const child = layer.children ? findLayerPane(layer.children, layerId) : undefined

    if (child) {
      return child
    }
  }

  return undefined
}

function getLayerDisplayName(layer: DraftingLayerPane) {
  if (layer.kind === "card" && layer.name.trim().toLowerCase() === "card") {
    return "QR Frame"
  }

  if (layer.kind === "qr" && layer.name.trim().toLowerCase() === "qr code") {
    return "QR Code"
  }

  if (layer.kind === "text") {
    return layer.name.startsWith("Text:") ? layer.name : `Text: ${layer.name}`
  }

  return layer.name
}

function LayerInspector({
  layer,
  onLayerPatch,
}: {
  layer: DraftingLayerPane
  onLayerPatch: (layerId: string, patch: Partial<DraftingCanvasLayer>) => void
}) {
  const shadow = layer.shadow ?? {
    blur: 0,
    color: DEFAULT_LAYER_SHADOW_COLOR,
    offsetX: 0,
    offsetY: 0,
    opacity: 0,
  }

  return (
    <DraftingInspectorSection
      dataSlot="drafting-layer-inspector"
      description="Position, size, and layer effects."
      title="Inspector"
    >
      <DraftingInspectorControlRow label="Name">
        <input
          aria-label="Layer name"
          className="ws-type-input h-8 w-full min-w-0 rounded-[6px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] px-2 text-[var(--ws-ink)] shadow-none"
          value={getLayerDisplayName(layer)}
          onChange={(event) => onLayerPatch(layer.id, { name: event.currentTarget.value })}
        />
      </DraftingInspectorControlRow>

      <DraftingInspectorSection className="bg-[var(--ws-control-bg)] shadow-none" title="Geometry">
        <DraftingInspectorValueGrid>
          <LayerNumberInput label="X" value={layer.x ?? 0} onChange={(x) => onLayerPatch(layer.id, { x })} />
          <LayerNumberInput label="Y" value={layer.y ?? 0} onChange={(y) => onLayerPatch(layer.id, { y })} />
          <LayerNumberInput label="W" min={1} value={layer.width ?? 1} onChange={(width) => onLayerPatch(layer.id, { width, ...(layer.kind === "qr" ? { height: width } : {}) })} />
          <LayerNumberInput label="H" min={1} value={layer.height ?? 1} disabled={layer.kind === "qr"} onChange={(height) => onLayerPatch(layer.id, { height })} />
        </DraftingInspectorValueGrid>
      </DraftingInspectorSection>

      <DraftingInspectorSection className="bg-[var(--ws-control-bg)] shadow-none" title="Appearance">
        <DraftingInspectorValueGrid>
          <LayerNumberInput label="Opacity" max={100} min={0} value={Math.round((layer.opacity ?? 1) * 100)} onChange={(opacity) => onLayerPatch(layer.id, { opacity: opacity / 100 })} />
          <LayerNumberInput label="Blur" max={96} min={0} value={layer.blur ?? 0} onChange={(blur) => onLayerPatch(layer.id, { blur })} />
        </DraftingInspectorValueGrid>
        <div className="grid grid-cols-2 gap-2">
          <LayerToggle
            checked={layer.isVisible ?? true}
            label="Visible"
            onChange={(isVisible) => onLayerPatch(layer.id, { isVisible })}
          />
          <LayerToggle
            checked={layer.isLocked ?? false}
            label="Locked"
            onChange={(isLocked) => onLayerPatch(layer.id, { isLocked })}
          />
        </div>
      </DraftingInspectorSection>

      <DraftingInspectorSection className="bg-[var(--ws-control-bg)] shadow-none" title="Shadow">
        <label className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)] items-center gap-2">
          <input
            aria-label="Layer shadow color swatch"
            className="size-8 rounded-[6px] border border-[var(--ws-line)] bg-transparent p-1"
            type="color"
            value={shadow.color}
            onChange={(event) =>
              onLayerPatch(layer.id, {
                shadow: { ...shadow, color: event.currentTarget.value },
              })
            }
          />
          <input
            aria-label="Layer shadow color"
            className="ws-type-input h-8 min-w-0 rounded-[6px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] px-2 text-[var(--ws-ink)] shadow-none"
            value={shadow.color}
            onChange={(event) =>
              onLayerPatch(layer.id, {
                shadow: { ...shadow, color: event.currentTarget.value },
              })
            }
          />
        </label>
        <DraftingInspectorValueGrid>
          <LayerNumberInput label="Shadow blur" max={128} min={0} value={shadow.blur} onChange={(blur) => onLayerPatch(layer.id, { shadow: { ...shadow, blur } })} />
          <LayerNumberInput label="Shadow %" max={100} min={0} value={shadow.opacity} onChange={(opacity) => onLayerPatch(layer.id, { shadow: { ...shadow, opacity } })} />
          <LayerNumberInput label="Offset X" max={256} min={-256} value={shadow.offsetX} onChange={(offsetX) => onLayerPatch(layer.id, { shadow: { ...shadow, offsetX } })} />
          <LayerNumberInput label="Offset Y" max={256} min={-256} value={shadow.offsetY} onChange={(offsetY) => onLayerPatch(layer.id, { shadow: { ...shadow, offsetY } })} />
        </DraftingInspectorValueGrid>
      </DraftingInspectorSection>
    </DraftingInspectorSection>
  )
}

function LayerNumberInput({
  disabled,
  label,
  max,
  min,
  onChange,
  value,
}: {
  disabled?: boolean
  label: string
  max?: number
  min?: number
  onChange: (value: number) => void
  value: number
}) {
  return (
    <label className="min-w-0">
      <span className="ws-type-meta mb-1 block font-semibold text-[var(--ws-ink-muted)]">
        {label}
      </span>
      <input
        className="ws-type-input h-9 w-full min-w-0 rounded-[6px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg-hover)] px-2 text-[var(--ws-ink)] shadow-none disabled:opacity-45"
        disabled={disabled}
        max={max}
        min={min}
        type="number"
        value={Math.round(value)}
        onChange={(event) => {
          const nextValue = Number(event.currentTarget.value)

          if (Number.isFinite(nextValue)) {
            onChange(nextValue)
          }
        }}
      />
    </label>
  )
}

function LayerToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="ws-type-meta flex min-w-0 items-center gap-2 font-semibold text-[var(--ws-ink)]">
      <input
        checked={checked}
        className="size-4 accent-[var(--ws-ink)]"
        type="checkbox"
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      {label}
    </label>
  )
}

function IconActionButton({
  ariaLabel,
  children,
  className,
  onClick,
}: {
  ariaLabel: string
  children: ReactNode
  className?: string
  onClick: () => void
}) {
  return (
    <DraftingInspectorIconButton
      ariaLabel={ariaLabel}
      className={className}
      onClick={onClick}
    >
      {children}
    </DraftingInspectorIconButton>
  )
}

function getLayerRowMeta(
  node: DraftingLayerPane,
  index: number,
  totalLayers: number,
  isSelected: boolean,
) {
  const labels = [
    getLayerOrderLabel(index, totalLayers),
    getLayerRoleLabel(node),
  ]

  if (isSelected) {
    labels.push("Selected")
  }

  return labels.join(" · ")
}

function getLayerRoleLabel(node: DraftingLayerPane) {
  if (node.kind === "card") {
    return "Shape"
  }

  if (node.kind === "text") {
    return "Text"
  }

  if (node.kind === "image") {
    return "Image"
  }

  if (node.kind === "shape") {
    return "Shape"
  }

  if (node.kind === "shader") {
    return "Shader"
  }

  if (node.kind === "group") {
    return "Group"
  }

  return "QR Code"
}

function getLayerOrderLabel(index: number, totalLayers: number) {
  if (index === 0) {
    return "Top"
  }

  if (index === totalLayers - 1) {
    return "Bottom"
  }

  return `Layer ${totalLayers - index}`
}

export const DRAFTING_LAYERS_TAB_ICON = Layers3Icon
