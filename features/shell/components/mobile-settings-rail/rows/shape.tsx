import { Suspense, useContext } from "react";

import { parseFill } from "@/components/ui/fill-picker/lib/gradient";
import type { Fill } from "@/components/ui/fill-picker/public-api";
import { useMobileDrawerNavigation } from "@/features/shell/inspector/MobileDrawerNavigationContext";
import { applyShapeFill, readShapeFillCss } from "@/features/shell/inspector/settings-bridge";
import { getActiveFillPresetForStoredValue } from "@/features/shell/inspector/settings-fill-preset-match";
import { SETTINGS_PREVIEW_TILE } from "@/features/shell/inspector/SettingsPreviewTiles";
import { ShapeGlyph, SQUARE_SHAPE_VIEWBOX } from "@/features/shell/inspector/SettingsSections";
import { SegmentTabs, SettingsSlider } from "@/features/shell/inspector/settings-ui";
import { QR_BACKGROUND_SHAPES, shapeViewBox } from "@/features/qr/styles/background-shapes";
import { cn } from "@/lib/utils";

import { LazyInspectorFillPicker } from "../lazy-details";
import { MobileRailModeContext, useLatestModel, type MobileRailRowProps } from "../rail-context";
import {
  fillPresetsForMode,
  lockedFillModeForRailMode,
  SHAPE_FILL_MODES,
  SHAPE_VIEW_MODES,
  shapeFillSubMode,
} from "../rail-modes";
import { MobileRailPickerTile, MobileRailSwatchTile } from "../tiles";

export function MobileShapeRailRow({ model }: MobileRailRowProps) {
  const navigation = useMobileDrawerNavigation();
  const railMode = useContext(MobileRailModeContext);
  const modelRef = useLatestModel(model);
  const mode = railMode?.mode ?? "shape";
  const selected = model.actualShapeSettings.backgroundShapeId;

  if (mode.startsWith("fill:")) {
    const value = readShapeFillCss(model.actualShapeSettings);
    const presets = fillPresetsForMode(shapeFillSubMode(mode));
    const activePreset = getActiveFillPresetForStoredValue(value, presets);
    const applyFill = (fill: Fill) => {
      const m = modelRef.current;
      m.onShapeSettingsChange(applyShapeFill(fill, m.actualShapeSettings));
    };

    return (
      <>
        <MobileRailPickerTile
          ariaLabel="Custom shape color"
          customFill={activePreset ? undefined : value}
          onOpen={() =>
            navigation?.openDetail({
              title: "Shape fill",
              content: (
                <Suspense fallback={null}>
                  <div
                    className="inspector-fill-popover w-full min-w-0"
                    data-theme={model.actualTheme}
                  >
                    <LazyInspectorFillPicker
                      lockedFillMode={lockedFillModeForRailMode(shapeFillSubMode(mode))}
                      qrGradient
                      value={value}
                      onValueChange={(fill) => applyFill(fill)}
                    />
                  </div>
                </Suspense>
              ),
            })
          }
        />
        {presets.map((preset) => (
          <MobileRailSwatchTile
            key={preset}
            ariaLabel="Use this shape color"
            fill={preset}
            selected={activePreset === preset}
            onSelect={() => {
              const fill = parseFill(preset);
              if (fill) {
                applyFill(fill);
              }
            }}
          />
        ))}
      </>
    );
  }

  return (
    <>
      <button
        aria-label="Use square shape"
        aria-pressed={selected === "none"}
        className={cn(SETTINGS_PREVIEW_TILE, "text-center")}
        data-slot="mobile-rail-option"
        title="Square"
        type="button"
        onClick={() => model.onShapeSettingsChange({ backgroundShapeId: "none" })}
      >
        <span className="relative z-10 grid size-full place-items-center p-0.5 dn-preview-icon">
          <ShapeGlyph viewBox={SQUARE_SHAPE_VIEWBOX} />
        </span>
      </button>
      {QR_BACKGROUND_SHAPES.map((option) => (
        <button
          key={option.id}
          aria-label={`Use ${option.label} shape`}
          aria-pressed={selected === option.id}
          className={cn(SETTINGS_PREVIEW_TILE, "text-center")}
          data-slot="mobile-rail-option"
          title={option.label}
          type="button"
          onClick={() => model.onShapeSettingsChange({ backgroundShapeId: option.id })}
        >
          <span className="relative z-10 grid size-full place-items-center p-0.5 dn-preview-icon">
            <ShapeGlyph path={option.path} viewBox={shapeViewBox(option)} />
          </span>
        </button>
      ))}
    </>
  );
}

/**
 * Shape footer: Shape|Fill view tabs on the bottom; above them the subrow
 * swaps between the padding slider (Shape view) and the fill sub-mode tabs
 * (Fill view) — same sliding-tab treatment as Color/Background.
 */
export function MobileShapeRailFooter({ model }: MobileRailRowProps) {
  const railMode = useContext(MobileRailModeContext);
  const mode = railMode?.selectedMode ?? "shape";
  const view = mode.startsWith("fill:") ? "fill" : "shape";

  return (
    <div className="dn-mobile-settings-rail__shapefooter">
      {view === "fill" ? (
        <div className="dn-mobile-settings-rail__tabs">
          <SegmentTabs
            className="dn-mobile-settings-rail__tabbar"
            items={SHAPE_FILL_MODES.map((subMode) => ({
              id: subMode.id,
              label: subMode.label,
            }))}
            value={shapeFillSubMode(mode)}
            onChange={(value) => railMode?.setMode(`fill:${value}`)}
          />
        </div>
      ) : (
        <div className="dn-mobile-settings-rail__slider">
          <SettingsSlider
            label="Padding"
            max={192}
            value={model.actualShapeSettings.shapePadding}
            onChange={(shapePadding) => model.onShapeSettingsChange({ shapePadding })}
          />
        </div>
      )}
      <div className="dn-mobile-settings-rail__tabs">
        <SegmentTabs
          className="dn-mobile-settings-rail__tabbar"
          items={SHAPE_VIEW_MODES.map((entry) => ({
            id: entry.id,
            label: entry.label,
          }))}
          value={view}
          onChange={(value) => railMode?.setMode(value === "fill" ? "fill:solid" : "shape")}
        />
      </div>
    </div>
  );
}
