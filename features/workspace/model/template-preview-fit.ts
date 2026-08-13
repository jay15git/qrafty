export const TEMPLATE_PREVIEW_FIT_PADDING = 48
export const DESKTOP_CANVAS_FIT_PADDING = 20

export type TemplatePreviewFitOptions = {
  allowUpscale?: boolean
  padding?: number
}

export function computeTemplatePreviewFit(
  card: { height: number; width: number },
  viewport: { height: number; width: number },
  options: TemplatePreviewFitOptions = {},
): number {
  const padding = options.padding ?? TEMPLATE_PREVIEW_FIT_PADDING
  const availableWidth = Math.max(1, viewport.width - padding * 2)
  const availableHeight = Math.max(1, viewport.height - padding * 2)
  const cardWidth = Math.max(1, card.width)
  const cardHeight = Math.max(1, card.height)
  const scale = Math.min(availableWidth / cardWidth, availableHeight / cardHeight)

  return options.allowUpscale ? scale : Math.min(scale, 1)
}
