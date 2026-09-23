import type {
  ExportTarget,
  LayerRow,
  LogoSourceMode,
  TextSettings,
} from "@/features/shell/components/FloatingToolbar"
import type { ExternalAssetSourceMode } from "@/features/shell/model/toolbar-types"
import {
  DEFAULT_DRAFTING_TEXT_LAYER,
  type DraftingCanvasLayer,
} from "@/features/canvas/model/layers/shared"
import { cloneDraftingCanvasLayer } from "@/features/canvas/model/layers/fallback"
import { patchDraftingCanvasLayer } from "@/features/canvas/model/layers/patch"
import type { AssetSourceMode } from "@/features/qr/model/state"

const DRAFTING_LAYER_CLIPBOARD_TYPE = "qrafty/drafting-layers"
const DRAFTING_LAYER_CLIPBOARD_VERSION = 1

export type DraftingDownloadTarget = "all-qr" | "current" | "surface" | `qr:${string}`

export function parseValueSegmentsText(text: string) {
  const segments = text
    .split("\n")
    .map((segment) => segment.trim())
    .filter(Boolean)

  return segments.length > 0 ? segments : undefined
}

export function formatValueSegmentsText(segments: string[] | undefined) {
  return segments?.join("\n") ?? ""
}

export function getLogoSourceMode(source: AssetSourceMode): LogoSourceMode {
  if (source === "preset") return "brand"
  if (source === "url" || source === "upload") return "upload"
  return "none"
}

export function getAssetSourceMode(source: "none" | "upload" | "url"): ExternalAssetSourceMode {
  return source === "url" ? "url" : "upload"
}

export function getExportTarget(target: DraftingDownloadTarget): ExportTarget {
  if (target === "all-qr") return "all-qr"
  if (target === "surface") return "surface"
  return "current"
}

export function getDraftingDownloadTarget(target: ExportTarget): DraftingDownloadTarget {
  if (target === "all-qr") return "all-qr"
  if (target === "surface") return "surface"
  return "current"
}

export function toLayerRow(layer: DraftingCanvasLayer): LayerRow {
  return {
    blur: layer.blur,
    height: Math.round(layer.height),
    id: layer.id,
    isVisible: layer.isVisible,
    kind:
      layer.kind === "text"
        ? "text"
        : layer.kind === "card"
          ? "card"
          : layer.kind === "image"
            ? "image"
            : layer.kind === "shape"
              ? "shape"
              : layer.kind === "shader"
                ? "shader"
                : "qr",
    name: layer.name,
    opacity: Math.round(layer.opacity * 100),
    shadowBlur: layer.shadow.blur,
    shadowColor: layer.shadow.color,
    shadowOffsetX: layer.shadow.offsetX,
    shadowOffsetY: layer.shadow.offsetY,
    shadowOpacity: layer.shadow.opacity,
    tiltX: layer.tiltX ?? 0,
    tiltY: layer.tiltY ?? 0,
    width: Math.round(layer.width),
    x: Math.round(layer.x),
    y: Math.round(layer.y),
  }
}

export function isMandatoryLayerRow(row: Pick<LayerRow, "kind">) {
  return row.kind === "card"
}

export function ensureMandatoryLayerRows(
  rows: LayerRow[],
  currentLayers: DraftingCanvasLayer[],
): LayerRow[] {
  const cardLayer = currentLayers.find((layer) => layer.kind === "card")
  if (!cardLayer) {
    return rows
  }

  if (rows.some((row) => row.id === cardLayer.id)) {
    return rows
  }

  return [...rows, toLayerRow(cardLayer)]
}

