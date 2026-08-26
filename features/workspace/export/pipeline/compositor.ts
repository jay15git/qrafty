import { preprocessSvg } from "@new-qr/qr-internal/codegen"
import { clampBackgroundShapeTilt } from "@/features/qr-code/model/state"
import { rasterizeSvgMarkupToCanvas } from "@/features/qr-code/rendering/svg-raster"
import type { QrFileExtension } from "@/features/qr-code/model/types"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { QrStudioState } from "@/features/qr-code/model/state"
import {
  buildRoundedRectPath,
  resolveCornerRadii,
} from "@/features/workspace/model/corner-radius"
import {
  buildFontFaceDefs,
  inlineRemoteUrl,
} from "@/features/workspace/export/pipeline/assets"
import {
  buildLayeredSvgParts,
} from "@/features/workspace/export/layered-svg-parts"
import { getArtboardExportBounds } from "@/features/workspace/export/pipeline/bounds"
import { cssFillToCanvasColor, isConicCssFill, paintConicCssFill } from "@/features/workspace/export/svg-css-fill"
import {
  buildAnimatedQrMarkupAtTime,
  shouldExportAnimatedQr,
} from "@/features/workspace/export/pipeline/qr-frames"
import {
  resolveQrExportTimeMs,
  type ExportClockMode,
} from "@/features/workspace/export/pipeline/clock"
import {
  cardLayerNeedsCanvasFace,
  computeObjectFitRect,
  resolveCardShaderMode,
} from "@/features/workspace/export/pipeline/compositor-face"
import {
  WorkspaceShaderCaptureSession,
  type WorkspaceShaderCaptureSession as ShaderSession,
} from "@/features/workspace/export/pipeline/shader-snapshots"
import {
  ensureDraftingFontsForLayers,
  DRAFTING_FONT_REGISTRY,
  getDraftingFontCssFamily,
} from "@/features/workspace/model/fonts"

export type CompositorRenderOptions = {
  backgroundColor?: string
  cardLayer: DraftingCanvasLayer
  cardState: DraftingCardState
  extension?: Exclude<QrFileExtension, "svg">
  layers: DraftingCanvasLayer[]
  mode: ExportClockMode
  nodeId: string
  qrMarkup: string
  shaderBitmaps?: Record<string, ImageBitmap>
  shaderSession?: ShaderSession
  state: QrStudioState
  targetDimensions?: { height: number; width: number }
  videoTimeMs?: number
}

async function loadRasterBitmap(url: string) {
  const inlined = await inlineRemoteUrl(url, "card image")
  const response = await fetch(inlined)

  if (!response.ok) {
    throw new Error("Card image could not be loaded for export.")
  }

  return createImageBitmap(await response.blob())
}

function applyLayerCanvasTransform(
  context: CanvasRenderingContext2D,
  layer: DraftingCanvasLayer,
  bounds: { minX: number; minY: number },
  renderScale = 1,
) {
  const x = (layer.x - bounds.minX) * renderScale
  const y = (layer.y - bounds.minY) * renderScale
  const centerX = (layer.width / 2) * renderScale
  const centerY = (layer.height / 2) * renderScale
  const rotation = Number.isFinite(layer.rotation) ? layer.rotation : 0
  const tiltX = clampBackgroundShapeTilt(layer.tiltX ?? 0)
  const tiltY = clampBackgroundShapeTilt(layer.tiltY ?? 0)

  context.translate(x + centerX, y + centerY)
  if (rotation !== 0) {
    context.rotate((rotation * Math.PI) / 180)
  }
  if (tiltX !== 0 || tiltY !== 0) {
    const skewXRad = (tiltY * Math.PI) / 180
    const skewYRad = (tiltX * Math.PI) / 180
    context.transform(1, Math.tan(skewYRad), Math.tan(skewXRad), 1, 0, 0)
  }
  context.translate(-centerX, -centerY)
  context.globalAlpha = layer.opacity
}

function wrapLayeredSvgMarkup(
  bounds: { height: number; minX: number; minY: number; width: number },
  defs: string,
  body: string,
  fontDefs: string,
) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}"><defs>${fontDefs}${defs}</defs>${body}</svg>`
}

