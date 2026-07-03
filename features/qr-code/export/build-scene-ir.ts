import type { SceneIr, SceneIrFontRef, SceneIrShaderNode } from "@new-qr/qr-internal/codegen"
import { shaderRequiresImage } from "@new-qr/qr/shaders"
import type { SceneDocumentV1 } from "@new-qr/qr-internal/scene"

import {
  resolveBitjsonMotionPreset,
  type QrStudioState,
} from "@/features/qr-code/model/state"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import {
  buildLayeredSvgParts,
  type LayeredSvgParts,
} from "@/features/workspace/export/layered-svg-parts"
import { buildLayeredDomParts } from "@/features/workspace/export/layered-dom-parts"
import {
  DRAFTING_FONT_REGISTRY,
  ensureDraftingFontsForLayers,
  getDraftingFontCssFamily,
} from "@/features/workspace/model/fonts"
import { getPaperShaderDefinition } from "@/features/workspace/rendering/paper-shaders"
import type { PaperShaderParams } from "@/features/workspace/rendering/paper-shaders"

export type BuildSceneIrOptions = {
  cardState: DraftingCardState
  layers: DraftingCanvasLayer[]
  state: QrStudioState
  qrMarkup: string
  componentName?: string
  shaderSnapshots?: Record<string, string>
}

function findCardLayer(layers: DraftingCanvasLayer[]) {
  return layers.find((layer) => layer.kind === "card" && layer.isVisible) ?? null
}

function findQrLayer(layers: DraftingCanvasLayer[]) {
  return layers.find((layer) => layer.kind === "qr" && layer.isVisible) ?? null
}

function resolveShaderState(
  cardState: DraftingCardState,
): DraftingCardState["paperShader"] | null {
  if (cardState.styleMode === "paper-shader") {
    return cardState.paperShader
  }

  if (cardState.styleMode === "image-filter") {
    return cardState.imageFilter
  }

  return null
}

function buildCanvasShaderLayerNodes(
  layers: DraftingCanvasLayer[],
  shaderSnapshots?: Record<string, string>,
): SceneIrShaderNode[] {
  return layers
    .filter(
      (layer): layer is DraftingCanvasLayer & {
        kind: "shader"
        paperShader: NonNullable<DraftingCanvasLayer["paperShader"]>
      } => layer.kind === "shader" && layer.isVisible && Boolean(layer.paperShader),
    )
    .map((layer) => {
      const paperShader = layer.paperShader
      const definition = getPaperShaderDefinition(paperShader.shaderId)
      const imageValue =
        shaderRequiresImage(paperShader.shaderId) && paperShader.image.value
          ? paperShader.image.value
          : undefined

      return {
        kind: "shader" as const,
        shader: {
          shaderId: paperShader.shaderId,
          params: structuredClone(paperShader.params),
          frame: paperShader.frame,
          speed: paperShader.speed,
          paused: paperShader.paused,
          image: imageValue ? { value: imageValue } : undefined,
          renderOptions: definition.renderOptions as Record<string, unknown> | undefined,
        },
        bounds: {
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
        },
        snapshotUrl: shaderSnapshots?.[layer.id] ?? shaderSnapshots?.[paperShader.shaderId],
        fallbackFill: "#111827",
      }
    })
}

function buildShaderNodes(
  cardState: DraftingCardState,
  cardLayer: DraftingCanvasLayer | null,
  layers: DraftingCanvasLayer[],
  shaderSnapshots?: Record<string, string>,
): SceneIrShaderNode[] {
  const cardShaderNodes = buildCardShaderNodes(cardState, cardLayer, shaderSnapshots)
  const canvasShaderNodes = buildCanvasShaderLayerNodes(layers, shaderSnapshots)

  return [...cardShaderNodes, ...canvasShaderNodes]
}

function buildCardShaderNodes(
  cardState: DraftingCardState,
  cardLayer: DraftingCanvasLayer | null,
  shaderSnapshots?: Record<string, string>,
): SceneIrShaderNode[] {
  const shaderState = resolveShaderState(cardState)
  if (!shaderState || !cardLayer) {
    return []
  }

  const definition = getPaperShaderDefinition(shaderState.shaderId)
  const imageValue =
    shaderRequiresImage(shaderState.shaderId) && cardState.cardImage.value
      ? cardState.cardImage.value
      : shaderState.image.value

  return [
    {
      kind: "shader",
      shader: {
        shaderId: shaderState.shaderId,
        params: structuredClone(shaderState.params) as PaperShaderParams,
        frame: shaderState.frame,
        speed: shaderState.speed,
        paused: shaderState.paused,
        image: imageValue ? { value: imageValue } : undefined,
        renderOptions: definition.renderOptions as Record<string, unknown> | undefined,
      },
      bounds: {
        x: cardLayer.x,
        y: cardLayer.y,
        width: cardLayer.width,
        height: cardLayer.height,
      },
      snapshotUrl: shaderSnapshots?.[shaderState.shaderId] ?? shaderSnapshots?.card,
      fallbackFill: cardState.fill,
    },
  ]
}

