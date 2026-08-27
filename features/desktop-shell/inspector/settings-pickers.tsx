"use client"

import { Search } from "lucide-react"
import Image from "next/image"
import { useEffect, useMemo, useState, type ReactNode } from "react"

import { useMobileInspectorDensity } from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import {
  findBrandIconById,
  getBrandIconById,
  POPULAR_BRAND_ICON_IDS,
} from "@/features/qr-code/assets/brand-icons"
import {
  parseIconstackSelectionId,
  toIconstackSelectionId,
  type IconstackSearchResult,
} from "@/features/qr-code/assets/iconstack-api"
import {
  fetchAndCacheIconstackSvg,
  getCachedIconstackSvg,
} from "@/features/qr-code/assets/iconstack-svg-cache"
import { normalizeIconstackSvgMarkup } from "@/features/qr-code/assets/iconstack-svg"
import { filterCuratedIconstackIcons } from "@/features/qr-code/assets/iconstack-curated"
import { useIconstackCuratedIcons } from "@/features/qr-code/hooks/useIconstackCuratedIcons"
import { useIconstackIconSearch } from "@/features/qr-code/hooks/useIconstackIconSearch"
import { RaycastWallpaperGrid } from "@/features/workspace/components/RaycastWallpaperGrid"
import { usePersistedScrollNode } from "@/lib/persisted-element-scroll"
import { cn } from "@/lib/utils"

