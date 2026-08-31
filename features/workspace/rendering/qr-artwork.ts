import {
  DEFAULT_BACKGROUND_SHAPE_OPTIONS,
  type QraftyState,
} from "@/features/qr-code/model/state"

export function createDraftingQrArtworkState(state: QraftyState): QraftyState {
  return {
    ...state,
    backgroundGradient: {
      ...state.backgroundGradient,
      enabled: false,
    },
    backgroundImage: {
      source: "none",
      value: undefined,
      presetId: undefined,
      presetColor: undefined,
    },
    backgroundOptions: {
      ...state.backgroundOptions,
      transparent: true,
    },
    backgroundShapeId: "none",
    backgroundShapeOptions: { ...DEFAULT_BACKGROUND_SHAPE_OPTIONS },
  }
}

export function sanitizeDraftingQrArtworkMarkup(markup: string) {
  if (typeof DOMParser === "undefined" || typeof XMLSerializer === "undefined") {
    return markup
  }

  const parser = new DOMParser()
  const document = parser.parseFromString(markup, "image/svg+xml")
  const svg = document.documentElement

  if (svg.tagName.toLowerCase() !== "svg" || document.querySelector("parsererror")) {
    return markup
  }

  for (const child of Array.from(svg.children)) {
    if (isLegacyQrBackingNode(child)) {
      child.remove()
    }
  }

  for (const filter of Array.from(svg.querySelectorAll("filter"))) {
    if (isLegacyQrBackingNode(filter)) {
      filter.remove()
    }
  }

  for (const clipPath of Array.from(svg.querySelectorAll("clipPath"))) {
    if (isLegacyQrBackingNode(clipPath)) {
      clipPath.remove()
    }
  }

  for (const defs of Array.from(svg.querySelectorAll("defs"))) {
    if (defs.children.length === 0) {
      defs.remove()
    }
  }

  return new XMLSerializer().serializeToString(svg)
}

export function parseSvgViewBoxSize(markup: string) {
  const openTag = markup.match(/<svg\b[^>]*>/i)?.[0]
  const viewBox = openTag?.match(/viewBox="([^"]+)"/i)?.[1]
  if (!viewBox) {
    return null
  }

  const parts = viewBox.trim().split(/[\s,]+/).map(Number.parseFloat)
  if (parts.length !== 4 || !parts[2] || !parts[3]) {
    return null
  }

  return { height: parts[3], width: parts[2] }
}

export function snapDimensionToViewBoxGrid(target: number, viewBoxAxis: number) {
  if (!Number.isFinite(target) || !Number.isFinite(viewBoxAxis) || viewBoxAxis <= 0) {
    return Math.max(1, Math.round(target))
  }

  return viewBoxAxis * Math.max(1, Math.round(target / viewBoxAxis))
}

export function parseNestedQrSvgMetrics(markup: string) {
  const openTags = [...markup.matchAll(/<svg\b([^>]*)>/gi)]

  for (let index = 1; index < openTags.length; index += 1) {
    const attributes = openTags[index][1]
    const viewBox = attributes.match(/\bviewBox="([^"]+)"/i)?.[1]

    if (!viewBox) {
      continue
    }

    const parts = viewBox.trim().split(/[\s,]+/).map(Number.parseFloat)

    if (parts.length !== 4 || !parts[2] || !parts[3] || parts[2] > 200 || parts[3] > 200) {
      continue
    }

    const displayWidth = Number.parseFloat(attributes.match(/\bwidth="([^"]+)"/i)?.[1] ?? "NaN")
    const displayHeight = Number.parseFloat(attributes.match(/\bheight="([^"]+)"/i)?.[1] ?? "NaN")

    if (!Number.isFinite(displayWidth) || !Number.isFinite(displayHeight)) {
      continue
    }

    return {
      displayHeight,
      displayWidth,
      moduleUnits: parts[2],
    }
  }

  return null
}

