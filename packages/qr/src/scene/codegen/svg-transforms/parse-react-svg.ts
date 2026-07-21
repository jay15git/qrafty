const ATTRIBUTES: Record<string, string> = {
  class: "className",
  "clip-rule": "clipRule",
  "clip-path": "clipPath",
  "fill-rule": "fillRule",
  "stroke-width": "strokeWidth",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "stroke-dasharray": "strokeDasharray",
  "stroke-dashoffset": "strokeDashoffset",
  "stroke-miterlimit": "strokeMiterlimit",
  "xmlns:xlink": "xmlnsXlink",
  "text-anchor": "textAnchor",
  "xml:space": "xmlSpace",
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  "color-interpolation-filters": "colorInterpolationFilters",
  "xlink:href": "xlinkHref",
  "flood-opacity": "floodOpacity",
  "flood-color": "floodColor",
  "font-family": "fontFamily",
  "font-size": "fontSize",
  "font-weight": "fontWeight",
  "font-style": "fontStyle",
  "letter-spacing": "letterSpacing",
  "text-decoration": "textDecoration",
  "preserve-aspect-ratio": "preserveAspectRatio",
}

function convertStyleStringToObject(styleString: string) {
  const styleObj: Record<string, string> = {}
  styleString.split(";").forEach((style) => {
    const [property, value] = style.split(":").map((part) => part.trim())
    if (property && value) {
      const camelCaseProperty = property.replace(/-([a-z])/g, (_, char: string) =>
        char.toUpperCase(),
      )
      styleObj[camelCaseProperty] = value
    }
  })
  return JSON.stringify(styleObj)
}

function formatCode(code: string) {
  return code
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim()
}

export function parseReactSvgContent({
  componentName,
  svgCode,
  typescript,
}: {
  componentName: string
  svgCode: string
  typescript: boolean
}) {
  const processedSvg = svgCode.replace(/style="([^"]*)"/g, (_, styleString: string) => {
    return `style={${convertStyleStringToObject(styleString)}}`
  })

  const reactifiedSvg = Object.entries(ATTRIBUTES).reduce(
    (svg, [htmlAttr, reactAttr]) =>
      svg.replace(new RegExp(`${htmlAttr}="`, "g"), `${reactAttr}="`),
    processedSvg.replace("<svg", "<svg {...props}"),
  )

  if (typescript) {
    return formatCode(
      `import type { SVGProps } from "react";\n\nconst ${componentName} = (props: SVGProps<SVGSVGElement>) => (\n  ${reactifiedSvg}\n);\n\nexport { ${componentName} };`,
    )
  }

  return formatCode(
    `const ${componentName} = (props) => (\n  ${reactifiedSvg}\n);\n\nexport { ${componentName} };`,
  )
}

export function parseSvgTemplateContent(content: string, framework: "Vue" | "Svelte") {
  let normalized = content
  if (normalized.includes("<?xml")) {
    normalized = normalized.replace(/<\?xml[^>]*\?>/i, "")
  }

  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi
  const styles: string[] = []
  let matched: RegExpExecArray | null

  while ((matched = styleTagRegex.exec(normalized)) !== null) {
    styles.push(matched[1])
  }

  const templateContent = normalized.replace(styleTagRegex, "").trim()
  const componentStyle = styles.length
    ? `<style${framework === "Vue" ? " scoped" : ""}>\n${styles.join("\n")}\n</style>`
    : ""

  return { componentStyle, templateContent }
}

export function getVueComponentCode({
  content,
  lang,
}: {
  content: string
  lang: "js" | "ts"
}) {
  const { templateContent, componentStyle } = parseSvgTemplateContent(content, "Vue")
  return formatCode(
    `<script setup${lang === "ts" ? ' lang="ts"' : ""}></script>\n<template>\n ${templateContent}\n</template>\n${componentStyle}`,
  )
}

export function getSvelteComponentCode({
  content,
  lang,
}: {
  content: string
  lang: "js" | "ts"
}) {
  const { templateContent, componentStyle } = parseSvgTemplateContent(content, "Svelte")
  return formatCode(
    `<script${lang === "ts" ? ' lang="ts"' : ""}></script>\n${templateContent}\n${componentStyle}`,
  )
}
