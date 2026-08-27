"use client"

import { Sparkles } from "lucide-react"
import { useMemo, useState, type ClipboardEvent } from "react"

import { LabelInput } from "@/components/label-input"
import { LabelTextarea } from "@/components/label-textarea"
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
import { SpellUiScope } from "@/features/desktop-shell/inspector/spell-ui-scope"
import {
  OptionScrollRow,
  SettingsSwitchRow,
} from "@/features/desktop-shell/inspector/settings-ui"
import { cn } from "@/lib/utils"

const FLOATING_LABEL_PLACEHOLDER = " "

type ContentFieldGroup =
  | { fields: [ContentFieldDefinition, ContentFieldDefinition]; kind: "pair" }
  | { field: ContentFieldDefinition; kind: "single" }

function stringContentValue(value: StaticQrContentValue | undefined) {
  return typeof value === "string" ? value : ""
}

function canPairFields(
  left: ContentFieldDefinition,
  right: ContentFieldDefinition | undefined,
): right is ContentFieldDefinition {
  return (
    Boolean(right) &&
    left.layout === "half" &&
    right.layout === "half" &&
    left.type === "text" &&
    right.type === "text"
  )
}

function groupContentFields(fields: ContentFieldDefinition[]): ContentFieldGroup[] {
  const groups: ContentFieldGroup[] = []

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index]
    const nextField = fields[index + 1]

    if (canPairFields(field, nextField)) {
      groups.push({ kind: "pair", fields: [field, nextField] })
      index += 1
      continue
    }

    groups.push({ kind: "single", field })
  }

  return groups
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
    const options = field.options ?? []
    const selectedLabel =
      options.find((option) => option.value === field.value)?.label ?? options[0]?.label ?? ""

    return (
      <div className="flex flex-col gap-1">
        {field.label ? <span className="dn-type-meta px-0.5">{field.label}</span> : null}
        <OptionScrollRow
          persistKey={field.id}
          items={options.map((option) => option.label)}
          selected={selectedLabel}
          onSelect={(label) => {
            const option = options.find((entry) => entry.label === label)
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
      <div className="min-w-0">
        <LabelTextarea
          id={controlId}
          label={field.label}
          placeholder={FLOATING_LABEL_PLACEHOLDER}
          rows={2}
          value={stringContentValue(field.value)}
          onChange={(event) => onContentValueChange(field.id, event.currentTarget.value)}
        />
      </div>
    )
  }

  return (
    <div className="min-w-0">
      <LabelInput
        id={controlId}
        label={field.label}
        placeholder={FLOATING_LABEL_PLACEHOLDER}
        type={field.inputKind ?? "text"}
        value={stringContentValue(field.value)}
        onChange={(event) => onContentValueChange(field.id, event.currentTarget.value)}
      />
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
          <p className="dn-type-meta truncate">Detected: {label}</p>
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
          className="dn-pressable dn-control-surface mt-2 w-full truncate rounded-full bg-[var(--dn-fg)] px-2.5 dn-type-chip font-medium text-[var(--dn-bg)]"
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

  function handleFieldChange(fieldId: string, value: StaticQrContentValue) {
    if (fieldId === "url" || fieldId === "username" || fieldId === "text") {
      setDismissedDetectionSource(null)
    }
    onContentValueChange(fieldId, value)
  }

  const fieldGroups = useMemo(() => groupContentFields(fields), [fields])

  return (
    <SpellUiScope>
      <div
        className={cn("flex min-w-0 flex-col gap-3 pt-1")}
        data-slot="desktopnew-content-fields"
        onPaste={handlePaste}
      >
        {fieldGroups.map((group) => {
          if (group.kind === "pair") {
            const [leftField, rightField] = group.fields
            return (
              <div
                key={`${contentType}-${leftField.id}-${rightField.id}`}
                className="grid min-w-0 grid-cols-2 gap-2"
                data-slot="desktopnew-content-field-row"
              >
                <ContentFieldRow field={leftField} onContentValueChange={handleFieldChange} />
                <ContentFieldRow field={rightField} onContentValueChange={handleFieldChange} />
              </div>
            )
          }

          return (
            <ContentFieldRow
              key={`${contentType}-${group.field.id}`}
              field={group.field}
              onContentValueChange={handleFieldChange}
            />
          )
        })}
        <ContentDetectionChip
          contentType={contentType}
          detection={urlDetection}
          dismissed={isDetectionDismissed}
          linkSource={linkSource}
          onApplyDetectedType={handleApplyDetectedType}
          onDismiss={() => setDismissedDetectionSource(linkSource)}
        />
      </div>
    </SpellUiScope>
  )
}
