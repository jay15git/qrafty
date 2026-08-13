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

export type ContentFieldDefinition = {
  error?: string
  id: string
  label: string
  options?: Array<{ label: string; value: string }>
  placeholder?: string
  type: "text" | "textarea" | "toggle" | "segmented"
  value: StaticQrContentValue | undefined
}

function stringContentValue(value: StaticQrContentValue | undefined) {
  return typeof value === "string" ? value : ""
}

function isUrlContentType(type: QrInputType) {
  return type === "link" || type === "website" || type === "app-download"
}

export function getContentFieldDefinitions(
  contentType: QrInputType,
  contentValues: StaticQrContentValues,
  validation: ReturnType<typeof validateStaticQrContent>,
): ContentFieldDefinition[] {
  const text = (
    id: string,
    label: string,
    placeholder: string,
    error?: string,
  ): ContentFieldDefinition => ({
    error,
    id,
    label,
    placeholder,
    type: "text",
    value: contentValues[id],
  })
  const textarea = (
    id: string,
    label: string,
    placeholder: string,
    error?: string,
  ): ContentFieldDefinition => ({
    error,
    id,
    label,
    placeholder,
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
        label: field.label,
        placeholder: field.placeholder,
        type: isTextarea ? "textarea" : "text",
        value: contentValues[field.key],
      })
    }

    return fields
  }

  if (contentType === "auto" || contentType === "text") {
    return [textarea("text", "Text", "Plain text to encode")]
  }

  if (isUrlContentType(contentType)) {
    return [text("url", "", "https://example.com", validation.fieldErrors.url)]
  }

  if (contentType === "phone") {
    return [text("phone", "", "+1 555 010 2000", validation.fieldErrors.phone)]
  }

  if (contentType === "email") {
    return [
      text("email", "Email", "hello@example.com", validation.fieldErrors.email),
      text("subject", "Subject", "Launch"),
      textarea("body", "Body", "Message body"),
    ]
  }

  if (contentType === "sms") {
    return [
      text("phone", "Phone number", "+1 555 010 2000", validation.fieldErrors.phone),
      textarea("message", "Message", "Message text"),
    ]
  }

  if (contentType === "wifi") {
    return [
      text("ssid", "", "Network name", validation.fieldErrors.ssid),
      {
        id: "security",
        label: "",
        options: [
          { label: "WPA", value: "WPA" },
          { label: "WEP", value: "WEP" },
          { label: "None", value: "nopass" },
        ],
        type: "segmented",
        value: contentValues.security ?? "WPA",
      },
      text("password", "", "Password"),
      { id: "hidden", label: "Hidden", type: "toggle", value: contentValues.hidden },
    ]
  }

  if (contentType === "vcard") {
    return [
      text("firstName", "First name", "Jay", validation.fieldErrors.firstName),
      text("lastName", "Last name", "Shah"),
      text("phone", "Phone", "+91 98765 43210"),
      text("email", "Email", "jay@example.com"),
      text("company", "Company", "New QR"),
      text("url", "Website", "https://example.com"),
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
        text("title", "Title", "Launch Briefing", validation.fieldErrors.title),
        text("start", "Start", "2026-06-01T09:00", validation.fieldErrors.start),
        text("end", "End", "2026-06-01T10:30"),
        text("location", "Location", "Studio 2"),
      )
    } else {
      fields.push(text("url", "URL", "https://example.com/rsvp", validation.fieldErrors.url))
    }

    return fields
  }

  if (contentType === "coupon") {
    return [
      text("code", "Code", "SAVE20", validation.fieldErrors.code),
      textarea("description", "Description", "20% off"),
      text("url", "URL", "https://example.com/save"),
    ]
  }

  if (contentType === "upi") {
    return [
      text("vpa", "UPI ID", "merchant@okaxis", validation.fieldErrors.vpa),
      text("payeeName", "Payee name", "New QR Studio"),
      text("amount", "Amount", "199.00", validation.fieldErrors.amount),
      text("note", "Note", "Order payment"),
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
      text("address", "Address", "bc1q...", validation.fieldErrors.address),
      text("amount", "Amount", "0.01", validation.fieldErrors.amount),
    ]
  }

  return [textarea("text", "Payload", "Paste a value to encode")]
}
