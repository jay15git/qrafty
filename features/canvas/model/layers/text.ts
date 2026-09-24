import {
  getDraftingFontByFamily,
  getDraftingFontById,
  resolveDraftingFont,
} from "@/features/canvas/model/fonts";
import {
  clamp,
  DEFAULT_DRAFTING_TEXT_LAYER,
  isRecord,
  normalizeHexColor,
  normalizeShapeFillGradient,
  normalizeSharedCanvasLayerFields,
  readFiniteNumber,
  type CanvasLayer,
  type DraftingShapeFillMode,
  type DraftingTextAlign,
  type DraftingTextFontWeight,
  type DraftingTextRun,
  type NormalizeDraftingLayerContext,
} from "@/features/canvas/model/layers/shared";

export function normalizeTextCanvasLayer(
  context: NormalizeDraftingLayerContext & { kind: "text" },
): CanvasLayer {
  const { fallback, value } = context;
  const text =
    typeof value.text === "string"
      ? value.text
      : (fallback.text ?? DEFAULT_DRAFTING_TEXT_LAYER.text);

  return {
    ...normalizeSharedCanvasLayerFields(context),
    fill: normalizeHexColor(value.fill, fallback.fill ?? DEFAULT_DRAFTING_TEXT_LAYER.fill),
    fillGradient: normalizeShapeFillGradient(value.fillGradient, fallback.fillGradient),
    fillMode: normalizeTextFillMode(value.fillMode, fallback.fillMode),
    fontFamily: normalizeTextFontFamily(value, fallback),
    fontId: normalizeTextFontId(value, fallback),
    fontSize: clamp(
      readFiniteNumber(value.fontSize, fallback.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize),
      6,
      300,
    ),
    fontStyle: value.fontStyle === "italic" ? "italic" : "normal",
    fontWeight: normalizeTextFontWeight(value.fontWeight, fallback.fontWeight),
    kind: "text",
    letterSpacing: clamp(
      readFiniteNumber(
        value.letterSpacing,
        fallback.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing,
      ),
      -50,
      200,
    ),
    lineHeight: clamp(
      readFiniteNumber(
        value.lineHeight,
        fallback.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight,
      ),
      0.6,
      4,
    ),
    text,
    textAlign: normalizeTextAlign(value.textAlign, fallback.textAlign),
    textRuns: normalizeTextRuns(value.textRuns, fallback.textRuns, text),
    underline:
      typeof value.underline === "boolean"
        ? value.underline
        : (fallback.underline ?? DEFAULT_DRAFTING_TEXT_LAYER.underline),
  } satisfies CanvasLayer;
}

function normalizeTextFillMode(
  value: unknown,
  fallback: DraftingShapeFillMode | undefined,
): DraftingShapeFillMode {
  if (value === "gradient" || value === "solid") {
    return value;
  }

  return fallback === "gradient" ? "gradient" : "solid";
}

function normalizeTextAlign(value: unknown, fallback: unknown): DraftingTextAlign {
  if (value === "center" || value === "left" || value === "right") {
    return value;
  }

  return fallback === "center" || fallback === "left" || fallback === "right"
    ? fallback
    : DEFAULT_DRAFTING_TEXT_LAYER.textAlign;
}

function normalizeTextFontFamily(value: Record<string, unknown>, fallback: CanvasLayer) {
  if (typeof value.fontFamily === "string" && value.fontFamily.trim()) {
    return typeof value.fontId === "string"
      ? resolveDraftingFont({ fontFamily: value.fontFamily, fontId: value.fontId }).family
      : value.fontFamily.trim().slice(0, 80);
  }

  if (typeof fallback.fontFamily === "string" && fallback.fontFamily.trim()) {
    return typeof fallback.fontId === "string"
      ? resolveDraftingFont({ fontFamily: fallback.fontFamily, fontId: fallback.fontId }).family
      : fallback.fontFamily.trim().slice(0, 80);
  }

  return DEFAULT_DRAFTING_TEXT_LAYER.fontFamily;
}

