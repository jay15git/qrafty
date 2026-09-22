"use client"

import { useRef, useState, type ReactNode } from "react"
import { Trash2Icon } from "lucide-react"

import { ReorderList } from "@/features/desktop-shell/components/interior/reorder-list"
import {
  DESKTOP_INSPECTOR_CAPTION_CLASS,
  DESKTOP_INSPECTOR_LABEL_CLASS,
  DESKTOP_INSPECTOR_LAYER_ACTION_CLASS,
  DESKTOP_INSPECTOR_LAYER_ROW_SELECTED_CLASS,
  DESKTOP_INSPECTOR_POPOVER_HEADER_CLASS,
} from "@/features/desktop-shell/components/desktop-inspector-tokens"
import {
  DESKTOP_LAYER_KIND_LABELS,
  type DesktopLayerRow,
  type DesktopLayersSettings,
} from "@/features/desktop-shell/model/desktop-toolbar-types"
import { isMandatoryDesktopLayerRow } from "@/features/workspace/components/workspace-surface-helpers"
import { cn } from "@/lib/utils"

type LayerReorderEntry = { id: string }

function LayerRowActionButton({
  ariaLabel,
  children,
  className,
  disabled,
  onClick,
}: {
  ariaLabel: string
  children: ReactNode
  className?: string
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={cn(DESKTOP_INSPECTOR_LAYER_ACTION_CLASS, className)}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function getLayerDisplayName(row: DesktopLayerRow) {
  return isMandatoryDesktopLayerRow(row)
    ? "Background"
    : row.name || DESKTOP_LAYER_KIND_LABELS[row.kind]
}

function pinBackgroundLast(entries: LayerReorderEntry[], layers: DesktopLayerRow[]) {
  const cardId = layers.find((row) => isMandatoryDesktopLayerRow(row))?.id
  if (!cardId) {
    return entries
  }

  const withoutCard = entries.filter((entry) => entry.id !== cardId)
  const card = entries.find((entry) => entry.id === cardId)
  return card ? [...withoutCard, card] : withoutCard
}

function entriesToLayers(entries: LayerReorderEntry[], layers: DesktopLayerRow[]) {
  const rowById = new Map(layers.map((row) => [row.id, row]))
  return entries
    .map((entry) => rowById.get(entry.id))
    .filter((row): row is DesktopLayerRow => Boolean(row))
}

/**
 * Reconciles the reorder entries with the layer list: keeps entries whose
 * layer still exists (preserving identity so ReorderList can animate), appends
 * new layers, and pins the background row last. Returns the current list
 * unchanged when nothing moved.
 */
function reconcileOrderedEntries(
  current: LayerReorderEntry[],
  layers: DesktopLayerRow[],
  getStableEntry: (id: string) => LayerReorderEntry,
) {
  const layerIds = new Set(layers.map((row) => row.id))
  const kept = current
    .filter((entry) => layerIds.has(entry.id))
    .map((entry) => getStableEntry(entry.id))
  const keptIds = new Set(kept.map((entry) => entry.id))
  const added = layers
    .filter((row) => !keptIds.has(row.id))
    .map((row) => getStableEntry(row.id))
  const next = pinBackgroundLast([...kept, ...added], layers)
  if (
    next.length === current.length &&
    next.every((entry, index) => entry.id === current[index]?.id)
  ) {
    return current
  }
  return next
}


export function DesktopLayersPopoverContent({
  embedded = false,
  layersSettings,
  onLayersReorder,
  onLayersSettingsChange,
  onLayerDelete,
  canDeleteLayer,
}: {
  embedded?: boolean
  layersSettings: DesktopLayersSettings
  onLayersReorder?: (orderedIds: string[]) => void
  onLayersSettingsChange: (patch: Partial<DesktopLayersSettings>) => void
  onLayerDelete?: (layerId: string) => void
  canDeleteLayer?: (layerId: string) => boolean
}) {
  const layers = layersSettings.layers
  const entryMapRef = useRef(new Map<string, LayerReorderEntry>())

  function getStableEntry(id: string) {
    let entry = entryMapRef.current.get(id)
    if (!entry) {
      entry = { id }
      entryMapRef.current.set(id, entry)
    }
    return entry
  }

  const [orderedEntries, setOrderedEntries] = useState<LayerReorderEntry[]>(() =>
    pinBackgroundLast(layers.map((row) => getStableEntry(row.id)), layers),
  )

  // Reconcile the reorder entries with the layer list during render — the
  // React-docs "adjust state when a prop changes" pattern. Entries keep their
  // identity across renders so ReorderList can animate them.
  const [prevLayers, setPrevLayers] = useState(layers)
  if (prevLayers !== layers) {
    setPrevLayers(layers)
    const next = reconcileOrderedEntries(orderedEntries, layers, getStableEntry)
    if (next !== orderedEntries) {
      setOrderedEntries(next)
    }
  }

  function handleReorder(nextEntries: LayerReorderEntry[]) {
    setOrderedEntries(pinBackgroundLast(nextEntries, layers))
  }

  function handleCommit(nextEntries: LayerReorderEntry[]) {
    const nextLayers = entriesToLayers(pinBackgroundLast(nextEntries, layers), layers)
    if (nextLayers.length !== layers.length) {
      return
    }

    onLayersSettingsChange({ layers: nextLayers })
    onLayersReorder?.(nextLayers.map((row) => row.id))
  }

  function deleteLayer(layerId: string) {
    onLayerDelete?.(layerId)
  }

  const embeddedRowClass =
    "flex min-h-[var(--dn-control-height)] cursor-pointer items-center rounded-[var(--dn-radius-sm)] border-0 bg-transparent py-1 pl-1 pr-1.5 shadow-none"
  const embeddedGripClass =
    "rounded-[8px] text-[var(--dn-muted)] hover:bg-[var(--dn-control-hover)] hover:text-[var(--dn-fg)]"

  return (
    <div
      className={cn("flex min-w-0 flex-col cursor-pointer", embedded && "dn-settings-elements-layers")}
      data-slot={embedded ? "desktop-layers-embedded" : "desktop-layers-popover"}
    >
      {!embedded ? (
        <header className={DESKTOP_INSPECTOR_POPOVER_HEADER_CLASS}>
          <p className={cn("mb-0", DESKTOP_INSPECTOR_LABEL_CLASS)}>Layers</p>
          {layers.length > 0 ? (
            <p className={cn(DESKTOP_INSPECTOR_CAPTION_CLASS, "shrink-0 tabular-nums")}>
              {layers.length}
            </p>
          ) : null}
        </header>
      ) : null}

      {orderedEntries.length > 0 ? (
        <ReorderList
          className="w-full min-w-0"
          getId={(entry) => entry.id}
          getItemClassName={(entry, { selected }) =>
            embedded
              ? embeddedRowClass
              : selected
                ? DESKTOP_INSPECTOR_LAYER_ROW_SELECTED_CLASS
                : "cursor-pointer rounded-[10px] border-0 bg-transparent py-1.5 pl-1.5 pr-2 shadow-none"
          }
          getLabel={(entry) => {
            const row = layers.find((layer) => layer.id === entry.id)
            return row ? getLayerDisplayName(row) : entry.id
          }}
          gripClassName={embedded ? embeddedGripClass : undefined}
          isItemDraggable={(entry) => {
            const row = layers.find((layer) => layer.id === entry.id)
            return row ? !isMandatoryDesktopLayerRow(row) : false
          }}
          itemDataSlot="desktop-layer-row"
          items={orderedEntries}
          label="Canvas layers"
          listDataSlot="desktop-layers-list"
          selectedId={layersSettings.selectedLayerId}
          onCommit={handleCommit}
          onItemActivate={(entry) => onLayersSettingsChange({ selectedLayerId: entry.id })}
          onReorder={handleReorder}
          renderTrailing={(entry) => {
            const row = layers.find((layer) => layer.id === entry.id)
            if (!row || !onLayerDelete) {
              return null
            }

            const displayName = getLayerDisplayName(row)
            const isProtected = isMandatoryDesktopLayerRow(row)
            const canDelete = !isProtected && (canDeleteLayer?.(row.id) ?? true)

            return (
              <LayerRowActionButton
                ariaLabel={`Delete ${displayName}`}
                className={cn(
                  embedded &&
                    "size-6 rounded-[8px] text-[var(--dn-muted)] hover:text-[var(--dn-fg)]",
                  !canDelete && "opacity-30",
                )}
                disabled={!canDelete}
                onClick={() => deleteLayer(row.id)}
              >
                <Trash2Icon className="size-3.5" />
              </LayerRowActionButton>
            )
          }}
        >
          {(entry) => {
            const row = layers.find((layer) => layer.id === entry.id)
            if (!row) {
              return null
            }

            return (
              <span
                className={cn(
                  "block min-w-0 truncate text-sm font-medium",
                  embedded
                    ? "dn-type-value text-[var(--dn-type-value-color)]"
                    : "text-[var(--desktop-inspector-fg-secondary)]",
                )}
              >
                {getLayerDisplayName(row)}
              </span>
            )
          }}
        </ReorderList>
      ) : (
        <p
          className={cn(
            embedded
              ? "dn-type-meta px-1 py-3 text-center"
              : cn(DESKTOP_INSPECTOR_CAPTION_CLASS, "px-3 py-4 text-center"),
          )}
          data-slot="desktop-layers-empty"
        >
          {embedded ? "No elements yet." : "No layers yet. Add content to the canvas."}
        </p>
      )}
    </div>
  )
}
