import { useContext } from "react";

import type { InspectorModel } from "@/features/shell/hooks/use-toolbar-inspector-model";
import {
  QR_STYLE_PART_DEFINITIONS,
  type QrStylePartId,
} from "@/features/shell/inspector/qr-style-parts";
import { SETTINGS_PREVIEW_TILE } from "@/features/shell/inspector/SettingsPreviewTiles";
import { SegmentTabs } from "@/features/shell/inspector/settings-ui";
import { QrStyleOptionPreview } from "@/features/qr/components/QrStyleOptionPreview";
import { cn } from "@/lib/utils";

import {
  MobileRailPartContext,
  type MobileRailOption,
  type MobileRailRowProps,
} from "../rail-context";

/** QR style parts, mirroring the `Part` control in the Style section. */
const QR_STYLE_PART_OPTIONS: MobileRailOption[] = [
  { id: "Module", label: "Module", drillsTo: "Module" },
  { id: "Eye", label: "Eye", drillsTo: "Eye" },
  { id: "Frame", label: "Frame", drillsTo: "Frame" },
  { id: "Logo", label: "Logo" },
];

/**
 * Second drill level: the style catalogue for one part, rendered in place of
 * the part row. Picking a tile applies it straight to the QR, so the rail stays
 * a quick-pick surface and the drawer is only needed for the long tail.
 */
function QrStylePartOptions({ model, partId }: { model: InspectorModel; partId: QrStylePartId }) {
  const part = QR_STYLE_PART_DEFINITIONS[partId];
  const selected = part.readSelected(model);

  return part.options.map((option) => (
    <button
      key={option.value}
      aria-label={option.label}
      aria-pressed={selected === option.value}
      className={cn(SETTINGS_PREVIEW_TILE, "text-center")}
      data-slot="mobile-rail-style-option"
      title={option.label}
      type="button"
      onClick={() => part.applySelected(model, option.value)}
    >
      <span
        aria-hidden="true"
        className="grid size-full place-items-center overflow-hidden p-0.5 dn-squircle-xs"
      >
        <QrStyleOptionPreview
          className="size-full max-h-full max-w-full"
          previewKind={part.previewKind}
          value={option.value}
        />
      </span>
    </button>
  ));
}

/** Style family row: the selected part's catalogue sits above the tabs. */
export function MobileQrRailRow({ model }: MobileRailRowProps) {
  const part = useContext(MobileRailPartContext)?.part ?? "Module";
  return <QrStylePartOptions model={model} partId={part} />;
}

/** Part tabs pinned under the catalogue — parts with a catalogue swap the
 *  row; Logo has none, so it keeps opening the drawer. */
export function MobileQrRailFooter({ openDrawer }: MobileRailRowProps) {
  const railPart = useContext(MobileRailPartContext);
  const part = railPart?.selectedPart ?? "Module";

  return (
    <div className="dn-mobile-settings-rail__tabs">
      <SegmentTabs
        className="dn-mobile-settings-rail__tabbar"
        items={QR_STYLE_PART_OPTIONS.map((option) => ({
          id: option.id,
          label: option.label,
        }))}
        value={part}
        onChange={(value) => {
          const option = QR_STYLE_PART_OPTIONS.find((entry) => entry.id === value);
          if (!option) {
            return;
          }
          if (option.drillsTo) {
            railPart?.selectPart(option.drillsTo);
            return;
          }
          openDrawer();
        }}
      />
    </div>
  );
}
