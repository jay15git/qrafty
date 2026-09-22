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

import { Loader } from "@/features/shell/components/motion/loader"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SearchIcon, type SearchIconHandle } from "@/components/ui/search-icon"
import { useMobileInspectorDensity } from "@/features/shell/inspector/mobile-inspector-density-context"
import { SettingsInput } from "@/features/shell/inspector/settings-ui"
import {
  findBrandIconById,
  getBrandIconById,
  POPULAR_BRAND_ICON_IDS,
  type BrandIconEntry,
} from "@/features/qr/assets/brand-icons"
import {
  getIconstackErrorMessage,
  parseIconstackResultIconId,
  parseIconstackSelectionId,
  toIconstackSelectionId,
  type IconstackSearchResult,
} from "@/features/qr/assets/iconstack-api"
import {
  fetchAndCacheIconstackSvg,
  getCachedIconstackSvg,
  listCachedIconstackSelectionIds,
  subscribeIconstackSvgCache,
} from "@/features/qr/assets/iconstack-svg-cache"
import { normalizeIconstackSvgMarkup } from "@/features/qr/assets/iconstack-svg"
import { filterCuratedIconstackIcons } from "@/features/qr/assets/iconstack-curated"
import { useIconstackCuratedIcons } from "@/features/qr/hooks/useIconstackCuratedIcons"
import { useIconstackIconSearch } from "@/features/qr/hooks/useIconstackIconSearch"
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
        className="dn-logo-icon-picker-icon flex items-center justify-center text-[var(--fg)] [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: normalizeIconstackSvgMarkup(iconstackSvg) }}
      />
    )
  }

  return (
    <span
      aria-hidden
      className="dn-logo-icon-picker-icon border border-[color-mix(in_srgb,var(--line)_40%,transparent)] dn-squircle-xs"
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
        root: node.closest(".dn-logo-icon-picker-viewport"),
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

function LogoIconPickerEmpty() {
  const iconRef = useRef<SearchIconHandle>(null)

  useEffect(() => {
    iconRef.current?.startAnimation()
  }, [])

  return (
    <div className="dn-logo-icon-picker-state dn-logo-icon-picker-empty col-span-full">
      <SearchIcon
        ref={iconRef}
        aria-hidden
        className="text-[var(--muted)]"
        size={44}
      />
      <div className="flex flex-col items-center gap-0.5">
        <p className="dn-type-meta font-semibold text-[var(--fg)]">
          No matches found
        </p>
        <p className="dn-type-meta text-[var(--popover-muted)]">
          Try a different keyword or spelling
        </p>
      </div>
    </div>
  )
}

function LogoIconPickerSkeletonTiles({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden
          className="dn-logo-icon-picker-skeleton min-w-0 animate-pulse dn-squircle-xs bg-[var(--settings-control)]"
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
      <p className="dn-type-meta text-[var(--popover-muted)]">
        {getIconstackErrorMessage(error)}
      </p>
      <button
        className="dn-pressable-press-only dn-type-meta dn-squircle-xs border border-[var(--line)] px-3 py-1.5 font-medium text-[var(--fg)] hover:bg-[var(--popover-tile-hover)]"
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
        root: node.closest(".dn-logo-icon-picker-viewport"),
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
        <span className="dn-type-meta text-[var(--popover-muted)]">Load more</span>
      </button>
    )
  }

  return <div ref={ref} aria-hidden className="dn-logo-icon-picker-sentinel" />
}

function CuratedLogoIconGrid({
  curatedError,
  curatedIcons,
  curatedPreviewSvgs,
  isCuratedLoading,
  popularBrandIcons,
  selectedId,
  skeletonCount,
  onSelect,
}: {
  curatedError: string | null
  curatedIcons: IconstackSearchResult[]
  curatedPreviewSvgs: Record<string, string>
  isCuratedLoading: boolean
  popularBrandIcons: BrandIconEntry[]
  selectedId: string
  skeletonCount: number
  onSelect: (id: string) => void
}) {
  return (
    <>
      {popularBrandIcons.map((brandIcon) => {
        const isSelected = selectedId === brandIcon.id

        return (
          <LogoIconTile
            key={brandIcon.id}
            ariaLabel={`Use ${brandIcon.label} brand icon`}
            isSelected={isSelected}
            onClick={() => onSelect(brandIcon.id)}
          >
            <LogoPickerTileIcon iconId={brandIcon.id} />
          </LogoIconTile>
        )
      })}
      {isCuratedLoading ? (
        <LogoIconPickerSkeletonTiles count={skeletonCount} />
      ) : (
        curatedIcons.map((result) => (
            <LogoIconTile
              key={result.id}
              ariaLabel={`Use ${result.name} icon from ${result.libraryName}`}
              isSelected={selectedId === toIconstackSelectionId(result)}
              onClick={() => onSelect(toIconstackSelectionId(result))}
            >
              <IconstackIconPreview
                previewSvg={curatedPreviewSvgs[result.id]}
                result={result}
              />
            </LogoIconTile>
          ))
      )}
      {curatedError ? (
        <p className="col-span-4 px-1 py-3 text-center text-[var(--popover-muted)] dn-type-meta">
          {curatedError}
        </p>
      ) : null}
    </>
  )
}

