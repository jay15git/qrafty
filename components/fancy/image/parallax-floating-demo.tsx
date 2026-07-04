"use client"

import { useEffect } from "react"
import { exampleImages } from "@/utils/demo-images"
import { motion, stagger, useAnimate } from "motion/react"

import { Dithering } from "@paper-design/shaders-react"

import Floating, {
  FloatingElement,
} from "@/components/fancy/image/parallax-floating"
import VariableFontCursorProximity from "@/components/fancy/text/variable-font-cursor-proximity"

const floatingImageClass =
  "object-cover hover:scale-105 duration-200 transition-transform"

const Preview = () => {
  const [scope, animate] = useAnimate()

  useEffect(() => {
    animate("img", { opacity: [0, 1] }, { duration: 0.5, delay: stagger(0.15) })
  }, [])

  return (
    <div
      className="relative z-10 flex h-dvh w-dvw items-center justify-center overflow-hidden"
      ref={scope}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 size-full">
        <Dithering
          width="100%"
          height="100%"
          className="size-full"
          colorBack="#e8e8e8"
          colorFront="#0095ff1c"
          shape="swirl"
          type="8x8"
          size={2.4}
          speed={0.42}
          scale={0.72}
        />
      </div>
      <motion.div
        className="z-50 text-center space-y-4 items-center flex flex-col"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.88, delay: 1.5 }}
      >
        <VariableFontCursorProximity
          as="p"
          className="font-caveat text-5xl md:text-7xl z-50 text-black"
          fromFontVariationSettings="'wght' 400"
          toFontVariationSettings="'wght' 700"
          radius={180}
          falloff="gaussian"
          containerRef={scope}
        >
          QRafty
        </VariableFontCursorProximity>
        <p className="mt-8 text-xs z-50 hover:scale-110 transition-transform bg-black text-white rounded-full py-2 w-20 cursor-pointer">
          Download
        </p>
      </motion.div>

      <Floating sensitivity={-1} className="overflow-hidden">
        <FloatingElement depth={0.5} className="top-[8%] left-[11%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={exampleImages[0].url}
            className={`w-16 h-16 md:w-24 md:h-24 ${floatingImageClass}`}
            draggable={false}
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[10%] left-[32%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={exampleImages[1].url}
            className={`w-20 h-20 md:w-28 md:h-28 ${floatingImageClass}`}
            draggable={false}
          />
        </FloatingElement>
        <FloatingElement depth={2} className="top-[2%] left-[53%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={exampleImages[2].url}
            className={`w-28 h-40 md:w-40 md:h-52 ${floatingImageClass}`}
            draggable={false}
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[0%] left-[83%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={exampleImages[3].url}
            className={`w-24 h-24 md:w-32 md:h-32 ${floatingImageClass}`}
            draggable={false}
          />
        </FloatingElement>

        <FloatingElement depth={1} className="top-[40%] left-[2%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={exampleImages[4].url}
            className={`w-28 h-28 md:w-36 md:h-36 ${floatingImageClass}`}
            draggable={false}
          />
        </FloatingElement>
        <FloatingElement depth={2} className="top-[70%] left-[77%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={exampleImages[7].url}
            className={`w-28 h-28 md:w-36 md:h-48 ${floatingImageClass}`}
            draggable={false}
          />
        </FloatingElement>

        <FloatingElement depth={4} className="top-[73%] left-[15%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={exampleImages[5].url}
            className={`w-40 md:w-52 h-full ${floatingImageClass}`}
            draggable={false}
          />
        </FloatingElement>
        <FloatingElement depth={1} className="top-[80%] left-[50%]">
          <motion.img
            initial={{ opacity: 0 }}
            src={exampleImages[6].url}
            className={`w-24 h-24 md:w-32 md:h-32 ${floatingImageClass}`}
            draggable={false}
          />
        </FloatingElement>
      </Floating>
    </div>
  )
}

export default Preview
