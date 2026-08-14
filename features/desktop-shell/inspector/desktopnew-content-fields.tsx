"use client"

import { Sparkles } from "lucide-react"
import { useMemo, useState, type ClipboardEvent } from "react"

import { findBrandIconById } from "@/features/qr-code/assets/brand-icons"
import {
  getDetectionChipLabel,
  getLinkDetectionSource,
  getLinkPasteFieldUpdate,
  resolveDetectedLinkTypeApply,
  resolveStructuredPasteApply,
  shouldShowUrlDetectionChip,
} from "@/features/qr-code/content/apply-pasted-content"
import {
  getContentFieldDefinitions,
  type ContentFieldDefinition,
} from "@/features/qr-code/content/content-field-definitions"
import { detectUrlKind } from "@/features/qr-code/content/detect-url-kind"
import {
  isPickerQrInputType,
  QR_INPUT_OPTIONS,
  type QrInputType,
} from "@/features/qr-code/content/input-options"
import {
  validateStaticQrContent,
  type StaticQrContentValue,
  type StaticQrContentValues,
} from "@/features/qr-code/content/static-payload"
import {
  FieldLabel,
  OptionScrollRow,
  SettingsInput,
  SettingsSwitchRow,
} from "@/features/desktop-shell/inspector/settings-ui"
import { cn } from "@/lib/utils"

function stringContentValue(value: StaticQrContentValue | undefined) {
  return typeof value === "string" ? value : ""
}

