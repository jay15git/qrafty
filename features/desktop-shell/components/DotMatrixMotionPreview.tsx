"use client"

import { adaptExternalQRCodeSVG, getAnimationPreset, QRCodeEntity, sampleDotMatrixAnimationFrame } from "@new-qr/qr/dot-matrix"
import { QRCodeSVG } from "qrcode.react"
import { createElement, useEffect, useMemo, useRef } from "react"
import { renderToStaticMarkup } from "react-dom/server.browser"

import type { QrDotMatrixSquareLoader } from "@/features/qr-code/model/state"

type PreviewTarget = {
  animation: ReturnType<ReturnType<typeof getAnimationPreset>>
  element: SVGElement
}

const PREVIEW_SIZE = 64
const PAINTABLE_SELECTOR = "path,circle,rect,polygon"
const previewEntries = new Set<PreviewTarget[]>()
let previewFrame: number | undefined
let previewStartedAt = 0

function readModulePosition(element: SVGElement, axis: "column" | "row") {
  const value = element.getAttribute(`data-${axis}`)
  const parsed = value ? Number.parseFloat(value) : Number.NaN
  return Number.isFinite(parsed) ? parsed : 0
}

function applyPreviewSample(element: SVGElement, sample: { fill?: string; opacity: number }) {
  element.style.opacity = String(sample.opacity)

  if (!sample.fill) return

  const paintTargets = element.matches(PAINTABLE_SELECTOR)
    ? [element]
    : Array.from(element.querySelectorAll<SVGElement>(PAINTABLE_SELECTOR))

  for (const target of paintTargets) {
    target.style.fill = sample.fill
  }
}

function tickPreviewAnimations(now: number) {
  const elapsed = now - previewStartedAt

  for (const targets of previewEntries) {
    for (const { animation, element } of targets) {
      applyPreviewSample(element, sampleDotMatrixAnimationFrame(animation, elapsed))
    }
  }

  previewFrame = requestAnimationFrame(tickPreviewAnimations)
}

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

function registerPreview(targets: PreviewTarget[]) {
  previewEntries.add(targets)

  if (previewFrame === undefined) {
    previewStartedAt = performance.now()
    previewFrame = requestAnimationFrame(tickPreviewAnimations)
  }

  return () => {
    previewEntries.delete(targets)

    if (previewEntries.size === 0 && previewFrame !== undefined) {
      cancelAnimationFrame(previewFrame)
      previewFrame = undefined
    }
  }
}

function createPreviewSvgMarkup() {
  const svgMarkup = renderToStaticMarkup(
    createElement(QRCodeSVG, {
      bgColor: "#ffffff",
      fgColor: "#172033",
      level: "L",
      marginSize: 1,
      size: PREVIEW_SIZE,
      value: "qr",
    }),
  )

  return adaptExternalQRCodeSVG(svgMarkup, {
    moduleColor: "#172033",
    positionCenterColor: "#172033",
    positionRingColor: "#172033",
    squares: false,
  })?.svg ?? svgMarkup
}

let previewSvgMarkup: string | undefined

function getPreviewSvgMarkup() {
  previewSvgMarkup ??= createPreviewSvgMarkup()
  return previewSvgMarkup
}

function preparePreviewTargets(root: HTMLElement, loader: QrDotMatrixSquareLoader) {
  const modules = Array.from(root.querySelectorAll<SVGElement>(".module"))
  const rings = Array.from(root.querySelectorAll<SVGElement>(".position-ring"))
  const centers = Array.from(root.querySelectorAll<SVGElement>(".position-center"))
  const moduleCount =
    modules.reduce(
      (maximum, module) => Math.max(maximum, readModulePosition(module, "column"), readModulePosition(module, "row")),
      0,
    ) + 1
  const animation = getAnimationPreset(
    loader
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(""),
  )
  const settings = {
    animationSpeed: 1,
    dotMatrixColorBase: "#172033",
    dotMatrixColorMid: "#1e7aa8",
    dotMatrixColorPeak: "#38bdf8",
    dotMatrixOpacityBase: 0.18,
    dotMatrixOpacityMid: 0.6,
    dotMatrixOpacityPeak: 1,
  }

  const prepare = (elements: SVGElement[], entityType: QRCodeEntity) =>
    elements.map((element) => {
      element.style.setProperty("transform-box", "fill-box")
      element.style.transformOrigin = "center"

      return {
        animation: animation(
          element,
          readModulePosition(element, "column"),
          readModulePosition(element, "row"),
          moduleCount,
          entityType,
          settings,
        ),
        element,
      }
    })

  return [
    ...prepare(modules, QRCodeEntity.Module),
    ...prepare(rings, QRCodeEntity.PositionRing),
    ...prepare(centers, QRCodeEntity.PositionCenter),
  ]
}

export function DotMatrixMotionPreview({ loader }: { loader: QrDotMatrixSquareLoader }) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const svgMarkup = useMemo(getPreviewSvgMarkup, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root || prefersReducedMotion()) return

    root.dataset.previewAnimation = "running"
    return registerPreview(preparePreviewTargets(root, loader))
  }, [loader])

  return (
    <span
      aria-hidden="true"
      className="block size-16 shrink-0 overflow-hidden rounded-[4px] bg-white p-px shadow-[0_0_0_1px_rgb(15_23_42_/_0.08)]"
      data-qr-motion-preview="true"
      ref={rootRef}
    >
      <span dangerouslySetInnerHTML={{ __html: svgMarkup }} />
    </span>
  )
}
