"use client"

import {
  CircleDotIcon,
  MousePointer2Icon,
  Redo2Icon,
  RotateCcwIcon,
  SquareRoundCornerIcon,
  SquareIcon,
  Undo2Icon,
} from "lucide-react"
import { type ReactNode } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"

import {
  AppearanceFilterControls,
  AppearanceOpacityControls,
  AppearanceOutlineControls,
  AppearanceRadiusControls,
  AppearanceShadowControls,
} from "@/features/desktop-shell/components/AppearancePopoverControls"
import { DesktopScanSafetyPopover } from "@/features/desktop-shell/components/DesktopScanSafetyPopover"
import {
  DesktopKeyboardShortcutsTrigger,
  DesktopThemeToggleButton,
} from "@/features/desktop-shell/components/DesktopChromeControls"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import { DESKTOP_INSPECTOR_FG_SECONDARY } from "@/features/desktop-shell/components/InspectorControls"
import { DesktopUtilityToolbarButton } from "@/features/desktop-shell/components/DesktopUtilityToolbar"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import type { ScanSafetyResult } from "@/features/qr-code/scan-safety/types"
import { DEFAULT_SCAN_SAFETY_RESULT } from "@/features/qr-code/scan-safety/types"
import DynamicIsland from "@/components/smoothui/dynamic-island"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import { cn } from "@/lib/utils"

type AppearancePopoverId = "shadow" | "opacity" | "radius" | "outline" | "filters"

function DesktopAppearanceShadowIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 15 15"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        clipRule="evenodd"
        d="M6.78296 13.376C8.73904 9.95284 8.73904 5.04719 6.78296 1.62405L7.21708 1.37598C9.261 4.95283 9.261 10.0472 7.21708 13.624L6.78296 13.376Z"
        fill="currentColor"
        fillRule="evenodd"
        opacity=".05"
      />
      <path
        clipRule="evenodd"
        d="M7.28204 13.4775C9.23929 9.99523 9.23929 5.00475 7.28204 1.52248L7.71791 1.2775C9.76067 4.9119 9.76067 10.0881 7.71791 13.7225L7.28204 13.4775Z"
        fill="currentColor"
        fillRule="evenodd"
        opacity=".1"
      />
      <path
        clipRule="evenodd"
        d="M7.82098 13.5064C9.72502 9.99523 9.72636 5.01411 7.82492 1.50084L8.26465 1.26285C10.2465 4.92466 10.2451 10.085 8.26052 13.7448L7.82098 13.5064Z"
        fill="currentColor"
        fillRule="evenodd"
        opacity=".15"
      />
      <path
        clipRule="evenodd"
        d="M8.41284 13.429C10.1952 9.92842 10.1957 5.07537 8.41435 1.57402L8.85999 1.34729C10.7139 4.99113 10.7133 10.0128 8.85841 13.6559L8.41284 13.429Z"
        fill="currentColor"
        fillRule="evenodd"
        opacity=".2"
      />
      <path
        clipRule="evenodd"
        d="M9.02441 13.2956C10.6567 9.8379 10.6586 5.17715 9.03005 1.71656L9.48245 1.50366C11.1745 5.09919 11.1726 9.91629 9.47657 13.5091L9.02441 13.2956Z"
        fill="currentColor"
        fillRule="evenodd"
        opacity=".25"
      />
      <path
        clipRule="evenodd"
        d="M9.66809 13.0655C11.1097 9.69572 11.1107 5.3121 9.67088 1.94095L10.1307 1.74457C11.6241 5.24121 11.6231 9.76683 10.1278 13.2622L9.66809 13.0655Z"
        fill="currentColor"
        fillRule="evenodd"
        opacity=".3"
      />
      <path
        clipRule="evenodd"
        d="M10.331 12.7456C11.5551 9.52073 11.5564 5.49103 10.3347 2.26444L10.8024 2.0874C12.0672 5.42815 12.0659 9.58394 10.7985 12.9231L10.331 12.7456Z"
        fill="currentColor"
        fillRule="evenodd"
        opacity=".35"
      />
      <path
        clipRule="evenodd"
        d="M11.0155 12.2986C11.9938 9.29744 11.9948 5.71296 11.0184 2.71067L11.4939 2.55603C12.503 5.6589 12.502 9.35178 11.4909 12.4535L11.0155 12.2986Z"
        fill="currentColor"
        fillRule="evenodd"
        opacity=".4"
      />
      <path
        clipRule="evenodd"
        d="M11.7214 11.668C12.4254 9.01303 12.4262 5.99691 11.7237 3.34116L12.2071 3.21329C12.9318 5.95292 12.931 9.05728 12.2047 11.7961L11.7214 11.668Z"
        fill="currentColor"
        fillRule="evenodd"
        opacity=".45"
      />
      <path
        clipRule="evenodd"
        d="M12.4432 10.752C12.8524 8.63762 12.8523 6.36089 12.4429 4.2466L12.9338 4.15155C13.3553 6.32861 13.3554 8.66985 12.9341 10.847L12.4432 10.752Z"
        fill="currentColor"
        fillRule="evenodd"
        opacity=".5"
      />
      <path
        clipRule="evenodd"
        d="M0.877075 7.49988C0.877075 3.84219 3.84222 0.877045 7.49991 0.877045C11.1576 0.877045 14.1227 3.84219 14.1227 7.49988C14.1227 11.1575 11.1576 14.1227 7.49991 14.1227C3.84222 14.1227 0.877075 11.1575 0.877075 7.49988ZM7.49991 1.82704C4.36689 1.82704 1.82708 4.36686 1.82708 7.49988C1.82708 10.6329 4.36689 13.1727 7.49991 13.1727C10.6329 13.1727 13.1727 10.6329 13.1727 7.49988C13.1727 4.36686 10.6329 1.82704 7.49991 1.82704Z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  )
}

function DesktopAppearanceBlurIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="currentColor"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14,8.5A1.5,1.5 0 0,0 12.5,10A1.5,1.5 0 0,0 14,11.5A1.5,1.5 0 0,0 15.5,10A1.5,1.5 0 0,0 14,8.5M14,12.5A1.5,1.5 0 0,0 12.5,14A1.5,1.5 0 0,0 14,15.5A1.5,1.5 0 0,0 15.5,14A1.5,1.5 0 0,0 14,12.5M10,17A1,1 0 0,0 9,18A1,1 0 0,0 10,19A1,1 0 0,0 11,18A1,1 0 0,0 10,17M10,8.5A1.5,1.5 0 0,0 8.5,10A1.5,1.5 0 0,0 10,11.5A1.5,1.5 0 0,0 11.5,10A1.5,1.5 0 0,0 10,8.5M14,20.5A0.5,0.5 0 0,0 13.5,21A0.5,0.5 0 0,0 14,21.5A0.5,0.5 0 0,0 14.5,21A0.5,0.5 0 0,0 14,20.5M14,17A1,1 0 0,0 13,18A1,1 0 0,0 14,19A1,1 0 0,0 15,18A1,1 0 0,0 14,17M21,13.5A0.5,0.5 0 0,0 20.5,14A0.5,0.5 0 0,0 21,14.5A0.5,0.5 0 0,0 21.5,14A0.5,0.5 0 0,0 21,13.5M18,5A1,1 0 0,0 17,6A1,1 0 0,0 18,7A1,1 0 0,0 19,6A1,1 0 0,0 18,5M18,9A1,1 0 0,0 17,10A1,1 0 0,0 18,11A1,1 0 0,0 19,10A1,1 0 0,0 18,9M18,17A1,1 0 0,0 17,18A1,1 0 0,0 18,19A1,1 0 0,0 19,18A1,1 0 0,0 18,17M18,13A1,1 0 0,0 17,14A1,1 0 0,0 18,15A1,1 0 0,0 19,14A1,1 0 0,0 18,13M10,12.5A1.5,1.5 0 0,0 8.5,14A1.5,1.5 0 0,0 10,15.5A1.5,1.5 0 0,0 11.5,14A1.5,1.5 0 0,0 10,12.5M10,7A1,1 0 0,0 11,6A1,1 0 0,0 10,5A1,1 0 0,0 9,6A1,1 0 0,0 10,7M10,3.5A0.5,0.5 0 0,0 10.5,3A0.5,0.5 0 0,0 10,2.5A0.5,0.5 0 0,0 9.5,3A0.5,0.5 0 0,0 10,3.5M10,20.5A0.5,0.5 0 0,0 9.5,21A0.5,0.5 0 0,0 10,21.5A0.5,0.5 0 0,0 10.5,21A0.5,0.5 0 0,0 10,20.5M3,13.5A0.5,0.5 0 0,0 2.5,14A0.5,0.5 0 0,0 3,14.5A0.5,0.5 0 0,0 3.5,14A0.5,0.5 0 0,0 3,13.5M14,3.5A0.5,0.5 0 0,0 14.5,3A0.5,0.5 0 0,0 14,2.5A0.5,0.5 0 0,0 13.5,3A0.5,0.5 0 0,0 14,3.5M14,7A1,1 0 0,0 15,6A1,1 0 0,0 14,5A1,1 0 0,0 13,6A1,1 0 0,0 14,7M21,10.5A0.5,0.5 0 0,0 21.5,10A0.5,0.5 0 0,0 21,9.5A0.5,0.5 0 0,0 20.5,10A0.5,0.5 0 0,0 21,10.5M6,5A1,1 0 0,0 5,6A1,1 0 0,0 6,7A1,1 0 0,0 7,6A1,1 0 0,0 6,5M3,9.5A0.5,0.5 0 0,0 2.5,10A0.5,0.5 0 0,0 3,10.5A0.5,0.5 0 0,0 3.5,10A0.5,0.5 0 0,0 3,9.5M6,9A1,1 0 0,0 5,10A1,1 0 0,0 6,11A1,1 0 0,0 7,10A1,1 0 0,0 6,9M6,17A1,1 0 0,0 5,18A1,1 0 0,0 6,19A1,1 0 0,0 7,18A1,1 0 0,0 6,17M6,13A1,1 0 0,0 5,14A1,1 0 0,0 6,15A1,1 0 0,0 7,14A1,1 0 0,0 6,13Z" />
    </svg>
  )
}

