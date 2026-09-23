"use client"

import { ChevronRight, X } from "lucide-react"
import { AnimatePresence, m, useReducedMotion } from "motion/react"
import { createPortal } from "react-dom"
import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  cloneElement,
  isValidElement,
  Children,
  type ReactElement,
  type ReactNode,
} from "react"

import { MotionAccordion } from "@/features/shell/components/unlumen-ui/motion-faqs-accordion"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { InlineSlider } from "@/features/shell/components/motion/range-slider-inline"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Switch } from "@/components/ui/switch"
import type { IconComponent, IconComponentProps } from "@/lib/icon-context"
import type { DotsColorMode } from "@/features/qr/model/state"
import { ContentTypeGridIcon } from "@/features/qr/content/ContentTypeGridIcon"
import {
  normalizeContentTypeForPicker,
  PICKER_QR_INPUT_TYPES,
  QR_INPUT_OPTIONS,
  type QrInputType,
} from "@/features/qr/content/input-options"
import {
  DesktopFillPicker,
  type LockedFillPickerMode,
} from "@/features/shell/inspector/fill-picker"
import { SettingsFillOptionGrid } from "@/features/shell/inspector/settings-fill-option-grid"
import {
  fillPreviewHex,
  isGradientFill,
  type ModuleImageControl,
  type ModulePatternControl,
} from "@/features/shell/inspector/fill-picker.utils"
import { DesktopnewThemeContext } from "@/features/shell/inspector/theme-context"
import { useMobileInspectorDensity } from "@/features/shell/inspector/mobile-inspector-density-context"
import { useMobileSettingsTabDock } from "@/features/shell/inspector/mobile-settings-tab-dock"
import { SegmentTabs } from "@/features/shell/inspector/settings-segment-tabs"
import {
  useMobileDrawerNavigation,
  useMobileLiveDetail,
} from "@/features/shell/inspector/mobile-drawer-navigation-context"
import type { Fill } from "@/components/ui/fill-picker/public-api"
import {
  getDesktopSettingsSectionLabel,
  type DesktopSettingsSectionId,
} from "@/features/shell/inspector/settings-panel-meta"
import { SettingsSectionIconFor } from "@/features/shell/inspector/settings-section-icons"
import {
  SettingsAccordionPopoverOverlay,
  useSettingsAccordionPopover,
} from "@/features/shell/inspector/settings-accordion-popover-context"
import {
  CUELUME_BUTTON,
  CUELUME_TOGGLE,
  playDesktopPressSound,
} from "@/features/shell/audio/desktop-cuelume"
import { cn } from "@/lib/utils"

import "./inspector.css"

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
      {...CUELUME_BUTTON}
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

export function SettingsPopoverCloseButton({
  onClick,
  title,
}: {
  onClick?: () => void
  title?: string
}) {
  return (
    <button
      aria-label={title ? `Close ${title}` : "Close"}
      className="dn-settings-popover-close"
      type="button"
      onClick={onClick}
      {...CUELUME_BUTTON}
    >
      <X aria-hidden className="size-3.5" strokeWidth={2} />
    </button>
  )
}