function ContentFieldRow({
  field,
  onContentValueChange,
}: {
  field: ContentFieldDefinition
  onContentValueChange: (fieldId: string, value: StaticQrContentValue) => void
}) {
  const controlId = `dn-content-${field.id}`

  if (field.type === "toggle") {
    return (
      <SettingsSwitchRow
        checked={Boolean(field.value)}
        label={field.label}
        onChange={(checked) => onContentValueChange(field.id, checked)}
      />
    )
  }

  if (field.type === "segmented") {
    return (
      <div className="flex flex-col gap-1.5">
        {field.label ? <FieldLabel>{field.label}</FieldLabel> : null}
        <OptionScrollRow
          items={field.options?.map((option) => option.label) ?? []}
          selected={
            field.options?.find((option) => option.value === field.value)?.label ?? ""
          }
          onSelect={(label) => {
            const option = field.options?.find((entry) => entry.label === label)
            if (option) {
              onContentValueChange(field.id, option.value)
            }
          }}
        />
      </div>
    )
  }

  if (field.type === "textarea") {
    return (
      <div className="flex flex-col gap-1.5">
        {field.label ? <FieldLabel>{field.label}</FieldLabel> : null}
        <textarea
          aria-invalid={field.error ? true : undefined}
          className="dn-settings-textarea w-full dn-squircle-sm"
          id={controlId}
          placeholder={field.placeholder}
          rows={3}
          value={stringContentValue(field.value)}
          onChange={(event) => onContentValueChange(field.id, event.currentTarget.value)}
        />
        {field.error ? <p className="dn-field-error">{field.error}</p> : null}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      {field.label ? <FieldLabel>{field.label}</FieldLabel> : null}
      <SettingsInput
        aria-invalid={field.error ? true : undefined}
        id={controlId}
        placeholder={field.placeholder}
        value={stringContentValue(field.value)}
        onChange={(event) => onContentValueChange(field.id, event.currentTarget.value)}
      />
      {field.error ? <p className="dn-field-error">{field.error}</p> : null}
    </div>
  )
}

function ContentDetectionChip({
  contentType,
  detection,
  dismissed,
  linkSource,
  onApplyDetectedType,
  onDismiss,
}: {
  contentType: QrInputType
  detection: ReturnType<typeof detectUrlKind>
  dismissed: boolean
  linkSource: string
  onApplyDetectedType: () => void
  onDismiss: () => void
}) {
  if (!linkSource || dismissed || !shouldShowUrlDetectionChip(contentType, detection) || !detection) {
    return null
  }

  const detectedType = detection.inputTypeHint
  const typeLabel = detectedType ? QR_INPUT_OPTIONS[detectedType]?.label : undefined
  const brandIcon = findBrandIconById(detection.brandIconId)
  const BrandIcon = brandIcon?.icon
  const label = getDetectionChipLabel(detection)
  const canApplyDetectedType = Boolean(
    detectedType &&
      isPickerQrInputType(detectedType) &&
      detectedType !== contentType,
  )

  return (
    <div className="dn-content-detection-chip dn-squircle-sm">
      <div className="flex min-w-0 items-start gap-2">
        {BrandIcon ? (
          <BrandIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
        ) : (
          <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 opacity-70" />
        )}
        <div className="min-w-0 flex-1">
          <p className="dn-type-value truncate text-[11px]">Detected: {label}</p>
          {detection.confidence === "low" ? (
            <p className="dn-type-meta truncate">Suggestion only</p>
          ) : null}
        </div>
        <button
          aria-label="Dismiss detection"
          className="dn-pressable shrink-0 rounded-full px-2 py-0.5 dn-type-meta"
          type="button"
          onClick={onDismiss}
        >
          ×
        </button>
      </div>
      {canApplyDetectedType ? (
        <button
          className="dn-pressable mt-2 w-full truncate rounded-full bg-[var(--dn-fg)] px-2.5 py-1.5 text-[11px] font-medium text-[var(--dn-bg)]"
          type="button"
          onClick={onApplyDetectedType}
        >
          Use {typeLabel}
        </button>
      ) : null}
    </div>
  )
}

export function DesktopNewContentFields({
  contentType,
  contentValues,
  validation,
  onContentPasteApply,
  onContentValueChange,
}: {
  contentType: QrInputType
  contentValues: StaticQrContentValues
  validation: ReturnType<typeof validateStaticQrContent>
  onContentPasteApply: (type: QrInputType, values: StaticQrContentValues) => void
  onContentValueChange: (field: string, value: StaticQrContentValue) => void
}) {
  const fields = getContentFieldDefinitions(contentType, contentValues, validation)
  const linkSource = getLinkDetectionSource(contentType, contentValues)
  const urlDetection = useMemo(
    () => (linkSource ? detectUrlKind(linkSource) : null),
    [linkSource],
  )
  const [dismissedDetectionSource, setDismissedDetectionSource] = useState<string | null>(null)
  const isDetectionDismissed = dismissedDetectionSource === linkSource

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text")
    if (!pasted.trim()) {
      return
    }

    const structuredPaste = resolveStructuredPasteApply(pasted)
    if (structuredPaste) {
      event.preventDefault()
      onContentPasteApply(structuredPaste.type, structuredPaste.values)
      setDismissedDetectionSource(null)
      return
    }

    const linkPaste = getLinkPasteFieldUpdate(contentType, pasted)
    if (linkPaste) {
      event.preventDefault()
      for (const [field, value] of Object.entries(linkPaste.values)) {
        if (value !== undefined) {
          onContentValueChange(field, value)
        }
      }
      setDismissedDetectionSource(null)
    }
  }

  function handleApplyDetectedType() {
    if (!urlDetection) {
      return
    }

    const applyResult = resolveDetectedLinkTypeApply(urlDetection, linkSource)
    if (!applyResult) {
      return
    }

    onContentPasteApply(applyResult.type, applyResult.values)
    setDismissedDetectionSource(null)
  }

  return (
    <div
      key={contentType}
      className={cn("flex min-w-0 flex-col gap-2.5")}
      data-slot="desktopnew-content-fields"
      onPaste={handlePaste}
    >
      {fields.map((field) => (
        <ContentFieldRow
          key={`${contentType}-${field.id}`}
          field={field}
          onContentValueChange={(fieldId, value) => {
            if (fieldId === "url" || fieldId === "username" || fieldId === "text") {
              setDismissedDetectionSource(null)
            }
            onContentValueChange(fieldId, value)
          }}
        />
      ))}
      <ContentDetectionChip
        contentType={contentType}
        detection={urlDetection}
        dismissed={isDetectionDismissed}
        linkSource={linkSource}
        onApplyDetectedType={handleApplyDetectedType}
        onDismiss={() => setDismissedDetectionSource(linkSource)}
      />
    </div>
  )
}
