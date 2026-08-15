export type SizeTemplateGroup =
  | "instagram"
  | "x"
  | "youtube"
  | "facebook"
  | "tiktok"
  | "linkedin"
  | "pinterest"
  | "threads"
  | "snapchat"
  | "whatsapp"
  | "telegram"
  | "messenger"
  | "reddit"
  | "spotify"
  | "discord"
  | "twitch"
  | "wechat"
  | "line"
  | "tumblr"
  | "behance"
  | "medium"
  | "substack"
  | "dribbble"
  | "app-store"
  | "play-store"
  | "web"
  | "ratio"
  | "print"
  | "qr-physical"

export type SizeTemplate = {
  brandIconId?: string
  group: SizeTemplateGroup
  height: number
  id: string
  label: string
  ratioLabel: string
  /** Ratio or pixel dimensions shown under the preset label. */
  subtitle?: string
  width: number
}

export const SIZE_TEMPLATE_GROUPS: readonly SizeTemplateGroup[] = [
  "instagram",
  "x",
  "youtube",
  "facebook",
  "tiktok",
  "linkedin",
  "pinterest",
  "threads",
  "snapchat",
  "whatsapp",
  "telegram",
  "messenger",
  "reddit",
  "spotify",
  "discord",
  "twitch",
  "wechat",
  "line",
  "tumblr",
  "behance",
  "medium",
  "substack",
  "dribbble",
  "app-store",
  "play-store",
  "web",
  "ratio",
  "print",
  "qr-physical",
] as const

export const SIZE_TEMPLATE_GROUP_LABELS: Record<SizeTemplateGroup, string> = {
  instagram: "Instagram",
  x: "X",
  youtube: "YouTube",
  facebook: "Facebook",
  tiktok: "TikTok",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  threads: "Threads",
  snapchat: "Snapchat",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  messenger: "Messenger",
  reddit: "Reddit",
  spotify: "Spotify",
  discord: "Discord",
  twitch: "Twitch",
  wechat: "WeChat",
  line: "LINE",
  tumblr: "Tumblr",
  behance: "Behance",
  medium: "Medium",
  substack: "Substack",
  dribbble: "Dribbble",
  "app-store": "App Store",
  "play-store": "Play Store",
  web: "Web & sharing",
  ratio: "Aspect ratio",
  print: "Print",
  "qr-physical": "QR physical",
}

/** Longest-edge length used for canvas editing; export can scale up from this baseline. */
export const DRAFTING_CANVAS_BASELINE_MAX_EDGE = 1080

export function normalizeCanvasSize(width: number, height: number): { height: number; width: number } {
  const safeWidth = Math.max(1, Math.round(width))
  const safeHeight = Math.max(1, Math.round(height))
  const longEdge = Math.max(safeWidth, safeHeight)
  const scale = DRAFTING_CANVAS_BASELINE_MAX_EDGE / longEdge

  return {
    width: Math.round(safeWidth * scale),
    height: Math.round(safeHeight * scale),
  }
}

export function getCanvasSizeFromTemplate(
  template: Pick<SizeTemplate, "height" | "width">,
): { height: number; width: number } {
  return normalizeCanvasSize(template.width, template.height)
}

function formatPixelSubtitle(width: number, height: number): string {
  return `${width} × ${height}`
}

type SizeTemplateOptions = {
  brandIconId?: string
  ratioLabel?: string
  subtitle?: string
}

function sizeTemplate(
  id: string,
  group: SizeTemplateGroup,
  label: string,
  width: number,
  height: number,
  options: SizeTemplateOptions = {},
): SizeTemplate {
  const ratioLabel = options.ratioLabel ?? formatAspectRatio(width, height)

  return {
    brandIconId: options.brandIconId ?? group,
    group,
    height,
    id,
    label,
    ratioLabel,
    subtitle: options.subtitle ?? ratioLabel,
    width,
  }
}

function ratioTemplate(
  id: string,
  ratioLabel: string,
  widthRatio: number,
  heightRatio: number,
): SizeTemplate {
  const maxEdge = DRAFTING_CANVAS_BASELINE_MAX_EDGE
  const width =
    widthRatio >= heightRatio
      ? maxEdge
      : Math.round((maxEdge * widthRatio) / heightRatio)
  const height =
    widthRatio >= heightRatio
      ? Math.round((maxEdge * heightRatio) / widthRatio)
      : maxEdge

  return {
    id,
    label: ratioLabel,
    group: "ratio",
    width,
    height,
    ratioLabel,
    subtitle: ratioLabel,
  }
}