function collectFontRefsFromLayers(layers: DraftingCanvasLayer[]) {
  const fontIds = new Set<string>()

  const walk = (items: DraftingCanvasLayer[]) => {
    for (const layer of items) {
      if (layer.kind === "text" && layer.fontId) {
        fontIds.add(layer.fontId)
      }
      layer.children?.forEach((child) => walk([child]))
    }
  }

  walk(layers)

  return [...fontIds]
    .map((fontId) => DRAFTING_FONT_REGISTRY.find((entry) => entry.id === fontId))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .map((entry) => ({
      id: entry.id,
      family: getDraftingFontCssFamily({ fontFamily: entry.family, fontId: entry.id }),
      cssText: "cssText" in entry ? entry.cssText : undefined,
      cssUrl: "cssUrl" in entry ? entry.cssUrl : undefined,
    }))
}

async function rasterizeLayerBatch({
  bounds,
  cardState,
  fontDefs,
  layers,
  nodeId,
  outputHeight,
  outputWidth,
  qrMarkup,
  state,
}: {
  bounds: { height: number; minX: number; minY: number; width: number }
  cardState: DraftingCardState
  fontDefs: string
  layers: DraftingCanvasLayer[]
  nodeId: string
  outputHeight: number
  outputWidth: number
  qrMarkup: string
  state: QrStudioState
}) {
  const parts = await buildLayeredSvgParts({
    bounds,
    cardState,
    layers,
    omitShaderLayers: true,
    qrMarkup,
    state,
  })
  const svg = preprocessSvg(
    wrapLayeredSvgMarkup(bounds, parts.defs, parts.body, fontDefs),
    { idPrefix: nodeId },
  )

  return rasterizeSvgMarkupToCanvas(svg, outputWidth, outputHeight)
}

function clipCardRoundedRect(
  context: CanvasRenderingContext2D,
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
  renderScale = 1,
) {
  const cardRadii = resolveCornerRadii(cardState.cornerRadii, cardState.cornerRadius)
  const scaledRadii = {
    topLeft: cardRadii.topLeft * renderScale,
    topRight: cardRadii.topRight * renderScale,
    bottomRight: cardRadii.bottomRight * renderScale,
    bottomLeft: cardRadii.bottomLeft * renderScale,
  }
  const clipPath = new Path2D(
    buildRoundedRectPath(layer.width * renderScale, layer.height * renderScale, scaledRadii),
  )
  context.clip(clipPath)
}

function resolveShaderBitmap(
  layer: DraftingCanvasLayer,
  shaderBitmaps: Record<string, ImageBitmap>,
) {
  return (
    shaderBitmaps[layer.id] ??
    (layer.kind === "card" ? shaderBitmaps.card : undefined) ??
    (layer.kind === "shader" && layer.paperShader
      ? shaderBitmaps[layer.paperShader.shaderId]
      : undefined)
  )
}

function drawCanvasFace(
  context: CanvasRenderingContext2D,
  layer: DraftingCanvasLayer,
  cardState: DraftingCardState,
  bounds: { minX: number; minY: number },
  shaderBitmaps: Record<string, ImageBitmap>,
  renderScale: number,
  cardImageBitmap?: ImageBitmap,
) {
  context.save()
  applyLayerCanvasTransform(context, layer, bounds, renderScale)

  const layerWidth = layer.width * renderScale
  const layerHeight = layer.height * renderScale

  if (layer.kind === "card" && cardState.styleMode === "image") {
    if (!cardImageBitmap) {
      throw new Error("Card image could not be captured for export.")
    }

    clipCardRoundedRect(context, layer, cardState, renderScale)
    context.globalAlpha *= cardState.cardImage.opacity / 100
    const fit = computeObjectFitRect(
      cardImageBitmap.width,
      cardImageBitmap.height,
      layerWidth,
      layerHeight,
      cardState.cardImage.fit,
    )
    context.drawImage(cardImageBitmap, fit.x, fit.y, fit.width, fit.height)
    context.restore()
    return
  }

  if (layer.kind === "card" && cardState.styleMode === "solid" && isConicCssFill(cardState.fill)) {
    clipCardRoundedRect(context, layer, cardState, renderScale)
    paintConicCssFill(context, cardState.fill, layerWidth, layerHeight)
    context.restore()
    return
  }

  const bitmap = resolveShaderBitmap(layer, shaderBitmaps)

  if (!bitmap) {
    throw new Error("Shader frame was not captured for export.")
  }

  if (layer.kind === "card" && resolveCardShaderMode(cardState)) {
    clipCardRoundedRect(context, layer, cardState, renderScale)
  }

  context.imageSmoothingEnabled = renderScale !== 1
  context.drawImage(bitmap, 0, 0, layerWidth, layerHeight)
  context.restore()
}

