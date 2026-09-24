import type { CanvasLayer } from "@/features/canvas/model/layers/shared";
import {
  DRAFTING_FONT_CATEGORY_FALLBACKS,
  DRAFTING_FONT_CATEGORY_ORDER,
  GOOGLE_FONT_SPECS,
  googleFontCssUrl,
  googleFontPreviewCssUrl,
  googleFontSlug,
  type CanvasFontCategory,
} from "@/features/canvas/model/font-catalog";

export { DRAFTING_FONT_CATEGORY_LABELS } from "@/features/canvas/model/font-catalog";

type CanvasFontSource = "fontshare" | "google" | "local" | "system";

type CanvasFontRegistryEntry = {
  category: CanvasFontCategory;
  cssText?: string;
  cssUrl?: string;
  fallback: string;
  family: string;
  id: string;
  label: string;
  previewCssUrl?: string;
  source: CanvasFontSource;
  styles: readonly ("italic" | "normal")[];
  weights: readonly number[];
};

const DRAFTING_FONT_FALLBACK = "system-ui, Arial, sans-serif";

export const DEFAULT_DRAFTING_FONT_ID = "local:satoshi";

const STATIC_FONT_ENTRIES: readonly CanvasFontRegistryEntry[] = [
  {
    category: "sans",
    cssText: [
      "@font-face {",
      "font-family: 'Satoshi';",
      "src: url('/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-Variable.woff2') format('woff2');",
      "font-weight: 300 900;",
      "font-display: swap;",
      "font-style: normal;",
      "}",
      "@font-face {",
      "font-family: 'Satoshi';",
      "src: url('/Satoshi_Complete/Fonts/WEB/fonts/Satoshi-VariableItalic.woff2') format('woff2');",
      "font-weight: 300 900;",
      "font-display: swap;",
      "font-style: italic;",
      "}",
    ].join("\n"),
    fallback: DRAFTING_FONT_FALLBACK,
    family: "Satoshi",
    id: DEFAULT_DRAFTING_FONT_ID,
    label: "Satoshi",
    source: "local",
    styles: ["normal", "italic"],
    weights: [300, 400, 500, 600, 700, 900],
  },
  {
    category: "sans",
    cssUrl: "https://api.fontshare.com/v2/css?f[]=general-sans@400,500,600,700&display=swap",
    fallback: DRAFTING_FONT_FALLBACK,
    family: "General Sans",
    id: "fontshare:general-sans",
    label: "General Sans",
    source: "fontshare",
    styles: ["normal", "italic"],
    weights: [400, 500, 600, 700],
  },
  {
    category: "sans",
    cssUrl: "https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@400,500,700&display=swap",
    fallback: DRAFTING_FONT_FALLBACK,
    family: "Cabinet Grotesk",
    id: "fontshare:cabinet-grotesk",
    label: "Cabinet Grotesk",
    source: "fontshare",
    styles: ["normal"],
    weights: [400, 500, 700],
  },
  {
    category: "display",
    cssUrl: "https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap",
    fallback: DRAFTING_FONT_FALLBACK,
    family: "Clash Display",
    id: "fontshare:clash-display",
    label: "Clash Display",
    source: "fontshare",
    styles: ["normal"],
    weights: [400, 500, 600, 700],
  },
  {
    category: "sans",
    cssUrl: "https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700&display=swap",
    fallback: DRAFTING_FONT_FALLBACK,
    family: "Switzer",
    id: "fontshare:switzer",
    label: "Switzer",
    source: "fontshare",
    styles: ["normal", "italic"],
    weights: [400, 500, 600, 700],
  },
  {
    category: "serif",
    cssUrl: "https://api.fontshare.com/v2/css?f[]=author@400,500,600,700&display=swap",
    fallback: DRAFTING_FONT_CATEGORY_FALLBACKS.serif,
    family: "Author",
    id: "fontshare:author",
    label: "Author",
    source: "fontshare",
    styles: ["normal", "italic"],
    weights: [400, 500, 600, 700],
  },
  {
    category: "system",
    fallback: "Arial, Helvetica, sans-serif",
    family: "Arial",
    id: "system:arial",
    label: "Arial",
    source: "system",
    styles: ["normal", "italic"],
    weights: [400, 700],
  },
];

