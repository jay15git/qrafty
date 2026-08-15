"use client"

import {
  Component,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useMemo,
} from "react"

import type { DraftingCardPaperShaderState } from "@/features/workspace/model/card-state"
import { getPaperShaderDefinition } from "@/features/workspace/rendering/paper-shaders"
import {
  hasValidPaperShaderLayout,
  readPaperShaderFallbackColor,
} from "@/features/workspace/rendering/paper-shader-runtime"
import {
  LIVE_PAPER_SHADER_RENDER_OPTIONS,
  buildPaperShaderWorldSize,
  usePaperShaderWorldSize,
} from "@new-qr/qr-internal/scene"

type DraftingCardPaperShaderLayerProps = {
  layoutHeight?: number
  layoutWidth?: number
  paperShader: DraftingCardPaperShaderState
}

type DraftingCardPaperShaderRendererProps = {
  dataExportShader?: string
  dataSlot: string
  layoutHeight?: number
  layoutWidth?: number
  mountGeneration: number
  onError: () => void
  onRecover: () => void
  paperShader: DraftingCardPaperShaderState
  renderOptions?: Record<string, unknown>
  style: CSSProperties
}

type PaperShaderErrorBoundaryProps = {
  children: ReactNode
  onError: () => void
}

class PaperShaderErrorBoundary extends Component<
  PaperShaderErrorBoundaryProps,
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
    if (this.state.hasError) {
      return null
    }

    return this.props.children
  }
}

function subscribeToPaperShaderSupport(_onStoreChange: () => void) {
  return () => {}
}

function getPaperShaderSupportSnapshot() {
  return hasDraftingPaperShaderWebGlSupport()
}

function getPaperShaderSupportServerSnapshot() {
  return false
}

function hasDraftingPaperShaderWebGlSupport() {
  if (typeof document === "undefined") return false
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

function buildDraftingPaperShaderRenderProps(
  paperShader: DraftingCardPaperShaderState,
  playbackSpeed: number,
  renderOptions?: Record<string, unknown>,
  worldSize?: ReturnType<typeof buildPaperShaderWorldSize>,
) {
  const definition = getPaperShaderDefinition(paperShader.shaderId)

  return {
    ...paperShader.params,
    frame: paperShader.frame,
    ...(definition.requiresImage && paperShader.image.value
      ? { image: paperShader.image.value }
      : {}),
    speed: playbackSpeed,
    ...definition.renderOptions,
    ...LIVE_PAPER_SHADER_RENDER_OPTIONS,
    ...renderOptions,
    ...(worldSize ?? {}),
  }
}

function usePaperShaderContextRecovery(
  hostRef: RefObject<HTMLDivElement | null>,
  onRecover: () => void,
) {
  // eslint-disable-next-line react-doctor/effect-needs-cleanup -- observer/listener cleanup in return
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

function DraftingCardPaperShaderRenderer({
  dataExportShader,
  dataSlot,
  layoutHeight,
  layoutWidth,
  mountGeneration,
  onError,
  onRecover,
  paperShader,
  renderOptions,
  style,
}: DraftingCardPaperShaderRendererProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const definition = getPaperShaderDefinition(paperShader.shaderId)
  const ShaderComponent = definition.component
  const worldSize = usePaperShaderWorldSize(layoutWidth, layoutHeight)
  const playbackSpeed = paperShader.paused ? 0 : paperShader.speed
  const shaderProps = useMemo(
    () =>
      buildDraftingPaperShaderRenderProps(
        paperShader,
        playbackSpeed,
        renderOptions,
        worldSize,
      ),
    [paperShader, playbackSpeed, renderOptions, worldSize],
  )

  usePaperShaderContextRecovery(hostRef, onRecover)

  return (
    <PaperShaderErrorBoundary
      key={`${paperShader.shaderId}:${mountGeneration}`}
      onError={onError}
    >
      <div ref={hostRef} data-shader-canvas-host-root="" style={style}>
        <ShaderComponent
          {...shaderProps}
          aria-hidden="true"
          data-export-shader={dataExportShader ?? paperShader.shaderId}
          data-slot={dataSlot}
          data-shader-canvas-host
          style={{
            borderRadius: "inherit",
            height: "100%",
            width: "100%",
          }}
        />
      </div>
    </PaperShaderErrorBoundary>
  )
}

export function DraftingCardPaperShaderLayer({
  layoutHeight,
  layoutWidth,
  paperShader,
}: DraftingCardPaperShaderLayerProps) {
  const canRenderShader = useSyncExternalStore(
    subscribeToPaperShaderSupport,
    getPaperShaderSupportSnapshot,
    getPaperShaderSupportServerSnapshot,
  )
  const [mountGeneration, setMountGeneration] = useState(0)
  const [shaderErrorId, setShaderErrorId] = useState<string | null>(null)
  const hasLayout = hasValidPaperShaderLayout(layoutWidth, layoutHeight)
  const hasShaderError = shaderErrorId === paperShader.shaderId
  const fallbackColor = readPaperShaderFallbackColor(paperShader)

  useEffect(() => {
    setShaderErrorId(null)
    setMountGeneration((current) => current + 1)
  }, [paperShader.shaderId, paperShader.presetName])

  if (!canRenderShader || !hasLayout) {
    return null
  }

  if (hasShaderError) {
    return (
      <div
        aria-hidden="true"
        data-slot="desktop-compose-card-paper-shader-fallback"
        style={{
          backgroundColor: fallbackColor,
          borderRadius: "inherit",
          height: "100%",
          inset: 0,
          pointerEvents: "none",
          position: "absolute",
          width: "100%",
          zIndex: 0,
        }}
      />
    )
  }

  return (
    <DraftingCardPaperShaderRenderer
      dataSlot="desktop-compose-card-paper-shader"
      dataExportShader={paperShader.shaderId}
      layoutHeight={layoutHeight}
      layoutWidth={layoutWidth}
      mountGeneration={mountGeneration}
      onError={() => setShaderErrorId(paperShader.shaderId)}
      onRecover={() => {
        setShaderErrorId(null)
        setMountGeneration((current) => current + 1)
      }}
      paperShader={paperShader}
      style={{
        borderRadius: "inherit",
        height: "100%",
        inset: 0,
        pointerEvents: "none",
        position: "absolute",
        width: "100%",
        zIndex: 0,
      }}
    />
  )
}
