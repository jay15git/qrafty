import { formatColor, parseColor } from "@/components/ui/fill-picker/lib/color";
import {
  formatFill,
  parseFill,
  type Fill,
  type Gradient,
} from "@/components/ui/fill-picker/lib/gradient";
import type { QraftyGradient } from "@/features/qr/model/state";
import { getQraftyGradientCenter } from "@/features/qr/styles/qrafty-gradient-geometry";
import { radiansToDegrees } from "@/features/qr/styles/gradient-controls";
import { fillPreviewHex } from "@/features/shell/settings/FillPicker.utils";

export type PaintKind = "gradient" | "image" | "none" | "palette" | "solid";

/**
 * Canonical fill for canvas layers, the card, and (eventually) QR part fills.
 *
 * `kind` is the active representation; the remaining fields are the payloads
 * — and double as latent memory, so a mode-tab toggle back to "gradient"
 * restores the last picked gradient instead of resetting to defaults. This
 * mirrors how `QraftyState` already stores `dotsColorMode` +
 * `dotsSolidColor`/`dataModulesGradient`/`dotsPalette`/`moduleFillImage`.
 */
export type Paint = {
  kind: PaintKind;
  /** CSS color. Payload for `solid`; last-picked color for other kinds. */
  solid: string;
  /** Payload for `gradient`; remembered across non-gradient kinds. */
  gradient?: Gradient;
  /** Image URL/blob/data payload for `image`. */
  image?: string;
  /** Palette payload for `palette` (QR module fills). */
  palette?: string[];
};

const FALLBACK_SOLID = "#171717";

function firstStopHex(gradient: Gradient): string {
  const first = [...gradient.stops].sort((a, b) => a.position - b.position)[0];
  return first ? formatColor(first.color, "hex") : FALLBACK_SOLID;
}

function solidToGradient(solid: string): Gradient {
  const seed = parseColor(solid) ?? { l: 0, c: 0, h: 0, alpha: 1 };
  return {
    type: "linear",
    angle: 135,
    interp: "oklch",
    stops: [
      { color: seed, position: 0 },
      { color: seed, position: 1 },
    ],
  };
}

export function solidPaint(color: string, previous?: Paint): Paint {
  return {
    kind: "solid",
    solid: color,
    gradient: previous?.gradient,
    image: previous?.image,
    palette: previous?.palette,
  };
}

export function gradientPaint(gradient: Gradient, previous?: Paint): Paint {
  return {
    kind: "gradient",
    gradient,
    solid: previous?.solid ?? firstStopHex(gradient),
    image: previous?.image,
    palette: previous?.palette,
  };
}

export function imagePaint(value: string, previous?: Paint): Paint {
  return {
    kind: "image",
    image: value,
    solid: previous?.solid ?? FALLBACK_SOLID,
    gradient: previous?.gradient,
    palette: previous?.palette,
  };
}

export function nonePaint(previous?: Paint): Paint {
  return {
    kind: "none",
    solid: previous?.solid ?? FALLBACK_SOLID,
    gradient: previous?.gradient,
    image: previous?.image,
    palette: previous?.palette,
  };
}

/** Representative CSS color for previews, caret color, and solid fallbacks. */
export function paintSolidColor(paint: Paint | undefined, fallback = FALLBACK_SOLID): string {
  if (!paint) {
    return fallback;
  }

  if (paint.kind === "solid") {
    return paint.solid;
  }

  if (paint.kind === "gradient" && paint.gradient) {
    return firstStopHex(paint.gradient);
  }

  return paint.solid || fallback;
}

/** CSS `background`-level value for the paint (solid color or gradient fn). */
export function paintToCss(paint: Paint): string {
  if (paint.kind === "gradient" && paint.gradient) {
    return formatFill({ kind: "gradient", gradient: paint.gradient });
  }

  return paint.solid;
}

/** Fill-picker value for a paint (`none`/`image`/`palette` read as solid). */
function paintToPickerFill(paint: Paint | undefined): Fill {
  if (paint?.kind === "gradient" && paint.gradient) {
    return { kind: "gradient", gradient: paint.gradient };
  }

  const color = parseColor(paint?.solid ?? FALLBACK_SOLID);
  return { kind: "color", color: color ?? { l: 0, c: 0, h: 0, alpha: 1 } };
}

/** Normalized picker CSS value, matching the old `*FillCssValue` getters. */
export function paintToPickerCss(paint: Paint | undefined): string {
  return formatFill(paintToPickerFill(paint));
}

/** Apply a fill-picker value, keeping latent payloads from `previous`. */
export function paintFromPickerFill(fill: Fill, previous?: Paint): Paint {
  if (fill.kind === "gradient") {
    return gradientPaint(fill.gradient, previous);
  }

  return solidPaint(formatColor(fill.color, "hex"), previous);
}

