"use client";

import { useState } from "react";

import { parseFill } from "@/components/ui/fill-picker/public-api";
import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import { QrColorFillControls } from "@/features/shell/settings/QrColorFillControls";
import {
  applyCornerFill,
  applyLogoFill,
  applyPatternModuleFill,
  applyPatternModuleImageUrl,
  applyUnifiedQrFill,
  applyUnifiedQrModuleImageUrl,
  applyUnifiedQrModulePatternPatch,
  isPatternModuleImageFill,
  readCornerFillCss,
  readLogoFillCss,
  readPatternModuleFillCss,
  type UnifiedQrFillPatches,
  type UnifiedQrFillSettings,
} from "@/features/shell/settings/settings-bridge";
import {
  getSettingsSectionTab,
  setSettingsSectionTab,
} from "@/features/shell/settings/settings-section-tabs";
import {
  QrColorPartBrowser,
  SettingsSwitchRow,
  SettingsTabPanel,
} from "@/features/shell/settings/settings-ui";

function QrColorUnifiedSettings({
  model,
  unifiedSettings,
  onApplyUnifiedPatches,
}: {
  model: SettingsModel;
  unifiedSettings: UnifiedQrFillSettings;
  onApplyUnifiedPatches: (patches: UnifiedQrFillPatches) => void;
}) {
  const { actualPatternSettings } = model;
  const moduleFill = readPatternModuleFillCss(actualPatternSettings);

  return (
    <QrColorFillControls
      moduleCapable
      fillPreviewImageUrl={
        isPatternModuleImageFill(actualPatternSettings)
          ? actualPatternSettings.moduleFillImageUrl
          : undefined
      }
      moduleFillMode={actualPatternSettings.dotsColorMode}
      moduleImage={{
        imageUrl: actualPatternSettings.moduleFillImageUrl,
        onUpload: (imageUrl, sourceMode = "upload") =>
          onApplyUnifiedPatches(
            applyUnifiedQrModuleImageUrl(imageUrl, sourceMode, unifiedSettings),
          ),
        onClear: () =>
          onApplyUnifiedPatches(applyUnifiedQrModuleImageUrl("", "upload", unifiedSettings)),
      }}
      modulePattern={{
        selectedPalette: actualPatternSettings.dotsPalette,
        selectedPreset: actualPatternSettings.dotsPalettePreset,
        onSelect: (preset) =>
          onApplyUnifiedPatches(
            applyUnifiedQrModulePatternPatch(
              preset === "custom"
                ? { dotsColorMode: "palette", dotsPalettePreset: "custom" }
                : {
                    dotsColorMode: "palette",
                    dotsPalette: [...preset.colors],
                    dotsPalettePreset: preset.label,
                  },
              unifiedSettings,
            ),
          ),
        onPaletteColorChange: (index, color) =>
          onApplyUnifiedPatches(
            applyUnifiedQrModulePatternPatch(
              {
                dotsColorMode: "palette",
                dotsPalettePreset: "custom",
                dotsPalette: actualPatternSettings.dotsPalette.map((current, paletteIndex) =>
                  paletteIndex === index ? color : current,
                ),
              },
              unifiedSettings,
            ),
          ),
      }}
      persistKey="qr-color-unified"
      qrGradient
      value={moduleFill}
      onValueChange={(fill) => onApplyUnifiedPatches(applyUnifiedQrFill(fill, unifiedSettings))}
    />
  );
}

