import { getModuleGradientCoverRect } from "./gradient-fill-utils"

const SVG_NS = "http://www.w3.org/2000/svg"

export type ModuleFillCoverRect = {
  height: number
  width: number
  x: number
  y: number
}

function isSvgElementLike(node: Element): node is SVGElement {
  return typeof node.getAttribute === "function" && typeof node.setAttribute === "function"
}

function cleanupStaleUnifiedImageLayers(svg: SVGElement) {
  for (const layer of [
    "corner-frame-gradient",
    "corner-dot-gradient",
    "unified-gradient-definition",
    "unified-image-finder",
    "unified-image-finder-outer",
    "unified-image-finder-inner",
    "unified-image-definition",
    "unified-image-clip",
    "unified-image-fill",
    "unified-image-logo-mask",
    "unified-image-logo-fill",
    "logo-unified-image",
  ]) {
    svg.querySelectorAll(`[data-qr-layer="${layer}"]`).forEach((node) => {
      node.remove()
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

function formatSvgNumber(value: number) {
  if (Math.abs(value) < 0.000001) {
    return "0"
  }

  return Number(value.toFixed(4)).toString()
}

function findLogoImage(svg: SVGElement) {
  return (
    Array.from(svg.children).find((child) => {
      if (child.tagName.toLowerCase() !== "image") {
        return false
      }

      const layer = child.getAttribute("data-qr-layer")

      return !layer
    }) ?? null
  )
}

function cloneShapeForClipPath(source: SVGElement) {
  const clone = source.cloneNode(true) as SVGElement

  clone.removeAttribute("id")
  clone.removeAttribute("fill")
  clone.removeAttribute("stroke")
  clone.removeAttribute("opacity")
  clone.removeAttribute("clip-path")
  clone.removeAttribute("data-testid")
  clone.removeAttribute("data-qr-layer")
  clone.removeAttribute("style")

  const fillRule = source.getAttribute("fill-rule")

  clone.setAttribute("clip-rule", fillRule ?? "evenodd")

  return clone
}

function hideOriginalPaintTarget(target: SVGElement) {
  target.setAttribute("opacity", "0")
  target.setAttribute("data-qr-layer", "unified-image-source")
}

function getDefaultModulePaintTargets(svg: SVGElement) {
  return Array.from(svg.querySelectorAll('[data-testid="data-modules"]')).filter(isSvgElementLike)
}

function collectUnifiedImageMaskTargets(
  svg: SVGElement,
  modulePaintTargets: SVGElement[] | undefined,
) {
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

  return [...moduleTargets, ...finderOuter, ...finderInner, ...customCornerDots]
}

function resolveLogoImageHref(logo: SVGElement) {
  return logo.getAttribute("href") ?? logo.getAttributeNS("http://www.w3.org/1999/xlink", "href")
}

function applyUnifiedImageLogoFill(
  svg: SVGElement,
  document: Document,
  {
    coverRect,
    imageHref,
    imageId,
    logo,
  }: {
    coverRect: ModuleFillCoverRect
    imageHref: string
    imageId: string
    logo: SVGElement
  },
) {
  const logoHref = resolveLogoImageHref(logo)
  const logoX = logo.getAttribute("x")
  const logoY = logo.getAttribute("y")
  const logoWidth = logo.getAttribute("width")
  const logoHeight = logo.getAttribute("height")

  if (!logoHref || !logoX || !logoY || !logoWidth || !logoHeight) {
    return
  }

  const maskId = `${imageId}-logo-mask`
  const logoFillId = `${imageId}-logo`

  svg.querySelector(`#${maskId}`)?.remove()
  svg.querySelector(`#${logoFillId}`)?.remove()

  const mask = document.createElementNS(SVG_NS, "mask")
  mask.setAttribute("id", maskId)
  mask.setAttribute("maskUnits", "userSpaceOnUse")
  mask.setAttribute("maskContentUnits", "userSpaceOnUse")
  mask.setAttribute("data-qr-layer", "unified-image-logo-mask")

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

  const logoFill = document.createElementNS(SVG_NS, "image")
  logoFill.setAttribute("id", logoFillId)
  logoFill.setAttribute("href", imageHref)
  logoFill.setAttributeNS("http://www.w3.org/1999/xlink", "href", imageHref)
  logoFill.setAttribute("x", formatSvgNumber(coverRect.x))
  logoFill.setAttribute("y", formatSvgNumber(coverRect.y))
  logoFill.setAttribute("width", formatSvgNumber(coverRect.width))
  logoFill.setAttribute("height", formatSvgNumber(coverRect.height))
  logoFill.setAttribute("preserveAspectRatio", "xMidYMid slice")
  logoFill.setAttribute("mask", `url(#${maskId})`)
  logoFill.setAttribute("data-qr-layer", "unified-image-logo-fill")

  const logoOpacity = logo.getAttribute("opacity")

  if (logoOpacity) {
    logoFill.setAttribute("opacity", logoOpacity)
  }

  hideOriginalPaintTarget(logo)
  svg.insertBefore(logoFill, logo)
}

export function applyUnifiedQrImageFill(
  svg: SVGElement,
  {
    coverRect,
    imageHref,
    imageId,
    imageLayer = "unified-image-definition",
    margin,
    modulePaintTargets,
  }: {
    imageHref: string
    imageId: string
    imageLayer?: string
    margin: number
    coverRect?: ModuleFillCoverRect | null
    modulePaintTargets?: SVGElement[]
  },
) {
  cleanupStaleUnifiedImageLayers(svg)

  const document = svg.ownerDocument
  const resolvedCoverRect = coverRect ?? getModuleGradientCoverRect(svg, margin)

  if (!document || !resolvedCoverRect) {
    return
  }

  const maskTargets = collectUnifiedImageMaskTargets(svg, modulePaintTargets)

  if (maskTargets.length === 0) {
    return
  }

  const clipPathId = `${imageId}-clip`
  svg.querySelector(`#${clipPathId}`)?.remove()
  svg.querySelector(`#${imageId}`)?.remove()

  const clipPath = document.createElementNS(SVG_NS, "clipPath")
  clipPath.setAttribute("id", clipPathId)
  clipPath.setAttribute("clipPathUnits", "userSpaceOnUse")
  clipPath.setAttribute("data-qr-layer", "unified-image-clip")

  for (const target of maskTargets) {
    clipPath.appendChild(cloneShapeForClipPath(target))
  }

  getOrCreateSvgDefs(svg, document).appendChild(clipPath)

  const image = document.createElementNS(SVG_NS, "image")
  image.setAttribute("id", imageId)
  image.setAttribute("href", imageHref)
  image.setAttributeNS("http://www.w3.org/1999/xlink", "href", imageHref)
  image.setAttribute("x", formatSvgNumber(resolvedCoverRect.x))
  image.setAttribute("y", formatSvgNumber(resolvedCoverRect.y))
  image.setAttribute("width", formatSvgNumber(resolvedCoverRect.width))
  image.setAttribute("height", formatSvgNumber(resolvedCoverRect.height))
  image.setAttribute("preserveAspectRatio", "xMidYMid slice")
  image.setAttribute("clip-path", `url(#${clipPathId})`)
  image.setAttribute("data-qr-layer", imageLayer)

  for (const target of maskTargets) {
    hideOriginalPaintTarget(target)
  }

  const logo = findLogoImage(svg)

  if (logo && isSvgElementLike(logo)) {
    svg.insertBefore(image, logo)
    applyUnifiedImageLogoFill(svg, document, {
      coverRect: resolvedCoverRect,
      imageHref,
      imageId,
      logo,
    })
  } else {
    svg.appendChild(image)
  }
}
