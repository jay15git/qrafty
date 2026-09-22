import { LANDING_SHADER_FADE_OVERLAY } from "@/features/marketing/landing/landing-shader-config"

export function LandingShaderFadeOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ background: LANDING_SHADER_FADE_OVERLAY }}
    />
  )
}
