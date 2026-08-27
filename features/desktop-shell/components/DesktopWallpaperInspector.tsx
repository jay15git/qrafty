"use client"

import Image from "next/image"

import {
  DesktopInspectorOptionGridScrollArea,
  DesktopInspectorScrollArea,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import {
  DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
  DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
  DESKTOP_INSPECTOR_SECTION_GAP_CLASS,
} from "@/features/desktop-shell/components/desktop-inspector-tokens"
import { DesktopInspectorSection } from "@/features/desktop-shell/components/InspectorControls"
import { DesktopInspectorAnimatedOptionGrid } from "@/features/desktop-shell/inspector/inspector-option-grid"
import { desktopInspectorOptionGridItemClass } from "@/features/desktop-shell/inspector/inspector-option-grid.classes"
import { RAYCAST_WALLPAPERS } from "@/features/workspace/assets/raycast-wallpapers"
import { cn } from "@/lib/utils"

function DesktopWallpaperButton({
  alt,
  onClick,
  previewPath,
}: {
  alt: string
  onClick: () => void
  previewPath: string
}) {
  return (
    <button
      aria-label={`Insert ${alt} wallpaper`}
      className={cn(
        "group relative aspect-[4/3] min-w-0 overflow-hidden rounded-[7px] border-2 border-transparent bg-[var(--desktop-inspector-control-hover-bg)]",
        desktopInspectorOptionGridItemClass(),
        DESKTOP_INSPECTOR_OPTION_TILE_BUTTON_CLASS,
      )}
      data-desktop-option-interaction="scale"
      data-desktop-option-tile="true"
      data-slot="desktop-wallpaper-button"
      type="button"
      onClick={onClick}
    >
      <Image
        alt={alt}
        className={cn(
          "absolute inset-0 size-full object-cover",
          DESKTOP_INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
        )}
        fill
        sizes="160px"
        src={previewPath}
      />
    </button>
  )
}

export function DesktopWallpaperInspector({
  onSelectWallpaper,
}: {
  onClose?: () => void
  onSelectWallpaper: (imagePath: string) => void
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col" data-slot="desktop-wallpaper-inspector">
      <DesktopInspectorScrollArea>
        <DesktopInspectorSection className={DESKTOP_INSPECTOR_SECTION_GAP_CLASS}>
          <DesktopInspectorOptionGridScrollArea
            ariaLabel="Wallpapers"
            columns={2}
            dataSlot="desktop-wallpapers-scroll-area"
            rowKind="content"
            shelfDataSlot="desktop-wallpapers"
            variant="compact"
          >
            <DesktopInspectorAnimatedOptionGrid columns={2}>
              {RAYCAST_WALLPAPERS.map((wallpaper) => (
                <DesktopWallpaperButton
                  key={wallpaper.id}
                  alt={wallpaper.label}
                  previewPath={wallpaper.previewPath}
                  onClick={() => onSelectWallpaper(wallpaper.path)}
                />
              ))}
            </DesktopInspectorAnimatedOptionGrid>
          </DesktopInspectorOptionGridScrollArea>
        </DesktopInspectorSection>
      </DesktopInspectorScrollArea>
    </div>
  )
}
