import { LandingCardWheel } from "@/features/marketing/landing/landing-card-wheel"
import { LandingHeroText } from "@/features/marketing/landing/landing-hero-text"
import { LandingMeshGradientBackground } from "@/features/marketing/landing/landing-mesh-gradient-background"
import { LandingShaderFadeOverlay } from "@/features/marketing/landing/landing-shader-fade-overlay"

export default function Home() {
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
    </div>
  )
}
