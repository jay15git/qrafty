import type { NewQrCodeProps } from "../types"
import { applyPortableFinderGradientOverlays } from "./finder-gradient-overlays"
import { applyUnifiedQrGradientFill } from "./unified-gradient"
import { applyUnifiedQrImageFill } from "./unified-image"

const SVG_NS = "http://www.w3.org/2000/svg"
const DOTS_CLIP_PATH_PREFIX = "clip-path-dot-color-"

function getActivePalette(props: NewQrCodeProps) {
  return (props.palette ?? []).filter(Boolean)
}

function createLinearGradient(
  document: Document,
  id: string,
  gradient: NonNullable<NewQrCodeProps["gradient"]> & object,
) {
  const element = document.createElementNS(SVG_NS, "linearGradient")
  element.setAttribute("id", id)
  element.setAttribute("gradientUnits", "userSpaceOnUse")

  const rotation = gradient.rotation ?? 0
  const radians = (rotation * Math.PI) / 180
  const x1 = 50 - Math.cos(radians) * 50
  const y1 = 50 - Math.sin(radians) * 50
  const x2 = 50 + Math.cos(radians) * 50
  const y2 = 50 + Math.sin(radians) * 50

  element.setAttribute("x1", String(x1))
  element.setAttribute("y1", String(y1))
  element.setAttribute("x2", String(x2))
  element.setAttribute("y2", String(y2))

  for (const stop of gradient.stops) {
    const stopElement = document.createElementNS(SVG_NS, "stop")
    stopElement.setAttribute("offset", String(stop.offset))
    stopElement.setAttribute("stop-color", stop.color)
    element.appendChild(stopElement)
  }

  return element
}

function createRadialGradient(
  document: Document,
  id: string,
  gradient: NonNullable<NewQrCodeProps["gradient"]> & object,
) {
  const element = document.createElementNS(SVG_NS, "radialGradient")
  element.setAttribute("id", id)
  const center = gradient.center ?? { x: 0.5, y: 0.5 }
  element.setAttribute("cx", String(center.x * 100))
  element.setAttribute("cy", String(center.y * 100))
  element.setAttribute("r", "50%")

  for (const stop of gradient.stops) {
    const stopElement = document.createElementNS(SVG_NS, "stop")
    stopElement.setAttribute("offset", String(stop.offset))
    stopElement.setAttribute("stop-color", stop.color)
    element.appendChild(stopElement)
  }

  return element
}

function applyDotsGradientExtension(svg: SVGElement, props: NewQrCodeProps) {
  if (props.colorMode !== "gradient" || props.gradient === "none" || !props.gradient) {
    return
  }

  const document = svg.ownerDocument
  if (!document) {
    return
  }

  let defs = svg.querySelector("defs")
  if (!defs) {
    defs = document.createElementNS(SVG_NS, "defs")
    svg.insertBefore(defs, svg.firstChild)
  }

  const gradientId = "new-qr-dots-gradient"
  const gradientElement =
    props.gradient.type === "radial"
      ? createRadialGradient(document, gradientId, props.gradient)
      : createLinearGradient(document, gradientId, props.gradient)

  defs.appendChild(gradientElement)

  const dotsGroup = svg.querySelector('[data-testid="data-modules"]')
  if (dotsGroup instanceof SVGElement) {
    dotsGroup.setAttribute("fill", `url(#${gradientId})`)
    dotsGroup.setAttribute("data-qr-layer", "dot-gradient")
  }
}

function applyDotsPaletteExtension(svg: SVGElement, props: NewQrCodeProps) {
  const palette = getActivePalette(props)
  if (props.colorMode !== "palette" || palette.length === 0) {
    return
  }

  const document = svg.ownerDocument
  if (!document) {
    return
  }

  let defs = svg.querySelector("defs")
  if (!defs) {
    defs = document.createElementNS(SVG_NS, "defs")
    svg.insertBefore(defs, svg.firstChild)
  }

  const dotsGroup = svg.querySelector('[data-testid="data-modules"]')
  if (!(dotsGroup instanceof SVGGElement)) {
    return
  }

  const modules = [...dotsGroup.querySelectorAll("rect, path, circle")]
  modules.forEach((module, index) => {
    const clipId = `${DOTS_CLIP_PATH_PREFIX}${index}`
    const clipPath = document.createElementNS(SVG_NS, "clipPath")
    clipPath.setAttribute("id", clipId)

    const clone = module.cloneNode(true)
    clipPath.appendChild(clone)
    defs!.appendChild(clipPath)

    const overlay = document.createElementNS(SVG_NS, "rect")
    const bbox = (module as SVGGraphicsElement).getBBox?.()
    if (bbox) {
      overlay.setAttribute("x", String(bbox.x))
      overlay.setAttribute("y", String(bbox.y))
      overlay.setAttribute("width", String(bbox.width))
      overlay.setAttribute("height", String(bbox.height))
    }

    overlay.setAttribute("fill", palette[index % palette.length])
    overlay.setAttribute("clip-path", `url(#${clipId})`)
    dotsGroup.appendChild(overlay)
    module.setAttribute("opacity", "0")
  })

  dotsGroup.setAttribute("data-qr-layer", "dot-palette")
}

export function applyPortableQrSvgExtensions(svg: SVGElement, props: NewQrCodeProps) {
  const unifiedModuleGradient =
    props.gradientMode === "unified" &&
    props.colorMode === "gradient" &&
    props.gradient !== undefined &&
    props.gradient !== "none"

  const unifiedModuleImage =
    (props.gradientMode === "unified-image" || props.colorMode === "image") &&
    Boolean(props.moduleFillImage)

  if (!unifiedModuleGradient) {
    applyDotsGradientExtension(svg, props)
  }

  applyDotsPaletteExtension(svg, props)

  if (unifiedModuleImage && props.moduleFillImage) {
    applyUnifiedQrImageFill(svg, {
      imageHref: props.moduleFillImage,
      imageId: "new-qr-dots-image",
      margin: props.margin ?? 12,
    })

    return
  }

  if (unifiedModuleGradient && props.gradient && props.gradient !== "none") {
    applyUnifiedQrGradientFill(svg, {
      gradient: props.gradient,
      gradientId: "new-qr-dots-gradient",
      margin: props.margin ?? 12,
    })

    return
  }

  applyPortableFinderGradientOverlays(svg, {
    finderInnerGradient: props.finderInnerGradient,
    finderOuterGradient: props.finderOuterGradient,
    margin: props.margin ?? 12,
  })
}
