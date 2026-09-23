import type { InspectorModel } from "@/features/shell/hooks/use-toolbar-inspector-model";
import type { SettingsSectionId } from "@/features/shell/inspector/settings-panel-meta";
import type { QrInputType } from "@/features/qr/content/input-options";
import type { PatternSettings, PatternSettingsPatch } from "@/features/shell/model/toolbar-types";

/**
 * State captured when a family opens. The corner cross restores it (discard);
 * the tick closes the family and keeps the live-applied edits (save).
 * Only the slices a family can touch are snapshotted.
 */
export type MobileFamilySnapshot = {
  contentType: QrInputType;
  contentValues: InspectorModel["actualContentValues"];
  pattern: PatternSettings;
  logo: InspectorModel["actualLogoSettings"];
  corners: InspectorModel["actualCornersSettings"];
  shape: InspectorModel["actualShapeSettings"];
  motion: InspectorModel["actualMotionSettings"];
  image: InspectorModel["actualImageSettings"];
  background: InspectorModel["actualBackgroundSettings"];
  layers: InspectorModel["actualLayersSettings"];
};

export function captureFamilySnapshot(model: InspectorModel): MobileFamilySnapshot {
  return {
    contentType: model.actualContentType,
    contentValues: model.actualContentValues,
    pattern: model.actualPatternSettings,
    logo: model.actualLogoSettings,
    corners: model.actualCornersSettings,
    shape: model.actualShapeSettings,
    motion: model.actualMotionSettings,
    image: model.actualImageSettings,
    background: model.actualBackgroundSettings,
    layers: model.actualLayersSettings,
  };
}

/**
 * The workspace patch setters infer fill mode from field *presence* —
 * `moduleFillImageUrl !== undefined` forces image mode, `cardFill` forces
 * solid, `remoteUrl: ""` forces paper-shader. A restore patch must therefore
 * only carry the fields of the mode that was actually active, or replaying
 * the snapshot stomps the mode and the QR/card reads as reset to defaults.
 */
function patternRestorePatch(p: PatternSettings): PatternSettingsPatch {
  const patch: PatternSettingsPatch = {
    qrDotType: p.qrDotType,
    moduleRoundSize: p.moduleRoundSize,
    moduleSize: p.moduleSize,
    moduleLineWidth: p.moduleLineWidth,
    gradientLinkMode: p.gradientLinkMode,
    dotsColorMode: p.dotsColorMode,
  };
  if (p.dotsColorMode === "solid") {
    patch.dotsSolidColor = p.dotsSolidColor;
  } else if (p.dotsColorMode === "gradient") {
    patch.dataModulesGradient = p.dataModulesGradient;
  } else if (p.dotsColorMode === "palette") {
    patch.dotsPalette = [...p.dotsPalette];
    patch.dotsPalettePreset = p.dotsPalettePreset;
  } else if (p.dotsColorMode === "image") {
    patch.moduleFillImageUrl = p.moduleFillImageUrl;
    patch.moduleFillImageSourceMode = p.moduleFillImageSourceMode;
  }
  return patch;
}

function cornersRestorePatch(
  c: InspectorModel["actualCornersSettings"],
): Partial<InspectorModel["actualCornersSettings"]> {
  return {
    cornerSquareType: c.cornerSquareType,
    cornerDotType: c.cornerDotType,
    cornerSquareColorMode: c.cornerSquareColorMode,
    ...(c.cornerSquareColorMode === "gradient"
      ? { cornerSquareGradient: c.cornerSquareGradient }
      : { cornerSquareSolidColor: c.cornerSquareSolidColor }),
    cornerDotColorMode: c.cornerDotColorMode,
    ...(c.cornerDotColorMode === "gradient"
      ? { cornerDotGradient: c.cornerDotGradient }
      : { cornerDotSolidColor: c.cornerDotSolidColor }),
  };
}

function logoRestorePatch(
  l: InspectorModel["actualLogoSettings"],
): Partial<InspectorModel["actualLogoSettings"]> {
  return l.colorMode === "gradient"
    ? { colorMode: "gradient", gradient: l.gradient }
    : { colorMode: "solid", solidColor: l.solidColor };
}

/** Shape rail edits: shape id, padding, and the shape's own fill — `cardFill`
 *  belongs to Background, and sending it would stomp styleMode to solid. */
function shapeRestorePatch(
  s: InspectorModel["actualShapeSettings"],
): Partial<InspectorModel["actualShapeSettings"]> {
  return {
    backgroundShapeId: s.backgroundShapeId,
    shapePadding: s.shapePadding,
    shapeColorMode: s.shapeColorMode,
    ...(s.shapeColorMode === "gradient"
      ? { shapeGradient: s.shapeGradient }
      : { shapeSolidColor: s.shapeSolidColor }),
  };
}

/** Replays the snapshotted slices for the discarded family. */
export function restoreFamilySnapshot(
  family: SettingsSectionId,
  snapshot: MobileFamilySnapshot,
  model: InspectorModel,
) {
  switch (family) {
    case "Content":
      model.onContentPasteApply(snapshot.contentType, snapshot.contentValues);
      break;
    case "QR":
    case "Color":
      if (model.onUnifiedQrFillSettingsChange) {
        model.onUnifiedQrFillSettingsChange({
          pattern: patternRestorePatch(snapshot.pattern),
          corners: cornersRestorePatch(snapshot.corners),
          logo: logoRestorePatch(snapshot.logo),
        });
      } else {
        model.onPatternSettingsChange(patternRestorePatch(snapshot.pattern));
        model.onCornersSettingsChange(cornersRestorePatch(snapshot.corners));
        model.onLogoSettingsChange(logoRestorePatch(snapshot.logo));
      }
      break;
    case "Motion":
      model.onMotionSettingsChange(snapshot.motion);
      break;
    case "Shape":
      model.onShapeSettingsChange(shapeRestorePatch(snapshot.shape));
      break;
    case "Background":
      // Order matters: the image setter forces paper-shader on empty url and
      // the shape setter forces solid on cardFill — the background write goes
      // last so the snapshotted styleMode wins.
      model.onImageSettingsChange({
        remoteUrl: snapshot.image.remoteUrl,
        sourceMode: snapshot.image.sourceMode,
        fit: snapshot.image.fit,
        opacity: snapshot.image.opacity,
      });
      model.onShapeSettingsChange({ cardFill: snapshot.shape.cardFill });
      model.onBackgroundSettingsChange(snapshot.background);
      break;
    case "Elements":
      model.onLayersSettingsChange(snapshot.layers);
      break;
  }
}
