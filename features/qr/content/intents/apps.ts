import type { PlatformDef } from "@/features/qr/content/intents/shared";

export const APP_PLATFORM_DEFS: readonly PlatformDef[] = [
  {
    type: "app-store",
    label: "App Store",
    category: "app",
    hosts: ["apps.apple.com", "appstore.com"],
    intents: [
      { id: "app", label: "App", matchPath: (p) => p.includes("/app/id") || /\/id\d+/.test(p) },
    ],
  },
  {
    type: "play-store",
    label: "Play Store",
    category: "app",
    hosts: ["play.google.com"],
    intents: [{ id: "app", label: "App", matchPath: (p) => p.includes("/store/apps/") }],
  },
  {
    type: "microsoft-store",
    label: "Microsoft Store",
    category: "app",
    hosts: ["apps.microsoft.com"],
    intents: [{ id: "app", label: "App" }],
  },
  {
    type: "amazon-appstore",
    label: "Amazon Appstore",
    category: "app",
    hosts: ["amazon.com"],
    intents: [
      {
        id: "app",
        label: "App",
        matchPath: (p) => p.includes("/dp/") || p.includes("/gp/product/"),
      },
    ],
  },
  {
    type: "huawei-appgallery",
    label: "Huawei AppGallery",
    category: "app",
    hosts: ["appgallery.huawei.com"],
    intents: [{ id: "app", label: "App" }],
  },
];
