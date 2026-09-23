import type { SceneIr, SceneIrFontRef } from "@qrafty/qr-internal/codegen";

import type { QraftyState } from "@/features/qr/model/state";
import type { DraftingCardState } from "@/features/canvas/model/card-state";
import type { DraftingCanvasLayer } from "@/features/canvas/model/layers/shared";
import type { SceneCompositionState } from "@/features/canvas/model/scene-templates";
import type { SceneBackground } from "@/features/canvas/model/scene-templates";
import {
  buildLayeredSvgParts,
  type LayeredSvgParts,
} from "@/features/canvas/export/layered-svg-parts";
import { getArtboardExportBounds } from "@/features/canvas/export/pipeline/bounds";
import { buildLayeredDomParts } from "@/features/canvas/export/layered-dom-parts";
import {
  DRAFTING_FONT_REGISTRY,
  ensureDraftingFontsForLayers,
  getDraftingFontCssFamily,
} from "@/features/canvas/model/fonts";

export type BuildSceneIrOptions = {
  cardState: DraftingCardState;
  layers: DraftingCanvasLayer[];
  sceneComposition?: SceneCompositionState;
  state: QraftyState;
  qrMarkup: string;
  componentName?: string;
  shaderSnapshots?: Record<string, string>;
};

function findCardLayer(layers: DraftingCanvasLayer[]) {
  return layers.find((layer) => layer.kind === "card" && layer.isVisible) ?? null;
}

function collectFontRefs(layers: DraftingCanvasLayer[]): SceneIrFontRef[] {
  const fontIds = new Set<string>();

  const walk = (items: DraftingCanvasLayer[]) => {
    for (const layer of items) {
      if (layer.kind === "text" && layer.fontId) {
        fontIds.add(layer.fontId);
      }
      layer.children?.forEach((child) => walk([child]));
    }
  };

  walk(layers);

  return [...fontIds]
    .map((fontId) => DRAFTING_FONT_REGISTRY.find((entry) => entry.id === fontId))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .map((entry) => ({
      id: entry.id,
      family: getDraftingFontCssFamily({ fontFamily: entry.family, fontId: entry.id }),
      cssText: "cssText" in entry ? entry.cssText : undefined,
      cssUrl: "cssUrl" in entry ? entry.cssUrl : undefined,
    }));
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
  await ensureDraftingFontsForLayers(layers);

  const cardLayer = findCardLayer(layers);
  const artboardBounds = cardLayer ? getArtboardExportBounds(cardLayer) : undefined;

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
  ]);

  return {
    bounds: artboardBounds ?? parts.bounds,
    defs: parts.defs,
    body: parts.body,
    domLayers: domParts.domLayers,
    fonts: collectFontRefs(layers),
    componentName,
  };
}
