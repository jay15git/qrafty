"use client"

import { ChevronRight } from "lucide-react"
import { AnimatePresence, m, useReducedMotion } from "motion/react"
import {
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  cloneElement,
  isValidElement,
  Children,
  type ReactElement,
  type ReactNode,
} from "react"

import { MotionAccordion } from "@/components/unlumen-ui/motion-faqs-accordion"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ElasticSlider } from "@/components/ui/elastic-slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import { ContentTypeGridIcon } from "@/features/qr-code/content/ContentTypeGridIcon"
import {
  normalizeContentTypeForPicker,
  PICKER_QR_INPUT_TYPES,
  QR_INPUT_OPTIONS,
  type QrInputType,
} from "@/features/qr-code/content/input-options"
import {
  DesktopNewFillPicker,
} from "@/features/desktop-shell/inspector/desktopnew-fill-picker"
import {
  fillPreviewHex,
  isGradientFill,
} from "@/features/desktop-shell/inspector/desktopnew-fill-picker.utils"
import { DesktopnewThemeContext } from "@/features/desktop-shell/inspector/desktopnew-theme-context"
import { DESKTOP_INSPECTOR_SECTION_HEADING_CLASS } from "@/features/desktop-shell/components/desktop-inspector-tokens"
import { useMobileInspectorDensity } from "@/features/desktop-shell/inspector/mobile-inspector-density-context"
import {
  useMobileDrawerNavigation,
  useMobileLiveDetail,
} from "@/features/desktop-shell/inspector/mobile-drawer-navigation-context"
import type { Fill } from "@/components/ui/fill-picker-base/public-api"
import {
  getDesktopSettingsSectionLabel,
  type DesktopSettingsSectionId,
} from "@/features/desktop-shell/inspector/desktopnew-settings-panel-meta"
import { SettingsSectionIconFor } from "@/features/desktop-shell/inspector/settings-section-icons"
import { cn } from "@/lib/utils"

import "./desktopnew.css"

const DN_ROW = "dn-settings-row dn-squircle-sm"
const DN_HINT = "dn-type-meta"
const DN_LABEL = "dn-type-label"
const DN_VALUE = "dn-type-value"
const DN_SECTION_GAP = "dn-section-stack"

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

function mapMobileDetailCloseChildren(
  children: ReactNode,
  onClose: () => void,
): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child
    }

    if (typeof child.type === "string") {
      const childProps = child.props as { children?: ReactNode }

      if (childProps.children === undefined) {
        return child
      }

      return cloneElement(
        child,
        undefined,
        mapMobileDetailCloseChildren(childProps.children, onClose),
      )
    }

    const childProps = child.props as {
      onClose?: () => void
      children?: ReactNode
    }

    const patchedProps: {
      onClose?: () => void
      children?: ReactNode
    } = {}

    if (childProps.onClose) {
      patchedProps.onClose = () => {
        childProps.onClose?.()
        onClose()
      }
    }

    if (childProps.children !== undefined) {
      patchedProps.children = mapMobileDetailCloseChildren(
        childProps.children,
        onClose,
      )
    }

    if (Object.keys(patchedProps).length === 0) {
      return child
    }

    return cloneElement(
      child as ReactElement<{
        onClose?: () => void
        children?: ReactNode
      }>,
      patchedProps,
    )
  })
}

