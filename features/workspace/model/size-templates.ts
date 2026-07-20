export type SizeTemplateGroup = "ratio" | "web" | "print" | "qr-physical"

export type SizeTemplate = {
  id: string
  label: string
  group: SizeTemplateGroup
  width: number
  height: number
  ratioLabel: string
}

export const SIZE_TEMPLATE_GROUPS: readonly SizeTemplateGroup[] = [
  "ratio",
  "web",
  "print",
  "qr-physical",
] as const

export const SIZE_TEMPLATE_GROUP_LABELS: Record<SizeTemplateGroup, string> = {
  ratio: "Aspect ratio",
  web: "Web & sharing",
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
  }
}

export const SIZE_TEMPLATES: readonly SizeTemplate[] = [
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
    id: "web-open-graph",
    label: "Open Graph",
    group: "web",
    width: 1200,
    height: 630,
    ratioLabel: "1.91:1",
  },
  {
    id: "web-x-card",
    label: "X card",
    group: "web",
    width: 1200,
    height: 628,
    ratioLabel: "1.91:1",
  },

  {
    id: "print-us-letter",
    label: "US Letter",
    group: "print",
    width: 816,
    height: 1056,
    ratioLabel: "8.5:11",
  },
  {
    id: "print-a4",
    label: "A4",
    group: "print",
    width: 794,
    height: 1123,
    ratioLabel: "210:297",
  },
  {
    id: "print-a5",
    label: "A5",
    group: "print",
    width: 559,
    height: 794,
    ratioLabel: "148:210",
  },
  {
    id: "print-poster-18x24",
    label: "Poster 18×24",
    group: "print",
    width: 5400,
    height: 7200,
    ratioLabel: "3:4",
  },
  {
    id: "print-flyer-8x11",
    label: "Flyer 8.5×11",
    group: "print",
    width: 2550,
    height: 3300,
    ratioLabel: "8.5:11",
  },

  {
    id: "qr-business-card",
    label: "Business card",
    group: "qr-physical",
    width: 1050,
    height: 600,
    ratioLabel: "3.5:2",
  },
  {
    id: "qr-sticker-2x2",
    label: "Sticker",
    group: "qr-physical",
    width: 600,
    height: 600,
    ratioLabel: "1:1",
  },
  {
    id: "qr-table-tent",
    label: "Table tent",
    group: "qr-physical",
    width: 1200,
    height: 1800,
    ratioLabel: "2:3",
  },
  {
    id: "qr-menu-insert",
    label: "Menu insert",
    group: "qr-physical",
    width: 1200,
    height: 2700,
    ratioLabel: "4:9",
  },
  {
    id: "qr-a6-flyer",
    label: "A6 flyer",
    group: "qr-physical",
    width: 1240,
    height: 1748,
    ratioLabel: "4.1:5.8",
  },
  {
    id: "qr-badge-lanyard",
    label: "Badge",
    group: "qr-physical",
    width: 900,
    height: 1200,
    ratioLabel: "3:4",
  },
] as const

const SIZE_TEMPLATE_BY_ID = new Map(SIZE_TEMPLATES.map((template) => [template.id, template]))

export function getSizeTemplate(id: string): SizeTemplate | undefined {
  return SIZE_TEMPLATE_BY_ID.get(id)
}

export function getSizeTemplatesByGroup(group: SizeTemplateGroup): SizeTemplate[] {
  return SIZE_TEMPLATES.filter((template) => template.group === group)
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
