import type { QrInputType } from "@/features/qr/content/input-options";
import { normalizeUrl, stringFieldValue } from "@/features/qr/content/platform-builders";

export type PlatformContentValues = Record<string, string | boolean | undefined>;

export type ContentCollectionId =
  "popular" | "social" | "messaging" | "apps" | "music" | "business" | "contact" | "more";

export type FieldKind = "username" | "url" | "id" | "phone" | "text" | "amount" | "instance";

export type PlatformFieldDef = {
  key: string;
  kind: FieldKind;
  label: string;
  required?: boolean;
};

export type PlatformIntentDef = {
  id: string;
  label: string;
  fields: readonly PlatformFieldDef[];
  build: (values: PlatformContentValues) => string;
  matchPath?: (pathname: string, searchParams: URLSearchParams, hostname?: string) => boolean;
};

export type PlatformDef = {
  type: QrInputType;
  label: string;
  description: string;
  collection: ContentCollectionId;
  category:
    "social" | "messaging" | "app" | "music" | "business" | "file" | "location" | "developer";
  hosts: readonly string[];
  brandIconId?: string;
  defaultIntentId?: string;
  matchHost?: (hostname: string, pathname: string) => boolean;
  intents: readonly PlatformIntentDef[];
};

export const urlField = (label = "URL", required = true): PlatformFieldDef => ({
  key: "url",
  kind: "url",
  label,
  required,
});

export const textField = (key: string, label: string): PlatformFieldDef => ({
  key,
  kind: "text",
  label,
});

export function profileIntent(matchPath?: PlatformIntentDef["matchPath"]): PlatformIntentDef {
  return urlIntent("profile", "Profile", matchPath);
}

export function urlIntent(
  id: string,
  label: string,
  matchPath?: PlatformIntentDef["matchPath"],
): PlatformIntentDef {
  return {
    id,
    label,
    fields: [urlField()],
    build: (values) => normalizeUrl(stringFieldValue(values, "url")),
    matchPath,
  };
}
