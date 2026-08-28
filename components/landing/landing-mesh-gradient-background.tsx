"use client"

import {
  Component,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react"
import dynamic from "next/dynamic"

const MeshGradient = dynamic(
  () =>
    import("@paper-design/shaders-react").then((mod) => mod.MeshGradient),
  { ssr: false },
)

/**
 * High-key field: two whites + three neon-light blobs.
 * Accents stay high-L (no deep pink/mud). Mixes pass through white, not grey.
 */
const LANDING_MESH_GRADIENT_COLORS = [
  "#FFFFFF",
  "#FFFFFF",
  "#FFEF00",
  "#CCFF00",
  "#FF9AD8",
  "#FFFFFF",
]

const LANDING_MESH_GRADIENT_FALLBACK = "#FFFFFF"

const LANDING_MESH_GRADIENT_SPEED = 0.22

/**
 * Paper performance guide:
 * https://paper-design-shaders-16.mintlify.app/concepts/performance
 * Hero band is decorative — 720p cap, 1× ratio, pause off-screen / reduced-motion.
 */
const LANDING_MESH_GRADIENT_RENDER_OPTIONS = {
  minPixelRatio: 1,
  maxPixelCount: 1280 * 720,
  webGlContextAttributes: {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    preserveDrawingBuffer: false,
    powerPreference: "low-power" as WebGLPowerPreference,
  },
} as const

class LandingMeshGradientErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.hasError ? null : this.props.children
  }
}

function useHeroShaderSpeed() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isInView, setIsInView] = useState(true)

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setPrefersReducedMotion(media.matches)

    update()
    media.addEventListener("change", update)
    return () => media.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    const node = hostRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: "80px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return {
    hostRef,
    speed:
      prefersReducedMotion || !isInView ? 0 : LANDING_MESH_GRADIENT_SPEED,
  }
}

export function LandingMeshGradientBackground() {
  const [hasError, setHasError] = useState(false)
  const { hostRef, speed } = useHeroShaderSpeed()

  if (hasError) {
    return (
      <>
        <style>{landingShaderStyles}</style>
        <div
          aria-hidden="true"
          className="landing-shader-fallback pointer-events-none absolute inset-0"
          style={{ backgroundColor: LANDING_MESH_GRADIENT_FALLBACK }}
        />
      </>
    )
  }

  return (
    <>
      <style>{landingShaderStyles}</style>
      <div
        ref={hostRef}
        aria-hidden="true"
        className="landing-shader-host pointer-events-none absolute inset-0 overflow-hidden"
      >
        <LandingMeshGradientErrorBoundary onError={() => setHasError(true)}>
          <MeshGradient
            {...LANDING_MESH_GRADIENT_RENDER_OPTIONS}
            aria-hidden="true"
            colors={LANDING_MESH_GRADIENT_COLORS}
            distortion={0.32}
            fit="cover"
            frame={42}
            grainMixer={0}
            grainOverlay={0}
            scale={0.88}
            speed={speed}
            style={{ height: "100%", width: "100%" }}
            swirl={0}
          />
        </LandingMeshGradientErrorBoundary>
      </div>
    </>
  )
}

/** Paper mounts canvas at z-index:-1; lift it so shader is visible as a page background. */
const landingShaderStyles = `
.landing-shader-host {
  contain: paint;
}
.landing-shader-host [data-paper-shader] canvas,
.landing-shader-fallback {
  z-index: 0 !important;
}
`
