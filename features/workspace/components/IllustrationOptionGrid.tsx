"use client"

import type { IllustrationAsset } from "@/features/workspace/assets/illustration-sets"
import { cn } from "@/lib/utils"

export type IllustrationOptionGridVariant = "insert-desktop" | "insert-drafting"

type IllustrationOptionGridProps = {
  assets: readonly IllustrationAsset[]
  dataSlot?: string
  onSelect: (asset: IllustrationAsset) => void
  variant: IllustrationOptionGridVariant
}

export function IllustrationOptionGrid({
  assets,
  dataSlot = "drafting-illustration-option-grid",
  onSelect,
  variant,
}: IllustrationOptionGridProps) {
  const isInsertDesktop = variant === "insert-desktop"
  const buttonClassName = cn(
    "flex aspect-square w-full min-w-0 items-center justify-center p-2 transition",
    isInsertDesktop
      ? "text-[var(--dn-muted)] hover:bg-[var(--dn-control-hover)] hover:text-[var(--dn-fg)]"
      : "text-[var(--ws-ink-muted)] hover:bg-[var(--ws-panel-bg-hover)] hover:text-[var(--ws-ink)]",
  )

  return (
    <div
      aria-label="Illustration options"
      className={cn(
        "grid max-h-72 grid-cols-3 gap-0 overflow-y-auto",
        isInsertDesktop
          ? "dn-squircle-sm border border-[var(--dn-line)] bg-[var(--dn-control)]"
          : undefined,
      )}
      data-slot={dataSlot}
      role="group"
    >
      {assets.map((asset) => (
        <button
          aria-label={`Use ${asset.label}`}
          className={buttonClassName}
          key={asset.id}
          type="button"
          onClick={() => onSelect(asset)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="size-8 object-contain"
            draggable={false}
            src={asset.path}
          />
        </button>
      ))}
    </div>
  )
}
