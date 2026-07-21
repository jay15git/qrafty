import { emitDomLayersHtml } from "./emit-dom-tree"
import type { SceneIr, SceneIrShaderNode } from "./types"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

function emitFontBlocks(ir: SceneIr) {
  return ir.fonts
    .map((font) => {
      if (font.cssUrl) {
        return `<link rel="stylesheet" href="${escapeHtml(font.cssUrl)}" />`
      }
      if (font.cssText) {
        return `<style>${font.cssText}</style>`
      }
      return ""
    })
    .filter(Boolean)
    .join("\n")
}

function emitShaderNode(node: SceneIrShaderNode) {
  const { bounds, snapshotUrl, fallbackFill = "#111827", shader } = node

  if (snapshotUrl) {
    return `<img alt="" src="${escapeHtml(snapshotUrl)}" style="position:absolute;left:${bounds.x}px;top:${bounds.y}px;width:${bounds.width}px;height:${bounds.height}px;object-fit:cover" />`
  }

  return `<!-- paper-shader:${shader.shaderId} --><div style="position:absolute;left:${bounds.x}px;top:${bounds.y}px;width:${bounds.width}px;height:${bounds.height}px;background:${escapeHtml(fallbackFill)}"></div>`
}

function emitAnimatedQrPlaceholder(ir: SceneIr) {
  if (!ir.animatedQr) {
    return ""
  }

  const qr = ir.animatedQr
  return `<!-- Animated QR requires React export with @new-qr/qr/animated -->
<div style="position:absolute;left:${qr.bounds.x}px;top:${qr.bounds.y}px;width:${qr.bounds.width}px;height:${qr.bounds.height}px"></div>`
}

export function emitHtml(ir: SceneIr) {
  const { bounds } = ir
  const shaderMarkup = ir.shaders.map(emitShaderNode).join("\n")
  const domMarkup = emitDomLayersHtml(ir.domLayers ?? [])
  const fontBlocks = emitFontBlocks(ir)
  const animatedBlock = emitAnimatedQrPlaceholder(ir)
  const prefix = fontBlocks ? `${fontBlocks}\n` : ""

  return `${prefix}<div class="qr-card" style="position:relative;width:${bounds.width}px;height:${bounds.height}px;overflow:hidden">
${shaderMarkup}
${domMarkup}
${animatedBlock}
</div>`
}