function platformRatioTemplate(
  id: string,
  group: SizeTemplateGroup,
  label: string,
  ratioLabel: string,
  widthRatio: number,
  heightRatio: number,
  brandIconId?: string,
): SizeTemplate {
  const maxEdge = DRAFTING_CANVAS_BASELINE_MAX_EDGE
  const width =
    widthRatio >= heightRatio
      ? maxEdge
      : Math.round((maxEdge * widthRatio) / heightRatio)
  const height =
    widthRatio >= heightRatio
      ? Math.round((maxEdge * heightRatio) / widthRatio)
      : maxEdge

  return sizeTemplate(id, group, label, width, height, {
    brandIconId: brandIconId ?? group,
    ratioLabel,
    subtitle: ratioLabel,
  })
}

export const SIZE_TEMPLATES: readonly SizeTemplate[] = [
  platformRatioTemplate("instagram-post", "instagram", "Post", "1:1", 1, 1),
  platformRatioTemplate("instagram-portrait", "instagram", "Portrait", "4:5", 4, 5),
  platformRatioTemplate("instagram-story", "instagram", "Story", "9:16", 9, 16),
  platformRatioTemplate("instagram-reel", "instagram", "Reel", "9:16", 9, 16),

  platformRatioTemplate("x-post", "x", "Post", "16:9", 16, 9),
  platformRatioTemplate("x-cover", "x", "Cover", "3:1", 3, 1),
  sizeTemplate("web-x-card", "x", "Card", 1200, 628, {
    brandIconId: "x",
    ratioLabel: "1.91:1",
    subtitle: "1.91:1",
  }),

  sizeTemplate("youtube-thumbnail", "youtube", "Thumbnail", 1280, 720, {
    brandIconId: "youtube",
    ratioLabel: "16:9",
    subtitle: formatPixelSubtitle(1280, 720),
  }),
  platformRatioTemplate("youtube-banner", "youtube", "Banner", "16:9", 16, 9),
  platformRatioTemplate("youtube-shorts", "youtube", "Shorts", "9:16", 9, 16),

  platformRatioTemplate("facebook-post", "facebook", "Post", "1:1", 1, 1),
  platformRatioTemplate("facebook-story", "facebook", "Story", "9:16", 9, 16),
  platformRatioTemplate("facebook-reel", "facebook", "Reel", "9:16", 9, 16),
  sizeTemplate("facebook-cover", "facebook", "Cover", 1640, 624, {
    brandIconId: "facebook",
    ratioLabel: "2.63:1",
    subtitle: "16:9",
  }),

  platformRatioTemplate("tiktok-video", "tiktok", "Video", "9:16", 9, 16),
  platformRatioTemplate("tiktok-photo", "tiktok", "Photo", "9:16", 9, 16),

  sizeTemplate("linkedin-post", "linkedin", "Post", 1200, 627, {
    brandIconId: "linkedin",
    ratioLabel: "1.91:1",
    subtitle: "1.91:1",
  }),
  sizeTemplate("linkedin-cover", "linkedin", "Cover", 1584, 396, {
    brandIconId: "linkedin",
    ratioLabel: "4:1",
    subtitle: "4:1",
  }),

  platformRatioTemplate("pinterest-long", "pinterest", "Long", "10:21", 10, 21),
  platformRatioTemplate("pinterest-optimal", "pinterest", "Optimal", "2:3", 2, 3),
  platformRatioTemplate("pinterest-square", "pinterest", "Square", "1:1", 1, 1),

  platformRatioTemplate("threads-post", "threads", "Post", "1:1", 1, 1),
  platformRatioTemplate("threads-portrait", "threads", "Portrait", "4:5", 4, 5),

  platformRatioTemplate("snapchat-story", "snapchat", "Story", "9:16", 9, 16),

  platformRatioTemplate("whatsapp-status", "whatsapp", "Status", "9:16", 9, 16),
  sizeTemplate("whatsapp-cover", "whatsapp", "Cover", 1200, 628, {
    brandIconId: "whatsapp",
    ratioLabel: "1.91:1",
    subtitle: formatPixelSubtitle(1200, 628),
  }),
  platformRatioTemplate("whatsapp-catalog", "whatsapp", "Catalog", "1:1", 1, 1),

  platformRatioTemplate("telegram-story", "telegram", "Story", "9:16", 9, 16),
  platformRatioTemplate("telegram-post", "telegram", "Post", "1:1", 1, 1),

  platformRatioTemplate("messenger-story", "messenger", "Story", "9:16", 9, 16),

  sizeTemplate("reddit-post", "reddit", "Post", 1200, 628, {
    brandIconId: "reddit",
    ratioLabel: "1.91:1",
    subtitle: formatPixelSubtitle(1200, 628),
  }),
  sizeTemplate("reddit-banner", "reddit", "Banner", 1920, 384, {
    brandIconId: "reddit",
    ratioLabel: "5:1",
    subtitle: formatPixelSubtitle(1920, 384),
  }),
  platformRatioTemplate("reddit-square", "reddit", "Square", "1:1", 1, 1),

  platformRatioTemplate("spotify-cover", "spotify", "Cover", "1:1", 1, 1),
  platformRatioTemplate("spotify-canvas", "spotify", "Canvas", "9:16", 9, 16),

  sizeTemplate("discord-banner", "discord", "Banner", 960, 540, {
    brandIconId: "discord",
    ratioLabel: "16:9",
    subtitle: formatPixelSubtitle(960, 540),
  }),
  platformRatioTemplate("discord-icon", "discord", "Icon", "1:1", 1, 1),

  sizeTemplate("twitch-thumbnail", "twitch", "Thumbnail", 1920, 1080, {
    brandIconId: "twitch",
    ratioLabel: "16:9",
    subtitle: formatPixelSubtitle(1920, 1080),
  }),
  sizeTemplate("twitch-offline", "twitch", "Offline", 1920, 1080, {
    brandIconId: "twitch",
    ratioLabel: "16:9",
    subtitle: formatPixelSubtitle(1920, 1080),
  }),
  sizeTemplate("twitch-panel", "twitch", "Panel", 320, 160, {
    brandIconId: "twitch",
    ratioLabel: "2:1",
    subtitle: formatPixelSubtitle(320, 160),
  }),

  platformRatioTemplate("wechat-moments", "wechat", "Moments", "1:1", 1, 1),

  platformRatioTemplate("line-voom", "line", "VOOM", "9:16", 9, 16),

  platformRatioTemplate("tumblr-post", "tumblr", "Post", "2:3", 2, 3),
  platformRatioTemplate("tumblr-square", "tumblr", "Square", "1:1", 1, 1),

  sizeTemplate("behance-project", "behance", "Project", 1400, 980, {
    brandIconId: "behance",
    ratioLabel: "10:7",
    subtitle: formatPixelSubtitle(1400, 980),
  }),

  sizeTemplate("medium-featured", "medium", "Featured", 1400, 788, {
    brandIconId: "medium",
    ratioLabel: "1.91:1",
    subtitle: formatPixelSubtitle(1400, 788),
  }),

  sizeTemplate("substack-header", "substack", "Header", 1500, 500, {
    brandIconId: "substack",
    ratioLabel: "3:1",
    subtitle: formatPixelSubtitle(1500, 500),
  }),
  sizeTemplate("substack-post", "substack", "Post", 1200, 628, {
    brandIconId: "substack",
    ratioLabel: "1.91:1",
    subtitle: formatPixelSubtitle(1200, 628),
  }),

  sizeTemplate("dribbble-shot", "dribbble", "Shot", 1600, 1200, {
    brandIconId: "dribbble",
    ratioLabel: "4:3",
    subtitle: "4:3",
  }),

  sizeTemplate("app-store-iphone-65", "app-store", "iPhone 6.5\"", 1284, 2778, {
    brandIconId: "app-store",
    ratioLabel: "9:19.5",
    subtitle: formatPixelSubtitle(1284, 2778),
  }),
  sizeTemplate("app-store-iphone-55", "app-store", "iPhone 5.5\"", 1242, 2208, {
    brandIconId: "app-store",
    ratioLabel: "9:16",
    subtitle: formatPixelSubtitle(1242, 2208),
  }),
  sizeTemplate("app-store-ipad-pro-129", "app-store", "iPad Pro 12.9\"", 2048, 2732, {
    brandIconId: "app-store",
    ratioLabel: "4:3",
    subtitle: formatPixelSubtitle(2048, 2732),
  }),
  sizeTemplate("app-store-ipad-11", "app-store", "iPad 11\"", 1668, 2388, {
    brandIconId: "app-store",
    ratioLabel: "5:7",
    subtitle: formatPixelSubtitle(1668, 2388),
  }),

  sizeTemplate("play-store-feature", "play-store", "Feature graphic", 1024, 500, {
    brandIconId: "play-store",
    ratioLabel: "2.05:1",
    subtitle: formatPixelSubtitle(1024, 500),
  }),
  sizeTemplate("play-store-phone", "play-store", "Phone", 1080, 1920, {
    brandIconId: "play-store",
    ratioLabel: "9:16",
    subtitle: formatPixelSubtitle(1080, 1920),
  }),
  sizeTemplate("play-store-tablet-7", "play-store", "Tablet 7\"", 1200, 1920, {
    brandIconId: "play-store",
    ratioLabel: "5:8",
    subtitle: formatPixelSubtitle(1200, 1920),
  }),
  sizeTemplate("play-store-tablet-10", "play-store", "Tablet 10\"", 1800, 2560, {
    brandIconId: "play-store",
    ratioLabel: "9:12.8",
    subtitle: formatPixelSubtitle(1800, 2560),
  }),

  {
    id: "web-open-graph",
    label: "Open Graph",
    group: "web",
    width: 1200,
    height: 630,
    ratioLabel: "1.91:1",
    subtitle: "1.91:1",
  },

  ratioTemplate("ratio-16-9", "16:9", 16, 9),
  ratioTemplate("ratio-3-2", "3:2", 3, 2),
  ratioTemplate("ratio-4-3", "4:3", 4, 3),
  ratioTemplate("ratio-5-4", "5:4", 5, 4),
  ratioTemplate("ratio-1-1", "1:1", 1, 1),
  ratioTemplate("ratio-4-5", "4:5", 4, 5),
  ratioTemplate("ratio-3-4", "3:4", 3, 4),
  ratioTemplate("ratio-2-3", "2:3", 2, 3),
  ratioTemplate("ratio-9-16", "9:16", 9, 16),

  {
    id: "print-us-letter",
    label: "US Letter",
    group: "print",
    width: 816,
    height: 1056,
    ratioLabel: "8.5:11",
    subtitle: "8.5:11",
  },
  {
    id: "print-a4",
    label: "A4",
    group: "print",
    width: 794,
    height: 1123,
    ratioLabel: "210:297",
    subtitle: "210:297",
  },
  {
    id: "print-a5",
    label: "A5",
    group: "print",
    width: 559,
    height: 794,
    ratioLabel: "148:210",
    subtitle: "148:210",
  },
  {
    id: "print-poster-18x24",
    label: "Poster 18×24",
    group: "print",
    width: 5400,
    height: 7200,
    ratioLabel: "3:4",
    subtitle: "3:4",
  },
  {
    id: "print-flyer-8x11",
    label: "Flyer 8.5×11",
    group: "print",
    width: 2550,
    height: 3300,
    ratioLabel: "8.5:11",
    subtitle: "8.5:11",
  },

  {
    id: "qr-business-card",
    label: "Business card",
    group: "qr-physical",
    width: 1050,
    height: 600,
    ratioLabel: "3.5:2",
    subtitle: "3.5:2",
  },
  {
    id: "qr-sticker-2x2",
    label: "Sticker",
    group: "qr-physical",
    width: 600,
    height: 600,
    ratioLabel: "1:1",
    subtitle: "1:1",
  },
  {
    id: "qr-table-tent",
    label: "Table tent",
    group: "qr-physical",
    width: 1200,
    height: 1800,
    ratioLabel: "2:3",
    subtitle: "2:3",
  },
  {
    id: "qr-menu-insert",
    label: "Menu insert",
    group: "qr-physical",
    width: 1200,
    height: 2700,
    ratioLabel: "4:9",
    subtitle: "4:9",
  },
  {
    id: "qr-a6-flyer",
    label: "A6 flyer",
    group: "qr-physical",
    width: 1240,
    height: 1748,
    ratioLabel: "4.1:5.8",
    subtitle: "4.1:5.8",
  },
  {
    id: "qr-badge-lanyard",
    label: "Badge",
    group: "qr-physical",
    width: 900,
    height: 1200,
    ratioLabel: "3:4",
    subtitle: "3:4",
  },
] as const

