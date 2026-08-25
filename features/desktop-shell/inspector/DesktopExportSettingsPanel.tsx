"use client"

import {
  OptionGrid,
  PresetList,
  SettingsPrimaryButton,
  SettingsRowPopover,
} from "@/features/desktop-shell/inspector/settings-ui"
import type {
  DesktopExportMediaKind,
  DesktopExportTarget,
  DesktopRasterExportPresetId,
} from "@/features/desktop-shell/model/desktop-toolbar-types"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
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

const EXPORT_MEDIA_OPTIONS: Array<{ label: string; value: DesktopExportMediaKind }> = [
  { label: "Photo", value: "photo" },
  { label: "Video", value: "video" },
]

const EXPORT_FORMAT_OPTIONS: QrFileExtension[] = ["svg", "png", "webp", "jpeg"]

const VIDEO_DURATION_OPTIONS = ["5 seconds", "10 seconds"] as const
const VIDEO_FPS_OPTIONS = ["30 fps", "60 fps"] as const
const VIDEO_FORMAT_OPTIONS = ["MP4", "WebM"] as const
const VIDEO_SIZE_OPTIONS = ["1080p long edge", "2160p long edge"] as const

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

  const mediaKindLabel =
    EXPORT_MEDIA_OPTIONS.find((option) => option.value === actualExportSettings.mediaKind)?.label ??
    "Photo"

  const isVideoExport = actualExportSettings.mediaKind === "video"
  const canExportVideo = controller?.canExportVideo ?? false
  const canDownload = controller?.canExportDownload ?? true
  const exportInProgress = controller?.exportInProgress ?? false

  const durationLabel =
    actualExportSettings.videoDurationSeconds === 10 ? "10 seconds" : "5 seconds"
  const fpsLabel = actualExportSettings.videoFrameRate === 60 ? "60 fps" : "30 fps"
  const videoFormatLabel = actualExportSettings.videoFormat === "webm" ? "WebM" : "MP4"
  const videoSizeLabel =
    actualExportSettings.videoLongEdge === 2160 ? "2160p long edge" : "1080p long edge"

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
      <SettingsRowPopover hint="Media" title="Media" trigger={mediaKindLabel}>
        <PresetList
          items={EXPORT_MEDIA_OPTIONS.map((option) => option.label)}
          selected={mediaKindLabel}
          onSelect={(label) => {
            const next = EXPORT_MEDIA_OPTIONS.find((option) => option.label === label)
            if (!next) return
            if (next.value === "video" && !canExportVideo) return
            onExportSettingsChange({ mediaKind: next.value })
          }}
        />
        {!canExportVideo ? (
          <p className="dn-type-meta px-1 pt-2 text-center">
            Video appears when motion shaders or animated QR are enabled.
          </p>
        ) : null}
      </SettingsRowPopover>
      {!isVideoExport ? (
        <>
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
        </>
      ) : (
        <>
          <SettingsRowPopover hint="Duration" title="Duration" trigger={durationLabel}>
            <PresetList
              items={[...VIDEO_DURATION_OPTIONS]}
              selected={durationLabel}
              onSelect={(label) =>
                onExportSettingsChange({
                  videoDurationSeconds: label.startsWith("10") ? 10 : 5,
                })
              }
            />
          </SettingsRowPopover>
          <SettingsRowPopover hint="Frame rate" title="Frame rate" trigger={fpsLabel}>
            <PresetList
              items={[...VIDEO_FPS_OPTIONS]}
              selected={fpsLabel}
              onSelect={(label) =>
                onExportSettingsChange({
                  videoFrameRate: label.startsWith("60") ? 60 : 30,
                })
              }
            />
          </SettingsRowPopover>
          <SettingsRowPopover hint="Format" title="Format" trigger={videoFormatLabel}>
            <PresetList
              items={[...VIDEO_FORMAT_OPTIONS]}
              selected={videoFormatLabel}
              onSelect={(format) =>
                onExportSettingsChange({
                  videoFormat: format === "WebM" ? "webm" : "mp4",
                })
              }
            />
          </SettingsRowPopover>
          <SettingsRowPopover hint="Size" title="Size" trigger={videoSizeLabel}>
            <PresetList
              items={[...VIDEO_SIZE_OPTIONS]}
              selected={videoSizeLabel}
              onSelect={(label) =>
                onExportSettingsChange({
                  videoLongEdge: label.startsWith("2160") ? 2160 : 1080,
                })
              }
            />
          </SettingsRowPopover>
        </>
      )}
      <SettingsPrimaryButton
        data-slot="desktop-export-download-confirm"
        disabled={!canDownload || exportInProgress}
        onClick={() => controller?.onExportDownload?.()}
      >
        {exportInProgress ? "Exporting..." : "Download"}
      </SettingsPrimaryButton>
      {exportInProgress ? (
        <button
          className="text-center text-[11px] text-[var(--desktop-inspector-fg-secondary)] underline-offset-2 hover:underline"
          type="button"
          onClick={() => controller?.onExportCancel?.()}
        >
          Cancel export
        </button>
      ) : null}
      {controller?.exportProgressLabel ? (
        <p className="dn-type-meta text-center">{controller.exportProgressLabel}</p>
      ) : null}
      {controller?.exportDownloadError ? (
        <p className="text-center text-[11px] text-red-500">{controller.exportDownloadError}</p>
      ) : null}
      {!isVideoExport && actualExportSettings.usePlatformPreset ? (
        <p className="dn-type-meta text-center">
          {formatExportPresetLabel(selectedPreset)}
        </p>
      ) : null}
    </div>
  )
}
