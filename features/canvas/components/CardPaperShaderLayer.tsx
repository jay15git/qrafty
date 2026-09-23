"use client"

import {
  Component,
  memo,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useCallback,
  useEffectEvent,
  useMemo,
} from "react"

import type { DraftingCardPaperShaderState } from "@/features/canvas/model/card-state"
import { resolveShaderPlaybackVisible } from "@/features/canvas/components/card-paper-shader.utils"
import {
  getLivePaperShaderRenderOptions,
  getMotionShaderFillRenderOptions,
} from "@/features/canvas/preview/preview-shader-budget"
import { acquireRunningShaderSlot } from "@/features/canvas/preview/preview-shader-slots"
import { usePreviewRuntime } from "@/features/canvas/preview/preview-context"
import {
  getPaperShaderDefinition,
  paperShaderHasPlayback,
} from "@/features/canvas/rendering/paper-shader-definitions"
import {
  DEFAULT_PAPER_SHADER_COMPONENT,
  PAPER_SHADER_COMPONENTS,
} from "@/features/canvas/rendering/paper-shaders"
import {
  hasValidPaperShaderLayout,
  readPaperShaderFallbackColor,
} from "@/features/canvas/rendering/paper-shader-runtime"
import {
  buildPaperShaderWorldSize,
  hasPaperShaderWebGlSupport,
  usePaperShaderWorldSize,
} from "@qrafty/qr-internal/scene"


const MOTION_SHADER_CAPTURE_BOOTSTRAP_FRAMES = 120

type DraftingCardPaperShaderLayerProps = {
  captureFrames?: boolean
  displayHeight?: number
  displayWidth?: number
  ignoreVisibilityGate?: boolean
  layoutHeight?: number
  layoutWidth?: number
  onFrame?: (dataUrl: string, sourceCanvas: HTMLCanvasElement) => boolean | void
  paperShader: DraftingCardPaperShaderState
}

type DraftingCardPaperShaderRendererProps = {
  captureFrames?: boolean
  dataExportShader?: string
  dataSlot: string
  ignoreVisibilityGate?: boolean
  layoutHeight?: number
  layoutWidth?: number
  mountGeneration: number
  onError: () => void
  onFrame?: (dataUrl: string, sourceCanvas: HTMLCanvasElement) => boolean | void
  onPausedSnapshot: (dataUrl: string) => void
  onRecover: () => void
  paperShader: DraftingCardPaperShaderState
  renderOptions?: Record<string, unknown>
  shouldAnimate: boolean
  shouldSnapshotWhenPaused: boolean
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

function getPaperShaderSupportServerSnapshot() {
  return false
}

function PaperShaderFallback({ color }: { color: string }) {
  return (
    <div
      aria-hidden="true"
      data-slot="desktop-compose-card-paper-shader-fallback"
      style={{
        backgroundColor: color,
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
    ...renderOptions,
    ...(worldSize ?? {}),
  }
}

function usePaperShaderContextRecovery(
  hostRef: RefObject<HTMLDivElement | null>,
  onRecover: () => void,
) {
  // react-doctor-disable-next-line react-doctor/effect-needs-cleanup -- returned cleanup owns the listener and observer
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

function useShaderVisibility(hostRef: RefObject<HTMLDivElement | null>) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const host = hostRef.current
    if (!host || typeof IntersectionObserver === "undefined") {
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry?.isIntersecting ?? true)
      },
      { threshold: 0.05 },
    )

    observer.observe(host)

    return () => {
      observer.disconnect()
    }
  }, [hostRef])

  return isVisible
}

