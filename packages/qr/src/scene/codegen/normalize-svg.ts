export function normalizeSvg(svg: string) {
  return svg
    .replace(/<\?xml[^>]*\?>/gi, "")
    .replace(/\s+xmlns:xlink="[^"]*"/g, "")
    .replace(/\s+/g, " ")
    .replace(/>\s+</g, "><")
    .trim()
}

export function extractSvgInnerMarkup(reactSource: string) {
  const match = reactSource.match(/<svg[\s\S]*<\/svg>/)
  return match?.[0] ?? ""
}
