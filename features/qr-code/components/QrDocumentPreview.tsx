"use client"

import * as React from "react"

import {
  buildDocumentPreviewMarkup,
  type DocumentPreviewOptions,
  resolveDocumentNodeId,
} from "@/features/qr-code/rendering/document-preview"
import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"
import { cn } from "@/lib/utils"

type QrDocumentPreviewProps = {
  document: DraftingWorkspaceDocumentV1
  className?: string
  previewOptions?: DocumentPreviewOptions
}

export function QrDocumentPreview({ document, className, previewOptions }: QrDocumentPreviewProps) {
  const [markup, setMarkup] = React.useState<string | null>(null)
  const requestRef = React.useRef(0)
  const cacheKey = React.useMemo(() => {
    const nodeId = resolveDocumentNodeId(document)
    const state = document.qrStateByNodeId[nodeId]
    const cardState = document.cardStateByNodeId[nodeId]
    const layers = document.layerStateByNodeId[nodeId]
    const sceneComposition = document.sceneCompositionByNodeId[nodeId]

    if (!state || !cardState || !layers) {
      return nodeId
    }

    return JSON.stringify({
      cardState,
      layers,
      previewOptions,
      sceneComposition,
      state,
    })
  }, [document, previewOptions])

  React.useEffect(() => {
    const requestId = ++requestRef.current

    void buildDocumentPreviewMarkup(document, previewOptions)
      .then((nextMarkup) => {
        if (requestRef.current !== requestId) {
          return
        }

        setMarkup(nextMarkup)
      })
      .catch(() => {
        if (requestRef.current !== requestId) {
          return
        }

        setMarkup(null)
      })
  }, [cacheKey, document, previewOptions])

  if (!markup) {
    return (
      <div
        data-slot="qr-document-preview"
        className={cn("h-full w-full bg-[var(--desktop-inspector-section-bg)]", className)}
      />
    )
  }

  return (
    <div
      data-slot="qr-document-preview"
      className={cn(
        "flex h-full w-full items-center justify-center [&_svg]:h-full [&_svg]:w-full [&_svg]:object-contain",
        className,
      )}
      aria-hidden
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  )
}
