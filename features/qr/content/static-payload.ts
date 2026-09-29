import {
  isPositiveAmount,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  normalizeUrl,
  VALIDATION_MESSAGES,
} from "@/features/qr/content/content-field-validation";
import type { QrInputType } from "@/features/qr/content/input-options";
import {
  isPickerQrInputType,
  normalizeContentTypeForPicker,
} from "@/features/qr/content/input-options";
import {
  detectPlatformIntentFromUrl,
  getDefaultIntentId,
  isPlatformType,
} from "@/features/qr/content/platform-intents";

export type StaticQrContentValue = string | boolean;
export type StaticQrContentValues = Record<string, StaticQrContentValue | undefined>;

export type StaticQrValidationResult = {
  fieldErrors: Record<string, string>;
  isValid: boolean;
};

const LINK_CONTENT_TYPES = new Set<QrInputType>([
  "link",
  "website",
  "app-download",
  "pdf",
  "image",
  "video",
  "document",
  "menu",
]);

export function getDefaultStaticQrValues(type: QrInputType): StaticQrContentValues {
  if (type === "auto") {
    return { text: "https://qrafty.local/launch" };
  }

  if (type === "whatsapp" || type === "whatsapp-chat") {
    return { intent: "chat", message: "", phone: "", url: "" };
  }

  if (type === "map-location") {
    return {
      intent: "place",
      latitude: "",
      longitude: "",
      query: "",
      url: "",
    };
  }

  if (type === "text") {
    return { text: "" };
  }

  if (type === "link") {
    return { url: "https://" };
  }

  if (type === "wifi") {
    return {
      hidden: false,
      password: "",
      security: "WPA",
      ssid: "",
    };
  }

  if (type === "email") {
    return { body: "", email: "", subject: "" };
  }

  if (type === "phone") {
    return { phone: "" };
  }

  if (type === "sms") {
    return { message: "", phone: "" };
  }

  if (type === "vcard") {
    return {
      company: "",
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      title: "",
      url: "",
    };
  }

  if (type === "event") {
    return {
      description: "",
      end: "",
      eventMode: "url",
      location: "",
      start: "",
      title: "",
      url: "",
    };
  }

  if (type === "coupon") {
    return { code: "", description: "", url: "" };
  }

  if (type === "upi") {
    return {
      amount: "",
      currency: "INR",
      note: "",
      payeeName: "",
      vpa: "",
    };
  }

  if (type === "crypto") {
    return {
      address: "",
      amount: "",
      asset: "bitcoin",
    };
  }

  return { url: "" };
}

export function getContentValuesForTypeChange(
  fromType: QrInputType,
  toType: QrInputType,
  fromValues: StaticQrContentValues,
): StaticQrContentValues {
  const defaults = getDefaultStaticQrValues(toType);
  const normalizedFrom = normalizeContentTypeForPicker(fromType);
  const normalizedTo = normalizeContentTypeForPicker(toType);
  const urlFromValues = stringValue(fromValues.url) || stringValue(fromValues.username);

  if (normalizedFrom === "text" && normalizedTo === "link") {
    const text = stringValue(fromValues.text);

    if (text) {
      return { ...defaults, url: text };
    }
  }

  if (normalizedFrom === "link" && normalizedTo === "text") {
    if (urlFromValues) {
      return { ...defaults, text: urlFromValues };
    }
  }

  if (normalizedFrom === "link" && (toType === "whatsapp" || toType === "map-location")) {
    if (urlFromValues) {
      const detection = detectPlatformIntentFromUrl(urlFromValues);
      return {
        ...defaults,
        intent:
          detection && detection.type === toType ? detection.intent : getDefaultIntentId(toType),
        url: urlFromValues,
      };
    }

    return defaults;
  }

  if (normalizedTo === "link" && isPlatformType(fromType)) {
    if (urlFromValues) {
      return { ...getDefaultStaticQrValues("link"), url: urlFromValues };
    }
  }

  if (normalizedFrom === "link" && normalizedTo === "link") {
    if (urlFromValues) {
      return { ...defaults, url: urlFromValues };
    }
  }

  return defaults;
}

export function resolveContentValuesForType(
  type: QrInputType,
  existing?: StaticQrContentValues,
): StaticQrContentValues {
  if (!existing) {
    return getDefaultStaticQrValues(type);
  }

  const defaults = getDefaultStaticQrValues(type);

  const merged: StaticQrContentValues = { ...defaults };

  for (const [key, value] of Object.entries(existing)) {
    if (value === undefined) {
      continue;
    }

    const defaultValue = defaults[key];
    if (
      typeof value === "string" &&
      value.trim() === "" &&
      typeof defaultValue === "string" &&
      defaultValue.trim() !== ""
    ) {
      continue;
    }

    merged[key] = value;
  }

  return merged;
}

