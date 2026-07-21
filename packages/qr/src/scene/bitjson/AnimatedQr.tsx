"use client"

import { useEffect, useMemo, useRef, type CSSProperties } from "react"

import { buildBitjsonElementConfig, type AnimatedQrProps } from "./bitjson-config"

let bitjsonElementsDefined = false

function ensureBitjsonElements() {
  if (bitjsonElementsDefined || typeof window === "undefined") {
    return
  }

  void import("../../bitjson-vendor/runtime.js").then(({ defineCustomElements }) => {
    defineCustomElements(window)
    bitjsonElementsDefined = true
  })
}

if (typeof window !== "undefined") {
  ensureBitjsonElements()
}

type BitjsonQrCodeElement = HTMLElement & {
  animateQRCode: (animation?: string) => void
  animationSpeed: number
  autoAnimate: string
  autoAnimateInterval: number
  componentOnReady?: () => Promise<HTMLElement | null>
  contents: string
  externalSvg: string
  hoverColorMode: AnimatedQrProps["hoverColorMode"]
  hoverEffect: string
  motionIntensity: AnimatedQrProps["motionIntensity"]
  respectReducedMotion: boolean
}

function whenQrCodeElementReady(element: BitjsonQrCodeElement) {
  return customElements.whenDefined("qr-code").then(() => element.componentOnReady?.() ?? null)
}

export function AnimatedQr({
  className,
  contents,
  externalSvg,
  preset,
  hoverEffect,
  hoverColorMode,
  autoAnimate,
  autoAnimateInterval,
  speed,
  motionIntensity,
  respectReducedMotion,
  pressPreset,
  height,
  width,
  style,
}: AnimatedQrProps & { style?: CSSProperties }) {
  const elementRef = useRef<BitjsonQrCodeElement | null>(null)
  const config = useMemo(
    () =>
      buildBitjsonElementConfig({
        contents,
        externalSvg,
        preset,
        hoverEffect,
        hoverColorMode,
        autoAnimate,
        autoAnimateInterval,
        speed,
        motionIntensity,
        respectReducedMotion,
        pressPreset,
        width,
        height,
      }),
    [
      autoAnimate,
      autoAnimateInterval,
      contents,
      externalSvg,
      height,
      hoverColorMode,
      hoverEffect,
      motionIntensity,
      preset,
      pressPreset,
      respectReducedMotion,
      speed,
      width,
    ],
  )

  useEffect(() => {
    const element = elementRef.current
    if (!element) {
      return
    }

    element.contents = config.contents
    element.animationSpeed = config.animationSpeed
    element.autoAnimate = config.autoAnimate
    element.autoAnimateInterval = config.autoAnimateInterval
    element.hoverEffect = config.hoverEffect
    element.hoverColorMode = config.hoverColorMode ?? "both"
    element.motionIntensity = config.motionIntensity ?? "premium"
    element.respectReducedMotion = config.respectReducedMotion ?? true

    if (config.useExternalSvg) {
      element.externalSvg = config.externalSvg
      element.setAttribute("external-svg", config.externalSvg)
    } else {
      element.externalSvg = ""
      element.removeAttribute("external-svg")
    }
  }, [config])

  useEffect(() => {
    const element = elementRef.current
    if (!element) {
      return
    }

    let cancelled = false

    const handleAnimation = () => {
      if (!cancelled && typeof element.animateQRCode === "function") {
        element.animateQRCode(config.animationPreset)
      }
    }

    const handlePress = () => {
      if (!cancelled && config.pressPreset && typeof element.animateQRCode === "function") {
        element.animateQRCode(config.pressPreset)
      }
    }

    element.addEventListener("codeRendered", handleAnimation)
    element.addEventListener("pointerdown", handlePress)

    void whenQrCodeElementReady(element).then(() => {
      handleAnimation()
    })

    return () => {
      cancelled = true
      element.removeEventListener("codeRendered", handleAnimation)
      element.removeEventListener("pointerdown", handlePress)
    }
  }, [config])

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width,
        height,
        ...style,
      }}
    >
      <qr-code
        ref={elementRef}
        contents={config.contents}
        style={{ display: "block", height, width }}
      />
    </div>
  )
}
