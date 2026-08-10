"use client"

import { useEffect, useState } from "react"

import { buildDocumentPreviewMarkup } from "@/features/qr-code/rendering/document-preview"
import { TEMPLATE_REGISTRY } from "@/features/studio-hub/model/template-registry"

type TemplatePreviewEntry = {
  id: string
  markup: string | null
  source: string
}

export function DevTemplatesClient() {
  const [entries, setEntries] = useState<TemplatePreviewEntry[] | null>(null)

  useEffect(() => {
    let cancelled = false

    void Promise.all(
      TEMPLATE_REGISTRY.map(async (entry) => ({
        id: entry.id,
        markup: await buildDocumentPreviewMarkup(entry.buildDocument()),
        source: entry.source,
      })),
    ).then((nextEntries) => {
      if (!cancelled) {
        setEntries(nextEntries)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (!entries) {
    return (
      <main className="min-h-dvh bg-[oklch(0.92_0.004_260)] p-6">
        <p className="text-sm text-[oklch(0.45_0.02_260)]">Loading template previews…</p>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-[oklch(0.92_0.004_260)] p-6">
      <h1 className="mb-6 text-xs font-semibold tracking-[0.16em] text-[oklch(0.45_0.02_260)] uppercase">
        Template renders · {entries.length}
      </h1>

      <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
        {entries.map((entry) => (
          <figure key={entry.id} className="m-0">
            <figcaption className="mb-2 text-[0.65rem] font-semibold tracking-[0.08em] text-[oklch(0.45_0.02_260)] uppercase">
              {entry.id}
              <span className="ml-2 font-normal opacity-60">{entry.source}</span>
            </figcaption>
            {entry.markup ? (
              <div
                className="overflow-hidden bg-white shadow-[0_2px_12px_oklch(0_0_0_/_0.12)] [&>svg]:block [&>svg]:h-auto [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: entry.markup }}
              />
            ) : (
              <div className="grid h-40 place-items-center bg-white text-[0.7rem] text-red-600">
                preview markup was null
              </div>
            )}
          </figure>
        ))}
      </div>
    </main>
  )
}
