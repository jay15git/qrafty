import type { QraftyQrGradientConfig } from "../types"
import { applyDirectGradientFill, getModuleGradientCoverRect } from "./gradient-fill-utils"
import { createCornerGradientElement } from "./finder-gradient-overlays"

const SVG_NS = "http://www.w3.org/2000/svg"

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

function formatSvgNumber(value: number) {
  if (Math.abs(value) < 0.000001) {
    return "0"
  }

  return Number(value.toFixed(4)).toString()
}

function findLogoImage(svg: SVGElement): SVGElement | null {
  const found = Array.from(svg.children).find((child) => {
    if (child.tagName.toLowerCase() !== "image") {
      return false
    }

    const layer = child.getAttribute("data-qr-layer")

    return !layer
  })

  return found && isSvgElementLike(found) ? found : null
}

function resolveLogoImageHref(logo: SVGElement) {
  return logo.getAttribute("href") ?? logo.getAttributeNS("http://www.w3.org/1999/xlink", "href")
}

function hideOriginalPaintTarget(target: SVGElement) {
  target.setAttribute("data-qr-layer", "unified-gradient-source")
  target.setAttribute("opacity", "0")
}

function applyUnifiedGradientLogoFill(
  svg: SVGElement,
  document: Document,
  {
    coverRect,
    gradientRef,
    gradientId,
    logo,
  }: {
    coverRect: ReturnType<typeof getModuleGradientCoverRect>
    gradientRef: string
    gradientId: string
    logo: SVGElement
  },
) {
  if (!coverRect) {
    return
  }

  const logoHref = resolveLogoImageHref(logo)
  const logoX = logo.getAttribute("x")
  const logoY = logo.getAttribute("y")
  const logoWidth = logo.getAttribute("width")
  const logoHeight = logo.getAttribute("height")

  if (!logoHref || !logoX || !logoY || !logoWidth || !logoHeight) {
    return
  }

  const maskId = `${gradientId}-logo-mask`
  const logoFillId = `${gradientId}-logo-gradient-fill`

  svg.querySelector(`#${maskId}`)?.remove()
  svg.querySelector(`#${logoFillId}`)?.remove()

  const mask = document.createElementNS(SVG_NS, "mask")
  mask.setAttribute("id", maskId)
  mask.setAttribute("maskUnits", "userSpaceOnUse")
  mask.setAttribute("maskContentUnits", "userSpaceOnUse")
  mask.setAttribute("data-qr-layer", "logo-unified-gradient")

  const maskImage = document.createElementNS(SVG_NS, "image")
  maskImage.setAttribute("href", logoHref)
  maskImage.setAttributeNS("http://www.w3.org/1999/xlink", "href", logoHref)
  maskImage.setAttribute("x", logoX)
  maskImage.setAttribute("y", logoY)
  maskImage.setAttribute("width", logoWidth)
  maskImage.setAttribute("height", logoHeight)

  const preserveAspectRatio = logo.getAttribute("preserveAspectRatio")

  if (preserveAspectRatio) {
    maskImage.setAttribute("preserveAspectRatio", preserveAspectRatio)
  }

  mask.appendChild(maskImage)
  getOrCreateSvgDefs(svg, document).appendChild(mask)

  const logoFill = document.createElementNS(SVG_NS, "rect")
  logoFill.setAttribute("id", logoFillId)
  logoFill.setAttribute("x", formatSvgNumber(coverRect.x))
  logoFill.setAttribute("y", formatSvgNumber(coverRect.y))
  logoFill.setAttribute("width", formatSvgNumber(coverRect.width))
  logoFill.setAttribute("height", formatSvgNumber(coverRect.height))
  logoFill.setAttribute("fill", gradientRef)
  logoFill.setAttribute("mask", `url(#${maskId})`)
  logoFill.setAttribute("data-qr-layer", "logo-unified-gradient-fill")

  const logoOpacity = logo.getAttribute("opacity")

  if (logoOpacity) {
    logoFill.setAttribute("opacity", logoOpacity)
  }

  hideOriginalPaintTarget(logo)
  svg.insertBefore(logoFill, logo)
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

  const document = svg.ownerDocument
  const coverRect = getModuleGradientCoverRect(svg, margin)
  const logo = findLogoImage(svg)

  if (document && coverRect && logo) {
    applyUnifiedGradientLogoFill(svg, document, {
      coverRect,
      gradientId,
      gradientRef,
      logo,
    })
  }
}