export async function renderWorkspaceCompositorCanvas({
  backgroundColor,
  cardLayer,
  cardState,
  extension,
  layers,
  mode,
  nodeId,
  qrMarkup,
  shaderBitmaps,
  shaderSession,
  state,
  targetDimensions,
  videoTimeMs = 0,
}: CompositorRenderOptions) {
  const ownsSession = !shaderSession && !shaderBitmaps
  const session = shaderSession ?? (ownsSession ? new WorkspaceShaderCaptureSession() : null)
  let uniqueBitmaps = new Set<ImageBitmap>()
  let cardImageBitmap: ImageBitmap | undefined

  try {
    if (session && ownsSession) {
      await session.mount({
        cardLayer,
        cardState,
        layers,
        mode,
        videoTimeMs,
      })
    }

    const resolvedBitmaps =
      shaderBitmaps ??
      (await session?.captureBitmaps(mode, videoTimeMs)) ??
      ({} as Record<string, ImageBitmap>)
    uniqueBitmaps = new Set(Object.values(resolvedBitmaps))
    cardImageBitmap =
      cardState.styleMode === "image" && cardState.cardImage.value
        ? await loadRasterBitmap(cardState.cardImage.value)
        : undefined

    const qrTimeMs = resolveQrExportTimeMs(state, mode, videoTimeMs)
    const resolvedQrMarkup = shouldExportAnimatedQr(state)
      ? buildAnimatedQrMarkupAtTime(qrMarkup, state, qrTimeMs)
      : qrMarkup

    const artboardBounds = getArtboardExportBounds(cardLayer)
    const outputWidth = targetDimensions?.width ?? artboardBounds.width
    const outputHeight = targetDimensions?.height ?? artboardBounds.height
    const renderScale = outputWidth / artboardBounds.width
    const visibleLayers = [...layers]
      .filter((layer) => layer.isVisible)
      .sort((a, b) => a.zIndex - b.zIndex)

    await ensureDraftingFontsForLayers(layers)
    const fontDefs = buildFontFaceDefs(collectFontRefsFromLayers(layers))

    const canvas = document.createElement("canvas")
    canvas.width = outputWidth
    canvas.height = outputHeight
    const context = canvas.getContext("2d")

    if (!context) {
      throw new Error("Could not create export compositor canvas.")
    }

    if (backgroundColor && extension && extension !== "png") {
      context.fillStyle = cssFillToCanvasColor(backgroundColor)
      context.fillRect(0, 0, canvas.width, canvas.height)
    }

    let svgBatch: DraftingCanvasLayer[] = []

    const flushSvgBatch = async () => {
      if (svgBatch.length === 0) {
        return
      }

      const batchCanvas = await rasterizeLayerBatch({
        bounds: artboardBounds,
        cardState,
        fontDefs,
        layers: svgBatch,
        nodeId,
        outputHeight,
        outputWidth,
        qrMarkup: resolvedQrMarkup,
        state,
      })

      context.drawImage(batchCanvas, 0, 0)
      svgBatch = []
    }

    for (const layer of visibleLayers) {
      if (cardLayerNeedsCanvasFace(layer, cardState)) {
        svgBatch.push(layer)
        await flushSvgBatch()
        drawCanvasFace(
          context,
          layer,
          cardState,
          artboardBounds,
          resolvedBitmaps,
          renderScale,
          cardImageBitmap,
        )
        continue
      }

      svgBatch.push(layer)
    }

    await flushSvgBatch()

    return canvas
  } finally {
    if (!shaderBitmaps) {
      for (const bitmap of uniqueBitmaps) {
        bitmap.close()
      }
    }

    cardImageBitmap?.close()

    if (ownsSession) {
      session?.dispose()
    }
  }
}
