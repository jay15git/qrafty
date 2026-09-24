import {
  DEFAULT_DRAFTING_TEXT_LAYER,
  type CanvasLayer,
} from "@/features/canvas/model/layers/shared";
import { getDraftingFontCssFamily } from "@/features/canvas/model/fonts";

let measureCanvas: HTMLCanvasElement | null = null;

export type DraftingTextLayout = {
  height: number;
  lineHeight: number;
  lines: string[];
};

function getDraftingTextLineHeight(layer: CanvasLayer): number {
  const raw = layer.lineHeight ?? DEFAULT_DRAFTING_TEXT_LAYER.lineHeight;

  if (!Number.isFinite(raw)) {
    return DEFAULT_DRAFTING_TEXT_LAYER.lineHeight;
  }

  return Math.max(0.6, Math.min(4, raw));
}

function getDraftingTextLetterSpacing(layer: CanvasLayer): number {
  const raw = layer.letterSpacing ?? DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing;

  if (!Number.isFinite(raw)) {
    return DEFAULT_DRAFTING_TEXT_LAYER.letterSpacing;
  }

  return raw;
}

export function getDraftingTextFontFamily(layer: CanvasLayer): string {
  return getDraftingFontCssFamily({
    fontFamily: layer.fontFamily,
    fontId: layer.fontId,
  });
}

function getDraftingTextFont(layer: CanvasLayer): string {
  return `${layer.fontStyle ?? DEFAULT_DRAFTING_TEXT_LAYER.fontStyle} ${layer.fontWeight ?? DEFAULT_DRAFTING_TEXT_LAYER.fontWeight} ${layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize}px ${getDraftingTextFontFamily(layer)}`;
}
export function layoutDraftingText(
  layer: CanvasLayer,
  ctx?: CanvasRenderingContext2D | null,
): DraftingTextLayout {
  const measure = ctx ?? getMeasureContext();
  const fontSize = layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize;
  const lineHeight = fontSize * getDraftingTextLineHeight(layer);
  const paragraphs = (layer.text ?? "").split(/\r?\n/);

  if (!measure) {
    const lines = roughWrapText(layer, paragraphs);
    return {
      height: Math.max(lineHeight, lines.length * lineHeight),
      lineHeight,
      lines,
    };
  }

  measure.font = getDraftingTextFont(layer);
  const maxWidth = Math.max(8, layer.width);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) {
      lines.push("");
      continue;
    }

    const words = paragraph.split(/(\s+)/).filter(Boolean);
    let current = "";

    for (const word of words) {
      const next = current ? `${current}${word}` : word;

      if (measureDraftingTextLineWidthWithContext(measure, layer, next) <= maxWidth) {
        current = next;
        continue;
      }

      if (!current) {
        const split = splitDraftingTextTokenToFit(measure, layer, word.trimStart(), maxWidth);
        current = split.pop() ?? "";
        lines.push(...split);
        continue;
      }

      lines.push(current.trimEnd());
      const remainder = word.trimStart();

      if (!remainder) {
        current = "";
        continue;
      }

      if (measureDraftingTextLineWidthWithContext(measure, layer, remainder) <= maxWidth) {
        current = remainder;
        continue;
      }

      const split = splitDraftingTextTokenToFit(measure, layer, remainder, maxWidth);
      current = split.pop() ?? "";
      lines.push(...split);
    }

    lines.push(current.trimEnd());
  }

  return {
    height: Math.max(lineHeight, lines.length * lineHeight),
    lineHeight,
    lines,
  };
}

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === "undefined") {
    return null;
  }

  if (typeof navigator !== "undefined" && navigator.userAgent.toLowerCase().includes("jsdom")) {
    return null;
  }

  if (!measureCanvas) {
    measureCanvas = document.createElement("canvas");
  }

  return measureCanvas.getContext("2d");
}

function measureDraftingTextLineWidthWithContext(
  ctx: CanvasRenderingContext2D,
  layer: CanvasLayer,
  line: string,
): number {
  if (!line) {
    return 0;
  }

  const letterSpacing = getDraftingTextLetterSpacing(layer);

  if (letterSpacing === 0 || line.length <= 1) {
    return ctx.measureText(line).width;
  }

  const chars = Array.from(line);
  const width =
    chars.reduce((sum, char) => sum + ctx.measureText(char).width, 0) +
    Math.max(0, chars.length - 1) * letterSpacing;

  return Math.max(0, width);
}

function splitDraftingTextTokenToFit(
  ctx: CanvasRenderingContext2D,
  layer: CanvasLayer,
  token: string,
  maxWidth: number,
): string[] {
  if (!token) {
    return [""];
  }

  const chars = Array.from(token);
  const parts: string[] = [];
  let current = "";

  for (const char of chars) {
    const next = current + char;

    if (measureDraftingTextLineWidthWithContext(ctx, layer, next) <= maxWidth || !current) {
      current = next;
      continue;
    }

    parts.push(current);
    current = char;
  }

  if (current) {
    parts.push(current);
  }

  return parts;
}

function roughWrapText(layer: CanvasLayer, paragraphs: string[]): string[] {
  const fontSize = layer.fontSize ?? DEFAULT_DRAFTING_TEXT_LAYER.fontSize;
  const maxChars = Math.max(
    1,
    Math.floor(layer.width / Math.max(1, fontSize * 0.58 + getDraftingTextLetterSpacing(layer))),
  );
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push("");
      continue;
    }

    let current = "";

    for (const word of paragraph.split(/\s+/)) {
      if (!word) {
        continue;
      }

      if (!current) {
        if (word.length <= maxChars) {
          current = word;
          continue;
        }

        let remaining = word;
        while (remaining.length > maxChars) {
          lines.push(remaining.slice(0, maxChars));
          remaining = remaining.slice(maxChars);
        }
        current = remaining;
        continue;
      }

      if (`${current} ${word}`.length <= maxChars) {
        current = `${current} ${word}`;
        continue;
      }

      lines.push(current);
      current = word;
    }

    lines.push(current);
  }

  return lines.length > 0 ? lines : [""];
}
