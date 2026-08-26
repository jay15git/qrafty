"use client"

import {
  createContext,
  useCallback,
  useContext,
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

export function MobileDrawerNavigationProvider({
  children,
  currentView,
  setView,
}: {
  children: ReactNode
  currentView: string
  setView: (view: string) => void
}) {
  const [detailPayload, setDetailPayload] = useState<MobileDrawerDetailPayload | null>(null)
  const currentViewRef = useRef(currentView)
  const detailPayloadRef = useRef<MobileDrawerDetailPayload | null>(null)
  currentViewRef.current = currentView
  detailPayloadRef.current = detailPayload

  const openDetail = useCallback(
    (
      payload: Omit<MobileDrawerDetailPayload, "returnView"> & { returnView?: string },
    ) => {
      const resolved: MobileDrawerDetailPayload = {
        ...payload,
        returnView: payload.returnView ?? currentViewRef.current,
      }
      setDetailPayload(resolved)
      setView("setting-detail")
    },
    [setView],
  )

  const closeDetail = useCallback(() => {
    const current = detailPayloadRef.current
    if (!current) {
      return
    }
    setDetailPayload(null)
    setView(current.returnView)
    current.onAfterClose?.()
  }, [setView])

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
