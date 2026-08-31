import type { SceneIr, SceneIrFontRef, SceneIrShaderNode } from "@qrafty/qr-internal/codegen"
import { shaderRequiresImage } from "@qrafty/qr/shaders"

import type { QraftyState } from "@/features/qr-code/model/state"
import type { DraftingCardState } from "@/features/workspace/model/card-state"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { SceneCompositionState } from "@/features/workspace/model/scene-templates"
import type { SceneBackground } from "@/features/workspace/model/scene-templates"
import {
  buildLayeredSvgParts,
  type LayeredSvgParts,
} from "@/features/workspace/export/layered-svg-parts"
import { getArtboardExportBounds } from "@/features/workspace/export/pipeline/bounds"
import { buildLayeredDomParts } from "@/features/workspace/export/layered-dom-parts"
import {
  DRAFTING_FONT_REGISTRY,
  ensureDraftingFontsForLayers,
  getDraftingFontCssFamily,
} from "@/features/workspace/model/fonts"
import { getPaperShaderRenderOptions } from "@/features/workspace/rendering/paper-shader-export"

export type BuildSceneIrOptions = {
  cardState: DraftingCardState
  layers: DraftingCanvasLayer[]
  sceneComposition?: SceneCompositionState
  state: QraftyState
  qrMarkup: string
  componentName?: string
  shaderSnapshots?: Record<string, string>
}

export { getArtboardExportBounds } from "@/features/workspace/export/pipeline/bounds"

function findCardLayer(layers: DraftingCanvasLayer[]) {
  return layers.find((layer) => layer.kind === "card" && layer.isVisible) ?? null
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
      const definitionRenderOptions = getPaperShaderRenderOptions(paperShader.shaderId)
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
          renderOptions: definitionRenderOptions,
          worldWidth: layer.width,
          worldHeight: layer.height,
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

  const definitionRenderOptions = getPaperShaderRenderOptions(shaderState.shaderId)
  const imageValue =
    shaderRequiresImage(shaderState.shaderId) && cardState.cardImage.value
      ? cardState.cardImage.value
      : shaderState.image.value

  return [
    {
      kind: "shader",
      shader: {
        shaderId: shaderState.shaderId,
        params: structuredClone(shaderState.params) as Record<string, unknown>,
        frame: shaderState.frame,
        speed: shaderState.speed,
        paused: shaderState.paused,
        image: imageValue ? { value: imageValue } : undefined,
        renderOptions: definitionRenderOptions,
        worldWidth: cardLayer.width,
        worldHeight: cardLayer.height,
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
  sceneComposition,
  state,
  qrMarkup,
  componentName,
  shaderSnapshots,
}: BuildSceneIrOptions): Promise<SceneIr> {
  await ensureDraftingFontsForLayers(layers)

  const cardLayer = findCardLayer(layers)
  const artboardBounds = cardLayer ? getArtboardExportBounds(cardLayer) : undefined

  const [parts, domParts] = await Promise.all([
    buildLayeredSvgParts({
      bounds: artboardBounds,
      cardState,
      layers,
      qrMarkup,
      shaderSnapshots,
      state,
    }),
    buildLayeredDomParts({
      cardState,
      layers,
      state,
      qrMarkup,
    }),
  ])

  return {
    bounds: artboardBounds ?? parts.bounds,
    defs: parts.defs,
    body: parts.body,
    domLayers: domParts.domLayers,
    shaders: [],
    fonts: collectFontRefs(layers),
    componentName,
  }
}
