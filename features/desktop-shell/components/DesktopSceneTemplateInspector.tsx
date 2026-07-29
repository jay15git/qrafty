"use client"

import { DesktopSizeTemplateInspector } from "@/features/desktop-shell/components/DesktopSizeTemplateInspector"
import {
  DesktopInspectorHeader,
  DesktopInspectorScrollArea,
} from "@/features/desktop-shell/components/DesktopInspectorShell"
import type { DesktopCardSizeSettings } from "@/features/desktop-shell/components/DesktopSizeTemplateInspector"
import type { SizeTemplate } from "@/features/workspace/model/size-templates"

export type DesktopSceneTemplateSettings = {
  sizeSettings: DesktopCardSizeSettings
}

type DesktopSceneTemplateInspectorProps = {
  onSizeSettingsChange: (patch: Partial<DesktopCardSizeSettings>) => void
  onSelectSizeTemplate: (template: SizeTemplate) => void
  settings: DesktopSceneTemplateSettings
}

export function DesktopSceneTemplateInspector({
  onSizeSettingsChange,
  onSelectSizeTemplate,
  settings,
}: DesktopSceneTemplateInspectorProps) {
  return (
    <div data-slot="desktop-scene-template-inspector" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <DesktopInspectorHeader title="Templates" />
      <DesktopInspectorScrollArea>
        <DesktopSizeTemplateInspector
          onChange={onSizeSettingsChange}
          onSelectTemplate={onSelectSizeTemplate}
          settings={settings.sizeSettings}
        />
      </DesktopInspectorScrollArea>
    </div>
  )
}
