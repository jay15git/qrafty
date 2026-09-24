"use client";

import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";
import { ElementsSection } from "@/features/shell/settings/ElementsSection";
import { CardSection } from "@/features/shell/settings/sections/CardSection";
import { ContentSection } from "@/features/shell/settings/sections/ContentSection";
import { MotionSection } from "@/features/shell/settings/sections/MotionSection";
import { QrColorSection } from "@/features/shell/settings/sections/QrColorSection";
import { QrStyleSection } from "@/features/shell/settings/sections/QrStyleSection";
import { SceneSection } from "@/features/shell/settings/sections/SceneSection";
import { ScrollPersistScope } from "@/lib/persisted-element-scroll";

export function SettingsSectionBody({
  id,
  model,
  hideContentTypeBrowser = false,
}: {
  id: string;
  model: SettingsModel;
  hideContentTypeBrowser?: boolean;
}) {
  let body = null;
  switch (id) {
    case "Content":
      body = <ContentSection hideContentTypeBrowser={hideContentTypeBrowser} model={model} />;
      break;
    case "QR":
      body = <QrStyleSection model={model} />;
      break;
    case "Color":
      body = <QrColorSection model={model} />;
      break;
    case "Shape":
      body = <CardSection model={model} />;
      break;
    case "Background":
      body = <SceneSection model={model} />;
      break;
    case "Motion":
      body = <MotionSection model={model} />;
      break;
    case "Elements":
      body = <ElementsSection model={model} />;
      break;
    default:
      body = null;
  }

  return <ScrollPersistScope id={`settings:${id}`}>{body}</ScrollPersistScope>;
}
