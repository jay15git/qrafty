"use client"

import type { ReactNode } from "react"
import { ChevronDownIcon, ChevronUpIcon, Trash2Icon } from "lucide-react"

import {
  DESKTOP_INSPECTOR_CAPTION_CLASS,
  DESKTOP_INSPECTOR_LABEL_CLASS,
  DESKTOP_INSPECTOR_LAYER_ACTION_CLASS,
  DESKTOP_INSPECTOR_LAYER_ROW_CLASS,
  DESKTOP_INSPECTOR_LAYER_ROW_IDLE_CLASS,
  DESKTOP_INSPECTOR_LAYER_ROW_SELECTED_CLASS,
  DESKTOP_INSPECTOR_POPOVER_HEADER_CLASS,
  DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
} from "@/features/desktop-shell/components/desktop-inspector-tokens"
import {
  DESKTOP_LAYER_KIND_LABELS,
  type DesktopLayersSettings,
} from "@/features/desktop-shell/model/desktop-toolbar-types"
import { isMandatoryDesktopLayerRow } from "@/features/workspace/components/workspace-surface-helpers"
import { cn } from "@/lib/utils"

function LayerRowActionButton({
  ariaLabel,
  children,
  className,
  disabled,
  onClick,
  pressed,
}: {
  ariaLabel: string
  children: ReactNode
  className?: string
  disabled?: boolean
  onClick: () => void
  pressed?: boolean
}) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={pressed}
      className={cn(DESKTOP_INSPECTOR_LAYER_ACTION_CLASS, className)}
      disabled={disabled}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
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

  function moveLayer(layerId: string, direction: "up" | "down") {
    const index = layers.findIndex((row) => row.id === layerId)
    if (index < 0) {
      return
    }

    const moving = layers[index]!
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= layers.length) {
      return
    }

    const target = layers[targetIndex]!
    if (isMandatoryDesktopLayerRow(moving) || isMandatoryDesktopLayerRow(target)) {
      return
    }

    const next = [...layers]
    const [row] = next.splice(index, 1)
    next.splice(targetIndex, 0, row!)
    onLayersSettingsChange({ layers: next })
    onLayersReorder?.(next.map((entry) => entry.id))
  }

  function deleteLayer(layerId: string) {
    if (!onLayerDelete) {
      return
    }

    onLayerDelete(layerId)
  }

  return (
    <div
      className={cn("flex min-w-0 flex-col", embedded && "dn-settings-elements-layers")}
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

      {layers.length > 0 ? (
        <div
          className={cn(
            "flex flex-col",
            embedded ? "gap-1" : "gap-0.5 px-1.5 py-1.5",
          )}
          data-slot="desktop-layers-list"
          role="listbox"
          aria-label="Canvas layers"
        >
          {layers.map((row, index) => {
            const isSelected = row.id === layersSettings.selectedLayerId
            const isProtected = isMandatoryDesktopLayerRow(row)
            const canDelete =
              Boolean(onLayerDelete) &&
              !isProtected &&
              (canDeleteLayer?.(row.id) ?? true)
            const displayName = isProtected
              ? "Background"
              : row.name || DESKTOP_LAYER_KIND_LABELS[row.kind]

            return (
              <div
                key={row.id}
                aria-selected={isSelected}
                className={cn(
                  embedded
                    ? "dn-settings-row dn-control-surface dn-squircle-sm grid min-w-0 grid-cols-[1fr_auto] items-center gap-1 px-1.5"
                    : DESKTOP_INSPECTOR_LAYER_ROW_CLASS,
                  !embedded &&
                    (isSelected
                      ? DESKTOP_INSPECTOR_LAYER_ROW_SELECTED_CLASS
                      : DESKTOP_INSPECTOR_LAYER_ROW_IDLE_CLASS),
                  embedded && isSelected && "ring-1 ring-[var(--dn-line)]",
                )}
                data-layer-id={row.id}
                data-selected={isSelected ? "true" : "false"}
                data-slot="desktop-layer-row"
                role="option"
              >
                <button
                  aria-label={`Select ${displayName}`}
                  className="flex min-w-0 items-center text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]"
                  type="button"
                  onClick={() => onLayersSettingsChange({ selectedLayerId: row.id })}
                >
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate font-medium",
                      embedded
                        ? "text-[length:var(--dn-type-value-size)] text-[var(--dn-type-value-color)]"
                        : cn(
                            DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
                            isSelected
                              ? "text-[var(--desktop-inspector-option-selected-fg,var(--desktop-inspector-fg-primary))]"
                              : "text-[var(--desktop-inspector-fg-secondary)]",
                          ),
                    )}
                  >
                    {displayName}
                  </span>
                </button>

                <div
                  className="flex shrink-0 items-center"
                  data-slot="desktop-layer-row-actions"
                >
                  {onLayerDelete ? (
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
                  ) : null}

                  <div
                    className="flex shrink-0 items-center gap-0.5"
                    data-slot="desktop-layer-row-reorder"
                  >
                    <LayerRowActionButton
                      ariaLabel={`Move ${displayName} up`}
                      className="size-3.5 min-h-0"
                      disabled={isProtected || index === 0 || isMandatoryDesktopLayerRow(layers[index - 1]!)}
                      onClick={() => moveLayer(row.id, "up")}
                    >
                      <ChevronUpIcon className="size-3" />
                    </LayerRowActionButton>
                    <LayerRowActionButton
                      ariaLabel={`Move ${displayName} down`}
                      className="size-3.5 min-h-0"
                      disabled={
                        isProtected ||
                        index === layers.length - 1 ||
                        isMandatoryDesktopLayerRow(layers[index + 1]!)
                      }
                      onClick={() => moveLayer(row.id, "down")}
                    >
                      <ChevronDownIcon className="size-3" />
                    </LayerRowActionButton>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
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