function getAppearancePopoverLabel(
  popoverId: AppearancePopoverId,
  appearance: DesktopAppearanceSnapshot,
): string {
  switch (popoverId) {
    case "shadow":
      return "Shadow settings"
    case "opacity":
      return "Opacity settings"
    case "radius":
      return "Corner radius settings"
    case "outline":
      return "Outline settings"
    case "filters":
      return "Filter settings"
  }
}

const APPEARANCE_POPOVERS: Array<{
  id: AppearancePopoverId
  renderIcon: () => ReactNode
  renderControls: (props: {
    appearance: DesktopAppearanceSnapshot
    onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  }) => ReactNode
}> = [
  {
    id: "shadow",
    renderIcon: () => <DesktopAppearanceShadowIcon className="size-3.5" />,
    renderControls: ({ appearance, onPatch }) => (
      <AppearanceShadowControls appearance={appearance} onPatch={onPatch} />
    ),
  },
  {
    id: "filters",
    renderIcon: () => <DesktopAppearanceBlurIcon className="size-3.5" />,
    renderControls: ({ appearance, onPatch }) => (
      <AppearanceFilterControls appearance={appearance} onPatch={onPatch} />
    ),
  },
  {
    id: "outline",
    renderIcon: () => <SquareIcon className="size-3.5" />,
    renderControls: ({ appearance, onPatch }) => (
      <AppearanceOutlineControls appearance={appearance} onPatch={onPatch} />
    ),
  },
  {
    id: "opacity",
    renderIcon: () => <CircleDotIcon className="size-3.5" />,
    renderControls: ({ appearance, onPatch }) => (
      <AppearanceOpacityControls appearance={appearance} onPatch={onPatch} />
    ),
  },
  {
    id: "radius",
    renderIcon: () => <SquareRoundCornerIcon className="size-3.5" />,
    renderControls: ({ appearance, onPatch }) => (
      <AppearanceRadiusControls appearance={appearance} onPatch={onPatch} />
    ),
  },
]

