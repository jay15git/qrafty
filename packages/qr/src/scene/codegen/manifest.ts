import type { CodegenTarget, SceneIr } from "./types"
import { isCodeExportTarget } from "./types"
import { domLayersUseQrPackage } from "./emit-dom-tree"

function targetUsesReactDependencies(target: CodegenTarget) {
  if (isCodeExportTarget(target)) {
    return target.format === "react"
  }

  return target.framework === "react"
}

function targetNeedsRuntimeQrPackage(target: CodegenTarget, ir: SceneIr) {
  if (ir.animatedQr) {
    return true
  }

  if (!domLayersUseQrPackage(ir.domLayers ?? [])) {
    return false
  }

  if (isCodeExportTarget(target)) {
    return target.format !== "svg"
  }

  return target.framework !== "svg"
}

export function buildCodegenManifest(ir: SceneIr, target: CodegenTarget) {
  const dependencies: Record<string, string> = {}
  const needsShaders = ir.shaders.length > 0
  const needsQrPackage = targetNeedsRuntimeQrPackage(target, ir)
  const usesReact = targetUsesReactDependencies(target)

  if (needsQrPackage) {
    dependencies["@new-qr/qr"] = "0.1.0"
  }

  if (usesReact && needsShaders) {
    dependencies["@paper-design/shaders-react"] = "0.0.76"
    dependencies["@paper-design/shaders"] = "0.0.76"
  }

  const installCommand =
    Object.keys(dependencies).length > 0
      ? `pnpm add ${Object.keys(dependencies).join(" ")}`
      : ""

  const fontBlocks = ir.fonts
    .map((font) => {
      if (font.cssUrl) {
        return `<link rel="stylesheet" href="${font.cssUrl}" />`
      }
      if (font.cssText) {
        return `<style>${font.cssText}</style>`
      }
      return ""
    })
    .filter(Boolean)
    .join("\n")

  return {
    dependencies,
    installCommand,
    fontBlocks,
  }
}

export function prependCodegenComment(code: string, installCommand: string) {
  if (!installCommand) {
    return code
  }

  return `<!-- Required:\n${installCommand}\n-->\n${code}`
}

export function prependCodegenJsComment(code: string, installCommand: string) {
  if (!installCommand) {
    return code
  }

  return `/** Required:\n * ${installCommand}\n */\n${code}`
}
