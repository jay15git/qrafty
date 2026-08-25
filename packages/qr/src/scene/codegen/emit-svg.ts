import type { SceneIr, SceneIrShaderNode } from "./types"

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;")
}

function buildFontDefs(fonts: SceneIr["fonts"]) {
  return fonts
    .flatMap((font) => {
      if (font.cssText) {
        return [`<style type="text/css"><![CDATA[${font.cssText}]]></style>`]
      }

      if (font.cssUrl) {
        return [
          `<style type="text/css">@import url("${escapeXml(font.cssUrl)}");</style>`,
        ]
      }

      return []
    })
    .join("")
}

/** @deprecated Shaders are emitted inline in the SVG body at the correct z-index. */
function emitShaderNode(node: SceneIrShaderNode) {
  const { bounds, snapshotUrl, fallbackFill = "#111827", shader } = node

  if (snapshotUrl) {
    return `<image href="${escapeXml(snapshotUrl)}" x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" preserveAspectRatio="xMidYMid slice" />`
  }

  return `<!-- paper-shader:${shader.shaderId} --><rect x="${bounds.x}" y="${bounds.y}" width="${bounds.width}" height="${bounds.height}" fill="${escapeXml(fallbackFill)}" />`
}

export function emitSvg(ir: SceneIr) {
  const { bounds } = ir
  const legacyShaderMarkup =
    ir.shaders.length > 0 ? ir.shaders.map(emitShaderNode).join("") : ""
  const fontDefs = buildFontDefs(ir.fonts)
  const body = `${legacyShaderMarkup}${ir.body}`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${bounds.width}" height="${bounds.height}" viewBox="${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}"><defs>${fontDefs}${ir.defs}</defs>${body}</svg>`
}
