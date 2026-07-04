"use client"

import { useRef } from "react"
import { Outfit } from "next/font/google"

import StickyFooter from "@/components/fancy/blocks/sticky-footer"
import ScrollStand from "@/components/fancy/blocks/scroll-stand"
import ParallaxFloatingDemo from "@/components/fancy/image/parallax-floating-demo"

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-outfit",
})

const HomePage = () => {
  const scrollerRef = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={scrollerRef}
      className={`h-dvh w-full overflow-x-hidden overflow-y-auto ${outfit.variable}`}
    >
      <div className="relative z-10">
        <ParallaxFloatingDemo />
        <ScrollStand scrollerRef={scrollerRef} />
      </div>
      <StickyFooter />
    </div>
  )
}

export default HomePage
