import {
  buildPaperShaderRenderProps,
  getShaderComponentExportName,
} from "../shaders"

import { emitDomLayersReact, domLayersUseQrPackage } from "./emit-dom-tree"
import type { SceneIr } from "./types"

function formatShaderProps(props: Record<string, unknown>) {
  return Object.entries(props)
    .map(([key, value]) => `        ${key}={${JSON.stringify(value)}}`)
    .join("\n")
}

export function emitLiveReact(
  ir: SceneIr,
  options: { dialect: "jsx" | "tsx"; componentName?: string },
) {
  const componentName = options.componentName ?? ir.componentName ?? "QrCard"
  const shaderImports = new Set<string>()
  const shaderBlocks: string[] = []

  for (const node of ir.shaders) {
    const exportName = getShaderComponentExportName(node.shader.shaderId)
    shaderImports.add(exportName)
    const props = buildPaperShaderRenderProps(node.shader)
    const { bounds } = node

    shaderBlocks.push(`      <${exportName}
${formatShaderProps(props)}
        style={{ position: "absolute", left: ${bounds.x}, top: ${bounds.y}, width: ${bounds.width}, height: ${bounds.height} }}
      />`)
  }

  let qrBlock = ""
  if (ir.animatedQr) {
    shaderImports.add("AnimatedQr")
    const qr = ir.animatedQr
    qrBlock = `      <div style={{ position: "absolute", left: ${qr.bounds.x}, top: ${qr.bounds.y}, width: ${qr.bounds.width}, height: ${qr.bounds.height} }}>
        <AnimatedQr
          contents="${qr.contents.replaceAll('"', '\\"')}"
          externalSvg={\`${qr.externalSvg.replaceAll("`", "\\`")}\`}
          preset="${qr.preset}"
          hoverEffect="${qr.hoverEffect}"
          width={${qr.bounds.width}}
          height={${qr.bounds.height}}
        />
      </div>`
  }

  const domBlocks = emitDomLayersReact(ir.domLayers ?? [])
  const usesQrPackage = domLayersUseQrPackage(ir.domLayers ?? [])
  const paperImports = [...shaderImports].filter((name) => name !== "AnimatedQr")
  const shaderImportLine =
    paperImports.length > 0
      ? `import { ${paperImports.join(", ")} } from "@paper-design/shaders-react"\n`
      : ""
  const animatedImportLine = ir.animatedQr
    ? `import { AnimatedQr } from "@new-qr/qr/animated"\n`
    : ""
  const qrImportLine = usesQrPackage
    ? `import { NewQrCode } from "@new-qr/qr/react"\n`
    : ""

  return `${shaderImportLine}${animatedImportLine}${qrImportLine}export function ${componentName}() {
  return (
    <div style={{ position: "relative", width: ${ir.bounds.width}, height: ${ir.bounds.height}, overflow: "hidden" }}>
${shaderBlocks.join("\n")}
${domBlocks}
${qrBlock}
    </div>
  )
}`
}
