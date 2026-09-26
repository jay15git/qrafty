"use client";

import { Sparkles } from "lucide-react";
import { useMemo, useState, type ClipboardEvent } from "react";

import {
  SettingsInput,
  SettingsLabeledSelect,
  SettingsSwitchRow,
} from "@/features/shell/settings/settings-ui";
import {
  getDetectionChipLabel,
  getLinkDetectionSource,
  getLinkPasteFieldUpdate,
  resolveDetectedLinkTypeApply,
  resolveStructuredPasteApply,
  shouldShowUrlDetectionChip,
} from "@/features/qr/content/apply-pasted-content";
import {
  getContentFieldDefinitions,
  type ContentFieldDefinition,
} from "@/features/qr/content/content-field-definitions";
import { detectUrlKind } from "@/features/qr/content/detect-url-kind";
import {
  isPickerQrInputType,
  QR_INPUT_OPTIONS,
  type QrInputType,
} from "@/features/qr/content/input-options";
import {
  validateStaticQrContent,
  type StaticQrContentValue,
  type StaticQrContentValues,
} from "@/features/qr/content/static-payload";
import { findBrandIconById } from "@/features/qr/assets/brand-icons";
import { cn } from "@/lib/utils";

type ContentFieldGroup =
  | { fields: [ContentFieldDefinition, ContentFieldDefinition]; kind: "pair" }
  | { field: ContentFieldDefinition; kind: "single" };

function stringContentValue(value: StaticQrContentValue | undefined) {
  return typeof value === "string" ? value : "";
}

function canPairFields(
  left: ContentFieldDefinition,
  right: ContentFieldDefinition | undefined,
): right is ContentFieldDefinition {
  return (
    right !== undefined &&
    left.layout === "half" &&
    right.layout === "half" &&
    left.type === "text" &&
    right.type === "text"
  );
}

function groupContentFields(fields: ContentFieldDefinition[]): ContentFieldGroup[] {
  const groups: ContentFieldGroup[] = [];

  for (let index = 0; index < fields.length; index += 1) {
    const field = fields[index];
    const nextField = fields[index + 1];

    if (canPairFields(field, nextField)) {
      groups.push({ kind: "pair", fields: [field, nextField] });
      index += 1;
      continue;
    }

    groups.push({ kind: "single", field });
  }

  return groups;
}

function ContentFieldRow({
  field,
  onContentValueChange,
}: {
  field: ContentFieldDefinition;
  onContentValueChange: (fieldId: string, value: StaticQrContentValue) => void;
}) {
  const controlId = `ds-content-${field.id}`;

  if (field.type === "toggle") {
    return (
      <SettingsSwitchRow
        checked={Boolean(field.value)}
        label={field.label}
        onChange={(checked) => onContentValueChange(field.id, checked)}
      />
    );
  }

  if (field.type === "segmented") {
    const options = field.options ?? [];

    return (
      <SettingsLabeledSelect
        items={options.map((option) => option.label)}
        label={field.label}
        placeholder={field.label || "Option"}
        value={options.find((option) => option.value === field.value)?.label ?? ""}
        onChange={(label) => {
          const option = options.find((entry) => entry.label === label);
          if (option) {
            onContentValueChange(field.id, option.value);
          }
        }}
      />
    );
  }

  if (field.type === "textarea" || field.type === "text") {
    return (
      <div className="ds-content-field min-w-0">
        {field.label ? <span className="ds-type-meta px-0.5">{field.label}</span> : null}
        <SettingsInput
          id={controlId}
          type={field.inputKind ?? "text"}
          value={stringContentValue(field.value)}
          onChange={(event) => onContentValueChange(field.id, event.currentTarget.value)}
        />
      </div>
    );
  }

  return null;
}

