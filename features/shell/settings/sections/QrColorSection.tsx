"use client";

import { useState } from "react";

import { parseFill } from "@/components/ui/fill-picker/public-api";
import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import { QrColorFillControls } from "@/features/shell/settings/QrColorFillControls";
import type {
  ModuleImageControl,
  ModulePatternControl,
} from "@/features/shell/settings/FillPicker.utils";
import {
  applyCornerFill,
  applyLogoFill,
  applyQrFill,
  applyQrImageFill,
  applyQrPalettePatch,
  applyQrPaletteSelection,
  applyQrUnifiedFill,
  isPatternModuleImageFill,
  readCornerFillCss,
  readLogoFillCss,
  readPatternModuleFillCss,
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

function moduleImageControls(model: SettingsModel): ModuleImageControl {
  return {
    imageUrl: model.actualPatternSettings.moduleFillImageUrl,
    onUpload: (imageUrl, sourceMode = "upload") => applyQrImageFill(model, imageUrl, sourceMode),
    onClear: () => applyQrImageFill(model, "", "upload"),
  };
}

function modulePatternControls(model: SettingsModel): ModulePatternControl {
  const pattern = model.actualPatternSettings;
  return {
    selectedPalette: pattern.dotsPalette,
    selectedPreset: pattern.dotsPalettePreset,
    onSelect: (preset) => applyQrPaletteSelection(model, preset),
    onPaletteColorChange: (index, color) =>
      applyQrPalettePatch(model, {
        dotsColorMode: "palette",
        dotsPalettePreset: "custom",
        dotsPalette: pattern.dotsPalette.map((current, paletteIndex) =>
          paletteIndex === index ? color : current,
        ),
      }),
  };
}

function QrColorUnifiedSettings({ model }: { model: SettingsModel }) {
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
      moduleImage={moduleImageControls(model)}
      modulePattern={modulePatternControls(model)}
      persistKey="qr-color-unified"
      qrGradient
      value={moduleFill}
      onValueChange={(fill) => applyQrFill(model, fill)}
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
            moduleImage={moduleImageControls(model)}
            modulePattern={modulePatternControls(model)}
            persistKey="qr-color-module"
            qrGradient
            value={moduleFill}
            onValueChange={(fill) => applyQrFill(model, fill)}
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
  const { actualPatternSettings } = model;

  const isUnified = actualPatternSettings.gradientLinkMode === "unified";

  function handleColorSeparatelyChange(checked: boolean) {
    if (!checked) {
      const moduleFillCss = readPatternModuleFillCss(actualPatternSettings);
      const fill = parseFill(moduleFillCss);

      if (fill) {
        applyQrUnifiedFill(model, fill);
        return;
      }

      model.onPatternSettingsChange({ gradientLinkMode: "unified" });
      return;
    }

    model.onPatternSettingsChange({ gradientLinkMode: "split" });
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
        <QrColorUnifiedSettings model={model} />
      ) : (
        <QrColorPerPartSettings model={model} tab={tab} onTabChange={handlePartTabChange} />
      )}
    </div>
  );
}
