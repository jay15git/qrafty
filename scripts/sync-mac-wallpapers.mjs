import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const SOURCE_BASE = "https://www.screenshot-studio.com/r2-assets"
const OUT_DIR = "public/backgrounds/mac"
const PREVIEW_MAX_WIDTH = 640
const FULL_MAX_WIDTH = 4096
const WEBP_QUALITY = 85

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

const CACHE_DIR = path.join(OUT_DIR, ".cache")

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

async function download(url, dest) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.status}`)
  }
  const buffer = Buffer.from(await response.arrayBuffer())
  fs.writeFileSync(dest, buffer)
}

function resizeToWebp(inputPath, outputPath, maxWidth) {
  execFileSync(
    "magick",
    [
      inputPath,
      "-resize",
      `${maxWidth}x${maxWidth}>`,
      "-quality",
      String(WEBP_QUALITY),
      outputPath,
    ],
    { stdio: "pipe" },
  )
}

ensureDir(OUT_DIR)
ensureDir(CACHE_DIR)

const manifest = []

for (const wallpaper of WALLPAPERS) {
  const sourceUrl = `${SOURCE_BASE}/${wallpaper.file}`
  const cacheName = path.basename(wallpaper.file)
  const cachePath = path.join(CACHE_DIR, cacheName)
  const fullPath = path.join(OUT_DIR, `${wallpaper.id}.webp`)
  const previewPath = path.join(OUT_DIR, `${wallpaper.id}-preview.webp`)

  if (!fs.existsSync(cachePath)) {
    process.stdout.write(`Downloading ${wallpaper.file}...\n`)
    await download(sourceUrl, cachePath)
  }

  if (!fs.existsSync(fullPath)) {
    process.stdout.write(`Converting ${wallpaper.id} (${FULL_MAX_WIDTH}px)...\n`)
    resizeToWebp(cachePath, fullPath, FULL_MAX_WIDTH)
  }

  if (!fs.existsSync(previewPath)) {
    process.stdout.write(`Preview ${wallpaper.id}...\n`)
    resizeToWebp(cachePath, previewPath, PREVIEW_MAX_WIDTH)
  }

  manifest.push({
    id: wallpaper.id,
    label: wallpaper.label,
    path: `/backgrounds/mac/${wallpaper.id}.webp`,
    previewPath: `/backgrounds/mac/${wallpaper.id}-preview.webp`,
    source: "macos",
    sourceUrl,
  })
}

const ts = `export type MacWallpaper = {
  id: string
  label: string
  path: string
  previewPath: string
  source: "macos"
  sourceUrl: string
}

export const MAC_WALLPAPERS: readonly MacWallpaper[] = ${JSON.stringify(manifest, null, 2)} as const

export function getMacWallpaper(id: string): MacWallpaper | undefined {
  return MAC_WALLPAPERS.find((wallpaper) => wallpaper.id === id)
}
`

ensureDir("features/workspace/assets")
fs.writeFileSync("features/workspace/assets/mac-wallpapers.ts", ts)

const fullBytes = manifest.reduce((total, item) => {
  return total + fs.statSync(path.join("public", item.path)).size
}, 0)

process.stdout.write(
  `Synced ${manifest.length} macOS wallpapers (${(fullBytes / 1024 / 1024).toFixed(1)} MB full-res webp)\n`,
)

fs.rmSync(CACHE_DIR, { recursive: true, force: true })
