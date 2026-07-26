import type { PlatformContentValues } from "@/features/qr-code/content/platform-intents"

export function stringFieldValue(
  values: PlatformContentValues,
  key: string,
): string {
  const value = values[key]
  return typeof value === "string" ? value.trim() : ""
}

export function normalizeUsername(value: string): string {
  return value.trim().replace(/^@+/, "").replace(/^\/+/, "")
}

export function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    return ""
  }
  if (/^[a-z][a-z\d+\-.]*:/i.test(trimmed)) {
    return trimmed
  }
  return `https://${trimmed}`
}

export function urlOrBuild(
  values: PlatformContentValues,
  build: (values: PlatformContentValues) => string,
): string {
  const url = stringFieldValue(values, "url")
  if (url) {
    return normalizeUrl(url)
  }
  return build(values)
}

export function usernameProfileUrl(
  values: PlatformContentValues,
  baseUrl: string,
  prefix = "",
): string {
  const username = normalizeUsername(stringFieldValue(values, "username"))
  return `${baseUrl}${prefix}${username}`
}

export function idOrUrl(
  values: PlatformContentValues,
  buildFromId: (id: string) => string,
  idKey = "id",
): string {
  return urlOrBuild(values, (v) => buildFromId(stringFieldValue(v, idKey)))
}
