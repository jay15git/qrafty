import {
  findBrandIconById,
} from "@/features/qr-code/assets/brand-icons"
import { ICONSTACK_SELECTION_PREFIX } from "@/features/qr-code/assets/iconstack-api"

export function getLogoSelectionLabel(selectedId: string) {
  const brandIcon = findBrandIconById(selectedId)
  if (brandIcon) return brandIcon.label

  if (selectedId.startsWith(ICONSTACK_SELECTION_PREFIX)) {
    const rest = selectedId.slice(ICONSTACK_SELECTION_PREFIX.length)
    const separator = rest.indexOf(":")
    if (separator >= 0) {
      return rest
        .slice(separator + 1)
        .replace(/-/g, " ")
        .replace(/\b\w/g, (char) => char.toUpperCase())
    }
  }

  return "Choose logo"
}
