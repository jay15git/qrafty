"use client"

import { DesktopInspectorElasticSliderRow } from "@/features/desktop-shell/components/DesktopInspectorShell"
import {
  SegmentTabs,
  SettingsPrimaryButton,
  SettingsTabPanel,
} from "@/features/desktop-shell/inspector/settings-ui"
import type {
  DesktopExportMediaKind,
  DesktopExportScale,
} from "@/features/desktop-shell/model/desktop-toolbar-types"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import {
  formatExportPixelDimensions,
  resolveActiveExportDimensions,
} from "@/features/workspace/export/export-labels"
import {
  clampExportScale,
  formatExportScaleLabel,
} from "@/features/workspace/export/export-scale"
import type { QrFileExtension } from "@/features/qr-code/model/types"

const SECTION_STACK = "flex flex-col gap-2.5"

const MEDIA_TABS = ["Photo", "Video"] as const
const PHOTO_FORMAT_OPTIONS = ["PNG", "JPEG", "WebP"] as const
const VIDEO_FORMAT_OPTIONS = ["MP4", "WebM"] as const
const VIDEO_DURATION_OPTIONS = ["5 sec", "10 sec"] as const
const VIDEO_FPS_OPTIONS = ["30 fps", "60 fps"] as const
const VIDEO_SIZE_OPTIONS = ["1080p", "2160p"] as const

function photoFormatToExtension(format: (typeof PHOTO_FORMAT_OPTIONS)[number]): QrFileExtension {
  if (format === "JPEG") return "jpeg"
  if (format === "WebP") return "webp"
  return "png"
}

function extensionToPhotoFormat(extension: QrFileExtension): (typeof PHOTO_FORMAT_OPTIONS)[number] {
  if (extension === "jpeg") return "JPEG"
  if (extension === "webp") return "WebP"
  return "PNG"
}

function mediaKindToTab(mediaKind: DesktopExportMediaKind): (typeof MEDIA_TABS)[number] {
  return mediaKind === "video" ? "Video" : "Photo"
}

export function DesktopExportSettingsPanel({ model }: { model: DesktopInspectorModel }) {
  const { actualExportSettings, controller, onExportSettingsChange } = model
  const artboardWidth = model.actualSceneTemplateSettings.sizeSettings.cardWidth
  const artboardHeight = model.actualSceneTemplateSettings.sizeSettings.cardHeight
  const activeExportDimensions = resolveActiveExportDimensions({
    artboardHeight,
    artboardWidth,
    exportScale: actualExportSettings.exportScale,
  })
  const mediaTab = mediaKindToTab(actualExportSettings.mediaKind)
  const isVideoExport = actualExportSettings.mediaKind === "video"
  const canExportVideo = controller?.canExportVideo ?? false
  const canDownload = controller?.canExportDownload ?? true
  const exportInProgress = controller?.exportInProgress ?? false
  const selectedPhotoFormat = extensionToPhotoFormat(actualExportSettings.extension)
  const resolutionLabel = `${formatExportScaleLabel(actualExportSettings.exportScale)} · ${formatExportPixelDimensions(activeExportDimensions.width, activeExportDimensions.height)}`

  const durationLabel = actualExportSettings.videoDurationSeconds === 10 ? "10 sec" : "5 sec"
  const fpsLabel = actualExportSettings.videoFrameRate === 60 ? "60 fps" : "30 fps"
  const videoFormatLabel = actualExportSettings.videoFormat === "webm" ? "WebM" : "MP4"
  const videoSizeLabel = actualExportSettings.videoLongEdge === 2160 ? "2160p" : "1080p"

  return (
    <div className={SECTION_STACK} data-slot="desktop-export-settings-panel">
      <SegmentTabs
        items={[...MEDIA_TABS]}
        value={mediaTab}
        onChange={(tab) => {
          onExportSettingsChange({
            mediaKind: tab === "Video" ? "video" : "photo",
            ...(tab === "Photo" && actualExportSettings.extension === "svg"
              ? { extension: "png" }
              : {}),
          })
        }}
      />

      <SettingsTabPanel activeKey={mediaTab}>
        {mediaTab === "Photo" ? (
          <>
            <SegmentTabs
              items={[...PHOTO_FORMAT_OPTIONS]}
              value={selectedPhotoFormat}
              variant="muted"
              onChange={(format) =>
                onExportSettingsChange({
                  extension: photoFormatToExtension(format as (typeof PHOTO_FORMAT_OPTIONS)[number]),
                })
              }
            />
            <DesktopInspectorElasticSliderRow
              label="Resolution"
              max={4}
              min={1}
              step={1}
              value={actualExportSettings.exportScale}
              valueLabel={resolutionLabel}
              onChange={(value) =>
                onExportSettingsChange({
                  exportScale: clampExportScale(value) as DesktopExportScale,
                })
              }
            />
          </>
        ) : (
          <div className="flex flex-col gap-2">
            <SegmentTabs
              items={[...VIDEO_FORMAT_OPTIONS]}
              value={videoFormatLabel}
              variant="muted"
              onChange={(format) =>
                onExportSettingsChange({
                  videoFormat: format === "WebM" ? "webm" : "mp4",
                })
              }
            />
            <SegmentTabs
              items={[...VIDEO_DURATION_OPTIONS]}
              value={durationLabel}
              variant="muted"
              onChange={(label) =>
                onExportSettingsChange({
                  videoDurationSeconds: label.startsWith("10") ? 10 : 5,
                })
              }
            />
            <SegmentTabs
              items={[...VIDEO_FPS_OPTIONS]}
              value={fpsLabel}
              variant="muted"
              onChange={(label) =>
                onExportSettingsChange({
                  videoFrameRate: label.startsWith("60") ? 60 : 30,
                })
              }
            />
            <SegmentTabs
              items={[...VIDEO_SIZE_OPTIONS]}
              value={videoSizeLabel}
              variant="muted"
              onChange={(label) =>
                onExportSettingsChange({
                  videoLongEdge: label === "2160p" ? 2160 : 1080,
                })
              }
            />
            {!canExportVideo ? (
              <p className="dn-type-meta text-center">Add motion or animated QR to export video.</p>
            ) : null}
          </div>
        )}
      </SettingsTabPanel>

      <SettingsPrimaryButton
        data-slot="desktop-export-download-confirm"
        disabled={!canDownload || exportInProgress || (isVideoExport && !canExportVideo)}
        onClick={() => controller?.onExportDownload?.()}
      >
        {exportInProgress ? "Exporting..." : "Download"}
      </SettingsPrimaryButton>
      {exportInProgress ? (
        <button
          className="dn-type-meta text-center text-[var(--desktop-inspector-fg-secondary)] underline-offset-2 hover:underline"
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
        <p className="dn-type-meta text-center text-red-500">{controller.exportDownloadError}</p>
      ) : null}
    </div>
  )
}