function normalizeTextFontId(value: Record<string, unknown>, fallback: CanvasLayer) {
  if (typeof value.fontId === "string" && getDraftingFontById(value.fontId)) {
    return value.fontId;
  }

  if (typeof value.fontFamily === "string" && value.fontFamily.trim()) {
    return getDraftingFontByFamily(value.fontFamily)?.id;
  }

  if (typeof fallback.fontId === "string" && getDraftingFontById(fallback.fontId)) {
    return fallback.fontId;
  }

  if (typeof fallback.fontFamily === "string" && fallback.fontFamily.trim()) {
    return getDraftingFontByFamily(fallback.fontFamily)?.id;
  }

  return DEFAULT_DRAFTING_TEXT_LAYER.fontId;
}

function normalizeTextFontWeight(value: unknown, fallback: unknown): DraftingTextFontWeight {
  if (value === "bold" || value === "normal") {
    return value;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return clamp(Math.round(value), 100, 900);
  }

  return fallback === "bold" || fallback === "normal" || typeof fallback === "number"
    ? normalizeTextFontWeight(fallback, DEFAULT_DRAFTING_TEXT_LAYER.fontWeight)
    : DEFAULT_DRAFTING_TEXT_LAYER.fontWeight;
}

function normalizeTextRuns(
  value: unknown,
  fallback: unknown,
  text: string,
): DraftingTextRun[] | undefined {
  const normalized = normalizeTextRunArray(value, text);
  if (normalized) {
    return normalized;
  }

  return normalizeTextRunArray(fallback, text);
}

function normalizeTextRunArray(value: unknown, text: string): DraftingTextRun[] | undefined {
  if (!Array.isArray(value) || text.length === 0) {
    return undefined;
  }

  const runs = value
    .map((run): DraftingTextRun | null => {
      if (!isRecord(run) || typeof run.text !== "string" || run.text.length === 0) {
        return null;
      }

      const fontFamily =
        typeof run.fontFamily === "string" && run.fontFamily.trim()
          ? run.fontFamily.trim().slice(0, 80)
          : undefined;
      const fontId =
        typeof run.fontId === "string" && getDraftingFontById(run.fontId)
          ? run.fontId
          : fontFamily
            ? getDraftingFontByFamily(fontFamily)?.id
            : undefined;

      return {
        fill:
          typeof run.fill === "string"
            ? normalizeHexColor(run.fill, DEFAULT_DRAFTING_TEXT_LAYER.fill)
            : undefined,
        fontFamily,
        fontId,
        fontSize:
          typeof run.fontSize === "number" && Number.isFinite(run.fontSize)
            ? clamp(run.fontSize, 6, 300)
            : undefined,
        fontStyle:
          run.fontStyle === "italic" ? "italic" : run.fontStyle === "normal" ? "normal" : undefined,
        fontWeight:
          run.fontWeight === undefined
            ? undefined
            : normalizeTextFontWeight(run.fontWeight, undefined),
        text: run.text,
        underline: typeof run.underline === "boolean" ? run.underline : undefined,
      };
    })
    .filter((run): run is DraftingTextRun => Boolean(run));

  if (runs.length === 0 || runs.map((run) => run.text).join("") !== text) {
    return undefined;
  }

  return mergeAdjacentTextRuns(runs);
}

function mergeAdjacentTextRuns(runs: DraftingTextRun[]) {
  return runs.reduce<DraftingTextRun[]>((merged, run) => {
    const previous = merged.at(-1);

    if (previous && areTextRunStylesEqual(previous, run)) {
      previous.text += run.text;
      return merged;
    }

    merged.push({ ...run });
    return merged;
  }, []);
}

function areTextRunStylesEqual(a: DraftingTextRun, b: DraftingTextRun) {
  return (
    a.fill === b.fill &&
    a.fontFamily === b.fontFamily &&
    a.fontId === b.fontId &&
    a.fontSize === b.fontSize &&
    a.fontStyle === b.fontStyle &&
    a.fontWeight === b.fontWeight &&
    a.underline === b.underline
  );
}
