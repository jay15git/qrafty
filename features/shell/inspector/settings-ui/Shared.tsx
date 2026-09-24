import { ChevronRight } from "lucide-react";
import {
  Children,
  cloneElement,
  isValidElement,
  useContext,
  type ReactElement,
  type ReactNode,
} from "react";

import { CUELUME_BUTTON } from "@/features/shell/audio/cuelume";
import { InspectorThemeContext } from "@/features/shell/inspector/theme-context";
import { fillPreviewHex, isGradientFill } from "@/features/shell/inspector/FillPicker.utils";
import { cn } from "@/lib/utils";

const DN_ROW = "ds-settings-row ds-squircle-sm";
export const DN_HINT = "ds-type-meta";
export const DN_LABEL = "ds-type-label";
export const DN_VALUE = "ds-type-value";
export const DN_SECTION_GAP = "ds-section-stack";

export function SettingsRowButton({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        DN_ROW,
        "inline-flex w-full items-center justify-between px-3 font-normal",
        className,
      )}
      type="button"
      {...CUELUME_BUTTON}
      {...props}
    >
      {children}
    </button>
  );
}

export function useInspectorTheme() {
  return useContext(InspectorThemeContext);
}

export type SettingsFillPopoverHandle = {
  openPicker: () => void;
};

export const OPTION_TILE_SCROLL_ROW = "ds-preview-row ds-option-tile-scroll-row";

export function FillSwatchButton({
  ariaLabel,
  fill,
  imageUrl,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  ariaLabel: string;
  fill: string;
  imageUrl?: string;
}) {
  const gradient = isGradientFill(fill);

  return (
    <button
      aria-label={ariaLabel}
      className={cn(
        "relative flex size-[length:var(--icon-hit)] shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus,var(--ring))]",
        className,
      )}
      data-slot="fill-swatch-trigger"
      type="button"
      {...CUELUME_BUTTON}
      {...props}
    >
      <span
        aria-hidden="true"
        className="relative size-6 shrink-0 overflow-hidden rounded-full border-2 border-[color-mix(in_srgb,var(--line)_40%,transparent)] box-border"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "conic-gradient(var(--checker-a, #808080) 0 25%, var(--checker-b, #c0c0c0) 0 50%, var(--checker-a, #808080) 0 75%, var(--checker-b, #c0c0c0) 0)",
            backgroundSize: "8px 8px",
          }}
        />
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={
            imageUrl
              ? {
                  backgroundImage: `url("${imageUrl}")`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                }
              : gradient
                ? { background: fill }
                : { backgroundColor: fillPreviewHex(fill) }
          }
        />
      </span>
    </button>
  );
}

export function ColorRowButton({
  fill,
  hint,
  imageUrl,
  ...props
}: React.ComponentProps<"button"> & {
  fill: string;
  hint: string;
  imageUrl?: string;
}) {
  const gradient = isGradientFill(fill);
  const hex = fillPreviewHex(fill).replace("#", "").toUpperCase();

  return (
    <SettingsRowButton {...props}>
      <span className="flex min-w-0 items-center gap-2">
        <span
          aria-hidden
          className="size-3.5 shrink-0 border border-[color-mix(in_srgb,var(--line)_40%,transparent)] ds-squircle-xs"
          style={
            imageUrl
              ? {
                  backgroundImage: `url("${imageUrl}")`,
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "cover",
                }
              : gradient
                ? { background: fill }
                : { backgroundColor: fillPreviewHex(fill) }
          }
        />
        <span className={DN_LABEL}>{hint}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1">
        <span className={DN_VALUE}>{imageUrl ? "Image" : gradient ? "Gradient" : hex}</span>
        <ChevronRight aria-hidden className={cn("size-3 opacity-50", DN_HINT)} />
      </span>
    </SettingsRowButton>
  );
}
