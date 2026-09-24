const SURFACE_BG: Record<number, string> = {
  1: "bg-surface-1",
  2: "bg-surface-2",
  3: "bg-surface-3",
};

const SURFACE_SHADOW: Record<number, string> = {
  1: "shadow-surface-1",
  2: "shadow-surface-2",
  3: "shadow-surface-3",
};

export function surfaceClasses(bgLevel: number, shadowLevel: number = bgLevel): string {
  // Round after clamping so a fractional level can't index out of the lookup
  // tables (which would render "undefined undefined").
  const bg = Math.round(Math.max(1, Math.min(3, bgLevel)));
  const shadow = Math.round(Math.max(1, Math.min(3, shadowLevel)));
  return `${SURFACE_BG[bg]} ${SURFACE_SHADOW[shadow]}`;
}
