import fs from "node:fs"
import path from "node:path"

import {
  ALLOWED_EXTENSIONS,
  slugifyBaseName,
  syncWallpapers,
  titleCase,
} from "./lib/wallpaper-sync.mjs"

const SOURCE_DIR =
  process.env.STUDIO_WALLPAPER_SOURCE_DIR ??
  path.join(process.env.HOME ?? "", "Downloads/New Folder With Items")
const OUT_DIR = "public/backgrounds/studio"

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

await syncWallpapers({
  outDir: OUT_DIR,
  publicPath: "/backgrounds/studio",
  source: "studio",
  items: collectSources().map(({ id, file, label, sourcePath }) => ({
    id,
    label,
    sourceUrl: file,
    resolve: () => sourcePath,
  })),
  module: {
    typeName: "QraftyWallpaper",
    constName: "QRAFTY_WALLPAPERS",
    getterName: "getQraftyWallpaper",
    targetFile: "features/workspace/assets/qrafty-wallpapers.ts",
    summaryLabel: "studio wallpapers",
  },
})