export function SettingsPopoverChrome({
  title,
  onClose,
  children,
  bodyClassName,
}: {
  title: string
  onClose: () => void
  children: ReactNode
  bodyClassName?: string
}) {
  return (
    <div className="dn-settings-popover-shell">
      <div className="dn-settings-popover-header">
        <p className="dn-settings-popover-title">{title}</p>
        <SettingsPopoverCloseButton title={title} onClick={onClose} />
      </div>
      <ScrollArea
        chevron={false}
        className="dn-settings-popover-body min-h-0 flex-1"
        cueSize="tight"
        scrollFade
        viewportClassName={cn("dn-settings-popover-body-viewport", bodyClassName)}
      >
        {children}
      </ScrollArea>
    </div>
  )
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

export function SettingsLabeledSelect({
  items,
  label,
  onChange,
  placeholder,
  value,
}: {
  items: readonly string[]
  label?: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  const theme = useContext(DesktopnewThemeContext)
  const mobileDensity = useMobileInspectorDensity()
  const mobilePersistKey = useId()

  if (mobileDensity) {
    return (
      <SegmentTabs
        items={[...items]}
        persistKey={mobilePersistKey}
        scrollable={items.length > 3}
        value={value}
        onChange={onChange}
      />
    )
  }

  return (
    <div
      className={cn(
        "dn-content-type-select w-full min-w-0",
        label && "dn-content-type-select--split",
      )}
    >
      {label ? (
        <span className="dn-row-label-text shrink-0 pl-[var(--settings-row-px)]">{label}</span>
      ) : null}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          className="dn-content-type-select-trigger w-full min-w-0 dn-squircle-sm"
          placeholder={placeholder}
          variant="borderless"
        />
        <SelectContent
          className={cn(
            "dn-portal-surface desktopnew-popover-content overflow-hidden p-0 dn-squircle-md",
            theme === "dark" && "dark",
          )}
          data-theme={theme}
        >
          {items.map((item, index) => (
            <SelectItem key={item} index={index} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function SettingsFillPresetSection({
  fillPreviewImageUrl,
  lockedFillMode,
  presets,
  qrGradient,
  value,
  onSelect,
}: {
  fillPreviewImageUrl?: string
  lockedFillMode?: LockedFillPickerMode
  presets: readonly string[]
  qrGradient?: boolean
  value: string
  onSelect: (fill: Fill, css: string) => void
}) {
  const pickerRef = useRef<SettingsFillPopoverHandle>(null)
  const mobileDensity = useMobileInspectorDensity()

  return (
    <>
      {mobileDensity ? null : (
        <div className="flex min-h-[var(--settings-control-height)] items-center">
          <span className="dn-row-label-text pl-[var(--settings-row-px)]">Color</span>
          <button
            aria-label="Color"
            className="ml-auto size-7 shrink-0 cursor-pointer overflow-hidden dn-squircle-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus,var(--ring))]"
            style={{ background: value }}
            type="button"
            onClick={() => pickerRef.current?.openPicker()}
          />
        </div>
      )}
      <SettingsFillOptionGrid
        label="Presets"
        persistKey={`fill-presets:${lockedFillMode ?? "default"}`}
        presets={presets}
        value={value}
        onOpenPicker={mobileDensity ? () => pickerRef.current?.openPicker() : undefined}
        onSelect={onSelect}
      />
      <SettingsFillPopover
        ref={pickerRef}
        fillPreviewImageUrl={fillPreviewImageUrl}
        hint="Color"
        lockedFillMode={lockedFillMode}
        qrGradient={qrGradient}
        value={value}
        variant="picker-only"
        onValueChange={onSelect}
      />
    </>
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

type SettingsFillPopoverHandle = {
  openPicker: () => void
}

function FillPickerPopoverContent({
  align,
  avoidCollisions,
  collisionPadding,
  children,
  mobileDensity,
  onClose,
  side,
  theme,
  title,
}: {
  align?: "start" | "center" | "end"
  avoidCollisions?: boolean
  collisionPadding?: number
  children: ReactNode
  mobileDensity: boolean
  onClose: () => void
  side?: "top" | "right" | "bottom" | "left"
  theme: "light" | "dark"
  title: string
}) {
  return (
    <PopoverContent
      align={align}
      avoidCollisions={avoidCollisions}
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
      <SettingsPopoverChrome
        bodyClassName="dn-settings-popover-body-fill"
        title={title}
        onClose={onClose}
      >
        {children}
      </SettingsPopoverChrome>
    </PopoverContent>
  )
}

type SettingsFillPopoverVariantProps = {
  value: string
  onValueChange: (fill: Fill, css: string) => void
  hint: string
  variant: "row" | "swatch" | "grid" | "picker-only"
  gridPresets?: readonly string[]
  triggerClassName?: string
  fillPreviewImageUrl?: string
}

function SettingsFillPopoverMobile({
  fillPreviewImageUrl,
  gridPresets,
  hint,
  liveDetail,
  onValueChange,
  triggerClassName,
  value,
  variant,
}: SettingsFillPopoverVariantProps & {
  liveDetail: { open: () => void; portal: ReactNode }
}) {
  if (variant === "picker-only") {
    return liveDetail.portal
  }

  if (variant === "grid") {
    return (
      <>
        <SettingsFillOptionGrid
          persistKey={`fill-grid:${hint}`}
          presets={gridPresets}
          value={value}
          onOpenPicker={liveDetail.open}
          onSelect={onValueChange}
        />
        {liveDetail.portal}
      </>
    )
  }

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

function SettingsFillPopoverAccordion({
  accordion,
  accordionPanelClassName,
  fillPreviewImageUrl,
  gridPresets,
  hint,
  onValueChange,
  pickerBody,
  popoverKey,
  popoverTitle,
  theme,
  triggerClassName,
  value,
  variant,
}: SettingsFillPopoverVariantProps & {
  accordion: NonNullable<ReturnType<typeof useSettingsAccordionPopover>>
  accordionPanelClassName: string
  pickerBody: ReactNode
  popoverKey: string
  popoverTitle: string
  theme: "light" | "dark"
}) {
  const isOpen = accordion.openKey === popoverKey
  const toggleOpen = () => accordion.setOpenKey(isOpen ? null : popoverKey)

  if (variant === "picker-only") {
    return (
      <SettingsAccordionPopoverOverlay
        className={accordionPanelClassName}
        openKey={popoverKey}
        theme={theme}
      >
        <SettingsPopoverChrome
          bodyClassName="dn-settings-popover-body-fill"
          title={popoverTitle}
          onClose={() => accordion.setOpenKey(null)}
        >
          {pickerBody}
        </SettingsPopoverChrome>
      </SettingsAccordionPopoverOverlay>
    )
  }

  return (
    <>
      {variant === "grid" ? (
        <SettingsFillOptionGrid
          persistKey={`fill-grid:${hint}`}
          presets={gridPresets}
          value={value}
          onOpenPicker={toggleOpen}
          onSelect={onValueChange}
        />
      ) : variant === "swatch" ? (
        <FillSwatchButton
          ariaLabel={hint}
          className={triggerClassName}
          fill={value}
          imageUrl={fillPreviewImageUrl}
          type="button"
          onClick={toggleOpen}
        />
      ) : (
        <ColorRowButton
          fill={value}
          hint={hint}
          imageUrl={fillPreviewImageUrl}
          type="button"
          onClick={toggleOpen}
        />
      )}
      <SettingsAccordionPopoverOverlay
        className={accordionPanelClassName}
        openKey={popoverKey}
        theme={theme}
      >
        <SettingsPopoverChrome
          bodyClassName="dn-settings-popover-body-fill"
          title={popoverTitle}
          onClose={() => accordion.setOpenKey(null)}
        >
          {pickerBody}
        </SettingsPopoverChrome>
      </SettingsAccordionPopoverOverlay>
    </>
  )
}

function SettingsFillPopoverRadix({
  align,
  avoidCollisions,
  collisionPadding,
  fillPreviewImageUrl,
  gridPresets,
  hint,
  mobileDensity,
  onOpenChange,
  onValueChange,
  open,
  pickerBody,
  popoverTitle,
  side,
  theme,
  triggerClassName,
  value,
  variant,
}: SettingsFillPopoverVariantProps & {
  align: "start" | "center" | "end"
  avoidCollisions?: boolean
  collisionPadding?: number
  mobileDensity: boolean
  onOpenChange: (open: boolean) => void
  open: boolean
  pickerBody: ReactNode
  popoverTitle: string
  side: "top" | "right" | "bottom" | "left"
  theme: "light" | "dark"
}) {
  const content = (
    <FillPickerPopoverContent
      align={align}
      avoidCollisions={avoidCollisions}
      collisionPadding={collisionPadding}
      mobileDensity={mobileDensity}
      onClose={() => onOpenChange(false)}
      side={side}
      theme={theme}
      title={popoverTitle}
    >
      {pickerBody}
    </FillPickerPopoverContent>
  )

  if (variant === "picker-only") {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        {content}
      </Popover>
    )
  }

  if (variant === "grid") {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <SettingsFillOptionGrid
          persistKey={`fill-grid:${hint}`}
          presets={gridPresets}
          value={value}
          onOpenPicker={() => onOpenChange(true)}
          onSelect={onValueChange}
        />
        {content}
      </Popover>
    )
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {variant === "swatch" ? (
          <FillSwatchButton ariaLabel={hint} className={triggerClassName} fill={value} imageUrl={fillPreviewImageUrl} />
        ) : (
          <ColorRowButton fill={value} hint={hint} imageUrl={fillPreviewImageUrl} />
        )}
      </PopoverTrigger>
      {content}
    </Popover>
  )
}

export const SettingsFillPopover = forwardRef(function SettingsFillPopover(
  {
    value,
    onValueChange,
    hint = "Fill",
    title,
    modulePattern,
    moduleImage,
    fillPreviewImageUrl,
    moduleFillMode,
    lockedFillMode,
    solidOnly = false,
    qrGradient = false,
    variant = "row",
    gridPresets,
    side = "right",
    align = "start",
    avoidCollisions,
    collisionPadding,
    triggerClassName,
  }: {
    value: string
    onValueChange: (fill: Fill, css: string) => void
    hint?: string
    title?: string
    solidOnly?: boolean
    qrGradient?: boolean
    variant?: "row" | "swatch" | "grid" | "picker-only"
    gridPresets?: readonly string[]
    side?: "top" | "right" | "bottom" | "left"
    align?: "start" | "center" | "end"
    avoidCollisions?: boolean
    collisionPadding?: number
    triggerClassName?: string
    fillPreviewImageUrl?: string
    modulePattern?: ModulePatternControl
    moduleImage?: ModuleImageControl
    moduleFillMode?: DotsColorMode
    lockedFillMode?: LockedFillPickerMode
  },
  ref: React.Ref<SettingsFillPopoverHandle>,
) {
  const theme = useDesktopnewTheme()
  const mobileDensity = useMobileInspectorDensity()
  const mobileNav = useMobileDrawerNavigation()
  const accordion = useSettingsAccordionPopover()
  const popoverKey = useId()
  const [radixOpen, setRadixOpen] = useState(false)
  const popoverTitle = title ?? hint

  const pickerBody = (
    // `.desktopnew-fill-popover` scopes the calm-surface fill-picker rules —
    // without it the picker renders raw base styles (white borders) when it
    // portals into the mobile drawer detail outlet.
    <div className="desktopnew-fill-popover w-full min-w-0" data-theme={theme}>
      <DesktopFillPicker
        key={lockedFillMode ?? moduleFillMode ?? "default"}
        lockedFillMode={lockedFillMode}
        moduleFillMode={lockedFillMode ? undefined : moduleFillMode}
        moduleImage={moduleImage}
        modulePattern={modulePattern}
        qrGradient={qrGradient}
        solidOnly={solidOnly}
        value={value}
        onValueChange={onValueChange}
      />
    </div>
  )

  const liveDetail = useMobileLiveDetail({
    content: pickerBody,
    enabled: Boolean(mobileDensity && mobileNav),
    title: popoverTitle,
  })

  const accordionPanelClassName = desktopnewPortalClass(
    theme,
    "desktopnew-fill-popover desktopnew-popover-content w-full border-0 bg-transparent p-0 shadow-none outline-none",
  )

  const openPicker = useCallback(() => {
    if (mobileDensity && mobileNav) {
      liveDetail.open()
      return
    }

    if (accordion) {
      accordion.setOpenKey(popoverKey)
      return
    }

    setRadixOpen(true)
  }, [accordion, liveDetail.open, mobileDensity, mobileNav, popoverKey])

  useImperativeHandle(ref, () => ({ openPicker }), [openPicker])

  const variantProps: SettingsFillPopoverVariantProps = {
    fillPreviewImageUrl,
    gridPresets,
    hint,
    onValueChange,
    triggerClassName,
    value,
    variant,
  }

  if (mobileDensity && mobileNav) {
    return (
      <SettingsFillPopoverMobile {...variantProps} liveDetail={liveDetail} />
    )
  }

  if (accordion) {
    return (
      <SettingsFillPopoverAccordion
        {...variantProps}
        accordion={accordion}
        accordionPanelClassName={accordionPanelClassName}
        pickerBody={pickerBody}
        popoverKey={popoverKey}
        popoverTitle={popoverTitle}
        theme={theme}
      />
    )
  }

  return (
    <SettingsFillPopoverRadix
      {...variantProps}
      align={align}
      avoidCollisions={avoidCollisions}
      collisionPadding={collisionPadding}
      mobileDensity={mobileDensity}
      open={radixOpen}
      pickerBody={pickerBody}
      popoverTitle={popoverTitle}
      side={side}
      theme={theme}
      onOpenChange={setRadixOpen}
    />
  )
})

export function SettingsTilePopover({
  title,
  children,
  content,
  contentClassName,
}: {
  title: string
  children: ReactElement<{ onClick?: React.MouseEventHandler<HTMLElement> }>
  content: ReactNode
  contentClassName?: string
}) {
  const theme = useDesktopnewTheme()
  const accordion = useSettingsAccordionPopover()
  const popoverKey = useId()
  const [radixOpen, setRadixOpen] = useState(false)

  const accordionPanelClassName = desktopnewPortalClass(
    theme,
    cn(
      "desktopnew-fill-popover desktopnew-popover-content w-full border-0 bg-transparent p-0 shadow-none outline-none",
      contentClassName,
    ),
  )

  const attachTrigger = (onClick: React.MouseEventHandler<HTMLElement>) => {
    if (!isValidElement(children)) {
      return children
    }

    return cloneElement(children, {
      onClick: (event: React.MouseEvent<HTMLElement>) => {
        children.props.onClick?.(event)
        if (event.defaultPrevented) {
          return
        }
        onClick(event)
      },
    })
  }

  if (accordion) {
    const isOpen = accordion.openKey === popoverKey

    return (
      <>
        {attachTrigger(() => accordion.setOpenKey(isOpen ? null : popoverKey))}
        <SettingsAccordionPopoverOverlay
          className={accordionPanelClassName}
          openKey={popoverKey}
          theme={theme}
        >
          <SettingsPopoverChrome
            bodyClassName="dn-settings-popover-body-fill"
            title={title}
            onClose={() => accordion.setOpenKey(null)}
          >
            {content}
          </SettingsPopoverChrome>
        </SettingsAccordionPopoverOverlay>
      </>
    )
  }

  return (
    <Popover open={radixOpen} onOpenChange={setRadixOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        className={desktopnewPortalClass(
          theme,
          cn(
            "desktopnew-fill-popover dn-portal-surface w-[min(100vw-2rem,20rem)] border-0 bg-transparent p-0 shadow-none outline-none",
            contentClassName,
          ),
        )}
        data-theme={theme}
        side="right"
        sideOffset={10}
      >
        <SettingsPopoverChrome
          bodyClassName="dn-settings-popover-body-fill"
          title={title}
          onClose={() => setRadixOpen(false)}
        >
          {content}
        </SettingsPopoverChrome>
      </PopoverContent>
    </Popover>
  )
}

export function SettingsAccordionColorPicker({
  title,
  value,
  onValueChange,
  children,
}: {
  title: string
  value: string
  onValueChange: (fill: Fill, css: string) => void
  children: ReactElement<{ onClick?: React.MouseEventHandler<HTMLElement> }>
}) {
  return (
    <SettingsTilePopover
      title={title}
      content={
        <DesktopFillPicker solidOnly value={value} onValueChange={onValueChange} />
      }
    >
      {children}
    </SettingsTilePopover>
  )
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
  side = "right",
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
  side?: "top" | "right" | "bottom" | "left"
}) {
  const theme = useDesktopnewTheme()
  const mobileDensity = useMobileInspectorDensity()
  const mobileNav = useMobileDrawerNavigation()
  const accordion = useSettingsAccordionPopover()
  const popoverKey = useId()
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlledOpen = open !== undefined
  const popoverOpen = isControlledOpen ? open : internalOpen
  const detailTitle =
    title ??
    (typeof trigger === "string" ? trigger : undefined) ??
    hint ??
    "Setting"

  const setPopoverOpen = (nextOpen: boolean) => {
    if (!isControlledOpen) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  const closeDetail = () => {
    mobileNav?.closeDetail()
    onOpenChange?.(false)
  }

  const liveDetail = useMobileLiveDetail({
    content: mergeMobileDetailChildClose(children, closeDetail),
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

  useEffect(() => {
    if (!accordion || open === undefined) {
      return
    }

    if (open) {
      accordion.setOpenKey(popoverKey)
      return
    }

    if (accordion.openKey === popoverKey) {
      accordion.setOpenKey(null)
    }
  }, [accordion, open, popoverKey])

  useEffect(() => {
    if (!accordion || open === undefined) {
      return
    }

    if (open && accordion.openKey !== popoverKey) {
      onOpenChange?.(false)
    }
  }, [accordion, onOpenChange, open, popoverKey])

  const accordionPanelClassName = desktopnewPortalClass(
    theme,
    cn("desktopnew-popover-content w-full overflow-hidden p-0 dn-squircle-md", contentClassName),
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

  if (accordion) {
    const isOpen = accordion.openKey === popoverKey
    const setOpen = (nextOpen: boolean) => {
      accordion.setOpenKey(nextOpen ? popoverKey : null)
      setPopoverOpen(nextOpen)
    }

    return (
      <>
        <SettingsRowButton type="button" onClick={() => setOpen(!isOpen)}>
          {rowTrigger}
        </SettingsRowButton>
        <SettingsAccordionPopoverOverlay
          className={accordionPanelClassName}
          openKey={popoverKey}
          theme={theme}
        >
          <SettingsPopoverChrome
            title={detailTitle}
            onClose={() => setOpen(false)}
          >
            {children}
          </SettingsPopoverChrome>
        </SettingsAccordionPopoverOverlay>
      </>
    )
  }

  return (
    <Popover modal={false} open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <SettingsRowButton>
          {rowTrigger}
        </SettingsRowButton>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={desktopnewPortalClass(
          theme,
          cn("dn-portal-surface desktopnew-popover-content w-56 overflow-hidden p-0 dn-squircle-md", contentClassName),
        )}
        data-mobile-inspector={mobileDensity ? "" : undefined}
        data-theme={theme}
        side={side}
        sideOffset={10}
        onEscapeKeyDown={() => setPopoverOpen(false)}
        onInteractOutside={() => setPopoverOpen(false)}
        onPointerDownOutside={() => setPopoverOpen(false)}
      >
        <SettingsPopoverChrome
          title={detailTitle}
          onClose={() => setPopoverOpen(false)}
        >
          {children}
        </SettingsPopoverChrome>
      </PopoverContent>
    </Popover>
  )
}

const OPTION_TILE_SCROLL_ROW = "dn-preview-row dn-option-tile-scroll-row"

function createContentTypeSelectIcon(type: QrInputType): IconComponent {
  function ContentTypeSelectIcon({ className }: IconComponentProps) {
    return (
      <ContentTypeGridIcon className={cn("!size-4 shrink-0", className)} type={type} />
    )
  }

  ContentTypeSelectIcon.displayName = `ContentTypeSelectIcon_${type}`
  return ContentTypeSelectIcon
}

const CONTENT_TYPE_SELECT_ICONS = Object.fromEntries(
  PICKER_QR_INPUT_TYPES.map((type) => [type, createContentTypeSelectIcon(type)]),
) as Record<(typeof PICKER_QR_INPUT_TYPES)[number], IconComponent>

const QR_COLOR_PART_OPTIONS = ["Module", "Eye", "Frame", "Logo"] as const

export type QrColorPartOption = (typeof QR_COLOR_PART_OPTIONS)[number]

export function QrColorPartBrowser({
  onSelect,
  selected,
}: {
  onSelect: (part: QrColorPartOption) => void
  selected: string
}) {
  const normalizedSelected = QR_COLOR_PART_OPTIONS.includes(selected as QrColorPartOption)
    ? (selected as QrColorPartOption)
    : "Module"

  return (
    <SettingsLabeledSelect
      items={QR_COLOR_PART_OPTIONS}
      placeholder="Part"
      value={normalizedSelected}
      onChange={(next) => onSelect(next as QrColorPartOption)}
    />
  )
}

export function ContentTypeBrowser({
  onAfterSelect,
  selected,
  onSelect,
}: {
  onAfterSelect?: () => void
  selected: QrInputType
  onSelect: (type: QrInputType) => void
}) {
  const mobileDensity = useMobileInspectorDensity()
  const theme = useDesktopnewTheme()
  const normalizedSelected = normalizeContentTypeForPicker(selected)
  const types = PICKER_QR_INPUT_TYPES.map((type) => QR_INPUT_OPTIONS[type])

  if (!mobileDensity) {
    const selectedIcon = CONTENT_TYPE_SELECT_ICONS[normalizedSelected]

    return (
      <div className="dn-content-type-select w-full min-w-0">
        <Select
          value={normalizedSelected}
          onValueChange={(next) => {
            onSelect(next as QrInputType)
            onAfterSelect?.()
          }}
        >
          <SelectTrigger
            className="dn-content-type-select-trigger w-full min-w-0 dn-squircle-sm"
            icon={selectedIcon}
            placeholder="Content type"
            variant="borderless"
          />
          <SelectContent
            className={desktopnewPortalClass(
              theme,
              "dn-portal-surface desktopnew-popover-content overflow-hidden p-0 dn-squircle-md",
            )}
            data-theme={theme}
          >
            {types.map((option, index) => (
              <SelectItem
                key={option.value}
                icon={CONTENT_TYPE_SELECT_ICONS[option.value]}
                index={index}
                value={option.value}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

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
          isSelected && "text-[var(--fg)]",
        )}
        type="button"
        {...CUELUME_TOGGLE}
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
            selected === item && "text-[var(--fg)]",
          )}
          type="button"
          aria-pressed={selected === item}
          {...CUELUME_TOGGLE}
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
        "relative flex size-[length:var(--settings-icon-hit)] shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus,var(--ring))]",
        className,
      )}
      data-slot="desktop-fill-swatch-trigger"
      type="button"
      {...CUELUME_BUTTON}
      {...props}
    >
      <span
        aria-hidden="true"
        className="relative size-6 shrink-0 overflow-hidden rounded-full border-2 border-[color-mix(in_srgb,var(--line)_40%,transparent)] box-border"
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
          className="size-3.5 shrink-0 border border-[color-mix(in_srgb,var(--line)_40%,transparent)] dn-squircle-xs"
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
    <Switch
      checked={checked}
      label={label}
      onToggle={() => onChange(!checked)}
      size="default"
      className="dn-switch-row"
    />
  )
}

const SETTINGS_INLINE_SLIDER_CLASS = "dn-settings-inline-slider h-9 w-full"

const INLINE_SLIDER_TICK_INTERVAL_MS = 80

function useThrottledPressSound() {
  const lastTickAtRef = useRef(0)

  return useCallback(() => {
    const now = Date.now()
    if (now - lastTickAtRef.current < INLINE_SLIDER_TICK_INTERVAL_MS) return
    lastTickAtRef.current = now
    playDesktopPressSound()
  }, [])
}

export function SettingsInlineSlider({
  ariaLabel,
  formatValue,
  label,
  max = 100,
  min = 0,
  onChange,
  step = 1,
  value,
}: {
  ariaLabel?: string
  formatValue?: (value: number) => string
  label: string
  max?: number
  min?: number
  onChange?: (value: number) => void
  step?: number
  value: number
}) {
  const tick = useThrottledPressSound()
  const stepDecimals = step.toString().includes(".")
    ? (step.toString().split(".")[1]?.length ?? 0)
    : 0
  const normalizedValue = parseFloat(
    (Math.round(value / step) * step).toFixed(stepDecimals),
  )
  const format = formatValue ?? ((next: number) => `${next}`)

  return (
    <InlineSlider
      aria-label={ariaLabel ?? label}
      className={SETTINGS_INLINE_SLIDER_CLASS}
      format={format}
      formatValueText={format}
      label={label}
      max={max}
      min={min}
      step={step}
      value={normalizedValue}
      onValueChange={(next) => {
        tick()
        onChange?.(next)
      }}
    />
  )
}

export function SettingsSlider(props: {
  label: string
  value: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  formatValue?: (value: number) => string
}) {
  return <SettingsInlineSlider {...props} />
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

export { SegmentTabs }
