"use client"

import { ChevronRight } from "lucide-react"
import { useLayoutEffect, useRef, type ReactNode } from "react"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SliderComfortable } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"

import "./desktopnew.css"

const panelClass = "w-[300px] shrink-0 bg-card text-card-foreground shadow-none dn-squircle-lg"

export function SettingsPanelShell({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <aside className={cn(panelClass, className)}>
      {children}
    </aside>
  )
}

export function SettingsScroll({ children }: { children: ReactNode }) {
  return (
    <ScrollArea
      className="dn-settings-scroll h-[min(72dvh,40rem)]"
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
}: {
  openSection: string | undefined
  onOpenSectionChange: (value: string) => void
  sections: readonly string[]
  renderSection: (section: string) => ReactNode
}) {
  return (
    <Accordion
      collapsible
      type="single"
      value={openSection}
      onValueChange={onOpenSectionChange}
      className="dn-settings-accordion w-full min-w-0 max-w-full overflow-x-hidden"
    >
      {sections.map((section) => (
        <AccordionItem
          key={section}
          className="dn-settings-accordion-item border-border/60"
          data-focused={openSection === section ? "true" : undefined}
          value={section}
        >
          <AccordionTrigger className="px-4 py-3 text-[13px] font-medium hover:no-underline [&>svg]:size-3.5 [&>svg]:text-muted-foreground">
            {section}
          </AccordionTrigger>
          <AccordionContent className="w-full min-w-0 max-w-full overflow-x-hidden px-2 pt-1">
            <div className="flex w-full flex-col gap-3">{renderSection(section)}</div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

export function SegmentTabs({
  items,
  value,
  onChange,
  className,
}: {
  items: string[]
  value: string
  onChange: (value: string) => void
  className?: string
}) {
  const tablistRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())
  const hasPositionedPill = useRef(false)

  const movePill = (item: string, animate: boolean) => {
    const pill = pillRef.current
    const tab = tabRefs.current.get(item)
    if (!pill || !tab) return

    if (!animate) {
      const previousTransition = pill.style.transition
      pill.style.transition = "none"
      pill.style.transform = `translateX(${tab.offsetLeft}px)`
      pill.style.width = `${tab.offsetWidth}px`
      void pill.offsetWidth
      pill.style.transition = previousTransition
      return
    }

    pill.style.transform = `translateX(${tab.offsetLeft}px)`
    pill.style.width = `${tab.offsetWidth}px`
  }

  useLayoutEffect(() => {
    movePill(value, hasPositionedPill.current)
    hasPositionedPill.current = true
  }, [value])

  useLayoutEffect(() => {
    const tablist = tablistRef.current
    if (!tablist) return

    const observer = new ResizeObserver(() => {
      const activeTab = tablist.querySelector<HTMLButtonElement>('[role="tab"][aria-selected="true"]')
      if (activeTab) movePill(activeTab.textContent ?? "", false)
    })
    observer.observe(tablist)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={tablistRef}
      className={cn(
        "t-tabs flex h-8 w-full max-w-full gap-1 overflow-hidden bg-transparent p-0 dn-squircle-xs",
        className,
      )}
      role="tablist"
    >
      <span ref={pillRef} aria-hidden className="t-tabs-pill dn-squircle-xs" />
      {items.map((item) => {
        const active = value === item
        return (
          <button
            key={item}
            ref={(element) => {
              if (element) tabRefs.current.set(item, element)
              else tabRefs.current.delete(item)
            }}
            className={cn(
              "t-tab dn-segment-tab flex min-w-0 flex-1 items-center justify-center px-2 text-[11px] font-medium dn-squircle-xs",
              active
                ? "text-foreground"
                : "bg-transparent text-muted-foreground hover:text-foreground",
            )}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

export function SettingsColorPopover({
  children,
  color,
  hint = "Color",
  title = "Color",
}: {
  children: ReactNode
  color: string
  hint?: string
  title?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div>
          <ColorRowButton color={color} hint={hint} />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="desktopnew-popover-content w-64 gap-3 p-3 dn-squircle-md"
        side="right"
        sideOffset={10}
      >
        <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
        {children}
      </PopoverContent>
    </Popover>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Label className="mt-1 -mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
      {children}
    </Label>
  )
}

export function SettingsRowPopover({
  hint,
  title,
  trigger,
  children,
  align = "start",
}: {
  hint: string
  title?: string
  trigger: ReactNode
  children: ReactNode
  align?: "start" | "center" | "end"
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className="h-9 w-full justify-between px-3 font-normal dn-squircle-sm"
          type="button"
          variant="secondary"
        >
          <span className="truncate text-[13px] font-medium text-foreground">{trigger}</span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
            {hint}
            <ChevronRight aria-hidden className="size-3" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="desktopnew-popover-content w-56 gap-3 p-3 dn-squircle-md"
        side="right"
        sideOffset={10}
      >
        {title ? (
          <p className="text-[11px] font-medium text-muted-foreground">{title}</p>
        ) : null}
        {children}
      </PopoverContent>
    </Popover>
  )
}

export function OptionGrid({
  columns = 3,
  items,
  onSelect,
  outline,
  animatedOutline,
  selected,
}: {
  columns?: 3 | 4
  items: string[]
  onSelect?: (item: string) => void
  outline?: boolean
  animatedOutline?: boolean
  selected: string
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5",
        columns === 4 ? "grid-cols-4" : "grid-cols-3",
      )}
    >
      {items.map((item) => {
        const isSelected = selected === item
        return (
          <button
            key={item}
            className={cn(
              "flex aspect-square items-center justify-center text-[10px] font-medium transition-colors dn-squircle-xs",
              outline
                ? isSelected
                  ? animatedOutline
                    ? "bg-secondary text-foreground ring-2 ring-foreground ring-offset-2 ring-offset-background transition-shadow"
                    : "bg-secondary text-foreground ring-2 ring-foreground ring-inset"
                  : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground"
                : isSelected
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            )}
            type="button"
            onClick={() => onSelect?.(item)}
          >
            {item}
          </button>
        )
      })}
    </div>
  )
}

export function PresetList({
  items,
  selected,
  onSelect,
}: {
  items: string[]
  selected: string
  onSelect: (item: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      {items.map((item) => (
        <button
          key={item}
          className={cn(
            "h-8 w-full px-2.5 text-left text-[11px] font-medium transition-colors dn-squircle-xs",
            selected === item
              ? "bg-primary text-primary-foreground"
              : "bg-muted/70 text-foreground hover:bg-muted",
          )}
          type="button"
          onClick={() => onSelect(item)}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

export function ColorRowButton({
  color,
  hint,
  onClick,
}: {
  color: string
  hint: string
  onClick?: () => void
}) {
  const hex = color.replace("#", "").toUpperCase()

  return (
    <Button
      className="h-9 w-full justify-between px-3 font-normal dn-squircle-sm"
      type="button"
      variant="secondary"
      onClick={onClick}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden
          className="size-3.5 shrink-0 border border-border/60 dn-squircle-xs"
          style={{ backgroundColor: color }}
        />
        <span className="truncate text-[13px] font-medium tabular-nums">{hex}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
        {hint}
        <ChevronRight aria-hidden className="size-3" />
      </span>
    </Button>
  )
}

export function SettingsInput({ value, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input
      className="h-9 w-full bg-muted/40 text-[13px] dn-squircle-sm"
      readOnly
      value={value}
      {...props}
    />
  )
}

export function SettingsSwitchRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex h-9 items-center justify-between gap-3">
      <span className="text-[13px] text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export function SettingsSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange?: (value: number) => void
}) {
  return (
    <SliderComfortable
      className="w-full dn-squircle-sm"
      formatValue={(v) => String(v)}
      label={label}
      max={100}
      min={0}
      value={value}
      variant="scrubber"
      onChange={(next) => onChange?.(next)}
    />
  )
}

export function SettingsPrimaryButton({
  children,
  onClick,
}: {
  children: ReactNode
  onClick?: () => void
}) {
  return (
    <Button className="h-9 w-full dn-squircle-sm" type="button" onClick={onClick}>
      {children}
    </Button>
  )
}

export function IconGrid({
  items,
  selectedIndex = 0,
  onSelect,
}: {
  items: string[]
  selectedIndex?: number
  onSelect?: (item: string) => void
}) {
  return (
    <div className="grid w-full grid-cols-4 gap-1.5">
      {items.map((icon, index) => (
        <button
          key={icon}
          className={cn(
            "flex h-10 items-center justify-center text-xs font-semibold transition-colors dn-squircle-xs",
            index === selectedIndex
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          )}
          type="button"
          onClick={() => onSelect?.(icon)}
        >
          {icon}
        </button>
      ))}
    </div>
  )
}

export function ColorChips({
  colors,
  selectedIndex = 0,
  labels,
  onSelect,
}: {
  colors: string[]
  selectedIndex?: number
  labels?: string[]
  onSelect?: (label: string) => void
}) {
  return (
    <div className="flex gap-2">
      {colors.map((color, index) => (
        <button
          key={color}
          aria-label={labels?.[index] ?? color}
          className={cn(
            "size-8 border border-border/50 transition-shadow dn-squircle-sm",
            index === selectedIndex && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
          )}
          style={{ backgroundColor: color }}
          type="button"
          onClick={() => onSelect?.(labels?.[index] ?? color)}
        />
      ))}
    </div>
  )
}
