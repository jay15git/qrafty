"use client";

import "./settings.css";

export {
  SettingsPopoverChrome,
  SettingsPopoverCloseButton,
} from "@/features/shell/settings/settings-ui/PopoverChrome";
export {
  SettingsAccordion,
  SettingsPanelShell,
  SettingsScroll,
  SettingsTabPanel,
} from "@/features/shell/settings/settings-ui/Panel";
export {
  ContentTypeBrowser,
  QrColorPartBrowser,
  SettingsLabeledSelect,
  // fallow-ignore-next-line unused-type
  type QrColorPartOption,
} from "@/features/shell/settings/settings-ui/Select";
export { OptionScrollRow, PresetList } from "@/features/shell/settings/settings-ui/OptionRows";
export {
  SettingsInlineSlider,
  SettingsInput,
  SettingsPrimaryButton,
  SettingsSlider,
  SettingsSwitchRow,
} from "@/features/shell/settings/settings-ui/Controls";
export {
  SettingsFillPopover,
  SettingsFillPresetSection,
} from "@/features/shell/settings/settings-ui/FillPopover";
export {
  SettingsAccordionColorPicker,
  SettingsTilePopover,
} from "@/features/shell/settings/settings-ui/TilePopover";
export { SettingsRowPopover } from "@/features/shell/settings/settings-ui/RowPopover";
export { SegmentTabs } from "@/features/shell/settings/SettingsSegmentTabs";
