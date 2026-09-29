import type { QrInputType } from "@/features/qr/content/input-options";

import { APP_PLATFORM_DEFS } from "@/features/qr/content/intents/apps";
import { BUSINESS_PLATFORM_DEFS } from "@/features/qr/content/intents/business";
import { DEVELOPER_PLATFORM_DEFS } from "@/features/qr/content/intents/developer";
import { LOCATION_PLATFORM_DEFS } from "@/features/qr/content/intents/location";
import { MESSAGING_PLATFORM_DEFS } from "@/features/qr/content/intents/messaging";
import { MUSIC_PLATFORM_DEFS } from "@/features/qr/content/intents/music";
import type { PlatformDef } from "@/features/qr/content/intents/shared";
import { SOCIAL_PLATFORM_DEFS } from "@/features/qr/content/intents/social";

const PLATFORM_DEFS: readonly PlatformDef[] = [
  ...SOCIAL_PLATFORM_DEFS,
  ...MESSAGING_PLATFORM_DEFS,
  ...APP_PLATFORM_DEFS,
  ...MUSIC_PLATFORM_DEFS,
  ...LOCATION_PLATFORM_DEFS,
  ...BUSINESS_PLATFORM_DEFS,
  ...DEVELOPER_PLATFORM_DEFS,
] as const;

const PLATFORM_DEF_BY_TYPE = new Map<QrInputType, PlatformDef>(
  PLATFORM_DEFS.map((def) => [def.type, def]),
);

const PLATFORM_TYPES = new Set<QrInputType>(PLATFORM_DEFS.map((def) => def.type));

const LEGACY_PLATFORM_ALIASES: Partial<Record<QrInputType, QrInputType>> = {
  "telegram-username": "telegram",
  "whatsapp-chat": "whatsapp",
  "app-download": "app-store",
  form: "google-forms",
  "booking-link": "calendly",
  "payment-link": "stripe",
};

export function getPlatformDef(type: QrInputType): PlatformDef | undefined {
  const resolved = LEGACY_PLATFORM_ALIASES[type] ?? type;
  return PLATFORM_DEF_BY_TYPE.get(resolved);
}

export function isPlatformType(type: QrInputType): boolean {
  return PLATFORM_TYPES.has(type) || type in LEGACY_PLATFORM_ALIASES;
}

export function resolvePlatformType(type: QrInputType): QrInputType {
  return LEGACY_PLATFORM_ALIASES[type] ?? type;
}

export function getDefaultIntentId(type: QrInputType): string {
  return getPlatformDef(type)?.intents[0]?.id ?? "url";
}

export function detectPlatformIntentFromUrl(
  input: string,
): { type: QrInputType; intent: string; platform?: string; brandIconId?: string } | null {
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }

  let parsed: URL;
  try {
    const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    parsed = new URL(candidate);
  } catch {
    return null;
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const pathname = parsed.pathname;
  const searchParams = parsed.searchParams;

  for (const def of PLATFORM_DEFS) {
    if (def.hosts.length === 0) {
      continue;
    }

    const hostMatched = def.hosts.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
    if (!hostMatched) {
      continue;
    }

    if (def.matchHost && !def.matchHost(hostname, pathname)) {
      continue;
    }

    if (def.type === "tiktok" && (hostname === "vm.tiktok.com" || hostname === "vt.tiktok.com")) {
      return {
        type: def.type,
        intent: "video",
        platform: def.type,
        brandIconId: def.brandIconId,
      };
    }

    if (def.type === "github" && hostname === "gist.github.com") {
      return {
        type: def.type,
        intent: "gist",
        platform: def.type,
        brandIconId: def.brandIconId,
      };
    }

    if (def.type === "twitch" && hostname === "clips.twitch.tv") {
      return {
        type: def.type,
        intent: "clip",
        platform: def.type,
        brandIconId: def.brandIconId,
      };
    }

    for (const intent of def.intents) {
      if (intent.matchPath?.(pathname, searchParams, hostname)) {
        return {
          type: def.type,
          intent: intent.id,
          platform: def.type,
          brandIconId: def.brandIconId,
        };
      }
    }

    const fallbackIntent =
      def.intents.find((intent) =>
        ["profile", "blog", "publication", "user", "channel", "username", "invite"].includes(
          intent.id,
        ),
      ) ?? def.intents[def.intents.length - 1]!;

    return {
      type: def.type,
      intent: fallbackIntent.id,
      platform: def.type,
      brandIconId: def.brandIconId,
    };
  }

  return null;
}
