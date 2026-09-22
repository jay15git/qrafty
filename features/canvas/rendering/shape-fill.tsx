"use client"

import type { QraftyGradient } from "@/features/qr/model/state"
import {
  getQraftyGradientCenter,
  qraftyRadialCenterAsPercent,
} from "@/features/qr/styles/qrafty-gradient-geometry"
import { getShapeLayerGradientId } from "@/features/canvas/rendering/shape-fill.utils"

export function ShapeFillGradientDefs({
  gradient,
  layerId,
}: {
  gradient: QraftyGradient
  layerId: string
}) {
  const gradientId = getShapeLayerGradientId(layerId)
  const stops = gradient.colorStops.map((colorStop) => (
    <stop
      key={`${colorStop.offset}-${colorStop.color}`}
      offset={`${Math.round(colorStop.offset * 100)}%`}
      stopColor={colorStop.color}
    />
  ))

  if (gradient.type === "radial") {
    const { cx, cy } = qraftyRadialCenterAsPercent(getQraftyGradientCenter(gradient))

    return (
      <radialGradient cx={`${cx}%`} cy={`${cy}%`} id={gradientId} r="50%">
        {stops}
      </radialGradient>
    )
  }

  const rotationDegrees = (gradient.rotation * 180) / Math.PI

  return (
    <linearGradient
      gradientTransform={`rotate(${rotationDegrees} 0.5 0.5)`}
      gradientUnits="objectBoundingBox"
      id={gradientId}
    >
      {stops}
    </linearGradient>
  )
}
