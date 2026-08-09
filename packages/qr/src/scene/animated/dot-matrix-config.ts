import type { SceneQrMotionState, SceneQrState } from "../schema"
import { dotMatrixLoaderToPresetName } from "../../dot-matrix/loader-to-preset"

export type AnimatedQrProps = {
  contents: string
  externalSvg: string
  preset?: string
  speed?: number
  dotMatrixOpacityBase?: number
  dotMatrixOpacityMid?: number
  dotMatrixOpacityPeak?: number
  dotMatrixColorBase?: string
  dotMatrixColorMid?: string
  dotMatrixColorPeak?: string
  respectReducedMotion?: boolean
  width: number
  height: number
  className?: string
}

export function sceneQrToAnimatedQrProps(qr: SceneQrState): AnimatedQrProps {
  return {
    contents: qr.contents,
    externalSvg: qr.externalSvg,
    preset: qr.motion.preset,
    speed: qr.motion.speed,
    respectReducedMotion: qr.motion.respectReducedMotion,
    width: qr.width,
    height: qr.height,
  }
}

export function resolveMotionPreset(preset: string | undefined, fallback = "NeonDrift") {
  if (!preset) {
    return fallback
  }

  if (preset.includes("-")) {
    return dotMatrixLoaderToPresetName(preset)
  }

  return preset
}

export function buildAnimatedQrConfig(props: AnimatedQrProps) {
  const preset = resolveMotionPreset(props.preset)
  const speed = props.speed ?? 1

  return {
    contents: props.contents,
    externalSvg: props.externalSvg,
    preset,
    settings: {
      animationSpeed: speed,
      dotMatrixOpacityBase: props.dotMatrixOpacityBase,
      dotMatrixOpacityMid: props.dotMatrixOpacityMid,
      dotMatrixOpacityPeak: props.dotMatrixOpacityPeak,
      dotMatrixColorBase: props.dotMatrixColorBase,
      dotMatrixColorMid: props.dotMatrixColorMid,
      dotMatrixColorPeak: props.dotMatrixColorPeak,
    },
    respectReducedMotion: props.respectReducedMotion ?? true,
    useExternalSvg: Boolean(props.externalSvg),
  }
}

export type { SceneQrMotionState }