function mergeMobileDetailChildClose(
  children: ReactNode,
  onClose: () => void,
): ReactNode {
  return mapMobileDetailCloseChildren(children, onClose)
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
}: {
  openSection: string | undefined
  onOpenSectionChange: (value: string | undefined) => void
  sections: readonly string[]
  renderSection: (section: string) => ReactNode
}) {
  const sectionIndex = openSection ? sections.indexOf(openSection) : -1
  const openIndex = sectionIndex >= 0 ? sectionIndex : null

  const items = sections.map((section) => ({
    question: getDesktopSettingsSectionLabel(section as DesktopSettingsSectionId),
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
      gap={8}
      items={items}
      openIndex={openIndex}
      onOpenIndexChange={(index) => {
        onOpenSectionChange(index === null ? undefined : sections[index])
      }}
    />
  )
}

export type SegmentTabItem = {
  ariaLabel?: string
  icon?: ReactNode
  id: string
  label: string
}

type SegmentTabInput = string | SegmentTabItem

function normalizeSegmentTabItems(items: SegmentTabInput[]): SegmentTabItem[] {
  return items.map((item) =>
    typeof item === "string" ? { id: item, label: item } : item,
  )
}

function resolveActiveSegmentTab(items: SegmentTabItem[], value: string) {
  return items.find((item) => item.id === value || item.label === value)
}

export function SegmentTabs({
  items,
  value,
  onChange,
  className,
  variant = "primary",
  scrollable = false,
  persistKey,
}: {
  items: SegmentTabInput[]
  value: string
  onChange: (value: string) => void
  className?: string
  variant?: "primary" | "muted"
  scrollable?: boolean
  persistKey?: string
}) {
  const tablistRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const tabRefs = useRef(new Map<string, HTMLButtonElement>())
  const activeKeyRef = useRef("")
  const hasPositionedPill = useRef(false)
  const normalizedItems = normalizeSegmentTabItems(items)
  const activeItem = resolveActiveSegmentTab(normalizedItems, value) ?? normalizedItems[0]
  const activeKey = activeItem?.id ?? value

  activeKeyRef.current = activeKey

  const movePill = (key: string, animate: boolean) => {
    const pill = pillRef.current
    const tab = tabRefs.current.get(key)
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
    movePill(activeKey, hasPositionedPill.current)
    hasPositionedPill.current = true
  }, [activeKey])

  useEffect(() => {
    if (!scrollable) return

    const tab = tabRefs.current.get(activeKey)
    if (!tab) return

    const timeout = window.setTimeout(() => {
      tab.scrollIntoView({ block: "nearest", inline: "nearest" })
    }, 220)

    return () => window.clearTimeout(timeout)
  }, [activeKey, scrollable])

  useLayoutEffect(() => {
    const tablist = tablistRef.current
    if (!tablist) return

    const observer = new ResizeObserver(() => {
      movePill(activeKeyRef.current, false)
    })
    observer.observe(tablist)
    return () => observer.disconnect()
  }, [])

  const tablist = (
    <div
      ref={tablistRef}
      className={cn(
        "t-tabs dn-tab-bar flex gap-1 bg-transparent p-0 dn-squircle-xs",
        scrollable
          ? "dn-content-type-tab-bar min-w-max max-w-none"
          : "w-full max-w-full overflow-hidden",
        variant === "muted" && "t-tabs--muted",
        className,
      )}
      role="tablist"
    >
      <span
        ref={pillRef}
        aria-hidden
        className={cn("t-tabs-pill dn-squircle-xs", variant === "muted" && "t-tabs-pill--muted")}
      />
      {normalizedItems.map((item) => {
        const active = item.id === activeKey
        const hasIcon = Boolean(item.icon)

        return (
          <button
            key={item.id}
            ref={(element) => {
              if (element) tabRefs.current.set(item.id, element)
              else tabRefs.current.delete(item.id)
            }}
            aria-label={item.ariaLabel ?? item.label}
            className={cn(
              "t-tab dn-segment-tab dn-pressable-press-only dn-type-chip flex dn-squircle-xs",
              scrollable || hasIcon
                ? "dn-content-type-segment-tab shrink-0 flex-row items-center justify-center gap-1.5 px-2.5"
                : "min-w-0 flex-1 items-center justify-center px-2",
              variant === "muted" && "dn-segment-tab--muted",
              active ? "text-[var(--dn-fg)]" : "bg-transparent text-[var(--dn-muted)]",
            )}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(item.id)}
          >
            {item.icon ? (
              <>
                {item.icon}
                <span className="dn-content-type-segment-label">{item.label}</span>
              </>
            ) : (
              item.label
            )}
          </button>
        )
      })}
    </div>
  )

  if (scrollable) {
    return (
      <ScrollArea
        className="h-auto w-full min-w-0 max-w-full overflow-hidden"
        chevron={false}
        cueSize="tight"
        orientation="horizontal"
        persistKey={persistKey ?? "segment-tabs"}
        scrollFade
        showScrollbar={false}
        viewportClassName="min-w-0 overscroll-x-contain"
      >
        {tablist}
      </ScrollArea>
    )
  }

  return tablist
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

export function SettingsFillPopover({
  value,
  onValueChange,
  hint = "Fill",
  title,
  modulePattern,
  moduleImage,
  fillPreviewImageUrl,
  solidOnly = false,
  qrGradient = false,
  variant = "row",
  side = "right",
  align = "start",
  collisionPadding,
  triggerClassName,
}: {
  value: string
  onValueChange: (fill: Fill, css: string) => void
  hint?: string
  title?: string
  solidOnly?: boolean
  qrGradient?: boolean
  variant?: "row" | "swatch"
  side?: "top" | "right" | "bottom" | "left"
  align?: "start" | "center" | "end"
  collisionPadding?: number
  triggerClassName?: string
  fillPreviewImageUrl?: string
  modulePattern?: {
    selectedPalette: string[]
    selectedPreset: string | "custom"
    onSelect: (preset: { label: string; colors: string[] } | "custom") => void
    onPaletteColorChange: (index: number, color: string) => void
  }
  moduleImage?: {
    imageUrl: string
    onUpload: (file: File) => void
    onClear: () => void
  }
}) {
  const theme = useDesktopnewTheme()
  const mobileDensity = useMobileInspectorDensity()
  const mobileNav = useMobileDrawerNavigation()

  const pickerBody = (
    <>
      {title ? (
        <p className="dn-type-meta mb-2">{title}</p>
      ) : null}
      <DesktopNewFillPicker
        moduleImage={moduleImage}
        modulePattern={modulePattern}
        qrGradient={qrGradient}
        solidOnly={solidOnly}
        value={value}
        onValueChange={onValueChange}
      />
    </>
  )

  const liveDetail = useMobileLiveDetail({
    content: pickerBody,
    enabled: Boolean(mobileDensity && mobileNav),
    title: title ?? hint,
  })

  if (mobileDensity && mobileNav) {
    if (variant === "swatch") {
      return (
        <>
          <FillSwatchButton
            ariaLabel={hint}
            className={triggerClassName}
            fill={value}
            imageUrl={fillPreviewImageUrl}
            data-vaul-no-drag=""
            onClick={liveDetail.open}
          />
          {liveDetail.portal}
        </>
      )
    }

    return (
      <>
        <ColorRowButton
          fill={value}
          hint={hint}
          imageUrl={fillPreviewImageUrl}
          data-vaul-no-drag=""
          onClick={liveDetail.open}
        />
        {liveDetail.portal}
      </>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {variant === "swatch" ? (
          <FillSwatchButton ariaLabel={hint} className={triggerClassName} fill={value} imageUrl={fillPreviewImageUrl} />
        ) : (
          <ColorRowButton fill={value} hint={hint} imageUrl={fillPreviewImageUrl} />
        )}
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={desktopnewPortalClass(
          theme,
          "desktopnew-fill-popover dn-portal-surface w-[min(100vw-2rem,20rem)] border-0 bg-transparent p-0 shadow-none outline-none",
        )}
        data-mobile-inspector={mobileDensity ? "" : undefined}
        data-theme={theme}
        side={side}
        sideOffset={10}
        collisionPadding={collisionPadding}
      >
        {pickerBody}
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
  leading,
  hideHint = false,
  children,
  align = "start",
  contentClassName,
  open,
  onOpenChange,
}: {
  hint?: string
  title?: string
  trigger: ReactNode
  leading?: ReactNode
  hideHint?: boolean
  children: ReactNode
  align?: "start" | "center" | "end"
  contentClassName?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const theme = useDesktopnewTheme()
  const mobileDensity = useMobileInspectorDensity()
  const mobileNav = useMobileDrawerNavigation()
  const detailTitle =
    title ??
    (typeof trigger === "string" ? trigger : undefined) ??
    hint ??
    "Setting"

  const closeDetail = () => {
    mobileNav?.closeDetail()
    onOpenChange?.(false)
  }

  const liveDetail = useMobileLiveDetail({
    content: (
      <>
        {title ? <p className="dn-popover-heading">{title}</p> : null}
        {mergeMobileDetailChildClose(children, closeDetail)}
      </>
    ),
    enabled: Boolean(mobileDensity && mobileNav),
    onOpenChange,
    title: detailTitle,
  })

  const rowTrigger = (
    <>
      {leading ? (
        <span className="flex min-w-0 items-center gap-2">
          {leading}
          <span className={cn("truncate", DN_LABEL)}>{trigger}</span>
        </span>
      ) : (
        <span className={cn("truncate", DN_VALUE)}>{trigger}</span>
      )}
      {hideHint ? (
        <ChevronRight aria-hidden className={cn("size-3 shrink-0 opacity-50", DN_HINT)} />
      ) : (
        <span className={cn("flex shrink-0 items-center gap-1", DN_HINT)}>
          {hint}
          <ChevronRight aria-hidden className="size-3 opacity-50" />
        </span>
      )}
    </>
  )

  if (mobileDensity && mobileNav) {
    return (
      <>
        <SettingsRowButton data-vaul-no-drag="" type="button" onClick={liveDetail.open}>
          {rowTrigger}
        </SettingsRowButton>
        {liveDetail.portal}
      </>
    )
  }

  return (
    <Popover
      modal={false}
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          onOpenChange?.(true)
        }
      }}
    >
      <PopoverTrigger asChild>
        <SettingsRowButton>
          {rowTrigger}
        </SettingsRowButton>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={desktopnewPortalClass(
          theme,
          cn("dn-portal-surface desktopnew-popover-content w-56 gap-[length:var(--dn-space-stack)] p-[length:var(--dn-row-px)] dn-squircle-md", contentClassName),
        )}
        data-mobile-inspector={mobileDensity ? "" : undefined}
        data-theme={theme}
        side="right"
        sideOffset={10}
        onEscapeKeyDown={() => onOpenChange?.(false)}
        onInteractOutside={() => onOpenChange?.(false)}
        onPointerDownOutside={() => onOpenChange?.(false)}
      >
        {title ? <p className="dn-popover-heading">{title}</p> : null}
        {children}
      </PopoverContent>
    </Popover>
  )
}

