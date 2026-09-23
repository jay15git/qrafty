import { X } from "lucide-react"
import type { ReactNode } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"
import { CUELUME_BUTTON } from "@/features/shell/audio/cuelume"
import { cn } from "@/lib/utils"

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