function DesktopAppearancePopover({
  appearance,
  label,
  onPatch,
  popoverId,
  renderControls,
  renderIcon,
}: {
  appearance: DesktopAppearanceSnapshot
  label: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  popoverId: AppearancePopoverId
  renderControls: (props: {
    appearance: DesktopAppearanceSnapshot
    onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  }) => ReactNode
  renderIcon: () => ReactNode
}) {
  if (popoverId === "outline" && !appearance.supportsOutline) {
    return null
  }

  if (popoverId === "radius" && !appearance.supportsCornerRadius) {
    return null
  }

  return (
    <Popover>
      <DesktopTooltip content={label} side="bottom" sideOffset={10}>
        <PopoverTrigger asChild>
          <DesktopUtilityToolbarButton
            aria-label={label}
            data-slot={`desktop-appearance-${popoverId}-trigger`}
          >
            {renderIcon()}
          </DesktopUtilityToolbarButton>
        </PopoverTrigger>
      </DesktopTooltip>
      <PopoverContent
        align="center"
        data-slot={`desktop-appearance-${popoverId}-popover`}
        sideOffset={12}
        className="z-[20000] flex h-[min(28rem,calc(100dvh-8rem))] max-h-[min(28rem,calc(100dvh-8rem))] w-[min(18rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-[16px] border border-[var(--desktop-appearance-popover-border)] bg-[var(--desktop-appearance-popover-bg)] p-0 text-[var(--desktop-inspector-fg-secondary)] shadow-[var(--desktop-appearance-popover-shadow)] backdrop-blur-xl"
      >
        <ScrollArea
          chevron
          cueSize="comfortable"
          className="h-full min-h-0 flex-1"
          data-slot="desktop-inspector-scroll-area"
          scrollFade
          viewportClassName="px-3 py-3"
        >
          <div data-slot="desktop-inspector-scroll">
            <div data-slot="desktop-floating-inspector">{renderControls({ appearance, onPatch })}</div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}

function DesktopDynamicIslandDivider() {
  return (
    <div
      aria-hidden="true"
      className="mx-0.5 h-6 w-px shrink-0 bg-[var(--desktop-glass-border)]"
    />
  )
}

export function DesktopHistoryActionButtons({
  canRedo,
  canUndo,
  onRedo,
  onResetDefaults,
  onUndo,
}: {
  canRedo?: boolean
  canUndo?: boolean
  onRedo?: () => void
  onResetDefaults?: () => void
  onUndo?: () => void
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-0.5"
      data-slot="desktop-history-actions"
    >
      <DesktopTooltip content="Reset defaults" side="bottom" sideOffset={10}>
        <DesktopUtilityToolbarButton
          aria-label="Reset defaults"
          disabled={!onResetDefaults}
          onClick={onResetDefaults}
        >
          <RotateCcwIcon className="size-3.5" />
        </DesktopUtilityToolbarButton>
      </DesktopTooltip>
      <DesktopTooltip content="Undo" side="bottom" sideOffset={10}>
        <DesktopUtilityToolbarButton
          aria-label="Undo"
          disabled={!canUndo || !onUndo}
          onClick={onUndo}
        >
          <Undo2Icon className="size-3.5" />
        </DesktopUtilityToolbarButton>
      </DesktopTooltip>
      <DesktopTooltip content="Redo" side="bottom" sideOffset={10}>
        <DesktopUtilityToolbarButton
          aria-label="Redo"
          disabled={!canRedo || !onRedo}
          onClick={onRedo}
        >
          <Redo2Icon className="size-3.5" />
        </DesktopUtilityToolbarButton>
      </DesktopTooltip>
    </div>
  )
}

export function DesktopAppearanceIsland({
  appearance,
  layerLabel,
  onPatch,
}: {
  appearance: DesktopAppearanceSnapshot
  layerLabel: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-1 px-1"
      data-slot="desktop-appearance-island"
    >
      <div
        className={cn(
          "hidden min-w-0 max-w-[7rem] truncate px-1 text-[11px] font-semibold sm:block",
          DESKTOP_INSPECTOR_FG_SECONDARY,
        )}
      >
        {layerLabel}
      </div>
      {APPEARANCE_POPOVERS.map((popover) => (
        <DesktopAppearancePopover
          key={popover.id}
          appearance={appearance}
          label={getAppearancePopoverLabel(popover.id, appearance)}
          onPatch={onPatch}
          popoverId={popover.id}
          renderControls={popover.renderControls}
          renderIcon={popover.renderIcon}
        />
      ))}
    </div>
  )
}

function DesktopFreeEditToggle({
  enabled,
  onChange,
}: {
  enabled: boolean
  onChange: (enabled: boolean) => void
}) {
  return (
    <DesktopTooltip
      content={enabled ? "Free edit on — canvas layers unlocked" : "Template mode — canvas layers locked"}
      side="bottom"
      sideOffset={10}
    >
      <label
        className="flex min-w-0 cursor-pointer items-center gap-1.5 rounded-full px-1.5 py-1 text-[11px] font-semibold text-[var(--desktop-toolbar-fg)] transition-colors hover:text-[var(--desktop-toolbar-fg-hover)]"
        data-slot="desktop-free-edit-toggle"
      >
        <MousePointer2Icon className="size-3.5 shrink-0" />
        <span className="hidden sm:inline">Free edit</span>
        <Switch
          aria-label="Free edit"
          checked={enabled}
          onCheckedChange={onChange}
          size="sm"
        />
      </label>
    </DesktopTooltip>
  )
}

export function DesktopDynamicIslandChrome({
  appearance,
  canRedo,
  canUndo,
  isFreeEditingEnabled = true,
  layerLabel,
  onPatch,
  onFreeEditingChange,
  onRedo,
  onResetDefaults,
  onThemeChange,
  onUndo,
  scanSafetyResult = DEFAULT_SCAN_SAFETY_RESULT,
  theme = "dark",
}: {
  appearance?: DesktopAppearanceSnapshot | null
  canRedo?: boolean
  canUndo?: boolean
  isFreeEditingEnabled?: boolean
  layerLabel?: string | null
  onPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onFreeEditingChange?: (enabled: boolean) => void
  onRedo?: () => void
  onResetDefaults?: () => void
  onThemeChange?: (theme: DesktopThemeMode) => void
  onUndo?: () => void
  scanSafetyResult?: ScanSafetyResult
  theme?: DesktopThemeMode
}) {
  const hasAppearance = Boolean(isFreeEditingEnabled && appearance && layerLabel && onPatch)

  return (
    <DynamicIsland
      appearance="desktop-glass"
      idleContent={
        <div
          className="flex min-w-0 items-center gap-1 px-1"
          data-slot="desktop-dynamic-island-content"
        >
          <DesktopHistoryActionButtons
            canRedo={canRedo}
            canUndo={canUndo}
            onRedo={onRedo}
            onResetDefaults={onResetDefaults}
            onUndo={onUndo}
          />
          {onFreeEditingChange ? (
            <>
              <DesktopDynamicIslandDivider />
              <DesktopFreeEditToggle
                enabled={isFreeEditingEnabled}
                onChange={onFreeEditingChange}
              />
            </>
          ) : null}
          {hasAppearance ? (
            <>
              <DesktopDynamicIslandDivider />
              <DesktopAppearanceIsland
                appearance={appearance!}
                layerLabel={layerLabel!}
                onPatch={onPatch!}
              />
            </>
          ) : null}
          <DesktopScanSafetyPopover result={scanSafetyResult} />
          <DesktopDynamicIslandDivider />
          <DesktopKeyboardShortcutsTrigger popoverSide="bottom" variant="glass" />
          {onThemeChange ? (
            <DesktopThemeToggleButton
              theme={theme}
              onToggle={() => onThemeChange(theme === "light" ? "dark" : "light")}
              variant="glass"
            />
          ) : null}
        </div>
      }
      showViewControls={false}
      className={cn(hasAppearance && "min-w-[12rem]")}
    />
  )
}
