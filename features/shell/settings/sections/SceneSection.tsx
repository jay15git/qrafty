"use client";

import { useState } from "react";

import { WallpaperOptionPreview } from "@/features/canvas/components/WallpaperOptionPreview";
import { PaperShaderOptionPreview } from "@/features/canvas/components/PaperShaderOptionPreview";
import { isSceneWallpaperPath, SCENE_WALLPAPERS } from "@/features/canvas/assets/scene-wallpapers";
import { createDefaultCanvasCardPaperShader } from "@/features/canvas/model/card-state";
import {
  getCardGeneratedShaderDefinitions,
  type PaperShaderId,
} from "@/features/canvas/rendering/paper-shader-definitions";
import { preloadRasterImage } from "@/features/canvas/rendering/preload-raster-image";
import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import { useMobileSettingsDensity } from "@/features/shell/settings/MobileSettingsDensityContext";
import { MobileOptionShelf } from "@/features/shell/settings/MobileOptionRail";
import { SettingsPaperShaderControls } from "@/features/shell/settings/PaperShaderSettings";
import {
  BACKGROUND_FILL_MODE_TABS,
  backgroundFillModeTab,
  type BackgroundFillModeTab,
  FillModePresetControls,
  SECTION_STACK,
} from "@/features/shell/settings/sections/shared";
import { applyCardFill } from "@/features/shell/settings/settings-bridge";
import {
  getSettingsSectionTab,
  setSettingsSectionTab,
} from "@/features/shell/settings/settings-section-tabs";
import { SettingsLabeledSelect, SettingsTabPanel } from "@/features/shell/settings/settings-ui";
import { SettingsImageUploadTile } from "@/features/shell/settings/SettingsFillOptionGrid";
import { SETTINGS_PREVIEW_TILE_FLUID } from "@/features/shell/settings/SettingsPreviewTiles";
import { cn } from "@/lib/utils";

function PaperShaderPreviewRow({
  selected,
  onSelect,
}: {
  selected: PaperShaderId;
  onSelect: (shaderId: PaperShaderId) => void;
}) {
  const shaders = getCardGeneratedShaderDefinitions();

  return (
    <MobileOptionShelf
      activeKey={selected}
      ariaLabel="Shader options"
      dataSlot="paper-shader-grid"
      persistKey="paper-shader-grid"
    >
      {shaders.map((option) => {
        const isSelected = selected === option.id;

        return (
          <button
            key={option.id}
            aria-label={`Use ${option.label} shader`}
            aria-pressed={isSelected}
            className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
            title={option.label}
            type="button"
            onClick={() => onSelect(option.id)}
          >
            <PaperShaderOptionPreview
              className="relative z-10 block size-full overflow-hidden ds-squircle-xs"
              isSelected={isSelected}
              shaderId={option.id}
            />
          </button>
        );
      })}
    </MobileOptionShelf>
  );
}

function WallpaperPreviewRow({
  onClear,
  onSelect,
  onUpload,
  selectedPath,
}: {
  onClear: () => void;
  onSelect: (imagePath: string) => void;
  onUpload: (imageUrl: string) => void;
  selectedPath: string;
}) {
  const mobileDensity = useMobileSettingsDensity();
  const customImageUrl = selectedPath && !isSceneWallpaperPath(selectedPath) ? selectedPath : "";

  const wallpaperTiles = SCENE_WALLPAPERS.map((wallpaper) => {
    const isSelected = selectedPath === wallpaper.path;

    return (
      <button
        key={wallpaper.id}
        aria-label={`Use ${wallpaper.label} wallpaper`}
        aria-pressed={isSelected}
        className={cn(SETTINGS_PREVIEW_TILE_FLUID)}
        title={wallpaper.label}
        type="button"
        onClick={() => onSelect(wallpaper.path)}
        onPointerEnter={() => {
          void preloadRasterImage(wallpaper.path);
        }}
      >
        <WallpaperOptionPreview
          alt={wallpaper.label}
          className="relative z-10 block size-full overflow-hidden ds-squircle-xs"
          previewPath={wallpaper.previewPath}
        />
      </button>
    );
  });

  if (mobileDensity) {
    return (
      <MobileOptionShelf
        activeKey={selectedPath}
        ariaLabel="Image options"
        dataSlot="wallpaper-grid"
        label="Presets"
        persistKey="background-wallpapers"
      >
        <SettingsImageUploadTile
          fluid
          ariaLabel="Upload custom image"
          imageUrl={customImageUrl}
          onClear={onClear}
          onUpload={onUpload}
        />
        {wallpaperTiles}
      </MobileOptionShelf>
    );
  }

  return (
    <>
      <div className="flex min-h-[var(--control-height)] items-center">
        <span className="ds-row-label-text pl-[var(--row-px)]">Upload</span>
        <SettingsImageUploadTile
          ariaLabel="Upload custom image"
          className="ds-row-upload-tile ml-auto"
          imageUrl={customImageUrl}
          onClear={onClear}
          onUpload={onUpload}
        />
      </div>
      <MobileOptionShelf
        activeKey={selectedPath}
        ariaLabel="Image options"
        dataSlot="wallpaper-grid"
        label="Presets"
      >
        {wallpaperTiles}
      </MobileOptionShelf>
    </>
  );
}