export function snapLayeredRasterDimensionsToQrModuleGrid({
  exportHeight,
  exportWidth,
  naturalHeight,
  naturalWidth,
  qrMetrics,
}: {
  exportHeight: number
  exportWidth: number
  naturalHeight: number
  naturalWidth: number
  qrMetrics: { displayHeight: number; displayWidth: number; moduleUnits: number }
}) {
  if (naturalWidth <= 0 || naturalHeight <= 0) {
    return { height: exportHeight, width: exportWidth }
  }

  const scaleX = exportWidth / naturalWidth
  const scaleY = exportHeight / naturalHeight
  const snappedQrWidth = snapDimensionToViewBoxGrid(
    qrMetrics.displayWidth * scaleX,
    qrMetrics.moduleUnits,
  )
  const snappedQrHeight = snapDimensionToViewBoxGrid(
    qrMetrics.displayHeight * scaleY,
    qrMetrics.moduleUnits,
  )
  const snappedScaleX = snappedQrWidth / qrMetrics.displayWidth
  const snappedScaleY = snappedQrHeight / qrMetrics.displayHeight
  const scale = Math.min(snappedScaleX, snappedScaleY)

  return {
    height: Math.max(1, Math.round(naturalHeight * scale)),
    width: Math.max(1, Math.round(naturalWidth * scale)),
  }
}

export function alignReactQrSvgToModuleGrid(
  markup: string,
  targetWidth?: number,
  targetHeight?: number,
) {
  const openTag = markup.match(/<svg\b[^>]*>/i)?.[0] ?? ""
  const parsedWidth = Number.parseFloat(openTag.match(/\bwidth="([^"]+)"/i)?.[1] ?? "NaN")
  const parsedHeight = Number.parseFloat(openTag.match(/\bheight="([^"]+)"/i)?.[1] ?? "NaN")
  const viewBoxSize = parseSvgViewBoxSize(markup)
  const width = targetWidth ?? (Number.isFinite(parsedWidth) ? parsedWidth : viewBoxSize?.width ?? 1)
  const height =
    targetHeight ?? (Number.isFinite(parsedHeight) ? parsedHeight : viewBoxSize?.height ?? 1)

  return replaceSvgWidthHeight(markup, Math.max(1, Math.round(width)), Math.max(1, Math.round(height)))
}

function stripExportSvgPercentageSizing(attributes: string) {
  return String(attributes).replace(/\sstyle="([^"]*)"/i, (_match, style: string) => {
    const cleaned = style
      .replace(/(?:^|;)\s*width\s*:\s*100%\s*/gi, "")
      .replace(/(?:^|;)\s*height\s*:\s*100%\s*/gi, "")
      .replace(/;\s*;/g, ";")
      .replace(/^;+|;+$/g, "")
      .trim()

    return cleaned ? ` style="${cleaned}"` : ""
  })
}

function cleanNestedSvgAttributes(attributes: string) {
  return stripExportSvgPercentageSizing(String(attributes))
    .replace(/\swidth="[^"]*"/i, "")
    .replace(/\sheight="[^"]*"/i, "")
    .replace(/\spreserveAspectRatio="[^"]*"/i, "")
}

function replaceSvgWidthHeight(markup: string, width: number, height: number) {
  return markup.replace(/<svg\b([^>]*)>/i, (_match, attributes: string) => {
    const nextAttributes = stripExportSvgPercentageSizing(String(attributes))
      .replace(/\swidth="[^"]*"/i, "")
      .replace(/\sheight="[^"]*"/i, "")

    return `<svg${nextAttributes} width="${width}" height="${height}">`
  })
}

export function scaleNestedSvgMarkup(markup: string, width: number, height: number) {
  const snappedWidth = Math.max(1, Math.round(width))
  const snappedHeight = Math.max(1, Math.round(height))

  const withScaledSelfClosingSvg = markup.replace(
    /<svg\b([^>]*)\/>/i,
    (_match, attributes: string) => {
      const nextAttributes = cleanNestedSvgAttributes(attributes)

      return `<svg${nextAttributes} width="${snappedWidth}" height="${snappedHeight}" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision"></svg>`
    },
  )

  const scaledMarkup =
    withScaledSelfClosingSvg !== markup
      ? withScaledSelfClosingSvg
      : markup.replace(/<svg\b([^>]*)>/i, (_match, attributes: string) => {
          const nextAttributes = cleanNestedSvgAttributes(attributes)

          return `<svg${nextAttributes} width="${snappedWidth}" height="${snappedHeight}" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision">`
        })

  return scaledMarkup
}

function isLegacyQrBackingNode(node: Element) {
  const layer = node.getAttribute("data-qr-layer")

  if (layer?.startsWith("background-")) {
    return true
  }

  const id = node.getAttribute("id")

  if (id?.includes("clip-path-background-color")) {
    return true
  }

  return (
    node.tagName.toLowerCase() === "rect" &&
    node.getAttribute("clip-path")?.includes("clip-path-background-color") === true
  )
}
