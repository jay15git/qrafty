import {
  legacyShadowToShadowLayer,
  shadowLayerToLegacyShadow,
} from "@/features/canvas/model/effects";
import { syncBlurFilter, syncLegacyBlurFromFilters } from "@/features/canvas/model/filters";
import { buildCornerRadiusLayerPatch } from "@/features/canvas/model/corner-radius";
import { normalizeCanvasLayer } from "@/features/canvas/model/layers/normalize";
import {
  normalizeDraftingLayerShadow,
  type CanvasLayer,
} from "@/features/canvas/model/layers/shared";

export function patchCanvasLayer(layer: CanvasLayer, patch: Partial<CanvasLayer>): CanvasLayer {
  const merged = { ...layer, ...patch };

  if (patch.shadow && !patch.shadows) {
    merged.shadows = [
      legacyShadowToShadowLayer(
        {
          ...layer.shadow,
          ...patch.shadow,
        },
        layer.shadows[0]?.id,
      ),
      ...layer.shadows.slice(1),
    ];
  }

  if (patch.shadows) {
    merged.shadow = normalizeDraftingLayerShadow(
      shadowLayerToLegacyShadow(
        patch.shadows[0] ?? layer.shadows[0] ?? legacyShadowToShadowLayer(layer.shadow),
      ),
      layer.shadow,
    );
  }

  if (patch.blur !== undefined && patch.layerFilters === undefined) {
    merged.layerFilters = syncBlurFilter(layer.layerFilters, patch.blur);
  }

  if (patch.layerFilters) {
    merged.blur = syncLegacyBlurFromFilters(patch.layerFilters);
  }

  const cornerRadiusPatch = buildCornerRadiusLayerPatch(layer, patch);
  if (cornerRadiusPatch.cornerRadius !== undefined) {
    merged.cornerRadius = cornerRadiusPatch.cornerRadius;
  }
  if (cornerRadiusPatch.cornerRadii !== undefined) {
    merged.cornerRadii = cornerRadiusPatch.cornerRadii;
  }

  return normalizeCanvasLayer(layer.nodeId, merged, [layer]) ?? layer;
}
