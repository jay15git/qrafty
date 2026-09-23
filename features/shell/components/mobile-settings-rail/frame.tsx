import { Check, X } from "lucide-react"
import { useEffect, type ComponentType } from "react"

import type { InspectorModel } from "@/features/shell/hooks/use-toolbar-inspector-model"
import {
  SETTINGS_SECTIONS,
  getSettingsSectionLabel,
  type SettingsSectionId,
} from "@/features/shell/inspector/settings-panel-meta"
import { useMobileDrawerNavigation } from "@/features/shell/inspector/MobileDrawerNavigationContext"

import type { MobileRailOption, MobileRailRowProps } from "./rail-context"
import {
  MobileElementsSectionButton,
  MobileRailOptionButton,
  MobileRailSectionButton,
} from "./tiles"

/** Clears the pushed-detail stack once the host drawer is fully closed. */
export function MobileDrawerStackReset({ open }: { open: boolean }) {
  const navigation = useMobileDrawerNavigation()
  useEffect(() => {
    if (!open) {
      navigation?.clearDetails()
    }
  }, [navigation, open])
  return null
}

/** The swap row: family quick row, drilled options, or the section list. */
export function MobileRailRowContent({
  FamilyRow,
  model,
  onOpenDrawer,
  onOpenSection,
  onOptionClick,
  onToggleFamily,
  options,
  viewFamily,
}: {
  FamilyRow?: ComponentType<MobileRailRowProps>
  model: InspectorModel
  onOpenDrawer: () => void
  onOpenSection: (section: SettingsSectionId) => void
  onOptionClick: (option: MobileRailOption) => void
  onToggleFamily: (section: SettingsSectionId) => void
  options?: MobileRailOption[]
  viewFamily: SettingsSectionId | null
}) {
  if (FamilyRow && viewFamily) {
    return <FamilyRow model={model} openDrawer={onOpenDrawer} />
  }
  if (options) {
    return (
      <>
        {options.map((option) => (
          <MobileRailOptionButton
            key={option.id}
            option={option}
            onClick={() => onOptionClick(option)}
          />
        ))}
      </>
    )
  }
  return (
    <>
      {SETTINGS_SECTIONS.map((section) =>
        section === "Elements" ? (
          <MobileElementsSectionButton
            key={section}
            model={model}
            onOpenSection={() => onOpenSection(section)}
          />
        ) : (
          <MobileRailSectionButton
            key={section}
            section={section}
            onClick={() => onToggleFamily(section)}
          />
        ),
      )}
    </>
  )
}

export function MobileRailFamilyFooter({
  FamilyFooter,
  model,
  onOpenDrawer,
  viewFamily,
}: {
  FamilyFooter: ComponentType<MobileRailRowProps>
  model: InspectorModel
  onOpenDrawer: () => void
  viewFamily: SettingsSectionId
}) {
  return (
    <div
      aria-label={
        viewFamily === "QR"
          ? "QR parts"
          : viewFamily === "Shape"
            ? "Shape controls"
            : `${viewFamily} fill modes`
      }
      className="dn-mobile-settings-rail__subrow"
      role="group"
    >
      <FamilyFooter model={model} openDrawer={onOpenDrawer} />
    </div>
  )
}

export function MobileRailActions({
  onDiscard,
  onSave,
  viewFamily,
}: {
  onDiscard: () => void
  onSave: () => void
  viewFamily: SettingsSectionId | null
}) {
  return (
    <div className="dn-mobile-settings-rail__actions">
      <button
        aria-label="Discard changes"
        className="dn-mobile-settings-rail__action"
        type="button"
        onClick={onDiscard}
      >
        <X aria-hidden size={20} strokeWidth={2.25} />
      </button>
      {/* The open family's name sits centered between the corners. */}
      <span
        className="dn-mobile-settings-rail__family"
        data-slot="mobile-rail-family-label"
      >
        {viewFamily ? getSettingsSectionLabel(viewFamily) : null}
      </span>
      <button
        aria-label="Save changes"
        className="dn-mobile-settings-rail__action"
        type="button"
        onClick={onSave}
      >
        <Check aria-hidden size={20} strokeWidth={2.25} />
      </button>
    </div>
  )
}
