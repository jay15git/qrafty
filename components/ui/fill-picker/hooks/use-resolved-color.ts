"use client";

import * as React from "react";
import { parseColorDetailed } from "../lib/color";
import type { OklchColor } from "../lib/types";
import { coerce, isAchromatic, BLACK } from "../lib/color-components";

/**
 * Resolves the effective OKLCH color from controlled/uncontrolled inputs and
 * owns the remembered-hue memory.
 *
 * Hue is undefined for achromatic colors (c=0, pure black, pure white) so
 * any string round-trip through hex/rgb erases it. Remember the last hue
 * observed on a chromatic, mid-lightness color and substitute it back when
 * the resolved color lands on an achromatic edge — keeps the area picker
 * from snapping the hue to 0 when the user drags toward gray/black/white.
 */
export function useResolvedColor(
  controlledValue: string | OklchColor | undefined,
  defaultValue: string | OklchColor | undefined,
  internalColor: OklchColor,
): { color: OklchColor; lastGoodHue: number } {
  const isControlledColor = controlledValue !== undefined;
  const initialHue = coerce(defaultValue, BLACK).h || 0;
  const [lastGoodHue, setLastGoodHue] = React.useState<number>(initialHue);

  const isControlledStringInput =
    isControlledColor && typeof controlledValue === "string";
  const controlledParsed = isControlledStringInput
    ? parseColorDetailed(controlledValue as string)
    : null;
  const rawColor = isControlledStringInput
    ? (controlledParsed?.color ?? BLACK)
    : isControlledColor
      ? coerce(controlledValue, BLACK)
      : internalColor;
  const controlledHueAuthored = controlledParsed
    ? !controlledParsed.hueMissing
    : false;
  if (
    (!isAchromatic(rawColor) || controlledHueAuthored) &&
    rawColor.h !== lastGoodHue
  ) {
    // Hue memory must update synchronously during render for controlled string
    // inputs, so it is state adjusted during render (the documented prev-prop
    // pattern) rather than a ref — a ref write during render is unsafe under
    // concurrent React. The inequality guard is what makes the adjustment
    // converge: without it every render re-sets the same hue and React loops.
    setLastGoodHue(rawColor.h);
  }
  const color: OklchColor =
    isControlledStringInput && (controlledParsed?.hueMissing ?? true)
      ? { ...rawColor, h: lastGoodHue }
      : rawColor;

  return { color, lastGoodHue };
}