const SIZE_TEMPLATE_BY_ID = new Map(SIZE_TEMPLATES.map((template) => [template.id, template]))

export function getSizeTemplate(id: string): SizeTemplate | undefined {
  return SIZE_TEMPLATE_BY_ID.get(id)
}

export function getSizeTemplatesByGroup(group: SizeTemplateGroup): SizeTemplate[] {
  return SIZE_TEMPLATES.filter((template) => template.group === group)
}

export function getSizeTemplateSections(): Array<{
  group: SizeTemplateGroup
  label: string
  templates: SizeTemplate[]
}> {
  return SIZE_TEMPLATE_GROUPS.flatMap((group) => {
    const templates = getSizeTemplatesByGroup(group)
    if (templates.length === 0) {
      return []
    }

    return [{
      group,
      label: SIZE_TEMPLATE_GROUP_LABELS[group],
      templates,
    }]
  })
}

export function formatAspectRatio(width: number, height: number): string {
  const safeWidth = Math.max(1, Math.round(width))
  const safeHeight = Math.max(1, Math.round(height))
  const divisor = greatestCommonDivisor(safeWidth, safeHeight)

  return `${safeWidth / divisor}:${safeHeight / divisor}`
}

export function findMatchingRatioTemplate(width: number, height: number): SizeTemplate | undefined {
  const targetRatio = width / Math.max(1, height)

  return getSizeTemplatesByGroup("ratio").find((template) => {
    const templateRatio = template.width / template.height
    return Math.abs(templateRatio - targetRatio) < 0.01
  })
}

function greatestCommonDivisor(left: number, right: number): number {
  let a = Math.abs(left)
  let b = Math.abs(right)

  while (b !== 0) {
    const remainder = a % b
    a = b
    b = remainder
  }

  return Math.max(1, a)
}