function LogoIconTile({
  ariaLabel,
  isSelected,
  onClick,
  children,
}: {
  ariaLabel: string
  isSelected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={isSelected}
      className={cn(
        "dn-logo-icon-picker-tile dn-option-tile dn-preview-tile dn-preview-tile-size dn-pressable-pickable grid min-w-0 place-items-center dn-squircle-xs",
        isSelected && "text-[var(--dn-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function LogoSelectionIcon({ selectedId }: { selectedId: string }) {
  const brandIcon = findBrandIconById(selectedId)
  const parsed = parseIconstackSelectionId(selectedId)
  const [iconstackSvg, setIconstackSvg] = useState<string | undefined>(() =>
    parsed ? getCachedIconstackSvg(selectedId) : undefined,
  )

  useEffect(() => {
    if (!parsed) {
      setIconstackSvg(undefined)
      return
    }

    const cached = getCachedIconstackSvg(selectedId)
    if (cached) {
      setIconstackSvg(cached)
      return
    }

    let cancelled = false
    void fetchAndCacheIconstackSvg({ library: parsed.library, id: parsed.iconId }).then((svg) => {
      if (!cancelled) {
        setIconstackSvg(svg)
      }
    })

    return () => {
      cancelled = true
    }
  }, [parsed, selectedId])

  if (brandIcon) {
    const Icon = brandIcon.icon
    return <Icon aria-hidden className="size-3.5 shrink-0" />
  }

  if (iconstackSvg) {
    return (
      <span
        aria-hidden
        className="flex size-3.5 shrink-0 items-center justify-center text-[var(--dn-fg)] [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: normalizeIconstackSvgMarkup(iconstackSvg) }}
      />
    )
  }

  return (
    <span
      aria-hidden
      className="size-3.5 shrink-0 border border-[color-mix(in_srgb,var(--dn-line)_40%,transparent)] dn-squircle-xs"
    />
  )
}

function IconstackIconPreview({
  previewSvg,
  result,
}: {
  previewSvg?: string
  result: IconstackSearchResult
}) {
  if (previewSvg) {
    return (
      <span
        aria-hidden
        className="dn-logo-icon-picker-icon flex items-center justify-center text-[var(--dn-fg)] [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: normalizeIconstackSvgMarkup(previewSvg) }}
      />
    )
  }

  return (
    <span className="dn-type-caption max-w-full truncate px-1 font-medium leading-none">
      {result.name}
    </span>
  )
}

export function LogoIconPicker({
  onAfterSelect,
  selectedId,
  onSelect,
}: {
  onAfterSelect?: () => void
  selectedId: string
  onSelect: (selectedBrandIconId: string) => void
}) {
  const [query, setQuery] = useState("")
  const popularBrandIcons = useMemo(
    () => POPULAR_BRAND_ICON_IDS.map((id) => getBrandIconById(id)),
    [],
  )
  const curatedIconSlots = useMemo(() => filterCuratedIconstackIcons("all"), [])
  const { canSearch, error, isLoading, previewSvgs, results } = useIconstackIconSearch({
    library: "all",
    query,
  })
  const {
    error: curatedError,
    icons: curatedIcons,
    isLoading: isCuratedLoading,
    previewSvgs: curatedPreviewSvgs,
  } = useIconstackCuratedIcons({
    enabled: !canSearch,
    library: "all",
  })

  const mobileDensity = useMobileInspectorDensity()
  const setScrollNode = usePersistedScrollNode("logo-icon-grid")

  const selectLogo = (nextId: string) => {
    onSelect(nextId)
    onAfterSelect?.()
  }

  return (
    <div className="dn-logo-icon-picker dn-section-stack">
      <div className="dn-logo-icon-picker-search">
        <Search
          aria-hidden
          className="dn-logo-icon-picker-search-icon pointer-events-none text-[var(--dn-muted)]"
        />
        <input
          aria-label="Search logo icons"
          className="dn-content-type-search-input dn-squircle-xs w-full min-w-0"
          placeholder="Search"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
      </div>

      <div
        ref={setScrollNode}
        className={cn(
          "dn-logo-icon-picker-grid",
          !mobileDensity && "max-h-72 overflow-y-auto",
        )}
      >
        {!canSearch ? (
          <>
            {popularBrandIcons.map((brandIcon) => {
              const Icon = brandIcon.icon
              const isSelected = selectedId === brandIcon.id

              return (
                <LogoIconTile
                  key={brandIcon.id}
                  ariaLabel={`Use ${brandIcon.label} brand icon`}
                  isSelected={isSelected}
                  onClick={() => selectLogo(brandIcon.id)}
                >
                  <Icon aria-hidden className="dn-logo-icon-picker-icon" />
                </LogoIconTile>
              )
            })}
            {isCuratedLoading
              ? curatedIconSlots.map((icon) => (
                  <div
                    key={`${icon.library}-${icon.id}`}
                    aria-hidden
                    className="dn-logo-icon-picker-tile dn-preview-tile-size min-w-0 animate-pulse dn-squircle-xs bg-[var(--dn-control)]"
                  />
                ))
              : curatedIcons.map((result) => (
                  <LogoIconTile
                    key={result.id}
                    ariaLabel={`Use ${result.name} icon from ${result.libraryName}`}
                    isSelected={selectedId === toIconstackSelectionId(result)}
                    onClick={() => selectLogo(toIconstackSelectionId(result))}
                  >
                    <IconstackIconPreview
                      previewSvg={curatedPreviewSvgs[result.id]}
                      result={result}
                    />
                  </LogoIconTile>
                ))}
            {curatedError ? (
              <p className="col-span-4 px-1 py-3 text-center text-[var(--dn-popover-muted)] dn-type-meta">
                {curatedError}
              </p>
            ) : null}
          </>
        ) : isLoading ? (
          <p className="col-span-4 px-1 py-6 text-center text-[var(--dn-popover-muted)] dn-type-meta">
            Searching icons…
          </p>
        ) : error ? (
          <p className="col-span-4 px-1 py-6 text-center text-[var(--dn-popover-muted)] dn-type-meta">
            {error}
          </p>
        ) : results.length === 0 ? (
          <p className="col-span-4 px-1 py-6 text-center text-[var(--dn-popover-muted)] dn-type-meta">
            No matches
          </p>
        ) : (
          results.map((result) => (
            <LogoIconTile
              key={result.id}
              ariaLabel={`Use ${result.name} icon from ${result.libraryName}`}
              isSelected={selectedId === toIconstackSelectionId(result)}
              onClick={() => selectLogo(toIconstackSelectionId(result))}
            >
              <IconstackIconPreview previewSvg={previewSvgs[result.id]} result={result} />
            </LogoIconTile>
          ))
        )}
      </div>
    </div>
  )
}

export function WallpaperPicker({
  onAfterSelect,
  onClear,
  onSelectWallpaper,
}: {
  onAfterSelect?: () => void
  onClear?: () => void
  onSelectWallpaper: (imagePath: string) => void
}) {
  const selectWallpaper = (imagePath: string) => {
    onSelectWallpaper(imagePath)
    onAfterSelect?.()
  }

  return (
    <div className="dn-section-stack">
      <button
        className="dn-pressable-press-only dn-type-meta w-full px-2 py-1.5 text-left font-medium text-[var(--dn-popover-muted)] dn-squircle-xs hover:bg-[var(--dn-popover-tile-hover)] hover:text-[var(--dn-fg)]"
        type="button"
        onClick={() => {
          onClear?.()
          onAfterSelect?.()
        }}
      >
        None
      </button>

      <div className="flex flex-col gap-1.5">
        <p className="dn-type-meta px-0.5 font-semibold uppercase tracking-[0.08em] text-[var(--dn-popover-muted)]">
          Wallpapers
        </p>
        <RaycastWallpaperGrid onSelectWallpaper={selectWallpaper} />
      </div>
    </div>
  )
}