export function buildStaticQrPayload(type: QrInputType, values: StaticQrContentValues): string {
  switch (type) {
    case "auto":
    case "text":
      return stringValue(values.text);
    case "link":
    case "website":
    case "app-download":
    case "pdf":
    case "image":
    case "video":
    case "document":
    case "menu":
      return normalizeUrl(stringValue(values.url));
    case "phone":
      return `tel:${normalizePhone(stringValue(values.phone))}`;
    case "email":
      return buildMailtoPayload(values);
    case "sms":
      return buildSmsPayload(values);
    case "wifi":
      return buildWifiPayload(values);
    case "vcard":
      return buildVCardPayload(values);
    case "whatsapp":
    case "whatsapp-chat":
      return buildWhatsAppPayload(values);
    case "map-location":
      return buildMapLocationPayload(values);
    case "event":
      return buildEventPayload(values);
    case "coupon":
      return buildCouponPayload(values);
    case "upi":
      return buildUpiPayload(values);
    case "crypto":
      return buildCryptoPayload(values);
    default:
      // Non-picker platform types never reach the picker; fall back to a bare URL.
      return normalizeUrl(stringValue(values.url));
  }
}

type StaticFieldValidator = (
  values: StaticQrContentValues,
  fieldErrors: Record<string, string>,
) => void;

const requireField =
  (field: keyof StaticQrContentValues & string, message: string): StaticFieldValidator =>
  (values, fieldErrors) => {
    if (!stringValue(values[field])) {
      fieldErrors[field] = message;
    }
  };

const requirePositiveAmount: StaticFieldValidator = (values, fieldErrors) => {
  const amount = stringValue(values.amount);
  if (amount && !isPositiveAmount(amount)) {
    fieldErrors.amount = VALIDATION_MESSAGES.amount;
  }
};

const STATIC_FIELD_VALIDATORS: Partial<Record<QrInputType, StaticFieldValidator[]>> = {
  wifi: [requireField("ssid", "Enter a network name.")],
  phone: [requireField("phone", "Enter a phone number.")],
  sms: [requireField("phone", "Enter a phone number.")],
  email: [requireField("email", "Enter an email address.")],
  vcard: [
    (values, fieldErrors) => {
      const hasContactValue = [
        values.firstName,
        values.lastName,
        values.phone,
        values.email,
        values.company,
      ].some((value) => Boolean(stringValue(value)));

      if (!hasContactValue) {
        fieldErrors.firstName = "Add a name, phone, or email.";
      }
    },
  ],
  event: [
    (values, fieldErrors) => {
      const eventMode = stringValue(values.eventMode) || "url";

      if (eventMode === "url" && !stringValue(values.url)) {
        fieldErrors.url = "Enter an event URL.";
      }

      if (eventMode === "calendar") {
        if (!stringValue(values.title)) {
          fieldErrors.title = "Enter an event title.";
        }

        if (!stringValue(values.start)) {
          fieldErrors.start = "Enter a start date and time.";
        }
      }
    },
  ],
  coupon: [
    (values, fieldErrors) => {
      if (!stringValue(values.code) && !stringValue(values.url)) {
        fieldErrors.code = "Enter a coupon code or URL.";
      }
    },
  ],
  upi: [
    (values, fieldErrors) => {
      const vpa = stringValue(values.vpa);
      if (!vpa) {
        fieldErrors.vpa = "Enter a UPI ID.";
      } else if (!isValidUpiVpa(vpa)) {
        fieldErrors.vpa = "Enter a valid UPI ID (name@bank).";
      }
    },
    requirePositiveAmount,
  ],
  crypto: [requireField("address", "Enter a wallet address."), requirePositiveAmount],
  whatsapp: [
    (values, fieldErrors) => {
      const intent = stringValue(values.intent) || "chat";
      const url = stringValue(values.url);

      if (intent === "group") {
        if (!url) {
          fieldErrors.url = "Enter a URL.";
        }
        return;
      }

      if (!url && !stringValue(values.phone)) {
        fieldErrors.phone = "Enter a phone number.";
      }
    },
  ],
  "whatsapp-chat": [
    (values, fieldErrors) => {
      const intent = stringValue(values.intent) || "chat";
      const url = stringValue(values.url);

      if (intent === "group") {
        if (!url) {
          fieldErrors.url = "Enter a URL.";
        }
        return;
      }

      if (!url && !stringValue(values.phone)) {
        fieldErrors.phone = "Enter a phone number.";
      }
    },
  ],
  "map-location": [
    (values, fieldErrors) => {
      const intent = stringValue(values.intent) || "place";
      const url = stringValue(values.url);

      if (intent === "directions" && !url) {
        fieldErrors.url = "Enter a URL.";
      }

      const latitude = stringValue(values.latitude);
      const longitude = stringValue(values.longitude);

      if (!latitude && !longitude) {
        return;
      }

      const lat = Number(latitude);
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        fieldErrors.latitude = "Latitude must be between -90 and 90.";
      }

      const lng = Number(longitude);
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        fieldErrors.longitude = "Longitude must be between -180 and 180.";
      }
    },
  ],
};

