"use client"

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, m } from "motion/react"

import { cn } from "@/lib/utils"

const PORTAL_EASE = [0.23, 1, 0.32, 1] as const

type SettingsAccordionPopoverContextValue = {
  cardRef: RefObject<HTMLElement | null>
  openKey: string | null
  setOpenKey: (openKey: string | null) => void
}

const SettingsAccordionPopoverContext =
  createContext<SettingsAccordionPopoverContextValue | null>(null)

type AccordionPopoverMetrics = {
  card: DOMRect
  stack: DOMRect
}

export function SettingsAccordionPopoverProvider({
  cardRef,
  children,
}: {
  cardRef: RefObject<HTMLElement | null>
  children: ReactNode
}) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const value = useMemo(
    () => ({ cardRef, openKey, setOpenKey }),
    [cardRef, openKey],
  )

  return (
    <SettingsAccordionPopoverContext.Provider value={value}>
      {children}
    </SettingsAccordionPopoverContext.Provider>
  )
}

export function useSettingsAccordionPopover() {
  return useContext(SettingsAccordionPopoverContext)
}

export function SettingsAccordionPopoverOpenMarker({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const ctx = useSettingsAccordionPopover()

  return (
    <div
      className={className}
      data-popover-open={ctx?.openKey ? "true" : undefined}
    >
      {children}
    </div>
  )
}

function measureAccordionPopoverMetrics(
  stack: HTMLElement,
): AccordionPopoverMetrics | null {
  // The accordion is a single card now — anchor overlays to the stack itself.
  const rect = stack.getBoundingClientRect()
  return { stack: rect, card: rect }
}

function useAccordionPopoverMetrics(
  stackRef: RefObject<HTMLElement | null>,
  enabled: boolean,
) {
  const [metrics, setMetrics] = useState<AccordionPopoverMetrics | null>(null)

  useLayoutEffect(() => {
    const stack = stackRef.current
    if (!enabled || !stack) {
      return
    }

    const update = () => {
      setMetrics(measureAccordionPopoverMetrics(stack))
    }

    update()

    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(stack)

    const card = stack.firstElementChild
    if (card instanceof HTMLElement) {
      resizeObserver.observe(card)
    }

    window.addEventListener("resize", update)
    window.addEventListener("scroll", update, true)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", update)
      window.removeEventListener("scroll", update, true)
    }
  }, [stackRef, enabled])

  return enabled ? metrics : null
}

export function SettingsAccordionPopoverOverlay({
  openKey,
  className,
  children,
  theme,
}: {
  openKey: string
  className?: string
  children: ReactNode
  theme?: "light" | "dark"
}) {
  const ctx = useSettingsAccordionPopover()
  const isOpen = Boolean(ctx && ctx.openKey === openKey)
  const [portalRoot] = useState<HTMLElement | null>(() =>
    typeof document === "undefined" ? null : document.body,
  )
  const metrics = useAccordionPopoverMetrics(
    ctx?.cardRef ?? { current: null },
    isOpen,
  )

  useEffect(() => {
    if (!isOpen || !ctx) {
      return
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        ctx.setOpenKey(null)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [ctx, isOpen])

  if (!ctx || !portalRoot) {
    return null
  }

  const panelLeft = metrics?.card.left ?? 0
  const panelWidth = metrics?.card.width ?? 0
  const panelTop = metrics
    ? metrics.stack.top + metrics.stack.height / 2
    : 0

  return createPortal(
    <AnimatePresence>
      {isOpen && metrics ? (
        <>
          <div
            key={`${openKey}-backdrop`}
            className="dn-accordion-popover-backdrop"
            onPointerDown={() => ctx.setOpenKey(null)}
          />
          <m.div
            key={`${openKey}-surface`}
            animate={{ opacity: 1, scale: 1, y: "-50%" }}
            className="dn-accordion-popover-overlay"
            data-side="top"
            exit={{
              opacity: 0,
              scale: 0.97,
              y: "-50%",
              transition: { duration: 0.12, ease: PORTAL_EASE },
            }}
            initial={{ opacity: 0, scale: 0.96, y: "-50%" }}
            style={{
              top: panelTop,
              left: panelLeft,
              width: panelWidth,
            }}
            transition={{ duration: 0.18, ease: PORTAL_EASE }}
          >
            <div
              className={cn("dn-accordion-popover-panel dn-portal-surface", className)}
              data-side="top"
              data-theme={theme}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {children}
            </div>
          </m.div>
        </>
      ) : null}
    </AnimatePresence>,
    portalRoot,
  )
}
