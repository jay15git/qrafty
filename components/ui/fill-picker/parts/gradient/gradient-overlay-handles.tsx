"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { type RadialSizeKeyword } from "../../lib/gradient";
import type { Gradient, GradientStop } from "../../lib/gradient";
import { formatColor } from "../../lib/color";
import { CHECKERBOARD_LG } from "../../lib/constants";
import type { OklchColor } from "../../lib/types";

export const HANDLE_PX = 14;

export interface XY {
  x: number;
  y: number;
}

export type HandleKind =
  | "linear-a"
  | "linear-b"
  | "center"
  | "conic-dial"
  | "radial-edge";

export interface GradientOverlayHandlePositions {
  a: XY;
  b?: XY;
  showConnector: boolean;
}

/**
 * Seed numeric radii from the radial gradient's keyword form (`shape` +
 * `size`) so the edge handle has a sensible starting position before the
 * user has touched it. Returns radii as fractions of the box width/height
 * matching the CSS `<length-percentage>{1,2}` convention.
 */
export function keywordToRadii(
  shape: "circle" | "ellipse",
  size: RadialSizeKeyword,
  center: { x: number; y: number },
  w: number,
  h: number,
): { x: number; y: number } {
  const cx = center.x * w;
  const cy = center.y * h;
  const dxClose = Math.min(cx, w - cx);
  const dxFar = Math.max(cx, w - cx);
  const dyClose = Math.min(cy, h - cy);
  const dyFar = Math.max(cy, h - cy);
  if (shape === "circle") {
    let rPx: number;
    switch (size) {
      case "closest-side":
        rPx = Math.min(dxClose, dyClose);
        break;
      case "closest-corner":
        rPx = Math.hypot(dxClose, dyClose);
        break;
      case "farthest-side":
        rPx = Math.max(dxFar, dyFar);
        break;
      case "farthest-corner":
        rPx = Math.hypot(dxFar, dyFar);
        break;
    }
    return { x: rPx / w, y: rPx / h };
  }
  switch (size) {
    case "closest-side":
      return { x: dxClose / w, y: dyClose / h };
    case "closest-corner":
      return { x: dxClose / w, y: dyClose / h };
    case "farthest-side":
      return { x: dxFar / w, y: dyFar / h };
    case "farthest-corner":
      return { x: dxFar / w, y: dyFar / h };
  }
}

function stopSwatchStyle(color: OklchColor) {
  const css = formatColor(color, "oklch");
  return {
    backgroundImage: `linear-gradient(${css}, ${css}), ${CHECKERBOARD_LG}`,
    backgroundSize: "auto, 6px 6px",
  } as const;
}

interface HandleProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  label: string;
  position: XY;
}

function Handle({ label, position, className, style, ...rest }: HandleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      tabIndex={0}
      style={{
        left: position.x,
        top: position.y,
        width: HANDLE_PX,
        height: HANDLE_PX,
        ...style,
      }}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2 cursor-grab rounded-full",
        "before:absolute before:-inset-1.5 before:content-['']",
        "pointer-events-auto border-2 border-white bg-background shadow-[0_0_0_1px_rgba(0,0,0,0.55),0_2px_6px_rgba(0,0,0,0.35)]",
        "outline-none motion-safe:transition-transform",
        "motion-safe:hover:scale-110 active:cursor-grabbing motion-safe:active:scale-95",
        "focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...rest}
    />
  );
}

export interface GradientOverlayHandlesProps {
  handles: GradientOverlayHandlePositions;
  dims: { w: number; h: number };
  gradient: Gradient;
  stops: GradientStop[];
  beginDrag: (kind: HandleKind) => (
    e: React.PointerEvent<HTMLButtonElement>,
  ) => void;
  onKeyDownLinearEndpoint: (
    which: "linear-a" | "linear-b",
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) => void;
  onKeyDownCenter: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  onKeyDownConicDial: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
  onKeyDownRadii: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}

