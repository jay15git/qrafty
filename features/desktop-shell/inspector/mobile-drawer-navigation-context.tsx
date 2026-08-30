"use client"

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"

export type MobileDrawerDetailPayload = {
  title: string
  returnView: string
  content: ReactNode
  onAfterClose?: () => void
}

type MobileDrawerNavigationContextValue = {
  detailPayload: MobileDrawerDetailPayload | null
  openDetail: (
    payload: Omit<MobileDrawerDetailPayload, "returnView"> & { returnView?: string },
  ) => void
  closeDetail: () => void
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
  const currentViewRef = useRef(currentView)
  const detailStackRef = useRef<MobileDrawerDetailPayload[]>([])
  const suppressRecoveryRef = useRef(false)
  currentViewRef.current = currentView
  detailStackRef.current = detailStack

  const detailPayload =
    detailStack.length > 0 ? detailStack[detailStack.length - 1] : null

  const openDetail = useCallback(
    (
      payload: Omit<MobileDrawerDetailPayload, "returnView"> & { returnView?: string },
    ) => {
      const resolved: MobileDrawerDetailPayload = {
        ...payload,
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

  return (
    <MobileDrawerNavigationContext.Provider
      value={{ detailPayload, openDetail, closeDetail }}
    >
      {children}
    </MobileDrawerNavigationContext.Provider>
  )
}

export function useMobileDrawerNavigation() {
  return useContext(MobileDrawerNavigationContext)
}
