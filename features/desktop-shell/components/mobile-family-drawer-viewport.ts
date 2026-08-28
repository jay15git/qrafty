/** Ignore URL-bar jitter; real keyboards are typically 250px+. */
export const MOBILE_KEYBOARD_INSET_THRESHOLD_PX = 80

export function getMobileKeyboardInsetPx(
  innerHeight: number,
  visualViewport: { height: number; offsetTop: number } | null | undefined,
  thresholdPx = MOBILE_KEYBOARD_INSET_THRESHOLD_PX,
): number {
  if (!visualViewport) {
    return 0
  }

  const overlap = innerHeight - visualViewport.height - visualViewport.offsetTop
  return overlap > thresholdPx ? overlap : 0
}

export function getMobileDrawerMaxHeightPx(
  innerHeight: number,
  visualViewport: { height: number } | null | undefined,
  ratio: number,
): number {
  return (visualViewport?.height ?? innerHeight) * ratio
}

export function getMobileDrawerBottomOffsetPx(
  drawerBottomGapPx: number,
  keyboardInsetPx: number,
): number {
  return Math.max(drawerBottomGapPx, keyboardInsetPx)
}
