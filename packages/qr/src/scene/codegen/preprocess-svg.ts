function readSvgAttr(attrs: string, name: string) {
  const attrMatch = attrs.match(new RegExp(`\\b${name}\\s*=\\s*(['"])([^'"]*)\\1`))
  return attrMatch ? attrMatch[2] : null
}

function viewBoxScale(viewBox: string | null, width: number, height: number) {
  if (!viewBox || !width || !height) {
    return { scaleX: 1, scaleY: 1 }
  }

  const parts = viewBox.split(/[\s,]+/).map(Number.parseFloat)
  if (parts.length !== 4 || !parts[2] || !parts[3]) {
    return { scaleX: 1, scaleY: 1 }
  }

  return { scaleX: width / parts[2], scaleY: height / parts[3] }
}

function flattenNestedSvgMatch(match: string, attrs: string, inner: string) {
  if (readSvgAttr(attrs, "viewBox")) {
    return match
  }

  const x = Number.parseFloat(readSvgAttr(attrs, "x") ?? "0") || 0
  const y = Number.parseFloat(readSvgAttr(attrs, "y") ?? "0") || 0
  const w = Number.parseFloat(readSvgAttr(attrs, "width") ?? "0")
  const h = Number.parseFloat(readSvgAttr(attrs, "height") ?? "0")
  const { scaleX, scaleY } = viewBoxScale(readSvgAttr(attrs, "viewBox"), w, h)

  const transforms: string[] = []
  if (x || y) {
    transforms.push(`translate(${x} ${y})`)
  }
  if (scaleX !== 1 || scaleY !== 1) {
    transforms.push(`scale(${scaleX} ${scaleY})`)
  }
  const existingTransform = readSvgAttr(attrs, "transform")
  if (existingTransform) {
    transforms.push(existingTransform)
  }

  const carriedAttrs = attrs.replace(
    /\s+(?:x|y|width|height|viewBox|xmlns|xmlns:xlink|preserveAspectRatio|version|transform)\s*=\s*(['"])[^'"]*\1/g,
    "",
  )
  const transform = transforms.length ? ` transform="${transforms.join(" ")}"` : ""
  return `<g${transform}${carriedAttrs}>${inner}</g>`
}

function flattenNestedSvgs(svg: string) {
  let result = svg

  while (true) {
    const svgOpenCount = (result.match(/<svg\b/g) ?? []).length
    if (svgOpenCount <= 1) {
      break
    }

    const next = result.replace(
      /<svg\b([^>]*)>((?:(?!<svg\b)[\s\S])*?)<\/svg>/,
      flattenNestedSvgMatch,
    )

    if (next === result) {
      break
    }

    result = next
  }

  return result
}

function prefixSvgIds(svg: string, prefix: string) {
  const ids = new Set<string>()
  const idRegex = /\bid\s*=\s*(['"])([^'"]+)\1/g
  let match: RegExpExecArray | null

  while ((match = idRegex.exec(svg)) !== null) {
    ids.add(match[2])
  }

  let result = svg
  for (const id of [...ids].sort((a, b) => b.length - a.length)) {
    const nextId = `${prefix}-${id}`
    result = result.replaceAll(`id="${id}"`, `id="${nextId}"`)
    result = result.replaceAll(`id='${id}'`, `id='${nextId}'`)
    result = result.replaceAll(`url(#${id})`, `url(#${nextId})`)
    result = result.replaceAll(`url('#${id}')`, `url('#${nextId}')`)
    result = result.replaceAll(`url("#${id}")`, `url("#${nextId}")`)
    result = result.replaceAll(`href="#${id}"`, `href="#${nextId}"`)
    result = result.replaceAll(`xlink:href="#${id}"`, `xlink:href="#${nextId}"`)
  }

  return result
}

export function preprocessSvg(svg: string, options: { idPrefix?: string } = {}) {
  let result = flattenNestedSvgs(svg)
  if (options.idPrefix) {
    result = prefixSvgIds(result, options.idPrefix)
  }
  return result
}
