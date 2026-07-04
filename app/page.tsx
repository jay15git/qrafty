import StickyFooter from "@/components/fancy/blocks/sticky-footer"
import ParallaxFloatingDemo from "@/components/fancy/image/parallax-floating-demo"

export default function Home() {
  return (
    <div className="h-full w-full overflow-auto bg-[#efefef]">
      <ParallaxFloatingDemo />
      <StickyFooter />
    </div>
  )
}