/**
 * Switch the active kind from a mode tab, preserving payloads for memory.
 * "gradient" with no remembered gradient seeds a flat gradient from the
 * current solid — visually identical to the solid it replaces.
 */
export function paintForKind(kind: PaintKind, previous?: Paint): Paint {
  switch (kind) {
    case "gradient":
      return gradientPaint(
        previous?.gradient ?? solidToGradient(previous?.solid ?? FALLBACK_SOLID),
        previous,
      );
    case "image":
      return imagePaint(previous?.image ?? "", previous);
    case "none":
      return nonePaint(previous);
    case "palette":
      return {
        kind: "palette",
        palette: previous?.palette ?? [],
        solid: previous?.solid ?? FALLBACK_SOLID,
        gradient: previous?.gradient,
        image: previous?.image,
      };
    default:
      return solidPaint(
        previous?.kind === "gradient" && previous.gradient
          ? firstStopHex(previous.gradient)
          : (previous?.solid ?? FALLBACK_SOLID),
        previous,
      );
  }
}

/** Parse a stored CSS fill string into a Paint (solid or gradient). */
export function paintFromCss(css: string): Paint {
  const parsed = parseFill(css);

  if (parsed?.kind === "gradient") {
    return gradientPaint(parsed.gradient, { kind: "solid", solid: fillPreviewHex(css) });
  }

  return { kind: "solid", solid: css };
}

const CSS_STUDIO_ROTATION_OFFSET_DEG = 90;

/**
 * Legacy `fillMode`/`fillGradient` (QraftyGradient) layer triple from
 * pre-Paint serialized documents. Mirrors `qraftyGradientToFill` in
 * settings-bridge; both die when `QraftyGradient` is retired in T4.5.
 */
export function paintFromQraftyGradient(gradient: QraftyGradient): Paint | undefined {
  if (!gradient.enabled) {
    return undefined;
  }

  const start = gradient.colorStops[0];
  const end = gradient.colorStops[1] ?? start;
  const fallbackColor = { l: 0, c: 0, h: 0, alpha: 1 } as const;
  const stops: Gradient["stops"] = [
    { color: parseColor(start.color) ?? fallbackColor, position: start.offset },
    { color: parseColor(end.color) ?? fallbackColor, position: end.offset },
  ];

  const parsed: Gradient =
    gradient.type === "radial"
      ? {
          type: "radial",
          shape: "circle",
          center: getQraftyGradientCenter(gradient),
          size: "farthest-corner",
          interp: "oklch",
          stops,
        }
      : {
          type: "linear",
          angle:
            (((radiansToDegrees(gradient.rotation) + CSS_STUDIO_ROTATION_OFFSET_DEG) % 360) + 360) %
            360,
          interp: "oklch",
          stops,
        };

  return gradientPaint(parsed);
}

function isPaintGradient(value: unknown): value is Gradient {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const gradient = value as Record<string, unknown>;
  return (
    (gradient.type === "linear" || gradient.type === "radial" || gradient.type === "conic") &&
    Array.isArray(gradient.stops)
  );
}

/** Runtime guard for deserialized/normalized paint values. */
export function normalizePaint(value: unknown, fallback: Paint | undefined): Paint | undefined {
  if (typeof value === "string") {
    if (/^#[0-9a-f]{6}$/i.test(value)) {
      return { kind: "solid", solid: value, gradient: fallback?.gradient };
    }

    const parsed = parseFill(value);
    if (parsed?.kind === "gradient") {
      return gradientPaint(parsed.gradient, fallback);
    }

    return fallback;
  }

  if (typeof value !== "object" || value === null) {
    return fallback;
  }

  const paint = value as Record<string, unknown>;
  const solid = typeof paint.solid === "string" ? paint.solid : (fallback?.solid ?? FALLBACK_SOLID);
  const gradient = isPaintGradient(paint.gradient) ? paint.gradient : fallback?.gradient;
  const image = typeof paint.image === "string" ? paint.image : fallback?.image;
  const palette = Array.isArray(paint.palette)
    ? paint.palette.filter((entry): entry is string => typeof entry === "string")
    : fallback?.palette;

  switch (paint.kind) {
    case "solid":
      return { kind: "solid", solid, gradient, image, palette };
    case "gradient":
      return gradient ? { kind: "gradient", gradient, solid, image, palette } : fallback;
    case "image":
      return { kind: "image", image: image ?? "", solid, gradient, palette };
    case "none":
      return { kind: "none", solid, gradient, image, palette };
    case "palette":
      return { kind: "palette", palette: palette ?? [], solid, gradient, image };
    default:
      return fallback;
  }
}
