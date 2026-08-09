"use client"

import { defineSound, ensureReady } from "@web-kits/audio"
import { AnimatePresence, motion } from "motion/react"
import { useRef, useState, type ReactNode } from "react"

import {
  ExpandablePanelShell,
  EXPANDABLE_PANEL_SPRING,
} from "@/components/atomixui/expandable-panel-shell"

const playOpen = defineSound({
  source: { type: "sine", frequency: 440 },
  envelope: { decay: 0.1 },
  gain: 0.15,
})

const playClose = defineSound({
  source: { type: "sine", frequency: 880 },
  envelope: { decay: 0.08 },
  gain: 0.15,
})

const slideStart = defineSound({
  source: { type: "sine", frequency: 400 },
  envelope: { decay: 0.08 },
  gain: 0.08,
})

const slideEnd = defineSound({
  source: { type: "sine", frequency: 600 },
  envelope: { decay: 0.08 },
  gain: 0.08,
})

export type ExpandableTabItem = {
  id: string
  label: string
  icon: ReactNode
}

export type ExpandableTabProps = {
  tabs: ExpandableTabItem[]
  defaultActiveId?: string | null
  panelWidth?: number
  renderPanel: (activeId: string) => ReactNode
}

const NAV_H = 50
const DEFAULT_PANEL_WIDTH = 440

const EASE = { duration: 0.3, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] }

export function ExpandableTab({
  tabs,
  defaultActiveId = null,
  panelWidth = DEFAULT_PANEL_WIDTH,
  renderPanel,
}: ExpandableTabProps) {
  const [activeId, setActiveId] = useState<string | null>(defaultActiveId)
  const [direction, setDirection] = useState(0)
  const prevIdxRef = useRef(0)

  const panelContent = activeId ? renderPanel(activeId) : null
  const isExpanded = activeId !== null

  const handleNavClick = async (id: string) => {
    const newIdx = tabs.findIndex((tab) => tab.id === id)
    if (id === activeId) {
      setActiveId(null)
      await ensureReady()
      playClose()
      return
    }
    if (activeId === null) {
      await ensureReady()
      playOpen()
    } else {
      await ensureReady()
      slideStart()
      setTimeout(() => slideEnd(), 60)
    }
    setDirection(newIdx > prevIdxRef.current ? 1 : -1)
    prevIdxRef.current = newIdx
    setActiveId(id)
  }

  return (
    <div className="flex h-96 items-end justify-center">
      <ExpandablePanelShell
        activeKey={activeId}
        collapsedHeight={NAV_H}
        collapsedWidth={panelWidth}
        direction={direction}
        expanded={isExpanded}
        expandedWidth={panelWidth}
        layout="bottom-nav"
        measureHeight
        measureWidth={panelWidth}
        panel={panelContent}
        data-slot="expandable-tab-shell"
        shellClassName="mx-auto rounded-3xl border border-zinc-200 bg-white shadow-xl shadow-zinc-200/50"
        nav={
          <div className="flex h-9 w-full items-center justify-center gap-1">
            {tabs.map((tab) => {
              const isActive = activeId === tab.id

              return (
                <motion.button
                  key={tab.id}
                  type="button"
                  aria-label={`Open ${tab.label}`}
                  aria-pressed={isActive}
                  onClick={() => handleNavClick(tab.id)}
                  className="relative flex h-full items-center justify-center rounded-2xl text-sm font-semibold"
                  animate={{
                    paddingLeft: isActive ? "1rem" : "0.5rem",
                    paddingRight: isActive ? "1rem" : "0.5rem",
                    gap: isActive ? "0.5rem" : "0rem",
                    backgroundColor: isActive ? "rgba(0,0,0,0.05)" : "rgba(0,0,0,0)",
                    color: isActive ? "#18181b" : "#a1a1aa",
                  }}
                  transition={EASE}
                  whileHover={{ color: isActive ? "#18181b" : "#71717a" }}
                >
                  {tab.icon}
                  <AnimatePresence initial={false}>
                    {isActive ? (
                      <motion.span
                        key={tab.id + "-lbl"}
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{
                          opacity: { duration: 0.15, ease: "easeInOut" },
                          width: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
                        }}
                        className="overflow-hidden whitespace-nowrap leading-4 font-semibold tracking-tight"
                      >
                        {tab.label}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </motion.button>
              )
            })}
          </div>
        }
      />
    </div>
  )
}

export { EXPANDABLE_PANEL_SPRING }
