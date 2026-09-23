import {
  forwardRef,
  useCallback,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { DotsColorMode } from "@/features/qr/model/state"
import type { Fill } from "@/components/ui/fill-picker/public-api"
import {
  InspectorFillPicker,
  type LockedFillPickerMode,
} from "@/features/shell/inspector/FillPicker"
import { SettingsFillOptionGrid } from "@/features/shell/inspector/SettingsFillOptionGrid"
import type {
  ModuleImageControl,
  ModulePatternControl,
} from "@/features/shell/inspector/FillPicker.utils"
import { useMobileInspectorDensity } from "@/features/shell/inspector/MobileInspectorDensityContext"
import {
  useMobileDrawerNavigation,
  useMobileLiveDetail,
} from "@/features/shell/inspector/MobileDrawerNavigationContext"
import {
  SettingsAccordionPopoverOverlay,
  useSettingsAccordionPopover,
} from "@/features/shell/inspector/SettingsAccordionPopoverContext"
import { SettingsPopoverChrome } from "@/features/shell/inspector/settings-ui/PopoverChrome"
import {
  ColorRowButton,
  FillSwatchButton,
  useInspectorTheme,
  type SettingsFillPopoverHandle,
} from "@/features/shell/inspector/settings-ui/Shared"
import { inspectorPortalClass } from "@/features/shell/inspector/settings-ui/utils"

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
      className={inspectorPortalClass(
        theme,
        "inspector-fill-popover dn-portal-surface w-[min(100vw-2rem,20rem)] border-0 bg-transparent p-0 shadow-none outline-none",
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
  const theme = useInspectorTheme()
  const mobileDensity = useMobileInspectorDensity()
  const mobileNav = useMobileDrawerNavigation()
  const accordion = useSettingsAccordionPopover()
  const popoverKey = useId()
  const [radixOpen, setRadixOpen] = useState(false)
  const popoverTitle = title ?? hint

  const pickerBody = (
    // `.inspector-fill-popover` scopes the calm-surface fill-picker rules —
    // without it the picker renders raw base styles (white borders) when it
    // portals into the mobile drawer detail outlet.
    <div className="inspector-fill-popover w-full min-w-0" data-theme={theme}>
      <InspectorFillPicker
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

  const accordionPanelClassName = inspectorPortalClass(
    theme,
    "inspector-fill-popover inspector-popover-content w-full border-0 bg-transparent p-0 shadow-none outline-none",
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
  }, [accordion, liveDetail, mobileDensity, mobileNav, popoverKey])

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
