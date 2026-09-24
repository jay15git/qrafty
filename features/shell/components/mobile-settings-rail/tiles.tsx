import { Pipette } from "lucide-react";
import { Suspense } from "react";

import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import {
  SETTINGS_FILL_OPTION_TILE,
  SETTINGS_FILL_OPTION_TILE_INNER,
  SETTINGS_PREVIEW_TILE,
} from "@/features/shell/settings/SettingsPreviewTiles";
import {
  getSettingsSectionLabel,
  type SettingsSectionId,
} from "@/features/shell/settings/settings-panel-meta";
import { SettingsSectionIconFor } from "@/features/shell/settings/SettingsSectionIcons";
import { useMobileDrawerNavigation } from "@/features/shell/settings/MobileDrawerNavigationContext";
import { SCENE_WALLPAPERS } from "@/features/canvas/assets/scene-wallpapers";
import { WallpaperOptionPreview } from "@/features/canvas/components/WallpaperOptionPreview";
import { cn } from "@/lib/utils";

import { LazyLayersPopoverContent, LazySettingsImageUploadTile } from "./lazy-details";
import { useLatestModel, type MobileRailOption } from "./rail-context";

export function MobileRailSwatchTile({
  ariaLabel,
  fill,
  onSelect,
  selected,
}: {
  ariaLabel: string;
  fill: string;
  onSelect: () => void;
  selected: boolean;
}) {
  return (
    <button
      aria-label={ariaLabel}
      aria-pressed={selected}
      className={SETTINGS_FILL_OPTION_TILE}
      data-slot="mobile-rail-option"
      title={ariaLabel}
      type="button"
      onClick={onSelect}
    >
      <span aria-hidden="true" className={SETTINGS_FILL_OPTION_TILE_INNER}>
        <span className="size-full ds-squircle-xs" style={{ background: fill }} />
      </span>
    </button>
  );
}

/** Picker-symbol tile — mirrors the `+` tile in `SettingsFillOptionGrid`. */
export function MobileRailPickerTile({
  ariaLabel,
  customFill,
  onOpen,
}: {
  ariaLabel: string;
  /** Active custom value; shown behind the pipette when the fill isn't a preset. */
  customFill?: string;
  onOpen: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={SETTINGS_FILL_OPTION_TILE}
      data-slot="mobile-rail-option"
      title={ariaLabel}
      type="button"
      onClick={onOpen}
    >
      <span aria-hidden="true" className={SETTINGS_FILL_OPTION_TILE_INNER}>
        <span
          className="grid size-full place-items-center ds-squircle-xs"
          style={customFill ? { background: customFill } : undefined}
        >
          <span
            className={cn(
              "grid place-items-center text-[var(--fg)]",
              customFill
                ? "size-5 rounded-full bg-[color-mix(in_srgb,var(--bg)_88%,transparent)]"
                : "size-full bg-[color-mix(in_srgb,var(--muted)_40%,transparent)] ds-squircle-xs",
            )}
          >
            <Pipette className="size-4" strokeWidth={2.5} />
          </span>
        </span>
      </span>
    </button>
  );
}

export function MobileRailPill({
  label,
  onClick,
  pressed,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
}) {
  return (
    <button
      aria-pressed={pressed}
      className="ds-mobile-settings-rail__item ds-mobile-settings-rail__item--pill"
      type="button"
      onClick={onClick}
    >
      <span className="ds-mobile-settings-rail__pill">{label}</span>
    </button>
  );
}

/** Wallpaper + upload tiles for image fills — shared by Color and Background. */
export function MobileRailImageOptions({
  imageUrl,
  onClear,
  onSelect,
  onUpload,
}: {
  imageUrl: string;
  onClear: () => void;
  onSelect: (imagePath: string) => void;
  onUpload: (imageUrl: string) => void;
}) {
  const customImageUrl =
    imageUrl && !SCENE_WALLPAPERS.some((w) => w.path === imageUrl) ? imageUrl : "";

  return (
    <>
      <Suspense fallback={null}>
        <LazySettingsImageUploadTile
          className="ds-mobile-settings-rail__upload-tile"
          imageUrl={customImageUrl}
          onClear={onClear}
          onUpload={onUpload}
        />
      </Suspense>
      {SCENE_WALLPAPERS.map((wallpaper) => (
        <button
          key={wallpaper.id}
          aria-label={`Use ${wallpaper.label} image`}
          aria-pressed={imageUrl === wallpaper.path}
          className={cn(SETTINGS_PREVIEW_TILE)}
          data-slot="mobile-rail-option"
          title={wallpaper.label}
          type="button"
          onClick={() => onSelect(wallpaper.path)}
        >
          <WallpaperOptionPreview
            alt={wallpaper.label}
            className="relative z-10 block size-full overflow-hidden ds-squircle-xs"
            previewPath={wallpaper.previewPath}
          />
        </button>
      ))}
    </>
  );
}

export function MobileRailOptionButton({
  option,
  onClick,
}: {
  option: MobileRailOption;
  onClick: () => void;
}) {
  return (
    <button
      className={
        option.shape === "pill"
          ? "ds-mobile-settings-rail__item ds-mobile-settings-rail__item--pill"
          : "ds-mobile-settings-rail__item"
      }
      type="button"
      onClick={onClick}
    >
      {option.shape === "pill" ? (
        <span className="ds-mobile-settings-rail__pill">{option.label}</span>
      ) : (
        <>
          <span className="ds-mobile-settings-rail__circle">{option.icon}</span>
          <span className="ds-mobile-settings-rail__label">{option.label}</span>
        </>
      )}
    </button>
  );
}

/** Elements family button: opens the drawer straight onto the Layers detail —
 *  no intermediate rail row. */
export function MobileElementsSectionButton({
  model,
  onOpenSection,
}: {
  model: SettingsModel;
  onOpenSection: () => void;
}) {
  const navigation = useMobileDrawerNavigation();
  const modelRef = useLatestModel(model);

  const handleClick = () => {
    onOpenSection();
    navigation?.openDetail({
      title: "Layers",
      content: (
        <Suspense fallback={null}>
          <LazyLayersPopoverContent
            embedded
            canDeleteLayer={modelRef.current.controller?.canDeleteLayer}
            layersSettings={modelRef.current.actualLayersSettings}
            onLayerDelete={modelRef.current.controller?.onLayerDelete}
            onLayersReorder={modelRef.current.onLayersReorder}
            onLayersSettingsChange={modelRef.current.onLayersSettingsChange}
          />
        </Suspense>
      ),
    });
  };

  return <MobileRailSectionButton section="Elements" onClick={handleClick} />;
}

export function MobileRailSectionButton({
  section,
  onClick,
}: {
  section: SettingsSectionId;
  onClick: () => void;
}) {
  return (
    <button className="ds-mobile-settings-rail__item" type="button" onClick={onClick}>
      <span className="ds-mobile-settings-rail__circle">
        <SettingsSectionIconFor
          className="ds-mobile-settings-rail__icon"
          section={section}
          size={22}
        />
      </span>
      <span className="ds-mobile-settings-rail__label">{getSettingsSectionLabel(section)}</span>
    </button>
  );
}
