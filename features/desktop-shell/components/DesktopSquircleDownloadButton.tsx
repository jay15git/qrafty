"use client"

import { Download02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Warp } from "@paper-design/shaders-react"
import { LIVE_PAPER_SHADER_RENDER_OPTIONS } from "@new-qr/qr-internal/scene"
import {
  Component,
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

import { cn } from "@/lib/utils"

const DOWNLOAD_SHADER_FALLBACK_BG =
  "linear-gradient(135deg, #ffffff 0%, #85e9ff 52%, #05ffd1 100%)"
const DOWNLOAD_SHADER_MAX_RECOVERIES = 3
const DOWNLOAD_SHADER_MOUNT_PROBE_MS = 800

function hasDownloadShaderWebGlSupport() {
  if (typeof document === "undefined") {
    return false
  }

  if (
    typeof navigator !== "undefined" &&
    navigator.userAgent.toLowerCase().includes("jsdom")
  ) {
    return false
  }

  const canvas = document.createElement("canvas")

  try {
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
  } catch {
    return false
  }
}

function subscribeToDownloadShaderSupport() {
  return () => {}
}

function DownloadShaderErrorBoundary({
  children,
  onError,
}: {
  children: ReactNode
  onError: () => void
}) {
  return (
    <DownloadShaderErrorBoundaryInner onError={onError}>{children}</DownloadShaderErrorBoundaryInner>
  )
}

class DownloadShaderErrorBoundaryInner extends Component<
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

function useDownloadShaderContextRecovery(
  hostRef: React.RefObject<HTMLDivElement | null>,
  onRecover: () => void,
) {
  useEffect(() => {
    let cancelled = false
    let canvasCleanup: (() => void) | undefined
    let observer: MutationObserver | undefined

    const bindCanvas = (host: HTMLDivElement) => {
      canvasCleanup?.()
      const canvas = host.querySelector("canvas")
      if (!canvas) {
        canvasCleanup = undefined
        return
      }

      const handleContextLost = (event: Event) => {
        event.preventDefault()
        onRecover()
      }

      canvas.addEventListener("webglcontextlost", handleContextLost, false)
      canvasCleanup = () => {
        canvas.removeEventListener("webglcontextlost", handleContextLost, false)
      }
    }

    const host = hostRef.current
    if (host) {
      bindCanvas(host)
      observer = new MutationObserver(() => {
        if (!cancelled && hostRef.current) {
          bindCanvas(hostRef.current)
        }
      })
      observer.observe(host, { childList: true, subtree: true })
    }

    return () => {
      cancelled = true
      observer?.disconnect()
      canvasCleanup?.()
    }
  }, [hostRef, onRecover])
}

function DownloadWarpShader({
  mountGeneration,
  onError,
  onRecover,
}: {
  mountGeneration: number
  onError: () => void
  onRecover: () => void
}) {
  const hostRef = useRef<HTMLDivElement>(null)

  useDownloadShaderContextRecovery(hostRef, onRecover)

  return (
    <DownloadShaderErrorBoundary key={mountGeneration} onError={onError}>
      <div
        ref={hostRef}
        className="absolute inset-0 h-full w-full"
        data-shader-canvas-host-root=""
      >
        <Warp
          width={1280}
          height={720}
          colors={["#ffffff", "#85e9ff", "#05ffd1"]}
          proportion={0.48}
          softness={1}
          distortion={0.46}
          swirl={0.17}
          swirlIterations={4}
          shape="checks"
          shapeScale={0.4}
          speed={3.2}
          scale={2.5}
          rotation={1.35}
          {...LIVE_PAPER_SHADER_RENDER_OPTIONS}
          aria-hidden="true"
          data-shader-canvas-host
          style={{
            display: "block",
            height: "100%",
            width: "100%",
          }}
        />
      </div>
    </DownloadShaderErrorBoundary>
  )
}

export const DesktopSquircleDownloadButton = forwardRef<
  HTMLButtonElement,
  Omit<ComponentPropsWithoutRef<"button">, "children">
>(function DesktopSquircleDownloadButton(
  { className, onClick, type = "button", ...props },
  ref,
) {
  const shaderLayerRef = useRef<HTMLSpanElement>(null)
  const [recoverEpoch, setRecoverEpoch] = useState(0)
  const canRenderShader = useSyncExternalStore(
    subscribeToDownloadShaderSupport,
    hasDownloadShaderWebGlSupport,
    () => false,
  )

  const attemptShaderRecover = useCallback(() => {
    setRecoverEpoch((epoch) => {
      if (epoch >= DOWNLOAD_SHADER_MAX_RECOVERIES) {
        return epoch
      }

      return epoch + 1
    })
  }, [])

  const showWarpShader =
    canRenderShader && recoverEpoch <= DOWNLOAD_SHADER_MAX_RECOVERIES

  useEffect(() => {
    if (!showWarpShader) {
      return
    }

    const timer = window.setTimeout(() => {
      const host = shaderLayerRef.current
      if (!host?.querySelector("canvas")) {
        attemptShaderRecover()
      }
    }, DOWNLOAD_SHADER_MOUNT_PROBE_MS)

    return () => window.clearTimeout(timer)
  }, [attemptShaderRecover, recoverEpoch, showWarpShader])

  return (
    <button
      ref={ref}
      aria-label="Download"
      className={cn(
        "relative inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 overflow-hidden border-0 px-3 text-[#0a0a0a] shadow-[0_1px_2px_rgba(0,0,0,0.24)] transition hover:brightness-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100",
        "rounded-[10px] [corner-shape:squircle]",
        className,
      )}
      data-slot="desktop-download-trigger"
      type={type}
      onClick={onClick}
      {...props}
    >
      <span
        ref={shaderLayerRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[10px] [corner-shape:squircle]"
        data-slot="desktop-download-shader-layer"
        style={{ background: DOWNLOAD_SHADER_FALLBACK_BG }}
      >
        {showWarpShader ? (
          <DownloadWarpShader
            mountGeneration={recoverEpoch}
            onError={attemptShaderRecover}
            onRecover={attemptShaderRecover}
          />
        ) : null}
      </span>
      <span className="relative z-[1] inline-flex items-center gap-1.5">
        <HugeiconsIcon
          icon={Download02Icon}
          size={16}
          color="currentColor"
          strokeWidth={1.8}
        />
        <span className="text-[12px] font-semibold leading-none tracking-tight">Download</span>
      </span>
    </button>
  )
})
