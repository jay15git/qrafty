"use client"

import { useState } from "react"

import { AdaptiveSlider } from "@/components/watermelon/adaptive-slider"
import { DesktopBrandMark } from "@/features/desktop-shell/components/DesktopBrandMark"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import {
  DESKTOP_SETTINGS_SECTIONS,
  SECTION_TO_TOOL,
  type DesktopSettingsSectionId,
} from "@/features/desktop-shell/inspector/desktopnew-settings-panel-meta"
import { SettingsSectionBody } from "@/features/desktop-shell/inspector/desktopnew-settings-sections"
import {
  SettingsAccordion,
  SettingsPanelShell,
  SettingsScroll,
} from "@/features/desktop-shell/inspector/settings-ui"

type DesktopNewSettingsPanelProps = {
  fillHeight?: boolean
  model: DesktopInspectorModel
  openSection?: string
  onOpenSectionChange?: (section: string | undefined) => void
}

export function DesktopNewSettingsPanel({
  fillHeight = false,
  model,
  openSection: openSectionProp,
  onOpenSectionChange,
}: DesktopNewSettingsPanelProps) {
  const [internalOpenSection, setInternalOpenSection] = useState<string | undefined>(undefined)
  const openSection = openSectionProp ?? internalOpenSection
  const setOpenSection = onOpenSectionChange ?? setInternalOpenSection
  const scanSafetyScore = model.controller?.scanSafetyResult?.score ?? null

  function handleSectionChange(section: string | undefined) {
    setOpenSection(section)
    if (!section) {
      return
    }

    const tool = SECTION_TO_TOOL[section as DesktopSettingsSectionId]
    if (tool) {
      model.onActiveToolChange(tool)
    }
  }

  return (
    <SettingsPanelShell fillHeight={fillHeight}>
      <SettingsScroll fillHeight={fillHeight}>
        <div className="dn-settings-rail-track dn-settings-brand-row" data-slot="desktop-brand-mark-anchor">
          <div className="dn-settings-rail-track__inner">
            <DesktopBrandMark theme={model.actualDesktopTheme} />
          </div>
        </div>
        <SettingsAccordion
          footer={
            <div className="px-4 pb-3 pt-2">
              <AdaptiveSlider
                max={100}
                min={0}
                readOnly
                step={1}
                indeterminate={scanSafetyScore === null}
                value={scanSafetyScore ?? 50}
              />
            </div>
          }
          matchCanvasHeight={fillHeight}
          openSection={openSection}
          renderSection={(section) => (
            <SettingsSectionBody id={section} model={model} />
          )}
          sections={DESKTOP_SETTINGS_SECTIONS.filter(
            (section) => section !== "Elements",
          )}
          onOpenSectionChange={handleSectionChange}
        />
      </SettingsScroll>
    </SettingsPanelShell>
  )
}
