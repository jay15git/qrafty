import type { DomLayerNode } from "./types"
import { emitNewQrCodeHtml, emitNewQrCodeReact } from "./emit-qr-component"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

const UNITLESS_CSS_PROPERTIES = new Set([
  "opacity",
  "zIndex",
  "fontWeight",
  "lineHeight",
  "flexGrow",
  "flexShrink",
  "order",
])

function cssKeyToKebab(key: string) {
  return key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
}

export function cssPropertiesToInlineStyle(properties: Record<string, string | number>) {
  return Object.entries(properties)
    .map(([key, value]) => {
      const unit =
        typeof value === "number" && !UNITLESS_CSS_PROPERTIES.has(key) ? "px" : ""

      return `${cssKeyToKebab(key)}:${value}${unit}`
    })
    .join(";")
}

export function cssPropertiesToReactStyle(properties: Record<string, string | number>) {
  return Object.entries(properties)
    .map(([key, value]) => {
      const serialized =
        typeof value === "string" && value.includes('"')
          ? `{\`${value.replaceAll("`", "\\`")}\`}`
          : JSON.stringify(value)

      return `${key}: ${serialized}`
    })
    .join(", ")
}

export function domLayersUseQrPackage(layers: DomLayerNode[]) {
  const walk = (nodes: DomLayerNode[]): boolean => {
    for (const node of nodes) {
      if (node.qrProps) {
        return true
      }

      if (node.children?.length && walk(node.children)) {
        return true
      }
    }

    return false
  }

  return walk(layers)
}

export function emitDomLayersHtml(layers: DomLayerNode[]) {
  return layers.map((layer, index) => emitDomLayerHtml(layer, index)).join("\n")
}

function emitDomLayerHtml(layer: DomLayerNode, index: number): string {
  const className = `qr-layer qr-layer--${layer.kind} qr-layer--${index}`
  const style = cssPropertiesToInlineStyle(layer.style)
  const children: string = layer.children?.length
    ? layer.children.map((child, childIndex) => emitDomLayerHtml(child, childIndex)).join("\n")
    : ""

  const inner =
    layer.htmlContent ??
    (layer.qrProps
      ? emitNewQrCodeHtml(layer.qrProps)
      : layer.svgInner
        ? layer.svgInner
        : layer.content
          ? escapeHtml(layer.content)
          : "")

  if (layer.children?.length) {
    return `<div class="${className}" style="${style}">\n${children}\n${inner ? `${inner}\n` : ""}</div>`
  }

  if (!inner && (layer.kind === "module" || layer.kind === "card")) {
    return `<div class="${className}" style="${style}"></div>`
  }

  return `<div class="${className}" style="${style}">${inner}</div>`
}

export function emitDomLayersReact(layers: DomLayerNode[], indent = "      ") {
  return layers.map((layer) => emitDomLayerReact(layer, indent)).join("\n")
}

function emitDomLayerReact(layer: DomLayerNode, indent: string): string {
  const style = cssPropertiesToReactStyle(layer.style)

  const children: string = layer.children?.length
    ? `\n${layer.children.map((child) => emitDomLayerReact(child, `${indent}  `)).join("\n")}\n${indent}`
    : ""

  if (layer.children?.length) {
    return `${indent}<div style={{ ${style} }}>${children}</div>`
  }

  const moduleImage = parseModuleImageHtml(layer.htmlContent)
  if (moduleImage) {
    return `${indent}<img alt="" src={${JSON.stringify(moduleImage.src)}} style={{ ${cssPropertiesToReactStyle(moduleImage.style)} }} />`
  }

  if (layer.htmlContent) {
    return `${indent}<div style={{ ${style} }} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(layer.htmlContent)} }} />`
  }

  if (layer.qrProps) {
    const { className, style: qrStyle, ...qrProps } = layer.qrProps
    const classAttr = className ? ` className=${JSON.stringify(className)}` : ""

    return `${indent}<div${classAttr} style={{ ${style} }}>
${emitNewQrCodeReact(
  {
    ...qrProps,
    style: {
      display: "block",
      height: "100%",
      width: "100%",
      ...qrStyle,
    },
  },
  `${indent}  `,
)}
${indent}</div>`
  }

  if (layer.svgInner) {
    return `${indent}<div style={{ ${style} }} dangerouslySetInnerHTML={{ __html: ${JSON.stringify(layer.svgInner)} }} />`
  }

  if (layer.content?.includes("\n")) {
    return `${indent}<div style={{ ${style}, whiteSpace: "pre-wrap" }}>${JSON.stringify(layer.content)}</div>`
  }

  if (layer.content) {
    return `${indent}<div style={{ ${style} }}>${JSON.stringify(layer.content)}</div>`
  }

  return `${indent}<div style={{ ${style} }} />`
}

function parseModuleImageHtml(htmlContent?: string) {
  if (!htmlContent?.startsWith("<img")) {
    return null
  }

  const srcMatch = htmlContent.match(/\ssrc="([^"]+)"/)
  const styleMatch = htmlContent.match(/\sstyle="([^"]+)"/)
  if (!srcMatch) {
    return null
  }

  const style: Record<string, string | number> = {}
  if (styleMatch) {
    for (const rule of styleMatch[1].split(";")) {
      const [rawKey, rawValue] = rule.split(":")
      const key = rawKey?.trim()
      const value = rawValue?.trim()
      if (!key || !value) {
        continue
      }

      const camelKey = key.replace(/-([a-z])/g, (_match, char: string) => char.toUpperCase())
      const numeric = Number.parseFloat(value)
      style[camelKey] = value.endsWith("px") && Number.isFinite(numeric) ? numeric : value
    }
  }

  return {
    src: srcMatch[1],
    style,
  }
}

export function emitDomLayerCssRules(layers: DomLayerNode[], classPrefix = "qr-layer") {
  const rules: string[] = []

  const walk = (layer: DomLayerNode, path: string) => {
    const className = `.${classPrefix}--${path}`
    rules.push(`${className}{${cssPropertiesToInlineStyle(layer.style)}}`)
    layer.children?.forEach((child, childIndex) => {
      walk(child, `${path}-${childIndex}`)
    })
  }

  layers.forEach((layer, index) => {
    walk(layer, `${layer.kind}-${index}`)
  })

  return rules.join("\n")
}

export function emitDomLayersCssMarkup(layers: DomLayerNode[], classPrefix = "qr-layer") {
  return layers
    .map((layer, index) => emitDomLayerCssMarkup(layer, `${layer.kind}-${index}`, classPrefix))
    .join("\n")
}

function emitDomLayerCssMarkup(layer: DomLayerNode, path: string, classPrefix: string): string {
  const className = `${classPrefix}--${path}`
  const children: string = layer.children?.length
    ? layer.children
        .map((child, childIndex) => emitDomLayerCssMarkup(child, `${path}-${childIndex}`, classPrefix))
        .join("\n")
    : ""
  const inner =
    layer.htmlContent ??
    (layer.qrProps
      ? emitNewQrCodeHtml(layer.qrProps)
      : layer.svgInner
        ? layer.svgInner
        : layer.content
          ? escapeHtml(layer.content)
          : "")

  if (layer.children?.length) {
    return `<div class="${classPrefix} ${className}">\n${children}\n</div>`
  }

  if (!inner && layer.kind === "module") {
    return `<div class="${classPrefix} ${className}"></div>`
  }

  return `<div class="${classPrefix} ${className}">${inner}</div>`
}
