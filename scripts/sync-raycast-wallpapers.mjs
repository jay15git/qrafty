import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const RAYCAST_BASE = "https://misc-assets.raycast.com/wallpapers"
const OUT_DIR = "public/backgrounds/raycast"
const PREVIEW_MAX_WIDTH = 640
const FULL_MAX_WIDTH = 4096
const WEBP_QUALITY = 85

/** Full-resolution sources from https://www.raycast.com/wallpapers */
const WALLPAPERS = [
  { id: "glaze-1", file: "glaze_1.heic", label: "Glaze 1" },
  { id: "glaze-2", file: "glaze_2.heic", label: "Glaze 2" },
  { id: "red-distortion-1", file: "red_distortion_1.heic", label: "Red Distortion 1" },
  { id: "red-distortion-2", file: "red_distortion_2.heic", label: "Red Distortion 2" },
  { id: "red-distortion-3", file: "red_distortion_3.heic", label: "Red Distortion 3" },
  { id: "red-distortion-4", file: "red_distortion_4.heic", label: "Red Distortion 4" },
  { id: "blue-distortion-1", file: "blue_distortion_1.heic", label: "Blue Distortion 1" },
  { id: "blue-distortion-2", file: "blue_distortion_2.heic", label: "Blue Distortion 2" },
  { id: "mono-dark-distortion-1", file: "mono_dark_distortion_1.heic", label: "Mono Dark Distortion 1" },
  { id: "mono-dark-distortion-2", file: "mono_dark_distortion_2.heic", label: "Mono Dark Distortion 2" },
  { id: "mono-light-distortion-1", file: "mono_light_distortion_1.heic", label: "Mono Light Distortion 1" },
  { id: "mono-light-distortion-2", file: "mono_light_distortion_2.heic", label: "Mono Light Distortion 2" },
  { id: "chromatic-dark-1", file: "chromatic_dark_1.heic", label: "Chromatic Dark 1" },
  { id: "chromatic-dark-2", file: "chromatic_dark_2.heic", label: "Chromatic Dark 2" },
  { id: "chromatic-light-1", file: "chromatic_light_1.heic", label: "Chromatic Light 1" },
  { id: "chromatic-light-2", file: "chromatic_light_2.heic", label: "Chromatic Light 2" },
  { id: "cube", file: "cube_prod.heic", label: "Cube" },
  { id: "cube-mono", file: "cube_mono.heic", label: "Cube Mono" },
  { id: "loupe", file: "loupe.heic", label: "Loupe" },
  { id: "loupe-mono-dark", file: "loupe-mono-dark.heic", label: "Loupe Mono Dark" },
  { id: "loupe-mono-light", file: "loupe-mono-light.heic", label: "Loupe Mono Light" },
  { id: "blob", file: "blob.heic", label: "Blob" },
  { id: "blob-red", file: "blob-red.heic", label: "Blob Red" },
  { id: "raycast-logo", file: "raycast-logo.heic", label: "Raycast Logo" },
  { id: "autumnal-peach", file: "autumnal-peach.png", label: "Autumnal Peach" },
  { id: "blossom", file: "blossom-2.png", label: "Blossom" },
  { id: "blushing-fire", file: "blushing-fire.png", label: "Blushing Fire" },
  { id: "bright-rain", file: "bright-rain.png", label: "Bright Rain" },
  { id: "floss", file: "floss.png", label: "Floss" },
  { id: "glass-rainbow", file: "glass-rainbow.png", label: "Glass Rainbow" },
  { id: "good-vibes", file: "good-vibes.png", label: "Good Vibes" },
  { id: "moonrise", file: "moonrise.png", label: "Moonrise" },
  { id: "ray-of-lights", file: "ray-of-lights.png", label: "Ray of Lights" },
  { id: "rose-thorn", file: "rose-thorn.png", label: "Rose Thorn" },
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
  const sourceUrl = `${RAYCAST_BASE}/${wallpaper.file}`
  const cachePath = path.join(CACHE_DIR, wallpaper.file)
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
    path: `/backgrounds/raycast/${wallpaper.id}.webp`,
    previewPath: `/backgrounds/raycast/${wallpaper.id}-preview.webp`,
    source: "raycast",
    sourceUrl,
  })
}

const ts = `export type RaycastWallpaper = {
  id: string
  label: string
  path: string
  previewPath: string
  source: "raycast"
  sourceUrl: string
}

export const RAYCAST_WALLPAPERS: readonly RaycastWallpaper[] = ${JSON.stringify(manifest, null, 2)} as const

export function getRaycastWallpaper(id: string): RaycastWallpaper | undefined {
  return RAYCAST_WALLPAPERS.find((wallpaper) => wallpaper.id === id)
}
`

ensureDir("features/workspace/assets")
fs.writeFileSync("features/workspace/assets/raycast-wallpapers.ts", ts)

const fullBytes = manifest.reduce((total, item) => {
  return total + fs.statSync(path.join("public", item.path)).size
}, 0)

process.stdout.write(
  `Synced ${manifest.length} Raycast wallpapers (${(fullBytes / 1024 / 1024).toFixed(1)} MB full-res webp)\n`,
)

fs.rmSync(CACHE_DIR, { recursive: true, force: true })
