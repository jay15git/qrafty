import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const PREVIEW_MAX_WIDTH = 640
const FULL_MAX_WIDTH = 4096
const WEBP_QUALITY = 85

export const ALLOWED_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp"])

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

export function slugifyBaseName(fileName) {
  const base = path.basename(fileName, path.extname(fileName))
  return base
    .replace(/-4096x4096$/i, "")
    .replace(/\((\d+)\)/g, "-$1")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function titleCase(label) {
  return label
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
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

/**
 * Shared wallpaper pipeline: for each item resolve a source image path,
 * emit `<id>.webp` + `<id>-preview.webp` into `outDir`, collect a manifest
 * entry, then write the generated TS module and print a summary.
 *
 * items: [{ id, label, resolve(): Promise<string> | string, sourceUrl }]
 */
export async function syncWallpapers({ outDir, publicPath, source, items, module }) {
  ensureDir(outDir)

  const manifest = []

  for (const item of items) {
    const sourcePath = await item.resolve()
    const fullPath = path.join(outDir, `${item.id}.webp`)
    const previewPath = path.join(outDir, `${item.id}-preview.webp`)

    if (!fs.existsSync(fullPath)) {
      process.stdout.write(`Converting ${item.id} (${FULL_MAX_WIDTH}px)...\n`)
      resizeToWebp(sourcePath, fullPath, FULL_MAX_WIDTH)
    }

    if (!fs.existsSync(previewPath)) {
      process.stdout.write(`Preview ${item.id}...\n`)
      resizeToWebp(sourcePath, previewPath, PREVIEW_MAX_WIDTH)
    }

    manifest.push({
      id: item.id,
      label: item.label,
      path: `${publicPath}/${item.id}.webp`,
      previewPath: `${publicPath}/${item.id}-preview.webp`,
      source,
      sourceUrl: item.sourceUrl,
    })
  }

  const ts = `export type ${module.typeName} = {
  id: string
  label: string
  path: string
  previewPath: string
  source: "${source}"
  sourceUrl: string
}

export const ${module.constName}: readonly ${module.typeName}[] = ${JSON.stringify(manifest, null, 2)} as const

export function ${module.getterName}(id: string): ${module.typeName} | undefined {
  return ${module.constName}.find((wallpaper) => wallpaper.id === id)
}
`

  ensureDir(path.dirname(module.targetFile))
  fs.writeFileSync(module.targetFile, ts)

  const fullBytes = manifest.reduce((total, item) => {
    return total + fs.statSync(path.join("public", item.path)).size
  }, 0)

  process.stdout.write(
    `Synced ${manifest.length} ${module.summaryLabel} (${(fullBytes / 1024 / 1024).toFixed(1)} MB full-res webp)\n`,
  )
}

/** Download-backed resolver factory: caches into `cacheDir`, removes cache at end. */
export function makeRemoteResolver({ baseUrl, cacheDir }) {
  ensureDir(cacheDir)
  return (file) => async () => {
    const cachePath = path.join(cacheDir, path.basename(file))
    if (!fs.existsSync(cachePath)) {
      process.stdout.write(`Downloading ${file}...\n`)
      await download(`${baseUrl}/${file}`, cachePath)
    }
    return cachePath
  }
}

export function cleanCache(cacheDir) {
  fs.rmSync(cacheDir, { recursive: true, force: true })
}
