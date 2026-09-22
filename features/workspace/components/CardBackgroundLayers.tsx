"use client"

import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { CardBackgroundImageLayer } from "@/features/workspace/components/CardBackgroundImageLayer"
import { DraftingCardPaperShaderLayer } from "@/features/workspace/components/CardPaperShaderLayer"
import type {
  DraftingCardPaperShaderState,
  DraftingCardState,
} from "@/features/workspace/model/card-state"
import { cssFillToBackgroundStyle } from "@/features/workspace/model/css-fill-style"
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
  const [mounted, setMounted] = useState(active)
  const [opacity, setOpacity] = useState(active ? 1 : 0)
  const hasSettledRef = useRef(false)

  useEffect(() => {
    if (!hasSettledRef.current) {
      hasSettledRef.current = true
      setMounted(active)
      setOpacity(active ? 1 : 0)
      return
    }

    if (active) {
      setMounted(true)
      if (!animate) {
        setOpacity(1)
        return
      }

      setOpacity(0)
      const frame = window.requestAnimationFrame(() => setOpacity(1))
      return () => window.cancelAnimationFrame(frame)
    }

    if (!animate) {
      setOpacity(0)
      setMounted(false)
      return
    }

    setOpacity(0)
    const timer = window.setTimeout(() => setMounted(false), CROSSFADE_MS)
    return () => window.clearTimeout(timer)
  }, [active, animate])

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

