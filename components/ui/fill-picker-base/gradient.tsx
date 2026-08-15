"use client";

import * as React from "react";

import {
  Root as EngineGradientRoot,
  type RootProps as GradientRootProps,
} from "@/components/ui/fill-picker/parts/gradient/root";
import { Bar } from "@/components/ui/fill-picker/parts/gradient/bar";
import { Area as GradientArea } from "@/components/ui/fill-picker/parts/gradient/area";
import { Overlay as GradientOverlay } from "@/components/ui/fill-picker/parts/gradient/overlay";
import { RepeatingToggle } from "@/components/ui/fill-picker/parts/gradient/repeating-toggle";
import { AnglePad } from "@/components/ui/fill-picker/parts/gradient/angle-pad";
import { AngleInput } from "@/components/ui/fill-picker/parts/gradient/angle-input";
import { PositionPad } from "@/components/ui/fill-picker/parts/gradient/position-pad";
import { PositionInput } from "@/components/ui/fill-picker/parts/gradient/position-input";
import { ShapeSwitcher } from "@/components/ui/fill-picker/parts/gradient/shape-switcher";
import { RadiusInput } from "@/components/ui/fill-picker/parts/gradient/radius-input";
import { EllipseRadiiInput } from "@/components/ui/fill-picker/parts/gradient/ellipse-radii-input";
import { StopColor } from "@/components/ui/fill-picker/parts/gradient/stop-color";
import { Presets } from "@/components/ui/fill-picker/parts/gradient/presets";
import { CssInput as GradientCssInput } from "@/components/ui/fill-picker/parts/gradient/css-input";
import { PositionGroup } from "@/components/ui/fill-picker/parts/gradient/position-group";
import { AngleGroup } from "@/components/ui/fill-picker/parts/gradient/angle-group";

import { TypeSwitcher } from "./parts/gradient/type-switcher";
import { ReverseStops } from "./parts/gradient/reverse-stops";
import { StopList } from "./parts/gradient/stop-list";
import { InterpSwitcher } from "./parts/gradient/interp-switcher";
import { RadialSizeSelect } from "./parts/gradient/radial-size-select";
import { stopEditorSlot } from "./parts/gradient/stop-editor";

/**
 * The engine `Root` plus this variant's stop editor (Base UI Hue/Alpha/
 * FormatSwitcher/ChannelInput inside the shared popover shell). The Bar
 * imports no editor of its own — it renders whatever is injected here.
 */
const GradientRoot = React.forwardRef<HTMLDivElement, GradientRootProps>(
  function Root({ stopEditor = stopEditorSlot, ...props }, ref) {
    return <EngineGradientRoot ref={ref} stopEditor={stopEditor} {...props} />;
  },
);

const GradientPickerBase = {
  Root: GradientRoot,
  Bar,
  Area: GradientArea,
  Overlay: GradientOverlay,
  TypeSwitcher,
  ReverseStops,
  RepeatingToggle,
  AnglePad,
  AngleInput,
  PositionPad,
  PositionInput,
  ShapeSwitcher,
  RadiusInput,
  EllipseRadiiInput,
  RadialSizeSelect,
  StopList,
  StopColor,
  InterpSwitcher,
  Presets,
  CssInput: GradientCssInput,
  PositionGroup,
  AngleGroup,
};

export const GradientPicker = GradientPickerBase;
