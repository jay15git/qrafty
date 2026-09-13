"use client"

import { AnimatePresence, m } from "motion/react"

import { Loader } from "@/components/motion/loader"
import { EASE_OUT } from "@/lib/ease"
import { DesktopInspectorElasticSliderRow } from "@/features/desktop-shell/components/DesktopInspectorShell"
import {
  SegmentTabs,
  SettingsPrimaryButton,
  SettingsTabPanel,
} from "@/features/desktop-shell/inspector/settings-ui"
import type { DesktopExportMediaKind } from "@/features/desktop-shell/model/desktop-toolbar-types"
import type { DesktopInspectorModel } from "@/features/desktop-shell/hooks/useDesktopToolbarInspectorModel"
import {
  clampVideoExportDuration,
  type VideoExportLongEdge,
  VIDEO_EXPORT_MAX_DURATION_SECONDS,
  VIDEO_EXPORT_MIN_DURATION_SECONDS,
} from "@/features/qr-code/export/video-export"
import type { QrFileExtension } from "@/features/qr-code/model/types"

const SECTION_STACK = "flex flex-col gap-2.5"

const MEDIA_TABS = ["Photo", "Video"] as const
const PHOTO_FORMAT_OPTIONS = ["PNG", "JPEG", "WebP"] as const
const VIDEO_FORMAT_OPTIONS = ["MP4", "WebM"] as const
const VIDEO_FPS_OPTIONS = ["30 fps", "60 fps"] as const
const SIZE_OPTIONS = ["720p", "1080p", "2K", "4K"] as const

const SIZE_LABEL_TO_LONG_EDGE: Record<(typeof SIZE_OPTIONS)[number], VideoExportLongEdge> = {
  "720p": 720,
  "1080p": 1080,
  "2K": 1440,
  "4K": 2160,
}

function longEdgeToSizeLabel(longEdge: VideoExportLongEdge): (typeof SIZE_OPTIONS)[number] {
  if (longEdge === 720) return "720p"
  if (longEdge === 1440) return "2K"
  if (longEdge === 2160) return "4K"
  return "1080p"
}

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
  const mediaTab = mediaKindToTab(actualExportSettings.mediaKind)
  const isVideoExport = actualExportSettings.mediaKind === "video"
  const canExportVideo = controller?.canExportVideo ?? false
  const canDownload = controller?.canExportDownload ?? true
  const exportInProgress = controller?.exportInProgress ?? false
  const selectedPhotoFormat = extensionToPhotoFormat(actualExportSettings.extension)
  const photoSizeLabel = longEdgeToSizeLabel(actualExportSettings.photoLongEdge)

  const fpsLabel = actualExportSettings.videoFrameRate === 60 ? "60 fps" : "30 fps"
  const videoFormatLabel = actualExportSettings.videoFormat === "webm" ? "WebM" : "MP4"
  const videoSizeLabel = longEdgeToSizeLabel(actualExportSettings.videoLongEdge)

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
            <SegmentTabs
              items={[...SIZE_OPTIONS]}
              value={photoSizeLabel}
              variant="muted"
              onChange={(label) =>
                onExportSettingsChange({
                  photoLongEdge:
                    SIZE_LABEL_TO_LONG_EDGE[label as (typeof SIZE_OPTIONS)[number]],
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
            <DesktopInspectorElasticSliderRow
              label="Duration"
              max={VIDEO_EXPORT_MAX_DURATION_SECONDS}
              min={VIDEO_EXPORT_MIN_DURATION_SECONDS}
              step={1}
              value={actualExportSettings.videoDurationSeconds}
              valueLabel={`${actualExportSettings.videoDurationSeconds} sec`}
              onChange={(value) =>
                onExportSettingsChange({
                  videoDurationSeconds: clampVideoExportDuration(value),
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
              items={[...SIZE_OPTIONS]}
              value={videoSizeLabel}
              variant="muted"
              onChange={(label) =>
                onExportSettingsChange({
                  videoLongEdge: SIZE_LABEL_TO_LONG_EDGE[label as (typeof SIZE_OPTIONS)[number]],
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
        <AnimatePresence initial={false} mode="wait">
          {exportInProgress ? (
            <m.span
              key="export-progress"
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              className="flex w-full items-center justify-center"
              exit={{ opacity: 0, filter: "blur(4px)", y: -4 }}
              initial={{ opacity: 0, filter: "blur(4px)", y: 4 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
            >
              <Loader
                className="w-full text-current"
                fullWidth
                label={controller?.exportProgressLabel ?? "Exporting"}
                progress={
                  controller?.exportProgressRatio != null
                    ? controller.exportProgressRatio * 100
                    : undefined
                }
                size={30}
                variant="percent"
              />
            </m.span>
          ) : (
            <m.span
              key="download-label"
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              exit={{ opacity: 0, filter: "blur(4px)", y: -4 }}
              initial={{ opacity: 0, filter: "blur(4px)", y: 4 }}
              transition={{ duration: 0.18, ease: EASE_OUT }}
            >
              Download
            </m.span>
          )}
        </AnimatePresence>
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
      {controller?.exportDownloadError ? (
        <p className="dn-type-meta text-center text-red-500">{controller.exportDownloadError}</p>
      ) : null}
    </div>
  )
}
