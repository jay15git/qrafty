import { emitCss } from "./emit-css"
import { emitHtml } from "./emit-html"
import { emitLiveReact } from "./emit-live-react"
import { emitSvg } from "./emit-svg"
import {
  buildCodegenManifest,
  prependCodegenComment,
  prependCodegenJsComment,
} from "./manifest"
import { preprocessSvg } from "./preprocess-svg"
import { svgToFramework } from "./svg-transforms/svg-to-framework"
import type { CodeExportTarget, CodegenTarget, FrameworkTarget, SceneIr } from "./types"
import { isCodeExportTarget, isLiveReactTarget } from "./types"

export type {
  CodeExportTarget,
  FrameworkTarget,
  CodegenTarget,
  DomLayerKind,
  DomLayerNode,
  SceneIr,
  SceneIrBounds,
  SceneIrFontRef,
  SceneIrShaderNode,
} from "./types"
export { isCodeExportTarget, isLiveReactTarget } from "./types"
export { emitSvg } from "./emit-svg"
export { emitHtml } from "./emit-html"
export { emitCss } from "./emit-css"
export { emitLiveReact } from "./emit-live-react"
export { preprocessSvg, flattenNestedSvgs, prefixSvgIds } from "./preprocess-svg"
export { buildCodegenManifest, prependCodegenComment, prependCodegenJsComment } from "./manifest"
export { normalizeSvg, extractSvgInnerMarkup } from "./normalize-svg"
export { parseReactSvgContent } from "./svg-transforms/parse-react-svg"
export { svgToFramework } from "./svg-transforms/svg-to-framework"
export { convertQrSvgToDom } from "./svg-to-dom-modules"
export type { ConvertQrSvgOptions } from "./svg-to-dom-modules"

export async function buildCodegenOutput(ir: SceneIr, target: CodegenTarget) {
  const manifest = buildCodegenManifest(ir, target)

  if (isCodeExportTarget(target)) {
    switch (target.format) {
      case "html": {
        const code = prependCodegenComment(emitHtml(ir), manifest.installCommand)
        return {
          code,
          manifest,
          svg: preprocessSvg(emitSvg(ir)),
        }
      }
      case "css": {
        const code = prependCodegenComment(emitCss(ir), manifest.installCommand)
        return {
          code,
          manifest,
          svg: preprocessSvg(emitSvg(ir)),
        }
      }
      case "react": {
        const code = prependCodegenJsComment(
          emitLiveReact(ir, {
            dialect: target.dialect,
            componentName: target.componentName ?? ir.componentName,
          }),
          manifest.installCommand,
        )
        return {
          code,
          manifest,
          svg: preprocessSvg(emitSvg(ir)),
        }
      }
      case "svg": {
        const svg = preprocessSvg(emitSvg(ir), { idPrefix: ir.componentName ?? "qr-card" })
        return {
          code: svg,
          manifest,
          svg,
        }
      }
    }
  }

  const legacyTarget = target as FrameworkTarget

  if (isLiveReactTarget(legacyTarget)) {
    const code = prependCodegenJsComment(
      emitLiveReact(ir, {
        dialect: legacyTarget.dialect,
        componentName: legacyTarget.componentName ?? ir.componentName,
      }),
      manifest.installCommand,
    )
    return {
      code,
      manifest,
      svg: preprocessSvg(emitSvg(ir)),
    }
  }

  const svg = preprocessSvg(emitSvg(ir), { idPrefix: ir.componentName ?? "qr-card" })
  const code = await svgToFramework(svg, legacyTarget)
  const header = manifest.installCommand
    ? prependCodegenJsComment("", manifest.installCommand).trimEnd()
    : ""

  return {
    code: header ? `${header}\n${code}` : code,
    manifest,
    svg,
  }
}
