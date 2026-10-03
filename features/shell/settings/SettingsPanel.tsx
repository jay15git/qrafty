"use client";

import { useState, type ComponentProps } from "react";
import { MoonIcon, SunIcon, Volume2Icon, VolumeXIcon } from "lucide-react";
import { KeyboardIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

import { Popover, PopoverTrigger } from "@/components/ui/popover";
import { useOptionalBlurFadeThemeTransition } from "@/components/ui/BlurFadeThemeTransition";
import { cuelumeAttrs } from "@/features/shell/audio/cuelume";
import { BrandMark } from "@/features/shell/components/BrandMark";
import { KeyboardShortcutsPopoverContent } from "@/features/shell/components/KeyboardShortcutsPopover";
import { RedoIcon, UndoIcon } from "@/features/shell/components/toolbar-icons";
import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import { useCuelume } from "@/features/shell/hooks/use-cuelume";
import {
  SETTINGS_SECTIONS,
  SECTION_TO_TOOL,
  type SettingsSectionId,
} from "@/features/shell/settings/settings-panel-meta";
import { SettingsSectionBody } from "@/features/shell/settings/SettingsSections";
import { SettingsAccordion, SettingsPanelShell } from "@/features/shell/settings/settings-ui";
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

function SettingsPanelHeader({ model }: { model: SettingsModel }) {
  const controller = model.controller;

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

function SettingsPanelFooter({ model }: { model: SettingsModel }) {
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
  model: SettingsModel;
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
      <div className="ds-settings-rail-track ds-settings-brand-row" data-slot="brand-mark-anchor">
        <div className="ds-settings-rail-track__inner">
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
    </SettingsPanelShell>
  );
}
