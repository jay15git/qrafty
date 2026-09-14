"use client"

import { Search } from "lucide-react"
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react"

import { useMobileInspectorDensity } from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import { SettingsInput } from "@/features/desktop-shell/inspector/settings-ui"
import {
  findBrandIconById,
  getBrandIconById,
  POPULAR_BRAND_ICON_IDS,
} from "@/features/qr-code/assets/brand-icons"
import {
  getIconstackErrorMessage,
  parseIconstackResultIconId,
  parseIconstackSelectionId,
  toIconstackSelectionId,
  type IconstackSearchResult,
} from "@/features/qr-code/assets/iconstack-api"
import {
  fetchAndCacheIconstackSvg,
  getCachedIconstackSvg,
  listCachedIconstackSelectionIds,
  subscribeIconstackSvgCache,
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
      className="dn-logo-icon-picker-tile dn-pressable-pickable grid min-w-0 place-items-center"
      type="button"
      onClick={onClick}
    >
      <span className="dn-logo-icon-picker-tile-inner dn-squircle-xs">{children}</span>
    </button>
  )
}

export function LogoPickerTileIcon({
  iconId,
  previewSvg,
}: {
  iconId: string
  previewSvg?: string
}) {
  const brandIcon = findBrandIconById(iconId)
  const parsed = parseIconstackSelectionId(iconId)

  useSyncExternalStore(
    subscribeIconstackSvgCache,
    listCachedIconstackSelectionIds,
    listCachedIconstackSelectionIds,
  )

  const cachedSvg = parsed ? getCachedIconstackSvg(iconId) : undefined
  const iconstackSvg = previewSvg ?? cachedSvg

  useEffect(() => {
    if (!parsed || iconstackSvg) {
      return
    }

    void fetchAndCacheIconstackSvg({ library: parsed.library, id: parsed.iconId }).catch(
      () => undefined,
    )
  }, [iconstackSvg, parsed, iconId])

  if (brandIcon) {
    const Icon = brandIcon.icon
    return <Icon aria-hidden className="dn-logo-icon-picker-icon" />
  }

  if (iconstackSvg) {
    return (
      <span
        aria-hidden
        className="dn-logo-icon-picker-icon flex items-center justify-center text-[var(--dn-fg)] [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: normalizeIconstackSvgMarkup(iconstackSvg) }}
      />
    )
  }

  return (
    <span
      aria-hidden
      className="dn-logo-icon-picker-icon border border-[color-mix(in_srgb,var(--dn-line)_40%,transparent)] dn-squircle-xs"
    />
  )
}

export function LogoSelectionIcon({ selectedId }: { selectedId: string }) {
  const brandIcon = findBrandIconById(selectedId)
  const parsed = parseIconstackSelectionId(selectedId)
  const [fetchedSvg, setFetchedSvg] = useState<{ id: string; svg: string } | null>(null)
  const iconstackSvg = parsed
    ? (getCachedIconstackSvg(selectedId) ??
      (fetchedSvg?.id === selectedId ? fetchedSvg.svg : undefined))
    : undefined

  useEffect(() => {
    if (!parsed || getCachedIconstackSvg(selectedId)) {
      return
    }

    let cancelled = false
    void fetchAndCacheIconstackSvg({ library: parsed.library, id: parsed.iconId })
      .then((svg) => {
        if (!cancelled) {
          setFetchedSvg({ id: selectedId, svg })
        }
      })
      .catch(() => undefined)

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
      <LogoPickerTileIcon iconId={toIconstackSelectionId(result)} previewSvg={previewSvg} />
    )
  }

  return (
    <span className="dn-type-caption max-w-full truncate px-1 font-medium leading-none">
      {result.name}
    </span>
  )
}