export function validateStaticQrContent(
  type: QrInputType,
  values: StaticQrContentValues,
): StaticQrValidationResult {
  const fieldErrors: Record<string, string> = {};

  if (LINK_CONTENT_TYPES.has(type) && !stringValue(values.url)) {
    fieldErrors.url = "Enter a URL.";
  }

  for (const validate of STATIC_FIELD_VALIDATORS[type] ?? []) {
    validate(values, fieldErrors);
  }

  const url = stringValue(values.url);
  if (url && !fieldErrors.url) {
    const eventMode = stringValue(values.eventMode) || "url";
    const shouldValidateUrl =
      LINK_CONTENT_TYPES.has(type) ||
      type === "whatsapp" ||
      type === "whatsapp-chat" ||
      type === "map-location" ||
      (type === "event" && eventMode === "url") ||
      type === "vcard" ||
      (type === "coupon" && !stringValue(values.code));

    if (shouldValidateUrl && !isValidUrl(url)) {
      fieldErrors.url = VALIDATION_MESSAGES.url;
    }
  }

  const email = stringValue(values.email);
  if (
    email &&
    !fieldErrors.email &&
    (type === "email" || type === "vcard") &&
    !isValidEmail(email)
  ) {
    fieldErrors.email = VALIDATION_MESSAGES.email;
  }

  const phone = stringValue(values.phone);
  if (
    phone &&
    !fieldErrors.phone &&
    (type === "phone" ||
      type === "sms" ||
      type === "vcard" ||
      type === "whatsapp" ||
      type === "whatsapp-chat") &&
    !isValidPhone(phone)
  ) {
    fieldErrors.phone = VALIDATION_MESSAGES.phone;
  }

  return {
    fieldErrors,
    isValid: Object.keys(fieldErrors).length === 0,
  };
}

const CONTENT_VALIDATION_OVERLAY_FALLBACK = "Fill in the content fields to generate your QR code.";

export function getContentValidationOverlayMessage(
  validation: StaticQrValidationResult,
  encodedData: string,
): string | null {
  if (!validation.isValid) {
    const firstError = Object.values(validation.fieldErrors)[0];
    return firstError ?? CONTENT_VALIDATION_OVERLAY_FALLBACK;
  }

  if (!encodedData.trim()) {
    return CONTENT_VALIDATION_OVERLAY_FALLBACK;
  }

  return null;
}

function buildMailtoPayload(values: StaticQrContentValues) {
  const email = stringValue(values.email);
  const query = toQueryString({
    subject: stringValue(values.subject),
    body: stringValue(values.body),
  });

  return query ? `mailto:${email}?${query}` : `mailto:${email}`;
}

function buildSmsPayload(values: StaticQrContentValues) {
  const phone = normalizePhone(stringValue(values.phone));
  const message = stringValue(values.message);

  return message ? `sms:${phone}?body=${encodeURIComponent(message)}` : `sms:${phone}`;
}

function buildWifiPayload(values: StaticQrContentValues) {
  const security = stringValue(values.security) || "WPA";
  const ssid = escapeWifiValue(stringValue(values.ssid));
  const password = escapeWifiValue(stringValue(values.password));
  const hidden = Boolean(values.hidden);

  return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? "true" : "false"};;`;
}

function buildVCardPayload(values: StaticQrContentValues) {
  const firstName = stringValue(values.firstName);
  const lastName = stringValue(values.lastName);
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`,
    `FN:${escapeVCardValue(fullName || stringValue(values.company) || stringValue(values.email) || stringValue(values.phone))}`,
  ];

  appendVCardLine(lines, "ORG", values.company);
  appendVCardLine(lines, "TITLE", values.title);

  const phone = normalizePhone(stringValue(values.phone));
  if (phone) {
    lines.push(`TEL:${phone}`);
  }

  appendVCardLine(lines, "EMAIL", values.email);
  appendVCardLine(lines, "URL", normalizeUrl(stringValue(values.url)));
  lines.push("END:VCARD");

  return lines.join("\n");
}

