"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"

import "./desktop-inspector-design-system.css"

type DesktopInspectorAccordionSection<SectionId extends string> = {
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
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2"
      >
        <div className="flex flex-col gap-0.5" data-slot="desktop-inspector-accordion">
          {sections.map((section) => {
            const isOpen = section.id === activeSectionId
            const bodyId = `desktop-inspector-section-${section.id}`
            const headerId = `${bodyId}-header`

            return (
              <section
                key={section.id}
                data-open={isOpen ? "true" : "false"}
                data-slot="desktop-inspector-accordion-section"
              >
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
                  className="focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--desktop-inspector-focus)]"
                  data-desktop-tool-button={section.toolId ? "true" : undefined}
                  data-slot="desktop-inspector-accordion-header"
                  data-tool-id={section.toolId}
                  id={headerId}
                  type="button"
                  onClick={() => onSectionChange(section.id)}
                >
                  <span className="shrink-0">{section.title}</span>
                  <span className="flex min-w-0 items-center gap-1.5">
                    {section.summary ? (
                      <span className="max-w-[7.5rem]" data-slot="desktop-inspector-accordion-summary">
                        {section.summary}
                      </span>
                    ) : null}
                    <ChevronDownIcon
                      aria-hidden="true"
                      className={cn(
                        "size-3 shrink-0 text-[var(--desktop-inspector-fg-muted)] transition-transform duration-150 motion-reduce:transition-none",
                        isOpen && "rotate-180",
                      )}
                    />
                  </span>
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
                    <div
                      className="max-h-[min(52dvh,28rem)] min-h-0 overflow-y-auto overscroll-contain"
                      data-slot="desktop-inspector-accordion-body"
                    >
                      {section.content}
                    </div>
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </nav>
      {footer ? (
        <div data-slot="desktop-inspector-accordion-footer">{footer}</div>
      ) : null}
    </div>
  )
}
