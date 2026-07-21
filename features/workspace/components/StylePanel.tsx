"use client"

import {
  type CSSProperties,
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Search01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import type {
  QrFinderPatternOuterStyle,
  QrErrorCorrectionLevel,
  QrTypeNumber,
} from "@/features/qr-code/model/types"
import type { StudioCornerDotStyle } from "@/features/qr-code/model/state"

import FileUpload from "@/components/vendor/kokonutui/file-upload"
import {
  DraftingInspectorControlRow,
  DraftingInspectorSection,
} from "@/features/workspace/components/InspectorPanel"
import {
  applyDraftingCardPaperShaderPreset,
  DEFAULT_DRAFTING_PAPER_SHADER_IMAGE,
  createDefaultDraftingCardPaperShader,
  type DraftingCardImageState,
  type DraftingCardPaperShaderState,
  type DraftingCardState,
  type DraftingCardStyleMode,
} from "@/features/workspace/model/card-state"
import {
  DRAFTING_CARD_PATTERN_NONE_ID,
  DRAFTING_CARD_PATTERNS,
  getDraftingCardPatternById,
  getDraftingCardPatternStyle,
  type DraftingCardPatternColorOverrides,
  type DraftingCardPatternColorSlotId,
  type DraftingCardPatternId,
  type DraftingCardPatternSelectionId,
} from "@/features/workspace/model/card-patterns"
import {
  getCardGeneratedShaderDefinitions,
  getCardImageFilterDefinitions,
  getPaperShaderDefinition,
  formatPaperShaderNumberValue,
  formatPaperShaderParamLabel,
  type PaperShaderControlDefinition,
  type PaperShaderId,
  type PaperShaderParamValue,
} from "@/features/workspace/rendering/paper-shaders"
import { PaperShaderOptionPreview } from "@/features/workspace/components/PaperShaderOptionPreview"
import type {
  BrandIconCategory,
  BrandIconEntry,
} from "@/features/qr-code/assets/brand-icons"
import {
  QR_BACKGROUND_SHAPES,
  type QrBackgroundShapeId,
} from "@/features/qr-code/styles/background-shapes"
import {
  EmbeddedColorPickerField,
  GradientEditor,
} from "@/features/qr-code/components/ControlsPanel"
import {
  CORNER_DOT_STYLE_OPTIONS,
  CORNER_SQUARE_STYLE_OPTIONS,
  DOT_STYLE_OPTIONS,
} from "@/features/qr-code/styles/style-options"
import {
  ERROR_CORRECTION_LEVEL_OPTIONS,
  formatQrTypeNumberLabel,
  TYPE_NUMBER_MAX,
  TYPE_NUMBER_MIN,
} from "@/features/qr-code/styles/encoding-options"
import {
  StylePreview,
  type StylePreviewKind,
} from "@/features/qr-code/components/StylePreview"
import { ElasticSlider } from "@/components/ui/elastic-slider"
import { Slider as UnlumenSlider } from "@/components/vendor/unlumen-ui/slider"
import type {
  BackgroundShapeOptions,
  DotsColorMode,
  QrDotMatrixAnimationOptions,
  QrDotMatrixAnimationPatch,
  StudioDataModulesStyle,
  StudioGradient,
} from "@/features/qr-code/model/state"
import {
  QR_DOT_MATRIX_ANIMATION_SPEED_MAX,
  QR_DOT_MATRIX_ANIMATION_SPEED_MIN,
  QR_DOT_MATRIX_COLOR_PRESET_OPTIONS,
  QR_DOT_MATRIX_MATRIX_SIZE_MAX,
  QR_DOT_MATRIX_MATRIX_SIZE_MIN,
  QR_DOT_MATRIX_MATRIX_SIZE_STEP,
  QR_DOT_MATRIX_OPACITY_MAX,
  QR_DOT_MATRIX_OPACITY_MIN,
  QR_DOT_MATRIX_OVERLAY_SCALE_MAX,
  QR_DOT_MATRIX_OVERLAY_SCALE_MIN,
  QR_DOT_MATRIX_PATTERN_OPTIONS,
  QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS,
} from "@/features/qr-code/model/state"
import {
  type StaticQrContentValue,
  type StaticQrContentValues,
  type StaticQrValidationResult,
} from "@/features/qr-code/content/static-payload"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { OptionCard } from "@/components/ui/option-card"
import {
  QR_CATEGORIES,
  QR_INPUT_OPTIONS,
  type QrInputType,
} from "@/features/qr-code/content/input-options"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { CheckIcon, ChevronDown, PlusIcon } from "lucide-react"

export type DraftingBinaryColorMode = "solid" | "gradient"
type DraftingAssetSourceMode = "upload" | "url"
type DraftingBrandIconCategoryFilter = BrandIconCategory | "all"

const DRAFTING_BRAND_ICON_CATEGORY_OPTIONS: Array<{
  label: string
  value: DraftingBrandIconCategoryFilter
}> = [
  { label: "All", value: "all" },
  { label: "Social", value: "social" },
  { label: "Business", value: "business" },
  { label: "Payments", value: "payments" },
  { label: "Travel", value: "travel" },
  { label: "Media", value: "media" },
  { label: "Web", value: "web" },
]

const PAPER_SHADER_COLOR_INPUT_FALLBACK = ["#", "0", "0", "0", "0", "0", "0"].join("")
const PAPER_SHADER_NEW_COLOR = ["#", "f", "f", "f", "f", "f", "f"].join("")

export type DraftingSliderVariant = "default" | "desktop-elastic"

const DraftingSliderVariantContext = createContext<DraftingSliderVariant>("default")

export function DraftingSliderVariantProvider({
  children,
  value,
}: {
  children: ReactNode
  value: DraftingSliderVariant
}) {
  return (
    <DraftingSliderVariantContext.Provider value={value}>
      {children}
    </DraftingSliderVariantContext.Provider>
  )
}

function useDraftingSliderVariant() {
  return useContext(DraftingSliderVariantContext)
}

export function DraftingContentTab({
  contentType,
  contentValues,
  encodedValue,
  onContentValueChange,
  validation,
}: {
  contentType: QrInputType
  contentValues: StaticQrContentValues
  encodedValue: string
  onContentValueChange: (field: string, value: StaticQrContentValue) => void
  validation: StaticQrValidationResult
}) {
  const contentFieldItems = buildDraftingContentFieldItems({
    contentType,
    contentValues,
    onContentValueChange,
    validation,
  })

  const [contentOpenItemIds, setContentOpenItemIds] = useState<string[]>(() =>
    contentFieldItems.map((item) => item.id),
  )

  useEffect(() => {
    setContentOpenItemIds(
      buildDraftingContentFieldItems({
        contentType,
        contentValues,
        onContentValueChange,
        validation,
      }).map((item) => item.id),
    )
    // Only reset accordion expansion when contentType changes, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType])

  return (
    <div data-slot="drafting-content-tab" className="min-w-0 space-y-4">
      <DraftingAccordion
        dataSlot="drafting-content-fields"
        items={contentFieldItems}
        openItemIds={contentOpenItemIds}
        onOpenItemIdsChange={setContentOpenItemIds}
      />

      <details
        data-slot="drafting-content-encoded-preview"
        className="min-w-0 rounded-[8px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] px-4 py-3 text-[var(--drafting-ink)] shadow-[var(--drafting-shadow-rest)]"
      >
        <summary className="drafting-type-control-label cursor-pointer font-semibold">
          Encoded value
        </summary>
        <pre className="drafting-type-caption mt-3 max-h-44 min-w-0 overflow-auto whitespace-pre-wrap break-words rounded-[4px] bg-[var(--drafting-panel-bg-hover)] p-3 text-[var(--drafting-ink-muted)]">
          {encodedValue}
        </pre>
      </details>
    </div>
  )
}

export function DraftingQrTypeDropdown({
  activeContentType,
  onContentTypeChange,
}: {
  activeContentType: QrInputType
  onContentTypeChange: (value: QrInputType) => void
}) {
  const activeItem = QR_CATEGORIES.flatMap((c) => c.items).find(
    (item) => item.value === activeContentType,
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Open QR type options"
          data-drafting-dropdown-trigger="true"
          type="button"
          className={cn(
            "group flex h-10 w-full min-w-0 cursor-default select-none items-center justify-between gap-2 rounded-[6px] border px-3 py-0 text-left outline-none",
            "border-[var(--drafting-dropdown-border)] bg-[var(--drafting-dropdown-trigger-surface)] text-[var(--drafting-dropdown-text)] shadow-[var(--drafting-dropdown-trigger-shadow-rest)]",
            "transition-[border-color,box-shadow,transform,background-color,color] duration-150 ease-out",
            "hover:-translate-y-px hover:bg-[var(--drafting-dropdown-trigger-surface-hover)] hover:shadow-[var(--drafting-dropdown-trigger-shadow-hover)]",
            "active:translate-y-0 active:bg-[var(--drafting-dropdown-trigger-surface-pressed)] active:shadow-[var(--drafting-dropdown-trigger-shadow-pressed)]",
            "focus-visible:border-2 focus-visible:border-[var(--drafting-dropdown-border-focus)] focus-visible:ring-0",
            "data-[state=open]:border-[var(--drafting-dropdown-border-focus)] data-[state=open]:bg-[var(--drafting-dropdown-trigger-surface-open)] data-[state=open]:shadow-[var(--drafting-dropdown-trigger-shadow-hover)]",
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="drafting-type-panel-tab shrink-0 font-medium text-[var(--drafting-dropdown-text-muted)]">
              QR Type:
            </span>
            <span className="drafting-type-panel-tab min-w-0 truncate font-semibold">
              {activeItem?.label ?? "Choose a type"}
            </span>
          </span>
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 text-[var(--drafting-dropdown-text-muted)] transition-transform duration-150 ease-out group-data-[state=open]:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        data-drafting-dropdown-content="true"
        className="w-[280px] max-w-[calc(100vw-2rem)] rounded-[8px] border border-[var(--drafting-dropdown-border)] bg-[var(--drafting-dropdown-menu-surface-open)] p-2 text-[var(--drafting-dropdown-text)] shadow-[var(--drafting-dropdown-menu-shadow-open)] ring-0"
      >
        <DropdownMenuGroup className="grid gap-0.5">
          {QR_CATEGORIES.map((category) => {
            const CategoryIcon = category.icon

            return (
              <DropdownMenuSub key={category.key}>
                <DropdownMenuSubTrigger
                  data-category={category.key}
                  className={cn(
                    "flex h-9 min-h-9 cursor-default items-center justify-between gap-2 rounded-[4px] border border-transparent bg-transparent px-2.5 py-0 text-[12px] font-medium text-[var(--drafting-dropdown-text)]",
                    "focus:bg-[var(--drafting-dropdown-trigger-surface-hover)] focus:text-[var(--drafting-dropdown-text)]",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <CategoryIcon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-[var(--drafting-dropdown-text)]"
                    />
                    <span className="drafting-type-caption font-medium">
                      {category.label}
                    </span>
                  </span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent
                  sideOffset={4}
                  className="w-[280px] max-w-[calc(100vw-2rem)] rounded-[8px] border border-[var(--drafting-dropdown-border)] bg-[var(--drafting-dropdown-menu-surface-open)] p-2 text-[var(--drafting-dropdown-text)] shadow-[var(--drafting-dropdown-menu-shadow-open)] ring-0"
                >
                  <DropdownMenuGroup className="grid gap-1">
                    {category.items.map((item) => {
                      const ItemIcon = item.icon
                      const isSelected = activeContentType === item.value

                      return (
                        <DropdownMenuItem
                          key={item.value}
                          data-content-type={item.value}
                          onSelect={() => onContentTypeChange(item.value)}
                          className={cn(
                            "h-9 min-h-9 gap-2 rounded-[4px] border border-transparent bg-transparent px-2.5 py-0 text-[12px] font-medium text-[var(--drafting-dropdown-text)]",
                            "focus:bg-[var(--drafting-dropdown-trigger-surface-hover)] focus:text-[var(--drafting-dropdown-text)] focus:**:text-[var(--drafting-dropdown-text)]",
                            isSelected &&
                              "bg-[var(--drafting-dropdown-selected-fill)] font-semibold text-[var(--drafting-dropdown-text)] focus:bg-[var(--drafting-dropdown-selected-fill)] focus:text-[var(--drafting-dropdown-text)]",
                          )}
                        >
                          <span
                            aria-hidden="true"
                            className="flex size-3.5 shrink-0 items-center justify-center"
                          >
                            <CheckIcon
                              className={cn(
                                "size-3.5 text-[var(--drafting-dropdown-text)] transition-opacity duration-100",
                                isSelected ? "opacity-100" : "opacity-0",
                              )}
                            />
                          </span>
                          <ItemIcon
                            aria-hidden="true"
                            className="size-4 shrink-0 text-[var(--drafting-dropdown-text)]"
                          />
                          <span className="drafting-type-caption min-w-0 truncate font-medium">
                            {item.label}
                          </span>
                        </DropdownMenuItem>
                      )
                    })}
                  </DropdownMenuGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function buildDraftingContentFieldItems({
  contentType,
  contentValues,
  onContentValueChange,
  validation,
}: {
  contentType: QrInputType
  contentValues: StaticQrContentValues
  onContentValueChange: (field: string, value: StaticQrContentValue) => void
  validation: StaticQrValidationResult
}): Array<{ id: string; title: string; content: ReactNode; error?: string }> {
  const inputClassName =
    "drafting-type-input h-11 min-w-0 border-0 bg-[var(--drafting-panel-bg-hover)] px-3.5 py-2.5 text-[var(--drafting-ink)] shadow-none placeholder:text-[var(--drafting-ink-subtle)] focus-visible:ring-0 aria-invalid:ring-0"
  const textareaClassName =
    "drafting-type-input min-h-24 min-w-0 max-w-full resize-none overflow-x-hidden border-0 bg-[var(--drafting-panel-bg-hover)] px-3.5 py-3 text-[var(--drafting-ink)] shadow-none placeholder:text-[var(--drafting-ink-subtle)] [overflow-wrap:anywhere] focus-visible:ring-0 aria-invalid:ring-0"

  const textItem = (
    id: string,
    title: string,
    ariaLabel: string,
    placeholder: string,
    value: string,
    error?: string,
  ): { id: string; title: string; content: ReactNode; error?: string } => ({
    id,
    title,
    error,
    content: (
      <div className="min-w-0 pb-4">
        <Input
          aria-invalid={error ? true : undefined}
          aria-label={ariaLabel}
          className={inputClassName}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onContentValueChange(id, event.currentTarget.value)}
        />
      </div>
    ),
  })

  const textareaItem = (
    id: string,
    title: string,
    ariaLabel: string,
    placeholder: string,
    value: string,
    error?: string,
  ): { id: string; title: string; content: ReactNode; error?: string } => ({
    id,
    title,
    error,
    content: (
      <div className="min-w-0 pb-4">
        <Textarea
          aria-invalid={error ? true : undefined}
          aria-label={ariaLabel}
          className={textareaClassName}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onContentValueChange(id, event.currentTarget.value)}
        />
      </div>
    ),
  })

  if (contentType === "auto") {
    return [
      textareaItem(
        "text",
        "Text, URL, or QR payload",
        "Auto content",
        "https://example.com/invite",
        stringContentValue(contentValues.text),
      ),
    ]
  }

  if (contentType === "text") {
    return [
      textareaItem(
        "text",
        "Text",
        "Text content",
        "Plain text to encode",
        stringContentValue(contentValues.text),
      ),
    ]
  }

  if (isUrlContentType(contentType)) {
    return [
      textItem(
        "url",
        "URL",
        `${QR_INPUT_OPTIONS[contentType].label} URL`,
        "https://example.com",
        stringContentValue(contentValues.url),
        validation.fieldErrors.url,
      ),
    ]
  }

  if (contentType === "phone") {
    return [
      textItem(
        "phone",
        "Phone number",
        "Phone number",
        "+1 555 010 2000",
        stringContentValue(contentValues.phone),
        validation.fieldErrors.phone,
      ),
    ]
  }

  if (contentType === "email") {
    return [
      textItem(
        "email",
        "Email address",
        "Email address",
        "hello@example.com",
        stringContentValue(contentValues.email),
        validation.fieldErrors.email,
      ),
      textItem(
        "subject",
        "Subject",
        "Email subject",
        "Launch",
        stringContentValue(contentValues.subject),
      ),
      textareaItem(
        "body",
        "Body",
        "Email body",
        "Message body",
        stringContentValue(contentValues.body),
      ),
    ]
  }

  if (contentType === "sms") {
    return [
      textItem(
        "phone",
        "Phone number",
        "SMS phone number",
        "+1 555 010 2000",
        stringContentValue(contentValues.phone),
        validation.fieldErrors.phone,
      ),
      textareaItem(
        "message",
        "Message",
        "SMS message",
        "Message text",
        stringContentValue(contentValues.message),
      ),
    ]
  }

  if (contentType === "wifi") {
    const security = stringContentValue(contentValues.security)
    return [
      textItem(
        "ssid",
        "Network name",
        "Network name",
        "Cafe Guest",
        stringContentValue(contentValues.ssid),
        validation.fieldErrors.ssid,
      ),
      {
        id: "security",
        title: "Security type",
        content: (
          <div className="min-w-0 px-4 pb-4">
            <div className="grid min-w-0 grid-cols-3 gap-2">
              {["WPA", "WEP", "nopass"].map((sec) => (
                <label
                  key={sec}
                  className={cn(
                    "flex min-h-9 cursor-pointer items-center justify-center rounded-[6px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg-hover)] px-2 text-center",
                    "drafting-type-caption font-semibold text-[var(--drafting-ink-muted)]",
                    security === sec &&
                      "border-[var(--drafting-ink)] bg-[var(--drafting-ink)] text-[var(--drafting-surface-bg)]",
                  )}
                >
                  <input
                    aria-label={`Wi-Fi security ${sec}`}
                    checked={security === sec}
                    className="sr-only"
                    name="drafting-wifi-security"
                    type="radio"
                    onChange={() => onContentValueChange("security", sec)}
                  />
                  {sec === "nopass" ? "None" : sec}
                </label>
              ))}
            </div>
          </div>
        ),
      },
      textItem(
        "password",
        "Password",
        "Wi-Fi password",
        "Network password",
        stringContentValue(contentValues.password),
      ),
      {
        id: "hidden",
        title: "Hidden network",
        content: (
          <div className="min-w-0 px-4 pb-4">
            <label className="flex min-w-0 items-center justify-between gap-3 rounded-[6px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg-hover)] px-3 py-2">
              <span className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
                Hidden network
              </span>
              <input
                aria-label="Hidden network"
                checked={Boolean(contentValues.hidden)}
                className="size-4 accent-[var(--drafting-ink)]"
                type="checkbox"
                onChange={(event) =>
                  onContentValueChange("hidden", event.currentTarget.checked)
                }
              />
            </label>
          </div>
        ),
      },
    ]
  }

  if (contentType === "vcard") {
    return [
      textItem(
        "firstName",
        "First name",
        "First name",
        "Jay",
        stringContentValue(contentValues.firstName),
        validation.fieldErrors.firstName,
      ),
      textItem(
        "lastName",
        "Last name",
        "Last name",
        "Shah",
        stringContentValue(contentValues.lastName),
      ),
      textItem(
        "phone",
        "Phone",
        "Contact phone number",
        "+91 98765 43210",
        stringContentValue(contentValues.phone),
      ),
      textItem(
        "email",
        "Email",
        "Contact email",
        "jay@example.com",
        stringContentValue(contentValues.email),
      ),
      textItem(
        "company",
        "Company",
        "Company",
        "New QR",
        stringContentValue(contentValues.company),
      ),
      textItem(
        "url",
        "Website",
        "Contact website",
        "https://example.com",
        stringContentValue(contentValues.url),
      ),
    ]
  }

  if (contentType === "whatsapp" || contentType === "whatsapp-chat") {
    return [
      textItem(
        "phone",
        "Phone number",
        "WhatsApp phone number",
        "+91 98765 43210",
        stringContentValue(contentValues.phone),
        validation.fieldErrors.phone,
      ),
      textareaItem(
        "message",
        "Message",
        "WhatsApp message",
        "I would like to book",
        stringContentValue(contentValues.message),
      ),
    ]
  }

  if (isUsernameContentType(contentType)) {
    return [
      textItem(
        "username",
        "Username",
        `${QR_INPUT_OPTIONS[contentType].label} username`,
        "@newqr",
        stringContentValue(contentValues.username),
        validation.fieldErrors.username,
      ),
    ]
  }

  if (contentType === "map-location") {
    return [
      textItem(
        "query",
        "Place or label",
        "Place search",
        "Mumbai",
        stringContentValue(contentValues.query),
        validation.fieldErrors.query,
      ),
      textItem(
        "latitude",
        "Latitude",
        "Latitude",
        "19.0760",
        stringContentValue(contentValues.latitude),
        validation.fieldErrors.latitude,
      ),
      textItem(
        "longitude",
        "Longitude",
        "Longitude",
        "72.8777",
        stringContentValue(contentValues.longitude),
        validation.fieldErrors.longitude,
      ),
    ]
  }

  if (contentType === "event") {
    const eventMode = stringContentValue(contentValues.eventMode) || "url"
    const items: Array<{ id: string; title: string; content: ReactNode }> = [
      {
        id: "eventMode",
        title: "Event type",
        content: (
          <div className="min-w-0 px-4 pb-4">
            <div className="grid min-w-0 grid-cols-2 gap-2">
              {[
                ["url", "Event URL"],
                ["calendar", "Calendar"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={cn(
                    "flex min-h-9 cursor-pointer items-center justify-center rounded-[6px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg-hover)] px-2 text-center",
                    "drafting-type-caption font-semibold text-[var(--drafting-ink-muted)]",
                    eventMode === value &&
                      "border-[var(--drafting-ink)] bg-[var(--drafting-ink)] text-[var(--drafting-surface-bg)]",
                  )}
                >
                  <input
                    aria-label={`Use ${label}`}
                    checked={eventMode === value}
                    className="sr-only"
                    name="drafting-event-mode"
                    type="radio"
                    onChange={() => onContentValueChange("eventMode", value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        ),
      },
    ]

    if (eventMode === "calendar") {
      items.push(
        textItem(
          "title",
          "Title",
          "Event title",
          "Launch Briefing",
          stringContentValue(contentValues.title),
          validation.fieldErrors.title,
        ),
        textItem(
          "start",
          "Start",
          "Event start",
          "2026-06-01T09:00",
          stringContentValue(contentValues.start),
          validation.fieldErrors.start,
        ),
        textItem(
          "end",
          "End",
          "Event end",
          "2026-06-01T10:30",
          stringContentValue(contentValues.end),
        ),
        textItem(
          "location",
          "Location",
          "Event location",
          "Studio 2",
          stringContentValue(contentValues.location),
        ),
      )
    } else {
      items.push(
        textItem(
          "url",
          "URL",
          "Event URL",
          "https://example.com/rsvp",
          stringContentValue(contentValues.url),
          validation.fieldErrors.url,
        ),
      )
    }

    return items
  }

  if (contentType === "coupon") {
    return [
      textItem(
        "code",
        "Code",
        "Coupon code",
        "SAVE20",
        stringContentValue(contentValues.code),
        validation.fieldErrors.code,
      ),
      textareaItem(
        "description",
        "Description",
        "Coupon description",
        "20% off",
        stringContentValue(contentValues.description),
      ),
      textItem(
        "url",
        "URL",
        "Coupon URL",
        "https://example.com/save",
        stringContentValue(contentValues.url),
      ),
    ]
  }

  return []
}

function isUrlContentType(type: QrInputType) {
  return [
    "link",
    "website",
    "facebook",
    "youtube",
    "linkedin",
    "discord",
    "google-review",
    "booking-link",
    "payment-link",
    "menu",
    "app-download",
    "pdf",
    "image",
    "video",
    "document",
    "form",
  ].includes(type)
}

function isUsernameContentType(type: QrInputType) {
  return [
    "instagram",
    "x",
    "tiktok",
    "telegram",
    "snapchat",
    "threads",
    "pinterest",
    "telegram-username",
  ].includes(type)
}

function stringContentValue(value: StaticQrContentValue | undefined) {
  return typeof value === "string" ? value : ""
}

export function StylePanel({
  onValueChange,
  value,
}: {
  onValueChange: (value: StudioDataModulesStyle) => void
  value: StudioDataModulesStyle
}) {
  return (
    <DraftingOptionCardGrid
      ariaLabel="Dot style options"
      dataSlot="drafting-style-option-grid"
      name="drafting-dot-style"
      options={DOT_STYLE_OPTIONS}
      previewKind="dots"
      value={value}
      onValueChange={onValueChange}
    />
  )
}

export function DraftingSizeTab({
  margin,
  radius,
  onMarginChange,
  onRadiusChange,
}: {
  margin: number
  radius: number
  onMarginChange: (value: number) => void
  onRadiusChange: (value: number) => void
}) {
  return (
    <div data-slot="drafting-style-size-tab" className="min-w-0 space-y-3">
      <DraftingSliderField
        dataSlot="drafting-style-margin-slider"
        description="Controls the quiet zone around the QR so scanners have room to detect the code."
        formatValue={(value) => `${Math.round(value)} px`}
        id="drafting-qr-margin"
        label="Outer margin"
        max={80}
        min={0}
        step={1}
        value={margin}
        onChange={onMarginChange}
      />
      <DraftingSliderField
        dataSlot="drafting-style-radius-slider"
        description="Rounds the QR background while keeping the code modules unchanged."
        formatValue={(value) => `${Math.round(value)}%`}
        id="drafting-qr-radius"
        label="Corner radius"
        max={100}
        min={0}
        step={1}
        value={radius}
        onChange={onRadiusChange}
      />
    </div>
  )
}

export function DraftingMotionTab({
  animation,
  onAnimationChange,
}: {
  animation: QrDotMatrixAnimationOptions
  onAnimationChange: (patch: QrDotMatrixAnimationPatch) => void
}) {
  return (
    <DraftingLoaderPlaygroundTab
      animation={animation}
      dataSlot="drafting-motion-tab"
      onAnimationChange={onAnimationChange}
    />
  )
}

export function DraftingLoaderPlaygroundTab({
  animation,
  dataSlot = "drafting-loader-playground-tab",
  onAnimationChange,
}: {
  animation: QrDotMatrixAnimationOptions
  dataSlot?: string
  onAnimationChange: (patch: QrDotMatrixAnimationPatch) => void
}) {
  return (
    <div data-slot={dataSlot} className="min-w-0 space-y-3">
      <DraftingToggleField
        checked={animation.enabled}
        dataSlot="drafting-dot-matrix-animation-enabled"
        description="Pulses QR modules without moving scanner-critical geometry."
        id="drafting-dot-matrix-animation-enabled"
        label="Dot matrix motion"
        onCheckedChange={(enabled) => onAnimationChange({ enabled })}
      />

      <section
        data-slot="drafting-dot-matrix-loader-section"
        className="min-w-0 rounded-[8px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] px-4 py-3 shadow-[var(--drafting-shadow-rest)]"
      >
        <div className="mb-3 min-w-0 space-y-1">
          <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
            Loader
          </p>
          <p className="drafting-type-body text-[var(--drafting-ink-muted)]">
            Square loaders adapted from the upstream matrix motion set.
          </p>
        </div>
        <div className="grid min-w-0 grid-cols-2 gap-2">
          {QR_DOT_MATRIX_SQUARE_LOADER_OPTIONS.map((loader) => {
            const isSelected = animation.loader === loader.value

            return (
              <Button
                aria-label={`Select loader ${loader.label}`}
                key={loader.value}
                type="button"
                variant="ghost"
                onClick={() => onAnimationChange({ enabled: true, loader: loader.value })}
                className={cn(
                  "h-auto min-h-10 justify-start rounded-[6px] border px-3 py-2 text-left shadow-none",
                  "border-[var(--drafting-line)] bg-[var(--drafting-control-bg)] text-[var(--drafting-ink-muted)]",
                  "hover:bg-[var(--drafting-panel-bg-hover)] hover:text-[var(--drafting-ink)]",
                  isSelected &&
                    "border-[var(--drafting-line-strong)] bg-[var(--drafting-panel-bg-active)] text-[var(--drafting-ink)]",
                )}
              >
                <span className="drafting-type-meta min-w-0 truncate font-semibold">
                  {loader.label}
                </span>
              </Button>
            )
          })}
        </div>
      </section>

      <DraftingSliderField
        dataSlot="drafting-dot-matrix-animation-speed-slider"
        description="Controls pulse travel rate in preview and animated SVG export."
        formatValue={(value) => `${Math.round(value)}x`}
        id="drafting-dot-matrix-animation-speed"
        label="Speed"
        max={QR_DOT_MATRIX_ANIMATION_SPEED_MAX}
        min={QR_DOT_MATRIX_ANIMATION_SPEED_MIN}
        step={1}
        value={animation.speed}
        onChange={(speed) => onAnimationChange({ speed })}
      />

      <DraftingSliderField
        dataSlot="drafting-dot-matrix-animation-density-slider"
        description="Sets how many animation regions run across each QR axis."
        formatValue={(value) => `${Math.round(value)}x${Math.round(value)}`}
        id="drafting-dot-matrix-animation-density"
        label="Matrix density"
        max={QR_DOT_MATRIX_MATRIX_SIZE_MAX}
        min={QR_DOT_MATRIX_MATRIX_SIZE_MIN}
        step={QR_DOT_MATRIX_MATRIX_SIZE_STEP}
        value={animation.matrixSize}
        onChange={(matrixSize) => onAnimationChange({ matrixSize })}
      />

      <DraftingSliderField
        dataSlot="drafting-dot-matrix-overlay-scale-slider"
        description="Scales only the animated overlay modules; the QR base stays fixed."
        formatValue={(value) => `${Math.round(value)}%`}
        id="drafting-dot-matrix-overlay-scale"
        label="Overlay scale"
        max={QR_DOT_MATRIX_OVERLAY_SCALE_MAX}
        min={QR_DOT_MATRIX_OVERLAY_SCALE_MIN}
        step={1}
        value={animation.overlayScale}
        onChange={(overlayScale) => onAnimationChange({ overlayScale })}
      />

      <section className="min-w-0 rounded-[8px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] px-4 py-3 shadow-[var(--drafting-shadow-rest)]">
        <p className="drafting-type-control-label mb-3 font-semibold text-[var(--drafting-ink)]">
          Loader color
        </p>
        <div className="grid min-w-0 grid-cols-2 gap-2">
          {QR_DOT_MATRIX_COLOR_PRESET_OPTIONS.map((preset) => (
            <Button
              key={preset.value}
              type="button"
              variant="ghost"
              onClick={() => onAnimationChange({ colorPreset: preset.value })}
              className={cn(
                "h-9 justify-start rounded-[6px] border px-3 text-left shadow-none",
                animation.colorPreset === preset.value
                  ? "border-[var(--drafting-line-strong)] bg-[var(--drafting-panel-bg-active)] text-[var(--drafting-ink)]"
                  : "border-[var(--drafting-line)] bg-[var(--drafting-control-bg)] text-[var(--drafting-ink-muted)]",
              )}
            >
              <span className="drafting-type-meta font-semibold">{preset.label}</span>
            </Button>
          ))}
        </div>
        {animation.colorPreset === "theme" ? (
          <div className="mt-3 grid min-w-0 gap-2">
            {[
              ["Base", "customColorBase", animation.customColorBase, "Loader base color"],
              ["Mid", "customColorMid", animation.customColorMid, "Loader mid color"],
              ["Peak", "customColorPeak", animation.customColorPeak, "Loader peak color"],
            ].map(([label, field, value, ariaLabel]) => (
              <label
                key={field}
                className="flex min-w-0 items-center justify-between gap-3 rounded-[6px] bg-[var(--drafting-control-bg)] px-3 py-2"
              >
                <span className="drafting-type-control-label font-semibold text-[var(--drafting-ink-muted)]">
                  {label}
                </span>
                <Input
                  aria-label={ariaLabel}
                  type="color"
                  value={value}
                  onChange={(event) =>
                    onAnimationChange({ [field]: event.target.value } as QrDotMatrixAnimationPatch)
                  }
                  className="h-8 w-12 shrink-0 border-0 bg-transparent p-0"
                />
              </label>
            ))}
          </div>
        ) : null}
      </section>

      <section className="min-w-0 rounded-[8px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] px-4 py-3 shadow-[var(--drafting-shadow-rest)]">
        <p className="drafting-type-control-label mb-3 font-semibold text-[var(--drafting-ink)]">
          Pattern
        </p>
        <div className="grid min-w-0 grid-cols-3 gap-2">
          {QR_DOT_MATRIX_PATTERN_OPTIONS.map((pattern) => (
            <Button
              key={pattern.value}
              type="button"
              variant="ghost"
              onClick={() => onAnimationChange({ pattern: pattern.value })}
              className={cn(
                "h-9 rounded-[6px] border px-2 shadow-none",
                animation.pattern === pattern.value
                  ? "border-[var(--drafting-line-strong)] bg-[var(--drafting-panel-bg-active)] text-[var(--drafting-ink)]"
                  : "border-[var(--drafting-line)] bg-[var(--drafting-control-bg)] text-[var(--drafting-ink-muted)]",
              )}
            >
              <span className="drafting-type-meta font-semibold">{pattern.label}</span>
            </Button>
          ))}
        </div>
      </section>

      <section className="min-w-0 space-y-2 rounded-[8px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] px-4 py-3 shadow-[var(--drafting-shadow-rest)]">
        <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
          States
        </p>
        <DraftingToggleField
          checked={animation.animated}
          dataSlot="drafting-dot-matrix-animated"
          description="Runs the loader in preview."
          id="drafting-dot-matrix-animated"
          label="Animated"
          onCheckedChange={(animated) => onAnimationChange({ animated })}
        />
      </section>

      <section className="min-w-0 space-y-3 rounded-[8px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] px-4 py-3 shadow-[var(--drafting-shadow-rest)]">
        <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
          Opacity
        </p>
        <DraftingSliderField
          dataSlot="drafting-dot-matrix-opacity-base-slider"
          formatValue={(value) => value.toFixed(2)}
          id="drafting-dot-matrix-opacity-base"
          label="Base"
          max={QR_DOT_MATRIX_OPACITY_MAX}
          min={QR_DOT_MATRIX_OPACITY_MIN}
          step={0.01}
          value={animation.opacityBase}
          onChange={(opacityBase) => onAnimationChange({ opacityBase })}
        />
        <DraftingSliderField
          dataSlot="drafting-dot-matrix-opacity-mid-slider"
          formatValue={(value) => value.toFixed(2)}
          id="drafting-dot-matrix-opacity-mid"
          label="Mid"
          max={QR_DOT_MATRIX_OPACITY_MAX}
          min={QR_DOT_MATRIX_OPACITY_MIN}
          step={0.01}
          value={animation.opacityMid}
          onChange={(opacityMid) => onAnimationChange({ opacityMid })}
        />
        <DraftingSliderField
          dataSlot="drafting-dot-matrix-opacity-peak-slider"
          formatValue={(value) => value.toFixed(2)}
          id="drafting-dot-matrix-opacity-peak"
          label="Peak"
          max={QR_DOT_MATRIX_OPACITY_MAX}
          min={QR_DOT_MATRIX_OPACITY_MIN}
          step={0.01}
          value={animation.opacityPeak}
          onChange={(opacityPeak) => onAnimationChange({ opacityPeak })}
        />
      </section>

      <DraftingToggleField
        checked={animation.exportAnimatedSvg}
        dataSlot="drafting-dot-matrix-animation-export"
        description="Reserved for a future animated SVG path. File export stays static today."
        id="drafting-dot-matrix-animation-export"
        label="Preview-only animated SVG export"
        onCheckedChange={(exportAnimatedSvg) =>
          onAnimationChange({ exportAnimatedSvg })
        }
      />
    </div>
  )
}

export function DraftingCardSettingsTab({
  value,
  onValueChange,
}: {
  value: DraftingCardState
  onValueChange: (value: DraftingCardState) => void
}) {
  const updateCard = (patch: Partial<DraftingCardState>) => {
    onValueChange({
      ...value,
      ...patch,
    })
  }

  return (
    <div data-slot="drafting-card-tab" className="min-w-0 space-y-3">
      <DraftingToggleField
        checked={value.enabled}
        dataSlot="drafting-card-enabled"
        description="Shows the presentation shape behind the active QR."
        id="drafting-card-enabled"
        label="Show shape"
        onCheckedChange={(enabled) => updateCard({ enabled })}
      />

      <DraftingSliderField
        dataSlot="drafting-card-radius-slider"
        description="Rounds the shape behind the QR."
        formatValue={(nextValue) => `${Math.round(nextValue)} px`}
        id="drafting-card-radius"
        label="Corner radius"
        max={64}
        min={0}
        step={1}
        value={value.cornerRadius}
        onChange={(cornerRadius) => updateCard({ cornerRadius })}
      />
      <DraftingSliderField
        dataSlot="drafting-card-padding-slider"
        description="Controls the inset between the QR and the shape edge."
        formatValue={(nextValue) => `${Math.round(nextValue)} px`}
        id="drafting-card-padding"
        label="Padding"
        max={72}
        min={8}
        step={1}
        value={value.padding}
        onChange={(padding) => updateCard({ padding })}
      />
      <DraftingSliderField
        dataSlot="drafting-card-bottom-space-slider"
        description="Adds room below the QR so the shape reads as a taller layout."
        formatValue={(nextValue) => `${Math.round(nextValue)} px`}
        id="drafting-card-bottom-space"
        label="Bottom space"
        max={240}
        min={0}
        step={1}
        value={value.bottomSpace}
        onChange={(bottomSpace) => updateCard({ bottomSpace })}
      />
    </div>
  )
}

export function DraftingCardSurfaceTab({
  fill,
  patternId,
  patternColors,
  styleMode,
  onFillChange,
  onPatternChange,
  onPatternColorChange,
  onResetPatternColors,
}: {
  fill: string
  onFillChange: (value: string) => void
  patternColors: Partial<Record<DraftingCardPatternId, DraftingCardPatternColorOverrides>>
  patternId: DraftingCardPatternSelectionId
  styleMode: DraftingCardStyleMode
  onPatternChange: (value: DraftingCardPatternSelectionId) => void
  onPatternColorChange: (
    patternId: DraftingCardPatternId,
    colorId: DraftingCardPatternColorSlotId,
    value: string,
  ) => void
  onResetPatternColors: (patternId: DraftingCardPatternId) => void
}) {
  return (
    <div data-slot="drafting-card-surface-tab" className="min-w-0 space-y-6">
      <label
        data-slot="drafting-card-fill-field"
        htmlFor="drafting-card-fill"
        className="block min-w-0 rounded-[8px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] px-4 py-3 shadow-[var(--drafting-shadow-rest)]"
      >
        <span className="drafting-type-control-label block font-semibold text-[var(--drafting-ink)]">
          Base fill
        </span>
        <span className="mt-3 flex min-w-0 items-center gap-2">
          <input
            aria-label="Shape fill swatch"
            className="size-10 shrink-0 cursor-pointer rounded-[6px] border border-[var(--drafting-line)] bg-transparent p-1"
            type="color"
            value={fill}
            onChange={(event) => onFillChange(event.currentTarget.value)}
          />
          <Input
            id="drafting-card-fill"
            className="drafting-type-input h-10 min-w-0 border-[var(--drafting-line)] bg-[var(--drafting-panel-bg-hover)] px-3 text-[var(--drafting-ink)] shadow-none focus-visible:border-[var(--drafting-line-strong)] focus-visible:ring-0"
            value={fill}
            onChange={(event) => onFillChange(event.currentTarget.value)}
          />
        </span>
      </label>

      <section className="min-w-0 space-y-3">
        <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
          Generated patterns
        </p>
        <div aria-label="Shape pattern" role="radiogroup" className="grid grid-cols-2 gap-2">
          <OptionCard
            appearance="drafting"
            darkShadowTone="ink"
            checked={styleMode === "pattern" && patternId === DRAFTING_CARD_PATTERN_NONE_ID}
            className={cn(
              "w-full gap-1.5",
              "[&_[data-slot=option-card]]:h-20 [&_[data-slot=option-card]]:w-full [&_[data-slot=option-card]]:overflow-hidden [&_[data-slot=option-card]]:rounded-[7px]",
              "[&_[data-slot=option-card-motif]]:size-full",
            )}
            label="None"
            motifClassName="size-full"
            name="drafting-card-pattern"
            onSelect={() => onPatternChange(DRAFTING_CARD_PATTERN_NONE_ID)}
            size="compact"
            value={DRAFTING_CARD_PATTERN_NONE_ID}
          >
            <span aria-hidden="true" className="block size-full" style={{ backgroundColor: fill }} />
          </OptionCard>

          {DRAFTING_CARD_PATTERNS.map((pattern) => (
            <OptionCard
              appearance="drafting"
              darkShadowTone="ink"
              key={pattern.id}
              checked={styleMode === "pattern" && patternId === pattern.id}
              className={cn(
                "w-full gap-1.5",
                "[&_[data-slot=option-card]]:h-20 [&_[data-slot=option-card]]:w-full [&_[data-slot=option-card]]:overflow-hidden [&_[data-slot=option-card]]:rounded-[7px]",
                "[&_[data-slot=option-card-motif]]:size-full",
                "[&_[data-slot=option-card-label]]:whitespace-nowrap",
              )}
              label={pattern.label}
              motifClassName="size-full"
              name="drafting-card-pattern"
              onSelect={() => onPatternChange(pattern.id)}
              size="compact"
              value={pattern.id}
            >
              <span
                aria-hidden="true"
                className="block size-full"
                style={
                  getDraftingCardPatternStyle(pattern.id, patternColors[pattern.id]) ??
                  pattern.style
                }
              />
            </OptionCard>
          ))}
        </div>
      </section>

      <DraftingCardColorsTab
        fill={fill}
        patternColors={patternColors}
        patternId={patternId}
        onPatternColorChange={onPatternColorChange}
        onResetPatternColors={onResetPatternColors}
      />
    </div>
  )
}

export function DraftingCardImageTab({
  cardImage,
  imageFilter,
  mode,
  styleMode,
  onCardImageChange,
  onImageFilterChange,
}: {
  cardImage: DraftingCardImageState
  imageFilter?: DraftingCardPaperShaderState
  mode: "upload" | "filters"
  styleMode?: DraftingCardStyleMode
  onCardImageChange?: (value: DraftingCardImageState) => void
  onImageFilterChange?: (value: DraftingCardPaperShaderState) => void
}) {
  if (mode === "upload" && onCardImageChange) {
    return (
      <div data-slot="drafting-card-image-upload-tab" className="min-w-0 space-y-6">
        <section className="min-w-0 space-y-3">
          <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
            Image source
          </p>
          <DraftingCardImageSourceControl
            cardImage={cardImage}
            onCardImageChange={onCardImageChange}
          />
        </section>
      </div>
    )
  }

  if (!imageFilter || !styleMode || !onImageFilterChange) {
    return null
  }

  const imageFilterWithCardImage = {
    ...imageFilter,
    image: {
      source: cardImage.source === "none" ? "sample" : cardImage.source,
      value: cardImage.value ?? DEFAULT_DRAFTING_PAPER_SHADER_IMAGE,
    },
  } satisfies DraftingCardPaperShaderState

  return (
    <div data-slot="drafting-card-image-filters-tab" className="min-w-0 space-y-6">
      <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
        Image filters
      </p>
      {cardImage.source === "none" ? (
        <div className="rounded-[7px] border border-dashed border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] p-3 text-[12px] font-medium leading-5 text-[var(--drafting-ink-muted)]">
          Add an image in Shape to apply these filters to your shape fill.
        </div>
      ) : null}
      <DraftingCardPaperShaderPanel
        dataSlot="drafting-card-image-filter-panel"
        definitions={getCardImageFilterDefinitions()}
        heading="Image filters"
        paperShader={imageFilterWithCardImage}
        showAccordions
        skipImageControls
        selectedStyleModes={["image-filter"]}
        styleMode={styleMode}
        onPaperShaderChange={onImageFilterChange}
      />
    </div>
  )
}

export function DraftingCardShadersTab({
  activeTab,
  paperShader,
  styleMode,
  onPaperShaderChange,
}: {
  activeTab?: "shaders" | "settings"
  paperShader: DraftingCardPaperShaderState
  styleMode: DraftingCardStyleMode
  onPaperShaderChange: (value: DraftingCardPaperShaderState) => void
}) {
  return (
    <div data-slot="drafting-card-shaders-tab" className="min-w-0">
      <DraftingCardPaperShaderPanel
        dataSlot="drafting-card-generated-shader-panel"
        definitions={getCardGeneratedShaderDefinitions()}
        heading="Effects"
        paperShader={paperShader}
        selectedStyleModes={["paper-shader"]}
        panelTab={activeTab}
        styleMode={styleMode}
        onPaperShaderChange={onPaperShaderChange}
      />
    </div>
  )
}

function DraftingCardImageSourceControl({
  cardImage,
  onCardImageChange,
}: {
  cardImage: DraftingCardImageState
  onCardImageChange: (value: DraftingCardImageState) => void
}) {
  const updateCardImage = (patch: Partial<DraftingCardImageState>) => {
    onCardImageChange({ ...cardImage, ...patch })
  }

  return (
    <div className="min-w-0 space-y-3 rounded-[7px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] p-3">
      <Input
        aria-label="Shape image URL"
        className="drafting-type-input h-10 min-w-0 border-[var(--drafting-line)] bg-[var(--drafting-panel-bg-hover)] px-3 text-[var(--drafting-ink)] shadow-none focus-visible:border-[var(--drafting-line-strong)] focus-visible:ring-0"
        placeholder="https://example.com/shape.png"
        value={cardImage.source === "url" ? (cardImage.value ?? "") : ""}
        onChange={(event) =>
          updateCardImage({
            source: event.currentTarget.value ? "url" : "none",
            value: event.currentTarget.value || undefined,
          })
        }
      />
      <FileUpload
        acceptedFileTypes={["image/*"]}
        className="mx-0 max-w-full"
        onUploadError={() => undefined}
        onUploadSuccess={(file) => {
          updateCardImage({
            source: "upload",
            value: URL.createObjectURL(file),
          })
        }}
        uploadDelay={0}
      />
      <div className="grid grid-cols-2 gap-2">
        {(["cover", "contain"] as const).map((fit) => (
          <Button
            key={fit}
            className={cn(
              "h-9 rounded-[7px] border border-[var(--drafting-line)] bg-transparent px-2 text-[12px] font-semibold text-[var(--drafting-ink-muted)] shadow-none hover:border-[var(--drafting-line-hover)] hover:bg-[var(--drafting-panel-bg-hover)]",
              cardImage.fit === fit &&
                "border-[var(--drafting-line-strong)] text-[var(--drafting-ink)]",
            )}
            type="button"
            variant="ghost"
            onClick={() => updateCardImage({ fit })}
          >
            {formatPaperShaderParamLabel(fit)}
          </Button>
        ))}
      </div>
      <DraftingSliderField
        dataSlot="drafting-card-image-opacity"
        formatValue={(value) => `${Math.round(value)}%`}
        id="drafting-card-image-opacity"
        label="Opacity"
        max={100}
        min={0}
        step={1}
        value={cardImage.opacity}
        onChange={(opacity) => updateCardImage({ opacity })}
      />
    </div>
  )
}

function DraftingCardPaperShaderPanel({
  dataSlot,
  definitions,
  heading,
  paperShader,
  panelTab,
  styleMode,
  showAccordions = false,
  skipImageControls = false,
  selectedStyleModes,
  onPaperShaderChange,
}: {
  dataSlot: string
  definitions: ReturnType<typeof getCardGeneratedShaderDefinitions>
  heading: string
  paperShader: DraftingCardPaperShaderState
  panelTab?: "shaders" | "settings"
  styleMode: DraftingCardStyleMode
  showAccordions?: boolean
  skipImageControls?: boolean
  selectedStyleModes: DraftingCardStyleMode[]
  onPaperShaderChange: (value: DraftingCardPaperShaderState) => void
}) {
  const definition = getPaperShaderDefinition(paperShader.shaderId)
  const selectedPreset =
    definition.presets.find((preset) => preset.name === paperShader.presetName) ??
    definition.presets[0]
  const speedControl = definition.controls.find(
    (control) => control.type === "number" && control.key === "speed",
  )

  const updatePaperShader = (patch: Partial<DraftingCardPaperShaderState>) => {
    onPaperShaderChange({
      ...paperShader,
      ...patch,
      image: patch.image ? { ...patch.image } : { ...paperShader.image },
      params: patch.params ? structuredClone(patch.params) : structuredClone(paperShader.params),
    })
  }

  const updateParam = (key: string, value: PaperShaderParamValue) => {
    updatePaperShader({
      params: {
        ...paperShader.params,
        [key]: value,
      },
    })
  }

  const [openShaderAccordionIds, setOpenShaderAccordionIds] = useState([
    "filter",
    "preset",
    "motion",
    "settings",
  ])
  const settingControls = definition.controls.filter(
    (control) => control.key !== "speed" && !(skipImageControls && control.type === "image"),
  )

  const filterContent = (
    <section className="min-w-0 space-y-3" data-slot="drafting-card-paper-shader-picker">
      {!showAccordions ? (
        <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
          {heading}
        </p>
      ) : null}
      <div
        aria-label="Paper shader"
        className="grid grid-cols-2 gap-2"
        role="radiogroup"
      >
        {definitions.map((shader) => {
          const isSelected =
            selectedStyleModes.includes(styleMode) && paperShader.shaderId === shader.id

          return (
            <OptionCard
              appearance="drafting"
              darkShadowTone="ink"
              key={shader.id}
              checked={isSelected}
              className={cn(
                "w-full gap-1.5",
                "[&_[data-slot=option-card]]:h-20 [&_[data-slot=option-card]]:w-full [&_[data-slot=option-card]]:overflow-hidden [&_[data-slot=option-card]]:rounded-[7px]",
                "[&_[data-slot=option-card-motif]]:size-full",
                "[&_[data-slot=option-card-label]]:whitespace-nowrap",
              )}
              label={shader.label}
              motifClassName="size-full"
              name="drafting-card-paper-shader"
              onSelect={() => {
                onPaperShaderChange(createDefaultDraftingCardPaperShader(shader.id as PaperShaderId))
              }}
              size="compact"
              value={shader.id}
            >
              <span
                aria-hidden="true"
                className="flex size-full items-center justify-center bg-[var(--drafting-control-bg)] px-2 text-center text-[11px] font-semibold text-[var(--drafting-ink-muted)]"
              >
                <PaperShaderOptionPreview
                  isSelected={isSelected}
                  shaderId={shader.id as PaperShaderId}
                />
              </span>
            </OptionCard>
          )
        })}
      </div>
    </section>
  )

  const presetContent = (
    <section className="min-w-0 space-y-3" data-slot="drafting-card-paper-shader-presets">
      {!showAccordions ? (
        <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
          Preset
        </p>
      ) : null}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="h-11 w-full justify-between rounded-[8px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] px-4 text-[var(--drafting-ink)] shadow-none hover:border-[var(--drafting-line-hover)] hover:bg-[var(--drafting-panel-bg-hover)]"
            type="button"
            variant="ghost"
          >
            <span>{selectedPreset?.name ?? paperShader.presetName}</span>
            <ChevronDown className="size-4 text-[var(--drafting-ink-muted)]" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className="w-[276px] rounded-[8px] border border-[var(--drafting-dropdown-border)] bg-[var(--drafting-dropdown-menu-surface-open)] p-2 text-[var(--drafting-dropdown-text)] shadow-[var(--drafting-dropdown-menu-shadow-open)]"
        >
          <DropdownMenuGroup>
            {definition.presets.map((preset) => (
              <DropdownMenuItem
                key={preset.name}
                className={cn(
                  "h-9 cursor-default rounded-[6px] px-2 text-[12px] font-medium",
                  preset.name === paperShader.presetName &&
                    "bg-[var(--drafting-dropdown-selected-fill)]",
                )}
                onClick={() =>
                  onPaperShaderChange(
                    applyDraftingCardPaperShaderPreset(paperShader, preset.name),
                  )
                }
              >
                {preset.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </section>
  )

  const motionContent = (
    <section className="min-w-0 space-y-3" data-slot="drafting-card-paper-shader-motion">
      {!showAccordions ? (
        <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
          Motion
        </p>
      ) : null}
      <DraftingToggleField
        checked={paperShader.paused}
        dataSlot="drafting-card-paper-shader-paused"
        description="Stops the shader animation while keeping the current frame visible."
        id="drafting-card-paper-shader-paused"
        label="Pause"
        onCheckedChange={(paused) => updatePaperShader({ paused })}
      />
      {speedControl?.type === "number" ? (
        <DraftingSliderField
          dataSlot="drafting-card-paper-shader-speed"
          formatValue={(value) => value.toFixed(2)}
          id="drafting-card-paper-shader-speed"
          label="Speed"
          max={speedControl.max}
          min={speedControl.min}
          step={speedControl.step ?? 0.01}
          value={paperShader.speed}
          onChange={(speed) => updatePaperShader({ speed })}
        />
      ) : null}
      <DraftingSliderField
        dataSlot="drafting-card-paper-shader-frame"
        formatValue={(value) => `${Math.round(value)}`}
        id="drafting-card-paper-shader-frame"
        label="Frame"
        max={10000}
        min={0}
        step={1}
        value={paperShader.frame}
        onChange={(frame) => updatePaperShader({ frame })}
      />
    </section>
  )

  const settingsContent = (
    <section className="min-w-0 space-y-3" data-slot="drafting-card-paper-shader-params">
      {!showAccordions ? (
        <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
          Settings
        </p>
      ) : null}
      {settingControls.map((control) => (
        <DraftingPaperShaderParamControl
          key={control.key}
          control={control}
          maxColorCount={definition.maxColorCount}
          paperShader={paperShader}
          value={paperShader.params[control.key]}
          onChange={(nextValue) => {
            if (control.type === "image") {
              updatePaperShader({
                image: nextValue as DraftingCardPaperShaderState["image"],
              })
              return
            }

            updateParam(control.key, nextValue as PaperShaderParamValue)
          }}
        />
      ))}
    </section>
  )

  if (showAccordions) {
    return (
      <div data-slot={dataSlot} className="min-w-0">
        <DraftingAccordion
          dataSlot={`${dataSlot}-accordion`}
          items={[
            { id: "filter", title: "Filter", content: filterContent },
            { id: "preset", title: "Preset", content: presetContent },
            { id: "motion", title: "Motion", content: motionContent },
            { id: "settings", title: "Settings", content: settingsContent },
          ]}
          openItemIds={openShaderAccordionIds}
          onOpenItemIdsChange={setOpenShaderAccordionIds}
        />
      </div>
    )
  }

  return (
    <div
      data-slot={dataSlot}
      className="min-w-0 space-y-6"
    >
      {panelTab === "shaders" ? (
        <>
          {filterContent}
          {presetContent}
        </>
      ) : panelTab === "settings" ? (
        <>
          {motionContent}
          {settingsContent}
        </>
      ) : (
        <>
          {filterContent}
          {presetContent}
          {motionContent}
          {settingsContent}
        </>
      )}
    </div>
  )
}

function DraftingPaperShaderParamControl({
  control,
  maxColorCount,
  paperShader,
  value,
  onChange,
}: {
  control: PaperShaderControlDefinition
  maxColorCount?: number
  paperShader: DraftingCardPaperShaderState
  value: PaperShaderParamValue
  onChange: (value: DraftingCardPaperShaderState["image"] | PaperShaderParamValue) => void
}) {
  const label = formatPaperShaderParamLabel(control.key)

  if (control.type === "image") {
    return (
      <DraftingPaperShaderImageControl
        image={paperShader.image}
        label={label}
        onChange={(image) => onChange(image)}
      />
    )
  }

  if (control.type === "boolean") {
    return (
      <DraftingToggleField
        checked={Boolean(value)}
        dataSlot={`drafting-card-paper-shader-${control.key}`}
        description={`Toggles ${label.toLowerCase()} for the selected shader.`}
        id={`drafting-card-paper-shader-${control.key}`}
        label={label}
        onCheckedChange={(nextValue) => onChange(nextValue)}
      />
    )
  }

  if (control.type === "number" && typeof value === "number") {
    return (
      <DraftingSliderField
        dataSlot={`drafting-card-paper-shader-${control.key}`}
        formatValue={(nextValue) => formatPaperShaderNumberValue(control.key, nextValue)}
        id={`drafting-card-paper-shader-${control.key}`}
        label={label}
        max={control.max}
        min={control.min}
        step={control.step ?? 0.01}
        value={value}
        onChange={onChange}
      />
    )
  }

  if (control.type === "colors" && Array.isArray(value)) {
    return (
      <DraftingPaperShaderColorArrayControl
        colors={value as string[]}
        label={label}
        maxColorCount={maxColorCount ?? 10}
        onChange={onChange}
      />
    )
  }

  if (control.type === "color" && typeof value === "string") {
    return (
      <DraftingPaperShaderColorControl
        label={label}
        value={value}
        onChange={onChange}
      />
    )
  }

  if (control.type === "enum" && typeof value === "string") {
    return (
      <div className="min-w-0 space-y-2 rounded-[7px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] p-3">
        <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
          {label}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {control.options.map((option) => (
            <Button
              key={option}
              className={cn(
                "h-9 rounded-[7px] border border-[var(--drafting-line)] bg-transparent px-2 text-[12px] font-semibold text-[var(--drafting-ink-muted)] shadow-none hover:border-[var(--drafting-line-hover)] hover:bg-[var(--drafting-panel-bg-hover)]",
                value === option &&
                  "border-[var(--drafting-line-strong)] text-[var(--drafting-ink)]",
              )}
              type="button"
              variant="ghost"
              onClick={() => onChange(option)}
            >
              {formatPaperShaderParamLabel(option)}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return null
}

function DraftingPaperShaderImageControl({
  image,
  label,
  onChange,
}: {
  image: DraftingCardPaperShaderState["image"]
  label: string
  onChange: (value: DraftingCardPaperShaderState["image"]) => void
}) {
  return (
    <div
      className="min-w-0 space-y-3 rounded-[7px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] p-3"
      data-slot="drafting-card-paper-shader-image"
    >
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
          {label}
        </p>
        <Button
          className="h-8 rounded-[6px] border border-[var(--drafting-line)] bg-transparent px-3 text-[12px] font-semibold text-[var(--drafting-ink-muted)] shadow-none hover:border-[var(--drafting-line-hover)] hover:bg-[var(--drafting-panel-bg-hover)]"
          type="button"
          variant="ghost"
          onClick={() =>
            onChange({
              source: "sample",
              value: DEFAULT_DRAFTING_PAPER_SHADER_IMAGE,
            })
          }
        >
          Use sample
        </Button>
      </div>
      <p className="drafting-type-caption text-[var(--drafting-ink-muted)]">
        {image.source === "upload" ? "Uploaded image" : "Built-in sample image"}
      </p>
      <FileUpload
        acceptedFileTypes={["image/*"]}
        className="mx-0 max-w-full"
        onUploadError={() => undefined}
        onUploadSuccess={(file) => {
          onChange({
            source: "upload",
            value: URL.createObjectURL(file),
          })
        }}
        uploadDelay={0}
      />
    </div>
  )
}

function DraftingPaperShaderColorArrayControl({
  colors,
  label,
  maxColorCount,
  onChange,
}: {
  colors: string[]
  label: string
  maxColorCount: number
  onChange: (value: string[]) => void
}) {
  return (
    <div className="min-w-0 space-y-3 rounded-[7px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] p-3">
      <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
        {label}
      </p>
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {colors.map((color, index) => (
          <label
            key={`${color}-${index}`}
            className="relative block size-10 shrink-0 cursor-pointer overflow-hidden rounded-full border border-[var(--drafting-line)] shadow-[var(--drafting-shadow-rest)]"
            style={{ backgroundColor: color }}
          >
            <span className="sr-only">
              {label} {index + 1}
            </span>
            <input
              aria-label={`${label} ${index + 1}`}
              className="absolute inset-0 size-full cursor-pointer opacity-0"
              type="color"
              value={isPaperShaderHexColor(color) ? color : PAPER_SHADER_COLOR_INPUT_FALLBACK}
              onChange={(event) => {
                const nextColors = [...colors]
                nextColors[index] = event.currentTarget.value
                onChange(nextColors)
              }}
            />
          </label>
        ))}
        <Button
          aria-label={`Add ${label}`}
          className="size-10 rounded-full border border-dashed border-[var(--drafting-line)] bg-transparent p-0 text-[var(--drafting-ink-muted)] shadow-none hover:border-[var(--drafting-line-hover)] hover:bg-[var(--drafting-panel-bg-hover)]"
          disabled={colors.length >= maxColorCount}
          type="button"
          variant="ghost"
          onClick={() => onChange([...colors, PAPER_SHADER_NEW_COLOR])}
        >
          <PlusIcon className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

function DraftingPaperShaderColorControl({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid min-w-0 gap-2 rounded-[7px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] p-3">
      <span className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
        {label}
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <input
          aria-label={label}
          className="size-10 shrink-0 cursor-pointer rounded-[6px] border border-[var(--drafting-line)] bg-transparent p-1"
          type="color"
          value={isPaperShaderHexColor(value) ? value : PAPER_SHADER_COLOR_INPUT_FALLBACK}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
        <Input
          className="drafting-type-input h-10 min-w-0 border-[var(--drafting-line)] bg-[var(--drafting-panel-bg-hover)] px-3 text-[var(--drafting-ink)] shadow-none focus-visible:border-[var(--drafting-line-strong)] focus-visible:ring-0"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
        />
      </span>
    </label>
  )
}

function isPaperShaderHexColor(value: string) {
  return /^#[0-9a-f]{6}$/i.test(value)
}

function DraftingCardColorsTab({
  fill,
  patternColors,
  patternId,
  onPatternColorChange,
  onResetPatternColors,
}: {
  fill: string
  patternColors: Partial<Record<DraftingCardPatternId, DraftingCardPatternColorOverrides>>
  patternId: DraftingCardPatternSelectionId
  onPatternColorChange: (
    patternId: DraftingCardPatternId,
    colorId: DraftingCardPatternColorSlotId,
    value: string,
  ) => void
  onResetPatternColors: (patternId: DraftingCardPatternId) => void
}) {
  const pattern = getDraftingCardPatternById(patternId)

  if (!pattern) {
    return (
      <div data-slot="drafting-card-colors-tab" className="min-w-0 space-y-3">
        <div
          aria-hidden="true"
          className="h-24 overflow-hidden rounded-[7px] border border-[var(--drafting-line)]"
          style={{ backgroundColor: fill }}
        />
        <p className="drafting-type-caption text-[var(--drafting-ink-muted)]">
          Choose a pattern in Surface to edit colors.
        </p>
      </div>
    )
  }

  const selectedPatternId = pattern.id as DraftingCardPatternId
  const overrides = patternColors[selectedPatternId] ?? {}
  const previewStyle = getDraftingCardPatternStyle(selectedPatternId, overrides)

  return (
    <div data-slot="drafting-card-colors-tab" className="min-w-0 space-y-4">
      <div
        aria-label={`${pattern.label} color preview`}
        data-slot="drafting-card-pattern-color-preview"
        className="h-24 overflow-hidden rounded-[7px] border border-[var(--drafting-line)]"
        style={previewStyle ?? pattern.style}
      />

      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
          {pattern.label}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-[6px] px-2 text-[11px] font-semibold text-[var(--drafting-ink-muted)] hover:text-[var(--drafting-ink)]"
          onClick={() => onResetPatternColors(selectedPatternId)}
        >
          Reset pattern colors
        </Button>
      </div>

      <div className="grid min-w-0 gap-4">
        {pattern.colorSlots.map((slot) => (
          <label
            className="grid min-w-0 gap-2 rounded-[7px] border border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] p-3"
            key={slot.id}
          >
            <span className="flex min-w-0 items-center justify-between gap-3">
              <span className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
                {slot.label}
              </span>
              <span className="font-mono text-[11px] text-[var(--drafting-ink-muted)]">
                {overrides[slot.id] ?? slot.defaultValue}
              </span>
            </span>
            <input
              aria-label={`${pattern.label} ${slot.label}`}
              className="h-10 w-full cursor-pointer rounded-[6px] border border-[var(--drafting-line)] bg-[var(--drafting-control-bg)] p-1"
              data-slot="drafting-card-pattern-color-input"
              onChange={(event) =>
                onPatternColorChange(selectedPatternId, slot.id, event.currentTarget.value)
              }
              onInput={(event) =>
                onPatternColorChange(selectedPatternId, slot.id, event.currentTarget.value)
              }
              type="color"
              value={overrides[slot.id] ?? slot.defaultValue}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

export function DraftingCornerSquareStyleTab({
  onValueChange,
  value,
}: {
  onValueChange: (value: QrFinderPatternOuterStyle) => void
  value: QrFinderPatternOuterStyle
}) {
  return (
    <DraftingOptionCardGrid
      ariaLabel="Corner frame style options"
      dataSlot="drafting-corner-square-option-grid"
      name="drafting-corner-square-style"
      options={CORNER_SQUARE_STYLE_OPTIONS}
      previewKind="corner-square"
      value={value}
      onValueChange={onValueChange}
    />
  )
}

export function DraftingCornerDotStyleTab({
  onValueChange,
  value,
}: {
  onValueChange: (value: StudioCornerDotStyle) => void
  value: StudioCornerDotStyle
}) {
  return (
    <DraftingOptionCardGrid
      ariaLabel="Corner dot style options"
      dataSlot="drafting-corner-dot-option-grid"
      name="drafting-corner-dot-style"
      options={CORNER_DOT_STYLE_OPTIONS}
      previewKind="corner-dot"
      value={value}
      onValueChange={onValueChange}
    />
  )
}

export function DraftingDotsColorTab({
  mode,
  openItemIds,
  palette,
  solidColor,
  gradient,
  onGradientChange,
  onModeChange,
  onOpenItemIdsChange,
  onSolidColorChange,
}: {
  gradient: StudioGradient
  mode: DotsColorMode
  onGradientChange: (gradient: StudioGradient) => void
  onModeChange: (mode: DotsColorMode) => void
  onOpenItemIdsChange: (itemIds: string[]) => void
  onSolidColorChange: (value: string) => void
  openItemIds: string[]
  palette: string[]
  solidColor: string
}) {
  const items: Array<{
    id: DotsColorMode
    title: string
    content: ReactNode
  }> = [
    {
      id: "solid",
      title: "Solid",
      content: (
        <div className="min-w-0 px-4 pb-4">
          <EmbeddedColorPickerField
            chrome="minimal"
            label="Solid color"
            onValueChange={(value) => {
              onModeChange("solid")
              onSolidColorChange(value)
            }}
            pickerChrome="drafting"
            pickerClassName="mx-auto max-w-full"
            size={320}
            value={solidColor}
          />
        </div>
      ),
    },
    {
      id: "gradient",
      title: "Gradient",
      content: (
        <div className="min-w-0 px-4 pb-4">
          <GradientEditor
            gradient={{ ...gradient, enabled: true }}
            hideToggle
            idPrefix="drafting-dots-gradient"
            layout="drafting"
            onGradientChange={(value) => {
              onModeChange("gradient")
              onGradientChange(value)
            }}
            title="Dot gradient"
            variant="dot-enhanced"
          />
        </div>
      ),
    },
    {
      id: "palette",
      title: "Palette",
      content: (
        <div className="min-w-0 px-4 pb-4">
          <div
            data-slot="drafting-dots-palette-panel"
            className="min-w-0 space-y-3"
          >
            <div className="flex min-w-0 flex-wrap gap-2">
              {palette.map((color) => (
                <span
                  key={color}
                  aria-hidden="true"
                  className="size-7 shrink-0 rounded-full border border-black/10 shadow-[var(--drafting-shadow-rest)]"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-[8px] border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] text-[var(--drafting-ink)] shadow-[var(--drafting-shadow-rest)] hover:border-[var(--drafting-line-hover)] hover:bg-[var(--drafting-panel-bg-hover)]"
              onClick={() => onModeChange("palette")}
            >
              Use palette
            </Button>
          </div>
        </div>
      ),
    },
  ]

  return (
    <DraftingAccordion
      dataSlot="drafting-dots-color-accordion"
      items={items}
      selectedId={mode}
      openItemIds={openItemIds}
      onOpenItemIdsChange={onOpenItemIdsChange}
    />
  )
}

export function DraftingCornerSquareColorTab({
  gradient,
  mode,
  openItemIds,
  solidColor,
  onGradientChange,
  onModeChange,
  onOpenItemIdsChange,
  onSolidColorChange,
}: {
  gradient: StudioGradient
  mode: DraftingBinaryColorMode
  onGradientChange: (gradient: StudioGradient) => void
  onModeChange: (mode: DraftingBinaryColorMode) => void
  onOpenItemIdsChange: (itemIds: string[]) => void
  onSolidColorChange: (value: string) => void
  openItemIds: string[]
  solidColor: string
}) {
  return (
    <DraftingAccordion
      dataSlot="drafting-corner-square-color-accordion"
      items={buildDraftingSolidGradientItems({
        gradient,
        gradientIdPrefix: "drafting-corner-square-gradient",
        gradientTitle: "Corner frame gradient",
        onGradientChange,
        onModeChange,
        onSolidColorChange,
        solidColor,
      })}
      selectedId={mode}
      openItemIds={openItemIds}
      onOpenItemIdsChange={onOpenItemIdsChange}
    />
  )
}

export function DraftingCornerDotColorTab({
  gradient,
  mode,
  openItemIds,
  solidColor,
  onGradientChange,
  onModeChange,
  onOpenItemIdsChange,
  onSolidColorChange,
}: {
  gradient: StudioGradient
  mode: DraftingBinaryColorMode
  onGradientChange: (gradient: StudioGradient) => void
  onModeChange: (mode: DraftingBinaryColorMode) => void
  onOpenItemIdsChange: (itemIds: string[]) => void
  onSolidColorChange: (value: string) => void
  openItemIds: string[]
  solidColor: string
}) {
  return (
    <DraftingAccordion
      dataSlot="drafting-corner-dot-color-accordion"
      items={buildDraftingSolidGradientItems({
        gradient,
        gradientIdPrefix: "drafting-corner-dot-gradient",
        gradientTitle: "Corner dot gradient",
        onGradientChange,
        onModeChange,
        onSolidColorChange,
        solidColor,
      })}
      selectedId={mode}
      openItemIds={openItemIds}
      onOpenItemIdsChange={onOpenItemIdsChange}
    />
  )
}

export function DraftingBackgroundColorTab({
  gradient,
  mode,
  openItemIds,
  solidColor,
  onGradientChange,
  onModeChange,
  onOpenItemIdsChange,
  onSolidColorChange,
}: {
  gradient: StudioGradient
  mode: DraftingBinaryColorMode
  onGradientChange: (gradient: StudioGradient) => void
  onModeChange: (mode: DraftingBinaryColorMode) => void
  onOpenItemIdsChange: (itemIds: string[]) => void
  onSolidColorChange: (value: string) => void
  openItemIds: string[]
  solidColor: string
}) {
  return (
    <DraftingAccordion
      dataSlot="drafting-background-color-accordion"
      items={buildDraftingSolidGradientItems({
        gradient,
        gradientIdPrefix: "drafting-background-gradient",
        gradientTitle: "Shape gradient",
        onGradientChange,
        onModeChange,
        onSolidColorChange,
        solidColor,
      })}
      selectedId={mode}
      openItemIds={openItemIds}
      onOpenItemIdsChange={onOpenItemIdsChange}
    />
  )
}

export function DraftingBackgroundShapeTab({
  gradient,
  options,
  solidColor,
  value,
  onOptionsChange,
  onValueChange,
}: {
  gradient: StudioGradient
  onOptionsChange: (options: BackgroundShapeOptions) => void
  onValueChange: (value: QrBackgroundShapeId) => void
  options: BackgroundShapeOptions
  solidColor: string
  value: QrBackgroundShapeId
}) {
  const updateShapeOptions = (patch: Partial<BackgroundShapeOptions>) => {
    onOptionsChange({
      ...options,
      ...patch,
    })
  }

  return (
    <div className="min-w-0 space-y-4" data-slot="drafting-background-shape-tab">
      <div
        aria-label="Shape options"
        className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(108px,1fr))] justify-items-center gap-x-3 gap-y-5"
        data-slot="drafting-background-shape-grid"
        role="radiogroup"
      >
        <OptionCard
          appearance="drafting"
          darkShadowTone="ink"
          checked={value === "none"}
          label="None"
          labelClassName="drafting-type-option-label"
          name="drafting-background-shape"
          onSelect={() => onValueChange("none")}
          size="compact"
          value="none"
        >
          <span
            aria-hidden="true"
            className="flex size-full items-center justify-center rounded-[7px] border border-dashed border-[var(--drafting-line)] text-[var(--drafting-ink-muted)]"
          >
            None
          </span>
        </OptionCard>
        {QR_BACKGROUND_SHAPES.map((shape) => {
          const gradientId = `drafting-background-shape-${shape.id}-gradient`
          const gradientFill = ["url(", String.fromCharCode(35), gradientId, ")"].join("")

          return (
            <OptionCard
              appearance="drafting"
              darkShadowTone="ink"
              key={shape.id}
              checked={shape.id === value}
              label={getDraftingShapeLabel(shape.id, shape.label)}
              labelClassName="drafting-type-option-label"
              name="drafting-background-shape"
              onSelect={() => onValueChange(shape.id)}
              value={shape.id}
            >
              <span className="flex items-center justify-center [&_svg]:size-[6.5rem]">
                <svg
                  aria-hidden="true"
                  fill="none"
                  viewBox={`0 0 ${shape.viewBox.width} ${shape.viewBox.height}`}
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {gradient.enabled ? (
                    <defs>
                      {gradient.type === "radial" ? (
                        <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                          {gradient.colorStops.map((stop) => (
                            <stop
                              key={`${shape.id}-${stop.offset}`}
                              offset={stop.offset}
                              stopColor={stop.color}
                            />
                          ))}
                        </radialGradient>
                      ) : (
                        <linearGradient
                          id={gradientId}
                          x1="0%"
                          x2="100%"
                          y1="0%"
                          y2="100%"
                          gradientTransform={`rotate(${(gradient.rotation * 180) / Math.PI} .5 .5)`}
                        >
                          {gradient.colorStops.map((stop) => (
                            <stop
                              key={`${shape.id}-${stop.offset}`}
                              offset={stop.offset}
                              stopColor={stop.color}
                            />
                          ))}
                        </linearGradient>
                      )}
                    </defs>
                  ) : null}
                  <path
                    d={shape.path}
                    fill={gradient.enabled ? gradientFill : solidColor}
                  />
                </svg>
              </span>
            </OptionCard>
          )
        })}
      </div>
      <div
        data-slot="drafting-background-shape-settings"
        className="min-w-0 space-y-4"
      >
        <section
          data-slot="drafting-background-shape-padding-settings"
          className="min-w-0 space-y-3"
        >
          <div className="space-y-1">
            <p className="drafting-type-control-label font-semibold text-[var(--drafting-ink)]">
              Shape
            </p>
            <p className="drafting-type-body text-[var(--drafting-ink-muted)]">
              Expands the QR backing surface without changing QR modules.
            </p>
          </div>
        <DraftingSliderField
          dataSlot="drafting-background-shape-size-slider"
          formatValue={(nextValue) => `${Math.round(nextValue)} px`}
          id="drafting-background-shape-size"
          label="Shape padding"
          max={192}
          min={0}
          step={1}
          value={options.paddingPx}
          onChange={(paddingPx) => updateShapeOptions({ paddingPx })}
        />
        </section>
      </div>
    </div>
  )
}export function DraftingLogoColorTab({
  gradient,
  mode,
  openItemIds,
  solidColor,
  onGradientChange,
  onModeChange,
  onOpenItemIdsChange,
  onSolidColorChange,
}: {
  gradient: StudioGradient
  mode: DraftingBinaryColorMode
  onGradientChange: (gradient: StudioGradient) => void
  onModeChange: (mode: DraftingBinaryColorMode) => void
  onOpenItemIdsChange: (itemIds: string[]) => void
  onSolidColorChange: (value: string) => void
  openItemIds: string[]
  solidColor: string
}) {
  return (
    <DraftingAccordion
      dataSlot="drafting-logo-color-accordion"
      items={buildDraftingSolidGradientItems({
        gradient,
        gradientIdPrefix: "drafting-logo-gradient",
        gradientTitle: "Logo icon gradient",
        onGradientChange,
        onModeChange,
        onSolidColorChange,
        solidColor,
        solidLabel: "Solid color",
      })}
      selectedId={mode}
      openItemIds={openItemIds}
      onOpenItemIdsChange={onOpenItemIdsChange}
    />
  )
}

export function DraftingBrandIconTab({
  brandIcons,
  brandIconQuery,
  onBrandIconCategoryChange,
  onBrandIconQueryChange,
  onSelect,
  selectedBrandIconId,
  selectedCategory,
}: {
  brandIcons: readonly BrandIconEntry[]
  brandIconQuery: string
  onBrandIconCategoryChange: (value: DraftingBrandIconCategoryFilter) => void
  onBrandIconQueryChange: (value: string) => void
  onSelect: (brandIcon: BrandIconEntry) => void
  selectedBrandIconId?: string
  selectedCategory: DraftingBrandIconCategoryFilter
}) {
  return (
    <div data-slot="drafting-brand-icon-tab" className="min-w-0 space-y-4">
      <section
        data-slot="drafting-brand-icon-picker"
        className="min-w-0 space-y-4"
      >
        <div className="relative space-y-2">
          <span
            aria-hidden="true"
            data-slot="drafting-brand-icon-search-icon"
            className="pointer-events-none absolute left-3 top-1/2 flex size-4 -translate-y-1/2 items-center justify-center text-[var(--drafting-ink-subtle)]"
          >
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              color="currentColor"
              strokeWidth={1.8}
            />
          </span>
          <Input
            id="drafting-brand-icon-search"
            aria-label="Search brand icons"
            className="drafting-type-input h-10 border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] pl-9 pr-3 text-[var(--drafting-ink)] shadow-[var(--drafting-shadow-rest)] placeholder:text-[var(--drafting-ink-subtle)] focus-visible:border-[var(--drafting-line-strong)] focus-visible:ring-0"
            placeholder="Search icons"
            value={brandIconQuery}
            onChange={(event) => onBrandIconQueryChange(event.target.value)}
          />
        </div>

        <div
          className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3"
          data-slot="drafting-brand-icon-category-picker"
          role="radiogroup"
        >
          {DRAFTING_BRAND_ICON_CATEGORY_OPTIONS.map((option) => {
            const isSelected = option.value === selectedCategory

            return (
              <OptionCard
                appearance="drafting"
                darkShadowTone="ink"
                key={option.value}
                checked={isSelected}
                className={cn(
                  "w-full gap-0",
                  "[&_[data-slot=option-card]]:h-[42px] [&_[data-slot=option-card]]:w-full",
                  "[&_[data-slot=option-card-motif]]:size-full",
                  "[&_[data-slot=option-card-label]]:sr-only",
                )}
                label={option.label}
                motifClassName="size-full px-3"
                name="drafting-brand-icon-category"
                onSelect={() => onBrandIconCategoryChange(option.value)}
                size="compact"
                value={option.value}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "drafting-type-meta flex size-full items-center justify-center font-medium",
                    isSelected
                      ? "text-[var(--drafting-ink)]"
                      : "text-[var(--drafting-ink-muted)]",
                  )}
                >
                  {option.label}
                </span>
              </OptionCard>
            )
          })}
        </div>

        <div
          data-slot="drafting-brand-icon-grid"
          className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(56px,1fr))] justify-items-center gap-x-2 gap-y-4"
        >
          {brandIcons.map((brandIcon) => {
            const Icon = brandIcon.icon
            const isSelected = brandIcon.id === selectedBrandIconId

            return (
              <OptionCard
                appearance="drafting"
                darkShadowTone="ink"
                key={brandIcon.id}
                checked={isSelected}
                className={cn(
                  "w-[56px]",
                  "[&_[data-slot=option-card]]:h-[56px] [&_[data-slot=option-card]]:w-[56px]",
                  "[&_[data-slot=option-card-motif]]:text-[var(--drafting-ink)]",
                )}
                label={brandIcon.label}
                labelClassName="drafting-type-caption min-h-[1.2rem]"
                motifClassName="size-full px-1.5 py-1.5"
                name="drafting-brand-icon"
                onSelect={() => onSelect(brandIcon)}
                value={brandIcon.id}
              >
                <span
                  aria-hidden="true"
                  data-brand-icon-option={brandIcon.id}
                  data-selected={isSelected ? "true" : "false"}
                  data-slot="drafting-brand-icon-option"
                  className="flex size-full items-center justify-center"
                >
                  <span className="text-[var(--drafting-ink)]">
                    <Icon className="size-[18px]" />
                  </span>
                </span>
              </OptionCard>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export function DraftingBackgroundUploadTab({
  mode,
  openItemIds,
  remoteUrl,
  onModeChange,
  onOpenItemIdsChange,
  onRemoteUrlChange,
  onUploadError,
  onUploadSuccess,
}: {
  mode: DraftingAssetSourceMode
  onModeChange: (mode: DraftingAssetSourceMode) => void
  onOpenItemIdsChange: (itemIds: string[]) => void
  onRemoteUrlChange: (value: string) => void
  onUploadError: (message: string) => void
  onUploadSuccess: (file: File) => void
  openItemIds: string[]
  remoteUrl: string
}) {
  return (
    <DraftingAccordion
      dataSlot="drafting-background-upload-accordion"
      items={buildDraftingAssetSourceItems({
        onModeChange,
        onRemoteUrlChange,
        onUploadError,
        onUploadSuccess,
        remoteUrl,
        remoteUrlAriaLabel: "Shape image URL",
        remoteUrlPlaceholder: "https://example.com/shape.png",
      })}
      selectedId={mode}
      openItemIds={openItemIds}
      onOpenItemIdsChange={onOpenItemIdsChange}
    />
  )
}

function getDraftingShapeLabel(shapeId: QrBackgroundShapeId, fallbackLabel: string) {
  const labelById: Partial<Record<QrBackgroundShapeId, string>> = {
    circle: "Circle",
    "rounded-square": "Rounded",
    "skew-card": "Ticket",
    "notched-badge": "Badge",
    "diagonal-pill": "Label",
    hexagon: "Badge",
  }

  return labelById[shapeId] ?? fallbackLabel
}

export function DraftingLogoUploadTab({
  mode,
  openItemIds,
  remoteUrl,
  onModeChange,
  onOpenItemIdsChange,
  onRemoteUrlChange,
  onUploadError,
  onUploadSuccess,
}: {
  mode: DraftingAssetSourceMode
  onModeChange: (mode: DraftingAssetSourceMode) => void
  onOpenItemIdsChange: (itemIds: string[]) => void
  onRemoteUrlChange: (value: string) => void
  onUploadError: (message: string) => void
  onUploadSuccess: (file: File) => void
  openItemIds: string[]
  remoteUrl: string
}) {
  return (
    <DraftingAccordion
      dataSlot="drafting-logo-upload-accordion"
      items={buildDraftingAssetSourceItems({
        onModeChange,
        onRemoteUrlChange,
        onUploadError,
        onUploadSuccess,
        remoteUrl,
        remoteUrlAriaLabel: "Remote logo URL",
        remoteUrlPlaceholder: "https://example.com/logo.png",
      })}
      selectedId={mode}
      openItemIds={openItemIds}
      onOpenItemIdsChange={onOpenItemIdsChange}
    />
  )
}

export function DraftingLogoSizeTab({
  hideBackgroundDots,
  logoMargin,
  logoSize,
  onHideBackgroundDotsChange,
  onLogoMarginChange,
  onLogoSizeChange,
}: {
  hideBackgroundDots: boolean
  logoMargin: number
  logoSize: number
  onHideBackgroundDotsChange: (value: boolean) => void
  onLogoMarginChange: (value: number) => void
  onLogoSizeChange: (value: number) => void
}) {
  return (
    <div
      data-slot="drafting-logo-size-tab"
      className="min-w-0 space-y-3"
    >
      <DraftingSliderField
        dataSlot="drafting-logo-size-slider"
        description="Sets the logo width as a percentage of the QR code."
        formatValue={(value) => `${Math.round(value)}%`}
        id="drafting-logo-size"
        label="Logo size"
        max={100}
        min={0}
        showSteps
        step={10}
        value={logoSize}
        onChange={onLogoSizeChange}
      />

      <DraftingSliderField
        dataSlot="drafting-logo-margin-slider"
        formatValue={(value) => `${Math.round(value)} px`}
        id="drafting-logo-margin"
        label="Logo margin"
        max={40}
        min={0}
        step={1}
        value={logoMargin}
        onChange={onLogoMarginChange}
      />

      <DraftingToggleField
        checked={hideBackgroundDots}
        dataSlot="drafting-logo-hide-background-dots"
        description="Clears the modules directly under the logo so the image reads cleanly."
        id="drafting-hide-background-dots"
        label="Hide background dots"
        onCheckedChange={onHideBackgroundDotsChange}
      />
    </div>
  )
}

export function DraftingEncodingTab({
  errorCorrectionLevel,
  typeNumber,
  onQrErrorCorrectionLevelChange,
  onQrTypeNumberChange,
}: {
  errorCorrectionLevel: QrErrorCorrectionLevel
  typeNumber: QrTypeNumber
  onQrErrorCorrectionLevelChange: (value: QrErrorCorrectionLevel) => void
  onQrTypeNumberChange: (value: QrTypeNumber) => void
}) {
  return (
    <div data-slot="drafting-encoding-tab" className="min-w-0 space-y-4">
      <DraftingSliderField
        dataSlot="drafting-type-number-slider"
        description="Auto picks the QR version for you. Higher values force denser versions with more modules."
        formatValue={(value) => formatQrTypeNumberLabel(value)}
        id="drafting-type-number"
        label="Type number"
        max={TYPE_NUMBER_MAX}
        min={TYPE_NUMBER_MIN}
        step={1}
        value={typeNumber}
        onChange={(value) => onQrTypeNumberChange(value as QrTypeNumber)}
      />

      <section data-slot="drafting-error-correction-section" className="space-y-3">
        <div className="space-y-1">
          <h3 className="drafting-type-section-title font-semibold text-[var(--drafting-ink)]">
            Error correction
          </h3>
          <p className="drafting-type-body text-[var(--drafting-ink-muted)]">
            Higher recovery makes styled codes more tolerant to logos, crops, and wear.
          </p>
        </div>

        <div
          data-slot="drafting-error-correction-grid"
          role="radiogroup"
          aria-label="Error correction levels"
          className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {ERROR_CORRECTION_LEVEL_OPTIONS.map((option) => {
            const isSelected = option.value === errorCorrectionLevel

            return (
              <OptionCard
                appearance="drafting"
                darkShadowTone="ink"
                key={option.value}
                checked={isSelected}
                className={cn(
                  "w-full gap-2",
                  "[&_[data-slot=option-card]]:h-full [&_[data-slot=option-card]]:min-h-[112px] [&_[data-slot=option-card]]:w-full",
                  "[&_[data-slot=option-card-motif]]:size-full",
                  "[&_[data-slot=option-card-label]]:sr-only",
                )}
                label={`${option.title} (${option.label})`}
                motifClassName="size-full px-3 py-3"
                name="drafting-error-correction"
                onSelect={() => onQrErrorCorrectionLevelChange(option.value)}
                value={option.value}
              >
                <span className="flex size-full flex-col items-start justify-between gap-2 text-left">
                  <span
                    className={cn(
                      "drafting-type-display-data font-semibold",
                      isSelected
                        ? "text-[var(--drafting-ink)]"
                        : "text-[var(--drafting-ink-muted)]",
                    )}
                  >
                    {option.label}
                  </span>
                  <span className="space-y-1">
                    <span
                      className={cn(
                        "drafting-type-meta block font-semibold",
                        isSelected
                          ? "text-[var(--drafting-ink)]"
                          : "text-[var(--drafting-ink-strong-muted)]",
                      )}
                    >
                      {option.title}
                    </span>
                    <span
                      className={cn(
                        "drafting-type-body block",
                        isSelected
                          ? "text-[var(--drafting-ink)]"
                          : "text-[var(--drafting-ink-muted)]",
                      )}
                    >
                      {option.summary}
                    </span>
                  </span>
                </span>
              </OptionCard>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function buildDraftingSolidGradientItems({
  gradient,
  gradientIdPrefix,
  gradientTitle,
  onGradientChange,
  onModeChange,
  onSolidColorChange,
  solidLabel = "Solid color",
  solidColor,
}: {
  gradient: StudioGradient
  gradientIdPrefix: string
  gradientTitle: string
  onGradientChange: (gradient: StudioGradient) => void
  onModeChange: (mode: DraftingBinaryColorMode) => void
  onSolidColorChange: (value: string) => void
  solidLabel?: string
  solidColor: string
}) {
  return [
    {
      id: "solid" as const,
      title: "Solid",
      content: (
        <div className="min-w-0 px-4 pb-4">
          <EmbeddedColorPickerField
            chrome="minimal"
            label={solidLabel}
            onValueChange={(value) => {
              onModeChange("solid")
              onSolidColorChange(value)
            }}
            pickerChrome="drafting"
            pickerClassName="mx-auto max-w-full"
            size={320}
            value={solidColor}
          />
        </div>
      ),
    },
    {
      id: "gradient" as const,
      title: "Gradient",
      content: (
        <div className="min-w-0 px-4 pb-4">
          <GradientEditor
            gradient={{ ...gradient, enabled: true }}
            hideToggle
            idPrefix={gradientIdPrefix}
            layout="drafting"
            onGradientChange={(value) => {
              onModeChange("gradient")
              onGradientChange(value)
            }}
            title={gradientTitle}
            variant="dot-enhanced"
          />
        </div>
      ),
    },
  ]
}

function buildDraftingAssetSourceItems({
  onModeChange,
  onRemoteUrlChange,
  onUploadError,
  onUploadSuccess,
  remoteUrl,
  remoteUrlAriaLabel,
  remoteUrlPlaceholder,
}: {
  onModeChange: (mode: DraftingAssetSourceMode) => void
  onRemoteUrlChange: (value: string) => void
  onUploadError: (message: string) => void
  onUploadSuccess: (file: File) => void
  remoteUrl: string
  remoteUrlAriaLabel: string
  remoteUrlPlaceholder: string
}) {
  return [
    {
      id: "upload" as const,
      title: "Upload file",
      content: (
        <div className="min-w-0 px-4 pb-4">
          <FileUpload
            acceptedFileTypes={["image/*"]}
            className="mx-0 max-w-full"
            onUploadError={(error) => onUploadError(error.message)}
            onUploadSuccess={(file) => {
              onModeChange("upload")
              onUploadSuccess(file)
            }}
            uploadDelay={0}
          />
        </div>
      ),
    },
    {
      id: "url" as const,
      title: "Remote URL",
      content: (
        <div className="min-w-0 px-4 pb-4">
          <Input
            aria-label={remoteUrlAriaLabel}
            className="drafting-type-input h-10 rounded-[8px] border-[var(--drafting-line)] bg-[var(--drafting-panel-bg)] px-3 text-[var(--drafting-ink)] shadow-[var(--drafting-shadow-rest)] placeholder:text-[var(--drafting-ink-subtle)] focus-visible:border-[var(--drafting-line-strong)] focus-visible:ring-0"
            placeholder={remoteUrlPlaceholder}
            value={remoteUrl}
            onChange={(event) => {
              onModeChange("url")
              onRemoteUrlChange(event.target.value)
            }}
          />
        </div>
      ),
    },
  ]
}

function DraftingAccordion({
  dataSlot,
  items,
  selectedId,
  openItemIds,
  onOpenItemIdsChange,
}: {
  dataSlot: string
  items: Array<{
    id: string
    title: string
    content: ReactNode
    error?: string
  }>
  selectedId?: string
  onOpenItemIdsChange: (itemIds: string[]) => void
  openItemIds: string[]
}) {
  return (
    <div data-slot="drafting-style-color-tab" className="min-w-0 space-y-2">
      <Accordion
        data-slot={dataSlot}
        className="min-w-0 w-full max-w-full"
        type="multiple"
        value={openItemIds}
        onValueChange={onOpenItemIdsChange}
      >
        {items.map((item) => {
          const isSelected = selectedId !== undefined && item.id === selectedId
          const hasError = Boolean(item.error)

          return (
            <AccordionItem
              key={item.id}
              data-item-id={item.id}
              data-selected={isSelected ? "true" : "false"}
              value={item.id}
              className={cn(
                "mb-2 min-w-0 w-full overflow-hidden rounded-[8px] last:mb-0 last:border-b",
                "bg-[var(--drafting-panel-bg)] shadow-[var(--drafting-shadow-rest)] transition-[border-color,box-shadow,background-color] duration-150 ease-out",
                "hover:bg-[var(--drafting-panel-bg-hover)] hover:shadow-[var(--drafting-shadow-hover)]",
                "active:translate-y-0 active:bg-[var(--drafting-panel-bg-active)] active:shadow-[var(--drafting-shadow-active)]",
                "data-[state=open]:bg-[var(--drafting-panel-bg-hover)]",
                isSelected
                  ? "border-2 border-dashed border-[var(--drafting-line-strong)] hover:border-[var(--drafting-line-strong)] active:border-[var(--drafting-line-strong)] last:border-b-2 bg-[var(--drafting-panel-bg-active)]"
                  : "border border-dashed border-[var(--drafting-line)] hover:border-[var(--drafting-line-hover)] active:border-[var(--drafting-line-hover)]",
              )}
            >
              <AccordionTrigger
                data-item-id={item.id}
                data-slot="drafting-color-trigger"
                className={cn(
                  "px-3 py-2.5 no-underline hover:no-underline focus-visible:ring-0",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-[var(--drafting-line-strong)]",
                  "text-[var(--drafting-ink-muted)] hover:text-[var(--drafting-ink-strong-muted)] data-[state=open]:text-[var(--drafting-ink)]",
                  "[&_[data-slot=accordion-chevron]]:text-[var(--drafting-ink-muted)] hover:[&_[data-slot=accordion-chevron]]:text-[var(--drafting-ink-strong-muted)] data-[state=open]:[&_[data-slot=accordion-chevron]]:text-[var(--drafting-ink)]",
                )}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={cn(
                      "drafting-type-control-label font-medium text-[var(--drafting-ink-muted)] transition-colors",
                      isSelected && "font-semibold text-[var(--drafting-ink)]",
                    )}
                  >
                    {item.title}
                  </span>
                  {hasError ? (
                    <span className="shrink-0 self-center text-[6px] leading-none text-[var(--destructive)] opacity-60" aria-hidden="true">
                      ●
                    </span>
                  ) : null}
                </span>
              </AccordionTrigger>
              <AccordionContent
                data-slot="drafting-color-content"
                className="min-w-0 pb-0"
              >
                {item.content}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}

function DraftingSliderField({
  dataSlot,
  description,
  formatValue,
  id,
  label,
  max,
  min,
  onChange,
  showSteps = false,
  step,
  value,
}: {
  dataSlot: string
  description?: string
  formatValue: (value: number) => string
  id: string
  label: string
  max: number
  min: number
  onChange: (value: number) => void
  showSteps?: boolean
  step: number
  value: number
}) {
  const sliderVariant = useDraftingSliderVariant()

  if (sliderVariant === "desktop-elastic") {
    return (
      <div data-slot={`${dataSlot}-field`} className="min-w-0 px-0 py-1">
        <div data-slot={dataSlot} data-appearance="desktop-elastic">
          <ElasticSlider
            aria-label={label}
            className="desktop-elastic-slider w-full"
            formatValue={formatValue}
            label={label}
            max={max}
            min={min}
            scrubSound
            step={step}
            value={value}
            onValueChange={onChange}
          />
        </div>
        {description ? (
          <p className="drafting-type-caption mt-2 text-[var(--drafting-ink-muted)]">{description}</p>
        ) : null}
      </div>
    )
  }

  return (
    <DraftingInspectorSection
      dataSlot={`${dataSlot}-field`}
      className="transition-[border-color,box-shadow,background-color] duration-150 ease-out hover:border-[var(--drafting-line-hover)] hover:bg-[var(--drafting-panel-bg-hover)] hover:shadow-[var(--drafting-shadow-hover)] focus-within:border-[var(--drafting-line-strong)] focus-within:bg-[var(--drafting-panel-bg-active)]"
    >
      <UnlumenSlider
        appearance="drafting"
        className="w-full"
        data-slot={dataSlot}
        formatValue={formatValue}
        id={id}
        label={label}
        max={max}
        min={min}
        showSteps={showSteps}
        showValue
        step={step}
        thumbDataSlot={`${dataSlot}-thumb`}
        trackClassName="bg-[var(--drafting-control-bg)]"
        trackDataSlot={`${dataSlot}-track`}
        value={value}
        onChange={(nextValue) => onChange(Array.isArray(nextValue) ? nextValue[0] ?? value : nextValue)}
      />
      {description ? (
        <p className="drafting-type-caption mt-2 text-[var(--drafting-ink-muted)]">{description}</p>
      ) : null}
    </DraftingInspectorSection>
  )
}

function DraftingToggleField({
  checked,
  dataSlot,
  description,
  id,
  label,
  onCheckedChange,
}: {
  checked: boolean
  dataSlot: string
  description: string
  id: string
  label: string
  onCheckedChange: (value: boolean) => void
}) {
  return (
    <DraftingInspectorSection
      dataSlot={dataSlot}
      className={cn(
        "cursor-pointer transition-[border-color,box-shadow,background-color] duration-150 ease-out hover:border-[var(--drafting-line-hover)] hover:bg-[var(--drafting-panel-bg-hover)] hover:shadow-[var(--drafting-shadow-hover)] focus-within:border-[var(--drafting-line-strong)] focus-within:bg-[var(--drafting-panel-bg-active)]",
        checked && "border-[var(--drafting-line-strong)] bg-[var(--drafting-panel-bg-active)]",
      )}
    >
      <DraftingInspectorControlRow
        description={description}
        htmlFor={id}
        label={label}
        value={
          <Switch
            checked={checked}
            className={cn(
              "ml-auto h-[20px] w-[36px] shrink-0 border border-[var(--drafting-line)] bg-[var(--drafting-control-bg)]",
              "shadow-[var(--drafting-shadow-rest)] transition-[background-color,border-color,box-shadow] duration-150",
              "hover:border-[var(--drafting-line-hover)] hover:bg-[var(--drafting-control-bg-hover)]",
              "data-[state=checked]:border-[var(--drafting-ink)] data-[state=checked]:bg-[var(--drafting-ink)]",
              "focus-visible:ring-2 focus-visible:ring-[var(--drafting-line-hover)] focus-visible:ring-offset-0",
            )}
            data-slot={`${dataSlot}-switch`}
            id={id}
            onCheckedChange={onCheckedChange}
          />
        }
      />
    </DraftingInspectorSection>
  )
}

function DraftingOptionCardGrid<TValue extends string>({
  ariaLabel,
  dataSlot,
  name,
  onValueChange,
  options,
  previewKind,
  value,
}: {
  ariaLabel: string
  dataSlot: string
  name: string
  onValueChange: (value: TValue) => void
  options: Array<{ label: string; value: TValue }>
  previewKind: StylePreviewKind
  value: TValue
}) {
  return (
    <DraftingInspectorSection
      className="bg-transparent shadow-none"
      dataSlot="drafting-style-tab"
    >
      <div
        aria-label={ariaLabel}
        className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(76px,1fr))] justify-items-center gap-x-2 gap-y-4"
        data-slot={dataSlot}
        role="radiogroup"
      >
        {options.map((option) => (
          <OptionCard
            appearance="drafting"
            darkShadowTone="ink"
            key={option.value}
            checked={option.value === value}
            labelClassName="drafting-type-option-label"
            label={option.label}
            name={name}
            onSelect={() => onValueChange(option.value)}
            size="compact"
            value={option.value}
          >
            <span className="flex items-center justify-center [&_svg]:size-[4.5rem]">
              <StylePreview previewKind={previewKind} value={option.value} />
            </span>
          </OptionCard>
        ))}
      </div>
    </DraftingInspectorSection>
  )
}
