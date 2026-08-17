"use client"

import { ChevronRight, Filter, Search } from "lucide-react"
import { AnimatePresence, m, useReducedMotion } from "motion/react"
import {
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"

import { MotionAccordion } from "@/components/unlumen-ui/motion-faqs-accordion"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ElasticSlider } from "@/components/ui/elastic-slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { ContentTypeGridIcon } from "@/features/qr-code/content/ContentTypeGridIcon"
import {
  getContentTypeLabel,
  PICKER_QR_INPUT_TYPES,
  QR_INPUT_OPTIONS,
  type QrInputType,
} from "@/features/qr-code/content/input-options"
import {
  CONTENT_COLLECTIONS,
  type ContentCollectionId,
} from "@/features/qr-code/content/platform-intents"
import { STATIC_QR_CONTENT_META } from "@/features/qr-code/content/static-payload"
import {
  DesktopNewFillPicker,
} from "@/features/desktop-shell/inspector/desktopnew-fill-picker"
import {
  fillPreviewHex,
  isGradientFill,
} from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import type { Fill } from "@/components/ui/fill-picker-base/public-api"
import { SettingsSectionIconFor } from "@/features/desktop-shell/inspector/settings-section-icons"
import { cn } from "@/lib/utils"

import "./desktopnew.css"

const DN_ROW = "dn-settings-row dn-pressable-press-only dn-squircle-sm"
const DN_HINT = "dn-type-meta"
const DN_LABEL = "dn-type-label"
const DN_VALUE = "dn-type-value"
const DN_SECTION_GAP = "gap-2.5"

