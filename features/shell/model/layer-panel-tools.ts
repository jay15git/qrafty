import type { SizeTemplate } from "@/features/canvas/model/size-templates";
import type { AppearanceSnapshot } from "@/features/shell/model/appearance";
import { getLayerToolbarCapabilities } from "@/features/shell/model/layer-toolbar-capabilities";
import type { CanvasLayer } from "@/features/canvas/model/layers/shared";

/**
 * Inputs the desktop island and the mobile layer toolbar share to decide which
 * property panels (Add / Layout / Transform / Style / Border / Effects /
 * Shadows) apply to the current selection.
 */
export type LayerPanelToolsInput = {
  appearance?: AppearanceSnapshot | null;
  appearanceLayer?: CanvasLayer | null;
  insertNodeId?: string;
  onAppearancePatch?: (patch: Partial<CanvasLayer>) => void;
  onElementLayerPatch?: (patch: Partial<CanvasLayer>) => void;
  onInsertLayer?: (layer: CanvasLayer) => void;
  onSelectSizeTemplate?: (template: SizeTemplate) => void;
  onTransformLayerPatch?: (patch: Partial<CanvasLayer>) => void;
  selectedElementLayer?: CanvasLayer | null;
  selectedTransformLayer?: CanvasLayer | null;
};

export type LayerPanelTools = {
  canInsert: boolean;
  effectsLayer: CanvasLayer | null;
  effectsPatch: LayerPanelToolsInput["onAppearancePatch"];
  hasBorder: boolean;
  hasEffects: boolean;
  hasLayout: boolean;
  hasShadows: boolean;
  hasStyle: boolean;
  hasTransform: boolean;
  shadowsLayer: CanvasLayer | null;
  shadowsPatch: LayerPanelToolsInput["onAppearancePatch"];
};

export function resolveLayerPanelTools(input: LayerPanelToolsInput): LayerPanelTools {
  const {
    appearance,
    appearanceLayer,
    insertNodeId,
    onAppearancePatch,
    onElementLayerPatch,
    onInsertLayer,
    onSelectSizeTemplate,
    onTransformLayerPatch,
    selectedElementLayer,
    selectedTransformLayer,
  } = input;

  const propertyLayer = selectedTransformLayer ?? selectedElementLayer ?? appearanceLayer ?? null;
  const propertyCapabilities = getLayerToolbarCapabilities(propertyLayer);
  const effectsLayer = selectedElementLayer ?? appearanceLayer ?? null;
  const effectsPatch = selectedElementLayer ? onElementLayerPatch : onAppearancePatch;
  // Shadows apply to every selected layer except the card (background). Element
  // layers patch via onElementLayerPatch; QR/group layers via onAppearancePatch.
  const shadowsLayer = selectedElementLayer ?? selectedTransformLayer ?? null;
  const shadowsPatch = selectedElementLayer ? onElementLayerPatch : onAppearancePatch;

  return {
    canInsert: Boolean(insertNodeId && onInsertLayer),
    effectsLayer,
    effectsPatch,
    hasBorder: Boolean(appearance?.supportsBorder && onAppearancePatch),
    hasEffects: Boolean(effectsLayer && effectsPatch && propertyCapabilities.maxEffects > 0),
    hasLayout: Boolean(onSelectSizeTemplate),
    hasShadows: Boolean(shadowsLayer && shadowsLayer.kind !== "card" && shadowsPatch),
    hasStyle: Boolean(selectedElementLayer && onElementLayerPatch),
    hasTransform: Boolean(selectedTransformLayer && onTransformLayerPatch),
    shadowsLayer,
    shadowsPatch,
  };
}
