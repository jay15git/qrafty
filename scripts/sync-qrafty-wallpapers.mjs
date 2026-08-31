import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const SOURCE_DIR =
  process.env.STUDIO_WALLPAPER_SOURCE_DIR ??
  path.join(process.env.HOME ?? "", "Downloads/New Folder With Items")
const OUT_DIR = "public/backgrounds/studio"
const PREVIEW_MAX_WIDTH = 640
const FULL_MAX_WIDTH = 4096
const WEBP_QUALITY = 85

const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"])

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function slugifyBaseName(fileName) {
  const base = path.basename(fileName, path.extname(fileName))
  return base
    .replace(/-4096x4096$/i, "")
    .replace(/\((\d+)\)/g, "-$1")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function titleCase(label) {
  return label
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
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

function collectSources() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Source directory not found: ${SOURCE_DIR}`)
  }

  const files = fs
    .readdirSync(SOURCE_DIR)
    .filter((file) => ALLOWED_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))

  const usedIds = new Set()
  return files.map((file) => {
    let id = slugifyBaseName(file)
    let suffix = 2
    while (usedIds.has(id)) {
      id = `${slugifyBaseName(file)}-${suffix}`
      suffix += 1
    }
    usedIds.add(id)

    return {
      id,
      file,
      label: titleCase(id),
      sourcePath: path.join(SOURCE_DIR, file),
    }
  })
}

ensureDir(OUT_DIR)

const manifest = []

for (const wallpaper of collectSources()) {
  const fullPath = path.join(OUT_DIR, `${wallpaper.id}.webp`)
  const previewPath = path.join(OUT_DIR, `${wallpaper.id}-preview.webp`)

  if (!fs.existsSync(fullPath)) {
    process.stdout.write(`Converting ${wallpaper.file} (${FULL_MAX_WIDTH}px)...\n`)
    resizeToWebp(wallpaper.sourcePath, fullPath, FULL_MAX_WIDTH)
  }

  if (!fs.existsSync(previewPath)) {
    process.stdout.write(`Preview ${wallpaper.id}...\n`)
    resizeToWebp(wallpaper.sourcePath, previewPath, PREVIEW_MAX_WIDTH)
  }

  manifest.push({
    id: wallpaper.id,
    label: wallpaper.label,
    path: `/backgrounds/studio/${wallpaper.id}.webp`,
    previewPath: `/backgrounds/studio/${wallpaper.id}-preview.webp`,
    source: "studio",
    sourceUrl: wallpaper.file,
  })
}

const ts = `export type StudioWallpaper = {
  id: string
  label: string
  path: string
  previewPath: string
  source: "studio"
  sourceUrl: string
}

export const STUDIO_WALLPAPERS: readonly StudioWallpaper[] = ${JSON.stringify(manifest, null, 2)} as const

export function getStudioWallpaper(id: string): StudioWallpaper | undefined {
  return STUDIO_WALLPAPERS.find((wallpaper) => wallpaper.id === id)
}
`

ensureDir("features/workspace/assets")
fs.writeFileSync("features/workspace/assets/studio-wallpapers.ts", ts)

const fullBytes = manifest.reduce((total, item) => {
  return total + fs.statSync(path.join("public", item.path)).size
}, 0)

process.stdout.write(
  `Synced ${manifest.length} studio wallpapers (${(fullBytes / 1024 / 1024).toFixed(1)} MB full-res webp)\n`,
)
