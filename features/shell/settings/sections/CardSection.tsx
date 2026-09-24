"use client";

import { useContext, useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import {
  QR_BACKGROUND_SHAPES,
  shapeViewBox,
  type QrBackgroundShapeId,
} from "@/features/qr/styles/background-shapes";
import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import { useMobileSettingsDensity } from "@/features/shell/settings/MobileSettingsDensityContext";
import { MobileOptionShelf } from "@/features/shell/settings/MobileOptionRail";
import {
  BACKGROUND_FILL_MODE_TABS,
  backgroundFillModeTab,
  type BackgroundFillModeTab,
  FillModePresetControls,
  SECTION_STACK,
} from "@/features/shell/settings/sections/shared";
import { applyShapeFill, readShapeFillCss } from "@/features/shell/settings/settings-bridge";
import { SettingsLabeledSelect, SettingsSlider } from "@/features/shell/settings/settings-ui";
import { SETTINGS_PREVIEW_TILE_FLUID } from "@/features/shell/settings/SettingsPreviewTiles";
import { SettingsThemeContext } from "@/features/shell/settings/theme-context";
import { cn } from "@/lib/utils";

export const SQUARE_SHAPE_VIEWBOX = "0 0 24 24";

export function ShapeGlyph({
  className,
  path,
  viewBox,
}: {
  className?: string;
  path?: string;
  viewBox: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-[90%] fill-current", className)}
      viewBox={viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      {path ? <path d={path} /> : <rect width="24" height="24" />}
    </svg>
  );
}

const SHAPE_SELECT_TILE =
  "aspect-square h-auto justify-center gap-0 px-0 [&>span]:grid [&>span]:place-items-center [&>span:last-child]:hidden";

function ShapeCatalogueSelect({
  selected,
  onSelect,
}: {
  selected: QrBackgroundShapeId;
  onSelect: (shapeId: QrBackgroundShapeId) => void;
}) {
  const theme = useContext(SettingsThemeContext);
  const mobileDensity = useMobileSettingsDensity();

  if (mobileDensity) {
    return (
      <MobileOptionShelf
        activeKey={selected}
        ariaLabel="Background shapes"
        columns={4}
        dataSlot="shape-catalogue-grid"
        persistKey="qr-background-shapes"
      >
        <button
          aria-label="Use square shape"
          aria-pressed={selected === "none"}
          className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
          title="Square"
          type="button"
          onClick={() => onSelect("none")}
        >
          <span className="relative z-10 grid size-full place-items-center p-0.5 ds-preview-icon">
            <ShapeGlyph viewBox={SQUARE_SHAPE_VIEWBOX} />
          </span>
        </button>
        {QR_BACKGROUND_SHAPES.map((option) => (
          <button
            key={option.id}
            aria-label={`Use ${option.label} shape`}
            aria-pressed={selected === option.id}
            className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
            title={option.label}
            type="button"
            onClick={() => onSelect(option.id)}
          >
            <span className="relative z-10 grid size-full place-items-center p-0.5 ds-preview-icon">
              <ShapeGlyph path={option.path} viewBox={shapeViewBox(option)} />
            </span>
          </button>
        ))}
      </MobileOptionShelf>
    );
  }

  return (
    <div className="ds-content-type-select w-full min-w-0">
      <Select value={selected} onValueChange={(next) => onSelect(next as QrBackgroundShapeId)}>
        <SelectTrigger
          className="ds-content-type-select-trigger w-full min-w-0 ds-squircle-sm"
          placeholder="Shape"
          variant="borderless"
        />
        <SelectContent
          className={cn(
            "ds-portal-surface ds-popover-content overflow-hidden p-0 ds-squircle-md",
            theme === "dark" && "dark",
          )}
          data-theme={theme}
          listAxis="xy"
          listClassName="grid grid-cols-4 gap-0.5 p-1"
        >
          <SelectItem
            className={SHAPE_SELECT_TILE}
            index={0}
            label="Square"
            triggerLabel={
              <span className="flex min-w-0 items-center gap-2">
                <ShapeGlyph className="size-4 shrink-0" viewBox={SQUARE_SHAPE_VIEWBOX} />
                <span className="min-w-0 truncate">Square</span>
              </span>
            }
            value="none"
          >
            <ShapeGlyph className="size-7" viewBox={SQUARE_SHAPE_VIEWBOX} />
          </SelectItem>
          {QR_BACKGROUND_SHAPES.map((option, optionIndex) => (
            <SelectItem
              key={option.id}
              className={SHAPE_SELECT_TILE}
              index={optionIndex + 1}
              label={option.label}
              triggerLabel={
                <span className="flex min-w-0 items-center gap-2">
                  <ShapeGlyph
                    className="size-4 shrink-0"
                    path={option.path}
                    viewBox={shapeViewBox(option)}
                  />
                  <span className="min-w-0 truncate">{option.label}</span>
                </span>
              }
              value={option.id}
            >
              <ShapeGlyph className="size-7" path={option.path} viewBox={shapeViewBox(option)} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function CardSection({ model }: { model: SettingsModel }) {
  const { actualShapeSettings, onShapeSettingsChange } = model;
  const cardFill = readShapeFillCss(actualShapeSettings);
  const [fillMode, setFillMode] = useState<BackgroundFillModeTab>(() =>
    backgroundFillModeTab(cardFill),
  );

  return (
    <div className={SECTION_STACK}>
      <ShapeCatalogueSelect
        selected={actualShapeSettings.backgroundShapeId}
        onSelect={(backgroundShapeId) => onShapeSettingsChange({ backgroundShapeId })}
      />
      <SettingsLabeledSelect
        items={BACKGROUND_FILL_MODE_TABS}
        label="Fill"
        placeholder="Fill"
        value={fillMode}
        onChange={(next) => setFillMode(next as BackgroundFillModeTab)}
      />
      <FillModePresetControls
        mode={fillMode}
        value={cardFill}
        applyFill={(fill) => onShapeSettingsChange(applyShapeFill(fill, actualShapeSettings))}
      />
      <SettingsSlider
        label="Padding"
        max={192}
        value={actualShapeSettings.shapePadding}
        onChange={(shapePadding) => onShapeSettingsChange({ shapePadding })}
      />
    </div>
  );
}
