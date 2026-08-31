import { MAC_WALLPAPERS } from "@/features/workspace/assets/mac-wallpapers"
import { RAYCAST_WALLPAPERS } from "@/features/workspace/assets/raycast-wallpapers"
import { QRAFTY_WALLPAPERS } from "@/features/workspace/assets/qrafty-wallpapers"

export type SceneWallpaper = {
  id: string
  label: string
  path: string
  previewPath: string
  source: "macos" | "raycast" | "studio"
  sourceUrl: string
}

export const SCENE_WALLPAPERS: readonly SceneWallpaper[] = [
  ...QRAFTY_WALLPAPERS,
  ...MAC_WALLPAPERS,
  ...RAYCAST_WALLPAPERS,
] as const

export function getSceneWallpaper(id: string): SceneWallpaper | undefined {
  return SCENE_WALLPAPERS.find((wallpaper) => wallpaper.id === id)
}
