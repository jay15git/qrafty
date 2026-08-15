import { forwardRef, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react"

import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"

function getPaneLayerA11yLabel(layer: DraftingCanvasLayer) {
  const name = layer.name?.trim()
  if (name) {
    return `${name} layer`
  }

  switch (layer.kind) {
    case "group":
      return "Layer group"
    case "qr":
      return "QR code layer"
    case "text":
      return "Text layer"
    case "image":
      return "Image layer"
    case "shape":
      return "Shape layer"
    case "shader":
      return "Shader layer"
    default:
      return "Card layer"
  }
}

export function PaneLayerInteractive({
  layer,
  isSelected,
  onActivate,
  className,
  style,
  children,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onContextMenu,
  onDoubleClick,
  ...rest
}: {
  layer: DraftingCanvasLayer
  isSelected: boolean
  onActivate: (additive: boolean) => void
  className?: string
  style?: CSSProperties
  children: ReactNode
  onClick?: (event: MouseEvent<HTMLDivElement>) => void
  onDoubleClick?: (event: MouseEvent<HTMLDivElement>) => void
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void
  onPointerMove?: (event: PointerEvent<HTMLDivElement>) => void
  onPointerUp?: (event: PointerEvent<HTMLDivElement>) => void
  onPointerCancel?: (event: PointerEvent<HTMLDivElement>) => void
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void
} & Record<string, unknown>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onActivate(event.metaKey || event.ctrlKey)
  }

  return (
    <div
      {...rest}
      role="button"
      tabIndex={isSelected ? 0 : -1}
      aria-label={getPaneLayerA11yLabel(layer)}
      aria-pressed={isSelected}
      className={className}
      style={style}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onDoubleClick={onDoubleClick}
      onKeyDown={handleKeyDown}
      onPointerCancel={onPointerCancel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {children}
    </div>
  )
}

export const PaneSurfaceInteractive = forwardRef(function PaneSurfaceInteractive({
  label,
  onActivate,
  className,
  children,
  onClick,
  ...rest
}: {
  label: string
  onActivate: () => void
  className?: string
  children: ReactNode
  onClick?: (event: MouseEvent<HTMLDivElement>) => void
} & Record<string, unknown>, ref: React.Ref<HTMLDivElement>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return
    }

    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    onActivate()
  }

  return (
    <div
      {...rest}
      ref={ref}
      role="group"
      aria-label={label}
      tabIndex={0}
      className={className}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  )
})

export function getPaneLayerA11yProps(options: {
  layer: DraftingCanvasLayer
  isSelected: boolean
  onActivate: (additive: boolean) => void
}) {
  return {
    role: "button" as const,
    tabIndex: options.isSelected ? 0 : -1,
    "aria-label": getPaneLayerA11yLabel(options.layer),
    "aria-pressed": options.isSelected,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      options.onActivate(event.metaKey || event.ctrlKey)
    },
  }
}

export function getPaneSurfaceA11yProps(options: {
  label: string
  onActivate: () => void
}) {
  return {
    role: "group" as const,
    "aria-label": options.label,
    tabIndex: 0,
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.target !== event.currentTarget) {
        return
      }

      if (event.key !== "Enter" && event.key !== " ") {
        return
      }

      event.preventDefault()
      options.onActivate()
    },
  }
}
