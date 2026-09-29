import { resolveCanvasFont } from "@/features/canvas/model/fonts";
import { DEFAULT_TEXT_LAYER, type CanvasLayer } from "@/features/canvas/model/layers/shared";
import { getLayerFontWeight, getNearestFontWeight } from "@/features/shell/model/font-weight";

/** Resolved text-format state shared by the desktop + mobile layer toolbars. */
export function getTextLayerFormatState(layer: CanvasLayer) {
  const supportedWeights = resolveCanvasFont({
    fontFamily: layer.fontFamily,
    fontId: layer.fontId,
  }).weights;

  return {
    fontStyle: layer.fontStyle ?? DEFAULT_TEXT_LAYER.fontStyle,
    fontWeight: getLayerFontWeight(layer.fontWeight, supportedWeights),
    supportedWeights,
    textAlign: layer.textAlign ?? DEFAULT_TEXT_LAYER.textAlign,
    underline: Boolean(layer.underline),
  };
}

/** All toggles clear `textRuns` so the layer re-wraps into a single run. */
export function toggleTextBoldPatch(layer: CanvasLayer): Partial<CanvasLayer> {
  const { fontWeight, supportedWeights } = getTextLayerFormatState(layer);
  return {
    fontWeight:
      fontWeight >= 700
        ? getNearestFontWeight(400, supportedWeights)
        : getNearestFontWeight(700, supportedWeights),
    textRuns: undefined,
  };
}

export function toggleTextItalicPatch(layer: CanvasLayer): Partial<CanvasLayer> {
  return {
    fontStyle: (layer.fontStyle ?? DEFAULT_TEXT_LAYER.fontStyle) === "italic" ? "normal" : "italic",
    textRuns: undefined,
  };
}

export function toggleTextUnderlinePatch(layer: CanvasLayer): Partial<CanvasLayer> {
  return { textRuns: undefined, underline: !layer.underline };
}
