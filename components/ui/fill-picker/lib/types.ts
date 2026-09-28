export interface OklchColor {
  /** Lightness 0..1 */
  l: number;
  /** Chroma 0..~0.4 (hard upper bound depends on hue + space) */
  c: number;
  /** Hue 0..360 (NaN when chroma === 0; treat as 0 for serialization) */
  h: number;
  /** Alpha 0..1 */
  alpha: number;
}

export type ColorFormat = "hex" | "rgb" | "hsl" | "hsb" | "oklch" | "oklab" | "p3";

export type Gamut = "srgb" | "p3" | "rec2020";

export interface GamutInfo {
  inSrgb: boolean;
  inP3: boolean;
  inRec2020: boolean;
}
