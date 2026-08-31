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
  useMemo,
} from "react"

import type { DraftingCardPaperShaderState } from "@/features/workspace/model/card-state"
import { getLivePaperShaderRenderOptions } from "@/features/workspace/preview/preview-shader-budget"
import { acquireRunningShaderSlot } from "@/features/workspace/preview/preview-shader-slots"
import { usePreviewRuntime } from "@/features/workspace/preview/preview-context"
import {
  getPaperShaderDefinition,
  paperShaderHasPlayback,
} from "@/features/workspace/rendering/paper-shaders"
import {
  hasValidPaperShaderLayout,
  readPaperShaderFallbackColor,
} from "@/features/workspace/rendering/paper-shader-runtime"
import {
  buildPaperShaderWorldSize,
  hasPaperShaderWebGlSupport,
  usePaperShaderWorldSize,
} from "@qrafty/qr-internal/scene"

type DraftingCardPaperShaderLayerProps = {
  displayHeight?: number
  displayWidth?: number
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
  dataExportShader,
  dataSlot,
  layoutHeight,
  layoutWidth,
  mountGeneration,
  onError,
  onPausedSnapshot,
  onRecover,
  paperShader,
  renderOptions,
  shouldAnimate,
  shouldSnapshotWhenPaused,
  style,
}: DraftingCardPaperShaderRendererProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const definition = getPaperShaderDefinition(paperShader.shaderId)
  const ShaderComponent = definition.component
  const worldSize = usePaperShaderWorldSize(layoutWidth, layoutHeight)
  const isVisible = useShaderVisibility(hostRef)
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
        onPausedSnapshot(dataUrl)
      } catch {
        // Canvas may be tainted or not ready yet.
      }
    })

    return () => {
      cancelAnimationFrame(frame)
    }
  }, [onPausedSnapshot, playbackSpeed, shouldSnapshotWhenPaused])

  if (!shouldAnimate && releaseSlotRef.current === null) {
    // Paused shaders on mobile may be replaced by snapshots in the parent.
  }

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
  displayHeight,
  displayWidth,
  layoutHeight,
  layoutWidth,
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
  const shouldSnapshotWhenPaused = preferLowPowerShaders && isPaused
  const shouldAnimate = !isPaused || !shouldSnapshotWhenPaused
  const renderOptions = useMemo(
    () =>
      getLivePaperShaderRenderOptions({
        displayHeight,
        displayWidth,
        preferLowPower: preferLowPowerShaders,
      }),
    [displayHeight, displayWidth, preferLowPowerShaders],
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
      dataSlot="desktop-compose-card-paper-shader"
      dataExportShader={paperShader.shaderId}
      layoutHeight={layoutHeight}
      layoutWidth={layoutWidth}
      mountGeneration={recoverEpoch}
      onError={onError}
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
  previous.displayHeight === next.displayHeight)
