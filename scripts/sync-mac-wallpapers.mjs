import path from "node:path"

import {
  cleanCache,
  makeRemoteResolver,
  syncWallpapers,
} from "./lib/wallpaper-sync.mjs"

const SOURCE_BASE = "https://www.screenshot-studio.com/r2-assets"
const OUT_DIR = "public/backgrounds/mac"
const CACHE_DIR = path.join(OUT_DIR, ".cache")

/** macOS wallpaper sources from opennookorg/screenshot-studio (R2 paths). */
const WALLPAPERS = [
  { id: "mac-asset-1", file: "backgrounds/mac/mac-asset-1.jpeg", label: "macOS 1" },
  { id: "mac-asset-2", file: "backgrounds/mac/mac-asset-2.jpg", label: "macOS 2" },
  { id: "mac-asset-3", file: "backgrounds/mac/mac-asset-3.jpg", label: "macOS 3" },
  { id: "mac-asset-4", file: "backgrounds/mac/mac-asset-4.jpg", label: "macOS 4" },
  { id: "mac-asset-5", file: "backgrounds/mac/mac-asset-5.jpg", label: "macOS 5" },
  { id: "mac-asset-6", file: "backgrounds/mac/mac-asset-6.jpeg", label: "macOS 6" },
  { id: "mac-asset-7", file: "backgrounds/mac/mac-asset-7.png", label: "macOS 7" },
  { id: "mac-asset-8", file: "backgrounds/mac/mac-asset-8.jpg", label: "macOS 8" },
  { id: "mac-asset-9", file: "backgrounds/mac/mac-asset-9.jpg", label: "macOS 9" },
  { id: "mac-asset-10", file: "backgrounds/mac/mac-asset-10.jpg", label: "macOS 10" },
]

const resolve = makeRemoteResolver({ baseUrl: SOURCE_BASE, cacheDir: CACHE_DIR })

await syncWallpapers({
  outDir: OUT_DIR,
  publicPath: "/backgrounds/mac",
  source: "macos",
  items: WALLPAPERS.map(({ id, file, label }) => ({
    id,
    label,
    sourceUrl: `${SOURCE_BASE}/${file}`,
    resolve: resolve(file),
  })),
  module: {
    typeName: "MacWallpaper",
    constName: "MAC_WALLPAPERS",
    getterName: "getMacWallpaper",
    targetFile: "features/workspace/assets/mac-wallpapers.ts",
    summaryLabel: "macOS wallpapers",
  },
})

cleanCache(CACHE_DIR)
