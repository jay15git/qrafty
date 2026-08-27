"use client"

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

type ScrollPos = { left: number; top: number }

const positions = new Map<string, ScrollPos>()

const ScrollPersistScopeContext = createContext<string | undefined>(undefined)

export function ScrollPersistScope({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  return createElement(ScrollPersistScopeContext.Provider, { value: id }, children)
}

export function useScrollPersistScope() {
  return useContext(ScrollPersistScopeContext)
}

export function resolveScrollPersistKey({
  persistKey,
  dataSlot,
  scope,
  reactId,
}: {
  persistKey?: string
  dataSlot?: string
  scope?: string
  reactId: string
}): string | undefined {
  if (persistKey) {
    return scope ? `${scope}:${persistKey}` : persistKey
  }

  if (dataSlot) {
    return scope ? `${scope}:${dataSlot}` : dataSlot
  }

  if (scope) {
    return `${scope}:${reactId}`
  }

  return undefined
}

function readPos(element: HTMLElement): ScrollPos {
  return { left: element.scrollLeft, top: element.scrollTop }
}

function writePos(element: HTMLElement, pos: ScrollPos) {
  if (element.scrollLeft !== pos.left) {
    element.scrollLeft = pos.left
  }

  if (element.scrollTop !== pos.top) {
    element.scrollTop = pos.top
  }
}

function isLaidOut(element: HTMLElement) {
  return element.clientWidth > 1 && element.clientHeight > 1
}

function canOverflow(element: HTMLElement) {
  return (
    element.scrollWidth > element.clientWidth + 1 ||
    element.scrollHeight > element.clientHeight + 1
  )
}

function isIntersecting(entry: IntersectionObserverEntry) {
  return (
    entry.isIntersecting &&
    (entry.intersectionRatio > 0 ||
      entry.intersectionRect.width > 0 ||
      entry.intersectionRect.height > 0)
  )
}

const useIsoLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect

export function usePersistedElementScroll(
  element: HTMLElement | null,
  persistKey?: string,
) {
  const lastPosRef = useRef<ScrollPos | null>(
    persistKey ? (positions.get(persistKey) ?? null) : null,
  )

  useIsoLayoutEffect(() => {
    if (!element) {
      return
    }

    if (persistKey) {
      const stored = positions.get(persistKey)
      if (stored) {
        lastPosRef.current = stored
      }
    }

    let visible = true
    let raf = 0

    const restore = () => {
      const pos =
        (persistKey ? positions.get(persistKey) : null) ?? lastPosRef.current
      if (!pos) {
        return
      }

      if (!isLaidOut(element)) {
        return
      }

      if ((pos.left > 0 || pos.top > 0) && !canOverflow(element)) {
        return
      }

      writePos(element, pos)
    }

    const save = () => {
      if (!visible || !isLaidOut(element) || !canOverflow(element)) {
        return
      }

      const pos = readPos(element)
      lastPosRef.current = pos
      if (persistKey) {
        positions.set(persistKey, pos)
      }
    }

    const scheduleRestore = () => {
      restore()
      if (typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(raf)
      }
      if (typeof requestAnimationFrame !== "function") {
        return
      }
      raf = requestAnimationFrame(() => {
        restore()
        raf = requestAnimationFrame(() => restore())
      })
    }

    scheduleRestore()
    element.addEventListener("scroll", save, { passive: true })

    let intersectionObserver: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== "undefined") {
      intersectionObserver = new IntersectionObserver((entries) => {
        const entry = entries[0]
        if (!entry) {
          return
        }

        visible = isIntersecting(entry)
        if (visible) {
          scheduleRestore()
        }
      }, { threshold: 0 })
      intersectionObserver.observe(element)
    }

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        scheduleRestore()
      })
      resizeObserver.observe(element)
      const inner = element.firstElementChild
      if (inner instanceof HTMLElement) {
        resizeObserver.observe(inner)
      }
    }

    return () => {
      save()
      element.removeEventListener("scroll", save)
      intersectionObserver?.disconnect()
      resizeObserver?.disconnect()
      if (typeof cancelAnimationFrame === "function") {
        cancelAnimationFrame(raf)
      }
    }
  }, [element, persistKey])
}

export function usePersistedScrollNode(persistKey?: string) {
  const [node, setNode] = useState<HTMLElement | null>(null)
  const persistScope = useScrollPersistScope()
  const persistReactId = useId()
  usePersistedElementScroll(
    node,
    resolveScrollPersistKey({
      persistKey,
      scope: persistScope,
      reactId: persistReactId,
    }),
  )
  return setNode
}

export function resetPersistedElementScrollForTests() {
  positions.clear()
}
