import type { SceneQrMotionState, SceneQrState } from "../schema"

export type AnimatedQrProps = {
  contents: string
  externalSvg: string
  preset?: string
  hoverEffect?: string
  hoverColorMode?: SceneQrMotionState["hoverColorMode"]
  autoAnimate?: string
  autoAnimateInterval?: number
  speed?: number
  motionIntensity?: SceneQrMotionState["motionIntensity"]
  respectReducedMotion?: boolean
  pressPreset?: string
  width: number
  height: number
  className?: string
}

export function sceneQrToAnimatedQrProps(qr: SceneQrState): AnimatedQrProps {
  return {
    contents: qr.contents,
    externalSvg: qr.externalSvg,
    preset: qr.motion.preset,
    hoverEffect: qr.motion.hoverEffect,
    hoverColorMode: qr.motion.hoverColorMode,
    autoAnimate: qr.motion.autoAnimate,
    autoAnimateInterval: qr.motion.autoAnimateInterval,
    speed: qr.motion.speed,
    motionIntensity: qr.motion.motionIntensity,
    respectReducedMotion: qr.motion.respectReducedMotion,
    pressPreset: qr.motion.pressPreset,
    width: qr.width,
    height: qr.height,
  }
}

export function buildBitjsonElementConfig(props: AnimatedQrProps) {
  return {
    contents: props.contents,
    externalSvg: props.externalSvg,
    animationPreset: props.preset ?? "SpiralBloom",
    animationSpeed: props.speed ?? 1,
    autoAnimate: props.autoAnimate ?? "",
    autoAnimateInterval: props.autoAnimateInterval ?? 5000,
    hoverEffect: props.hoverEffect ?? "",
    hoverColorMode: props.hoverColorMode ?? "both",
    motionIntensity: props.motionIntensity ?? "premium",
    respectReducedMotion: props.respectReducedMotion ?? true,
    pressPreset: props.pressPreset ?? "",
    useExternalSvg: Boolean(props.externalSvg),
  }
}
