import type { CanvasTextFontWeight } from "@/features/canvas/model/layers/shared";

export function getNearestFontWeight(value: number, supportedWeights: readonly number[]) {
  return supportedWeights.reduce((nearestWeight, candidateWeight) => {
    const nearestDistance = Math.abs(nearestWeight - value);
    const candidateDistance = Math.abs(candidateWeight - value);

    if (candidateDistance === nearestDistance) {
      return candidateWeight > nearestWeight ? candidateWeight : nearestWeight;
    }

    return candidateDistance < nearestDistance ? candidateWeight : nearestWeight;
  }, supportedWeights[0] ?? 400);
}

export function getFontWeightSliderStep(supportedWeights: readonly number[]) {
  const sortedWeights = [...new Set(supportedWeights)].sort((a, b) => a - b);

  if (sortedWeights.length < 2) {
    return 1;
  }

  return Math.min(
    ...sortedWeights.slice(1).map((fontWeight, index) => fontWeight - sortedWeights[index]),
  );
}

export function getLayerFontWeight(
  fontWeight: CanvasTextFontWeight | undefined,
  supportedWeights: readonly number[],
) {
  if (fontWeight === "bold") {
    return getNearestFontWeight(700, supportedWeights);
  }

  if (typeof fontWeight === "number" && Number.isFinite(fontWeight)) {
    return getNearestFontWeight(fontWeight, supportedWeights);
  }

  return getNearestFontWeight(400, supportedWeights);
}
