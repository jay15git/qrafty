"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type DesktopInspectorAccordionSection<SectionId extends string> = {
  content: ReactNode
  id: SectionId
  summary?: ReactNode
  title: string
  /** Primary toolbar tool id for section header affordances and tests. */
  toolId?: string
}

type DesktopInspectorAccordionProps<SectionId extends string> = {
  activeSectionId: SectionId
  ariaLabel?: string
  footer?: ReactNode
  onSectionChange: (sectionId: SectionId) => void
  sections: readonly DesktopInspectorAccordionSection<SectionId>[]
}

/**
 * The desktop inspector's only disclosure primitive. It intentionally never
 * collapses the active section: the inspector always has one clear home.
 */
export function DesktopInspectorAccordion<SectionId extends string>({
  activeSectionId,
  ariaLabel = "Desktop settings",
  footer,
  onSectionChange,
  sections,
}: DesktopInspectorAccordionProps<SectionId>) {
  const headerRefs = useRef(new Map<SectionId, HTMLButtonElement>())
  const previousSectionId = useRef<SectionId | null>(null)

  useEffect(() => {
    if (previousSectionId.current && previousSectionId.current !== activeSectionId) {
      const nextHeader = headerRefs.current.get(activeSectionId)
      if (typeof nextHeader?.scrollIntoView === "function") {
        nextHeader.scrollIntoView({ behavior: "smooth", block: "nearest" })
      }
    }
    previousSectionId.current = activeSectionId
  }, [activeSectionId])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav
        aria-label={ariaLabel}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
        data-slot="desktop-inspector-accordion"
      >
        {sections.map((section) => {
          const isOpen = section.id === activeSectionId
          const bodyId = `desktop-inspector-section-${section.id}`
          const headerId = `${bodyId}-header`

          return (
            <section key={section.id} className="border-b border-[var(--desktop-inspector-border)]">
              <button
                ref={(node) => {
                  if (node) {
                    headerRefs.current.set(section.id, node)
                  } else {
                    headerRefs.current.delete(section.id)
                  }
                }}
                aria-controls={bodyId}
                aria-expanded={isOpen}
                aria-label={section.toolId ? `Open ${section.title}` : section.title}
                aria-pressed={isOpen}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left text-[13px] font-medium",
                  "text-[var(--desktop-inspector-fg-primary)] outline-none transition-colors duration-150",
                  "hover:bg-[var(--desktop-inspector-control-hover)] focus-visible:bg-[var(--desktop-inspector-control-hover)] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--desktop-inspector-focus)]",
                  isOpen && "bg-[var(--desktop-inspector-control-hover)]",
                )}
                data-desktop-tool-button={section.toolId ? "true" : undefined}
                data-tool-id={section.toolId}
                id={headerId}
                type="button"
                onClick={() => onSectionChange(section.id)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0">{section.title}</span>
                  {section.summary ? (
                    <span className="min-w-0 truncate text-xs font-normal text-muted-foreground">
                      {section.summary}
                    </span>
                  ) : null}
                </span>
                <ChevronDownIcon
                  aria-hidden="true"
                  className={cn(
                    "size-3.5 shrink-0 text-[var(--desktop-inspector-fg-muted)] transition-transform duration-150 motion-reduce:transition-none",
                    isOpen && "rotate-180",
                  )}
                />
              </button>

              <div
                aria-hidden={!isOpen}
                className={cn(
                  "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "pointer-events-none grid-rows-[0fr] opacity-0",
                )}
                id={bodyId}
                inert={!isOpen}
                role="region"
                aria-labelledby={headerId}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="max-h-[min(52dvh,28rem)] min-h-0 overflow-y-auto overscroll-contain">
                    {section.content}
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </nav>
      {footer ? (
        <div
          className="shrink-0 border-t border-[var(--desktop-inspector-border)]"
          data-slot="desktop-inspector-accordion-footer"
        >
          {footer}
        </div>
      ) : null}
    </div>
  )
}
