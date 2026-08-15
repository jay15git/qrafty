import type { FieldKind } from "@/features/qr-code/content/platform-intents"
import type { QrInputType } from "@/features/qr-code/content/input-options"
import {
  getDefaultIntentId,
  getPlatformDef,
  resolvePlatformType,
} from "@/features/qr-code/content/platform-intents"
import {
  validateStaticQrContent,
  type StaticQrContentValue,
  type StaticQrContentValues,
} from "@/features/qr-code/content/static-payload"

export type ContentFieldInputKind = "text" | "email" | "tel" | "url" | "password"

export type ContentFieldDefinition = {
  error?: string
  id: string
  inputKind?: ContentFieldInputKind
  label: string
  layout?: "full" | "half"
  options?: Array<{ label: string; value: string }>
  type: "text" | "textarea" | "toggle" | "segmented"
  value: StaticQrContentValue | undefined
}

function stringContentValue(value: StaticQrContentValue | undefined) {
  return typeof value === "string" ? value : ""
}

function isUrlContentType(type: QrInputType) {
  return type === "link" || type === "website" || type === "app-download"
}

function mapPlatformInputKind(kind: FieldKind): ContentFieldInputKind {
  if (kind === "url") {
    return "url"
  }
  if (kind === "phone") {
    return "tel"
  }
  return "text"
}

function inferInputKind(id: string): ContentFieldInputKind | undefined {
  if (id === "password") {
    return "password"
  }
  if (id === "email") {
    return "email"
  }
  if (id === "phone") {
    return "tel"
  }
  if (id === "url") {
    return "url"
  }
  return undefined
}

export function getContentFieldDefinitions(
  contentType: QrInputType,
  contentValues: StaticQrContentValues,
  validation: ReturnType<typeof validateStaticQrContent>,
): ContentFieldDefinition[] {
  const text = (
    id: string,
    label: string,
    error?: string,
    inputKind?: ContentFieldInputKind,
    layout: "full" | "half" = "full",
  ): ContentFieldDefinition => ({
    error,
    id,
    inputKind: inputKind ?? inferInputKind(id),
    label,
    layout,
    type: "text",
    value: contentValues[id],
  })
  const textarea = (id: string, label: string, error?: string): ContentFieldDefinition => ({
    error,
    id,
    label,
    type: "textarea",
    value: contentValues[id],
  })

  const resolvedType = resolvePlatformType(contentType)
  const platform = getPlatformDef(resolvedType)

  if (platform) {
    const intentId = stringContentValue(contentValues.intent) || getDefaultIntentId(resolvedType)
    const intent =
      platform.intents.find((entry) => entry.id === intentId) ?? platform.intents[0]
    const fields: ContentFieldDefinition[] = []

    if (platform.intents.length > 1) {
      fields.push({
        id: "intent",
        label: "Type",
        options: platform.intents.map((entry) => ({
          label: entry.label,
          value: entry.id,
        })),
        type: "segmented",
        value: intentId,
      })
    }

    for (const field of intent?.fields ?? []) {
      const isTextarea = field.key === "message" || field.key === "body"
      fields.push({
        error: validation.fieldErrors[field.key],
        id: field.key,
        inputKind: isTextarea ? undefined : mapPlatformInputKind(field.kind),
        label: field.label,
        layout:
          field.key === "latitude" || field.key === "longitude" ? "half" : "full",
        type: isTextarea ? "textarea" : "text",
        value: contentValues[field.key],
      })
    }

    return fields
  }

  if (contentType === "auto" || contentType === "text") {
    return [textarea("text", "Text")]
  }

  if (isUrlContentType(contentType)) {
    return [text("url", "URL", validation.fieldErrors.url, "url")]
  }

  if (contentType === "phone") {
    return [text("phone", "Phone number", validation.fieldErrors.phone, "tel")]
  }

  if (contentType === "email") {
    return [
      text("email", "Email", validation.fieldErrors.email, "email", "half"),
      text("subject", "Subject", undefined, undefined, "half"),
      textarea("body", "Body"),
    ]
  }

  if (contentType === "sms") {
    return [
      text("phone", "Phone number", validation.fieldErrors.phone, "tel"),
      textarea("message", "Message"),
    ]
  }

  if (contentType === "wifi") {
    return [
      text("ssid", "Network name", validation.fieldErrors.ssid),
      {
        id: "security",
        label: "Security",
        options: [
          { label: "WPA", value: "WPA" },
          { label: "WEP", value: "WEP" },
          { label: "None", value: "nopass" },
        ],
        type: "segmented",
        value: contentValues.security ?? "WPA",
      },
      text("password", "Password", undefined, "password"),
      { id: "hidden", label: "Hidden network", type: "toggle", value: contentValues.hidden },
    ]
  }

  if (contentType === "vcard") {
    return [
      text("firstName", "First name", validation.fieldErrors.firstName, undefined, "half"),
      text("lastName", "Last name", undefined, undefined, "half"),
      text("phone", "Phone", undefined, "tel", "half"),
      text("email", "Email", undefined, "email", "half"),
      text("company", "Company", undefined, undefined, "half"),
      text("url", "Website", undefined, "url", "half"),
    ]
  }

  if (contentType === "event") {
    const eventMode = stringContentValue(contentValues.eventMode) || "url"
    const fields: ContentFieldDefinition[] = [
      {
        id: "eventMode",
        label: "Event type",
        options: [
          { label: "URL", value: "url" },
          { label: "Calendar", value: "calendar" },
        ],
        type: "segmented",
        value: eventMode,
      },
    ]

    if (eventMode === "calendar") {
      fields.push(
        text("title", "Title", validation.fieldErrors.title),
        text("start", "Start", validation.fieldErrors.start, undefined, "half"),
        text("end", "End", undefined, undefined, "half"),
        text("location", "Location"),
      )
    } else {
      fields.push(text("url", "URL", validation.fieldErrors.url, "url"))
    }

    return fields
  }

  if (contentType === "coupon") {
    return [
      text("code", "Code", validation.fieldErrors.code, undefined, "half"),
      text("url", "URL", undefined, "url", "half"),
      textarea("description", "Description"),
    ]
  }

  if (contentType === "upi") {
    return [
      text("vpa", "UPI ID", validation.fieldErrors.vpa, undefined, "half"),
      text("payeeName", "Payee name", undefined, undefined, "half"),
      text("amount", "Amount", validation.fieldErrors.amount, undefined, "half"),
      text("note", "Note", undefined, undefined, "half"),
    ]
  }

  if (contentType === "crypto") {
    return [
      {
        id: "asset",
        label: "Asset",
        options: [
          { label: "Bitcoin", value: "bitcoin" },
          { label: "Ethereum", value: "ethereum" },
          { label: "Litecoin", value: "litecoin" },
          { label: "BCH", value: "bitcoincash" },
          { label: "Dash", value: "dash" },
        ],
        type: "segmented",
        value: contentValues.asset ?? "bitcoin",
      },
      text("address", "Address", validation.fieldErrors.address),
      text("amount", "Amount", validation.fieldErrors.amount),
    ]
  }

  return [textarea("text", "Payload")]
}
