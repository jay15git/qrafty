import type { CardItem } from "@/components/ui/DiagonalMarqueeCarousel"
import { SCENE_WALLPAPERS } from "@/features/workspace/assets/scene-wallpapers"
import { getPaperShaderOptionPreviewUrl } from "@/features/workspace/components/paper-shader-option-preview.utils"
import { getAllPaperShaderDefinitions } from "@/features/workspace/rendering/paper-shader-definitions"

export function buildBackgroundBentoCards(): CardItem[] {
  const shaderCards = getAllPaperShaderDefinitions().map((shader) => ({
    id: `shader:${shader.id}`,
    title: shader.label,
    url: getPaperShaderOptionPreviewUrl(shader.id),
  }))

  const wallpaperCards = SCENE_WALLPAPERS.map((wallpaper) => ({
    id: `wallpaper:${wallpaper.id}`,
    title: wallpaper.label,
    url: wallpaper.previewPath,
  }))

  return [...shaderCards, ...wallpaperCards]
}

export const BACKGROUND_BENTO_CARDS = buildBackgroundBentoCards()