const GOOGLE_FONT_ENTRIES: readonly CanvasFontRegistryEntry[] = GOOGLE_FONT_SPECS.map((spec) => ({
  category: spec.category,
  cssUrl: googleFontCssUrl(spec),
  fallback: DRAFTING_FONT_CATEGORY_FALLBACKS[spec.category],
  family: spec.family,
  id: `google:${googleFontSlug(spec.family)}`,
  label: spec.family,
  previewCssUrl: googleFontPreviewCssUrl(spec),
  source: "google" as const,
  styles: spec.italic ? (["normal", "italic"] as const) : (["normal"] as const),
  weights: spec.weights,
}));

export const DRAFTING_FONT_REGISTRY: readonly CanvasFontRegistryEntry[] = [
  ...STATIC_FONT_ENTRIES,
  ...GOOGLE_FONT_ENTRIES,
];

const FONT_BY_ID: Map<string, CanvasFontRegistryEntry> = new Map(
  DRAFTING_FONT_REGISTRY.map((font) => [font.id, font]),
);
const FONT_BY_FAMILY: Map<string, CanvasFontRegistryEntry> = new Map(
  DRAFTING_FONT_REGISTRY.map((font) => [normalizeCanvasFontFamilyKey(font.family), font]),
);
const loadedFontIds = new Set<string>();
const fontReadyPromises = new Map<string, Promise<void>>();

export function getCanvasFontById(fontId: string | null | undefined) {
  return fontId ? FONT_BY_ID.get(fontId) : undefined;
}

export function getCanvasFontByFamily(fontFamily: string | null | undefined) {
  return fontFamily ? FONT_BY_FAMILY.get(normalizeCanvasFontFamilyKey(fontFamily)) : undefined;
}

export function resolveCanvasFont(
  options: { fontFamily?: string | null; fontId?: string | null } = {},
) {
  return (
    getCanvasFontById(options.fontId) ??
    getCanvasFontByFamily(options.fontFamily) ??
    getCanvasFontById(DEFAULT_DRAFTING_FONT_ID)!
  );
}

export function getCanvasFontCssFamily(
  options: { fontFamily?: string | null; fontId?: string | null } = {},
) {
  const font = getCanvasFontById(options.fontId) ?? getCanvasFontByFamily(options.fontFamily);
  const family = font?.family ?? normalizeUnknownFontFamily(options.fontFamily);

  return `"${family}", ${font?.fallback ?? DRAFTING_FONT_FALLBACK}`;
}

/**
 * Groups the registry by category for the font pickers. An empty query returns
 * every font; a non-empty query filters by label/family within each category.
 */
export function groupCanvasFonts(query?: string) {
  const normalizedQuery = query?.trim().toLowerCase();
  const fonts = normalizedQuery
    ? DRAFTING_FONT_REGISTRY.filter(
        (font) =>
          font.label.toLowerCase().includes(normalizedQuery) ||
          font.family.toLowerCase().includes(normalizedQuery),
      )
    : DRAFTING_FONT_REGISTRY;

  const groups = new Map<CanvasFontCategory, CanvasFontRegistryEntry[]>();
  for (const font of fonts) {
    const list = groups.get(font.category) ?? [];
    list.push(font);
    groups.set(font.category, list);
  }

  return DRAFTING_FONT_CATEGORY_ORDER.filter((category) => groups.has(category)).map(
    (category) => ({ category, fonts: groups.get(category)! }),
  );
}

