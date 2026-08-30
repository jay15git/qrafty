import { LandingCardWheel } from "@/components/landing/landing-card-wheel"
import { LandingFeatureCards } from "@/components/landing/landing-feature-cards"
import { LandingHeroText } from "@/components/landing/landing-hero-text"
import { LandingHorizontalDepthFade } from "@/components/landing/landing-horizontal-depth-fade"
import { LandingMeshGradientBackground } from "@/components/landing/landing-mesh-gradient-background"
import { LandingShaderFadeOverlay } from "@/components/landing/landing-shader-fade-overlay"

export default function LandingPage() {
  return (
    <div className="bg-[#efeeec] text-[#201d1d] antialiased">
      <section className="relative isolate z-10 overflow-hidden bg-[#efeeec]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <LandingMeshGradientBackground />
          <LandingShaderFadeOverlay />
        </div>

        <LandingHeroText />
      </section>

      <LandingCardWheel />

      <LandingFeatureCards />

      <LandingHorizontalDepthFade />
    </div>
  )
}
