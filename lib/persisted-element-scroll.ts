"use client"

import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
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
    return dataSlot
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

    const restore = () => {
      const pos =
        (persistKey ? positions.get(persistKey) : null) ?? lastPosRef.current
      if (!pos) {
        return
      }

      writePos(element, pos)
    }

    const save = () => {
      if (!visible) {
        return
      }

      const pos = readPos(element)
      lastPosRef.current = pos
      if (persistKey) {
        positions.set(persistKey, pos)
      }
    }

    restore()
    element.addEventListener("scroll", save, { passive: true })

    let observer: IntersectionObserver | undefined
    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver((entries) => {
        const entry = entries[0]
        if (!entry) {
          return
        }

        visible = isIntersecting(entry)
        if (visible) {
          restore()
        }
      }, { threshold: 0 })
      observer.observe(element)
    }

    return () => {
      save()
      element.removeEventListener("scroll", save)
      observer?.disconnect()
    }
  }, [element, persistKey])
}

export function resetPersistedElementScrollForTests() {
  positions.clear()
}
