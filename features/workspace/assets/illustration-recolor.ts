import { formatColor, parseColor } from "@/components/ui/fill-picker/lib/color"

export type DraftingIllustrationColorStop = {
  from: string
  to: string
}

const SKIP_PAINT = /^(none|transparent|currentcolor|inherit|context-fill|context-stroke)$/i
const URL_PAINT = /^url\(/i

function attributePaintPattern() {
  return /\b(fill|stroke)\s*=\s*(["'])(.*?)\2/gi
}

function stylePaintPattern() {
  return /((?:^|[;"']|\s))((?:fill|stroke)\s*:\s*)([^;}"']+)/gi
}

const markupPromises = new Map<string, Promise<string | null>>()
const markupCache = new Map<string, string>()

export function normalizeSvgPaintColor(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed || SKIP_PAINT.test(trimmed) || URL_PAINT.test(trimmed)) {
    return null
  }

  const parsed = parseColor(trimmed)
  if (!parsed || (parsed.alpha ?? 1) <= 0) {
    return null
  }

  return formatColor(parsed, "hex").toLowerCase()
}

export function extractSvgPaintColors(markup: string): string[] {
  const seen = new Set<string>()
  const colors: string[] = []
  const rendered = stripNonRenderedSvgMarkup(markup)

  function add(raw: string) {
    const hex = normalizeSvgPaintColor(raw)
    if (!hex || seen.has(hex)) {
      return
    }

    seen.add(hex)
    colors.push(hex)
  }

  for (const match of rendered.matchAll(attributePaintPattern())) {
    add(match[3] ?? "")
  }

  for (const match of rendered.matchAll(stylePaintPattern())) {
    add(match[3] ?? "")
  }

  return colors
}

function stripNonRenderedSvgMarkup(markup: string) {
  return markup
    .replace(/<defs\b[\s\S]*?<\/defs>/gi, "")
    .replace(/<clipPath\b[\s\S]*?<\/clipPath>/gi, "")
    .replace(/<mask\b[\s\S]*?<\/mask>/gi, "")
    .replace(/<filter\b[\s\S]*?<\/filter>/gi, "")
}

export function remapSvgPaintColors(markup: string, replacements: Record<string, string>): string {
  function replacePaint(raw: string) {
    const hex = normalizeSvgPaintColor(raw)
    if (!hex) {
      return raw
    }

    const next = replacements[hex]
    if (!next || next.toLowerCase() === hex) {
      return raw
    }

    return next
  }

  return markup
    .replace(attributePaintPattern(), (_match, attr: string, quote: string, value: string) => {
      return `${attr}=${quote}${replacePaint(value)}${quote}`
    })
    .replace(stylePaintPattern(), (_match, prefix: string, property: string, value: string) => {
      return `${prefix}${property}${replacePaint(value)}`
    })
}

export function resolveIllustrationDisplayColors(
  sourceColors: readonly string[],
  stops: readonly DraftingIllustrationColorStop[] | undefined,
): string[] {
  const byFrom = new Map((stops ?? []).map((stop) => [stop.from.toLowerCase(), stop.to]))
  return sourceColors.map((from) => byFrom.get(from.toLowerCase()) ?? from)
}

export function illustrationStopsToReplacementMap(
  sourceColors: readonly string[],
  stops: readonly DraftingIllustrationColorStop[] | undefined,
): Record<string, string> {
  const display = resolveIllustrationDisplayColors(sourceColors, stops)
  return Object.fromEntries(sourceColors.map((from, index) => [from, display[index] ?? from]))
}

export function illustrationColorMapIsIdentity(replacements: Record<string, string>): boolean {
  return Object.entries(replacements).every(([from, to]) => from.toLowerCase() === to.toLowerCase())
}

export function svgMarkupToDataUrl(markup: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
}

export function cacheIllustrationSvgMarkup(path: string, markup: string) {
  markupCache.set(path, markup)
  markupPromises.set(path, Promise.resolve(markup))
}

export function getCachedIllustrationSvgMarkup(path: string): string | null {
  return markupCache.get(path) ?? null
}

export function loadIllustrationSvgMarkup(path: string): Promise<string | null> {
  const existing = markupPromises.get(path)
  if (existing) {
    return existing
  }

  const pending = fetch(path)
    .then((response) => (response.ok ? response.text() : null))
    .then((markup) => {
      if (markup) {
        markupCache.set(path, markup)
      }
      return markup
    })
    .catch(() => null)

  markupPromises.set(path, pending)
  return pending
}

export async function preloadIllustrationSvgMarkup(paths: readonly string[]): Promise<void> {
  await Promise.all(paths.map((path) => loadIllustrationSvgMarkup(path)))
}

export function getIllustrationDisplaySrc(
  imageValue: string,
  markup: string,
  stops: readonly DraftingIllustrationColorStop[] | undefined,
): string {
  const sourceColors = extractSvgPaintColors(markup)
  const replacements = illustrationStopsToReplacementMap(sourceColors, stops)
  if (sourceColors.length === 0 || illustrationColorMapIsIdentity(replacements)) {
    return imageValue
  }

  return svgMarkupToDataUrl(remapSvgPaintColors(markup, replacements))
}

export function getCachedIllustrationDisplaySrc(
  imageValue: string | undefined,
  stops: readonly DraftingIllustrationColorStop[] | undefined,
): string | null {
  if (!imageValue) {
    return null
  }

  const markup = getCachedIllustrationSvgMarkup(imageValue)
  if (!markup) {
    return null
  }

  return getIllustrationDisplaySrc(imageValue, markup, stops)
}

export function collectIllustrationAssetPaths(
  layers: readonly { kind?: string; imageValue?: string; children?: readonly unknown[] }[],
): string[] {
  const paths = new Set<string>()

  const walk = (items: readonly { kind?: string; imageValue?: string; children?: readonly unknown[] }[]) => {
    for (const layer of items) {
      if (layer.kind === "image" && layer.imageValue?.startsWith("/illustrations/")) {
        paths.add(layer.imageValue)
      }
      if (Array.isArray(layer.children) && layer.children.length > 0) {
        walk(layer.children as typeof items)
      }
    }
  }

  walk(layers)
  return [...paths]
}
