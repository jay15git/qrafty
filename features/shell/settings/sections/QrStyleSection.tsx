"use client";

import { useState } from "react";

import { Ellipsis } from "lucide-react";
import { QrStyleOptionPreview } from "@/features/qr/components/QrStyleOptionPreview";
import type { StylePreviewKind } from "@/features/qr/components/StylePreview";
import {
  ERROR_CORRECTION_LEVEL_OPTIONS,
  formatQrTypeNumberLabel,
  TYPE_NUMBER_MAX,
  TYPE_NUMBER_MIN,
} from "@/features/qr/styles/encoding-options";
import type { QrTypeNumber } from "@/features/qr/model/types";
import type { QraftyDataModulesStyle } from "@/features/qr/model/state";
import { getBrandIconById, POPULAR_BRAND_ICON_IDS } from "@/features/qr/assets/brand-icons";
import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import type { LogoSettings } from "@/features/shell/model/toolbar-types";
import { MobileOptionShelf } from "@/features/shell/settings/MobileOptionRail";
import {
  isQrStylePartId,
  QR_STYLE_PART_DEFINITIONS,
} from "@/features/shell/settings/qr-style-parts";
import { SettingsImageUploadTile } from "@/features/shell/settings/SettingsFillOptionGrid";
import { LogoIconPicker, LogoPickerTileIcon } from "@/features/shell/settings/SettingsPickers";
import { SETTINGS_PREVIEW_TILE_FLUID } from "@/features/shell/settings/SettingsPreviewTiles";
import {
  getSettingsSectionTab,
  setSettingsSectionTab,
} from "@/features/shell/settings/settings-section-tabs";
import {
  SettingsLabeledSelect,
  SettingsSlider,
  SettingsTabPanel,
  SettingsTilePopover,
} from "@/features/shell/settings/settings-ui";
import { cn } from "@/lib/utils";

function QrStylePreviewGrid({
  options,
  previewKind,
  selected,
  onSelect,
}: {
  options: ReadonlyArray<{ label: string; value: string }>;
  previewKind: StylePreviewKind;
  selected: string;
  onSelect: (value: string) => void;
}) {
  return (
    <MobileOptionShelf
      activeKey={selected}
      ariaLabel="Style options"
      dataSlot={`qr-style-grid:${previewKind}`}
      persistKey={`qr-style:${previewKind}`}
    >
      {options.map((option) => {
        const isSelected = selected === option.value;

        return (
          <button
            key={option.value}
            aria-label={option.label}
            aria-pressed={isSelected}
            className={cn(SETTINGS_PREVIEW_TILE_FLUID, "text-center")}
            title={option.label}
            type="button"
            onClick={() => onSelect(option.value)}
          >
            <span
              aria-hidden="true"
              className="grid size-full place-items-center overflow-hidden p-0.5 ds-squircle-xs"
            >
              <QrStyleOptionPreview
                className="size-full max-h-full max-w-full"
                previewKind={previewKind}
                value={option.value}
              />
            </span>
          </button>
        );
      })}
    </MobileOptionShelf>
  );
}

const QR_MODULE_SIZE_STYLES: Partial<Record<QraftyDataModulesStyle, true>> = {
  circle: true,
  diamond: true,
  hashtag: true,
  heart: true,
  "pinched-square": true,
  square: true,
  star: true,
};

const QR_MODULE_LINE_WIDTH_STYLES: Partial<Record<QraftyDataModulesStyle, true>> = {
  "circuit-board": true,
  "horizontal-line": true,
  rounded: true,
  "vertical-line": true,
};

function formatModuleScaleValue(value: number) {
  return `${Math.round(value * 100)}%`;
}

function QrModuleGeometrySlider({ model }: { model: SettingsModel }) {
  const { actualPatternSettings, onPatternSettingsChange } = model;
  const dotType = actualPatternSettings.qrDotType;

  if (QR_MODULE_SIZE_STYLES[dotType]) {
    return (
      <SettingsSlider
        formatValue={formatModuleScaleValue}
        label="Module size"
        max={1}
        min={0.25}
        step={0.05}
        value={actualPatternSettings.moduleSize ?? 1}
        onChange={(moduleSize) => onPatternSettingsChange({ moduleSize })}
      />
    );
  }

  if (QR_MODULE_LINE_WIDTH_STYLES[dotType]) {
    return (
      <SettingsSlider
        formatValue={formatModuleScaleValue}
        label="Line width"
        max={1}
        min={0.1}
        step={0.05}
        value={actualPatternSettings.moduleLineWidth ?? (dotType === "circuit-board" ? 0.5 : 1)}
        onChange={(moduleLineWidth) => onPatternSettingsChange({ moduleLineWidth })}
      />
    );
  }

  return null;
}

const LOGO_SOURCE_TABS = ["Brand", "Upload", "None"] as const;
type LogoSettingsTab = (typeof LOGO_SOURCE_TABS)[number];

function logoSourceTab(sourceMode: LogoSettings["sourceMode"]): LogoSettingsTab {
  if (sourceMode === "brand") return "Brand";
  if (sourceMode === "none") return "None";
  return "Upload";
}

