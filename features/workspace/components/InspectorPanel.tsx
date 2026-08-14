import { type ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type InspectorPanelProps = {
  children: ReactNode
  className?: string
  dataSlot?: string
  description?: ReactNode
  eyebrow?: string
  title: string
}

export function InspectorPanel({
  children,
  className,
  dataSlot = "drafting-inspector-panel",
  description,
  eyebrow,
  title,
}: InspectorPanelProps) {
  return (
    <section data-slot={dataSlot} className={cn("min-w-0 space-y-3", className)}>
      <div className="min-w-0 px-1">
        {eyebrow ? (
          <p className="ws-type-caption font-bold tracking-[0.04em] text-[var(--ws-ink-subtle)]">
            {eyebrow}
          </p>
        ) : null}
        <div className="mt-0.5 flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="ws-type-section-title truncate font-semibold text-[var(--ws-ink)]">
              {title}
            </h2>
            {description ? (
              <p className="ws-type-caption mt-1 text-[var(--ws-ink-muted)]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="min-w-0 space-y-2.5">{children}</div>
    </section>
  )
}

type DraftingInspectorSectionProps = {
  children: ReactNode
  className?: string
  dataSlot?: string
  description?: ReactNode
  title?: string
}

export function DraftingInspectorSection({
  children,
  className,
  dataSlot = "drafting-inspector-section",
  description,
  title,
}: DraftingInspectorSectionProps) {
  return (
    <section
      data-slot={dataSlot}
      className={cn(
        "min-w-0 rounded-[8px] border border-[var(--ws-line)] bg-[var(--ws-panel-bg)] shadow-[var(--ws-shadow-rest)]",
        className,
      )}
    >
      {title || description ? (
        <div className="min-w-0 border-b border-[var(--ws-line)] px-3 py-2.5">
          {title ? (
            <p className="ws-type-control-label font-semibold text-[var(--ws-ink)]">
              {title}
            </p>
          ) : null}
          {description ? (
            <p className="ws-type-caption mt-1 text-[var(--ws-ink-muted)]">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="min-w-0 space-y-2.5 p-3">{children}</div>
    </section>
  )
}

type DraftingInspectorControlRowProps = {
  children?: ReactNode
  className?: string
  description?: ReactNode
  htmlFor?: string
  label: string
  value?: ReactNode
}

export function DraftingInspectorControlRow({
  children,
  className,
  description,
  htmlFor,
  label,
  value,
}: DraftingInspectorControlRowProps) {
  const labelNode = (
    <span className="ws-type-meta block font-semibold text-[var(--ws-ink)]">
      {label}
    </span>
  )

  return (
    <div
      className={cn(
        "grid min-w-0 grid-cols-[minmax(5.25rem,0.72fr)_minmax(0,1fr)] items-center gap-3 rounded-[6px] px-0 py-1",
        className,
      )}
    >
      <div className="min-w-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="block min-w-0">
            {labelNode}
          </label>
        ) : (
          labelNode
        )}
        {description ? (
          <span className="ws-type-caption mt-0.5 block text-[var(--ws-ink-muted)]">
            {description}
          </span>
        ) : null}
      </div>
      <div className="min-w-0 justify-self-stretch">{value ?? children}</div>
    </div>
  )
}

export function DraftingInspectorValueGrid({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("grid min-w-0 grid-cols-2 gap-2", className)}>{children}</div>
}

export function DraftingInspectorSegmentedControl<TValue extends string>({
  ariaLabel,
  className,
  items,
  onValueChange,
  value,
}: {
  ariaLabel: string
  className?: string
  items: Array<{ icon?: ReactNode; label: string; value: TValue }>
  onValueChange: (value: TValue) => void
  value: TValue
}) {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "grid min-w-0 gap-1 rounded-[8px] border border-[var(--ws-line)] bg-[var(--ws-control-bg)] p-1",
        className,
      )}
      role="radiogroup"
    >
      {items.map((item) => {
        const isSelected = item.value === value

        return (
          <button
            key={item.value}
            aria-checked={isSelected}
            className={cn(
              "ws-type-meta flex min-h-8 min-w-0 items-center justify-center gap-1.5 rounded-[5px] px-2 font-semibold text-[var(--ws-ink-muted)] transition-colors hover:bg-[var(--ws-panel-bg-hover)] hover:text-[var(--ws-ink)]",
              isSelected && "bg-[var(--ws-ink)] text-[var(--ws-ink-inverse)] hover:bg-[var(--ws-ink)] hover:text-[var(--ws-ink-inverse)]",
            )}
            role="radio"
            type="button"
            onClick={() => onValueChange(item.value)}
          >
            {item.icon ? <span className="shrink-0">{item.icon}</span> : null}
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export function DraftingInspectorIconButton({
  ariaLabel,
  children,
  className,
  disabled,
  onClick,
}: {
  ariaLabel: string
  children: ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
}) {
  return (
    <Button
      aria-label={ariaLabel}
      className={cn(
        "size-8 rounded-[6px] border border-transparent bg-[var(--ws-control-bg)] text-[var(--ws-ink-muted)] shadow-none transition-[color,background-color,box-shadow,transform] duration-150 ease-out hover:-translate-y-px hover:bg-[var(--ws-panel-bg-hover)] hover:text-[var(--ws-ink)] hover:shadow-[var(--ws-shadow-hover)] active:translate-y-0 active:bg-[var(--ws-control-bg-active)] disabled:pointer-events-none disabled:opacity-35",
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      size="icon-sm"
      type="button"
      variant="ghost"
    >
      {children}
    </Button>
  )
}
