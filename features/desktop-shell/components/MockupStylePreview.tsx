"use client"

import type { CSSProperties } from "react"

import type { MockupStylePreset } from "@/features/workspace/model/scene-templates"
import { cn } from "@/lib/utils"

type MockupStylePreviewProps = {
  className?: string
  preset: MockupStylePreset
}

export function MockupStylePreview({ className, preset }: MockupStylePreviewProps) {
  const preview = preset.preview
  const cardFill = preset.cardState.fill ?? "#ffffff"
  const cornerRadius = preset.cardState.cornerRadius ?? 16
  const border = preset.cardState.border
  const shadow = preset.cardState.shadow
  const layerShadows = preset.layerShadows ?? (shadow ? [shadow] : [])

  const boxShadow = layerShadows
    .filter((entry) => entry.visible !== false && (entry.opacity ?? 0) > 0)
    .map((entry) => {
      const opacity = (entry.opacity ?? 100) / 100
      const color = hexToRgba(entry.color ?? "#000000", opacity)
      const inset = entry.inset ? "inset " : ""
      return `${inset}${entry.offsetX ?? 0}px ${entry.offsetY ?? 0}px ${entry.blur ?? 0}px ${entry.spread ?? 0}px ${color}`
    })
    .join(", ")

  const cardStyle: CSSProperties = {
    backgroundColor: cardFill,
    borderRadius: `${Math.max(4, cornerRadius * 0.35)}px`,
    ...(border && border.width > 0
      ? {
          border: `${Math.max(1, border.width)}px solid ${hexToRgba(border.color, (border.opacity ?? 100) / 100)}`,
        }
      : {}),
    ...(boxShadow ? { boxShadow } : {}),
    ...(preview?.backdropBlur ? { backdropFilter: `blur(${preview.backdropBlur}px)` } : {}),
  }

  return (
    <span
      aria-hidden="true"
      className={cn("relative block size-full overflow-hidden rounded-md", className)}
      data-mockup-style-preview={preset.id}
      style={{
        background: preview?.background ?? "linear-gradient(145deg, #3f3f46 0%, #27272a 100%)",
      }}
    >
      {preview?.accentBackground ? (
        <span
          className="pointer-events-none absolute inset-0"
          style={{ background: preview.accentBackground }}
        />
      ) : null}
      {preview?.stackLayers?.map((layer, index) => (
        <span
          key={`${preset.id}-stack-${index}`}
          className="pointer-events-none absolute bg-white"
          style={{
            borderRadius: cardStyle.borderRadius,
            bottom: `${10 + layer.offsetY}px`,
            left: `${10 + layer.offsetX}px`,
            opacity: layer.opacity ?? 0.35,
            right: `${10 - layer.offsetX}px`,
            top: `${10 - layer.offsetY}px`,
          }}
        />
      ))}
      <span
        className="absolute bg-white"
        style={{
          ...cardStyle,
          bottom: 10,
          left: 10,
          position: "absolute",
          right: 10,
          top: 10,
        }}
      />
    </span>
  )
}

function hexToRgba(color: string, opacity: number) {
  const hex = color.trim().replace(/^#/, "")

  if (/^[\da-f]{3}$/i.test(hex)) {
    const [r, g, b] = hex.split("").map((channel) => Number.parseInt(channel + channel, 16))
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  if (/^[\da-f]{6}$/i.test(hex)) {
    const r = Number.parseInt(hex.slice(0, 2), 16)
    const g = Number.parseInt(hex.slice(2, 4), 16)
    const b = Number.parseInt(hex.slice(4, 6), 16)
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  if (color.startsWith("rgba(") || color.startsWith("rgb(")) {
    return color
  }

  return color
}