export function QrStyleSection({ model }: { model: SettingsModel }) {
  const [tab, setTab] = useState(() => getSettingsSectionTab("qr-style", "Module"));
  const {
    actualEncodingSettings,
    actualLogoSettings,
    onEncodingSettingsChange,
    onLogoSettingsChange,
  } = model;

  const errorCorrectionIndex = Math.max(
    0,
    ERROR_CORRECTION_LEVEL_OPTIONS.findIndex(
      (option) => option.value === actualEncodingSettings.errorCorrectionLevel,
    ),
  );
  const logoSource = logoSourceTab(actualLogoSettings.sourceMode);

  const part = isQrStylePartId(tab) ? QR_STYLE_PART_DEFINITIONS[tab] : null;

  return (
    <div className="ds-section-stack w-full min-w-0 max-w-full">
      <SettingsLabeledSelect
        items={["Module", "Eye", "Frame", "Logo"]}
        placeholder="Part"
        value={tab}
        onChange={(nextTab) => {
          setTab(nextTab);
          setSettingsSectionTab("qr-style", nextTab);
        }}
      />

      <SettingsTabPanel activeKey={tab}>
        {tab === "Logo" ? (
          <>
            <SettingsLabeledSelect
              items={LOGO_SOURCE_TABS}
              label="Source"
              placeholder="Source"
              value={logoSourceTab(actualLogoSettings.sourceMode)}
              onChange={(next) => {
                const nextSource = next as LogoSettingsTab;

                if (nextSource === "Brand") {
                  onLogoSettingsChange({
                    sourceMode: "brand",
                    selectedBrandIconId:
                      actualLogoSettings.selectedBrandIconId || POPULAR_BRAND_ICON_IDS[0],
                  });
                  return;
                }

                onLogoSettingsChange({
                  sourceMode: nextSource === "Upload" ? "upload" : "none",
                });
              }}
            />

            {logoSource === "Upload" ? (
              <MobileOptionShelf
                ariaLabel="Logo upload"
                dataSlot="logo-upload-grid"
                persistKey="qr-logo-upload"
              >
                <SettingsImageUploadTile
                  fluid
                  ariaLabel="Upload custom logo"
                  className="ds-row-upload-tile"
                  imageUrl={actualLogoSettings.customImageUrl}
                  onClear={() => onLogoSettingsChange({ uploadedImageUrl: "" })}
                  onUpload={(imageUrl) => onLogoSettingsChange({ uploadedImageUrl: imageUrl })}
                />
              </MobileOptionShelf>
            ) : logoSource === "None" ? null : (
              <MobileOptionShelf
                activeKey={actualLogoSettings.selectedBrandIconId}
                ariaLabel="Logo options"
                dataSlot="logo-brand-grid"
                persistKey="qr-logo-brands"
              >
                {POPULAR_BRAND_ICON_IDS.map((iconId) => {
                  const brandIcon = getBrandIconById(iconId);
                  const isSelected =
                    !actualLogoSettings.customImageUrl &&
                    actualLogoSettings.selectedBrandIconId === iconId;

                  return (
                    <button
                      key={iconId}
                      aria-label={`Use ${brandIcon.label} logo`}
                      aria-pressed={isSelected}
                      className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
                      title={brandIcon.label}
                      type="button"
                      onClick={() =>
                        onLogoSettingsChange({
                          selectedBrandIconId: iconId,
                          sourceMode: "brand",
                        })
                      }
                    >
                      <span className="relative z-10 grid size-full place-items-center">
                        <LogoPickerTileIcon iconId={iconId} />
                      </span>
                    </button>
                  );
                })}
                <SettingsTilePopover
                  contentClassName="w-[18rem]"
                  title="Logo"
                  content={
                    <LogoIconPicker
                      selectedId={actualLogoSettings.selectedBrandIconId}
                      onSelect={(selectedBrandIconId) => {
                        onLogoSettingsChange({ selectedBrandIconId, sourceMode: "brand" });
                      }}
                    />
                  }
                >
                  <button
                    aria-label="More logo options"
                    className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
                    title="More"
                    type="button"
                  >
                    <span className="relative z-10 grid size-full place-items-center">
                      <Ellipsis aria-hidden className="size-4" />
                    </span>
                  </button>
                </SettingsTilePopover>
              </MobileOptionShelf>
            )}

            {logoSource === "None" ? null : (
              <SettingsSlider
                label="Size"
                max={100}
                value={actualLogoSettings.size}
                onChange={(size) => onLogoSettingsChange({ size })}
              />
            )}
          </>
        ) : part ? (
          <QrStylePreviewGrid
            options={part.options}
            previewKind={part.previewKind}
            selected={part.readSelected(model)}
            onSelect={(value) => part.applySelected(model, value)}
          />
        ) : null}
      </SettingsTabPanel>

      {tab === "Module" ? <QrModuleGeometrySlider model={model} /> : null}

      <SettingsSlider
        formatValue={formatQrTypeNumberLabel}
        label="Min version"
        max={TYPE_NUMBER_MAX}
        min={TYPE_NUMBER_MIN}
        step={1}
        value={actualEncodingSettings.typeNumber}
        onChange={(typeNumber) =>
          onEncodingSettingsChange({ typeNumber: typeNumber as QrTypeNumber })
        }
      />

      <SettingsSlider
        formatValue={(index) => ERROR_CORRECTION_LEVEL_OPTIONS[index]?.label ?? "Q"}
        label="Error correction"
        max={ERROR_CORRECTION_LEVEL_OPTIONS.length - 1}
        min={0}
        step={1}
        value={errorCorrectionIndex}
        onChange={(index) => {
          const option = ERROR_CORRECTION_LEVEL_OPTIONS[index];
          if (option) onEncodingSettingsChange({ errorCorrectionLevel: option.value });
        }}
      />
    </div>
  );
}
