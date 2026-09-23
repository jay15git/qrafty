"use client";

import * as React from "react";
import {
  parseColorDetailed,
  formatAll,
  gamutFromFormat,
  gamutInfo,
  toGamut,
} from "../lib/color";
import type { ColorFormat, OklchColor } from "../lib/types";
import {
  applyComponent,
  type ColorComponent,
} from "../lib/color-components";
/**
 * Stable `commitColor`: writes uncontrolled state and emits `onValueChange`
 * with every format pre-serialized.
 *
 * Refs mirror `format` and `onValueChange` during render so chained
 * commits within a single event handler — e.g. `setFormat` calling
 * `commitColor` after a gamut clamp in the same tick — see the updated
 * values instead of the closure snapshot from the previous render. Without
 * this, `setFormat`'s clamp call emits `formatted` in the *old* format.
 */
export function useCommitColor(
  format: ColorFormat,
  onValueChange:
    | ((
        color: OklchColor,
        formatted: string,
        formats: Record<ColorFormat, string>,
      ) => void)
    | undefined,
  isControlledColor: boolean,
  setInternalColor: React.Dispatch<React.SetStateAction<OklchColor>>,
): {
  commitColor: (next: OklchColor) => void;
  formatRef: React.RefObject<ColorFormat>;
} {
  const formatRef = React.useRef(format);
  const onValueChangeRef = React.useRef(onValueChange);
  const isControlledColorRef = React.useRef(isControlledColor);

  React.useLayoutEffect(() => {
    formatRef.current = format;
    onValueChangeRef.current = onValueChange;
    isControlledColorRef.current = isControlledColor;
  });

  const commitColor = React.useCallback((next: OklchColor) => {
    if (!isControlledColorRef.current) setInternalColor(next);
    const cb = onValueChangeRef.current;
    if (cb) {
      const all = formatAll(next);
      cb(next, all[formatRef.current], all);
    }
  }, [setInternalColor]);

  return { commitColor, formatRef };
}

export interface ColorPickerActions {
  setColor: (next: string | OklchColor) => void;
  setComponent: (key: ColorComponent, value: number) => void;
  adjustComponent: (key: ColorComponent, delta: number) => void;
  setFormat: (f: ColorFormat) => void;
  setFromString: (s: string) => boolean;
}

/**
 * The picker's mutation callbacks. All funnel through `commitColor` so
 * controlled/uncontrolled writes and `onValueChange` emission stay identical.
 */
export function useColorPickerActions(
  color: OklchColor,
  lastGoodHue: number,
  commitColor: (next: OklchColor) => void,
  formatRef: React.RefObject<ColorFormat>,
  isControlledFormat: boolean,
  setInternalFormat: React.Dispatch<React.SetStateAction<ColorFormat>>,
  onFormatChange: ((format: ColorFormat) => void) | undefined,
): ColorPickerActions {
  // Commit a string input, re-pinning the remembered hue when the parse
  // lost it (achromatic hex/rgb/hsl) — otherwise a gray commit would store
  // the defaulted h: 0 and later re-saturation would snap to red.
  const commitString = React.useCallback(
    (s: string): boolean => {
      const parsed = parseColorDetailed(s);
      if (!parsed) return false;
      const next = parsed.hueMissing
        ? { ...parsed.color, h: lastGoodHue }
        : parsed.color;
      commitColor(next);
      return true;
    },
    [commitColor, lastGoodHue],
  );

  const setColor = React.useCallback(
    (next: string | OklchColor) => {
      if (typeof next === "string") {
        commitString(next);
        return;
      }
      commitColor(next);
    },
    [commitColor, commitString],
  );

  const setComponent = React.useCallback(
    (key: ColorComponent, val: number) => {
      commitColor(applyComponent(color, key, val));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- commitColor is stable; color channels are the live snapshot
    [color.l, color.c, color.h, color.alpha, commitColor],
  );

  const adjustComponent = React.useCallback(
    (key: ColorComponent, delta: number) => {
      const current =
        key === "l" ? color.l : key === "c" ? color.c : key === "h" ? color.h : color.alpha;
      commitColor(applyComponent(color, key, current + delta));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- commitColor is stable; color channels are the live snapshot
    [color.l, color.c, color.h, color.alpha, commitColor],
  );

  const setFormat = React.useCallback(
    (f: ColorFormat) => {
      // Switching formats is also a switch of *picking* gamut. If the current
      // OKLCH state lives outside the new format's gamut (e.g. user authored
      // a wide P3 chroma in OKLCH mode, then toggled to hex), the displayed
      // string would be gamut-mapped at format time but the underlying state
      // — and the gamut badge — would still report out-of-gamut. Clamp on
      // the way in so state and display agree. Hue is pinned per the picker's
      // "chroma is the only lossy axis" invariant.
      const targetGamut = gamutFromFormat(f);
      const info = gamutInfo(color);
      const alreadyIn =
        targetGamut === "srgb"
          ? info.inSrgb
          : targetGamut === "p3"
            ? info.inP3
            : info.inRec2020;
      // Update the format ref first so the synchronous `commitColor` below
      // emits `formatted` in the *new* format. The state update for
      // `internalFormat` happens after the commit and would otherwise leave a
      // one-call lag where the emitted formatted string is in the prior format.
      formatRef.current = f;
      if (!alreadyIn) {
        const targetHue = color.h;
        const clamped = toGamut(color, targetGamut);
        commitColor({ ...clamped, h: targetHue });
      }
      if (!isControlledFormat) setInternalFormat(f);
      onFormatChange?.(f);
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps -- color channels drive gamut clamp; onFormatChange is optional callback
  [color.l, color.c, color.h, color.alpha, commitColor, isControlledFormat, onFormatChange],
  );

  const setFromString = React.useCallback(
    (s: string) => commitString(s),
    [commitString],
  );

  return {
    setColor,
    setComponent,
    adjustComponent,
    setFormat,
    setFromString,
  };
}
