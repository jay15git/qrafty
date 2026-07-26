import type { QrInputType } from "@/features/qr-code/content/input-options"
import {
  detectPastedContent,
  type PastedContentDetection,
  type UrlDetection,
} from "@/features/qr-code/content/detect-url-kind"
import {
  getDefaultStaticQrValues,
  type StaticQrContentValues,
} from "@/features/qr-code/content/static-payload"

export type ContentPasteApplyResult = {
  type: QrInputType
  values: StaticQrContentValues
  urlDetection?: UrlDetection
}

export type LinkPasteFieldUpdate = {
  urlDetection?: UrlDetection
  values: Partial<StaticQrContentValues>
}

export function resolveStructuredPasteApply(
  input: string,
): ContentPasteApplyResult | null {
  const detection = detectPastedContent(input)
  if (!detection || detection.kind === "link" || detection.kind === "text") {
    return null
  }

  return mapStructuredPaste(detection)
}

export function getLinkPasteFieldUpdate(
  contentType: QrInputType,
  input: string,
): LinkPasteFieldUpdate | null {
  const detection = detectPastedContent(input)
  if (!detection || detection.kind !== "link") {
    return null
  }

  if (isUsernameType(contentType)) {
    return {
      urlDetection: detection.urlDetection,
      values: { username: detection.value },
    }
  }

  if (isUrlType(contentType) || contentType === "coupon") {
    return {
      urlDetection: detection.urlDetection,
      values: { url: detection.value },
    }
  }

  if (contentType === "auto" || contentType === "text") {
    return {
      urlDetection: detection.urlDetection,
      values: { text: detection.value },
    }
  }

  if (contentType === "event") {
    return {
      urlDetection: detection.urlDetection,
      values: { eventMode: "url", url: detection.value },
    }
  }

  return null
}

export function resolveDetectedLinkTypeApply(
  detection: UrlDetection,
  source: string,
): ContentPasteApplyResult | null {
  const targetType = detection.inputTypeHint
  if (!targetType) {
    return null
  }

  const values = getDefaultStaticQrValues(targetType)

  if (isUsernameType(targetType)) {
    values.username = source
  } else if (isUrlType(targetType) || targetType === "coupon" || targetType === "event") {
    values.url = source
  } else if (targetType === "text" || targetType === "auto") {
    values.text = source
  } else {
    return null
  }

  return {
    type: targetType,
    values,
    urlDetection: detection,
  }
}

export function getLinkDetectionSource(
  contentType: QrInputType,
  contentValues: StaticQrContentValues,
): string {
  if (isUrlType(contentType)) {
    return stringValue(contentValues.url)
  }

  if (isUsernameType(contentType)) {
    return stringValue(contentValues.username) || stringValue(contentValues.url)
  }

  if (contentType === "auto" || contentType === "text") {
    return stringValue(contentValues.text)
  }

  if (contentType === "event") {
    const eventMode = stringValue(contentValues.eventMode) || "url"
    return eventMode === "url" ? stringValue(contentValues.url) : ""
  }

  if (contentType === "coupon") {
    return stringValue(contentValues.url)
  }

  return ""
}

export function shouldShowUrlDetectionChip(
  contentType: QrInputType,
  detection: UrlDetection | null | undefined,
) {
  if (!detection || !supportsUrlDetection(contentType)) {
    return false
  }

  return Boolean(detection.platform) || detection.category !== "link"
}

function mapStructuredPaste(
  detection: PastedContentDetection,
): ContentPasteApplyResult | null {
  switch (detection.kind) {
    case "phone":
      return {
        type: "phone",
        values: { phone: detection.value },
      }
    case "email":
      return {
        type: "email",
        values: parseMailtoValues(detection.value),
      }
    case "sms":
      return {
        type: "sms",
        values: parseSmsValues(detection.value),
      }
    case "wifi":
      return {
        type: "wifi",
        values: parseWifiValues(detection.value),
      }
    case "vcard":
      return {
        type: "text",
        values: { text: detection.value },
      }
    case "map-location":
      return {
        type: "map-location",
        values: parseGeoValues(detection.value),
        urlDetection: detection.urlDetection,
      }
    case "upi":
      return {
        type: "upi",
        values: parseUpiValues(detection.value),
      }
    case "crypto":
      return {
        type: "crypto",
        values: parseCryptoValues(detection.value),
      }
    default:
      return null
  }
}