function ContentDetectionChip({
  contentType,
  detection,
  dismissed,
  linkSource,
  onApplyDetectedType,
  onDismiss,
}: {
  contentType: QrInputType;
  detection: ReturnType<typeof detectUrlKind>;
  dismissed: boolean;
  linkSource: string;
  onApplyDetectedType: () => void;
  onDismiss: () => void;
}) {
  if (
    !linkSource ||
    dismissed ||
    !shouldShowUrlDetectionChip(contentType, detection) ||
    !detection
  ) {
    return null;
  }

  const detectedType = detection.inputTypeHint;
  const typeLabel = detectedType ? QR_INPUT_OPTIONS[detectedType]?.label : undefined;
  const brandIcon = findBrandIconById(detection.brandIconId);
  const BrandIcon = brandIcon?.icon;
  const label = getDetectionChipLabel(detection);
  const canApplyDetectedType = Boolean(
    detectedType && isPickerQrInputType(detectedType) && detectedType !== contentType,
  );

  return (
    <div className="ds-content-detection-chip ds-squircle-sm">
      <div className="flex min-w-0 items-start gap-2">
        {BrandIcon ? (
          <BrandIcon aria-hidden className="mt-0.5 size-4 shrink-0" />
        ) : (
          <Sparkles aria-hidden className="mt-0.5 size-4 shrink-0 opacity-70" />
        )}
        <div className="min-w-0 flex-1">
          <p className="ds-type-meta truncate">Detected: {label}</p>
          {detection.confidence === "low" ? (
            <p className="ds-type-meta truncate">Suggestion only</p>
          ) : null}
        </div>
        <button
          aria-label="Dismiss detection"
          className="ds-pressable shrink-0 rounded-full px-2 py-0.5 ds-type-meta"
          type="button"
          onClick={onDismiss}
        >
          ×
        </button>
      </div>
      {canApplyDetectedType ? (
        <button
          className="ds-pressable ds-control-surface mt-2 w-full truncate rounded-full bg-[var(--fg)] px-2.5 ds-type-chip font-medium text-[var(--bg)]"
          type="button"
          onClick={onApplyDetectedType}
        >
          Use {typeLabel}
        </button>
      ) : null}
    </div>
  );
}

export function ContentFields({
  contentType,
  contentValues,
  validation,
  onContentPasteApply,
  onContentValueChange,
}: {
  contentType: QrInputType;
  contentValues: StaticQrContentValues;
  validation: ReturnType<typeof validateStaticQrContent>;
  onContentPasteApply: (type: QrInputType, values: StaticQrContentValues) => void;
  onContentValueChange: (field: string, value: StaticQrContentValue) => void;
}) {
  const fields = getContentFieldDefinitions(contentType, contentValues, validation);
  const linkSource = getLinkDetectionSource(contentType, contentValues);
  const urlDetection = useMemo(() => (linkSource ? detectUrlKind(linkSource) : null), [linkSource]);
  const [dismissedDetectionSource, setDismissedDetectionSource] = useState<string | null>(null);
  const isDetectionDismissed = dismissedDetectionSource === linkSource;

  function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const pasted = event.clipboardData.getData("text");
    if (!pasted.trim()) {
      return;
    }

    const structuredPaste = resolveStructuredPasteApply(pasted);
    if (structuredPaste) {
      event.preventDefault();
      onContentPasteApply(structuredPaste.type, structuredPaste.values);
      setDismissedDetectionSource(null);
      return;
    }

    const linkPaste = getLinkPasteFieldUpdate(contentType, pasted);
    if (linkPaste) {
      event.preventDefault();
      for (const [field, value] of Object.entries(linkPaste.values)) {
        if (value !== undefined) {
          onContentValueChange(field, value);
        }
      }
      setDismissedDetectionSource(null);
    }
  }

  function handleApplyDetectedType() {
    if (!urlDetection) {
      return;
    }

    const applyResult = resolveDetectedLinkTypeApply(urlDetection, linkSource);
    if (!applyResult) {
      return;
    }

    onContentPasteApply(applyResult.type, applyResult.values);
    setDismissedDetectionSource(null);
  }

  function handleFieldChange(fieldId: string, value: StaticQrContentValue) {
    if (fieldId === "url" || fieldId === "username" || fieldId === "text") {
      setDismissedDetectionSource(null);
    }
    onContentValueChange(fieldId, value);
  }

  const fieldGroups = useMemo(() => groupContentFields(fields), [fields]);

  return (
    <div className={cn("ds-section-stack pt-1")} data-slot="content-fields" onPaste={handlePaste}>
      {fieldGroups.map((group) => {
        if (group.kind === "pair") {
          const [leftField, rightField] = group.fields;
          return (
            <div
              key={`${contentType}-${leftField.id}-${rightField.id}`}
              className="grid min-w-0 grid-cols-2 gap-2"
              data-slot="settings-content-field-row"
            >
              <ContentFieldRow field={leftField} onContentValueChange={handleFieldChange} />
              <ContentFieldRow field={rightField} onContentValueChange={handleFieldChange} />
            </div>
          );
        }

        return (
          <ContentFieldRow
            key={`${contentType}-${group.field.id}`}
            field={group.field}
            onContentValueChange={handleFieldChange}
          />
        );
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
  );
}