function DraftingCardPaperShaderRenderer({
  captureFrames = false,
  dataExportShader,
  dataSlot,
  ignoreVisibilityGate,
  layoutHeight,
  layoutWidth,
  mountGeneration,
  onError,
  onFrame,
  onPausedSnapshot,
  onRecover,
  paperShader,
  renderOptions,
  shouldAnimate,
  shouldSnapshotWhenPaused,
  style,
}: DraftingCardPaperShaderRendererProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const ShaderComponent =
    PAPER_SHADER_COMPONENTS[paperShader.shaderId] ?? DEFAULT_PAPER_SHADER_COMPONENT
  const worldSize = usePaperShaderWorldSize(layoutWidth, layoutHeight)
  const observedVisible = useShaderVisibility(hostRef)
  const isVisible = resolveShaderPlaybackVisible(observedVisible, ignoreVisibilityGate)
  const releaseSlotRef = useRef<(() => void) | null>(null)
  const snapshotCapturedRef = useRef(false)
  const playbackSpeed = shouldAnimate && isVisible ? (paperShader.paused ? 0 : paperShader.speed) : 0
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

  useEffect(() => {
    if (!shouldAnimate) {
      releaseSlotRef.current?.()
      releaseSlotRef.current = null
      return
    }

    const release = acquireRunningShaderSlot()
    releaseSlotRef.current = release

    return () => {
      releaseSlotRef.current?.()
      releaseSlotRef.current = null
    }
  }, [shouldAnimate])

  const emitPausedSnapshot = useEffectEvent(onPausedSnapshot)

  useEffect(() => {
    if (!shouldSnapshotWhenPaused || playbackSpeed !== 0 || snapshotCapturedRef.current) {
      return
    }

    const host = hostRef.current
    if (!host) {
      return
    }

    const frame = requestAnimationFrame(() => {
      const canvas = host.querySelector("canvas")
      if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
        return
      }

      try {
        const dataUrl = canvas.toDataURL("image/png")
        snapshotCapturedRef.current = true
        emitPausedSnapshot(dataUrl)
      } catch {
        // Canvas may be tainted or not ready yet.
      }
    })

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [playbackSpeed, shouldSnapshotWhenPaused])

  useEffect(() => {
    if (!onFrame || !shouldAnimate) {
      return
    }

    let active = true
    let frameId = 0
    let frames = 0
    let hasSynced = false

    const tick = () => {
      if (!active) {
        return
      }

      frames += 1
      const host = hostRef.current
      const canvas = host?.querySelector("canvas")

      if (canvas instanceof HTMLCanvasElement) {
        try {
          const dataUrl = canvas.toDataURL("image/png")
          if (onFrame(dataUrl, canvas) === true) {
            hasSynced = true
          }
        } catch {
          // Canvas may be tainted or not ready yet.
        }
      }

      const keepPolling =
        playbackSpeed > 0 ||
        (captureFrames && !hasSynced && frames < MOTION_SHADER_CAPTURE_BOOTSTRAP_FRAMES)

      if (keepPolling) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)

    return () => {
      active = false
      cancelAnimationFrame(frameId)
    }
  }, [
    captureFrames,
    mountGeneration,
    onFrame,
    paperShader.shaderId,
    playbackSpeed,
    shouldAnimate,
  ])

  return (
    <PaperShaderErrorBoundary
      key={`${paperShader.shaderId}:${mountGeneration}`}
      onError={onError}
    >
      <div
        ref={hostRef}
        data-shader-canvas-host-root=""
        style={style}
      >
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

export const DraftingCardPaperShaderLayer = memo(function DraftingCardPaperShaderLayer({
  captureFrames = false,
  displayHeight,
  displayWidth,
  ignoreVisibilityGate = false,
  layoutHeight,
  layoutWidth,
  onFrame,
  paperShader,
}: DraftingCardPaperShaderLayerProps) {
  const { preferLowPowerShaders } = usePreviewRuntime()
  const canRenderShader = useSyncExternalStore(
    subscribeToPaperShaderSupport,
    hasPaperShaderWebGlSupport,
    getPaperShaderSupportServerSnapshot,
  )
  const shaderMountKey = `${paperShader.shaderId}:${paperShader.presetName}`
  const [shaderErrorId, setShaderErrorId] = useState<string | null>(null)
  const [recoverEpoch, setRecoverEpoch] = useState(0)
  const [pausedSnapshotUrl, setPausedSnapshotUrl] = useState<string | null>(null)
  const [prevShaderMountKey, setPrevShaderMountKey] = useState(shaderMountKey)
  if (shaderMountKey !== prevShaderMountKey) {
    setPrevShaderMountKey(shaderMountKey)
    setShaderErrorId(null)
    setRecoverEpoch(0)
    setPausedSnapshotUrl(null)
  }
  const hasLayout = hasValidPaperShaderLayout(layoutWidth, layoutHeight)
  const hasShaderError = shaderErrorId === paperShader.shaderId
  const fallbackColor = readPaperShaderFallbackColor(paperShader)
  const hasPlayback = paperShaderHasPlayback(paperShader.shaderId)
  const isPaused =
    hasPlayback && (paperShader.paused || paperShader.speed === 0)
  const shouldSnapshotWhenPaused = preferLowPowerShaders && isPaused && !onFrame
  const shouldAnimate = onFrame ? true : !isPaused || !shouldSnapshotWhenPaused
  const renderOptions = useMemo(
    () =>
      captureFrames
        ? getMotionShaderFillRenderOptions({
            displayHeight,
            displayWidth,
          })
        : getLivePaperShaderRenderOptions({
            displayHeight,
            displayWidth,
            preferLowPower: preferLowPowerShaders,
          }),
    [captureFrames, displayHeight, displayWidth, preferLowPowerShaders],
  )
  const onError = useCallback(() => {
    setShaderErrorId(paperShader.shaderId)
  }, [paperShader.shaderId])
  const onRecover = useCallback(() => {
    setShaderErrorId(null)
    setRecoverEpoch((current) => current + 1)
    setPausedSnapshotUrl(null)
  }, [])

  if (!canRenderShader || !hasLayout || hasShaderError) {
    return <PaperShaderFallback color={fallbackColor} />
  }

  if (pausedSnapshotUrl && shouldSnapshotWhenPaused) {
    return (
      <div
        aria-hidden="true"
        data-slot="desktop-compose-card-paper-shader-snapshot"
        style={{
          backgroundImage: `url("${pausedSnapshotUrl}")`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
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
      key={`${shaderMountKey}:${recoverEpoch}`}
      captureFrames={captureFrames}
      dataSlot="desktop-compose-card-paper-shader"
      dataExportShader={paperShader.shaderId}
      ignoreVisibilityGate={ignoreVisibilityGate}
      layoutHeight={layoutHeight}
      layoutWidth={layoutWidth}
      mountGeneration={recoverEpoch}
      onError={onError}
      onFrame={onFrame}
      onPausedSnapshot={setPausedSnapshotUrl}
      onRecover={onRecover}
      paperShader={paperShader}
      renderOptions={renderOptions}
      shouldAnimate={shouldAnimate}
      shouldSnapshotWhenPaused={shouldSnapshotWhenPaused}
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
}, (previous, next) =>
  previous.paperShader === next.paperShader &&
  previous.layoutWidth === next.layoutWidth &&
  previous.layoutHeight === next.layoutHeight &&
  previous.displayWidth === next.displayWidth &&
  previous.displayHeight === next.displayHeight &&
  previous.captureFrames === next.captureFrames &&
  previous.ignoreVisibilityGate === next.ignoreVisibilityGate &&
  previous.onFrame === next.onFrame)
