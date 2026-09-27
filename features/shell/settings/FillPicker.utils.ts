import { formatColor, parseColor } from "@/components/ui/fill-picker/base/color-picker";
import {
  DEFAULT_LINEAR,
  DEFAULT_RADIAL,
  parseFill,
  type Fill,
  type GradientType,
} from "@/components/ui/fill-picker/lib/gradient";

export function fillFromHex(hex: string): Fill {
  const color = parseColor(hex);
  return {
    kind: "color",
    color: color ?? { l: 0, c: 0, h: 0, alpha: 1 },
  };
}

export function fillPreviewHex(fillCss: string): string {
  const parsed = parseFill(fillCss);
  if (!parsed) {
    const color = parseColor(fillCss);
    return color ? formatColor(color, "hex") : "#171717";
  }

  if (parsed.kind === "color") {
    return formatColor(parsed.color, "hex");
  }

  const stops = [...parsed.gradient.stops].sort((a, b) => a.position - b.position);
  const first = stops[0]?.color;
  return first ? formatColor(first, "hex") : "#171717";
}

export function isGradientFill(fillCss: string): boolean {
  return parseFill(fillCss)?.kind === "gradient";
}

/**
 * Re-express a fill as a locked gradient type — used when an upper-level
 * Linear/Radial select already chose the type, so the picker must not let
 * it drift. Same-type gradients pass through; other gradients keep their
 * stops/interp (and center for radial); a solid color seeds both stops.
 */
export function lockFillGradientType(
  fill: Fill,
  type: Extract<GradientType, "linear" | "radial">,
): Fill {
  if (fill.kind === "color") {
    const stops = [
      { color: fill.color, position: 0 },
      { color: fill.color, position: 1 },
    ];
    return {
      kind: "gradient",
      gradient: type === "radial" ? { ...DEFAULT_RADIAL, stops } : { ...DEFAULT_LINEAR, stops },
    };
  }

  const gradient = fill.gradient;
  if (gradient.type === type) {
    return fill;
  }
  if (type === "radial") {
    return {
      kind: "gradient",
      gradient: {
        ...DEFAULT_RADIAL,
        center: gradient.type === "linear" ? DEFAULT_RADIAL.center : gradient.center,
        stops: gradient.stops,
        interp: gradient.interp,
      },
    };
  }
  return {
    kind: "gradient",
    gradient: {
      ...DEFAULT_LINEAR,
      stops: gradient.stops,
      interp: gradient.interp,
    },
  };
}

/** Clamp picker output to what QR module/eye/frame/logo can store and render. */
export function normalizeFillForQrTarget(fill: Fill): Fill {
  if (fill.kind !== "gradient") {
    return fill;
  }

  const gradient = fill.gradient;

  if (gradient.type === "conic") {
    return {
      kind: "gradient",
      gradient: {
        type: "radial",
        shape: "circle",
        center: gradient.center,
        size: "farthest-corner",
        interp: gradient.interp,
        stops: gradient.stops,
      },
    };
  }

  if (gradient.type === "radial") {
    if (gradient.shape === "circle" && !gradient.radii && gradient.radiusPx == null) {
      return fill;
    }

    return {
      kind: "gradient",
      gradient: {
        ...gradient,
        shape: "circle",
        radii: undefined,
        radiusPx: undefined,
      },
    };
  }

  return fill;
}

export type ModulePatternControl = {
  selectedPalette: string[];
  selectedPreset: string | "custom";
  onSelect: (preset: { label: string; colors: string[] } | "custom") => void;
  onPaletteColorChange: (index: number, color: string) => void;
};

export type ModuleImageControl = {
  imageUrl: string;
  onUpload: (imageUrl: string, sourceMode?: "upload" | "url") => void;
  onClear: () => void;
};