function QrColorPerPartSettings({
  model,
  tab,
  onTabChange,
}: {
  model: SettingsModel;
  tab: string;
  onTabChange: (nextTab: string) => void;
}) {
  const {
    actualCornersSettings,
    actualLogoSettings,
    actualPatternSettings,
    onCornersSettingsChange,
    onLogoSettingsChange,
    onPatternSettingsChange,
  } = model;

  const moduleFill = readPatternModuleFillCss(actualPatternSettings);
  const eyeFill = readCornerFillCss(
    actualCornersSettings.cornerDotColorMode,
    actualCornersSettings.cornerDotSolidColor,
    actualCornersSettings.cornerDotGradient,
  );
  const frameFill = readCornerFillCss(
    actualCornersSettings.cornerSquareColorMode,
    actualCornersSettings.cornerSquareSolidColor,
    actualCornersSettings.cornerSquareGradient,
  );
  const logoFill = readLogoFillCss(actualLogoSettings);

  return (
    <>
      <QrColorPartBrowser selected={tab} onSelect={(nextPart) => onTabChange(nextPart)} />

      <SettingsTabPanel activeKey={tab}>
        {tab === "Logo" ? (
          <QrColorFillControls
            persistKey="qr-color-logo"
            qrGradient
            value={logoFill}
            onValueChange={(fill) => onLogoSettingsChange(applyLogoFill(fill, actualLogoSettings))}
          />
        ) : tab === "Module" ? (
          <QrColorFillControls
            moduleCapable
            fillPreviewImageUrl={
              isPatternModuleImageFill(actualPatternSettings)
                ? actualPatternSettings.moduleFillImageUrl
                : undefined
            }
            moduleFillMode={actualPatternSettings.dotsColorMode}
            moduleImage={{
              imageUrl: actualPatternSettings.moduleFillImageUrl,
              onUpload: (imageUrl, sourceMode = "upload") =>
                onPatternSettingsChange(applyPatternModuleImageUrl(imageUrl, sourceMode)),
              onClear: () => onPatternSettingsChange(applyPatternModuleImageUrl("", "upload")),
            }}
            modulePattern={{
              selectedPalette: actualPatternSettings.dotsPalette,
              selectedPreset: actualPatternSettings.dotsPalettePreset,
              onSelect: (preset) =>
                onPatternSettingsChange(
                  preset === "custom"
                    ? { dotsColorMode: "palette", dotsPalettePreset: "custom" }
                    : {
                        dotsColorMode: "palette",
                        dotsPalette: [...preset.colors],
                        dotsPalettePreset: preset.label,
                      },
                ),
              onPaletteColorChange: (index, color) =>
                onPatternSettingsChange({
                  dotsColorMode: "palette",
                  dotsPalettePreset: "custom",
                  dotsPalette: actualPatternSettings.dotsPalette.map((current, paletteIndex) =>
                    paletteIndex === index ? color : current,
                  ),
                }),
            }}
            persistKey="qr-color-module"
            qrGradient
            value={moduleFill}
            onValueChange={(fill) =>
              onPatternSettingsChange(applyPatternModuleFill(fill, actualPatternSettings))
            }
          />
        ) : tab === "Eye" || tab === "Frame" ? (
          <QrColorFillControls
            persistKey={`qr-color-${tab.toLowerCase()}`}
            qrGradient
            value={tab === "Eye" ? eyeFill : frameFill}
            onValueChange={(fill) =>
              onCornersSettingsChange(
                applyCornerFill(fill, tab === "Eye" ? "eye" : "frame", actualCornersSettings),
              )
            }
          />
        ) : null}
      </SettingsTabPanel>
    </>
  );
}

export function QrColorSection({ model }: { model: SettingsModel }) {
  const [tab, setTab] = useState(() => getSettingsSectionTab("qr-style", "Module"));
  const {
    actualCornersSettings,
    actualLogoSettings,
    actualPatternSettings,
    onCornersSettingsChange,
    onLogoSettingsChange,
    onPatternSettingsChange,
  } = model;

  const isUnified = actualPatternSettings.gradientLinkMode === "unified";
  const unifiedSettings: UnifiedQrFillSettings = {
    pattern: actualPatternSettings,
    corners: actualCornersSettings,
    logo: actualLogoSettings,
  };

  function applyUnifiedPatches(patches: UnifiedQrFillPatches) {
    if (model.onUnifiedQrFillSettingsChange) {
      model.onUnifiedQrFillSettingsChange(patches);
      return;
    }

    onPatternSettingsChange(patches.pattern);
    onCornersSettingsChange(patches.corners);
    onLogoSettingsChange(patches.logo);
  }

  function handleColorSeparatelyChange(checked: boolean) {
    if (!checked) {
      const moduleFillCss = readPatternModuleFillCss(actualPatternSettings);
      const fill = parseFill(moduleFillCss);

      if (fill) {
        applyUnifiedPatches(applyUnifiedQrFill(fill, unifiedSettings));
        return;
      }

      onPatternSettingsChange({ gradientLinkMode: "unified" });
      return;
    }

    onPatternSettingsChange({ gradientLinkMode: "split" });
  }

  function handlePartTabChange(nextTab: string) {
    setTab(nextTab);
    setSettingsSectionTab("qr-style", nextTab);
  }

  return (
    <div className="ds-section-stack w-full min-w-0 max-w-full">
      <SettingsSwitchRow
        checked={!isUnified}
        label="Color separately"
        onChange={handleColorSeparatelyChange}
      />
      {isUnified ? (
        <QrColorUnifiedSettings
          model={model}
          unifiedSettings={unifiedSettings}
          onApplyUnifiedPatches={applyUnifiedPatches}
        />
      ) : (
        <QrColorPerPartSettings model={model} tab={tab} onTabChange={handlePartTabChange} />
      )}
    </div>
  );
}