export function getLayerTextSettings(layer: DraftingCanvasLayer | null): TextSettings {
  const textLayer = layer?.kind === "text" ? layer : null
  return {
    fill: textLayer?.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill,
    fontFamily: textLayer?.fontFamily ?? DEFAULT_DRAFTING_TEXT_LAYER.fontFamily,
    fontId: textLayer?.fontId ?? DEFAULT_DRAFTING_TEXT_LAYER.fontId,
    fontSize: textLayer?.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize,
    fontStyle: textLayer?.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle,
    fontWeight: textLayer?.fontWeight ?? DEFAULT_DRAFTING_TEXT_LAYER.fontWeight,
    letterSpacing: textLayer?.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing,
    lineHeight: textLayer?.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight,
    text: textLayer?.text ?? DEFAULT_DRAFTING_TEXT_LAYER.text,
    textAlign: textLayer?.textAlign ?? DEFAULT_DRAFTING_TEXT_LAYER.textAlign,
    underline: textLayer?.underline ?? DEFAULT_DRAFTING_TEXT_LAYER.underline,
  }
}

export function patchDraftingLayerById(
  layer: DraftingCanvasLayer,
  layerId: string,
  patch: Partial<DraftingCanvasLayer>,
): DraftingCanvasLayer {
  if (layer.id === layerId) {
    return patchDraftingCanvasLayer(layer, patch)
  }

  if (!layer.children?.length) {
    return layer
  }

  let childrenChanged = false
  const children = layer.children.map((child) => {
    const nextChild = patchDraftingLayerById(child, layerId, patch)
    if (nextChild !== child) {
      childrenChanged = true
    }
    return nextChild
  })

  if (!childrenChanged) {
    return layer
  }

  return patchDraftingCanvasLayer(
    {
      ...layer,
      children,
    },
    {},
  )
}

export function findDraftingLayerById(
  layers: DraftingCanvasLayer[],
  layerId: string,
): DraftingCanvasLayer | null {
  for (const layer of layers) {
    if (layer.id === layerId) {
      return layer
    }

    const child = layer.children ? findDraftingLayerById(layer.children, layerId) : null

    if (child) {
      return child
    }
  }

  return null
}

export function isEditableShortcutTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]',
    ),
  )
}

function getDraftingClipboardBounds(layers: DraftingCanvasLayer[]) {
  const left = Math.min(...layers.map((layer) => layer.x))
  const top = Math.min(...layers.map((layer) => layer.y))
  const right = Math.max(...layers.map((layer) => layer.x + layer.width))
  const bottom = Math.max(...layers.map((layer) => layer.y + layer.height))

  return {
    height: bottom - top,
    width: right - left,
    x: left,
    y: top,
  }
}

export function getDraftingLayerClipboardPayload({
  layerIds,
  layers,
  paneId,
}: {
  layerIds: string[]
  layers: DraftingCanvasLayer[]
  paneId: string
}) {
  const selectedIdSet = new Set(layerIds)
  const selectedLayers = layers.filter((layer) => selectedIdSet.has(layer.id))

  if (selectedLayers.length === 0) {
    return null
  }

  return JSON.stringify({
    bounds: getDraftingClipboardBounds(selectedLayers),
    layers: selectedLayers.map(cloneDraftingCanvasLayer),
    sourceNodeId: paneId,
    type: DRAFTING_LAYER_CLIPBOARD_TYPE,
    version: DRAFTING_LAYER_CLIPBOARD_VERSION,
  })
}

export function parseDraftingLayerClipboardPayload(value: string) {
  try {
    const payload = JSON.parse(value) as unknown

    if (!isRecord(payload) || payload.type !== DRAFTING_LAYER_CLIPBOARD_TYPE) {
      return null
    }

    if (payload.version !== DRAFTING_LAYER_CLIPBOARD_VERSION || !Array.isArray(payload.layers)) {
      return null
    }

    const bounds = isRecord(payload.bounds)
      ? {
          height: readClipboardNumber(payload.bounds.height, 1),
          width: readClipboardNumber(payload.bounds.width, 1),
          x: readClipboardNumber(payload.bounds.x, 0),
          y: readClipboardNumber(payload.bounds.y, 0),
        }
      : { height: 1, width: 1, x: 0, y: 0 }

    return {
      bounds,
      layers: payload.layers as DraftingCanvasLayer[],
      sourceNodeId: typeof payload.sourceNodeId === "string" ? payload.sourceNodeId : null,
    }
  } catch {
    return null
  }
}

function readClipboardNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value))
}
