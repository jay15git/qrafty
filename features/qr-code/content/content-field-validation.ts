import { normalizeUrl } from "@/features/qr-code/content/platform-builders"

export const VALIDATION_MESSAGES = {
  url: "Enter a valid URL.",
  email: "Enter a valid email address.",
  phone: "Enter a valid phone number.",
  amount: "Enter a valid amount.",
} as const

export function platformUrlErrorMessage(intentLabel: string): string {
  return `Enter a correct ${intentLabel.toLowerCase()} URL.`
}

export function isValidUrl(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  // Incomplete scheme stubs used as prefills (https://, skype:, etc.)
  if (/^https?:\/\/?$/i.test(trimmed)) {
    return true
  }

  if (/^[a-z][a-z\d+\-.]*:$/i.test(trimmed)) {
    return true
  }

  const candidate = normalizeUrl(trimmed)

  try {
    const parsed = new URL(candidate)

    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return hasRealHostname(parsed.hostname)
    }

    // Custom schemes (skype:, bitcoin:, etc.)
    return parsed.protocol.length > 1
  } catch {
    return false
  }
}

export function isValidPlatformUrl(
  value: string,
  hosts: readonly string[],
): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  if (/^https?:\/\/?$/i.test(trimmed)) {
    return hosts.length === 0
  }

  if (!isValidUrl(trimmed)) {
    return false
  }

  if (hosts.length === 0) {
    return true
  }

  try {
    const parsed = new URL(normalizeUrl(trimmed))
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "")
    return hosts.some((host) => hostname === host || hostname.endsWith(`.${host}`))
  } catch {
    return false
  }
}

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "")
  return digits.length >= 7
}

export function isPositiveAmount(value: string): boolean {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    return false
  }

  return Number(value) > 0
}

function hasRealHostname(hostname: string): boolean {
  if (!hostname) {
    return false
  }

  const host = hostname.toLowerCase()
  if (host === "localhost") {
    return true
  }

  // Require a dot so bare words like "asdf" fail, stubs like "instagram.com" pass.
  return host.includes(".")
}
