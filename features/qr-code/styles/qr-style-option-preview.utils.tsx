import { renderToStaticMarkup } from "react-dom/server"

import { StylePreview, type StylePreviewKind } from "@/features/qr-code/components/StylePreview"

type ViewBox = {
  x: number
  y: number
  width: number
  height: number
}

function parseViewBox(svg: string): ViewBox | null {
  const match = svg.match(/viewBox="([\d.\s-]+)"/)

  if (!match) {
    return null
  }

  const [x, y, width, height] = match[1].trim().split(/\s+/).map(Number)

  return { x, y, width, height }
}

function stripRectsOutsideViewBox(svg: string) {
  const viewBox = parseViewBox(svg)

  if (!viewBox) {
    return svg
  }

  const maxX = viewBox.x + viewBox.width
  const maxY = viewBox.y + viewBox.height

  return svg.replace(/<rect\b[^>]*\/>|<rect\b[^>]*><\/rect>/g, (rect) => {
    const fill = rect.match(/\bfill="([^"]+)"/)?.[1]

    if (fill === "transparent") {
      return ""
    }

    const rectX = Number(rect.match(/\bx="([^"]+)"/)?.[1] ?? "0")
    const rectY = Number(rect.match(/\by="([^"]+)"/)?.[1] ?? "0")
    const rectWidth = Number(rect.match(/\bwidth="([^"]+)"/)?.[1] ?? "0")
    const rectHeight = Number(rect.match(/\bheight="([^"]+)"/)?.[1] ?? "0")
    const rectMaxX = rectX + rectWidth
    const rectMaxY = rectY + rectHeight

    if (rectX >= maxX || rectY >= maxY || rectMaxX <= viewBox.x || rectMaxY <= viewBox.y) {
      return ""
    }

    return rect
  })
}

function ensureSvgNamespace(svg: string) {
  if (svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    return svg
  }

  return svg.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"')
}

/** Strip runtime-only attrs and full QR data modules from baked picker SVGs. */
export function normalizeBakedStylePreviewSvg(
  markup: string,
  previewKind: StylePreviewKind,
) {
  let svg = markup

  if (previewKind !== "dots") {
    svg = svg
      .replace(/<path\b[^>]*\bdata-testid="data-modules"[^>]*\/>/g, "")
      .replace(/<path\b[^>]*\bdata-testid="data-modules"[^>]*><\/path>/g, "")
  }

  svg = svg
    .replace(/<path\b[^>]*\bdata-testid="background"[^>]*\/>/g, "")
    .replace(/<path\b[^>]*fill="transparent"[^>]*\/>/g, "")
    .replace(/<path\b[^>]*fill="transparent"[^>]*><\/path>/g, "")
    .replace(/\s*class="[^"]*"/g, "")
    .replace(/\s*role="[^"]*"/g, "")
    .replace(/\s*aria-label="[^"]*"/g, "")
    .replace(/\s*data-[a-z0-9-]+="[^"]*"/gi, "")
    .replace(/\s*shape-rendering="[^"]*"/g, "")
    .replace(/fill="currentColor"/g, 'fill="#000000"')

  svg = svg.replace(/<svg\b([^>]*)>/, (_match, attrs: string) => {
    const cleaned = attrs
      .replace(/\s*height="[^"]*"/g, "")
      .replace(/\s*width="[^"]*"/g, "")

    return `<svg${cleaned}>`
  })

  svg = stripRectsOutsideViewBox(svg)

  return ensureSvgNamespace(svg)
}

export function renderBakedStylePreviewSvg(
  previewKind: StylePreviewKind,
  value: string,
) {
  return normalizeBakedStylePreviewSvg(
    renderToStaticMarkup(<StylePreview previewKind={previewKind} value={value} />),
    previewKind,
  )
}
