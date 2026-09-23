function readCssLengthPx(element: HTMLElement, varName: string, fallback: number): number {
  const raw = getComputedStyle(element).getPropertyValue(varName).trim()
  if (!raw) {
    return fallback
  }

  if (raw.endsWith("px")) {
    return Number.parseFloat(raw) || fallback
  }

  if (raw.endsWith("rem")) {
    const rootFont =
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
    return (Number.parseFloat(raw) || 0) * rootFont
  }

  const parsed = Number.parseFloat(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function measurePreviewRowWidth(row: HTMLElement): number {
  const items = row.querySelectorAll<HTMLElement>(":scope > *")
  if (items.length === 0) {
    return 0
  }

  const host = row.closest<HTMLElement>(".inspector-root") ?? row
  const tilePx = readCssLengthPx(host, "--settings-preview-tile", 56)
  const gapPx = readCssLengthPx(host, "--space-inline", 6)
  const style = getComputedStyle(row)
  const padding =
    (Number.parseFloat(style.paddingLeft) || 0) +
    (Number.parseFloat(style.paddingRight) || 0)

  return padding + items.length * tilePx + gapPx * Math.max(0, items.length - 1)
}

/** Token-based width for preview rows; DOM scroll widths elsewhere. */
export function getHorizontalContentWidth(element: HTMLElement): number {
  const inner = element.firstElementChild
  if (!(inner instanceof HTMLElement)) {
    return element.scrollWidth
  }

  const previewRow = inner.querySelector(".dn-preview-row")
  if (previewRow instanceof HTMLElement) {
    const measured = measurePreviewRowWidth(previewRow)
    if (measured > 0) {
      return measured
    }
  }

  const content = inner.firstElementChild
  if (content instanceof HTMLElement) {
    return content.scrollWidth
  }

  return inner.scrollWidth
}

export function isHorizontalLayoutStable(element: HTMLElement): boolean {
  const contentWidth = getHorizontalContentWidth(element)
  return element.scrollWidth <= contentWidth + 8
}
