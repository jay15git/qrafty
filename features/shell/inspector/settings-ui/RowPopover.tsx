import { ChevronRight } from "lucide-react"
import { useEffect, useId, useState, type ReactNode } from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
  DN_HINT,
  DN_LABEL,
  DN_VALUE,
  SettingsRowButton,
  useInspectorTheme,
} from "@/features/shell/inspector/settings-ui/Shared"
import {
  inspectorPortalClass,
  mergeMobileDetailChildClose,
} from "@/features/shell/inspector/settings-ui/utils"
import { cn } from "@/lib/utils"

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
  const theme = useInspectorTheme()
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

  const accordionPanelClassName = inspectorPortalClass(
    theme,
    cn("inspector-popover-content w-full overflow-hidden p-0 dn-squircle-md", contentClassName),
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
        className={inspectorPortalClass(
          theme,
          cn("dn-portal-surface inspector-popover-content w-56 overflow-hidden p-0 dn-squircle-md", contentClassName),
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
