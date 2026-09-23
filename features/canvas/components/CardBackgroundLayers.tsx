"use client"

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { CardBackgroundImageLayer } from "@/features/canvas/components/CardBackgroundImageLayer"
import { DraftingCardPaperShaderLayer } from "@/features/canvas/components/CardPaperShaderLayer"
import type {
  DraftingCardPaperShaderState,
  DraftingCardState,
} from "@/features/canvas/model/card-state"
import { cssFillToBackgroundStyle } from "@/features/canvas/model/css-fill-style"
import { cn } from "@/lib/utils"

const CROSSFADE_MS = 180

type BackgroundMode = "solid" | "paper-shader" | "image" | "image-filter"

type CardBackgroundLayersProps = {
  animateTransitions: boolean
  cardState: DraftingCardState
  imageFilterShader: DraftingCardPaperShaderState
  isImageFilterMode: boolean
  isImageMode: boolean
  isPaperShaderMode: boolean
  layoutHeight: number
  layoutWidth: number
  shaderDisplayHeight: number
  shaderDisplayWidth: number
}

function resolveBackgroundMode(
  isPaperShaderMode: boolean,
  isImageMode: boolean,
  isImageFilterMode: boolean,
): BackgroundMode {
  if (isImageFilterMode) {
    return "image-filter"
  }

  if (isPaperShaderMode) {
    return "paper-shader"
  }

  if (isImageMode) {
    return "image"
  }

  return "solid"
}

type CrossfadeState = {
  mounted: boolean
  opacity: number
  prevActive: boolean
  prevAnimate: boolean
}

function resolveCrossfadeTransition(
  state: CrossfadeState,
  active: boolean,
  animate: boolean,
): CrossfadeState {
  let mounted = state.mounted
  let opacity = state.opacity

  if (active) {
    mounted = true
    if (!animate) {
      opacity = 1
    } else if (active !== state.prevActive) {
      // Start the fade-in from transparent so the CSS transition runs.
      opacity = 0
    }
  } else {
    opacity = 0
    if (!animate) {
      mounted = false
    }
  }

  return { mounted, opacity, prevActive: active, prevAnimate: animate }
}

function CrossfadeShell({
  active,
  animate,
  className,
  children,
}: {
  active: boolean
  animate: boolean
  className?: string
  children: ReactNode
}) {
  const [state, setState] = useState<CrossfadeState>(() => ({
    mounted: active,
    opacity: active ? 1 : 0,
    prevActive: active,
    prevAnimate: animate,
  }))

  // Adjust during render so prop changes settle in one commit; the effect below
  // only owns the async fade-in frame and the delayed unmount timer.
  if (active !== state.prevActive || animate !== state.prevAnimate) {
    setState(resolveCrossfadeTransition(state, active, animate))
  }

  const { mounted, opacity } = state

  useEffect(() => {
    if (active && animate && opacity === 0) {
      const frame = window.requestAnimationFrame(() => {
        setState((current) => ({ ...current, opacity: 1 }))
      })
      return () => window.cancelAnimationFrame(frame)
    }

    if (!active && animate && mounted) {
      const timer = window.setTimeout(() => {
        setState((current) => ({ ...current, mounted: false }))
      }, CROSSFADE_MS)
      return () => window.clearTimeout(timer)
    }
  }, [active, animate, mounted, opacity])

  if (!mounted) {
    return null
  }

  return (
    <div
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        opacity,
        transition: animate ? `opacity ${CROSSFADE_MS}ms ease-out` : undefined,
      }}
    >
      {children}
    </div>
  )
}

function useMountedBackgroundModes(activeMode: BackgroundMode, animate: boolean) {
  const [mountedModes, setMountedModes] = useState<Set<BackgroundMode>>(() => new Set([activeMode]))
  const previousModeRef = useRef(activeMode)

  useEffect(() => {
    if (previousModeRef.current === activeMode) {
      return
    }

    const previousMode = previousModeRef.current
    previousModeRef.current = activeMode
    setMountedModes((current) => new Set([...current, activeMode, previousMode]))

    if (!animate) {
      setMountedModes(new Set([activeMode]))
      return
    }

    const timer = window.setTimeout(() => {
      setMountedModes(new Set([activeMode]))
    }, CROSSFADE_MS)

    return () => window.clearTimeout(timer)
  }, [activeMode, animate])

  return mountedModes
}

export function CardBackgroundLayers({
  animateTransitions,
  cardState,
  imageFilterShader,
  isImageFilterMode,
  isImageMode,
  isPaperShaderMode,
  layoutHeight,
  layoutWidth,
  shaderDisplayHeight,
  shaderDisplayWidth,
}: CardBackgroundLayersProps) {
  const activeMode = resolveBackgroundMode(isPaperShaderMode, isImageMode, isImageFilterMode)
  const mountedModes = useMountedBackgroundModes(activeMode, animateTransitions)
  const fillStyle = cssFillToBackgroundStyle(cardState.fill)
  const zIndexFor = (mode: BackgroundMode) => (activeMode === mode ? "z-[2]" : "z-[1]")

  return (
    <>
      {mountedModes.has("solid") ? (
        <CrossfadeShell
          active={activeMode === "solid"}
          animate={animateTransitions}
          className={zIndexFor("solid")}
        >
          <div
            aria-hidden="true"
            data-slot="desktop-compose-card-fill"
            className="size-full"
            style={{
              ...fillStyle,
              borderRadius: "inherit",
            }}
          />
        </CrossfadeShell>
      ) : null}

      {mountedModes.has("image") && cardState.cardImage.value ? (
        <CrossfadeShell
          active={activeMode === "image"}
          animate={animateTransitions}
          className={zIndexFor("image")}
        >
          <CardBackgroundImageLayer
            fit={cardState.cardImage.fit}
            imageUrl={cardState.cardImage.value}
            opacity={cardState.cardImage.opacity / 100}
            reduceMotion={!animateTransitions}
          />
        </CrossfadeShell>
      ) : null}

      {mountedModes.has("paper-shader") ? (
        <CrossfadeShell
          active={activeMode === "paper-shader"}
          animate={animateTransitions}
          className={zIndexFor("paper-shader")}
        >
          <DraftingCardPaperShaderLayer
            displayHeight={shaderDisplayHeight}
            displayWidth={shaderDisplayWidth}
            layoutHeight={layoutHeight}
            layoutWidth={layoutWidth}
            paperShader={cardState.paperShader}
          />
        </CrossfadeShell>
      ) : null}

      {mountedModes.has("image-filter") ? (
        <CrossfadeShell
          active={activeMode === "image-filter"}
          animate={animateTransitions}
          className={zIndexFor("image-filter")}
        >
          <DraftingCardPaperShaderLayer
            displayHeight={shaderDisplayHeight}
            displayWidth={shaderDisplayWidth}
            layoutHeight={layoutHeight}
            layoutWidth={layoutWidth}
            paperShader={imageFilterShader}
          />
        </CrossfadeShell>
      ) : null}
    </>
  )
}

