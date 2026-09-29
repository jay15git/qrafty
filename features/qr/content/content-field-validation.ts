export const VALIDATION_MESSAGES = {
  url: "Enter a valid URL.",
  email: "Enter a valid email address.",
  phone: "Enter a valid phone number.",
  amount: "Enter a valid amount.",
} as const;

export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (/^[a-z][a-z\d+\-.]*:/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function isValidUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  // Incomplete scheme stubs used as prefills (https://, skype:, etc.)
  if (/^https?:\/\/?$/i.test(trimmed)) {
    return true;
  }

  if (/^[a-z][a-z\d+\-.]*:$/i.test(trimmed)) {
    return true;
  }

  const candidate = normalizeUrl(trimmed);

  try {
    const parsed = new URL(candidate);
    if (!/^https?:$/i.test(parsed.protocol)) {
      return true;
    }

    return hasRealHostname(parsed.hostname);
  } catch {
    return false;
  }
}

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7;
}

export function isPositiveAmount(value: string): boolean {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    return false;
  }

  return Number(value) > 0;
}

function hasRealHostname(hostname: string): boolean {
  if (!hostname) {
    return false;
  }

  const host = hostname.toLowerCase();
  if (host === "localhost") {
    return true;
  }

  // Require a dot so bare words like "asdf" fail, stubs like "instagram.com" pass.
  return host.includes(".");
}
