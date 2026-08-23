"use client"

import type { IllustrationAsset } from "@/features/workspace/assets/illustration-sets"

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
  const buttonClassName = isInsertDesktop
    ? "dn-option-tile flex aspect-square w-full min-w-0 items-center justify-center p-1.5 dn-squircle-xs"
    : "flex aspect-square w-full min-w-0 items-center justify-center p-2 text-[var(--ws-ink-muted)] transition hover:bg-[var(--ws-panel-bg-hover)] hover:text-[var(--ws-ink)]"

  return (
    <div
      aria-label="Illustration options"
      className={
        isInsertDesktop
          ? "dn-insert-menu-option-grid dn-insert-menu-option-grid--3"
          : "grid max-h-72 grid-cols-3 gap-0 overflow-y-auto"
      }
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
