"use client"

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react"
import { motion, useAnimationFrame } from "motion/react"

import { useMousePositionRef } from "@/hooks/use-mouse-position-ref"
import {
  buildCursorCastShadowFilterFromOffset,
  computeCursorCastShadowOffset,
} from "@/lib/cursor-cast-shadow"
import { cn } from "@/lib/utils"

interface FloatingContextType {
  registerElement: (id: string, element: HTMLDivElement, depth: number) => void
  unregisterElement: (id: string) => void
  registerWrapper: (id: string, element: HTMLDivElement) => void
  unregisterWrapper: (id: string) => void
  constraintsRef: React.RefObject<HTMLDivElement | null>
  bringToFront: (id: string) => void
  setDraggingElement: (id: string | null) => void
  dragElastic: number
}

const FloatingContext = createContext<FloatingContextType | null>(null)

interface FloatingProps {
  children: ReactNode
  className?: string
  sensitivity?: number
  easingFactor?: number
  dragElastic?: number
  selectedOnTop?: boolean
  cursorCastShadow?: boolean
}

function getVisualElement(element: HTMLDivElement) {
  const image = element.querySelector("img")
  if (image instanceof HTMLElement) {
    return image
  }

  const firstChild = element.firstElementChild
  return firstChild instanceof HTMLElement ? firstChild : null
}

const Floating = ({
  children,
  className,
  sensitivity = 1,
  easingFactor = 0.05,
  dragElastic = 0.5,
  selectedOnTop = true,
  cursorCastShadow = false,
  ...props
}: FloatingProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const elementsMap = useRef(
    new Map<
      string,
      {
        element: HTMLDivElement
        depth: number
        currentPosition: { x: number; y: number }
        currentShadowOffset: { x: number; y: number }
      }
    >(),
  )
  const wrapperMap = useRef(new Map<string, HTMLDivElement>())
  const draggingIdRef = useRef<string | null>(null)
  const maxZIndexRef = useRef(10)
  const mousePositionRef = useMousePositionRef(containerRef)

  useEffect(() => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    mousePositionRef.current = {
      x: rect.width / 2,
      y: rect.height / 2,
    }
  }, [mousePositionRef])

  const registerElement = useCallback(
    (id: string, element: HTMLDivElement, depth: number) => {
      elementsMap.current.set(id, {
        element,
        depth,
        currentPosition: { x: 0, y: 0 },
        currentShadowOffset: { x: 20, y: 32 },
      })
    },
    [],
  )

  const unregisterElement = useCallback((id: string) => {
    elementsMap.current.delete(id)
  }, [])

  const registerWrapper = useCallback((id: string, element: HTMLDivElement) => {
    wrapperMap.current.set(id, element)
  }, [])

  const unregisterWrapper = useCallback((id: string) => {
    wrapperMap.current.delete(id)
  }, [])

  const bringToFront = useCallback(
    (id: string) => {
      if (!selectedOnTop) return

      maxZIndexRef.current += 1
      const wrapper = wrapperMap.current.get(id)
      if (wrapper) {
        wrapper.style.zIndex = String(maxZIndexRef.current)
      }
    },
    [selectedOnTop],
  )

  const setDraggingElement = useCallback((id: string | null) => {
    draggingIdRef.current = id
  }, [])

  useAnimationFrame(() => {
    if (!containerRef.current) return

    const containerRect = containerRef.current.getBoundingClientRect()
    const lightX = mousePositionRef.current.x
    const lightY = mousePositionRef.current.y

    elementsMap.current.forEach((data, id) => {
      const isDragging = draggingIdRef.current === id

      if (!isDragging) {
        const strength = (data.depth * sensitivity) / 20
        const newTargetX = lightX * strength
        const newTargetY = lightY * strength
        const dx = newTargetX - data.currentPosition.x
        const dy = newTargetY - data.currentPosition.y

        data.currentPosition.x += dx * easingFactor
        data.currentPosition.y += dy * easingFactor
        data.element.style.transform = `translate3d(${data.currentPosition.x}px, ${data.currentPosition.y}px, 0)`
      }

      if (!cursorCastShadow) return

      const visualElement = getVisualElement(data.element)
      if (!visualElement) return

      const visualRect = visualElement.getBoundingClientRect()
      const elementCenterX =
        visualRect.left + visualRect.width / 2 - containerRect.left
      const elementCenterY =
        visualRect.top + visualRect.height / 2 - containerRect.top
      const targetShadow = computeCursorCastShadowOffset(
        lightX,
        lightY,
        elementCenterX,
        elementCenterY,
        data.depth,
      )

      data.currentShadowOffset.x +=
        (targetShadow.x - data.currentShadowOffset.x) * easingFactor
      data.currentShadowOffset.y +=
        (targetShadow.y - data.currentShadowOffset.y) * easingFactor

      visualElement.style.filter = buildCursorCastShadowFilterFromOffset(
        data.currentShadowOffset.x,
        data.currentShadowOffset.y,
        data.depth,
      )
    })
  })

  return (
    <FloatingContext.Provider
      value={{
        registerElement,
        unregisterElement,
        registerWrapper,
        unregisterWrapper,
        constraintsRef: containerRef,
        bringToFront,
        setDraggingElement,
        dragElastic,
      }}
    >
      <div
        ref={containerRef}
        className={cn("absolute top-0 left-0 size-full", className)}
        {...props}
      >
        {children}
      </div>
    </FloatingContext.Provider>
  )
}

export default Floating

interface FloatingElementProps {
  children: ReactNode
  className?: string
  depth?: number
  draggable?: boolean
  dragElastic?: number
}

export const FloatingElement = ({
  children,
  className,
  depth = 1,
  draggable = true,
  dragElastic,
}: FloatingElementProps) => {
  const innerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(Math.random().toString(36).substring(7))
  const context = useContext(FloatingContext)

  useEffect(() => {
    if (!innerRef.current || !context) return

    const nonNullDepth = depth ?? 0.01

    context.registerElement(idRef.current, innerRef.current, nonNullDepth)
    return () => context.unregisterElement(idRef.current)
  }, [context, depth])

  useEffect(() => {
    if (!dragRef.current || !context) return

    context.registerWrapper(idRef.current, dragRef.current)
    return () => context.unregisterWrapper(idRef.current)
  }, [context])

  if (!context) {
    return (
      <div className={cn("absolute", className)}>
        {children}
      </div>
    )
  }

  return (
    <motion.div
      ref={dragRef}
      drag={draggable}
      dragConstraints={context.constraintsRef}
      dragMomentum={false}
      dragElastic={dragElastic ?? context.dragElastic}
      dragPropagation={false}
      onDragStart={() => {
        context.bringToFront(idRef.current)
        context.setDraggingElement(idRef.current)
      }}
      onDragEnd={() => {
        context.setDraggingElement(null)
      }}
      whileDrag={{ cursor: "grabbing" }}
      className={cn(
        "absolute will-change-transform",
        draggable && "cursor-grab",
        className,
      )}
    >
      <div ref={innerRef} className="will-change-transform">
        {children}
      </div>
    </motion.div>
  )
}
