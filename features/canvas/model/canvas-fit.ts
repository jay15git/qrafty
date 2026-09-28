export const CANVAS_FIT_PADDING = 48;
export const DESKTOP_CANVAS_FIT_PADDING = 20;
export const DESKTOP_ARTBOARD_VIEW_INSETS = {
  top: 24,
  right: 64,
  bottom: 24,
  left: 24,
} as const;

/** Minimal breathing room on mobile; top chrome floats over the canvas. */
export const MOBILE_ARTBOARD_VIEW_INSETS = {
  top: 12,
  right: 16,
  bottom: 16,
  left: 16,
} as const;

export type CanvasFitInsets = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

export type CanvasFitOptions = {
  allowUpscale?: boolean;
  insets?: Partial<CanvasFitInsets>;
  padding?: number;
};

function resolveCanvasFitInsets(options: CanvasFitOptions): CanvasFitInsets {
  const padding = options.padding ?? CANVAS_FIT_PADDING;

  return {
    top: options.insets?.top ?? padding,
    right: options.insets?.right ?? padding,
    bottom: options.insets?.bottom ?? padding,
    left: options.insets?.left ?? padding,
  };
}

export function computeCanvasFit(
  card: { height: number; width: number },
  viewport: { height: number; width: number },
  options: CanvasFitOptions = {},
): number {
  const insets = resolveCanvasFitInsets(options);
  const availableWidth = Math.max(1, viewport.width - insets.left - insets.right);
  const availableHeight = Math.max(1, viewport.height - insets.top - insets.bottom);
  const cardWidth = Math.max(1, card.width);
  const cardHeight = Math.max(1, card.height);
  const scale = Math.min(availableWidth / cardWidth, availableHeight / cardHeight);

  return options.allowUpscale ? scale : Math.min(scale, 1);
}
