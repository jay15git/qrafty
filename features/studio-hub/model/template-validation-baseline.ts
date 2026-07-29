import type { TemplateIssueCode } from "@/features/workspace/model/validate-template"

/** Templates that must be completely clean — no errors, no warnings. */
export const STRICT_TEMPLATE_IDS: string[] = [
  "authored-paris-ticket",
  "authored-amsterdam-label",
  "authored-members-seal",
]

/**
 * Issue codes each legacy template is currently allowed to produce.
 * Shrink this as templates are re-authored; delete it once every id is strict.
 */
export const KNOWN_ISSUE_CODES: Record<string, TemplateIssueCode[]> = {
  "social-mint-cta": ["contrast-too-low"],
  "social-studio-index": ["contrast-too-low", "qr-too-small"],
  "social-editorial-link": ["bounds-overflow", "contrast-too-low", "qr-too-small"],
}
