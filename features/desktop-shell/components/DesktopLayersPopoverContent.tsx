"use client"

import type { ReactNode } from "react"
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EyeIcon,
  EyeOffIcon,
  ImageIcon,
  LockIcon,
  QrCodeIcon,
  SparklesIcon,
  SquareIcon,
  TypeIcon,
  UnlockIcon,
} from "lucide-react"

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
  type DesktopLayerKind,
  type DesktopLayersSettings,
} from "@/features/desktop-shell/model/desktop-toolbar-types"
import { cn } from "@/lib/utils"

function LayerKindIcon({ kind, className }: { kind: DesktopLayerKind; className?: string }) {
  switch (kind) {
    case "text":
      return <TypeIcon className={className} />
    case "image":
      return <ImageIcon className={className} />
    case "qr":
      return <QrCodeIcon className={className} />
    case "shader":
      return <SparklesIcon className={className} />
    default:
      return <SquareIcon className={className} />
  }
}

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
  layersSettings,
  onLayersReorder,
  onLayersSettingsChange,
}: {
  layersSettings: DesktopLayersSettings
  onLayersReorder?: (orderedIds: string[]) => void
  onLayersSettingsChange: (patch: Partial<DesktopLayersSettings>) => void
}) {
  const layers = layersSettings.layers

  function patchLayer(layerId: string, patch: Partial<(typeof layers)[number]>) {
    onLayersSettingsChange({
      layers: layers.map((row) => (row.id === layerId ? { ...row, ...patch } : row)),
    })
  }

  function moveLayer(layerId: string, direction: "up" | "down") {
    const index = layers.findIndex((row) => row.id === layerId)
    if (index < 0) {
      return
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= layers.length) {
      return
    }

    const next = [...layers]
    const [row] = next.splice(index, 1)
    next.splice(targetIndex, 0, row!)
    onLayersSettingsChange({ layers: next })
    onLayersReorder?.(next.map((entry) => entry.id))
  }

  return (
    <div className="flex min-w-0 flex-col" data-slot="desktop-layers-popover">
      <header className={DESKTOP_INSPECTOR_POPOVER_HEADER_CLASS}>
        <p className={cn("mb-0", DESKTOP_INSPECTOR_LABEL_CLASS)}>Layers</p>
        {layers.length > 0 ? (
          <p className={cn(DESKTOP_INSPECTOR_CAPTION_CLASS, "shrink-0 tabular-nums")}>
            {layers.length}
          </p>
        ) : null}
      </header>

      {layers.length > 0 ? (
        <div
          className="flex flex-col gap-0.5 px-1.5 py-1.5"
          data-slot="desktop-layers-list"
          role="listbox"
          aria-label="Canvas layers"
        >
          {layers.map((row, index) => {
            const isSelected = row.id === layersSettings.selectedLayerId
            const displayName = row.name || DESKTOP_LAYER_KIND_LABELS[row.kind]

            return (
              <div
                key={row.id}
                aria-selected={isSelected}
                className={cn(
                  DESKTOP_INSPECTOR_LAYER_ROW_CLASS,
                  isSelected
                    ? DESKTOP_INSPECTOR_LAYER_ROW_SELECTED_CLASS
                    : DESKTOP_INSPECTOR_LAYER_ROW_IDLE_CLASS,
                )}
                data-layer-id={row.id}
                data-selected={isSelected ? "true" : "false"}
                data-slot="desktop-layer-row"
                role="option"
              >
                <button
                  aria-label={`Select ${displayName}`}
                  className="flex min-w-0 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]"
                  type="button"
                  onClick={() => onLayersSettingsChange({ selectedLayerId: row.id })}
                >
                  <LayerKindIcon
                    className={cn(
                      "size-3.5 shrink-0",
                      isSelected
                        ? "text-[var(--desktop-inspector-option-selected-fg,var(--desktop-inspector-fg-primary))]"
                        : "text-[var(--desktop-inspector-fg-tertiary)]",
                    )}
                    kind={row.kind}
                  />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate font-medium",
                      DESKTOP_INSPECTOR_TYPE_LABEL_CLASS,
                      isSelected
                        ? "text-[var(--desktop-inspector-option-selected-fg,var(--desktop-inspector-fg-primary))]"
                        : "text-[var(--desktop-inspector-fg-secondary)]",
                    )}
                  >
                    {displayName}
                  </span>
                </button>

                <div
                  className="flex shrink-0 items-center"
                  data-slot="desktop-layer-row-actions"
                >
                  <LayerRowActionButton
                    ariaLabel={row.isVisible ? `Hide ${displayName}` : `Show ${displayName}`}
                    className={!row.isVisible ? "opacity-40" : undefined}
                    pressed={row.isVisible}
                    onClick={() => patchLayer(row.id, { isVisible: !row.isVisible })}
                  >
                    {row.isVisible ? (
                      <EyeIcon className="size-3.5" />
                    ) : (
                      <EyeOffIcon className="size-3.5" />
                    )}
                  </LayerRowActionButton>

                  <LayerRowActionButton
                    ariaLabel={row.isLocked ? `Unlock ${displayName}` : `Lock ${displayName}`}
                    className={!row.isLocked ? "opacity-55" : undefined}
                    pressed={row.isLocked}
                    onClick={() => patchLayer(row.id, { isLocked: !row.isLocked })}
                  >
                    {row.isLocked ? (
                      <LockIcon className="size-3.5" />
                    ) : (
                      <UnlockIcon className="size-3.5" />
                    )}
                  </LayerRowActionButton>

                  <div
                    className="flex size-7 shrink-0 flex-col items-center justify-center"
                    data-slot="desktop-layer-row-reorder"
                  >
                    <LayerRowActionButton
                      ariaLabel={`Move ${displayName} up`}
                      className="size-3.5 min-h-0"
                      disabled={index === 0}
                      onClick={() => moveLayer(row.id, "up")}
                    >
                      <ChevronUpIcon className="size-3" />
                    </LayerRowActionButton>
                    <LayerRowActionButton
                      ariaLabel={`Move ${displayName} down`}
                      className="size-3.5 min-h-0"
                      disabled={index === layers.length - 1}
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
          className={cn(DESKTOP_INSPECTOR_CAPTION_CLASS, "px-3 py-4 text-center")}
          data-slot="desktop-layers-empty"
        >
          No layers yet. Add content to the canvas.
        </p>
      )}
    </div>
  )
}