type SceneBackgroundTab = "Shader" | "Image" | BackgroundFillModeTab;

const SCENE_BACKGROUND_TABS: readonly SceneBackgroundTab[] = [
  "Shader",
  "Image",
  ...BACKGROUND_FILL_MODE_TABS,
];

function normalizeSceneBackgroundTab(tab: string, cardFill: string): SceneBackgroundTab {
  if (tab === "Shader" || tab === "Image") return tab;
  if ((BACKGROUND_FILL_MODE_TABS as readonly string[]).includes(tab)) {
    return tab as BackgroundFillModeTab;
  }
  return backgroundFillModeTab(cardFill);
}

function backgroundTabFromStyleMode(
  styleMode: SettingsModel["actualBackgroundSettings"]["styleMode"],
  cardFill: string,
): SceneBackgroundTab {
  if (styleMode === "image" || styleMode === "image-filter") {
    return "Image";
  }

  if (styleMode === "paper-shader") {
    return "Shader";
  }

  return backgroundFillModeTab(cardFill);
}

export function SceneSection({ model }: { model: SettingsModel }) {
  const {
    actualBackgroundSettings,
    actualImageSettings,
    actualShapeSettings,
    controller,
    onBackgroundSettingsChange,
    onImageSettingsChange,
    onShapeSettingsChange,
  } = model;
  const [tab, setTab] = useState<SceneBackgroundTab>(() =>
    normalizeSceneBackgroundTab(
      getSettingsSectionTab(
        "background",
        backgroundTabFromStyleMode(
          actualBackgroundSettings.styleMode,
          actualShapeSettings.cardFill,
        ),
      ),
      actualShapeSettings.cardFill,
    ),
  );
  const paperShader = actualBackgroundSettings.paperShader;
  const backgroundFill = actualShapeSettings.cardFill;

  function handleBackgroundTabChange(nextTab: string) {
    const resolvedTab = normalizeSceneBackgroundTab(nextTab, backgroundFill);
    setTab(resolvedTab);
    setSettingsSectionTab("background", resolvedTab);
    controller?.onCanvasBackgroundTabChange?.(
      resolvedTab === "Shader" ? "shader" : resolvedTab === "Image" ? "image" : "color",
    );
  }

  return (
    <div className={SECTION_STACK}>
      <SettingsLabeledSelect
        items={SCENE_BACKGROUND_TABS}
        label="Fill"
        placeholder="Background"
        value={tab}
        onChange={handleBackgroundTabChange}
      />
      <SettingsTabPanel activeKey={tab}>
        {tab === "Shader" ? (
          <>
            <PaperShaderPreviewRow
              selected={paperShader.shaderId}
              onSelect={(shaderId) =>
                onBackgroundSettingsChange({
                  paperShader: createDefaultCanvasCardPaperShader(shaderId),
                })
              }
            />
            <SettingsPaperShaderControls
              paperShader={paperShader}
              onPaperShaderChange={(nextPaperShader) =>
                onBackgroundSettingsChange({ paperShader: nextPaperShader })
              }
            />
          </>
        ) : tab === "Image" ? (
          <WallpaperPreviewRow
            selectedPath={actualImageSettings.remoteUrl ?? ""}
            onClear={() => onImageSettingsChange({ remoteUrl: "", sourceMode: "upload" })}
            onSelect={(imagePath) =>
              onImageSettingsChange({ remoteUrl: imagePath, sourceMode: "url" })
            }
            onUpload={(imageUrl) =>
              onImageSettingsChange({ remoteUrl: imageUrl, sourceMode: "upload" })
            }
          />
        ) : (
          <FillModePresetControls
            mode={tab}
            value={backgroundFill}
            applyFill={(fill) => onShapeSettingsChange(applyCardFill(fill))}
          />
        )}
      </SettingsTabPanel>
    </div>
  );
}