function SettingsRowButton({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        DN_ROW,
        "inline-flex w-full items-center justify-between px-3 font-normal",
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

function useDesktopnewTheme() {
  return useContext(DesktopnewThemeContext)
}

function desktopnewPortalClass(theme: "light" | "dark", className?: string) {
  return cn(className, theme === "dark" && "dark")
}

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
  onOpenSectionChange: (value: string | undefined) => void
  sections: readonly string[]
  renderSection: (section: string) => ReactNode
}) {
  const sectionIndex = openSection ? sections.indexOf(openSection) : -1
  const openIndex = sectionIndex >= 0 ? sectionIndex : null

  const items = sections.map((section) => ({
    question: section,
    icon: <SettingsSectionIconFor section={section} />,
    answer: (
      <div className={cn("flex w-full min-w-0 flex-col", DN_SECTION_GAP)}>
        {renderSection(section)}
      </div>
    ),
  }))

  return (
    <MotionAccordion
      className="dn-settings-accordion w-full min-w-0 max-w-full"
      gap={6}
      items={items}
      openIndex={openIndex}
      onOpenIndexChange={(index) => {
        onOpenSectionChange(index === null ? undefined : sections[index])
      }}
    />
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
              "t-tab dn-segment-tab dn-pressable-press-only flex min-w-0 flex-1 items-center justify-center px-2 text-[11px] font-medium dn-squircle-xs",
              active ? "text-[var(--dn-fg)]" : "bg-transparent text-[var(--dn-muted)]",
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

const TAB_PANEL_EASE_ENTER = [0.16, 1, 0.3, 1] as const
const TAB_PANEL_EASE_EXIT = [0.4, 0, 0.2, 1] as const

const settingsTabPanelVariants = {
  initial: { opacity: 0, filter: "blur(6px)" },
  animate: {
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      opacity: { duration: 0.22, ease: TAB_PANEL_EASE_ENTER },
      filter: { duration: 0.22, ease: TAB_PANEL_EASE_ENTER },
    },
  },
  exit: {
    opacity: 0,
    filter: "blur(4px)",
    pointerEvents: "none" as const,
    transition: {
      opacity: { duration: 0.14, ease: TAB_PANEL_EASE_EXIT },
      filter: { duration: 0.14, ease: TAB_PANEL_EASE_EXIT },
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
            "dn-settings-tab-panel flex w-full min-w-0 flex-col gap-2.5",
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

export function SettingsFillPopover({
  value,
  onValueChange,
  hint = "Fill",
  title,
  modulePattern,
  solidOnly = false,
  variant = "row",
  side = "right",
  align = "start",
}: {
  value: string
  onValueChange: (fill: Fill, css: string) => void
  hint?: string
  title?: string
  solidOnly?: boolean
  variant?: "row" | "swatch"
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  modulePattern?: {
    selectedPalette: string[]
    selectedPreset: string | "custom"
    onSelect: (preset: { label: string; colors: string[] } | "custom") => void
  }
}) {
  const theme = useDesktopnewTheme()

  return (
    <Popover>
      <PopoverTrigger asChild>
        {variant === "swatch" ? (
          <FillSwatchButton ariaLabel={hint} fill={value} />
        ) : (
          <div>
            <ColorRowButton fill={value} hint={hint} />
          </div>
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={desktopnewPortalClass(
          theme,
          "desktopnew-fill-popover dn-portal-surface w-[min(100vw-2rem,20rem)] border-0 bg-transparent p-0 shadow-none outline-none",
        )}
        data-theme={theme}
        side={side}
        sideOffset={10}
      >
        {title ? (
          <p className="dn-type-meta mb-2">{title}</p>
        ) : null}
        <DesktopNewFillPicker
          modulePattern={modulePattern}
          solidOnly={solidOnly}
          value={value}
          onValueChange={onValueChange}
        />
      </PopoverContent>
    </Popover>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="dn-type-meta -mb-1.5 mt-1 block tracking-wide">{children}</span>
}

export function SettingsRowPopover({
  hint,
  title,
  trigger,
  children,
  align = "start",
  contentClassName,
  open,
  onOpenChange,
}: {
  hint: string
  title?: string
  trigger: ReactNode
  children: ReactNode
  align?: "start" | "center" | "end"
  contentClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const theme = useDesktopnewTheme()

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <SettingsRowButton>
          <span className={cn("truncate", DN_VALUE)}>{trigger}</span>
          <span className={cn("flex shrink-0 items-center gap-1", DN_HINT)}>
            {hint}
            <ChevronRight aria-hidden className="size-3 opacity-50" />
          </span>
        </SettingsRowButton>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={desktopnewPortalClass(
          theme,
          cn("dn-portal-surface desktopnew-popover-content w-56 gap-3 p-3.5 dn-squircle-md", contentClassName),
        )}
        data-theme={theme}
        side="right"
        sideOffset={10}
      >
        {title ? <p className="dn-popover-heading">{title}</p> : null}
        {children}
      </PopoverContent>
    </Popover>
  )
}

type ContentTypeFilterId = "all" | ContentCollectionId

const CONTENT_TYPE_FILTER_OPTIONS: Array<{ id: ContentTypeFilterId; label: string }> = [
  { id: "all", label: "All" },
  ...CONTENT_COLLECTIONS.map((collection) => ({
    id: collection.id,
    label: collection.label,
  })),
]

export function ContentTypePicker({
  onAfterSelect,
  selected,
  onSelect,
}: {
  onAfterSelect?: () => void
  selected: QrInputType
  onSelect: (type: QrInputType) => void
}) {
  const theme = useDesktopnewTheme()
  const [query, setQuery] = useState("")
  const [filterId, setFilterId] = useState<ContentTypeFilterId>("all")

  const visibleTypes = useMemo(() => {
    const collectionTypes =
      filterId === "all"
        ? PICKER_QR_INPUT_TYPES
        : (CONTENT_COLLECTIONS.find((collection) => collection.id === filterId)?.types ??
          PICKER_QR_INPUT_TYPES)
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return collectionTypes
    }

    return collectionTypes.filter((type) => {
      const option = QR_INPUT_OPTIONS[type]
      const meta = STATIC_QR_CONTENT_META[type]

      return `${option.label} ${meta.title} ${meta.description}`
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [filterId, query])

  const activeFilterLabel =
    CONTENT_TYPE_FILTER_OPTIONS.find((option) => option.id === filterId)?.label ?? "All"

  return (
    <div className="dn-content-type-picker">
      <div className="dn-content-type-picker-toolbar">
        <div className="relative min-w-0 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--dn-popover-muted)]"
          />
          <input
            aria-label="Search content types"
            className="dn-content-type-search-input dn-squircle-xs"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label={`Filter content types (${activeFilterLabel})`}
              className="dn-content-type-filter-trigger dn-pressable-press-only inline-flex size-7 shrink-0 items-center justify-center border border-[var(--dn-popover-border)] bg-[var(--dn-popover-control)] text-[var(--dn-popover-muted)] dn-squircle-xs"
              data-active={filterId !== "all" ? "true" : undefined}
              type="button"
            >
              <Filter aria-hidden className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className={desktopnewPortalClass(
              theme,
              "dn-portal-surface desktopnew-popover-content min-w-36 border p-1 dn-squircle-sm",
            )}
            data-theme={theme}
          >
            {CONTENT_TYPE_FILTER_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.id}
                className={cn(
                  "rounded-[8px] px-2 py-1.5 text-[11px] font-medium",
                  filterId === option.id
                    ? "bg-[var(--dn-popover-tile-hover)] text-[var(--dn-fg)]"
                    : "text-[var(--dn-popover-muted)] focus:bg-[var(--dn-popover-tile-hover)] focus:text-[var(--dn-fg)]",
                )}
                onClick={() => setFilterId(option.id)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="dn-content-type-grid">
        {visibleTypes.map((type) => {
          const option = QR_INPUT_OPTIONS[type]
          const isSelected = selected === type

          return (
            <button
              key={type}
              aria-label={`Use ${option.label} content`}
              aria-pressed={isSelected}
              className={cn(
                "dn-content-type-tile dn-option-tile dn-pressable-pickable dn-squircle-xs",
                isSelected && "dn-content-type-tile--selected",
              )}
              type="button"
              onClick={() => {
                onSelect(type)
                onAfterSelect?.()
              }}
            >
              <ContentTypeGridIcon className="dn-content-type-tile-icon" type={type} />
              <span className="dn-content-type-tile-label">{option.label}</span>
            </button>
          )
        })}
        {visibleTypes.length === 0 ? (
          <p className="dn-content-type-grid-empty">No types found</p>
        ) : null}
      </div>
    </div>
  )
}

export function OptionScrollRow({
  items,
  onSelect,
  selected,
}: {
  items: string[]
  onSelect?: (item: string) => void
  selected: string
}) {
  return (
    <div className="dn-option-scroll-row">
      {items.map((item) => {
        const isSelected = selected === item

        return (
          <button
            key={item}
            aria-pressed={isSelected}
            className="dn-option-tile dn-option-scroll-chip dn-pressable-press-only dn-squircle-xs"
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
              "dn-option-tile flex aspect-square items-center justify-center text-[10px] font-medium tracking-tight dn-squircle-xs",
              outline &&
                isSelected &&
                (animatedOutline
                  ? "ring-2 ring-[var(--dn-fg)] ring-offset-2 ring-offset-[var(--dn-bg)]"
                  : "ring-2 ring-[var(--dn-fg)] ring-inset"),
            )}
            type="button"
            aria-pressed={isSelected}
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
            "dn-preset-item h-8 w-full px-2.5 text-left text-[11px] font-medium tracking-tight dn-squircle-xs",
            selected === item && "text-[var(--dn-fg)]",
          )}
          type="button"
          aria-pressed={selected === item}
          onClick={() => onSelect(item)}
        >
          {item}
        </button>
      ))}
    </div>
  )
}

function FillSwatchButton({
  ariaLabel,
  fill,
}: {
  ariaLabel: string
  fill: string
}) {
  const gradient = isGradientFill(fill)

  return (
    <button
      aria-label={ariaLabel}
      className="relative flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dn-focus,var(--ring))]"
      data-slot="desktop-fill-swatch-trigger"
      type="button"
    >
      <span
        aria-hidden="true"
        className="relative size-6 shrink-0 overflow-hidden rounded-full border-2 border-[color-mix(in_srgb,var(--dn-line)_40%,transparent)] box-border"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "conic-gradient(var(--checker-a, #808080) 0 25%, var(--checker-b, #c0c0c0) 0 50%, var(--checker-a, #808080) 0 75%, var(--checker-b, #c0c0c0) 0)",
            backgroundSize: "8px 8px",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={gradient ? { background: fill } : { backgroundColor: fillPreviewHex(fill) }}
        />
      </span>
    </button>
  )
}

function ColorRowButton({
  fill,
  hint,
  onClick,
}: {
  fill: string
  hint: string
  onClick?: () => void
}) {
  const gradient = isGradientFill(fill)
  const hex = fillPreviewHex(fill).replace("#", "").toUpperCase()

  return (
    <SettingsRowButton onClick={onClick}>
      <span className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden
          className="size-3.5 shrink-0 border border-[color-mix(in_srgb,var(--dn-line)_40%,transparent)] dn-squircle-xs"
          style={gradient ? { background: fill } : { backgroundColor: fillPreviewHex(fill) }}
        />
        <span className={DN_LABEL}>{hint}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <span className={DN_VALUE}>{gradient ? "Gradient" : hex}</span>
        <ChevronRight aria-hidden className={cn("size-3 opacity-50", DN_HINT)} />
      </span>
    </SettingsRowButton>
  )
}

export function SettingsInput({
  value,
  readOnly,
  className,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      className={cn("dn-settings-input w-full dn-squircle-sm", className)}
      readOnly={readOnly}
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
      <span className={DN_LABEL}>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

const SETTINGS_ELASTIC_SLIDER_CLASS =
  "desktop-elastic-slider dn-settings-elastic-slider w-full [--elastic-slider-height:--spacing(9)] [--elastic-slider-radius:12px]"

export function SettingsSlider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
}: {
  label: string
  value: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <ElasticSlider
      animateValue={false}
      aria-label={label}
      className={SETTINGS_ELASTIC_SLIDER_CLASS}
      formatValue={(v) => String(v)}
      label={label}
      max={max}
      min={min}
      scrubSound
      step={step}
      value={value}
      onValueChange={onChange}
    />
  )
}

export function SettingsPrimaryButton({
  children,
  onClick,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <SettingsRowButton
      className="dn-settings-primary dn-pressable-press-only h-9 font-medium tracking-tight"
      type="button"
      onClick={onClick}
      {...props}
    >
      {children}
    </SettingsRowButton>
  )
}