function buildWhatsAppPayload(values: StaticQrContentValues) {
  const url = stringValue(values.url);
  if (url) {
    return normalizeUrl(url);
  }

  const phone = normalizePhone(stringValue(values.phone)).replace(/^\+/, "");
  const message = stringValue(values.message);

  return message
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/${phone}`;
}

function buildMapLocationPayload(values: StaticQrContentValues) {
  const url = stringValue(values.url);
  if (url) {
    return normalizeUrl(url);
  }

  const latitude = stringValue(values.latitude);
  const longitude = stringValue(values.longitude);
  const query = stringValue(values.query);

  if (latitude || longitude) {
    const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
    return `geo:${latitude},${longitude}${suffix}`;
  }

  return `https://maps.google.com/?q=${encodeURIComponent(query)}`;
}

function buildEventPayload(values: StaticQrContentValues) {
  const eventMode = stringValue(values.eventMode) || "url";

  if (eventMode !== "calendar") {
    return normalizeUrl(stringValue(values.url));
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${escapeCalendarValue(stringValue(values.title))}`,
    `DTSTART:${formatCalendarDateTime(stringValue(values.start))}`,
  ];

  const end = stringValue(values.end);
  if (end) {
    lines.push(`DTEND:${formatCalendarDateTime(end)}`);
  }

  appendCalendarLine(lines, "LOCATION", values.location);
  appendCalendarLine(lines, "DESCRIPTION", values.description);
  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.join("\n");
}

function buildCouponPayload(values: StaticQrContentValues) {
  return [
    stringValue(values.code),
    stringValue(values.description),
    normalizeUrl(stringValue(values.url)),
  ]
    .filter(Boolean)
    .join("\n");
}

function buildUpiPayload(values: StaticQrContentValues) {
  const query = toQueryString({
    pa: stringValue(values.vpa),
    pn: stringValue(values.payeeName),
    am: stringValue(values.amount),
    cu: stringValue(values.currency) || "INR",
    tn: stringValue(values.note),
  });

  return `upi://pay?${query}`;
}

const CRYPTO_ASSET_SCHEMES: Record<string, string> = {
  bitcoin: "bitcoin",
  bitcoincash: "bitcoincash",
  dash: "dash",
  ethereum: "ethereum",
  litecoin: "litecoin",
};

function buildCryptoPayload(values: StaticQrContentValues) {
  const asset = stringValue(values.asset) || "bitcoin";
  const scheme = CRYPTO_ASSET_SCHEMES[asset] ?? "bitcoin";
  const address = stringValue(values.address);
  const amount = stringValue(values.amount);

  if (!amount) {
    return `${scheme}:${address}`;
  }

  return `${scheme}:${address}?amount=${encodeURIComponent(amount)}`;
}

function isValidUpiVpa(value: string) {
  return /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(value);
}

function appendVCardLine(lines: string[], label: string, value: StaticQrContentValue | undefined) {
  const text = stringValue(value);

  if (text) {
    lines.push(`${label}:${escapeVCardValue(text)}`);
  }
}

function appendCalendarLine(
  lines: string[],
  label: string,
  value: StaticQrContentValue | undefined,
) {
  const text = stringValue(value);

  if (text) {
    lines.push(`${label}:${escapeCalendarValue(text)}`);
  }
}

function normalizePhone(value: string) {
  const trimmed = value.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  return hasPlus && digits ? `+${digits}` : digits;
}

function escapeWifiValue(value: string) {
  return value.replace(/([\\;,:"])/g, "\\$1");
}

function escapeVCardValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function escapeCalendarValue(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatCalendarDateTime(value: string) {
  const compact = value.replace(/[-:]/g, "").replace(/\.\d+$/, "");

  if (/T\d{4}$/.test(compact)) {
    return `${compact}00`;
  }

  return compact;
}

function isNumberInRange(value: string, min: number, max: number) {
  if (!value) {
    return false;
  }

  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max;
}

function stringValue(value: StaticQrContentValue | undefined) {
  return typeof value === "string" ? value.trim() : "";
}

function toQueryString(values: Record<string, string>) {
  return Object.entries(values)
    .flatMap(([key, value]) =>
      value ? [`${encodeURIComponent(key)}=${encodeURIComponent(value)}`] : [],
    )
    .join("&");
}