function parseMailtoValues(value: string): StaticQrContentValues {
  const [emailPart, queryPart] = value.split("?", 2)
  const params = new URLSearchParams(queryPart ?? "")

  return {
    body: params.get("body") ?? "",
    email: emailPart,
    subject: params.get("subject") ?? "",
  }
}

function parseSmsValues(value: string): StaticQrContentValues {
  const [phonePart, queryPart] = value.split("?", 2)
  const params = new URLSearchParams(queryPart ?? "")

  return {
    message: params.get("body") ?? "",
    phone: phonePart,
  }
}

function parseWifiValues(value: string): StaticQrContentValues {
  const segments = value
    .replace(/^WIFI:/i, "")
    .replace(/;;$/, "")
    .split(";")
    .filter(Boolean)

  const values: StaticQrContentValues = getDefaultStaticQrValues("wifi")

  for (const segment of segments) {
    const [key, ...rest] = segment.split(":")
    const segmentValue = rest.join(":").replace(/\\(.)/g, "$1")

    if (key === "S") values.ssid = segmentValue
    if (key === "P") values.password = segmentValue
    if (key === "T") values.security = segmentValue
    if (key === "H") values.hidden = segmentValue === "true"
  }

  return values
}

function parseGeoValues(value: string): StaticQrContentValues {
  const withoutScheme = value.replace(/^geo:/i, "")
  const [coordinates, queryPart] = withoutScheme.split("?", 2)
  const [latitude = "", longitude = ""] = coordinates.split(",")
  const params = new URLSearchParams(queryPart ?? "")

  return {
    latitude,
    longitude,
    query: params.get("q") ?? "",
  }
}

function parseUpiValues(value: string): StaticQrContentValues {
  const defaults = getDefaultStaticQrValues("upi")
  const queryIndex = value.indexOf("?")
  const query = queryIndex >= 0 ? value.slice(queryIndex + 1) : ""
  const params = new URLSearchParams(query)

  return {
    ...defaults,
    amount: params.get("am") ?? "",
    currency: params.get("cu") ?? "INR",
    note: params.get("tn") ?? "",
    payeeName: params.get("pn") ?? "",
    vpa: params.get("pa") ?? "",
  }
}

function parseCryptoValues(value: string): StaticQrContentValues {
  const defaults = getDefaultStaticQrValues("crypto")
  const match = value.match(/^([a-z]+):([^?]+)(?:\?(.*))?$/i)
  if (!match) {
    return { ...defaults, address: value }
  }

  const scheme = match[1]!.toLowerCase()
  const address = match[2] ?? ""
  const params = new URLSearchParams(match[3] ?? "")
  const asset =
    scheme === "bitcoin" ||
    scheme === "ethereum" ||
    scheme === "litecoin" ||
    scheme === "bitcoincash" ||
    scheme === "dash"
      ? scheme
      : "bitcoin"

  return {
    ...defaults,
    address,
    amount: params.get("amount") ?? "",
    asset,
  }
}

function supportsUrlDetection(contentType: QrInputType) {
  return (
    isUrlType(contentType) ||
    isUsernameType(contentType) ||
    contentType === "auto" ||
    contentType === "text" ||
    contentType === "event" ||
    contentType === "coupon"
  )
}

function isUrlType(contentType: QrInputType) {
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
  ].includes(contentType)
}

function isUsernameType(contentType: QrInputType) {
  return [
    "instagram",
    "x",
    "tiktok",
    "telegram",
    "snapchat",
    "threads",
    "pinterest",
    "telegram-username",
  ].includes(contentType)
}

function stringValue(value: string | boolean | undefined) {
  return typeof value === "string" ? value.trim() : ""
}