function LazyIconstackIcon({ result }: { result: IconstackSearchResult }) {
  const selectionId = toIconstackSelectionId(result)
  const iconId = parseIconstackResultIconId(result)
  const hostRef = useRef<HTMLSpanElement>(null)
  const [isVisible, setIsVisible] = useState(
    () => typeof IntersectionObserver === "undefined",
  )
  const [failed, setFailed] = useState(false)

  useSyncExternalStore(
    subscribeIconstackSvgCache,
    listCachedIconstackSelectionIds,
    listCachedIconstackSelectionIds,
  )
  const cachedSvg = getCachedIconstackSvg(selectionId)

  useEffect(() => {
    if (isVisible) {
      return
    }
    const node = hostRef.current
    if (!node) {
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        root: node.closest(".dn-logo-icon-picker-grid"),
        rootMargin: "200px",
      },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (!isVisible || cachedSvg || failed) {
      return
    }

    let cancelled = false
    void fetchAndCacheIconstackSvg({ library: result.library, id: iconId }).catch(() => {
      if (!cancelled) {
        setFailed(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [cachedSvg, failed, iconId, isVisible, result.library])

  if (cachedSvg) {
    return <LogoPickerTileIcon iconId={selectionId} previewSvg={cachedSvg} />
  }

  if (failed) {
    return (
      <span className="dn-type-caption max-w-full truncate px-1 font-medium leading-none">
        {result.name}
      </span>
    )
  }

  return (
    <span
      ref={hostRef}
      aria-hidden
      className="dn-logo-icon-picker-icon dn-logo-icon-picker-icon-pending animate-pulse dn-squircle-xs"
    />
  )
}

function LogoIconPickerSkeletonTiles({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden
          className="dn-logo-icon-picker-skeleton min-w-0 animate-pulse dn-squircle-xs bg-[var(--dn-control)]"
        />
      ))}
    </>
  )
}

function LogoIconPickerError({
  error,
  onRetry,
}: {
  error: unknown
  onRetry: () => void
}) {
  return (
    <div className="dn-logo-icon-picker-state col-span-4">
      <p className="dn-type-meta text-[var(--dn-popover-muted)]">
        {getIconstackErrorMessage(error)}
      </p>
      <button
        className="dn-pressable-press-only dn-type-meta dn-squircle-xs border border-[var(--dn-line)] px-3 py-1.5 font-medium text-[var(--dn-fg)] hover:bg-[var(--dn-popover-tile-hover)]"
        type="button"
        onClick={onRetry}
      >
        Retry
      </button>
    </div>
  )
}

function LogoIconPickerLoadMore({
  enabled,
  hasMore,
  onLoadMore,
}: {
  enabled: boolean
  hasMore: boolean
  onLoadMore: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (
      !node ||
      !enabled ||
      !hasMore ||
      typeof IntersectionObserver === "undefined"
    ) {
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore()
        }
      },
      {
        root: node.closest(".dn-logo-icon-picker-grid"),
        rootMargin: "160px",
      },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [enabled, hasMore, onLoadMore])

  if (!hasMore) {
    return null
  }

  if (typeof IntersectionObserver === "undefined") {
    return (
      <button
        className="dn-logo-icon-picker-state col-span-4"
        type="button"
        onClick={onLoadMore}
      >
        <span className="dn-type-meta text-[var(--dn-popover-muted)]">Load more</span>
      </button>
    )
  }

  return <div ref={ref} aria-hidden className="dn-logo-icon-picker-sentinel" />
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
  const {
    canSearch,
    error,
    hasMore,
    isLoading,
    isLoadingMore,
    loadMore,
    results,
    retry,
    total,
  } = useIconstackIconSearch({
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

  const isSearching = isLoading || isLoadingMore
  const showSearchSkeleton = canSearch && isLoading && results.length === 0
  const showSearchError = canSearch && error !== null && results.length === 0
  const showSearchEmpty =
    canSearch && !isLoading && error === null && results.length === 0
  const showResultCap =
    results.length > 0 && !hasMore && !isLoadingMore && total > results.length

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
        <SettingsInput
          aria-label="Search logo icons"
          autoComplete="off"
          className="dn-settings-input dn-squircle-sm w-full min-w-0"
          maxLength={80}
          placeholder="Search icons"
          spellCheck={false}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
      </div>

      <div
        ref={setScrollNode}
        className={cn(
          "dn-logo-icon-picker-grid",
          !mobileDensity && "dn-logo-icon-picker-grid-fixed",
        )}
      >
        {!canSearch ? (
          <>
            {popularBrandIcons.map((brandIcon) => {
              const isSelected = selectedId === brandIcon.id

              return (
                <LogoIconTile
                  key={brandIcon.id}
                  ariaLabel={`Use ${brandIcon.label} brand icon`}
                  isSelected={isSelected}
                  onClick={() => selectLogo(brandIcon.id)}
                >
                  <LogoPickerTileIcon iconId={brandIcon.id} />
                </LogoIconTile>
              )
            })}
            {isCuratedLoading ? (
              <LogoIconPickerSkeletonTiles count={curatedIconSlots.length} />
            ) : (
              curatedIcons.map((result) => (
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
                ))
            )}
            {curatedError ? (
              <p className="col-span-4 px-1 py-3 text-center text-[var(--dn-popover-muted)] dn-type-meta">
                {curatedError}
              </p>
            ) : null}
          </>
        ) : showSearchSkeleton ? (
          <LogoIconPickerSkeletonTiles count={12} />
        ) : showSearchError ? (
          <LogoIconPickerError error={error} onRetry={retry} />
        ) : showSearchEmpty ? (
          <div className="dn-logo-icon-picker-state col-span-4">
            <p className="dn-type-meta text-[var(--dn-popover-muted)]">No matches</p>
          </div>
        ) : (
          <>
            {results.map((result) => (
              <LogoIconTile
                key={result.id}
                ariaLabel={`Use ${result.name} icon from ${result.libraryName}`}
                isSelected={selectedId === toIconstackSelectionId(result)}
                onClick={() => selectLogo(toIconstackSelectionId(result))}
              >
                <LazyIconstackIcon result={result} />
              </LogoIconTile>
            ))}
            {isLoadingMore ? <LogoIconPickerSkeletonTiles count={4} /> : null}
            {error ? <LogoIconPickerError error={error} onRetry={retry} /> : null}
            <LogoIconPickerLoadMore
              enabled={!isSearching && error === null}
              hasMore={hasMore}
              onLoadMore={loadMore}
            />
            {showResultCap ? (
              <div className="dn-logo-icon-picker-state col-span-4">
                <p className="dn-type-meta text-[var(--dn-popover-muted)]">
                  {total - results.length}+ more — refine search
                </p>
              </div>
            ) : null}
          </>
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
