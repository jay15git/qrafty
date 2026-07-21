import {
  emitDomLayerCssRules,
  emitDomLayersCssMarkup,
} from "./emit-dom-tree"
import type { SceneIr, SceneIrShaderNode } from "./types"

function emitFontBlocks(ir: SceneIr) {
  return ir.fonts
    .map((font) => {
      if (font.cssUrl) {
        return `<link rel="stylesheet" href="${font.cssUrl}" />`
      }
      if (font.cssText) {
        return font.cssText
      }
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

function emitShaderRules(node: SceneIrShaderNode, index: number) {
  const { bounds, snapshotUrl, fallbackFill = "#111827" } = node
  const className = `.qr-shader-${index}`

  if (snapshotUrl) {
    return `${className}{position:absolute;left:${bounds.x}px;top:${bounds.y}px;width:${bounds.width}px;height:${bounds.height}px;object-fit:cover}`
  }

  return `${className}{position:absolute;left:${bounds.x}px;top:${bounds.y}px;width:${bounds.width}px;height:${bounds.height}px;background:${fallbackFill}}`
}

function emitShaderMarkup(node: SceneIrShaderNode, index: number) {
  if (node.snapshotUrl) {
    return `<img alt="" class="qr-shader-${index}" src="${node.snapshotUrl}" />`
  }

  return `<div class="qr-shader-${index}"></div>`
}

function emitAnimatedQrPlaceholder(ir: SceneIr) {
  if (!ir.animatedQr) {
    return { css: "", markup: "" }
  }

  const qr = ir.animatedQr
  return {
    css: `.qr-animated{position:absolute;left:${qr.bounds.x}px;top:${qr.bounds.y}px;width:${qr.bounds.width}px;height:${qr.bounds.height}px}`,
    markup: `<!-- Animated QR requires React export with @new-qr/qr/animated -->
<div class="qr-animated"></div>`,
  }
}

export function emitCss(ir: SceneIr) {
  const { bounds } = ir
  const animated = emitAnimatedQrPlaceholder(ir)
  const fontCss = emitFontBlocks(ir)
  const shaderRules = ir.shaders.map(emitShaderRules).join("\n")
  const shaderMarkup = ir.shaders.map(emitShaderMarkup).join("\n")
  const domRules = emitDomLayerCssRules(ir.domLayers ?? [])
  const domMarkup = emitDomLayersCssMarkup(ir.domLayers ?? [])

  const rules = [
    fontCss,
    `.qr-card{position:relative;width:${bounds.width}px;height:${bounds.height}px;overflow:hidden}`,
    shaderRules,
    domRules,
    animated.css,
  ]
    .filter(Boolean)
    .join("\n")

  return `<style>
${rules}
</style>
<div class="qr-card">
${shaderMarkup}
${domMarkup}
${animated.markup}
</div>`
}