function SearchLogoIconResults({
  error,
  hasMore,
  isLoadingMore,
  isSearching,
  results,
  retry,
  selectedId,
  total,
  onLoadMore,
  onSelect,
}: {
  error: unknown
  hasMore: boolean
  isLoadingMore: boolean
  isSearching: boolean
  results: IconstackSearchResult[]
  retry: () => void
  selectedId: string
  total: number
  onLoadMore: () => void
  onSelect: (id: string) => void
}) {
  const showResultCap =
    results.length > 0 && !hasMore && !isLoadingMore && total > results.length

  return (
    <>
      {results.map((result) => (
        <LogoIconTile
          key={result.id}
          ariaLabel={`Use ${result.name} icon from ${result.libraryName}`}
          isSelected={selectedId === toIconstackSelectionId(result)}
          onClick={() => onSelect(toIconstackSelectionId(result))}
        >
          <LazyIconstackIcon result={result} />
        </LogoIconTile>
      ))}
      {isLoadingMore ? <LogoIconPickerSkeletonTiles count={5} /> : null}
      {error ? <LogoIconPickerError error={error} onRetry={retry} /> : null}
      <LogoIconPickerLoadMore
        enabled={!isSearching && error === null}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
      />
      {showResultCap ? (
        <div className="dn-logo-icon-picker-state col-span-4">
          <p className="dn-type-meta text-[var(--popover-muted)]">
            {total - results.length}+ more — refine search
          </p>
        </div>
      ) : null}
    </>
  )
}

function SearchLogoIconGrid({
  error,
  hasMore,
  isLoading,
  isLoadingMore,
  results,
  retry,
  selectedId,
  total,
  onLoadMore,
  onSelect,
}: {
  error: unknown
  hasMore: boolean
  isLoading: boolean
  isLoadingMore: boolean
  results: IconstackSearchResult[]
  retry: () => void
  selectedId: string
  total: number
  onLoadMore: () => void
  onSelect: (id: string) => void
}) {
  const isSearching = isLoading || isLoadingMore
  const showSearchSkeleton = isLoading && results.length === 0
  const showSearchError = error !== null && results.length === 0
  const showSearchEmpty = !isLoading && error === null && results.length === 0

  if (showSearchSkeleton) {
    return (
      <div className="dn-logo-icon-picker-state dn-logo-icon-picker-empty col-span-full">
        <Loader
          className="text-[var(--muted)]"
          label="Searching icons"
          size={32}
          variant="dots"
        />
      </div>
    )
  }

  if (showSearchError) {
    return <LogoIconPickerError error={error} onRetry={retry} />
  }

  if (showSearchEmpty) {
    return <LogoIconPickerEmpty />
  }

  return (
    <SearchLogoIconResults
      error={error}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      isSearching={isSearching}
      results={results}
      retry={retry}
      selectedId={selectedId}
      total={total}
      onLoadMore={onLoadMore}
      onSelect={onSelect}
    />
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

  const selectLogo = (nextId: string) => {
    onSelect(nextId)
    onAfterSelect?.()
  }

  return (
    <div className="dn-logo-icon-picker dn-section-stack">
      <div className="dn-logo-icon-picker-search">
        <Search
          aria-hidden
          className="dn-logo-icon-picker-search-icon pointer-events-none text-[var(--muted)]"
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

      <ScrollArea
        chevron
        className={cn(
          "dn-logo-icon-picker-scroll min-w-0 w-full",
          !mobileDensity && "dn-logo-icon-picker-scroll-fixed",
        )}
        cueSize="tight"
        orientation="vertical"
        persistKey="logo-icon-grid"
        scrollFade
        viewportClassName="dn-logo-icon-picker-viewport"
      >
      <div
        className={cn(
          "dn-logo-icon-picker-grid",
          mobileDensity && "dn-logo-icon-picker-grid-mobile",
        )}
      >
        {!canSearch ? (
          <CuratedLogoIconGrid
            curatedError={curatedError}
            curatedIcons={curatedIcons}
            curatedPreviewSvgs={curatedPreviewSvgs}
            isCuratedLoading={isCuratedLoading}
            popularBrandIcons={popularBrandIcons}
            selectedId={selectedId}
            skeletonCount={curatedIconSlots.length}
            onSelect={selectLogo}
          />
        ) : (
          <SearchLogoIconGrid
            error={error}
            hasMore={hasMore}
            isLoading={isLoading}
            isLoadingMore={isLoadingMore}
            results={results}
            retry={retry}
            selectedId={selectedId}
            total={total}
            onLoadMore={loadMore}
            onSelect={selectLogo}
          />
        )}
      </div>
      </ScrollArea>
    </div>
  )
}
