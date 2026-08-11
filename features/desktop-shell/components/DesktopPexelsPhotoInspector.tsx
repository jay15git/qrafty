"use client"

import { FilterMailIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"

import { SecondaryButton } from "@/components/ui/secondary-button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DesktopInspectorOptionGridScrollArea,
  DesktopInspectorScrollArea,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import {
  DESKTOP_INSPECTOR_CAPTION_CLASS,
  DESKTOP_INSPECTOR_FG_MUTED,
  DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
  DESKTOP_INSPECTOR_SECTION_GAP_CLASS,
  DesktopInspectorAnimatedOptionGrid,
  DesktopInspectorMorphFilterMenu,
  DesktopInspectorSearchInput,
  DesktopInspectorSection,
  desktopInspectorOptionGridItemClass,
} from "@/features/desktop-shell/components/InspectorControls"
import { usePexelsPhotos } from "@/features/stock-photos/hooks/usePexelsPhotos"
import {
  PEXELS_ORIENTATION_FILTER_OPTIONS,
  type PexelsPhoto,
  type PexelsPhotoOrientationFilter,
} from "@/features/stock-photos/model/pexels"
import { cn } from "@/lib/utils"

function DesktopPexelsPhotoSkeleton() {
  return (
    <Skeleton
      aria-hidden
      className={cn(
        "aspect-[4/3] min-w-0 rounded-[7px] bg-[var(--desktop-inspector-control-hover-bg)]",
        desktopInspectorOptionGridItemClass(),
      )}
      data-slot="desktop-pexels-photo-skeleton"
    />
  )
}

function DesktopPexelsPhotoButton({
  onClick,
  photo,
}: {
  onClick: () => void
  photo: PexelsPhoto
}) {
  return (
    <button
      aria-label={`Insert photo by ${photo.photographer}`}
      className={cn(
        "group relative aspect-[4/3] min-w-0 overflow-hidden rounded-[7px] border-2 border-transparent bg-[var(--desktop-inspector-control-hover-bg)]",
        desktopInspectorOptionGridItemClass(),
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
      )}
      data-desktop-option-interaction="scale"
      data-desktop-option-tile="true"
      data-slot="desktop-pexels-photo-button"
      type="button"
      onClick={onClick}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt={photo.alt}
        className={cn(
          "absolute inset-0 size-full object-cover",
          DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
        )}
        loading="lazy"
        src={photo.previewUrl}
      />
    </button>
  )
}

export function DesktopPexelsPhotoInspector({
  onSelectPhoto,
}: {
  onClose?: () => void
  onSelectPhoto: (imageUrl: string) => void
}) {
  const [query, setQuery] = useState("")
  const [orientation, setOrientation] = useState<PexelsPhotoOrientationFilter>("all")
  const isOrientationFilterActive = orientation !== "all"
  const { canSearch, error, hasMore, isLoading, isLoadingMore, loadMore, photos } = usePexelsPhotos({
    orientation,
    query,
  })

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col" data-slot="desktop-pexels-photo-inspector">
      <DesktopInspectorScrollArea>
        <DesktopInspectorSection className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
          <div className="flex min-w-0 items-center gap-2">
            <DesktopInspectorSearchInput
              aria-label="Search photos"
              className="h-8 min-w-0 w-full flex-1"
              iconClassName="left-3"
              inputClassName="rounded-full pl-8 pr-3"
              placeholder="Search"
              value={query}
              onValueChange={setQuery}
            />
            <DesktopInspectorMorphFilterMenu
              ariaLabel="Filter photo orientation"
              data-slot="desktop-pexels-orientation-morph"
              icon={
                <HugeiconsIcon
                  icon={FilterMailIcon}
                  size={16}
                  color="currentColor"
                  strokeWidth={1.8}
                />
              }
              isActive={isOrientationFilterActive}
              menuDataSlot="desktop-inspector-filter-menu desktop-pexels-orientation-filter-menu"
              options={PEXELS_ORIENTATION_FILTER_OPTIONS}
              triggerDataSlot="desktop-inspector-filter-trigger desktop-pexels-orientation-filter-trigger"
              value={orientation}
              onValueChange={setOrientation}
            />
          </div>

          <DesktopInspectorOptionGridScrollArea
            ariaLabel="Stock photos"
            className="mt-2"
            columns={2}
            dataSlot="desktop-pexels-photos-scroll-area"
            rowKind="content"
            shelfDataSlot="desktop-pexels-photos"
            variant="compact"
          >
            <DesktopInspectorAnimatedOptionGrid columns={2}>
              {isLoading
                ? Array.from({ length: 8 }, (_, index) => (
                    <DesktopPexelsPhotoSkeleton key={`skeleton-${index}`} />
                  ))
                : null}
              {!isLoading && error ? (
                <p
                  className={cn(
                    "col-span-2 px-1 py-6 text-center",
                    DESKTOP_INSPECTOR_CAPTION_CLASS,
                    DESKTOP_INSPECTOR_FG_MUTED,
                  )}
                >
                  {error}
                </p>
              ) : null}
              {!isLoading && !error && photos.length === 0 ? (
                <p
                  className={cn(
                    "col-span-2 px-1 py-6 text-center",
                    DESKTOP_INSPECTOR_CAPTION_CLASS,
                    DESKTOP_INSPECTOR_FG_MUTED,
                  )}
                >
                  {canSearch ? "No matches" : "No photos available"}
                </p>
              ) : null}
              {!isLoading && !error
                ? photos.map((photo) => (
                    <DesktopPexelsPhotoButton
                      key={photo.id}
                      photo={photo}
                      onClick={() => onSelectPhoto(photo.imageUrl)}
                    />
                  ))
                : null}
            </DesktopInspectorAnimatedOptionGrid>
          </DesktopInspectorOptionGridScrollArea>

          {hasMore && !isLoading && !error ? (
            <div className="mt-2 px-1">
              <SecondaryButton
                className="h-9 w-full"
                disabled={isLoadingMore}
                type="button"
                onClick={() => {
                  void loadMore()
                }}
              >
                {isLoadingMore ? "Loading…" : "Load more"}
              </SecondaryButton>
            </div>
          ) : null}

          <p className={cn("mt-3 px-1 text-center", DESKTOP_INSPECTOR_CAPTION_CLASS, DESKTOP_INSPECTOR_FG_MUTED)}>
            Photos provided by{" "}
            <a
              className="underline underline-offset-2 hover:text-[var(--desktop-inspector-fg-secondary)]"
              href="https://www.pexels.com"
              rel="noreferrer"
              target="_blank"
            >
              Pexels
            </a>
          </p>
        </DesktopInspectorSection>
      </DesktopInspectorScrollArea>
    </div>
  )
}
