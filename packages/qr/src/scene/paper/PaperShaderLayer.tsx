"use client"

import {
  Component,
  type CSSProperties,
  type ReactNode,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react"
import { Dithering } from "@paper-design/shaders-react"
import { buildPaperShaderRenderProps } from "../shaders/build-props"
import { usePaperShaderWorldSize } from "./use-paper-shader-world-size"
import { hasPaperShaderWebGlSupport } from "./paper-shader-webgl"

import type { ScenePaperShaderState } from "../schema"

import { PAPER_SHADER_COMPONENTS_BY_ID } from "./shader-components"

type PaperShaderLayerProps = {
  paperShader: ScenePaperShaderState
  className?: string
  style?: CSSProperties
  fallbackColor?: string
  layoutWidth?: number
  layoutHeight?: number
}

class PaperShaderErrorBoundary extends Component<
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

function subscribeToPaperShaderSupport(_onStoreChange: () => void) {
  return () => {}
}

function getPaperShaderSupportServerSnapshot() {
  return false
}

export function PaperShaderLayer({
  paperShader,
  className,
  style,
  fallbackColor = "#111827",
  layoutWidth,
  layoutHeight,
}: PaperShaderLayerProps) {
  const canRenderShader = useSyncExternalStore(
    subscribeToPaperShaderSupport,
    hasPaperShaderWebGlSupport,
    getPaperShaderSupportServerSnapshot,
  )
  const [hasError, setHasError] = useState(false)
  const ShaderComponent = PAPER_SHADER_COMPONENTS_BY_ID[paperShader.shaderId] ?? Dithering
  const worldSize = usePaperShaderWorldSize(layoutWidth, layoutHeight)
  const shaderProps = useMemo(
    () =>
      buildPaperShaderRenderProps({
        shaderId: paperShader.shaderId,
        params: paperShader.params as Parameters<
          typeof buildPaperShaderRenderProps
        >[0]["params"],
        frame: paperShader.frame,
        speed: paperShader.paused ? 0 : paperShader.speed,
        paused: paperShader.paused,
        image: paperShader.image,
        worldWidth: worldSize?.worldWidth,
        worldHeight: worldSize?.worldHeight,
      }),
    [paperShader, worldSize],
  )

  if (!canRenderShader || hasError) {
    return (
      <div
        aria-hidden="true"
        className={className}
        style={{
          backgroundColor: fallbackColor,
          height: "100%",
          width: "100%",
          ...style,
        }}
      />
    )
  }

  return (
    <PaperShaderErrorBoundary onError={() => setHasError(true)}>
      <div
        className={className}
        data-shader-canvas-host-root=""
        style={{
          height: "100%",
          width: "100%",
          ...style,
        }}
      >
        <ShaderComponent
          {...shaderProps}
          aria-hidden="true"
          data-shader-canvas-host
          style={{
            height: "100%",
            width: "100%",
          }}
        />
      </div>
    </PaperShaderErrorBoundary>
  )
}
