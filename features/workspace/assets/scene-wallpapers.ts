import { MAC_WALLPAPERS } from "@/features/workspace/assets/mac-wallpapers"
import { RAYCAST_WALLPAPERS } from "@/features/workspace/assets/raycast-wallpapers"
import { STUDIO_WALLPAPERS } from "@/features/workspace/assets/studio-wallpapers"

export type SceneWallpaper = {
  id: string
  label: string
  path: string
  previewPath: string
  source: "macos" | "raycast" | "studio"
  sourceUrl: string
}

export const SCENE_WALLPAPERS: readonly SceneWallpaper[] = [
  ...STUDIO_WALLPAPERS,
  ...MAC_WALLPAPERS,
  ...RAYCAST_WALLPAPERS,
] as const

export function getSceneWallpaper(id: string): SceneWallpaper | undefined {
  return SCENE_WALLPAPERS.find((wallpaper) => wallpaper.id === id)
}
