"use client"

import { Filter, Search } from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  findBrandIconById,
  getBrandIconById,
  POPULAR_BRAND_ICON_IDS,
} from "@/features/qr-code/assets/brand-icons"
import {
  ICONSTACK_LIBRARIES,
  ICONSTACK_SELECTION_PREFIX,
  toIconstackSelectionId,
  type IconstackLibraryId,
  type IconstackSearchResult,
} from "@/features/qr-code/assets/iconstack-api"
import { filterCuratedIconstackIcons } from "@/features/qr-code/assets/iconstack-curated"
import { useIconstackCuratedIcons } from "@/features/qr-code/hooks/useIconstackCuratedIcons"
import { useIconstackIconSearch } from "@/features/qr-code/hooks/useIconstackIconSearch"
import { usePexelsPhotos } from "@/features/stock-photos/hooks/usePexelsPhotos"
import {
  PEXELS_ORIENTATION_FILTER_OPTIONS,
  type PexelsPhoto,
  type PexelsPhotoOrientationFilter,
} from "@/features/stock-photos/model/pexels"
import { cn } from "@/lib/utils"

const LOGO_LIBRARY_OPTIONS: Array<{ id: IconstackLibraryId | "all"; label: string }> = [
  { id: "all", label: "All libraries" },
  ...ICONSTACK_LIBRARIES.map((library) => ({ id: library.id, label: library.label })),
]

