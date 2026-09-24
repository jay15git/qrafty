import type { CanvasShapePrimitiveId } from "@/features/canvas/model/element-shapes";
import { cn } from "@/lib/utils";

export function ElementShapePrimitivePreview({
  className,
  shapeId,
}: {
  className?: string;
  shapeId: CanvasShapePrimitiveId;
}) {
  const svgClassName = cn("size-full", className);

  if (shapeId === "line") {
    return (
      <svg aria-hidden="true" className={svgClassName} fill="none" viewBox="0 0 100 100">
        <line
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="8"
          x1="8"
          x2="92"
          y1="50"
          y2="50"
        />
      </svg>
    );
  }

  if (shapeId === "arrow") {
    return (
      <svg aria-hidden="true" className={svgClassName} fill="none" viewBox="0 0 100 100">
        <path
          d="M10 50 H62 M62 50 L44 34 M62 50 L44 66"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="8"
        />
      </svg>
    );
  }

  if (shapeId === "ellipse") {
    return (
      <svg aria-hidden="true" className={svgClassName} fill="none" viewBox="0 0 100 100">
        <ellipse cx="50" cy="50" fill="currentColor" rx="42" ry="42" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className={svgClassName} fill="none" viewBox="0 0 100 100">
      <rect fill="currentColor" height="84" rx="4" ry="4" width="84" x="8" y="8" />
    </svg>
  );
}