function collectFontRefs(layers: DraftingCanvasLayer[]): SceneIrFontRef[] {
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

export async function buildSceneIr({
  cardState,
  layers,
  state,
  qrMarkup,
  componentName,
  shaderSnapshots,
}: BuildSceneIrOptions): Promise<SceneIr> {
  await ensureDraftingFontsForLayers(layers)

  const parts: LayeredSvgParts = await buildLayeredSvgParts({
    cardState,
    layers,
    state,
    qrMarkup,
  })
  const domParts = await buildLayeredDomParts({
    cardState,
    layers,
    state,
    qrMarkup,
  })

  const cardLayer = findCardLayer(layers)
  const qrLayer = findQrLayer(layers)
  const shaders = buildShaderNodes(cardState, cardLayer, layers, shaderSnapshots)
  const animation = state.dotMatrixAnimation
  const animatedQr =
    qrLayer && animation.enabled && animation.animated
      ? {
          kind: "animated-qr" as const,
          contents: state.data.trim() || "https://example.com",
          externalSvg: qrMarkup,
          bounds: {
            x: qrLayer.x,
            y: qrLayer.y,
            width: qrLayer.width,
            height: qrLayer.height,
          },
          preset: resolveBitjsonMotionPreset(animation),
          hoverEffect: animation.hoverEffect,
        }
      : undefined

  return {
    bounds: parts.bounds,
    defs: parts.defs,
    body: parts.body,
    domLayers: animatedQr
      ? domParts.domLayers.filter((layer) => layer.kind !== "qr")
      : domParts.domLayers,
    shaders,
    animatedQr,
    fonts: collectFontRefs(layers),
    componentName,
  }
}

function parseDecorSvgParts(decorSvg: string) {
  const defsMatch = decorSvg.match(/<defs>([\s\S]*?)<\/defs>/)
  const bodyMatch = decorSvg.match(/<defs>[\s\S]*?<\/defs>([\s\S]*?)<\/svg>/)
  const viewBoxMatch = decorSvg.match(/viewBox="([^"]+)"/)

  let minX = 0
  let minY = 0
  let width = 1
  let height = 1

  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].split(/\s+/).map(Number.parseFloat)
    if (parts.length === 4) {
      ;[minX, minY, width, height] = parts
    }
  }

  return {
    bounds: { minX, minY, width, height },
    defs: defsMatch?.[1] ?? "",
    body: bodyMatch?.[1]?.trim() ?? decorSvg,
  }
}

function sceneCardToShaderNodes(
  card: NonNullable<SceneDocumentV1["cardStateByNodeId"][string]>,
  cardLayer: { x: number; y: number; width: number; height: number } | null,
): SceneIrShaderNode[] {
  const shaderState =
    card.styleMode === "paper-shader"
      ? card.paperShader
      : card.styleMode === "image-filter"
        ? card.imageFilter
        : null

  if (!shaderState || !cardLayer) {
    return []
  }

  const imageValue =
    shaderRequiresImage(shaderState.shaderId) && card.cardImage?.value
      ? card.cardImage.value
      : shaderState.image?.value

  return [
    {
      kind: "shader",
      shader: {
        shaderId: shaderState.shaderId,
        params: structuredClone(shaderState.params) as PaperShaderParams,
        frame: shaderState.frame,
        speed: shaderState.speed,
        paused: shaderState.paused,
        image: imageValue ? { value: imageValue } : undefined,
      },
      bounds: {
        x: cardLayer.x,
        y: cardLayer.y,
        width: cardLayer.width,
        height: cardLayer.height,
      },
      fallbackFill: card.fill,
    },
  ]
}

export function buildSceneIrFromSceneDocument(scene: SceneDocumentV1): SceneIr {
  const node = scene.activeNodeId
  const card = scene.cardStateByNodeId[node]
  const qr = scene.qrStateByNodeId[node]
  const layers = scene.layersByNodeId[node] ?? []
  const cardLayer = layers.find((layer) => layer.kind === "card") ?? null
  const qrLayer = layers.find((layer) => layer.kind === "qr") ?? null
  const decorSvg = scene.decorSvgByNodeId?.[node] ?? ""
  const parts = parseDecorSvgParts(decorSvg)

  return {
    bounds: {
      minX: parts.bounds.minX,
      minY: parts.bounds.minY,
      width: scene.width || parts.bounds.width,
      height: scene.height || parts.bounds.height,
    },
    defs: parts.defs,
    body: parts.body,
    domLayers: [],
    shaders: card ? sceneCardToShaderNodes(card, cardLayer) : [],
    animatedQr:
      qr && qrLayer && qr.motion.enabled && qr.motion.animated
        ? {
            kind: "animated-qr",
            contents: qr.contents,
            externalSvg: qr.externalSvg,
            bounds: {
              x: qrLayer.x,
              y: qrLayer.y,
              width: qrLayer.width,
              height: qrLayer.height,
            },
            preset: qr.motion.preset,
            hoverEffect: qr.motion.hoverEffect,
          }
        : undefined,
    fonts: [],
    componentName: "MyQrCard",
  }
}
