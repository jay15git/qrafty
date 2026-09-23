import { urlIntent, type PlatformDef } from "@/features/qr/content/intents/shared";

export const APP_PLATFORM_DEFS: readonly PlatformDef[] = [
  {
    type: "app-store",
    label: "App Store",
    description: "Apple App Store app page.",
    collection: "apps",
    category: "app",
    hosts: ["apps.apple.com", "appstore.com"],
    intents: [urlIntent("app", "App", (p) => p.includes("/app/id") || /\/id\d+/.test(p))],
  },
  {
    type: "play-store",
    label: "Play Store",
    description: "Google Play app page.",
    collection: "apps",
    category: "app",
    hosts: ["play.google.com"],
    intents: [urlIntent("app", "App", (p) => p.includes("/store/apps/"))],
  },
  {
    type: "microsoft-store",
    label: "Microsoft Store",
    description: "Microsoft Store app page.",
    collection: "apps",
    category: "app",
    hosts: ["apps.microsoft.com"],
    intents: [urlIntent("app", "App")],
  },
  {
    type: "amazon-appstore",
    label: "Amazon Appstore",
    description: "Amazon Appstore app page.",
    collection: "apps",
    category: "app",
    hosts: ["amazon.com"],
    intents: [urlIntent("app", "App", (p) => p.includes("/dp/") || p.includes("/gp/product/"))],
  },
  {
    type: "huawei-appgallery",
    label: "Huawei AppGallery",
    description: "Huawei AppGallery app page.",
    collection: "apps",
    category: "app",
    hosts: ["appgallery.huawei.com"],
    intents: [urlIntent("app", "App")],
  },
];
