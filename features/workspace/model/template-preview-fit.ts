export const TEMPLATE_PREVIEW_FIT_PADDING = 48

export function computeTemplatePreviewFit(
  card: { height: number; width: number },
  viewport: { height: number; width: number },
  padding = TEMPLATE_PREVIEW_FIT_PADDING,
): number {
  const availableWidth = Math.max(1, viewport.width - padding * 2)
  const availableHeight = Math.max(1, viewport.height - padding * 2)
  const cardWidth = Math.max(1, card.width)
  const cardHeight = Math.max(1, card.height)

  return Math.min(availableWidth / cardWidth, availableHeight / cardHeight, 1)
}
