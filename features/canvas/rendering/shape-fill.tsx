"use client";

import { formatColor } from "@/components/ui/fill-picker/lib/color";
import type { Gradient } from "@/components/ui/fill-picker/lib/gradient";
import { getShapeLayerGradientId } from "@/features/canvas/rendering/layer-fill";

const CSS_TO_SVG_LINEAR_OFFSET_DEG = 90;

export function ShapeFillGradientDefs({
  gradient,
  layerId,
}: {
  gradient: Gradient;
  layerId: string;
}) {
  const gradientId = getShapeLayerGradientId(layerId);
  const stops = [...gradient.stops]
    .sort((a, b) => a.position - b.position)
    .map((stop) => (
      <stop
        key={`${stop.position}-${stop.id ?? ""}`}
        offset={`${Math.round(stop.position * 100)}%`}
        stopColor={formatColor(stop.color, "hex")}
      />
    ));

  if (gradient.type === "radial") {
    return (
      <radialGradient
        cx={`${gradient.center.x * 100}%`}
        cy={`${gradient.center.y * 100}%`}
        id={gradientId}
        r="50%"
      >
        {stops}
      </radialGradient>
    );
  }

  if (gradient.type === "linear") {
    const rotationDegrees = gradient.angle - CSS_TO_SVG_LINEAR_OFFSET_DEG;

    return (
      <linearGradient
        gradientTransform={`rotate(${rotationDegrees} 0.5 0.5)`}
        gradientUnits="objectBoundingBox"
        id={gradientId}
      >
        {stops}
      </linearGradient>
    );
  }

  return null;
}
