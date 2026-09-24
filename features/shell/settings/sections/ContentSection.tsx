"use client";

import { normalizeContentTypeForPicker } from "@/features/qr/content/input-options";
import { ContentFields } from "@/features/shell/settings/ContentFields";
import { SECTION_STACK } from "@/features/shell/settings/sections/shared";
import { ContentTypeBrowser, SettingsTabPanel } from "@/features/shell/settings/settings-ui";
import type { SettingsModel } from "@/features/shell/hooks/use-toolbar-settings-model";

export function ContentSection({
  model,
  hideContentTypeBrowser = false,
}: {
  model: SettingsModel;
  /** The mobile rail owns content-type choice, so the drawer drops the browser. */
  hideContentTypeBrowser?: boolean;
}) {
  const {
    actualContentType,
    actualContentValues,
    actualContentValidation,
    onContentPasteApply,
    onContentTypeChange,
    onContentValueChange,
  } = model;
  const normalizedContentType = normalizeContentTypeForPicker(actualContentType);

  return (
    <div className={SECTION_STACK}>
      {hideContentTypeBrowser ? null : (
        <ContentTypeBrowser selected={actualContentType} onSelect={onContentTypeChange} />
      )}
      <SettingsTabPanel activeKey={normalizedContentType}>
        <ContentFields
          contentType={actualContentType}
          contentValues={actualContentValues}
          validation={actualContentValidation}
          onContentPasteApply={onContentPasteApply}
          onContentValueChange={onContentValueChange}
        />
      </SettingsTabPanel>
    </div>
  );
}
