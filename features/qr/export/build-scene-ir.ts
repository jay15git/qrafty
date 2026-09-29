import type { SceneIr, SceneIrFontRef } from "@qrafty/qr-internal/codegen";

import type { QraftyState } from "@/features/qr/model/state";
import type { CanvasCardState } from "@/features/canvas/model/card-state";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import {
  buildLayeredSvgParts,
  type LayeredSvgParts,
} from "@/features/canvas/export/layered-svg-parts";
import { getArtboardExportBounds } from "@/features/canvas/export/pipeline/bounds";
import {
  DRAFTING_FONT_REGISTRY,
  ensureCanvasFontsForLayers,
  getCanvasFontCssFamily,
} from "@/features/canvas/model/fonts";

export type BuildSceneIrOptions = {
  cardState: CanvasCardState;
  layers: CanvasLayer[];
  state: QraftyState;
  qrMarkup: string;
  shaderSnapshots?: Record<string, string>;
};

function findCardLayer(layers: CanvasLayer[]) {
  return layers.find((layer) => layer.kind === "card" && layer.isVisible) ?? null;
}

function collectFontRefs(layers: CanvasLayer[]): SceneIrFontRef[] {
  const fontIds = new Set<string>();

  const walk = (items: CanvasLayer[]) => {
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
      family: getCanvasFontCssFamily({ fontFamily: entry.family, fontId: entry.id }),
      cssText: "cssText" in entry ? entry.cssText : undefined,
      cssUrl: "cssUrl" in entry ? entry.cssUrl : undefined,
    }));
}

export async function buildSceneIr({
  cardState,
  layers,
  qrMarkup,
  shaderSnapshots,
  state,
}: BuildSceneIrOptions): Promise<SceneIr> {
  await ensureCanvasFontsForLayers(layers);

  const cardLayer = findCardLayer(layers);
  const artboardBounds = cardLayer ? getArtboardExportBounds(cardLayer) : undefined;

  const parts = await buildLayeredSvgParts({
    bounds: artboardBounds,
    cardState,
    layers,
    qrMarkup,
    shaderSnapshots,
    state,
  });

  return {
    bounds: artboardBounds ?? parts.bounds,
    defs: parts.defs,
    body: parts.body,
    fonts: collectFontRefs(layers),
  };
}
