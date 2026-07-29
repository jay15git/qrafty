import { mkdirSync, rmSync, writeFileSync } from "node:fs"

import { Resvg } from "@resvg/resvg-js"

import { buildDocumentPreviewMarkup } from "@/features/qr-code/rendering/document-preview"
import { TEMPLATE_REGISTRY } from "@/features/studio-hub/model/template-registry"

const OUT_DIR = ".render/templates"
const PNG_WIDTH = 720

export async function renderAllTemplates(): Promise<string[]> {
  rmSync(OUT_DIR, { force: true, recursive: true })
  mkdirSync(OUT_DIR, { recursive: true })

  const rendered: string[] = []
  const cards: string[] = []

  for (const entry of TEMPLATE_REGISTRY) {
    const markup = await buildDocumentPreviewMarkup(entry.buildDocument())

    if (!markup) {
      console.warn(`skipped ${entry.id}: preview markup was null`)
      continue
    }

    const png = new Resvg(markup, {
      fitTo: { mode: "width", value: PNG_WIDTH },
      font: { loadSystemFonts: true },
    })
      .render()
      .asPng()

    writeFileSync(`${OUT_DIR}/${entry.id}.png`, png)
    rendered.push(entry.id)
    cards.push(
      `<figure><figcaption>${entry.id}</figcaption><img src="./${entry.id}.png" alt="${entry.id}"></figure>`,
    )
  }

  writeFileSync(
    `${OUT_DIR}/index.html`,
    `<!doctype html><meta charset="utf-8"><title>Template renders</title>
<style>
  body{margin:0;padding:24px;background:#e9e9ec;font:12px ui-sans-serif,system-ui;
       display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;align-items:start}
  figure{margin:0}
  figcaption{margin-bottom:8px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#52525b}
  img{display:block;width:100%;height:auto;box-shadow:0 2px 12px rgba(0,0,0,.12)}
</style>
${cards.join("\n")}`,
  )

  return rendered
}
