import type { QraftyQrGradientConfig } from "../types"
import { applyDirectGradientFill, getModuleGradientCoverRect } from "./gradient-fill-utils"
import { createCornerGradientElement } from "./finder-gradient-overlays"

const SVG_NS = "http://www.w3.org/2000/svg"

export { applyDirectGradientFill, getModuleGradientCoverRect } from "./gradient-fill-utils"

function isSvgElementLike(node: Element): node is SVGElement {
  return typeof node.getAttribute === "function" && typeof node.setAttribute === "function"
}

function cleanupStaleUnifiedGradientLayers(svg: SVGElement) {
  for (const layer of ["corner-frame-gradient", "corner-dot-gradient"]) {
    svg.querySelectorAll(`[data-qr-layer="${layer}"]`).forEach((node) => {
      if (node.tagName.toLowerCase() === "g") {
        node.remove()
      }
    })
  }

  svg.querySelectorAll('[data-qr-layer="logo-unified-gradient"]').forEach((node) => {
    node.remove()
  })
}

function getOrCreateSvgDefs(svg: SVGElement, document: Document) {
  let defs = svg.querySelector("defs")

  if (!defs) {
    defs = document.createElementNS(SVG_NS, "defs")
    svg.insertBefore(defs, svg.firstChild)
  }

  return defs
}

function ensureUnifiedGradientDefinition(
  svg: SVGElement,
  {
    gradient,
    gradientId,
    gradientLayer,
    margin,
  }: {
    gradient: QraftyQrGradientConfig
    gradientId: string
    gradientLayer: string
    margin: number
  },
) {
  const document = svg.ownerDocument

  if (!document) {
    return null
  }

  const coverRect = getModuleGradientCoverRect(svg, margin)

  if (!coverRect) {
    return null
  }

  svg.querySelectorAll(`[data-qr-layer="${gradientLayer}"]`).forEach((node) => {
    node.remove()
  })

  svg.querySelector(`#${gradientId}`)?.remove()

  const gradientElement = createCornerGradientElement(document, gradient, {
    height: coverRect.height,
    id: gradientId,
    width: coverRect.width,
    x: coverRect.x,
    y: coverRect.y,
  })

  gradientElement.setAttribute("data-qr-layer", gradientLayer)
  getOrCreateSvgDefs(svg, document).appendChild(gradientElement)

  return `url(#${gradientId})`
}

function getDefaultModulePaintTargets(svg: SVGElement) {
  return Array.from(svg.querySelectorAll('[data-testid="data-modules"]')).filter(isSvgElementLike)
}

function applyUnifiedFillToPaintTargets(targets: SVGElement[], gradientRef: string) {
  for (const target of targets) {
    applyDirectGradientFill(target, gradientRef)
    target.setAttribute("data-qr-layer", "unified-gradient-fill")
    target.removeAttribute("opacity")
  }
}

export function applyUnifiedQrGradientFill(
  svg: SVGElement,
  {
    gradient,
    gradientId,
    gradientLayer = "unified-gradient-definition",
    margin,
    modulePaintTargets,
  }: {
    gradient: QraftyQrGradientConfig
    gradientId: string
    gradientLayer?: string
    margin: number
    modulePaintTargets?: SVGElement[]
  },
) {
  cleanupStaleUnifiedGradientLayers(svg)

  const gradientRef = ensureUnifiedGradientDefinition(svg, {
    gradient,
    gradientId,
    gradientLayer,
    margin,
  })

  if (!gradientRef) {
    return
  }

  const moduleTargets =
    modulePaintTargets && modulePaintTargets.length > 0
      ? modulePaintTargets
      : getDefaultModulePaintTargets(svg)

  const finderOuter = Array.from(
    svg.querySelectorAll('[data-testid="finder-patterns-outer"]'),
  ).filter(isSvgElementLike)
  const finderInner = Array.from(
    svg.querySelectorAll('[data-testid="finder-patterns-inner"]'),
  ).filter(isSvgElementLike)
  const customCornerDots = Array.from(
    svg.querySelectorAll('[data-qr-layer="custom-corner-dot"]'),
  ).filter(isSvgElementLike)

  applyUnifiedFillToPaintTargets(
    [...moduleTargets, ...finderOuter, ...finderInner, ...customCornerDots],
    gradientRef,
  )
}