export function loadCanvasFont(fontId: string | null | undefined): Promise<void> {
  const font = getCanvasFontById(fontId) ?? getCanvasFontById(DEFAULT_DRAFTING_FONT_ID)!;

  if (typeof document === "undefined") {
    return Promise.resolve();
  }

  const inflight = fontReadyPromises.get(font.id);
  if (inflight) {
    return inflight;
  }

  const task = (async () => {
    if (font.cssUrl) {
      await injectCanvasFontStylesheet(font);
    } else if (font.cssText) {
      injectCanvasFontStyle(font);
    }

    loadedFontIds.add(font.id);
    await waitForCanvasFont(font);
  })();

  fontReadyPromises.set(font.id, task);
  void task.finally(() => {
    if (fontReadyPromises.get(font.id) === task) {
      fontReadyPromises.delete(font.id);
    }
  });

  return task;
}

/**
 * Loads a glyph-subset stylesheet (Google Fonts `text=` param) so picker rows
 * can render in the real typeface for a few KB each. For sources without a
 * dedicated preview URL, falls back to the full font load.
 */
export function loadCanvasFontPreview(fontId: string | null | undefined) {
  const font = getCanvasFontById(fontId);
  if (!font || typeof document === "undefined") {
    return;
  }

  if (!font.previewCssUrl) {
    void loadCanvasFont(font.id);
    return;
  }

  const linkId = `${getCanvasFontElementId(font.id)}-preview`;
  if (document.getElementById(linkId)) {
    return;
  }

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = font.previewCssUrl;
  document.head.appendChild(link);
}

export async function ensureCanvasFontsForLayers(layers: readonly CanvasLayer[]) {
  const fontIds = new Set<string>();
  const visit = (layer: CanvasLayer) => {
    if (layer.kind === "text") {
      fontIds.add(resolveCanvasFont({ fontFamily: layer.fontFamily, fontId: layer.fontId }).id);
    }
    layer.children?.forEach(visit);
  };

  layers.forEach(visit);
  await Promise.all([...fontIds].map(loadCanvasFont));
}

function injectCanvasFontStylesheet(font: CanvasFontRegistryEntry) {
  const linkId = getCanvasFontElementId(font.id);
  const existing = document.getElementById(linkId) as HTMLLinkElement | null;

  if (existing) {
    return waitForStylesheetLink(existing);
  }

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = font.cssUrl!;
  document.head.appendChild(link);

  return waitForStylesheetLink(link);
}

function injectCanvasFontStyle(font: CanvasFontRegistryEntry) {
  const styleId = getCanvasFontElementId(font.id);

  if (document.getElementById(styleId)) {
    return;
  }

  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = font.cssText!;
  document.head.appendChild(style);
}

async function waitForCanvasFont(font: CanvasFontRegistryEntry) {
  if (!("fonts" in document)) {
    return;
  }

  try {
    await Promise.all(
      font.weights.map((weight) => document.fonts.load(`${weight} 32px "${font.family}"`)),
    );
  } catch {
    // Fontshare/local font failures should not block editing with fallback fonts.
  }
}

function waitForStylesheetLink(link: HTMLLinkElement) {
  return new Promise<void>((resolve) => {
    if (link.dataset.canvasFontLoaded === "true") {
      resolve();
      return;
    }

    try {
      if (link.sheet) {
        link.dataset.canvasFontLoaded = "true";
        resolve();
        return;
      }
    } catch {
      // Cross-origin stylesheets can throw when reading sheet.
    }

    const done = () => {
      link.dataset.canvasFontLoaded = "true";
      resolve();
    };
    link.addEventListener("load", done, { once: true });
    link.addEventListener("error", done, { once: true });
  });
}

function getCanvasFontElementId(fontId: string) {
  return `canvas-font-${fontId.replace(/[^a-z0-9]+/gi, "-")}`;
}

function normalizeCanvasFontFamilyKey(fontFamily: string) {
  return fontFamily
    .trim()
    .replace(/^["']|["']$/g, "")
    .toLowerCase();
}

function normalizeUnknownFontFamily(fontFamily: string | null | undefined) {
  const normalized = fontFamily?.trim().replace(/^["']|["']$/g, "");

  return normalized || resolveCanvasFont().family;
}
