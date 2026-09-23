import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from "react"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Fill } from "@/components/ui/fill-picker/public-api"
import { InspectorFillPicker } from "@/features/shell/inspector/FillPicker"
import {
  SettingsAccordionPopoverOverlay,
  useSettingsAccordionPopover,
} from "@/features/shell/inspector/SettingsAccordionPopoverContext"
import { SettingsPopoverChrome } from "@/features/shell/inspector/settings-ui/PopoverChrome"
import {
  useInspectorTheme,
} from "@/features/shell/inspector/settings-ui/Shared"
import { inspectorPortalClass } from "@/features/shell/inspector/settings-ui/utils"
import { cn } from "@/lib/utils"

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
  const theme = useInspectorTheme()
  const accordion = useSettingsAccordionPopover()
  const popoverKey = useId()
  const [radixOpen, setRadixOpen] = useState(false)

  const accordionPanelClassName = inspectorPortalClass(
    theme,
    cn(
      "inspector-fill-popover inspector-popover-content w-full border-0 bg-transparent p-0 shadow-none outline-none",
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
        className={inspectorPortalClass(
          theme,
          cn(
            "inspector-fill-popover dn-portal-surface w-[min(100vw-2rem,20rem)] border-0 bg-transparent p-0 shadow-none outline-none",
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
        <InspectorFillPicker solidOnly value={value} onValueChange={onValueChange} />
      }
    >
      {children}
    </SettingsTilePopover>
  )
}
