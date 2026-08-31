"use client"

import Image from "next/image"

import { SCENE_WALLPAPERS } from "@/features/workspace/assets/scene-wallpapers"
import { usePersistedScrollNode } from "@/lib/persisted-element-scroll"

export function RaycastWallpaperGrid({
  onSelectWallpaper,
}: {
  onSelectWallpaper: (imagePath: string) => void
}) {
  const setScrollNode = usePersistedScrollNode("raycast-wallpapers")

  return (
    <div
      ref={setScrollNode}
      className="grid max-h-52 grid-cols-3 gap-1.5 overflow-y-auto pr-0.5"
    >
      {SCENE_WALLPAPERS.map((wallpaper) => (
        <button
          key={wallpaper.id}
          aria-label={`Use ${wallpaper.label} wallpaper`}
          className="dn-pressable-pickable relative aspect-[4/3] min-w-0 overflow-hidden dn-squircle-xs"
          type="button"
          onClick={() => onSelectWallpaper(wallpaper.path)}
        >
          <Image
            alt={wallpaper.label}
            className="absolute inset-0 size-full object-cover"
            fill
            sizes="120px"
            src={wallpaper.previewPath}
          />
        </button>
      ))}
    </div>
  )
}
