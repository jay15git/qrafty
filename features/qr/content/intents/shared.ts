import type { QrInputType } from "@/features/qr/content/input-options";

export type PlatformIntentDef = {
  id: string;
  label: string;
  matchPath?: (pathname: string, searchParams: URLSearchParams, hostname?: string) => boolean;
};

export type PlatformDef = {
  type: QrInputType;
  label: string;
  category:
    "social" | "messaging" | "app" | "music" | "business" | "file" | "location" | "developer";
  hosts: readonly string[];
  brandIconId?: string;
  matchHost?: (hostname: string, pathname: string) => boolean;
  intents: readonly PlatformIntentDef[];
};
