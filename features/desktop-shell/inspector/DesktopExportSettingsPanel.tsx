"use client"

import {
  OptionGrid,
  PresetList,
  SettingsPrimaryButton,
  SettingsRowPopover,
} from "@/features/desktop-shell/inspector/settings-ui"
import type {
  DesktopExportTarget,
  DesktopInspectorModel,
  DesktopRasterExportPresetId,
} from "@/features/desktop-shell/components/FloatingToolbar"
import {
  EXPORT_PRESETS,
  formatExportPresetLabel,
} from "@/features/workspace/model/export-presets"
import type { QrFileExtension } from "@/features/qr-code/model/types"

const SECTION_STACK = "flex flex-col gap-2.5"

const EXPORT_TARGET_OPTIONS: Array<{ label: string; value: DesktopExportTarget }> = [
  { label: "Current QR", value: "current" },
  { label: "All QR codes", value: "all-qr" },
  { label: "Full surface", value: "surface" },
]

const EXPORT_FORMAT_OPTIONS: QrFileExtension[] = ["svg", "png", "webp", "jpeg"]

const RASTER_QUALITY_PRESETS: Array<{
  id: DesktopRasterExportPresetId
  label: string
}> = [
  { id: "quick-share", label: "Quick share" },
  { id: "web-social", label: "Web & social" },
  { id: "small-print", label: "Small print" },
  { id: "flyer-poster", label: "Flyer / poster" },
  { id: "large-format", label: "Large format" },
  { id: "max-quality", label: "Max quality" },
]

export function DesktopExportSettingsPanel({ model }: { model: DesktopInspectorModel }) {
  const { actualExportSettings, controller, onExportSettingsChange } = model
  const selectedPreset =
    EXPORT_PRESETS.find((preset) => preset.id === actualExportSettings.exportPresetId) ??
    EXPORT_PRESETS[0]
  const selectedQuality =
    RASTER_QUALITY_PRESETS.find((preset) => preset.id === actualExportSettings.qualityPresetId) ??
    RASTER_QUALITY_PRESETS[1]

  const targetLabel =
    EXPORT_TARGET_OPTIONS.find((option) => option.value === actualExportSettings.target)?.label ??
    "Current QR"

  return (
    <div className={SECTION_STACK} data-slot="desktop-export-settings-panel">
      <SettingsRowPopover hint="Target" title="Target" trigger={targetLabel}>
        <PresetList
          items={EXPORT_TARGET_OPTIONS.map((option) => option.label)}
          selected={targetLabel}
          onSelect={(label) => {
            const next = EXPORT_TARGET_OPTIONS.find((option) => option.label === label)
            if (next) onExportSettingsChange({ target: next.value })
          }}
        />
      </SettingsRowPopover>
      <SettingsRowPopover
        hint="Format"
        title="Format"
        trigger={actualExportSettings.extension.toUpperCase()}
      >
        <OptionGrid
          columns={4}
          items={EXPORT_FORMAT_OPTIONS.map((format) => format.toUpperCase())}
          selected={actualExportSettings.extension.toUpperCase()}
          onSelect={(format) =>
            onExportSettingsChange({
              extension: format.toLowerCase() as QrFileExtension,
            })
          }
        />
      </SettingsRowPopover>
      <SettingsRowPopover
        hint="Platform size"
        title="Platform size"
        trigger={
          actualExportSettings.usePlatformPreset ? selectedPreset.label : "Custom"
        }
      >
        <PresetList
          items={EXPORT_PRESETS.map((preset) => preset.label)}
          selected={selectedPreset.label}
          onSelect={(label) => {
            const preset = EXPORT_PRESETS.find((entry) => entry.label === label)
            if (!preset) return
            onExportSettingsChange({
              exportPresetId: preset.id,
              extension: preset.format,
              usePlatformPreset: true,
            })
          }}
        />
      </SettingsRowPopover>
      <SettingsRowPopover hint="Quality" title="Quality" trigger={selectedQuality.label}>
        <PresetList
          items={RASTER_QUALITY_PRESETS.map((preset) => preset.label)}
          selected={selectedQuality.label}
          onSelect={(label) => {
            const preset = RASTER_QUALITY_PRESETS.find((entry) => entry.label === label)
            if (!preset) return
            onExportSettingsChange({
              qualityPresetId: preset.id,
              usePlatformPreset: false,
            })
          }}
        />
      </SettingsRowPopover>
      <SettingsPrimaryButton
        data-slot="desktop-export-download-confirm"
        onClick={() => controller?.onExportDownload?.()}
      >
        Download
      </SettingsPrimaryButton>
      {controller?.exportDownloadError ? (
        <p className="text-center text-[11px] text-red-500">{controller.exportDownloadError}</p>
      ) : null}
      {actualExportSettings.usePlatformPreset ? (
        <p className="dn-type-meta text-center">
          {formatExportPresetLabel(selectedPreset)}
        </p>
      ) : null}
    </div>
  )
}
