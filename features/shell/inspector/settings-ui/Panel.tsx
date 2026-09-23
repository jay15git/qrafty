import { AnimatePresence, m, useReducedMotion } from "motion/react"
import type { ReactNode } from "react"

import { MotionAccordion } from "@/features/shell/components/unlumen-ui/motion-faqs-accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  getSettingsSectionLabel,
  type SettingsSectionId,
} from "@/features/shell/inspector/settings-panel-meta"
import { SettingsSectionIconFor } from "@/features/shell/inspector/SettingsSectionIcons"
import { DN_SECTION_GAP } from "@/features/shell/inspector/settings-ui/Shared"
import { cn } from "@/lib/utils"

export function SettingsPanelShell({
  children,
  className,
  fillHeight = false,
}: {
  children: ReactNode
  className?: string
  fillHeight?: boolean
}) {
  return (
    <aside
      className={cn(
        "dn-settings-panel dn-squircle-lg",
        fillHeight && "flex h-full min-h-0 w-full flex-col",
        className,
      )}
    >
      {children}
    </aside>
  )
}

export function SettingsScroll({
  children,
  fillHeight = false,
}: {
  children: ReactNode
  fillHeight?: boolean
}) {
  return (
    <ScrollArea
      className={cn(
        "dn-settings-scroll",
        fillHeight ? "h-full min-h-0" : "h-[min(72dvh,40rem)]",
      )}
      persistKey="settings-panel"
      viewportClassName="px-0"
    >
      {children}
    </ScrollArea>
  )
}

export function SettingsAccordion({
  openSection,
  onOpenSectionChange,
  sections,
  renderSection,
  header,
  footer,
}: {
  openSection: string | undefined
  onOpenSectionChange: (value: string | undefined) => void
  sections: readonly string[]
  renderSection: (section: string) => ReactNode
  header?: ReactNode
  footer?: ReactNode
}) {
  const sectionIndex = openSection ? sections.indexOf(openSection) : -1
  const openIndex = sectionIndex >= 0 ? sectionIndex : null

  const items = sections.map((section) => ({
    question: getSettingsSectionLabel(section as SettingsSectionId),
    icon: <SettingsSectionIconFor section={section} />,
    answer: (
      <div className={cn("flex w-full min-w-0 flex-col", DN_SECTION_GAP)}>
        {renderSection(section)}
      </div>
    ),
  }))

  return (
    <MotionAccordion
      cardHeight={null}
      className="dn-settings-accordion w-full min-w-0 max-w-full"
      gap={0}
      items={items}
      header={header}
      footer={footer}
      openIndex={openIndex}
      onOpenIndexChange={(index) => {
        onOpenSectionChange(index === null ? undefined : sections[index])
      }}
    />
  )
}

const TAB_PANEL_EASE_ENTER = [0.16, 1, 0.3, 1] as const
const TAB_PANEL_EASE_EXIT = [0.4, 0, 0.2, 1] as const

const settingsTabPanelVariants = {
  initial: { opacity: 0, filter: "blur(3px)" },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      opacity: { duration: 0.3, ease: TAB_PANEL_EASE_ENTER },
      filter: { duration: 0.3, ease: TAB_PANEL_EASE_ENTER },
    },
  },
  exit: {
    opacity: 0,
    filter: "blur(2px)",
    pointerEvents: "none" as const,
    transition: {
      opacity: { duration: 0.2, ease: TAB_PANEL_EASE_EXIT },
      filter: { duration: 0.2, ease: TAB_PANEL_EASE_EXIT },
    },
  },
}

const settingsTabPanelReducedMotionVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.22, ease: TAB_PANEL_EASE_ENTER },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.18, ease: TAB_PANEL_EASE_EXIT },
  },
}

export function SettingsTabPanel({
  activeKey,
  className,
  children,
}: {
  activeKey: string
  className?: string
  children: ReactNode
}) {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative w-full min-w-0 overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        <m.div
          key={activeKey}
          className={cn(
            "dn-settings-tab-panel dn-section-stack flex w-full min-w-0",
            className,
          )}
          variants={
            reduceMotion ? settingsTabPanelReducedMotionVariants : settingsTabPanelVariants
          }
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </m.div>
      </AnimatePresence>
    </div>
  )
}
