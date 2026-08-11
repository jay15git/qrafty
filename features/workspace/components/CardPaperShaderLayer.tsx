"use client"

import { Component, type CSSProperties, type ReactNode, useMemo, useState } from "react"

import type { DraftingCardPaperShaderState } from "@/features/workspace/model/card-state"
import { getPaperShaderDefinition } from "@/features/workspace/rendering/paper-shaders"
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
  onError: () => void
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

export function hasDraftingPaperShaderWebGlSupport() {
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
    // Native Paper RAF: speed 0 stops the loop (perf guide).
    speed: playbackSpeed,
    ...definition.renderOptions,
    ...LIVE_PAPER_SHADER_RENDER_OPTIONS,
    ...renderOptions,
    ...(worldSize ?? {}),
  }
}

export function DraftingCardPaperShaderRenderer({
  dataExportShader,
  dataSlot,
  layoutHeight,
  layoutWidth,
  onError,
  paperShader,
  renderOptions,
  style,
}: DraftingCardPaperShaderRendererProps) {
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

  return (
    <PaperShaderErrorBoundary key={paperShader.shaderId} onError={onError}>
      <div data-shader-canvas-host-root="" style={style}>
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
  const [canRenderShader] = useState(hasDraftingPaperShaderWebGlSupport)
  const [shaderErrorId, setShaderErrorId] = useState<string | null>(null)
  const hasShaderError = shaderErrorId === paperShader.shaderId

  if (!canRenderShader || hasShaderError) {
    return null
  }

  return (
    <DraftingCardPaperShaderRenderer
      dataSlot="dashboard-compose-card-paper-shader"
      dataExportShader={paperShader.shaderId}
      layoutHeight={layoutHeight}
      layoutWidth={layoutWidth}
      onError={() => setShaderErrorId(paperShader.shaderId)}
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
