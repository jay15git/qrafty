"use client";

import * as React from "react";
import { formatAll, gamutInfo } from "../lib/color";
import type { ColorFormat, GamutInfo, OklchColor } from "../lib/types";
import { coerce, ALL_FORMATS, BLACK, type ColorComponent } from "../lib/color-components";
import { useResolvedColor } from "./use-resolved-color";
import { useCommitColor, useColorPickerActions } from "./use-color-picker-actions";

export type { ColorComponent } from "../lib/color-components";

export interface UseColorPickerProps {
  /** Controlled color value (string or canonical OklchColor). */
  value?: string | OklchColor;
  /** Initial color when uncontrolled. */
  defaultValue?: string | OklchColor;
  /**
   * Fires whenever the color changes.
   *  - `color`: canonical OKLCH form (lossless source of truth).
   *  - `formatted`: the active output format string (governed by `format`).
   *  - `formats`: every supported format pre-serialized — use `formats.hex`
   *    when you need a fallback alongside the canonical `formats.oklch`.
   */
  onValueChange?: (
    color: OklchColor,
    formatted: string,
    formats: Record<ColorFormat, string>,
  ) => void;
  /** Active output format. */
  format?: ColorFormat;
  /** Initial format when uncontrolled. */
  defaultFormat?: ColorFormat;
  onFormatChange?: (format: ColorFormat) => void;
  /**
   * Color spaces (output formats) the picker exposes. Restricts the
   * FormatSwitcher tabs and the default format. Defaults to all formats.
   */
  formats?: ColorFormat[];
}

export interface ColorPickerState {
  color: OklchColor;
  format: ColorFormat;
  /** Active format string (mirrors `format`). */
  formatted: string;
  /** Allowed output formats (the set restricting the FormatSwitcher). */
  formats: ColorFormat[];
  /** Pre-serialized strings for every supported format. */
  formatStrings: Record<ColorFormat, string>;
  setColor: (next: string | OklchColor) => void;
  setComponent: (key: ColorComponent, value: number) => void;
  adjustComponent: (key: ColorComponent, delta: number) => void;
  setFormat: (f: ColorFormat) => void;
  setFromString: (s: string) => boolean;
  gamut: GamutInfo;
}

export function useColorPicker(props: UseColorPickerProps = {}): ColorPickerState {
  const {
    value: controlledValue,
    defaultValue,
    onValueChange,
    format: controlledFormat,
    defaultFormat = "p3",
    onFormatChange,
    formats: formatsProp,
  } = props;

  const formats = React.useMemo<ColorFormat[]>(
    () => (formatsProp && formatsProp.length > 0 ? formatsProp : ALL_FORMATS),
    [formatsProp],
  );
  const initialFormat = formats.includes(defaultFormat) ? defaultFormat : formats[0];

  const [internalColor, setInternalColor] = React.useState<OklchColor>(() =>
    coerce(defaultValue, BLACK),
  );
  const [internalFormat, setInternalFormat] = React.useState<ColorFormat>(initialFormat);

  const isControlledColor = controlledValue !== undefined;
  const isControlledFormat = controlledFormat !== undefined;

  const { color, lastGoodHue } = useResolvedColor(controlledValue, defaultValue, internalColor);
  const format = isControlledFormat ? controlledFormat! : internalFormat;

  const formatStrings = React.useMemo(
    () => formatAll(color),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- OKLCH channels are the meaningful deps; object identity is unstable
    [color.l, color.c, color.h, color.alpha],
  );
  const formatted = formatStrings[format];
  const gamut = React.useMemo(
    () => gamutInfo(color),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- gamut derives from OKLCH channels only
    [color.l, color.c, color.h, color.alpha],
  );
  const { commitColor, formatRef } = useCommitColor(
    format,
    onValueChange,
    isControlledColor,
    setInternalColor,
  );

  const { setColor, setComponent, adjustComponent, setFormat, setFromString } =
    useColorPickerActions(
      color,
      lastGoodHue,
      commitColor,
      formatRef,
      isControlledFormat,
      setInternalFormat,
      onFormatChange,
    );

  return {
    color,
    format,
    formatted,
    formats,
    formatStrings,
    setColor,
    setComponent,
    adjustComponent,
    setFormat,
    setFromString,
    gamut,
  };
}
