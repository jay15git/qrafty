import { forwardRef, type ComponentPropsWithoutRef, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react"

import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { cn } from "@/lib/utils"

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
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void
  onDoubleClick?: (event: MouseEvent<HTMLButtonElement>) => void
  onPointerDown?: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerMove?: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerUp?: (event: PointerEvent<HTMLButtonElement>) => void
  onPointerCancel?: (event: PointerEvent<HTMLButtonElement>) => void
  onContextMenu?: (event: MouseEvent<HTMLButtonElement>) => void
} & Record<string, unknown>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    onActivate(event.metaKey || event.ctrlKey)
  }

  return (
    <button
      {...rest}
      type="button"
      tabIndex={isSelected ? 0 : -1}
      aria-label={getPaneLayerA11yLabel(layer)}
      aria-pressed={isSelected}
      className={cn(
        "block appearance-none select-auto outline-none [text-align:inherit]",
        className,
      )}
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
    </button>
  )
}

type PaneSurfaceInteractiveProps = Omit<
  ComponentPropsWithoutRef<"div">,
  "ref"
> & {
  label: string
  onActivate: () => void
}

export const PaneSurfaceInteractive = forwardRef<
  HTMLDivElement,
  PaneSurfaceInteractiveProps
>(function PaneSurfaceInteractive(
  { label, onActivate, className, children, onClick, ...rest },
  ref,
) {
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

  const handleMouseDown = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button === 0) {
      event.preventDefault()
    }
  }

  return (
    <div
      {...rest}
      ref={ref}
      role="group"
      aria-label={label}
      tabIndex={-1}
      className={cn("outline-none focus:outline-none focus-visible:outline-none", className)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
    >
      {children}
    </div>
  )
})
