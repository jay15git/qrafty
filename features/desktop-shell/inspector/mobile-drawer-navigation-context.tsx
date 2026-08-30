"use client"

import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

export type MobileDrawerDetailPayload = {
  id: string
  title: string
  returnView: string
  content?: ReactNode
  onAfterClose?: () => void
}

type MobileDrawerNavigationContextValue = {
  detailPayload: MobileDrawerDetailPayload | null
  detailStack: MobileDrawerDetailPayload[]
  outlets: Record<string, HTMLElement>
  openDetail: (
    payload: Omit<MobileDrawerDetailPayload, "id" | "returnView"> & {
      id?: string
      returnView?: string
    },
  ) => void
  closeDetail: () => void
  registerOutlet: (id: string, node: HTMLElement | null) => void
}

const MobileDrawerNavigationContext =
  createContext<MobileDrawerNavigationContextValue | null>(null)

function resolveReturnView(
  explicitReturnView: string | undefined,
  currentView: string,
  stack: MobileDrawerDetailPayload[],
): string {
  if (explicitReturnView && explicitReturnView !== "setting-detail") {
    return explicitReturnView
  }

  if (stack.length > 0) {
    return stack[0].returnView
  }

  if (currentView !== "setting-detail") {
    return currentView
  }

  return "default"
}

export function MobileDrawerNavigationProvider({
  children,
  currentView,
  setView,
}: {
  children: ReactNode
  currentView: string
  setView: (view: string) => void
}) {
  const [detailStack, setDetailStack] = useState<MobileDrawerDetailPayload[]>([])
  const [outlets, setOutlets] = useState<Record<string, HTMLElement>>({})
  const currentViewRef = useRef(currentView)
  const detailStackRef = useRef<MobileDrawerDetailPayload[]>([])
  const suppressRecoveryRef = useRef(false)
  const detailIdCounterRef = useRef(0)
  currentViewRef.current = currentView
  detailStackRef.current = detailStack

  const detailPayload =
    detailStack.length > 0 ? detailStack[detailStack.length - 1] : null

  const registerOutlet = useCallback((id: string, node: HTMLElement | null) => {
    setOutlets((current) => {
      if (node === null) {
        if (!(id in current)) {
          return current
        }

        const next = { ...current }
        delete next[id]
        return next
      }

      if (current[id] === node) {
        return current
      }

      return { ...current, [id]: node }
    })
  }, [])

  const openDetail = useCallback(
    (
      payload: Omit<MobileDrawerDetailPayload, "id" | "returnView"> & {
        id?: string
        returnView?: string
      },
    ) => {
      const resolved: MobileDrawerDetailPayload = {
        ...payload,
        id: payload.id ?? `mobile-detail-${++detailIdCounterRef.current}`,
        returnView: resolveReturnView(
          payload.returnView,
          currentViewRef.current,
          detailStackRef.current,
        ),
      }
      setDetailStack((current) => [...current, resolved])
      setView("setting-detail")
    },
    [setView],
  )

  const closeDetail = useCallback(() => {
    const stack = detailStackRef.current
    if (stack.length === 0) {
      if (currentViewRef.current === "setting-detail") {
        setView("default")
      }
      return
    }

    const popped = stack[stack.length - 1]
    const nextStack = stack.slice(0, -1)

    suppressRecoveryRef.current = true

    if (nextStack.length > 0) {
      setDetailStack(nextStack)
      setView("setting-detail")
      popped.onAfterClose?.()
      queueMicrotask(() => {
        suppressRecoveryRef.current = false
      })
      return
    }

    const returnView =
      popped.returnView !== "setting-detail" ? popped.returnView : "default"
    setView(returnView)
    setDetailStack(nextStack)
    popped.onAfterClose?.()
    queueMicrotask(() => {
      suppressRecoveryRef.current = false
    })
  }, [setView])

  useLayoutEffect(() => {
    if (suppressRecoveryRef.current) {
      return
    }

    if (currentView === "setting-detail" && detailStack.length === 0) {
      setView("default")
    }
  }, [currentView, detailStack.length, setView])

  const value = useMemo(
    () => ({
      closeDetail,
      detailPayload,
      detailStack,
      openDetail,
      outlets,
      registerOutlet,
    }),
    [closeDetail, detailPayload, detailStack, openDetail, outlets, registerOutlet],
  )

  return (
    <MobileDrawerNavigationContext.Provider value={value}>
      {children}
    </MobileDrawerNavigationContext.Provider>
  )
}

export function useMobileDrawerNavigation() {
  return useContext(MobileDrawerNavigationContext)
}

export function useMobileLiveDetail({
  content,
  enabled,
  onOpenChange,
  title,
}: {
  content: ReactNode
  enabled: boolean
  onOpenChange?: (open: boolean) => void
  title: string
}) {
  const detailId = useId()
  const mobileNav = useMobileDrawerNavigation()
  const outlet = enabled ? (mobileNav?.outlets[detailId] ?? null) : null

  const open = useCallback(() => {
    if (!enabled || !mobileNav) {
      return
    }

    mobileNav.openDetail({
      id: detailId,
      title,
      onAfterClose: () => onOpenChange?.(false),
    })
    onOpenChange?.(true)
  }, [detailId, enabled, mobileNav, onOpenChange, title])

  return {
    open,
    portal: outlet ? createPortal(content, outlet) : null,
  }
}

function MobileDetailOutlet({
  active,
  content,
  id,
}: {
  active: boolean
  content?: ReactNode
  id: string
}) {
  const navigation = useMobileDrawerNavigation()
  const registerOutlet = navigation?.registerOutlet
  const nodeRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const node = nodeRef.current
    if (!registerOutlet || !node) {
      return
    }

    registerOutlet(id, node)
    return () => registerOutlet(id, null)
  }, [id, registerOutlet])

  return (
    <div
      ref={nodeRef}
      aria-hidden={!active}
      className={cn(!active && "pointer-events-none hidden")}
      data-slot="mobile-detail-outlet"
      data-active={active ? "true" : "false"}
      inert={active ? undefined : true}
    >
      {content}
    </div>
  )
}

export function MobileDetailStackOutlets() {
  const navigation = useMobileDrawerNavigation()
  const stack = navigation?.detailStack ?? []

  return (
    <>
      {stack.map((entry, index) => (
        <MobileDetailOutlet
          key={entry.id}
          active={index === stack.length - 1}
          content={entry.content}
          id={entry.id}
        />
      ))}
    </>
  )
}
