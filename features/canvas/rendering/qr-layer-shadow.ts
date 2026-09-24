import type { CanvasLayer } from "@/features/canvas/model/layers/shared";

export function hasCanvasLayerShadow(layer: CanvasLayer) {
  return (
    layer.shadow.visible !== false &&
    layer.shadow.opacity > 0 &&
    (layer.shadow.blur > 0 || layer.shadow.offsetX !== 0 || layer.shadow.offsetY !== 0)
  );
}
