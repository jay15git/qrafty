const ACCORDION_SCROLL_PADDING = 24

export function getNextOpenItemId(
  currentOpenItemId: string | null | undefined,
  targetItemId: string,
  allowCollapse = true,
) {
  if (currentOpenItemId === targetItemId) {
    return allowCollapse ? null : targetItemId
  }

  return targetItemId
}

export function getNextOpenItemIds(
  currentOpenItemIds: string[] | null | undefined,
  targetItemId: string,
  allowCollapse = true,
) {
  const safeOpenItemIds = currentOpenItemIds ?? []
  const isOpen = safeOpenItemIds.includes(targetItemId)

  if (isOpen) {
    return allowCollapse
      ? safeOpenItemIds.filter((itemId) => itemId !== targetItemId)
      : safeOpenItemIds
  }

  return [...safeOpenItemIds, targetItemId]
}

export function getAccordionScrollAdjustment({
  containerBottom,
  containerTop,
  itemBottom,
  itemTop,
  padding = ACCORDION_SCROLL_PADDING,
  targetContentHeight,
  visiblePanelHeight,
}: {
  containerBottom: number
  containerTop: number
  itemBottom: number
  itemTop: number
  padding?: number
  targetContentHeight: number
  visiblePanelHeight: number
}) {
  const projectedBottom =
    itemBottom + Math.max(0, targetContentHeight - visiblePanelHeight)
  const maxVisibleBottom = containerBottom - padding

  if (projectedBottom > maxVisibleBottom) {
    return projectedBottom - maxVisibleBottom
  }

  if (itemTop < containerTop + padding) {
    return itemTop - (containerTop + padding)
  }

  return 0
}