export function getLogoSelectionLabel(selectedId: string) {
  const brandIcon = findBrandIconById(selectedId)
  if (brandIcon) return brandIcon.label

  if (selectedId.startsWith(ICONSTACK_SELECTION_PREFIX)) {
    const rest = selectedId.slice(ICONSTACK_SELECTION_PREFIX.length)
    const separator = rest.indexOf(":")
    if (separator >= 0) {
      return rest
        .slice(separator + 1)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    }
  }

  return "Choose logo"
}

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
        "dn-pressable-pickable grid h-11 min-w-0 place-items-center dn-squircle-xs",
        isSelected
          ? "bg-[var(--dn-popover-tile)] text-[var(--dn-fg)] ring-2 ring-[var(--dn-fg)] ring-offset-2 ring-offset-[var(--dn-popover-ring-offset)]"
          : "bg-[var(--dn-popover-tile)] text-[var(--dn-popover-muted)]",
      )}
      type="button"
      onClick={onClick}
    >
      {children}
    </button>
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
        className="flex size-4 items-center justify-center [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: previewSvg }}
      />
    )
  }

  return (
    <span className="max-w-full truncate px-1 text-[8px] font-medium leading-none">
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
  const [library, setLibrary] = useState<IconstackLibraryId | "all">("all")
  const [query, setQuery] = useState("")
  const isLibraryFilterActive = library !== "all"
  const popularBrandIcons = useMemo(
    () => POPULAR_BRAND_ICON_IDS.map((id) => getBrandIconById(id)),
    [],
  )
  const curatedIconSlots = useMemo(() => filterCuratedIconstackIcons(library), [library])
  const { canSearch, error, isLoading, previewSvgs, results } = useIconstackIconSearch({
    library,
    query,
  })
  const {
    error: curatedError,
    icons: curatedIcons,
    isLoading: isCuratedLoading,
    previewSvgs: curatedPreviewSvgs,
  } = useIconstackCuratedIcons({
    enabled: !canSearch,
    library,
  })

  const activeLibraryLabel =
    LOGO_LIBRARY_OPTIONS.find((option) => option.id === library)?.label ?? "All libraries"

  const selectLogo = (nextId: string) => {
    onSelect(nextId)
    onAfterSelect?.()
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--dn-popover-muted)]"
          />
          <input
            aria-label="Search logo icons"
            className="dn-content-type-search-input dn-squircle-xs"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={`Filter logo libraries (${activeLibraryLabel})`}
              className="dn-content-type-filter-trigger dn-pressable-press-only inline-flex size-8 shrink-0 items-center justify-center border border-[var(--dn-popover-border)] bg-[var(--dn-popover-control)] text-[var(--dn-popover-muted)] dn-squircle-xs"
              data-active={isLibraryFilterActive ? "true" : undefined}
              type="button"
            >
              <Filter aria-hidden className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="desktopnew-popover-content dn-portal-surface min-w-36 border p-1 dn-squircle-sm"
          >
            {LOGO_LIBRARY_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.id}
                className={cn(
                  "rounded-[8px] px-2 py-1.5 text-[11px] font-medium",
                  library === option.id
                    ? "bg-[var(--dn-popover-tile-hover)] text-[var(--dn-fg)]"
                    : "text-[var(--dn-popover-muted)] focus:bg-[var(--dn-popover-tile-hover)] focus:text-[var(--dn-fg)]",
                )}
                onClick={() => setLibrary(option.id)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid max-h-72 grid-cols-4 gap-1.5 overflow-y-auto pr-0.5">
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
                  <Icon aria-hidden className="size-4" />
                </LogoIconTile>
              )
            })}
            {isCuratedLoading
              ? curatedIconSlots.map((icon) => (
                  <div
                    key={`${icon.library}-${icon.id}`}
                    aria-hidden
                    className="h-11 min-w-0 animate-pulse rounded-[9px] bg-[var(--dn-popover-tile)]"
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
              <p className="col-span-4 px-1 py-3 text-center text-[11px] text-[var(--dn-popover-muted)]">
                {curatedError}
              </p>
            ) : null}
          </>
        ) : isLoading ? (
          <p className="col-span-4 px-1 py-6 text-center text-[11px] text-[var(--dn-popover-muted)]">
            Searching icons…
          </p>
        ) : error ? (
          <p className="col-span-4 px-1 py-6 text-center text-[11px] text-[var(--dn-popover-muted)]">
            {error}
          </p>
        ) : results.length === 0 ? (
          <p className="col-span-4 px-1 py-6 text-center text-[11px] text-[var(--dn-popover-muted)]">
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

function PexelsPhotoTile({
  onClick,
  photo,
}: {
  onClick: () => void
  photo: PexelsPhoto
}) {
  return (
    <button
      aria-label={`Use photo by ${photo.photographer}`}
      className="dn-pressable-pickable relative aspect-[4/3] min-w-0 overflow-hidden dn-squircle-xs"
      type="button"
      onClick={onClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={photo.alt}
        className="absolute inset-0 size-full object-cover"
        loading="lazy"
        src={photo.previewUrl}
      />
    </button>
  )
}

export function PexelsPhotoPicker({
  onAfterSelect,
  onClear,
  onSelectPhoto,
}: {
  onAfterSelect?: () => void
  onClear?: () => void
  onSelectPhoto: (imageUrl: string) => void
}) {
  const [query, setQuery] = useState("")
  const [orientation, setOrientation] = useState<PexelsPhotoOrientationFilter>("all")
  const isOrientationFilterActive = orientation !== "all"
  const { canSearch, error, hasMore, isLoading, isLoadingMore, loadMore, photos } = usePexelsPhotos({
    orientation,
    query,
  })

  const activeOrientationLabel =
    PEXELS_ORIENTATION_FILTER_OPTIONS.find((option) => option.value === orientation)?.label ?? "All"

  const selectPhoto = (imageUrl: string) => {
    onSelectPhoto(imageUrl)
    onAfterSelect?.()
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        className="dn-pressable-press-only w-full px-2 py-1.5 text-left text-[11px] font-medium text-[var(--dn-popover-muted)] dn-squircle-xs hover:bg-[var(--dn-popover-tile-hover)] hover:text-[var(--dn-fg)]"
        type="button"
        onClick={() => {
          onClear?.()
          onAfterSelect?.()
        }}
      >
        None
      </button>

      <div className="flex items-center gap-1.5">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--dn-popover-muted)]"
          />
          <input
            aria-label="Search photos"
            className="dn-content-type-search-input dn-squircle-xs"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={`Filter photo orientation (${activeOrientationLabel})`}
              className="dn-content-type-filter-trigger dn-pressable-press-only inline-flex size-8 shrink-0 items-center justify-center border border-[var(--dn-popover-border)] bg-[var(--dn-popover-control)] text-[var(--dn-popover-muted)] dn-squircle-xs"
              data-active={isOrientationFilterActive ? "true" : undefined}
              type="button"
            >
              <Filter aria-hidden className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="desktopnew-popover-content dn-portal-surface min-w-36 border p-1 dn-squircle-sm"
          >
            {PEXELS_ORIENTATION_FILTER_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                className={cn(
                  "rounded-[8px] px-2 py-1.5 text-[11px] font-medium",
                  orientation === option.value
                    ? "bg-[var(--dn-popover-tile-hover)] text-[var(--dn-fg)]"
                    : "text-[var(--dn-popover-muted)] focus:bg-[var(--dn-popover-tile-hover)] focus:text-[var(--dn-fg)]",
                )}
                onClick={() => setOrientation(option.value)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid max-h-72 grid-cols-2 gap-1.5 overflow-y-auto pr-0.5">
        {isLoading
          ? Array.from({ length: 8 }, (_, index) => (
              <div
                key={`skeleton-${index}`}
                aria-hidden
                className="aspect-[4/3] min-w-0 animate-pulse rounded-[9px] bg-[var(--dn-popover-tile)]"
              />
            ))
          : null}
        {!isLoading && error ? (
          <p className="col-span-2 px-1 py-6 text-center text-[11px] text-[var(--dn-popover-muted)]">
            {error}
          </p>
        ) : null}
        {!isLoading && !error && photos.length === 0 ? (
          <p className="col-span-2 px-1 py-6 text-center text-[11px] text-[var(--dn-popover-muted)]">
            {canSearch ? "No matches" : "No photos available"}
          </p>
        ) : null}
        {!isLoading && !error
          ? photos.map((photo) => (
              <PexelsPhotoTile
                key={photo.id}
                photo={photo}
                onClick={() => selectPhoto(photo.imageUrl)}
              />
            ))
          : null}
      </div>

      {hasMore && !isLoading && !error ? (
        <button
          className="dn-pressable-press-only w-full px-2 py-2 text-center text-[11px] font-medium text-[var(--dn-popover-muted)] dn-squircle-xs hover:bg-[var(--dn-popover-tile-hover)] hover:text-[var(--dn-fg)]"
          disabled={isLoadingMore}
          type="button"
          onClick={() => {
            void loadMore()
          }}
        >
          {isLoadingMore ? "Loading…" : "Load more"}
        </button>
      ) : null}

      <p className="px-1 text-center text-[10px] text-[var(--dn-popover-muted)]">
        Photos provided by{" "}
        <a
          className="underline underline-offset-2 hover:text-[var(--dn-fg)]"
          href="https://www.pexels.com"
          rel="noreferrer"
          target="_blank"
        >
          Pexels
        </a>
      </p>
    </div>
  )
}
