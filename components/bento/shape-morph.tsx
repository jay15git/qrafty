"use client"

import { m, useReducedMotion } from "motion/react"

import { EASE_IN_OUT } from "@/lib/ease"

import { BENTO_SHAPE_MORPH_PATHS } from "./shape-morph-paths"

function buildShapeMorphSequence(paths: readonly string[]) {
  if (paths.length === 0) {
    return []
  }

  return [...paths.flatMap((path) => [path, path]), paths[0]!]
}

function buildMorphMotionKeyframes(shapeCount: number) {
  const step = 360 / shapeCount
  const rotate: number[] = []
  const scale: number[] = []

  for (let index = 0; index < shapeCount; index += 1) {
    const angle = index * step
    rotate.push(angle, angle)
    scale.push(index % 2 === 0 ? 1 : 0.88, index % 2 === 0 ? 1 : 0.88)
  }

  rotate.push(360)
  scale.push(1)

  return { rotate, scale }
}

const SHAPE_MORPH_SEQUENCE = buildShapeMorphSequence(BENTO_SHAPE_MORPH_PATHS)
const SHAPE_MORPH_MOTION = buildMorphMotionKeyframes(BENTO_SHAPE_MORPH_PATHS.length)

export function ShapeMorph({
  color = "#fb7185",
  label = "Shape morph preview",
  size = 132,
  speed = 1.1,
}: {
  color?: string
  label?: string
  size?: number
  speed?: number
}) {
  const reduce = useReducedMotion() ?? false
  const duration = speed * BENTO_SHAPE_MORPH_PATHS.length
  const initialPath = BENTO_SHAPE_MORPH_PATHS[0]
  const sharedTransition = {
    duration,
    ease: EASE_IN_OUT,
    repeat: Infinity,
  } as const

  if (!initialPath) {
    return null
  }

  return (
    <m.svg
      aria-hidden="true"
      height={size}
      role="img"
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
      viewBox="0 0 100 100"
      width={size}
      animate={
        reduce
          ? { opacity: [1, 0.4, 1] }
          : { rotate: SHAPE_MORPH_MOTION.rotate, scale: SHAPE_MORPH_MOTION.scale }
      }
      transition={
        reduce
          ? { duration: 1.4, ease: EASE_IN_OUT, repeat: Infinity }
          : sharedTransition
      }
    >
      <title>{label}</title>
      <m.path
        animate={reduce ? undefined : { d: SHAPE_MORPH_SEQUENCE }}
        d={initialPath}
        fill={color}
        transition={reduce ? undefined : sharedTransition}
      />
    </m.svg>
  )
}
