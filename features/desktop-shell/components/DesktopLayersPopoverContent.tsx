"use client"

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
  DESKTOP_INSPECTOR_SECTION_HEADING_CLASS,
} from "@/features/desktop-shell/components/desktop-inspector-tokens"
import { DesktopInspectorSection } from "@/features/desktop-shell/components/InspectorControls"
import type {
  DesktopLayerKind,
  DesktopLayerRow,
  DesktopLayersSettings,
} from "@/features/desktop-shell/model/desktop-toolbar-types"
import { cn } from "@/lib/utils"

const LAYER_KIND_LABELS: Record<DesktopLayerKind, string> = {
  card: "Card",
  image: "Image",
  qr: "QR code",
  shader: "Shader",
  shape: "Shape",
  text: "Text",
}

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

  function patchLayer(layerId: string, patch: Partial<DesktopLayerRow>) {
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
    <DesktopInspectorSection dataSlot="desktop-layers-popover">
      <p className={cn(DESKTOP_INSPECTOR_SECTION_HEADING_CLASS, "mb-2")}>Layers</p>
      {layers.length > 0 ? (
        <div className="flex flex-col gap-1" data-slot="desktop-layers-list">
          {layers.map((row, index) => {
            const isSelected = row.id === layersSettings.selectedLayerId

            return (
              <div
                key={row.id}
                className={cn(
                  "flex items-center gap-1 rounded-[8px] bg-[var(--desktop-inspector-control)] px-1 py-0.5",
                  isSelected && "ring-1 ring-[var(--desktop-glass-button-focus-ring)]",
                )}
                data-layer-id={row.id}
                data-selected={isSelected ? "true" : "false"}
                data-slot="desktop-layer-row"
              >
                <button
                  aria-label={`Select ${row.name}`}
                  className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-[var(--desktop-inspector-control-hover-bg)]"
                  type="button"
                  onClick={() => onLayersSettingsChange({ selectedLayerId: row.id })}
                >
                  <LayerKindIcon
                    className="size-3.5 shrink-0 text-[var(--desktop-inspector-fg-secondary)]"
                    kind={row.kind}
                  />
                  <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[var(--desktop-inspector-fg-secondary)]">
                    {row.name || LAYER_KIND_LABELS[row.kind]}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-[var(--desktop-inspector-fg-muted)]">
                    {LAYER_KIND_LABELS[row.kind]}
                  </span>
                </button>

                <button
                  aria-label={row.isVisible ? `Hide ${row.name}` : `Show ${row.name}`}
                  aria-pressed={row.isVisible}
                  className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-[var(--desktop-inspector-control-hover-bg)]"
                  type="button"
                  onClick={() => patchLayer(row.id, { isVisible: !row.isVisible })}
                >
                  {row.isVisible ? (
                    <EyeIcon className="size-3.5" />
                  ) : (
                    <EyeOffIcon className="size-3.5 opacity-50" />
                  )}
                </button>

                <button
                  aria-label={row.isLocked ? `Unlock ${row.name}` : `Lock ${row.name}`}
                  aria-pressed={row.isLocked}
                  className="grid size-7 shrink-0 place-items-center rounded-md hover:bg-[var(--desktop-inspector-control-hover-bg)]"
                  type="button"
                  onClick={() => patchLayer(row.id, { isLocked: !row.isLocked })}
                >
                  {row.isLocked ? (
                    <LockIcon className="size-3.5" />
                  ) : (
                    <UnlockIcon className="size-3.5 opacity-60" />
                  )}
                </button>

                <div className="flex shrink-0 flex-col">
                  <button
                    aria-label={`Move ${row.name} up`}
                    className="grid size-3.5 place-items-center rounded-sm hover:bg-[var(--desktop-inspector-control-hover-bg)] disabled:opacity-30"
                    disabled={index === 0}
                    type="button"
                    onClick={() => moveLayer(row.id, "up")}
                  >
                    <ChevronUpIcon className="size-3" />
                  </button>
                  <button
                    aria-label={`Move ${row.name} down`}
                    className="grid size-3.5 place-items-center rounded-sm hover:bg-[var(--desktop-inspector-control-hover-bg)] disabled:opacity-30"
                    disabled={index === layers.length - 1}
                    type="button"
                    onClick={() => moveLayer(row.id, "down")}
                  >
                    <ChevronDownIcon className="size-3" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-center text-[12px] text-[var(--desktop-inspector-fg-muted)]">
          No layers yet.
        </p>
      )}
    </DesktopInspectorSection>
  )
}
