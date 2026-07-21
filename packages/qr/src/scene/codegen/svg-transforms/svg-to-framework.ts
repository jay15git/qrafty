import { parseReactSvgContent, getSvelteComponentCode, getVueComponentCode } from "./parse-react-svg"
import type { FrameworkTarget } from "../types"

export async function svgToFramework(svg: string, target: FrameworkTarget) {
  if (target.framework === "svg") {
    return svg
  }

  if (target.framework === "vue") {
    return getVueComponentCode({ content: svg, lang: target.lang })
  }

  if (target.framework === "svelte") {
    return getSvelteComponentCode({ content: svg, lang: target.lang })
  }

  const componentName = target.componentName ?? "QrCard"
  return parseReactSvgContent({
    componentName,
    svgCode: svg,
    typescript: target.dialect === "tsx",
  })
}
