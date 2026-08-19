import fs from "fs"
import path from "path"

const sets = [
  {
    id: "scribbles-doodles",
    label: "Scribbles & Doodles",
    src: "/Users/jayant/Downloads/65 Free Scribbles & Doodles (Community)",
  },
  {
    id: "sketch-elements",
    label: "Sketch Elements",
    src:
      "/Users/jayant/Downloads/Sketch Elements Brushes Set – Visual assets (Community) (2)",
  },
  {
    id: "vector-sticker-pack",
    label: "Vector Stickers",
    src: "/Users/jayant/Downloads/Vector sticker pack (Community)",
  },
  {
    id: "hand-drawn",
    label: "Hand Drawn",
    src: "/Users/jayant/Downloads/100+ Vector Hand Drawn (Community)",
  },
]

function sanitize(name) {
  return (
    name
      .replace(/\.svg$/i, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 80) || "asset"
  )
}

const outRoot = "public/illustrations"
fs.mkdirSync(outRoot, { recursive: true })

const manifest = []

for (const set of sets) {
  const setDir = path.join(outRoot, set.id)
  fs.mkdirSync(setDir, { recursive: true })
  const files = fs.readdirSync(set.src)
    .filter((file) => file.endsWith(".svg"))
    .sort()
  const assets = []
  const used = new Set()

  for (const file of files) {
    let base = sanitize(file)
    let duplicate = 2
    while (used.has(base)) {
      base = `${sanitize(file)}-${duplicate}`
      duplicate += 1
    }
    used.add(base)
    const dest = `${base}.svg`
    fs.copyFileSync(path.join(set.src, file), path.join(setDir, dest))
    assets.push({
      id: base,
      path: `/illustrations/${set.id}/${dest}`,
      label: file.replace(/\.svg$/i, "").replace(/[-_]+/g, " ").trim(),
    })
  }

  manifest.push({ id: set.id, label: set.label, assets })
}

const setIds = manifest.map((set) => JSON.stringify(set.id)).join(" | ")
const ts = `export type IllustrationSetId = ${setIds}

export type IllustrationAsset = {
  id: string
  label: string
  path: string
}

export type IllustrationSet = {
  id: IllustrationSetId
  label: string
  assets: readonly IllustrationAsset[]
}

export const ILLUSTRATION_SETS: readonly IllustrationSet[] = ${JSON.stringify(manifest, null, 2)} as const

export function getIllustrationSet(id: IllustrationSetId): IllustrationSet | undefined {
  return ILLUSTRATION_SETS.find((set) => set.id === id)
}
`

fs.mkdirSync("features/workspace/assets", { recursive: true })
fs.writeFileSync("features/workspace/assets/illustration-sets.ts", ts)

const total = manifest.reduce((count, set) => count + set.assets.length, 0)
console.log(`Synced ${total} SVGs across ${manifest.length} sets`)
