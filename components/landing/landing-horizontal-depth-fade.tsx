"use client"

import { HorizontalDepthFade } from "@/components/ui/horizontal-depth-fade"

const images = [
  {
    src: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1040&h=585&q=80",
    alt: "Alpine lake at dusk",
  },
  {
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1040&h=585&q=80",
    alt: "Sunlit mountain valley",
  },
  {
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1040&h=585&q=80",
    alt: "Sun through forest canopy",
  },
  {
    src: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1040&h=585&q=80",
    alt: "Fog over mountain ridge",
  },
  {
    src: "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1040&h=585&q=80",
    alt: "Lake and granite peaks",
  },
  {
    src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1040&h=585&q=80",
    alt: "Green hills after rain",
  },
  {
    src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1040&h=585&q=80",
    alt: "Boat on mountain lake",
  },
  {
    src: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1040&h=585&q=80",
    alt: "Night sky over mountains",
  },
  {
    src: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1040&h=585&q=80",
    alt: "Cabin by alpine lake",
  },
  {
    src: "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1040&h=585&q=80",
    alt: "Waterfall in forest",
  },
  {
    src: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1040&h=585&q=80",
    alt: "Desert canyon at sunset",
  },
  {
    src: "https://images.unsplash.com/photo-1418065460487-3e41b0c7fef4?auto=format&fit=crop&w=1040&h=585&q=80",
    alt: "Fog in pine forest",
  },
]

export function LandingHorizontalDepthFade() {
  return (
    <HorizontalDepthFade
      images={images}
      brightnessBoost={55}
      focusSpread={0.14}
      scaleEffect={0.11}
      scrollLength={360}
      itemWidth={520}
      itemHeight={293}
    />
  )
}
