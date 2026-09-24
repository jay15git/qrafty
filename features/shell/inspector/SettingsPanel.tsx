"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import {
  BadgeAlertIcon,
  BadgeCheckIcon,
  BadgeMinusIcon,
  BadgeXIcon,
  MoonIcon,
  SunIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import { KeyboardIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { useOptionalBlurFadeThemeTransition } from "@/components/ui/BlurFadeThemeTransition";
import { cuelumeAttrs } from "@/features/shell/audio/cuelume";
import { BrandMark } from "@/features/shell/components/BrandMark";
import { KeyboardShortcutsPopoverContent } from "@/features/shell/components/KeyboardShortcutsPopover";
import { RedoIcon, UndoIcon } from "@/features/shell/components/toolbar-icons";
import type { InspectorModel } from "@/features/shell/hooks/use-toolbar-inspector-model";
import { useCuelume } from "@/features/shell/hooks/use-cuelume";
import {
  SETTINGS_SECTIONS,
  SECTION_TO_TOOL,
  type SettingsSectionId,
} from "@/features/shell/inspector/settings-panel-meta";
import { SettingsSectionBody } from "@/features/shell/inspector/SettingsSections";
import {
  SettingsAccordion,
  SettingsPanelShell,
  SettingsScroll,
} from "@/features/shell/inspector/settings-ui";
import type { ScanSafetyResult } from "@/features/qr/scan-safety/types";
import { cn } from "@/lib/utils";

const PANEL_ICON_BUTTON_CLASS =
  "flex size-8 cursor-pointer items-center justify-center rounded-full text-[var(--fg)] transition-colors hover:bg-[var(--control)] disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-4";

function PanelIconButton({
  className,
  cuelume = "button",
  ...props
}: ComponentProps<"button"> & {
  cuelume?: "button" | "none" | "toggle";
}) {
  return (
    <button
      type="button"
      className={cn(PANEL_ICON_BUTTON_CLASS, className)}
      {...cuelumeAttrs(cuelume)}
      {...props}
    />
  );
}

function scanSafetyBadge(result: ScanSafetyResult | undefined): {
  icon: ReactNode;
  label: string;
  tone: "safe" | "unsafe" | "pending" | "muted";
} {
  const iconClass = "size-4 shrink-0";
  switch (result?.status) {
    case "valid":
      return {
        icon: <BadgeCheckIcon className={iconClass} />,
        label: "Scan Safe",
        tone: "safe",
      };
    case "invalid":
      return {
        icon: <BadgeXIcon className={iconClass} />,
        label: "Scan Unsafe",
        tone: "unsafe",
      };
    case "pending":
      return {
        icon: <BadgeAlertIcon className={iconClass} />,
        label: "Checking…",
        tone: "pending",
      };
    case "skipped":
      return {
        icon: <BadgeMinusIcon className={iconClass} />,
        label: "No content",
        tone: "muted",
      };
    default:
      return {
        icon: <BadgeAlertIcon className={iconClass} />,
        label: "Unavailable",
        tone: "muted",
      };
  }
}

const SCAN_BADGE_TONE_CLASS = {
  safe: "text-emerald-600 dark:text-emerald-400",
  unsafe: "text-red-600 dark:text-red-400",
  pending: "text-amber-600 dark:text-amber-400",
  muted: "text-[var(--muted)]",
} as const;

function SettingsPanelHeader({ model }: { model: InspectorModel }) {
  const controller = model.controller;
  const badge = scanSafetyBadge(controller?.scanSafetyResult);

  return (
    <div
      className="flex items-center justify-between px-2 py-1.5"
      data-slot="settings-panel-header"
    >
      <PanelIconButton
        aria-label="Undo"
        data-slot="undo-trigger"
        disabled={!controller?.canUndo || !controller.onUndo}
        onClick={controller?.onUndo}
      >
        <UndoIcon className="size-4" />
      </PanelIconButton>
      <div
        aria-live="polite"
        className={cn(
          "flex items-center gap-1.5 text-sm font-medium",
          SCAN_BADGE_TONE_CLASS[badge.tone],
        )}
        data-slot="scan-safety-badge"
        data-status={controller?.scanSafetyResult?.status ?? "unavailable"}
      >
        {badge.icon}
        <span>{badge.label}</span>
      </div>
      <PanelIconButton
        aria-label="Redo"
        data-slot="redo-trigger"
        disabled={!controller?.canRedo || !controller.onRedo}
        onClick={controller?.onRedo}
      >
        <RedoIcon className="size-4" />
      </PanelIconButton>
    </div>
  );
}

function SettingsPanelFooter({ model }: { model: InspectorModel }) {
  const { soundsEnabled, toggleSoundsEnabled } = useCuelume();
  const themeTransition = useOptionalBlurFadeThemeTransition();
  const theme = model.actualTheme;

  return (
    <div
      className="flex items-center justify-center gap-2 px-2 py-1.5"
      data-slot="settings-panel-footer"
    >
      <Popover modal={false}>
        <PopoverTrigger asChild>
          <PanelIconButton
            aria-label="Open keyboard shortcuts"
            data-slot="keyboard-shortcuts-trigger"
          >
            <HugeiconsIcon icon={KeyboardIcon} size={16} color="currentColor" strokeWidth={2} />
          </PanelIconButton>
        </PopoverTrigger>
        <KeyboardShortcutsPopoverContent popoverSide="top" theme={theme} />
      </Popover>
      <PanelIconButton
        aria-label={soundsEnabled ? "Mute interaction sounds" : "Enable interaction sounds"}
        cuelume="toggle"
        data-slot="sounds-toggle"
        onClick={toggleSoundsEnabled}
      >
        {soundsEnabled ? <Volume2Icon /> : <VolumeXIcon />}
      </PanelIconButton>
      <PanelIconButton
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        cuelume="toggle"
        data-slot="theme-toggle"
        onClick={() => {
          if (themeTransition) {
            themeTransition.triggerTransition();
          } else {
            model.onThemeChange(theme === "light" ? "dark" : "light");
          }
        }}
      >
        {theme === "light" ? <MoonIcon /> : <SunIcon />}
      </PanelIconButton>
    </div>
  );
}

type SettingsPanelProps = {
  fillHeight?: boolean;
  model: InspectorModel;
  openSection?: string;
  onOpenSectionChange?: (section: string | undefined) => void;
};

export function SettingsPanel({
  fillHeight = false,
  model,
  openSection: openSectionProp,
  onOpenSectionChange,
}: SettingsPanelProps) {
  const [internalOpenSection, setInternalOpenSection] = useState<string | undefined>(undefined);
  const openSection = openSectionProp ?? internalOpenSection;
  const setOpenSection = onOpenSectionChange ?? setInternalOpenSection;

  function handleSectionChange(section: string | undefined) {
    setOpenSection(section);
    if (!section) {
      return;
    }

    const tool = SECTION_TO_TOOL[section as SettingsSectionId];
    if (tool) {
      model.onActiveToolChange(tool);
    }
  }

  return (
    <SettingsPanelShell fillHeight={fillHeight}>
      <SettingsScroll fillHeight={fillHeight}>
        <div className="dn-settings-rail-track dn-settings-brand-row" data-slot="brand-mark-anchor">
          <div className="dn-settings-rail-track__inner">
            <BrandMark theme={model.actualTheme} />
          </div>
        </div>
        <SettingsAccordion
          header={<SettingsPanelHeader model={model} />}
          footer={<SettingsPanelFooter model={model} />}
          openSection={openSection}
          renderSection={(section) => <SettingsSectionBody id={section} model={model} />}
          sections={SETTINGS_SECTIONS}
          onOpenSectionChange={handleSectionChange}
        />
      </SettingsScroll>
    </SettingsPanelShell>
  );
}
