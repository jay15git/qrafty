"use client";

import Image from "next/image";

import {
  InspectorOptionGridScrollArea,
  InspectorScrollArea,
} from "@/features/shell/components/InspectorShell";
import {
  INSPECTOR_OPTION_TILE_BUTTON_CLASS,
  INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
  INSPECTOR_SECTION_GAP_CLASS,
} from "@/features/shell/components/inspector-tokens";
import { InspectorSection } from "@/features/shell/components/InspectorControls";
import { InspectorAnimatedOptionGrid } from "@/features/shell/inspector/InspectorOptionGrid";
import { inspectorOptionGridItemClass } from "@/features/shell/inspector/InspectorOptionGrid.classes";
import { MobileCardRail } from "@/features/shell/inspector/MobileSettingsRail";
import { useMobileInspectorDensity } from "@/features/shell/inspector/MobileInspectorDensityContext";
import { SCENE_WALLPAPERS } from "@/features/canvas/assets/scene-wallpapers";
import { preloadRasterImage } from "@/features/canvas/rendering/preload-raster-image";
import { cn } from "@/lib/utils";

function WallpaperButton({
  alt,
  imagePath,
  onClick,
  previewPath,
}: {
  alt: string;
  imagePath: string;
  onClick: () => void;
  previewPath: string;
}) {
  return (
    <button
      aria-label={`Insert ${alt} wallpaper`}
      className={cn(
        "group relative aspect-[4/3] min-w-0 overflow-hidden rounded-[7px] border-2 border-transparent bg-[var(--control-hover)]",
        inspectorOptionGridItemClass(),
        INSPECTOR_OPTION_TILE_BUTTON_CLASS,
      )}
      data-option-interaction="scale"
      data-option-tile="true"
      data-slot="wallpaper-button"
      type="button"
      onClick={onClick}
      onPointerEnter={() => {
        void preloadRasterImage(imagePath);
      }}
    >
      <Image
        alt={alt}
        className={cn(
          "absolute inset-0 size-full object-cover",
          INSPECTOR_OPTION_TILE_SCALE_PREVIEW_CLASS,
        )}
        fill
        sizes="160px"
        src={previewPath}
      />
    </button>
  );
}

export function WallpaperInspector({
  onSelectWallpaper,
}: {
  onClose?: () => void;
  onSelectWallpaper: (imagePath: string) => void;
}) {
  const mobileDensity = useMobileInspectorDensity();

  if (mobileDensity) {
    return (
      <div className="flex min-h-0 min-w-0 flex-1 flex-col" data-slot="wallpaper-inspector">
        <MobileCardRail ariaLabel="Wallpapers" persistKey="drawer:wallpapers">
          {SCENE_WALLPAPERS.map((wallpaper) => (
            <WallpaperButton
              key={wallpaper.id}
              alt={wallpaper.label}
              imagePath={wallpaper.path}
              previewPath={wallpaper.previewPath}
              onClick={() => onSelectWallpaper(wallpaper.path)}
            />
          ))}
        </MobileCardRail>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col" data-slot="wallpaper-inspector">
      <InspectorScrollArea>
        <InspectorSection className={INSPECTOR_SECTION_GAP_CLASS}>
          <InspectorOptionGridScrollArea
            ariaLabel="Wallpapers"
            columns={2}
            dataSlot="wallpapers-scroll-area"
            rowKind="content"
            shelfDataSlot="wallpapers"
            variant="compact"
          >
            <InspectorAnimatedOptionGrid columns={2}>
              {SCENE_WALLPAPERS.map((wallpaper) => (
                <WallpaperButton
                  key={wallpaper.id}
                  alt={wallpaper.label}
                  imagePath={wallpaper.path}
                  previewPath={wallpaper.previewPath}
                  onClick={() => onSelectWallpaper(wallpaper.path)}
                />
              ))}
            </InspectorAnimatedOptionGrid>
          </InspectorOptionGridScrollArea>
        </InspectorSection>
      </InspectorScrollArea>
    </div>
  );
}
