"use client"

import {
  MousePointer2Icon,
  Redo2Icon,
  SquareRoundCornerIcon,
  SquareIcon,
  Undo2Icon,
} from "lucide-react"
import { type ReactNode } from "react"

import { ScrollArea } from "@/components/ui/scroll-area"

import {
  AppearanceOutlineControls,
  AppearanceRadiusControls,
} from "@/features/desktop-shell/components/AppearancePopoverControls"
import {
  DesktopKeyboardShortcutsTrigger,
  DesktopThemeToggleButton,
} from "@/features/desktop-shell/components/DesktopChromeControls"
import { DesktopCanvasRatioPresetRow } from "@/features/desktop-shell/components/DesktopCanvasRatioPresetRow"
import type { DesktopThemeMode } from "@/features/desktop-shell/components/FloatingToolbar"
import { DesktopUtilityToolbarButton } from "@/features/desktop-shell/components/DesktopUtilityToolbar"
import type { DesktopAppearanceSnapshot } from "@/features/desktop-shell/model/appearance"
import DynamicIsland from "@/components/smoothui/dynamic-island"
import { DesktopTooltip } from "@/features/desktop-shell/components/DesktopTooltip"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Switch } from "@/components/ui/switch"
import type { DraftingCanvasLayer } from "@/features/workspace/model/layers"
import type { SizeTemplate } from "@/features/workspace/model/size-templates"
import { cn } from "@/lib/utils"

type AppearancePopoverId = "radius" | "outline"

function getAppearancePopoverLabel(
  popoverId: AppearancePopoverId,
  appearance: DesktopAppearanceSnapshot,
): string {
  switch (popoverId) {
    case "outline":
      return "Outline settings"
    case "radius":
      return "Corner radius settings"
  }
}

const APPEARANCE_POPOVERS: Array<{
  id: AppearancePopoverId
  renderIcon: () => ReactNode
  renderControls: (props: {
    appearance: DesktopAppearanceSnapshot
    onPatch: (patch: Partial<DraftingCanvasLayer>) => void
    theme: DesktopThemeMode
  }) => ReactNode
}> = [
  {
    id: "outline",
    renderIcon: () => <SquareIcon className="size-3.5" />,
    renderControls: ({ appearance, onPatch, theme }) => (
      <AppearanceOutlineControls appearance={appearance} onPatch={onPatch} theme={theme} />
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
  theme,
}: {
  appearance: DesktopAppearanceSnapshot
  label: string
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  popoverId: AppearancePopoverId
  theme: DesktopThemeMode
  renderControls: (props: {
    appearance: DesktopAppearanceSnapshot
    onPatch: (patch: Partial<DraftingCanvasLayer>) => void
    theme: DesktopThemeMode
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
            <div data-slot="desktop-floating-inspector">{renderControls({ appearance, onPatch, theme })}</div>
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

function DesktopHistoryActionButtons({
  canRedo,
  canUndo,
  onRedo,
  onUndo,
}: {
  canRedo?: boolean
  canUndo?: boolean
  onRedo?: () => void
  onUndo?: () => void
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-0.5"
      data-slot="desktop-history-actions"
    >
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

function DesktopAppearanceIsland({
  appearance,
  onPatch,
  theme,
}: {
  appearance: DesktopAppearanceSnapshot
  onPatch: (patch: Partial<DraftingCanvasLayer>) => void
  theme: DesktopThemeMode
}) {
  return (
    <div
      className="flex min-w-0 items-center gap-1 px-1"
      data-slot="desktop-appearance-island"
    >
      {APPEARANCE_POPOVERS.map((popover) => (
        <DesktopAppearancePopover
          key={popover.id}
          appearance={appearance}
          label={getAppearancePopoverLabel(popover.id, appearance)}
          onPatch={onPatch}
          popoverId={popover.id}
          renderControls={popover.renderControls}
          renderIcon={popover.renderIcon}
          theme={theme}
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
  onPatch,
  onFreeEditingChange,
  onRedo,
  onSelectSizeTemplate,
  onThemeChange,
  onUndo,
  sizePresetId,
  theme = "dark",
}: {
  appearance?: DesktopAppearanceSnapshot | null
  canRedo?: boolean
  canUndo?: boolean
  isFreeEditingEnabled?: boolean
  onPatch?: (patch: Partial<DraftingCanvasLayer>) => void
  onFreeEditingChange?: (enabled: boolean) => void
  onRedo?: () => void
  onSelectSizeTemplate?: (template: SizeTemplate) => void
  onThemeChange?: (theme: DesktopThemeMode) => void
  onUndo?: () => void
  sizePresetId?: string
  theme?: DesktopThemeMode
}) {
  const hasAppearance = Boolean(isFreeEditingEnabled && appearance && onPatch)
  const hasCanvasRatioControls = Boolean(onSelectSizeTemplate)

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
            onUndo={onUndo}
          />
          {onSelectSizeTemplate ? (
            <>
              <DesktopDynamicIslandDivider />
              <DesktopCanvasRatioPresetRow
                selectedPresetId={sizePresetId}
                onSelectTemplate={onSelectSizeTemplate}
              />
            </>
          ) : null}
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
                onPatch={onPatch!}
                theme={theme}
              />
            </>
          ) : null}
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
      className={cn(
        hasAppearance && "min-w-[12rem]",
        hasCanvasRatioControls && "min-w-[18rem]",
      )}
    />
  )
}
