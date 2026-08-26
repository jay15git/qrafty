"use client"

import { useEffect, useRef, useState } from "react"

import { DesktopBrandMark } from "@/features/desktop-shell/components/DesktopBrandMark"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import {
  DESKTOP_SETTINGS_SECTIONS,
  SECTION_TO_TOOL,
  sectionForTool,
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
  const skipInitialAccordionSyncRef = useRef(true)

  useEffect(() => {
    if (skipInitialAccordionSyncRef.current) {
      skipInitialAccordionSyncRef.current = false
      return
    }

    setOpenSection(sectionForTool(model.actualActiveTool))
  }, [model.actualActiveTool, setOpenSection])

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
          openSection={openSection}
          renderSection={(section) => (
            <SettingsSectionBody id={section} model={model} />
          )}
          sections={DESKTOP_SETTINGS_SECTIONS}
          onOpenSectionChange={handleSectionChange}
        />
      </SettingsScroll>
    </SettingsPanelShell>
  )
}