export function GradientOverlayHandles({
  handles,
  dims,
  gradient,
  stops,
  beginDrag,
  onKeyDownLinearEndpoint,
  onKeyDownCenter,
  onKeyDownConicDial,
  onKeyDownRadii,
}: GradientOverlayHandlesProps) {
  return (
    <>
      {handles.showConnector && handles.b && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0"
          width={dims.w}
          height={dims.h}
        >
          <line
            x1={handles.a.x}
            y1={handles.a.y}
            x2={handles.b.x}
            y2={handles.b.y}
            stroke="white"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            strokeOpacity={0.85}
            style={{
              filter: "drop-shadow(0 0 1px rgba(0,0,0,0.55))",
            }}
          />
        </svg>
      )}

      {gradient.type === "radial" && handles.b && (
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0"
          width={dims.w}
          height={dims.h}
        >
          {(() => {
            const ax = handles.a.x;
            const ay = handles.a.y;
            const rx = Math.abs(handles.b.x - ax);
            const ry = Math.abs(handles.b.y - ay);
            const isCircle = gradient.shape === "circle";
            const stroke = {
              fill: "none",
              stroke: "white",
              strokeWidth: 1.5,
              strokeDasharray: "4 4",
              strokeOpacity: 0.85,
              style: { filter: "drop-shadow(0 0 1px rgba(0,0,0,0.55))" },
            } as const;
            return isCircle ? (
              <circle cx={ax} cy={ay} r={Math.max(rx, ry)} {...stroke} />
            ) : (
              <ellipse cx={ax} cy={ay} rx={rx} ry={ry} {...stroke} />
            );
          })()}
        </svg>
      )}

      {gradient.type === "linear" ? (
        <>
          <Handle
            label={
              gradient.start
                ? `Gradient start, x ${Math.round(gradient.start.x * 100)}%, y ${Math.round(gradient.start.y * 100)}%`
                : "Gradient start"
            }
            position={handles.a}
            onPointerDown={beginDrag("linear-a")}
            onKeyDown={(e) => onKeyDownLinearEndpoint("linear-a", e)}
            {...(gradient.start
              ? {
                  role: "application" as const,
                  "aria-roledescription": "2D pad for gradient endpoint",
                }
              : {
                  role: "slider" as const,
                  "aria-valuemin": 0,
                  "aria-valuemax": 360,
                  "aria-valuenow": Math.round(gradient.angle),
                  "aria-valuetext": `${Math.round(gradient.angle)} degrees`,
                })}
            style={
              stops[0] ? stopSwatchStyle(stops[0].color) : undefined
            }
          />
          {handles.b && (
            <Handle
              label={
                gradient.end
                  ? `Gradient end, x ${Math.round(gradient.end.x * 100)}%, y ${Math.round(gradient.end.y * 100)}%`
                  : "Gradient end"
              }
              position={handles.b}
              onPointerDown={beginDrag("linear-b")}
              onKeyDown={(e) => onKeyDownLinearEndpoint("linear-b", e)}
              {...(gradient.end
                ? {
                    role: "application" as const,
                    "aria-roledescription": "2D pad for gradient endpoint",
                  }
                : {
                    role: "slider" as const,
                    "aria-valuemin": 0,
                    "aria-valuemax": 360,
                    "aria-valuenow": Math.round(gradient.angle),
                    "aria-valuetext": `${Math.round(gradient.angle)} degrees`,
                  })}
              style={(() => {
                const last = stops[stops.length - 1];
                return last ? stopSwatchStyle(last.color) : undefined;
              })()}
            />
          )}
        </>
      ) : (
        <>
          <Handle
            label={`Gradient center, x ${Math.round(gradient.center.x * 100)}%, y ${Math.round(gradient.center.y * 100)}%`}
            position={handles.a}
            onPointerDown={beginDrag("center")}
            onKeyDown={onKeyDownCenter}
            role="application"
            aria-roledescription="2D pad for gradient center"
          />
          {handles.b && gradient.type === "conic" && (
            <Handle
              label="Gradient start angle"
              position={handles.b}
              onPointerDown={beginDrag("conic-dial")}
              onKeyDown={onKeyDownConicDial}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={360}
              aria-valuenow={Math.round(gradient.startAngle)}
              aria-valuetext={`${Math.round(gradient.startAngle)} degrees`}
            />
          )}
          {handles.b && gradient.type === "radial" && (
            <Handle
              label="Gradient radius"
              position={handles.b}
              onPointerDown={beginDrag("radial-edge")}
              onKeyDown={onKeyDownRadii}
              role="slider"
              aria-valuemin={0}
              aria-valuemax={200}
              aria-valuenow={
                gradient.shape === "circle" &&
                gradient.radiusPx !== undefined
                  ? Math.round(gradient.radiusPx)
                  : Math.round(
                      (gradient.radii?.x ??
                        keywordToRadii(
                          gradient.shape,
                          gradient.size,
                          gradient.center,
                          dims.w,
                          dims.h,
                        ).x) * 100,
                    )
              }
              aria-valuetext={
                gradient.shape === "circle" &&
                gradient.radiusPx !== undefined
                  ? `circle radius ${Math.round(gradient.radiusPx)} pixels`
                  : (() => {
                      const r =
                        gradient.radii ??
                        keywordToRadii(
                          gradient.shape,
                          gradient.size,
                          gradient.center,
                          dims.w,
                          dims.h,
                        );
                      return `radius x ${Math.round(r.x * 100)}%, y ${Math.round(r.y * 100)}%`;
                    })()
              }
            />
          )}
        </>
      )}
    </>
  );
}
