export function flattenNestedSvgs(svg: string) {
  let result = svg

  while (true) {
    const svgOpenCount = (result.match(/<svg\b/g) ?? []).length
    if (svgOpenCount <= 1) {
      break
    }

    const next = result.replace(
      /<svg\b([^>]*)>((?:(?!<svg\b)[\s\S])*?)<\/svg>/,
      (match, attrs: string, inner: string) => {
        const attr = (name: string) => {
          const match = attrs.match(new RegExp(`\\b${name}\\s*=\\s*(['"])([^'"]*)\\1`))
          return match ? match[2] : null
        }

        if (attr("viewBox")) {
          return match
        }

        const x = Number.parseFloat(attr("x") ?? "0") || 0
        const y = Number.parseFloat(attr("y") ?? "0") || 0
        const w = Number.parseFloat(attr("width") ?? "0")
        const h = Number.parseFloat(attr("height") ?? "0")
        const viewBox = attr("viewBox")
        let scaleX = 1
        let scaleY = 1

        if (viewBox && w && h) {
          const parts = viewBox.split(/[\s,]+/).map(Number.parseFloat)
          if (parts.length === 4 && parts[2] && parts[3]) {
            scaleX = w / parts[2]
            scaleY = h / parts[3]
          }
        }

        const existingTransform = attr("transform") ?? ""
        const transforms: string[] = []
        if (x || y) {
          transforms.push(`translate(${x} ${y})`)
        }
        if (scaleX !== 1 || scaleY !== 1) {
          transforms.push(`scale(${scaleX} ${scaleY})`)
        }
        if (existingTransform) {
          transforms.push(existingTransform)
        }

        const carriedAttrs = attrs.replace(
          /\s+(?:x|y|width|height|viewBox|xmlns|xmlns:xlink|preserveAspectRatio|version|transform)\s*=\s*(['"])[^'"]*\1/g,
          "",
        )
        const transform = transforms.length ? ` transform="${transforms.join(" ")}"` : ""
        return `<g${transform}${carriedAttrs}>${inner}</g>`
      },
    )

    if (next === result) {
      break
    }

    result = next
  }

  return result
}

export function prefixSvgIds(svg: string, prefix: string) {
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
