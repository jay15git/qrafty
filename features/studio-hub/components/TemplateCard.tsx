"use client"

import {
  DESKTOP_INSPECTOR_FG_PRIMARY,
} from "@/features/desktop-shell/components/InspectorControls"
import { QrDocumentPreview } from "@/features/qr-code/components/QrDocumentPreview"
import { HUB_CARD_DOCUMENT_PREVIEW_OPTIONS } from "@/features/qr-code/rendering/document-preview"
import { HUB_CARD_SURFACE } from "@/features/studio-hub/components/hub-surfaces"
import {
  buildSocialCardTemplateDocument,
  SOCIAL_CARD_TEMPLATE_BUILDERS,
} from "@/features/studio-hub/model/social-card-templates"
import type { QrDesignTemplate } from "@/features/studio-hub/model/templates"
import { cn } from "@/lib/utils"

type TemplateCardProps = {
  template: QrDesignTemplate
  onUse: (template: QrDesignTemplate) => void
}

export function TemplateCard({ template, onUse }: TemplateCardProps) {
  const previewDocument =
    template.id in SOCIAL_CARD_TEMPLATE_BUILDERS
      ? buildSocialCardTemplateDocument(
          template.id as keyof typeof SOCIAL_CARD_TEMPLATE_BUILDERS,
        )
      : template.document

  return (
    <button
      type="button"
      data-slot="template-card"
      className="group flex w-full flex-col gap-2.5 text-left outline-none transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[var(--desktop-inspector-focus)]"
      onClick={() => onUse(template)}
    >
      <div className={cn("relative aspect-square w-full overflow-hidden p-3", HUB_CARD_SURFACE)}>
        <QrDocumentPreview
          document={previewDocument}
          previewOptions={HUB_CARD_DOCUMENT_PREVIEW_OPTIONS}
          className="transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <span className={cn("truncate px-0.5 text-sm font-medium", DESKTOP_INSPECTOR_FG_PRIMARY)}>
        {template.title}
      </span>
    </button>
  )
}