export function DesktopInspectorSettingsPopover({
  children,
  contentClassName,
  dataSlot = "desktop-inspector-settings-popover",
  hint,
  hideHint = false,
  leading,
  onOpenChange,
  open,
  title,
  trigger,
}: {
  children: ReactNode
  contentClassName?: string
  dataSlot?: string
  hint?: string
  hideHint?: boolean
  leading?: ReactNode
  onOpenChange?: (open: boolean) => void
  open?: boolean
  title?: string
  trigger: ReactNode
}) {
  const theme = useDesktopnewTheme()
  const mobileDensity = useMobileInspectorDensity()
  const mobileNav = useMobileDrawerNavigation()
  const detailTitle =
    title ??
    (typeof trigger === "string" ? trigger : undefined) ??
    hint ??
    "Setting"

  const closeDetail = () => {
    mobileNav?.closeDetail()
    onOpenChange?.(false)
  }

  const liveDetail = useMobileLiveDetail({
    content: (
      <>
        {title ? <p className="dn-popover-heading">{title}</p> : null}
        {mergeMobileDetailChildClose(children, closeDetail)}
      </>
    ),
    enabled: Boolean(mobileDensity && mobileNav),
    onOpenChange,
    title: detailTitle,
  })

  const rowTrigger = (
    <>
      {leading ? (
        <span className="flex min-w-0 items-center gap-2">
          {leading}
          <span className={cn("truncate", DN_LABEL)}>{trigger}</span>
        </span>
      ) : (
        <span className={cn("truncate", DN_VALUE)}>{trigger}</span>
      )}
      {hideHint ? (
        <ChevronRight aria-hidden className={cn("size-3 shrink-0 opacity-50", DN_HINT)} />
      ) : (
        <span className={cn("flex shrink-0 items-center gap-1", DN_HINT)}>
          {hint}
          <ChevronRight aria-hidden className="size-3 opacity-50" />
        </span>
      )}
    </>
  )

  if (mobileDensity && mobileNav) {
    return (
      <>
        <SettingsRowButton data-vaul-no-drag="" type="button" onClick={liveDetail.open}>
          {rowTrigger}
        </SettingsRowButton>
        {liveDetail.portal}
      </>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <SettingsRowButton>{rowTrigger}</SettingsRowButton>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        data-slot={dataSlot}
        side="right"
        sideOffset={10}
        className={cn(
          "z-[20000] flex max-h-[min(28rem,calc(100dvh-8rem))] w-[min(18rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[16px] border border-[var(--desktop-appearance-popover-border)] bg-[var(--desktop-appearance-popover-bg)] p-0 text-[var(--desktop-inspector-fg-secondary)] shadow-[var(--desktop-appearance-popover-shadow)]",
          contentClassName,
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3" data-slot="desktop-inspector-scroll">
          <DesktopnewThemeContext.Provider value={theme}>
            <div
              className="desktopnew-root desktopnew-embedded flex min-h-0 flex-col"
              data-theme={theme}
            >
              {title ? <p className={DESKTOP_INSPECTOR_SECTION_HEADING_CLASS}>{title}</p> : null}
              {children}
            </div>
          </DesktopnewThemeContext.Provider>
        </div>
      </PopoverContent>
    </Popover>
  )
}

const OPTION_TILE_SCROLL_ROW = "dn-preview-row dn-option-tile-scroll-row"

export function ContentTypeBrowser({
  onAfterSelect,
  selected,
  onSelect,
}: {
  onAfterSelect?: () => void
  selected: QrInputType
  onSelect: (type: QrInputType) => void
}) {
  const normalizedSelected = normalizeContentTypeForPicker(selected)
  const types = PICKER_QR_INPUT_TYPES.map((type) => QR_INPUT_OPTIONS[type])

  return (
    <SegmentTabs
      persistKey="content-type"
      scrollable
      items={types.map((option) => ({
        id: option.value,
        label: option.label,
        icon: <ContentTypeGridIcon className="dn-content-type-segment-icon" type={option.value} />,
      }))}
      value={normalizedSelected}
      onChange={(next) => {
        onSelect(next as QrInputType)
        onAfterSelect?.()
      }}
    />
  )
}

/** Popover grid — kept for compact surfaces that still use `SettingsRowPopover`. */
export function ContentTypePicker({
  onAfterSelect,
  selected,
  onSelect,
}: {
  onAfterSelect?: () => void
  selected: QrInputType
  onSelect: (type: QrInputType) => void
}) {
  return (
    <div className="dn-content-type-picker">
      <div className="dn-content-type-grid">
        {PICKER_QR_INPUT_TYPES.map((type) => {
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
      </div>
    </div>
  )
}

export function OptionScrollRow({
  fill = false,
  items,
  onSelect,
  persistKey,
  selected,
}: {
  fill?: boolean
  items: string[]
  onSelect?: (item: string) => void
  persistKey?: string
  selected: string
}) {
  const tiles = items.map((item) => {
    const isSelected = selected === item

    return (
      <button
        key={item}
        aria-pressed={isSelected}
        className={cn(
          "dn-option-scroll-tile dn-option-tile dn-control-surface shrink-0 px-3 dn-type-chip dn-squircle-xs",
          isSelected && "text-[var(--dn-fg)]",
        )}
        type="button"
        onClick={() => onSelect?.(item)}
      >
        {item}
      </button>
    )
  })

  if (fill) {
    return (
      <div className="dn-option-scroll-row dn-option-scroll-row--fill">
        {tiles}
      </div>
    )
  }

  return (
    <ScrollArea
      className="w-full min-w-0 max-w-full overflow-hidden"
      chevron={false}
      cueSize="tight"
      orientation="horizontal"
      persistKey={persistKey}
      scrollFade
      showScrollbar={false}
      viewportClassName="min-w-0"
    >
      <div className={OPTION_TILE_SCROLL_ROW}>
        {tiles}
      </div>
    </ScrollArea>
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
              "dn-option-tile flex aspect-square items-center justify-center dn-type-chip dn-squircle-xs",
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
            "dn-preset-item dn-control-surface w-full px-2.5 text-left dn-type-chip dn-squircle-xs",
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
  imageUrl,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  ariaLabel: string
  fill: string
  imageUrl?: string
}) {
  const gradient = isGradientFill(fill)

  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        "relative flex size-[length:var(--dn-icon-hit)] shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dn-focus,var(--ring))]",
        className,
      )}
      data-slot="desktop-fill-swatch-trigger"
      type="button"
      {...props}
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
          style={
            imageUrl
              ? {
                  backgroundImage: `url("${imageUrl}")`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                }
              : gradient
                ? { background: fill }
                : { backgroundColor: fillPreviewHex(fill) }
          }
        />
      </span>
    </button>
  )
}

function ColorRowButton({
  fill,
  hint,
  imageUrl,
  ...props
}: React.ComponentProps<"button"> & {
  fill: string
  hint: string
  imageUrl?: string
}) {
  const gradient = isGradientFill(fill)
  const hex = fillPreviewHex(fill).replace("#", "").toUpperCase()

  return (
    <SettingsRowButton {...props}>
      <span className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden
          className="size-3.5 shrink-0 border border-[color-mix(in_srgb,var(--dn-line)_40%,transparent)] dn-squircle-xs"
          style={
            imageUrl
              ? {
                  backgroundImage: `url("${imageUrl}")`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                }
              : gradient
                ? { background: fill }
                : { backgroundColor: fillPreviewHex(fill) }
          }
        />
        <span className={DN_LABEL}>{hint}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <span className={DN_VALUE}>{imageUrl ? "Image" : gradient ? "Gradient" : hex}</span>
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
    <div className="dn-switch-row">
      <span className={DN_LABEL}>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

export const SETTINGS_ELASTIC_SLIDER_CLASS =
  "desktop-elastic-slider dn-settings-elastic-slider w-full [--elastic-slider-height:var(--dn-control-height)] [--elastic-slider-radius:var(--dn-radius-sm)]"

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
  const stepDecimals = step.toString().includes(".")
    ? (step.toString().split(".")[1]?.length ?? 0)
    : 0
  const normalizedValue = parseFloat(
    (Math.round(value / step) * step).toFixed(stepDecimals),
  )

  return (
    <ElasticSlider
      animateValue={false}
      aria-label={label}
      className={SETTINGS_ELASTIC_SLIDER_CLASS}
      label={label}
      max={max}
      min={min}
      step={step}
      value={normalizedValue}
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
      className="dn-settings-primary dn-control-surface dn-pressable-press-only w-full font-medium tracking-tight"
      type="button"
      onClick={onClick}
      {...props}
    >
      {children}
    </SettingsRowButton>
  )
}
