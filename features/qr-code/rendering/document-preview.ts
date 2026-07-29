import { DASHBOARD_QR_NODE_ID } from "@/features/qr-code/rendering/compose-scene"
import { buildDraftingLayeredNodePayload } from "@/features/workspace/export/layered-export"
import type { DraftingWorkspaceDocumentV1 } from "@/features/workspace/model/document"

const previewMarkupCache = new Map<string, string>()

export type DocumentPreviewOptions = {
  insetRatio?: number
  suppressShadows?: boolean
}

export const HUB_CARD_DOCUMENT_PREVIEW_OPTIONS: DocumentPreviewOptions = {
  insetRatio: 0.12,
  suppressShadows: true,
}

export function resolveDocumentNodeId(document: DraftingWorkspaceDocumentV1): string {
  return document.activeQrNodeId || DASHBOARD_QR_NODE_ID
}

function buildDocumentPreviewCacheKey(
  document: DraftingWorkspaceDocumentV1,
  options?: DocumentPreviewOptions,
): string | null {
  const nodeId = resolveDocumentNodeId(document)
  const state = document.qrStateByNodeId[nodeId]
  const cardState = document.cardStateByNodeId[nodeId]
  const layers = document.layerStateByNodeId[nodeId]
  const sceneComposition = document.sceneCompositionByNodeId[nodeId]

  if (!state || !cardState || !layers) {
    return null
  }

  return JSON.stringify({
    cardState,
    layers,
    options,
    sceneComposition,
    state,
  })
}

function stripSvgShadows(markup: string): string {
  return markup
    .replace(/<filter\b[^>]*>[\s\S]*?<\/filter>/gi, "")
    .replace(/\sfilter="[^"]*"/gi, "")
    .replace(/<defs>\s*<\/defs>/gi, "")
}

function insetSvgViewBox(markup: string, insetRatio: number): string {
  const viewBoxMatch = markup.match(/\bviewBox="(-?[\d.]+)\s+(-?[\d.]+)\s+([\d.]+)\s+([\d.]+)"/i)
  if (!viewBoxMatch) {
    return markup
  }

  const minX = Number(viewBoxMatch[1])
  const minY = Number(viewBoxMatch[2])
  const width = Number(viewBoxMatch[3])
  const height = Number(viewBoxMatch[4])

  if (![minX, minY, width, height].every(Number.isFinite)) {
    return markup
  }

  const insetX = width * insetRatio
  const insetY = height * insetRatio
  const nextViewBox = `${minX - insetX} ${minY - insetY} ${width + insetX * 2} ${height + insetY * 2}`

  return markup.replace(viewBoxMatch[0], `viewBox="${nextViewBox}"`)
}

function applyDocumentPreviewOptions(markup: string, options?: DocumentPreviewOptions): string {
  let nextMarkup = markup

  if (options?.suppressShadows) {
    nextMarkup = stripSvgShadows(nextMarkup)
  }

  if (options?.insetRatio && options.insetRatio > 0) {
    nextMarkup = insetSvgViewBox(nextMarkup, options.insetRatio)
  }

  return nextMarkup
}

export async function buildDocumentPreviewMarkup(
  document: DraftingWorkspaceDocumentV1,
  options?: DocumentPreviewOptions,
): Promise<string | null> {
  const nodeId = resolveDocumentNodeId(document)
  const state = document.qrStateByNodeId[nodeId]
  const cardState = document.cardStateByNodeId[nodeId]
  const layers = document.layerStateByNodeId[nodeId]
  const sceneComposition = document.sceneCompositionByNodeId[nodeId]

  if (!state || !cardState || !layers) {
    return null
  }

  const cacheKey = buildDocumentPreviewCacheKey(document, options)
  if (!cacheKey) {
    return null
  }

  const cached = previewMarkupCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const payload = await buildDraftingLayeredNodePayload({
    cardState,
    layers,
    name: "preview",
    nodeId,
    sceneComposition,
    state,
  })

  const markup = applyDocumentPreviewOptions(payload.originalSvgMarkup, options)
  previewMarkupCache.set(cacheKey, markup)
  return markup
}
