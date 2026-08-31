export type MacWallpaper = {
  id: string
  label: string
  path: string
  previewPath: string
  source: "macos"
  sourceUrl: string
}

export const MAC_WALLPAPERS: readonly MacWallpaper[] = [
  {
    "id": "mac-asset-1",
    "label": "macOS 1",
    "path": "/backgrounds/mac/mac-asset-1.webp",
    "previewPath": "/backgrounds/mac/mac-asset-1-preview.webp",
    "source": "macos",
    "sourceUrl": "https://www.screenshot-studio.com/r2-assets/backgrounds/mac/mac-asset-1.jpeg"
  },
  {
    "id": "mac-asset-2",
    "label": "macOS 2",
    "path": "/backgrounds/mac/mac-asset-2.webp",
    "previewPath": "/backgrounds/mac/mac-asset-2-preview.webp",
    "source": "macos",
    "sourceUrl": "https://www.screenshot-studio.com/r2-assets/backgrounds/mac/mac-asset-2.jpg"
  },
  {
    "id": "mac-asset-3",
    "label": "macOS 3",
    "path": "/backgrounds/mac/mac-asset-3.webp",
    "previewPath": "/backgrounds/mac/mac-asset-3-preview.webp",
    "source": "macos",
    "sourceUrl": "https://www.screenshot-studio.com/r2-assets/backgrounds/mac/mac-asset-3.jpg"
  },
  {
    "id": "mac-asset-4",
    "label": "macOS 4",
    "path": "/backgrounds/mac/mac-asset-4.webp",
    "previewPath": "/backgrounds/mac/mac-asset-4-preview.webp",
    "source": "macos",
    "sourceUrl": "https://www.screenshot-studio.com/r2-assets/backgrounds/mac/mac-asset-4.jpg"
  },
  {
    "id": "mac-asset-5",
    "label": "macOS 5",
    "path": "/backgrounds/mac/mac-asset-5.webp",
    "previewPath": "/backgrounds/mac/mac-asset-5-preview.webp",
    "source": "macos",
    "sourceUrl": "https://www.screenshot-studio.com/r2-assets/backgrounds/mac/mac-asset-5.jpg"
  },
  {
    "id": "mac-asset-6",
    "label": "macOS 6",
    "path": "/backgrounds/mac/mac-asset-6.webp",
    "previewPath": "/backgrounds/mac/mac-asset-6-preview.webp",
    "source": "macos",
    "sourceUrl": "https://www.screenshot-studio.com/r2-assets/backgrounds/mac/mac-asset-6.jpeg"
  },
  {
    "id": "mac-asset-7",
    "label": "macOS 7",
    "path": "/backgrounds/mac/mac-asset-7.webp",
    "previewPath": "/backgrounds/mac/mac-asset-7-preview.webp",
    "source": "macos",
    "sourceUrl": "https://www.screenshot-studio.com/r2-assets/backgrounds/mac/mac-asset-7.png"
  },
  {
    "id": "mac-asset-8",
    "label": "macOS 8",
    "path": "/backgrounds/mac/mac-asset-8.webp",
    "previewPath": "/backgrounds/mac/mac-asset-8-preview.webp",
    "source": "macos",
    "sourceUrl": "https://www.screenshot-studio.com/r2-assets/backgrounds/mac/mac-asset-8.jpg"
  },
  {
    "id": "mac-asset-9",
    "label": "macOS 9",
    "path": "/backgrounds/mac/mac-asset-9.webp",
    "previewPath": "/backgrounds/mac/mac-asset-9-preview.webp",
    "source": "macos",
    "sourceUrl": "https://www.screenshot-studio.com/r2-assets/backgrounds/mac/mac-asset-9.jpg"
  },
  {
    "id": "mac-asset-10",
    "label": "macOS 10",
    "path": "/backgrounds/mac/mac-asset-10.webp",
    "previewPath": "/backgrounds/mac/mac-asset-10-preview.webp",
    "source": "macos",
    "sourceUrl": "https://www.screenshot-studio.com/r2-assets/backgrounds/mac/mac-asset-10.jpg"
  }
] as const

export function getMacWallpaper(id: string): MacWallpaper | undefined {
  return MAC_WALLPAPERS.find((wallpaper) => wallpaper.id === id)
}
