"use client";

import {
  SETTINGS_OPTION_TILE_BUTTON_CLASS,
  SETTINGS_OPTION_TILE_SCALE_PREVIEW_CLASS,
  SETTINGS_OPTION_TILE_SURFACE_CLASS,
} from "@/features/shell/components/settings-tokens";
import { SettingsAnimatedOptionGrid } from "@/features/shell/settings/SettingsOptionGrid";
import { settingsOptionGridItemClass } from "@/features/shell/settings/SettingsOptionGrid.classes";
import { SettingsOptionGridScrollArea } from "@/features/shell/settings/SettingsOptionGrid";
import { PaperShaderOptionPreview } from "@/features/canvas/components/PaperShaderOptionPreview";
import {
  getAllPaperShaderDefinitions,
  type PaperShaderId,
} from "@/features/canvas/rendering/paper-shader-definitions";
import { cn } from "@/lib/utils";

type PaperShaderOptionGridVariant = "settings" | "insert-desktop" | "insert-canvas";

type PaperShaderOptionGridProps = {
  columns?: 2 | 3;
  dataSlot?: string;
  onSelect: (shaderId: PaperShaderId) => void;
  scrollAreaDataSlot?: string;
  selectedShaderId?: PaperShaderId;
  shelfDataSlot?: string;
  variant: PaperShaderOptionGridVariant;
};

function SettingsPaperShaderOptionTile({
  label,
  onClick,
  selected,
  shaderId,
}: {
  label: string;
  onClick: () => void;
  selected: boolean;
  shaderId: PaperShaderId;
}) {
  return (
    <button
      aria-label={`Use ${label} shader`}
      aria-pressed={selected}
      data-animated-option-selection="true"
      data-option-interaction="scale"
      data-option-tile="true"
      data-desktop-preview-option="true"
      className={cn(
        "group relative aspect-square w-full min-w-0 p-0 text-center",
        settingsOptionGridItemClass("loose"),
        SETTINGS_OPTION_TILE_SURFACE_CLASS,
        SETTINGS_OPTION_TILE_BUTTON_CLASS,
        selected && "text-[var(--option-selected-fg)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        data-desktop-adaptive-option-preview="true"
        data-slot="style-preview-surface"
        className={cn(
          "relative z-10 size-full overflow-hidden rounded-md border-2 border-transparent bg-[var(--style-preview-tile-bg)] shadow-[var(--style-preview-inset)]",
          SETTINGS_OPTION_TILE_SCALE_PREVIEW_CLASS,
        )}
      >
        <PaperShaderOptionPreview isSelected={selected} shaderId={shaderId} />
      </span>
    </button>
  );
}

function InsertPaperShaderOptionTile({
  label,
  onClick,
  shaderId,
  variant,
}: {
  label: string;
  onClick: () => void;
  shaderId: PaperShaderId;
  variant: Exclude<PaperShaderOptionGridVariant, "settings">;
}) {
  const isInsertDesktop = variant === "insert-desktop";

  return (
    <button
      aria-label={`Use ${label} shader`}
      className={cn(
        "group relative aspect-square w-full min-w-0 p-0 transition",
        isInsertDesktop
          ? "rounded-lg hover:bg-[var(--control-hover)]"
          : "rounded-[7px] hover:bg-[var(--panel-bg-hover)]",
      )}
      type="button"
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        data-slot="paper-shader-insert-preview-surface"
        className={cn(
          "relative block size-full overflow-hidden rounded-md border-2 border-transparent shadow-[var(--style-preview-inset)]",
          isInsertDesktop ? "bg-[var(--bg)]" : "bg-[var(--control)]",
        )}
      >
        <PaperShaderOptionPreview shaderId={shaderId} />
      </span>
    </button>
  );
}

export function PaperShaderOptionGrid({
  columns = 3,
  dataSlot = "canvas-paper-shader-grid",
  onSelect,
  scrollAreaDataSlot = "canvas-paper-shader-grid-scroll-area",
  selectedShaderId,
  shelfDataSlot = "canvas-paper-shader-grid-shelf",
  variant,
}: PaperShaderOptionGridProps) {
  const shaders = getAllPaperShaderDefinitions();

  if (variant === "settings") {
    if (!selectedShaderId) {
      throw new Error("PaperShaderOptionGrid settings variant requires selectedShaderId");
    }

    return (
      <SettingsOptionGridScrollArea
        ariaLabel="Paper shaders"
        columns={columns}
        dataSlot={scrollAreaDataSlot}
        shelfDataSlot={shelfDataSlot}
        variant="preset"
      >
        <SettingsAnimatedOptionGrid
          columns={columns}
          data-slot={dataSlot}
          selectedKey={selectedShaderId}
        >
          {shaders.map((shader) => (
            <SettingsPaperShaderOptionTile
              key={shader.id}
              label={shader.label}
              selected={selectedShaderId === shader.id}
              shaderId={shader.id}
              onClick={() => onSelect(shader.id)}
            />
          ))}
        </SettingsAnimatedOptionGrid>
      </SettingsOptionGridScrollArea>
    );
  }

  return (
    <div
      aria-label="Shader options"
      className={cn(
        "grid max-h-72 grid-cols-3 gap-1 overflow-y-auto p-1",
        variant === "insert-desktop"
          ? "ds-squircle-sm border border-[var(--line)] bg-[var(--control)] p-1"
          : undefined,
      )}
      data-slot={dataSlot}
      role="group"
    >
      {shaders.map((shader) => (
        <InsertPaperShaderOptionTile
          key={shader.id}
          label={shader.label}
          shaderId={shader.id}
          variant={variant}
          onClick={() => onSelect(shader.id)}
        />
      ))}
    </div>
  );
}
